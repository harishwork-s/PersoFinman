import calendar
import os
from datetime import date, datetime
from uuid import uuid4

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename

from models import Autopay, Bill, Task, Warranty, db


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads", "invoices")
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}


def create_app():
    app = Flask(__name__)
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///" + os.path.join(BASE_DIR, "database.db")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

    CORS(app)
    db.init_app(app)
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    with app.app_context():
        db.create_all()

    @app.route("/")
    def health_check():
        return jsonify({"message": "PersoFinman API is running"})

    @app.route("/uploads/invoices/<path:filename>")
    def uploaded_invoice(filename):
        return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

    @app.route("/autopay", methods=["GET", "POST"])
    def autopay_collection():
        if request.method == "GET":
            items = Autopay.query.all()
            items.sort(key=lambda item: safe_date(item.date))
            return jsonify([autopay_to_dict(item) for item in items])

        data = request.get_json(silent=True) or {}
        error = validate_autopay(data)
        if error:
            return json_error(error)

        item = Autopay(
            name=data["name"].strip(),
            amount=float(data["amount"]),
            date=data["date"],
            payment_link=data["payment_link"].strip(),
            status=data.get("status", "unpaid"),
        )
        db.session.add(item)
        db.session.commit()
        return jsonify(autopay_to_dict(item)), 201

    @app.route("/autopay/<int:item_id>", methods=["PATCH", "DELETE"])
    def autopay_item(item_id):
        item = Autopay.query.get_or_404(item_id)
        if request.method == "DELETE":
            db.session.delete(item)
            db.session.commit()
            return jsonify({"message": "Autopay removed"})

        data = request.get_json(silent=True) or {}
        status = data.get("status")
        if status not in {"paid", "unpaid"}:
            return json_error("Status must be paid or unpaid")
        item.status = status
        db.session.commit()
        return jsonify(autopay_to_dict(item))

    @app.route("/bills", methods=["GET", "POST"])
    def bill_collection():
        if request.method == "GET":
            items = Bill.query.all()
            items.sort(key=lambda item: safe_date(item.due_date))
            return jsonify([bill_to_dict(item) for item in items])

        data = request.get_json(silent=True) or {}
        error = validate_bill(data)
        if error:
            return json_error(error)

        item = Bill(
            name=data["name"].strip(),
            amount=float(data["amount"]),
            due_date=data["due_date"],
            status=data.get("status", "unpaid"),
        )
        db.session.add(item)
        db.session.commit()
        return jsonify(bill_to_dict(item)), 201

    @app.route("/bills/<int:item_id>", methods=["PATCH", "DELETE"])
    def bill_item(item_id):
        item = Bill.query.get_or_404(item_id)
        if request.method == "DELETE":
            db.session.delete(item)
            db.session.commit()
            return jsonify({"message": "Bill removed"})

        data = request.get_json(silent=True) or {}
        status = data.get("status")
        if status not in {"paid", "unpaid"}:
            return json_error("Status must be paid or unpaid")
        item.status = status
        db.session.commit()
        return jsonify(bill_to_dict(item))

    @app.route("/tasks", methods=["GET", "POST"])
    def task_collection():
        if request.method == "GET":
            items = Task.query.all()
            items.sort(key=lambda item: safe_date(item.due_date))
            return jsonify([task_to_dict(item) for item in items])

        data = request.get_json(silent=True) or {}
        error = validate_task(data)
        if error:
            return json_error(error)

        item = Task(
            name=data["name"].strip(),
            amount=float(data["amount"]),
            due_date=data["due_date"],
            status=data.get("status", "pending"),
        )
        db.session.add(item)
        db.session.commit()
        return jsonify(task_to_dict(item)), 201

    @app.route("/tasks/<int:item_id>", methods=["PATCH", "DELETE"])
    def task_item(item_id):
        item = Task.query.get_or_404(item_id)
        if request.method == "DELETE":
            db.session.delete(item)
            db.session.commit()
            return jsonify({"message": "Task removed"})

        data = request.get_json(silent=True) or {}
        status = data.get("status")
        if status not in {"completed", "pending"}:
            return json_error("Status must be completed or pending")
        item.status = status
        db.session.commit()
        return jsonify(task_to_dict(item))

    @app.route("/warranty", methods=["GET", "POST"])
    def warranty_collection():
        if request.method == "GET":
            items = Warranty.query.all()
            items.sort(key=lambda item: warranty_expiry(item.purchase_date, item.warranty_months))
            return jsonify([warranty_to_dict(item) for item in items])

        form_data = {
            "name": request.form.get("name", ""),
            "purchase_date": request.form.get("purchase_date", ""),
            "warranty_months": request.form.get("warranty_months", ""),
        }
        invoice_image = request.files.get("invoice_image")
        error = validate_warranty(form_data, invoice_image)
        if error:
            return json_error(error)

        image_path = save_invoice_image(invoice_image) if invoice_image else None
        item = Warranty(
            name=form_data["name"].strip(),
            purchase_date=form_data["purchase_date"],
            warranty_months=int(form_data["warranty_months"]),
            invoice_image_path=image_path,
        )
        db.session.add(item)
        db.session.commit()
        return jsonify(warranty_to_dict(item)), 201

    @app.route("/warranty/<int:item_id>", methods=["DELETE"])
    def warranty_item(item_id):
        item = Warranty.query.get_or_404(item_id)
        remove_invoice_file(item.invoice_image_path)
        db.session.delete(item)
        db.session.commit()
        return jsonify({"message": "Warranty removed"})

    return app


def json_error(message, status_code=400):
    return jsonify({"error": message}), status_code


def required_text(data, key, label):
    value = data.get(key)
    if not value or not str(value).strip():
        return f"{label} is required"
    return None


def validate_amount(data):
    try:
        amount = float(data.get("amount", ""))
    except (TypeError, ValueError):
        return "Amount must be a number"
    if amount <= 0:
        return "Amount must be greater than 0"
    return None


def validate_date_value(value, label):
    try:
        datetime.strptime(value, "%Y-%m-%d").date()
    except (TypeError, ValueError):
        return f"{label} must use YYYY-MM-DD"
    return None


def validate_autopay(data):
    for key, label in [("name", "Name"), ("date", "Date"), ("payment_link", "Payment link")]:
        error = required_text(data, key, label)
        if error:
            return error
    error = validate_amount(data) or validate_date_value(data["date"], "Date")
    if error:
        return error
    if not data["payment_link"].startswith(("http://", "https://")):
        return "Payment link must start with http:// or https://"
    if data.get("status", "unpaid") not in {"paid", "unpaid"}:
        return "Status must be paid or unpaid"
    return None


def validate_bill(data):
    for key, label in [("name", "Name"), ("due_date", "Due date")]:
        error = required_text(data, key, label)
        if error:
            return error
    error = validate_amount(data) or validate_date_value(data["due_date"], "Due date")
    if error:
        return error
    if data.get("status", "unpaid") not in {"paid", "unpaid"}:
        return "Status must be paid or unpaid"
    return None


def validate_task(data):
    for key, label in [("name", "Name"), ("due_date", "Due date")]:
        error = required_text(data, key, label)
        if error:
            return error
    error = validate_amount(data) or validate_date_value(data["due_date"], "Due date")
    if error:
        return error
    if data.get("status", "pending") not in {"completed", "pending"}:
        return "Status must be completed or pending"
    return None


def validate_warranty(data, invoice_image):
    for key, label in [("name", "Name"), ("purchase_date", "Purchase date"), ("warranty_months", "Warranty months")]:
        error = required_text(data, key, label)
        if error:
            return error
    error = validate_date_value(data["purchase_date"], "Purchase date")
    if error:
        return error
    try:
        months = int(data["warranty_months"])
    except (TypeError, ValueError):
        return "Warranty months must be a number"
    if months <= 0:
        return "Warranty months must be greater than 0"
    if not invoice_image:
        return "Invoice image is required"
    if invoice_image and not allowed_file(invoice_image.filename):
        return "Invoice image must be png, jpg, jpeg, or webp"
    return None


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def save_invoice_image(file_storage):
    filename = secure_filename(file_storage.filename)
    extension = filename.rsplit(".", 1)[1].lower()
    saved_name = f"{uuid4().hex}.{extension}"
    full_path = os.path.join(UPLOAD_FOLDER, saved_name)
    file_storage.save(full_path)
    return f"uploads/invoices/{saved_name}"


def remove_invoice_file(relative_path):
    if not relative_path:
        return
    full_path = os.path.join(BASE_DIR, relative_path)
    if os.path.exists(full_path):
        os.remove(full_path)


def parse_date(value):
    return datetime.strptime(value, "%Y-%m-%d").date()


def safe_date(value):
    try:
        return parse_date(value)
    except ValueError:
        return date.max


def due_info(value):
    item_date = safe_date(value)
    days = (item_date - date.today()).days
    return {
        "days_remaining": days,
        "is_due_soon": 0 <= days <= 7,
    }


def add_months(start_date, months):
    month_index = start_date.month - 1 + months
    year = start_date.year + month_index // 12
    month = month_index % 12 + 1
    last_day = calendar.monthrange(year, month)[1]
    day = min(start_date.day, last_day)
    return date(year, month, day)


def warranty_expiry(purchase_date, warranty_months):
    return add_months(safe_date(purchase_date), warranty_months)


def file_url(relative_path):
    if not relative_path:
        return None
    return request.host_url.rstrip("/") + "/" + relative_path.replace("\\", "/")


def autopay_to_dict(item):
    return {
        "id": item.id,
        "name": item.name,
        "amount": item.amount,
        "date": item.date,
        "payment_link": item.payment_link,
        "status": item.status,
        **due_info(item.date),
    }


def bill_to_dict(item):
    return {
        "id": item.id,
        "name": item.name,
        "amount": item.amount,
        "due_date": item.due_date,
        "status": item.status,
        **due_info(item.due_date),
    }


def task_to_dict(item):
    return {
        "id": item.id,
        "name": item.name,
        "amount": item.amount,
        "due_date": item.due_date,
        "status": item.status,
        **due_info(item.due_date),
    }


def warranty_to_dict(item):
    expiry = warranty_expiry(item.purchase_date, item.warranty_months)
    days = (expiry - date.today()).days
    return {
        "id": item.id,
        "name": item.name,
        "purchase_date": item.purchase_date,
        "warranty_months": item.warranty_months,
        "invoice_image_path": item.invoice_image_path,
        "invoice_image_url": file_url(item.invoice_image_path),
        "expiry_date": expiry.isoformat(),
        "days_remaining": days,
        "is_due_soon": 0 <= days <= 7,
    }


app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
