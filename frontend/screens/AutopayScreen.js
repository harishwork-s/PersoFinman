import React, { useCallback, useState } from "react";
import { Alert, Linking, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import ActionButton from "../components/ActionButton";
import AppHeader from "../components/AppHeader";


const blankForm = { name: "", amount: "", date: "", payment_link: "" };
const datePattern = /^\d{4}-\d{2}-\d{2}$/;


function money(value) {
  return `₹${Number(value || 0).toFixed(2)}`;
}


export default function AutopayScreen({ apiBaseUrl, t, language, setLanguage }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(blankForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadItems() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${apiBaseUrl}/autopay`);
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
    if (!form.name.trim() || !form.amount.trim() || !form.date.trim() || !form.payment_link.trim()) {
      Alert.alert(t.required);
      return false;
    }
    if (Number(form.amount) <= 0) {
      Alert.alert(t.invalidAmount);
      return false;
    }
    if (!datePattern.test(form.date)) {
      Alert.alert(t.invalidDate);
      return false;
    }
    if (!form.payment_link.startsWith("http://") && !form.payment_link.startsWith("https://")) {
      Alert.alert(t.invalidLink);
      return false;
    }
    return true;
  }

  async function addItem() {
    if (!validate()) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${apiBaseUrl}/autopay`, {
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
    await simpleRequest(`${apiBaseUrl}/autopay/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
  }

  async function deleteItem(item) {
    await simpleRequest(`${apiBaseUrl}/autopay/${item.id}`, { method: "DELETE" });
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

  const total = items.reduce((amount, item) => amount + Number(item.amount || 0), 0);

  return (
    <View style={styles.page}>
      <AppHeader title={t.autopay} t={t} language={language} setLanguage={setLanguage} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>{t.totalSubscriptions}</Text>
          <Text style={styles.totalAmount}>{money(total)}</Text>
        </View>

        <View style={styles.form}>
          <AppInput label={t.name} value={form.name} onChangeText={(value) => updateForm("name", value)} />
          <AppInput label={t.amount} value={form.amount} keyboardType="numeric" onChangeText={(value) => updateForm("amount", value)} />
          <AppInput label={`${t.date} (YYYY-MM-DD)`} value={form.date} onChangeText={(value) => updateForm("date", value)} />
          <AppInput label={t.paymentLink} value={form.payment_link} onChangeText={(value) => updateForm("payment_link", value)} />
          <ActionButton label={t.add} icon="add-outline" onPress={addItem} disabled={loading} />
        </View>

        {loading ? <Text style={styles.info}>{t.loading}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!loading && !items.length ? <Text style={styles.info}>{t.emptyAutopay}</Text> : null}

        {items.map((item) => (
          <View key={item.id} style={[styles.card, item.is_due_soon && styles.alertCard]}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardLine}>{money(item.amount)} · {item.date}</Text>
            <Text style={styles.status}>{item.status === "paid" ? t.paid : t.unpaid}</Text>
            <View style={styles.actions}>
              <ActionButton label={t.openLink} icon="open-outline" variant="light" onPress={() => Linking.openURL(item.payment_link)} />
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
  totalBox: { backgroundColor: "#ffffff", borderRadius: 8, padding: 16, borderWidth: 1, borderColor: "#e5e7eb" },
  totalLabel: { color: "#64748b", fontSize: 14, fontWeight: "800" },
  totalAmount: { color: "#176B87", fontSize: 30, fontWeight: "900", marginTop: 4 },
  form: { gap: 10 },
  input: { minHeight: 50, borderRadius: 8, backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#d8dee8", paddingHorizontal: 14, fontSize: 16 },
  card: { backgroundColor: "#ffffff", borderRadius: 8, padding: 14, gap: 8, borderWidth: 1, borderColor: "#e5e7eb" },
  alertCard: { borderColor: "#f59e0b", backgroundColor: "#fffaf0" },
  cardTitle: { color: "#111827", fontSize: 18, fontWeight: "900" },
  cardLine: { color: "#475569", fontSize: 15 },
  status: { color: "#176B87", fontSize: 14, fontWeight: "900" },
  actions: { gap: 8 },
  info: { color: "#475569", fontSize: 15, fontWeight: "700" },
  error: { color: "#b42318", fontSize: 15, fontWeight: "800" },
});
