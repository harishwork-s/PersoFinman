import * as Notifications from "expo-notifications";

import { calculateExpiryDate, parseLocalDate } from "./dateUtils";
import { formatCurrency } from "./format";

export function setupNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function requestNotificationPermission() {
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    const next = await Notifications.requestPermissionsAsync();
    return next.granted;
  } catch (error) {
    return false;
  }
}

export async function cancelItemNotifications(notificationIds = []) {
  await Promise.all(
    notificationIds.map((id) =>
      Notifications.cancelScheduledNotificationAsync(id).catch(() => null)
    )
  );
}

export async function scheduleItemNotifications(type, item) {
  const permissions = await Notifications.getPermissionsAsync();
  if (!permissions.granted) return [];
  const configs = getNotificationConfigs(type, item);
  const ids = [];
  for (const config of configs) {
    const trigger = buildTrigger(config.date, config.offsetDays);
    if (!trigger) continue;
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: config.title,
        body: config.body,
        sound: true,
      },
      trigger,
    });
    ids.push(id);
  }
  return ids;
}

function buildTrigger(dateValue, offsetDays) {
  const parsed = parseLocalDate(dateValue);
  if (!parsed) return null;
  const trigger = new Date(parsed);
  trigger.setDate(trigger.getDate() - offsetDays);
  trigger.setHours(9, 0, 0, 0);
  if (trigger <= new Date()) return null;
  return trigger;
}

function getNotificationConfigs(type, item) {
  if (type === "bill") {
    return [3, 1, 0].map((offsetDays) => ({
      date: item.dueDate,
      offsetDays,
      title: "Bill due soon",
      body: `${item.name} of ${formatCurrency(item.amount)} is due ${dueWords(offsetDays)}.`,
    }));
  }
  if (type === "autopay") {
    return [3, 1, 0].map((offsetDays) => ({
      date: item.date,
      offsetDays,
      title: "Subscription payment reminder",
      body: `${item.name} subscription of ${formatCurrency(item.amount)} is due ${dueWords(offsetDays)}.`,
    }));
  }
  if (type === "task") {
    return [1, 0].map((offsetDays) => ({
      date: item.dueDate,
      offsetDays,
      title: "Financial task reminder",
      body: `${item.name} is due ${dueWords(offsetDays)}.`,
    }));
  }
  const expiryDate = item.expiryDate || calculateExpiryDate(item.purchaseDate, item.warrantyMonths);
  return [7, 1, 0].map((offsetDays) => ({
    date: expiryDate,
    offsetDays,
    title: "Warranty expiring soon",
    body: `Warranty for ${item.name} expires ${dueWords(offsetDays)}.`,
  }));
}

function dueWords(offsetDays) {
  if (offsetDays === 0) return "today";
  if (offsetDays === 1) return "tomorrow";
  return `in ${offsetDays} days`;
}
