import { STORAGE_KEYS } from "./constants";
import { addDaysToDate, addMonthsToDate, calculateExpiryDate } from "./dateUtils";

export const ENABLE_DEMO_DATA = true;

const SAMPLE_INVOICE_URI =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAAA8CAYAAAB+Qux/AAAACXBIWXMAAAsTAAALEwEAmpwYAAABiklEQVR4nO2aS27DMAxE7QPZ5P+/uhcRNCC2HckFDSToaA8mDoXtD8nj8XgcAAAAAAAA4J6ZqKqCcRzrQnG6l3XB4kA3oQ0I7bZd9AWUzGwZY8LYyw3mZ9luwUPkB5RNB/xWfA8H5WwPQ3iL5UIIumG8AcHZp+3G1gkB1Lt0XOnT5fyIHT2eGx1E3gA2mVPQK12gI4IiVrIysGmJhV8q1duoH2cE+6dYcQUGc8wL9aZb3WAE5b8t2qI4A69uPcRG9cMAJqQ9N2ylzfdxBfHrABqURg0m7odgHlMFWQA9TYW49g0RifEzAE8w4u7vSKx5JgBfsTSm6KcIvATQA9R46mIXckcAEuQo0p0mUslfF7C/BaB31DFtycXNkLkDBxBAkEeQh5GHkQeRh5EHkYeRh5EHkYeRB5GHkQeRh5GHkQeRh5EHkYeRh5EHkQeRh5GHkYeRB5GHkQeRh5GHkQeRh5EHkYeRh5EHkQeRh5GHkQeRh5EHkQeRh5GHkYeRB5GHkYeRB5GHkQeRh5EHkQeRh5GHE4jlOwzCfBttbG9pAAAAAElFTkSuQmCC";

export function getDemoDataForKey(key) {
  if (!ENABLE_DEMO_DATA) return [];
  const now = new Date().toISOString();

  if (key === STORAGE_KEYS.autopay) {
    return [
      {
        id: "demo-autopay-amazon-prime",
        name: "Amazon Prime",
        amount: 699,
        date: addDaysToDate(2),
        frequency: "Monthly",
        paymentLink: "https://www.amazon.in/prime",
        paid: false,
        notificationIds: [],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "demo-autopay-mobile-recharge",
        name: "Mobile Recharge",
        amount: 299,
        date: addDaysToDate(5),
        frequency: "Monthly",
        paymentLink: "",
        paid: false,
        notificationIds: [],
        createdAt: now,
        updatedAt: now,
      },
    ];
  }

  if (key === STORAGE_KEYS.bills) {
    return [
      {
        id: "demo-bill-electricity",
        name: "Electricity Bill",
        amount: 1250,
        dueDate: addDaysToDate(3),
        paid: false,
        notificationIds: [],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "demo-bill-college-fees",
        name: "College Fees",
        amount: 3000,
        dueDate: addDaysToDate(6),
        paid: false,
        notificationIds: [],
        createdAt: now,
        updatedAt: now,
      },
    ];
  }

  if (key === STORAGE_KEYS.tasks) {
    return [
      {
        id: "demo-task-pay-eb",
        name: "Pay EB Bill",
        amount: 1250,
        dueDate: addDaysToDate(3),
        done: false,
        notificationIds: [],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "demo-task-cancel-subscription",
        name: "Cancel unused subscription",
        amount: 199,
        dueDate: addDaysToDate(4),
        done: false,
        notificationIds: [],
        createdAt: now,
        updatedAt: now,
      },
    ];
  }

  if (key === STORAGE_KEYS.warranty) {
    const samsungPurchaseDate = addMonthsToDate(addDaysToDate(5), -12);
    const voltasPurchaseDate = addMonthsToDate(addDaysToDate(6), -24);
    return [
      {
        id: "demo-warranty-samsung-refrigerator",
        name: "Samsung Refrigerator",
        purchaseDate: samsungPurchaseDate,
        warrantyMonths: 12,
        expiryDate: calculateExpiryDate(samsungPurchaseDate, 12),
        invoiceUri: SAMPLE_INVOICE_URI,
        notificationIds: [],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "demo-warranty-voltas-ac",
        name: "Voltas AC",
        purchaseDate: voltasPurchaseDate,
        warrantyMonths: 24,
        expiryDate: calculateExpiryDate(voltasPurchaseDate, 24),
        invoiceUri: SAMPLE_INVOICE_URI,
        notificationIds: [],
        createdAt: now,
        updatedAt: now,
      },
    ];
  }

  return [];
}
