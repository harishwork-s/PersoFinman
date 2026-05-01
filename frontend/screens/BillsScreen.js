import React, { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import ActionButton from "../components/ActionButton";
import AppHeader from "../components/AppHeader";


const blankForm = { name: "", amount: "", due_date: "" };
const datePattern = /^\d{4}-\d{2}-\d{2}$/;


function money(value) {
  return `₹${Number(value || 0).toFixed(2)}`;
}


export default function BillsScreen({ apiBaseUrl, t, language, setLanguage }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(blankForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadItems() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${apiBaseUrl}/bills`);
      if (!response.ok) throw new Error("API error");
      setItems(await response.json());
    } catch (err) {
      setError(t.apiError);
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [apiBaseUrl, language])
  );

  function updateForm(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function validate() {
    if (!form.name.trim() || !form.amount.trim() || !form.due_date.trim()) {
      Alert.alert(t.required);
      return false;
    }
    if (Number(form.amount) <= 0) {
      Alert.alert(t.invalidAmount);
      return false;
    }
    if (!datePattern.test(form.due_date)) {
      Alert.alert(t.invalidDate);
      return false;
    }
    return true;
  }

  async function addItem() {
    if (!validate()) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${apiBaseUrl}/bills`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: Number(form.amount), status: "unpaid" }),
      });
      if (!response.ok) throw new Error("API error");
      setForm(blankForm);
      await loadItems();
    } catch (err) {
      setError(t.apiError);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(item) {
    const nextStatus = item.status === "paid" ? "unpaid" : "paid";
    await simpleRequest(`${apiBaseUrl}/bills/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
  }

  async function deleteItem(item) {
    await simpleRequest(`${apiBaseUrl}/bills/${item.id}`, { method: "DELETE" });
  }

  async function simpleRequest(url, options) {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error("API error");
      await loadItems();
    } catch (err) {
      setError(t.apiError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.page}>
      <AppHeader title={t.bills} t={t} language={language} setLanguage={setLanguage} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.form}>
          <AppInput label={t.name} value={form.name} onChangeText={(value) => updateForm("name", value)} />
          <AppInput label={t.amount} value={form.amount} keyboardType="numeric" onChangeText={(value) => updateForm("amount", value)} />
          <AppInput label={`${t.dueDate} (YYYY-MM-DD)`} value={form.due_date} onChangeText={(value) => updateForm("due_date", value)} />
          <ActionButton label={t.add} icon="add-outline" onPress={addItem} disabled={loading} />
        </View>

        {loading ? <Text style={styles.info}>{t.loading}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!loading && !items.length ? <Text style={styles.info}>{t.emptyBills}</Text> : null}

        {items.map((item) => (
          <View key={item.id} style={[styles.card, item.is_due_soon && styles.alertCard]}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardLine}>{money(item.amount)} · {item.due_date}</Text>
            {item.is_due_soon ? <Text style={styles.alertText}>{t.dueSoon} · {item.days_remaining} {t.days}</Text> : null}
            <Text style={styles.status}>{item.status === "paid" ? t.paid : t.unpaid}</Text>
            <View style={styles.actions}>
              <ActionButton label={item.status === "paid" ? t.markUnpaid : t.markPaid} icon="checkmark-outline" variant="success" onPress={() => updateStatus(item)} />
              <ActionButton label={t.delete} icon="trash-outline" variant="danger" onPress={() => deleteItem(item)} />
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}


function AppInput({ label, ...props }) {
  return <TextInput style={styles.input} placeholder={label} placeholderTextColor="#64748b" {...props} />;
}


const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f7f9fc" },
  content: { padding: 16, gap: 14 },
  form: { gap: 10 },
  input: { minHeight: 50, borderRadius: 8, backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#d8dee8", paddingHorizontal: 14, fontSize: 16 },
  card: { backgroundColor: "#ffffff", borderRadius: 8, padding: 14, gap: 8, borderWidth: 1, borderColor: "#e5e7eb" },
  alertCard: { borderColor: "#f59e0b", backgroundColor: "#fffaf0" },
  cardTitle: { color: "#111827", fontSize: 18, fontWeight: "900" },
  cardLine: { color: "#475569", fontSize: 15 },
  alertText: { color: "#92400e", fontSize: 14, fontWeight: "900" },
  status: { color: "#176B87", fontSize: 14, fontWeight: "900" },
  actions: { gap: 8 },
  info: { color: "#475569", fontSize: 15, fontWeight: "700" },
  error: { color: "#b42318", fontSize: 15, fontWeight: "800" },
});
