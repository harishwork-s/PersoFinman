import React, { useCallback, useState } from "react";
import { Alert, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import ActionButton from "../components/ActionButton";
import AppHeader from "../components/AppHeader";
import FilterChips from "../components/FilterChips";
import FormInput from "../components/FormInput";
import SearchBar from "../components/SearchBar";
import { COLORS, FREQUENCIES, STORAGE_KEYS } from "../utils/constants";
import { confirmDelete } from "../utils/confirmDelete";
import { getDateStatus, getNextAutopayDate, isValidDate, sortByDate } from "../utils/dateUtils";
import { formatCurrency, createId } from "../utils/format";
import { cancelItemNotifications, scheduleItemNotifications } from "../utils/notifications";
import { matchesSearch } from "../utils/search";
import { loadCollection, saveCollection } from "../utils/storage";

const blankForm = { name: "", amount: "", date: "", paymentLink: "", frequency: "Monthly" };

export default function AutopayScreen({ t, language, setLanguage, onProfilePress }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(blankForm);
  const [editId, setEditId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadItems() {
    setLoading(true);
    setError("");
    try {
      const saved = await loadCollection(STORAGE_KEYS.autopay);
      setItems(sortByDate(saved.map(normalizeAutopay), "date"));
    } catch (err) {
      setError(t.storageError);
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [language])
  );

  function updateForm(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function validate() {
    if (!form.name.trim()) {
      Alert.alert(t.required);
      return false;
    }
    if (!Number.isFinite(Number(form.amount)) || Number(form.amount) <= 0) {
      Alert.alert(t.invalidAmount);
      return false;
    }
    if (!isValidDate(form.date)) {
      Alert.alert(t.invalidDate);
      return false;
    }
    if (form.paymentLink.trim() && !form.paymentLink.startsWith("http://") && !form.paymentLink.startsWith("https://")) {
      Alert.alert(t.invalidLink);
      return false;
    }
    return true;
  }

  async function saveItems(nextItems) {
    const sorted = sortByDate(nextItems, "date");
    setItems(sorted);
    await saveCollection(STORAGE_KEYS.autopay, sorted);
  }

  async function addOrUpdateItem() {
    if (!validate()) return;
    setLoading(true);
    setError("");
    try {
      const now = new Date().toISOString();
      if (editId) {
        const oldItem = items.find((item) => item.id === editId);
        await cancelItemNotifications(oldItem?.notificationIds);
        const updated = {
          ...oldItem,
          name: form.name.trim(),
          amount: Number(form.amount),
          date: form.date,
          frequency: form.frequency,
          paymentLink: form.paymentLink.trim(),
          updatedAt: now,
        };
        updated.notificationIds = updated.paid ? [] : await safeSchedule("autopay", updated);
        await saveItems(items.map((item) => (item.id === editId ? updated : item)));
      } else {
        const item = {
          id: createId("autopay"),
          name: form.name.trim(),
          amount: Number(form.amount),
          date: form.date,
          frequency: form.frequency,
          paymentLink: form.paymentLink.trim(),
          paid: false,
          notificationIds: [],
          createdAt: now,
          updatedAt: now,
        };
        item.notificationIds = await safeSchedule("autopay", item);
        await saveItems([...items, item]);
      }
      clearForm();
    } catch (err) {
      setError(t.storageError);
    } finally {
      setLoading(false);
    }
  }

  function startEdit(item) {
    setEditId(item.id);
    setForm({
      name: item.name,
      amount: String(item.amount),
      date: item.date,
      paymentLink: item.paymentLink || "",
      frequency: item.frequency || "Monthly",
    });
  }

  function clearForm() {
    setEditId(null);
    setForm(blankForm);
  }

  async function handlePaid(item) {
    setLoading(true);
    setError("");
    try {
      await cancelItemNotifications(item.notificationIds);
      let updated;
      if (item.frequency === "One-time") {
        updated = { ...item, paid: !item.paid, updatedAt: new Date().toISOString() };
        updated.notificationIds = updated.paid ? [] : await safeSchedule("autopay", updated);
      } else {
        updated = {
          ...item,
          date: getNextAutopayDate(item.date, item.frequency),
          paid: false,
          updatedAt: new Date().toISOString(),
        };
        updated.notificationIds = await safeSchedule("autopay", updated);
        Alert.alert(t.nextCycleScheduled);
      }
      await saveItems(items.map((current) => (current.id === item.id ? updated : current)));
    } catch (err) {
      setError(t.storageError);
    } finally {
      setLoading(false);
    }
  }

  async function deleteItem(item) {
    setLoading(true);
    setError("");
    try {
      await cancelItemNotifications(item.notificationIds);
      await saveItems(items.filter((current) => current.id !== item.id));
      if (editId === item.id) clearForm();
    } catch (err) {
      setError(t.storageError);
    } finally {
      setLoading(false);
    }
  }

  async function safeSchedule(type, item) {
    try {
      return await scheduleItemNotifications(type, item);
    } catch (err) {
      Alert.alert(t.notificationError);
      return [];
    }
  }

  const filters = [
    { key: "all", label: t.all },
    { key: "unpaid", label: t.unpaid },
    { key: "paid", label: t.paid },
    { key: "soon", label: t.dueSoonFilter },
    { key: "overdue", label: t.overdueFilter },
  ];
  const filteredItems = items.filter((item) => {
    const status = getDateStatus(item.date, item.paid, t, t.paid);
    if (filter === "unpaid") return !item.paid;
    if (filter === "paid") return item.paid;
    if (filter === "soon") return !item.paid && ["today", "soon"].includes(status.kind);
    if (filter === "overdue") return !item.paid && status.kind === "overdue";
    return true;
  });
  const visibleItems = filteredItems.filter((item) => matchesSearch(item, searchQuery));
  const emptyMessage = searchQuery.trim() ? t.noMatches : t.emptyAutopay;
  const total = items.reduce((amount, item) => amount + Number(item.amount || 0), 0);

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <AppHeader title={t.autopay} t={t} language={language} setLanguage={setLanguage} onProfilePress={onProfilePress} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder={t.searchAutopay} />
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>{t.autopay}</Text>
          <Text style={styles.totalAmount}>{formatCurrency(total)}</Text>
        </View>
        <View style={styles.form}>
          <FormInput label={t.name} value={form.name} onChangeText={(value) => updateForm("name", value)} />
          <FormInput label={t.amount} value={form.amount} keyboardType="numeric" onChangeText={(value) => updateForm("amount", value)} />
          <FormInput label={`${t.date} (YYYY-MM-DD)`} value={form.date} onChangeText={(value) => updateForm("date", value)} />
          <FormInput label={t.paymentLink} value={form.paymentLink} onChangeText={(value) => updateForm("paymentLink", value)} />
          <View style={styles.frequencyWrap}>
            {FREQUENCIES.map((frequency) => (
              <Pressable key={frequency} style={[styles.frequencyChip, form.frequency === frequency && styles.frequencyActive]} onPress={() => updateForm("frequency", frequency)}>
                <Text style={[styles.frequencyText, form.frequency === frequency && styles.frequencyActiveText]}>{frequency}</Text>
              </Pressable>
            ))}
          </View>
          <ActionButton label={editId ? t.update : t.add} icon={editId ? "save-outline" : "add-outline"} onPress={addOrUpdateItem} disabled={loading} />
          {editId ? <ActionButton label={t.cancel} icon="close-outline" variant="light" onPress={clearForm} /> : null}
        </View>
        <FilterChips filters={filters} activeFilter={filter} onChange={setFilter} />
        {loading ? <Text style={styles.info}>{t.loading}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!loading && !visibleItems.length ? <Text style={styles.info}>{emptyMessage}</Text> : null}
        {visibleItems.map((item) => {
          const status = getDateStatus(item.date, item.paid, t, t.paid);
          const hasPaymentLink = Boolean(item.paymentLink);
          return (
            <View key={item.id} style={[styles.card, ["soon", "today"].includes(status.kind) && styles.alertCard, status.kind === "overdue" && styles.overdueCard]}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardLine}>{formatCurrency(item.amount)} - {item.date}</Text>
              <Text style={styles.frequencyBadge}>{item.frequency}</Text>
              <Text style={[styles.status, status.kind === "overdue" && styles.dangerText]}>{status.text}</Text>
              <View style={styles.actions}>
                <ActionButton label={hasPaymentLink ? t.openLink : t.noPaymentLink} icon="open-outline" variant="light" disabled={!hasPaymentLink} onPress={() => hasPaymentLink && Linking.openURL(item.paymentLink)} />
                <ActionButton label={t.edit} icon="create-outline" variant="light" onPress={() => startEdit(item)} />
                <ActionButton label={item.frequency === "One-time" && item.paid ? t.markUnpaid : t.markPaid} icon="checkmark-outline" variant="success" onPress={() => handlePaid(item)} />
                <ActionButton label={t.delete} icon="trash-outline" variant="danger" onPress={() => confirmDelete(t, () => deleteItem(item))} />
              </View>
            </View>
          );
        })}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function normalizeAutopay(item) {
  return {
    id: item.id || createId("autopay"),
    name: item.name || "",
    amount: Number(item.amount || 0),
    date: item.date || "",
    frequency: item.frequency || "Monthly",
    paymentLink: item.paymentLink || item.payment_link || "",
    paid: Boolean(item.paid || item.status === "paid"),
    notificationIds: item.notificationIds || [],
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || new Date().toISOString(),
  };
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 96, gap: 14 },
  totalBox: { backgroundColor: COLORS.white, borderRadius: 8, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  totalLabel: { color: COLORS.muted, fontSize: 14, fontWeight: "800" },
  totalAmount: { color: COLORS.primary, fontSize: 30, fontWeight: "900", marginTop: 4 },
  form: { gap: 10 },
  frequencyWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  frequencyChip: { minHeight: 40, borderRadius: 8, paddingHorizontal: 12, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border },
  frequencyActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  frequencyText: { color: COLORS.muted, fontWeight: "800" },
  frequencyActiveText: { color: COLORS.white },
  card: { backgroundColor: COLORS.white, borderRadius: 8, padding: 14, gap: 8, borderWidth: 1, borderColor: COLORS.border },
  alertCard: { borderColor: "#f59e0b", backgroundColor: "#fffaf0" },
  overdueCard: { borderColor: COLORS.danger, backgroundColor: "#fff1f2" },
  cardTitle: { color: COLORS.text, fontSize: 18, fontWeight: "900" },
  cardLine: { color: COLORS.muted, fontSize: 15 },
  frequencyBadge: { alignSelf: "flex-start", color: COLORS.primary, backgroundColor: COLORS.primaryLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, fontWeight: "800" },
  status: { color: COLORS.primary, fontSize: 14, fontWeight: "900" },
  dangerText: { color: COLORS.danger },
  actions: { gap: 8 },
  info: { color: COLORS.muted, fontSize: 15, fontWeight: "700" },
  error: { color: COLORS.danger, fontSize: 15, fontWeight: "800" },
});
