import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";

import ActionButton from "../components/ActionButton";
import AppHeader from "../components/AppHeader";
import FormInput from "../components/FormInput";
import ProfileOptionItem from "../components/ProfileOptionItem";
import { COLORS } from "../utils/constants";
import { clearAppData, loadProfile, saveProfile } from "../utils/storage";
import { shareMonthlySummary } from "../utils/summary";

export default function ProfileScreen({ t, language, setLanguage, onClose }) {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(null);
  const [editing, setEditing] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    loadProfile().then((saved) => {
      setProfile(saved);
      setForm(saved);
    });
    refreshNotificationStatus();
  }, []);

  async function refreshNotificationStatus() {
    const permissions = await Notifications.getPermissionsAsync().catch(() => ({ granted: false }));
    setNotificationsEnabled(Boolean(permissions.granted));
  }

  function updateForm(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function saveProfileForm() {
    const nextProfile = {
      ...form,
      preferredLanguage: language === "ta" ? "Tamil" : "English",
    };
    setProfile(nextProfile);
    setForm(nextProfile);
    setEditing(false);
    await saveProfile(nextProfile);
  }

  async function toggleLanguage() {
    const nextLanguage = language === "en" ? "ta" : "en";
    await setLanguage(nextLanguage);
    const nextProfile = {
      ...(profile || form),
      preferredLanguage: nextLanguage === "ta" ? "Tamil" : "English",
    };
    setProfile(nextProfile);
    setForm(nextProfile);
    await saveProfile(nextProfile);
  }

  async function checkNotifications() {
    const current = await Notifications.getPermissionsAsync().catch(() => ({ granted: false }));
    if (!current.granted) {
      const next = await Notifications.requestPermissionsAsync().catch(() => ({ granted: false }));
      setNotificationsEnabled(Boolean(next.granted));
      return;
    }
    setNotificationsEnabled(true);
  }

  function showAbout() {
    Alert.alert(t.aboutPersoFinman, `${t.appName}\n${t.aboutMessage}\n${t.version}`);
  }

  function confirmClearData() {
    Alert.alert(t.clearDataTitle, t.clearDataMessage, [
      { text: t.cancel, style: "cancel" },
      {
        text: t.clearAllData,
        style: "destructive",
        onPress: async () => {
          await Notifications.cancelAllScheduledNotificationsAsync().catch(() => null);
          await clearAppData();
          const resetProfile = await loadProfile();
          setProfile(resetProfile);
          setForm(resetProfile);
          Alert.alert(t.dataCleared);
        },
      },
    ]);
  }

  if (!profile || !form) {
    return (
      <View style={styles.page}>
        <AppHeader title={t.profile} t={t} language={language} setLanguage={setLanguage} showProfileButton={false} />
        <Text style={styles.loading}>{t.loading}</Text>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <AppHeader title={t.profile} t={t} language={language} setLanguage={setLanguage} showProfileButton={false} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ActionButton label={t.cancel} icon="arrow-back-outline" variant="light" onPress={onClose} />

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person-outline" size={42} color={COLORS.primary} />
          </View>
          {editing ? (
            <View style={styles.form}>
              <FormInput label={t.fullName} value={form.name} onChangeText={(value) => updateForm("name", value)} />
              <FormInput label={t.email} value={form.email} onChangeText={(value) => updateForm("email", value)} />
              <FormInput label={t.phoneNumber} value={form.phone} onChangeText={(value) => updateForm("phone", value)} />
              <ActionButton label={t.update} icon="save-outline" onPress={saveProfileForm} />
            </View>
          ) : (
            <>
              <Text style={styles.name}>{profile.name}</Text>
              <InfoRow label={t.email} value={profile.email} />
              <InfoRow label={t.phoneNumber} value={profile.phone} />
              <InfoRow label={t.preferredLanguage} value={language === "ta" ? "Tamil" : "English"} />
              <InfoRow label={t.memberSince} value={profile.joinedDate} />
              <ActionButton label={t.edit} icon="create-outline" variant="light" onPress={() => setEditing(true)} />
            </>
          )}
        </View>

        <Text style={styles.sectionTitle}>{t.options}</Text>
        <View style={styles.options}>
          <ProfileOptionItem icon="language-outline" title={t.languageOption} value={language === "ta" ? "Tamil" : "English"} onPress={toggleLanguage} />
          <ProfileOptionItem icon="notifications-outline" title={t.notifications} value={notificationsEnabled ? t.enabled : t.disabled} onPress={checkNotifications} />
          <ProfileOptionItem icon="share-social-outline" title={t.shareMonthlySummary} onPress={() => shareMonthlySummary(t)} />
          <ProfileOptionItem icon="information-circle-outline" title={t.aboutPersoFinman} onPress={showAbout} />
          <ProfileOptionItem icon="trash-outline" title={t.clearAllData} danger onPress={confirmClearData} />
        </View>

        <View style={styles.logoutWrap}>
          <ActionButton label={t.logOut} icon="log-out-outline" variant="danger" onPress={() => Alert.alert(t.logOut, t.logoutMessage)} />
        </View>
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 96, gap: 14 },
  loading: { padding: 16, color: COLORS.muted, fontWeight: "700" },
  profileCard: { backgroundColor: COLORS.white, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, padding: 16, gap: 12 },
  avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: COLORS.primaryLight, alignItems: "center", justifyContent: "center", alignSelf: "center" },
  name: { color: COLORS.text, fontSize: 22, fontWeight: "900", textAlign: "center" },
  infoRow: { borderTopWidth: 1, borderTopColor: "#eef2f7", paddingTop: 10 },
  infoLabel: { color: COLORS.muted, fontSize: 13, fontWeight: "800" },
  infoValue: { color: COLORS.text, fontSize: 16, fontWeight: "800", marginTop: 2 },
  form: { gap: 10 },
  sectionTitle: { color: COLORS.text, fontSize: 20, fontWeight: "900", marginTop: 8 },
  options: { gap: 10 },
  logoutWrap: { marginTop: 18 },
});
