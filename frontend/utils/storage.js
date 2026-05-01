import AsyncStorage from "@react-native-async-storage/async-storage";

import { STORAGE_KEYS } from "./constants";

export async function loadCollection(key) {
  const raw = await AsyncStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

export async function saveCollection(key, items) {
  await AsyncStorage.setItem(key, JSON.stringify(items));
}

export async function loadAllData() {
  const [bills, autopay, tasks, warranty] = await Promise.all([
    loadCollection(STORAGE_KEYS.bills),
    loadCollection(STORAGE_KEYS.autopay),
    loadCollection(STORAGE_KEYS.tasks),
    loadCollection(STORAGE_KEYS.warranty),
  ]);
  return { bills, autopay, tasks, warranty };
}

export async function loadLanguage() {
  return (await AsyncStorage.getItem(STORAGE_KEYS.language)) || "en";
}

export async function saveLanguage(language) {
  await AsyncStorage.setItem(STORAGE_KEYS.language, language);
}
