import React, { useCallback, useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";

import ActionButton from "../components/ActionButton";
import AppHeader from "../components/AppHeader";


const blankForm = { name: "", purchase_date: "", warranty_months: "" };
const datePattern = /^\d{4}-\d{2}-\d{2}$/;


export default function WarrantyScreen({ apiBaseUrl, t, language, setLanguage }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(blankForm);
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadItems() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${apiBaseUrl}/warranty`);
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

  async function chooseInvoice() {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(t.selectImageError);
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.7,
      });
      if (!result.canceled && result.assets?.length) {
        setInvoice(result.assets[0]);
      }
    } catch (err) {
      Alert.alert(t.selectImageError);
    }
  }

  function validate() {
    if (!form.name.trim() || !form.purchase_date.trim() || !form.warranty_months.trim()) {
      Alert.alert(t.required);
      return false;
    }
    if (Number(form.warranty_months) <= 0) {
      Alert.alert(t.invalidMonths);
      return false;
    }
    if (!datePattern.test(form.purchase_date)) {
      Alert.alert(t.invalidDate);
      return false;
    }
    if (!invoice) {
      Alert.alert(t.invoiceRequired);
      return false;
    }
    return true;
  }

  async function addItem() {
    if (!validate()) return;
    setLoading(true);
    setError("");
    try {
      const body = new FormData();
      body.append("name", form.name);
      body.append("purchase_date", form.purchase_date);
      body.append("warranty_months", form.warranty_months);
      if (invoice) {
        const imageName = invoice.fileName || `invoice-${Date.now()}.jpg`;
        body.append("invoice_image", {
          uri: invoice.uri,
          name: imageName,
          type: invoice.mimeType || "image/jpeg",
        });
      }

      const response = await fetch(`${apiBaseUrl}/warranty`, {
        method: "POST",
        body,
      });
      if (!response.ok) throw new Error("API error");
      setForm(blankForm);
      setInvoice(null);
      await loadItems();
    } catch (err) {
      setError(t.apiError);
    } finally {
      setLoading(false);
    }
  }

  async function deleteItem(item) {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${apiBaseUrl}/warranty/${item.id}`, { method: "DELETE" });
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
      <AppHeader title={t.warranty} t={t} language={language} setLanguage={setLanguage} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.form}>
          <AppInput label={t.name} value={form.name} onChangeText={(value) => updateForm("name", value)} />
          <AppInput label={`${t.purchaseDate} (YYYY-MM-DD)`} value={form.purchase_date} onChangeText={(value) => updateForm("purchase_date", value)} />
          <AppInput label={t.warrantyMonths} value={form.warranty_months} keyboardType="numeric" onChangeText={(value) => updateForm("warranty_months", value)} />
          <ActionButton label={invoice ? t.invoiceSelected : t.chooseInvoice} icon="image-outline" variant="light" onPress={chooseInvoice} />
          <ActionButton label={t.add} icon="add-outline" onPress={addItem} disabled={loading} />
        </View>

        {loading ? <Text style={styles.info}>{t.loading}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!loading && !items.length ? <Text style={styles.info}>{t.emptyWarranty}</Text> : null}

        {items.map((item) => (
          <View key={item.id} style={[styles.card, item.is_due_soon && styles.alertCard]}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardLine}>{t.expiresOn}: {item.expiry_date}</Text>
            {item.is_due_soon ? <Text style={styles.alertText}>{t.expiresSoon} · {item.days_remaining} {t.days}</Text> : null}
            {item.invoice_image_url ? (
              <Image source={{ uri: item.invoice_image_url }} style={styles.invoiceImage} />
            ) : (
              <Text style={styles.cardLine}>{t.noInvoice}</Text>
            )}
            <ActionButton label={t.delete} icon="trash-outline" variant="danger" onPress={() => deleteItem(item)} />
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
  invoiceImage: { width: "100%", height: 170, borderRadius: 8, backgroundColor: "#e5e7eb" },
  info: { color: "#475569", fontSize: 15, fontWeight: "700" },
  error: { color: "#b42318", fontSize: 15, fontWeight: "800" },
});
