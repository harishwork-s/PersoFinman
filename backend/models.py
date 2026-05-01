from flask_sqlalchemy import SQLAlchemy


db = SQLAlchemy()


class Autopay(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    date = db.Column(db.String(10), nullable=False)
    payment_link = db.Column(db.String(500), nullable=False)
    status = db.Column(db.String(20), nullable=False, default="unpaid")


class Bill(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    due_date = db.Column(db.String(10), nullable=False)
    status = db.Column(db.String(20), nullable=False, default="unpaid")


class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    due_date = db.Column(db.String(10), nullable=False)
    status = db.Column(db.String(20), nullable=False, default="pending")


class Warranty(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    purchase_date = db.Column(db.String(10), nullable=False)
    warranty_months = db.Column(db.Integer, nullable=False)
    invoice_image_path = db.Column(db.String(500), nullable=True)
