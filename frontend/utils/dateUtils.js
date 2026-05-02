const DAY_MS = 24 * 60 * 60 * 1000;

export function normalizeDate(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function parseLocalDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    return null;
  }
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }
  return parsed;
}

export function isValidDate(value) {
  return Boolean(parseLocalDate(value));
}

export function toDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDaysToDate(days, baseDate = new Date()) {
  const next = normalizeDate(baseDate);
  next.setDate(next.getDate() + days);
  return toDateInput(next);
}

export function daysUntil(value) {
  const parsed = parseLocalDate(value);
  if (!parsed) return null;
  return Math.round((normalizeDate(parsed) - normalizeDate(new Date())) / DAY_MS);
}

export function sortByDate(items, key) {
  return [...items].sort((a, b) => {
    const left = parseLocalDate(a[key]);
    const right = parseLocalDate(b[key]);
    if (!left && !right) return 0;
    if (!left) return 1;
    if (!right) return -1;
    return left - right;
  });
}

export function isCurrentMonth(value) {
  const parsed = parseLocalDate(value);
  const now = new Date();
  return Boolean(
    parsed &&
      parsed.getFullYear() === now.getFullYear() &&
      parsed.getMonth() === now.getMonth()
  );
}

export function calculateExpiryDate(purchaseDate, warrantyMonths) {
  const parsed = parseLocalDate(purchaseDate);
  const months = Number(warrantyMonths);
  if (!parsed || !Number.isFinite(months) || months <= 0) return "";
  const targetMonth = parsed.getMonth() + months;
  const expiry = new Date(parsed.getFullYear(), targetMonth, 1);
  const lastDay = new Date(expiry.getFullYear(), expiry.getMonth() + 1, 0).getDate();
  expiry.setDate(Math.min(parsed.getDate(), lastDay));
  return toDateInput(expiry);
}

export function addMonthsToDate(dateValue, monthsToAdd) {
  const parsed = parseLocalDate(dateValue);
  if (!parsed) return dateValue;
  const targetMonth = parsed.getMonth() + monthsToAdd;
  const next = new Date(parsed.getFullYear(), targetMonth, 1);
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(parsed.getDate(), lastDay));
  return toDateInput(next);
}

export function getNextAutopayDate(dateValue, frequency) {
  if (frequency === "Monthly") return addMonthsToDate(dateValue, 1);
  if (frequency === "Quarterly") return addMonthsToDate(dateValue, 3);
  if (frequency === "Yearly") return addMonthsToDate(dateValue, 12);
  return dateValue;
}

export function getDateStatus(dateValue, isComplete, t, completeText) {
  if (isComplete) {
    return { text: completeText, kind: "complete", days: 0 };
  }
  const days = daysUntil(dateValue);
  if (days === null) {
    return { text: t.invalidDate, kind: "invalid", days: 0 };
  }
  if (days === 0) {
    return { text: t.dueToday, kind: "today", days };
  }
  if (days > 0 && days <= 7) {
    return { text: `${t.dueSoon} · ${days} ${t.days}`, kind: "soon", days };
  }
  if (days < 0) {
    return { text: `${t.overdue} · ${Math.abs(days)} ${t.days}`, kind: "overdue", days };
  }
  return { text: `${t.upcoming} · ${days} ${t.days}`, kind: "upcoming", days };
}

export function getWarrantyStatus(item, t) {
  const expiryDate = item.expiryDate || calculateExpiryDate(item.purchaseDate, item.warrantyMonths);
  const days = daysUntil(expiryDate);
  if (days === null) {
    return { text: t.invalidDate, kind: "invalid", days: 0, expiryDate };
  }
  if (days < 0) {
    return {
      text: `${t.expired} · ${Math.abs(days)} ${t.daysAgo}`,
      kind: "expired",
      days,
      expiryDate,
    };
  }
  if (days === 0) {
    return { text: t.expiresToday, kind: "today", days, expiryDate };
  }
  if (days <= 7) {
    return {
      text: `${t.expiresSoon} · ${days} ${t.days}`,
      kind: "soon",
      days,
      expiryDate,
    };
  }
  return {
    text: `${t.active} · ${days} ${t.daysLeft}`,
    kind: "active",
    days,
    expiryDate,
  };
}

export function dueSoonOrOverdue(dateValue) {
  const days = daysUntil(dateValue);
  return days !== null && days <= 7;
}
