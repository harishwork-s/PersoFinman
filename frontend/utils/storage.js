import AsyncStorage from "@react-native-async-storage/async-storage";

import { DEFAULT_PROFILE, STORAGE_KEYS } from "./constants";

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

export async function loadProfile() {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.profile);
  if (raw) return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  await AsyncStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(DEFAULT_PROFILE));
  return DEFAULT_PROFILE;
}

export async function saveProfile(profile) {
  await AsyncStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile));
}

export async function clearAppData() {
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.bills,
    STORAGE_KEYS.autopay,
    STORAGE_KEYS.tasks,
    STORAGE_KEYS.warranty,
    STORAGE_KEYS.profile,
  ]);
}
