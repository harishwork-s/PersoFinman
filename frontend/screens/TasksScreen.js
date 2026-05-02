import React, { useCallback, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import ActionButton from "../components/ActionButton";
import AppHeader from "../components/AppHeader";
import FilterChips from "../components/FilterChips";
import FormModal from "../components/FormModal";
import FormInput from "../components/FormInput";
import SearchBar from "../components/SearchBar";
import StatusBadge from "../components/StatusBadge";
import { COLORS, RADIUS, SHADOW, STORAGE_KEYS } from "../utils/constants";
import { confirmDelete } from "../utils/confirmDelete";
import { getDateStatus, isValidDate, sortByDate } from "../utils/dateUtils";
import { formatCurrency, createId } from "../utils/format";
import { cancelItemNotifications, scheduleItemNotifications } from "../utils/notifications";
import { matchesSearch } from "../utils/search";
import { loadCollection, saveCollection } from "../utils/storage";

const blankForm = { name: "", amount: "", dueDate: "" };

export default function TasksScreen({ t, language, setLanguage, onProfilePress }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(blankForm);
  const [editId, setEditId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [formVisible, setFormVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadItems() {
    setLoading(true);
    setError("");
    try {
      const saved = await loadCollection(STORAGE_KEYS.tasks);
      setItems(sortByDate(saved.map(normalizeTask), "dueDate"));
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
    if (!isValidDate(form.dueDate)) {
      Alert.alert(t.invalidDueDate);
      return false;
    }
    return true;
  }

  async function saveItems(nextItems) {
    const sorted = sortByDate(nextItems, "dueDate");
    setItems(sorted);
    await saveCollection(STORAGE_KEYS.tasks, sorted);
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
        const updated = { ...oldItem, name: form.name.trim(), amount: Number(form.amount), dueDate: form.dueDate, updatedAt: now };
        updated.notificationIds = updated.done ? [] : await safeSchedule("task", updated);
        await saveItems(items.map((item) => (item.id === editId ? updated : item)));
      } else {
        const item = {
          id: createId("task"),
          name: form.name.trim(),
          amount: Number(form.amount),
          dueDate: form.dueDate,
          done: false,
          notificationIds: [],
          createdAt: now,
          updatedAt: now,
        };
        item.notificationIds = await safeSchedule("task", item);
        await saveItems([...items, item]);
      }
      clearForm();
      setFormVisible(false);
    } catch (err) {
      setError(t.storageError);
    } finally {
      setLoading(false);
    }
  }

  function startEdit(item) {
    setEditId(item.id);
    setForm({ name: item.name, amount: String(item.amount), dueDate: item.dueDate });
    setFormVisible(true);
  }

  function clearForm() {
    setEditId(null);
    setForm(blankForm);
  }

  function openAddForm() {
    clearForm();
    setFormVisible(true);
  }

  function closeForm() {
    clearForm();
    setFormVisible(false);
  }

  async function toggleDone(item) {
    setLoading(true);
    setError("");
    try {
      await cancelItemNotifications(item.notificationIds);
      const updated = { ...item, done: !item.done, updatedAt: new Date().toISOString() };
      updated.notificationIds = updated.done ? [] : await safeSchedule("task", updated);
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
    { key: "pending", label: t.pending },
    { key: "done", label: t.done },
    { key: "soon", label: t.dueSoonFilter },
    { key: "overdue", label: t.overdueFilter },
  ];
  const filteredItems = items.filter((item) => {
    const status = getDateStatus(item.dueDate, item.done, t, t.done);
    if (filter === "pending") return !item.done;
    if (filter === "done") return item.done;
    if (filter === "soon") return !item.done && ["today", "soon"].includes(status.kind);
    if (filter === "overdue") return !item.done && status.kind === "overdue";
    return true;
  });
  const visibleItems = filteredItems.filter((item) => matchesSearch(item, searchQuery));
  const emptyMessage = searchQuery.trim() ? t.noMatches : t.emptyTasks;

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <AppHeader title={t.tasks} t={t} language={language} setLanguage={setLanguage} onProfilePress={onProfilePress} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder={t.searchTasks} />
        <FilterChips filters={filters} activeFilter={filter} onChange={setFilter} />
        <ActionButton label={t.addTask} icon="add-outline" onPress={openAddForm} />
        {loading ? <Text style={styles.info}>{t.loading}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!loading && !visibleItems.length ? <Text style={styles.info}>{emptyMessage}</Text> : null}
        {visibleItems.map((item) => {
          const status = getDateStatus(item.dueDate, item.done, t, t.done);
          return (
            <View key={item.id} style={[styles.card, ["soon", "today"].includes(status.kind) && styles.alertCard, status.kind === "overdue" && styles.overdueCard]}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardLine}>{formatCurrency(item.amount)} - {item.dueDate}</Text>
              <StatusBadge text={status.text} kind={status.kind} />
              <View style={styles.actions}>
                <ActionButton label={t.edit} icon="create-outline" variant="light" onPress={() => startEdit(item)} />
                <ActionButton label={item.done ? t.markPending : t.markDone} icon="checkmark-outline" variant="success" onPress={() => toggleDone(item)} />
                <ActionButton label={t.delete} icon="trash-outline" variant="danger" onPress={() => confirmDelete(t, () => deleteItem(item))} />
              </View>
            </View>
          );
        })}
      </ScrollView>
      <FormModal
        visible={formVisible}
        title={editId ? t.update : t.addTask}
        closeLabel={t.close}
        onClose={closeForm}
      >
        <FormInput label={t.name} value={form.name} onChangeText={(value) => updateForm("name", value)} />
        <FormInput label={t.amount} value={form.amount} keyboardType="numeric" onChangeText={(value) => updateForm("amount", value)} />
        <FormInput label={`${t.dueDate} (YYYY-MM-DD)`} value={form.dueDate} onChangeText={(value) => updateForm("dueDate", value)} />
        <ActionButton label={editId ? t.update : t.add} icon={editId ? "save-outline" : "add-outline"} onPress={addOrUpdateItem} disabled={loading} />
        <ActionButton label={t.cancel} icon="close-outline" variant="neutral" onPress={closeForm} />
      </FormModal>
    </KeyboardAvoidingView>
  );
}

function normalizeTask(item) {
  return {
    id: item.id || createId("task"),
    name: item.name || "",
    amount: Number(item.amount || 0),
    dueDate: item.dueDate || item.due_date || "",
    done: Boolean(item.done || item.status === "completed"),
    notificationIds: item.notificationIds || [],
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || new Date().toISOString(),
  };
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 96, gap: 14 },
  form: { gap: 10 },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 16, gap: 10, borderWidth: 1, borderColor: COLORS.border, ...SHADOW.card },
  alertCard: { borderColor: COLORS.warning, backgroundColor: COLORS.warningLight },
  overdueCard: { borderColor: COLORS.danger, backgroundColor: COLORS.dangerLight },
  cardTitle: { color: COLORS.text, fontSize: 18, fontWeight: "900" },
  cardLine: { color: COLORS.muted, fontSize: 15 },
  actions: { gap: 8 },
  info: { color: COLORS.muted, fontSize: 15, fontWeight: "700" },
  error: { color: COLORS.danger, fontSize: 15, fontWeight: "800" },
});
