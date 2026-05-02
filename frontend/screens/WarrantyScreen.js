import React, { useCallback, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";

import ActionButton from "../components/ActionButton";
import AppHeader from "../components/AppHeader";
import FilterChips from "../components/FilterChips";
import FormInput from "../components/FormInput";
import SearchBar from "../components/SearchBar";
import StatusBadge from "../components/StatusBadge";
import { COLORS, RADIUS, SHADOW, STORAGE_KEYS } from "../utils/constants";
import { confirmDelete } from "../utils/confirmDelete";
import { calculateExpiryDate, getWarrantyStatus, isValidDate, sortByDate } from "../utils/dateUtils";
import { createId } from "../utils/format";
import { persistInvoice, removeInvoice } from "../utils/invoiceStorage";
import { cancelItemNotifications, scheduleItemNotifications } from "../utils/notifications";
import { matchesSearch } from "../utils/search";
import { loadCollection, saveCollection } from "../utils/storage";

const blankForm = { name: "", purchaseDate: "", warrantyMonths: "" };

export default function WarrantyScreen({ t, language, setLanguage, onProfilePress }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(blankForm);
  const [editId, setEditId] = useState(null);
  const [invoiceAsset, setInvoiceAsset] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewUri, setPreviewUri] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadItems() {
    setLoading(true);
    setError("");
    try {
      const saved = await loadCollection(STORAGE_KEYS.warranty);
      const normalized = saved.map(normalizeWarranty);
      setItems(sortByDate(normalized, "expiryDate"));
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
        setInvoiceAsset(result.assets[0]);
      }
    } catch (err) {
      Alert.alert(t.selectImageError);
    }
  }

  function validate() {
    if (!form.name.trim()) {
      Alert.alert(t.required);
      return false;
    }
    if (!isValidDate(form.purchaseDate)) {
      Alert.alert(t.invalidDate);
      return false;
    }
    if (!Number.isFinite(Number(form.warrantyMonths)) || Number(form.warrantyMonths) <= 0) {
      Alert.alert(t.invalidMonths);
      return false;
    }
    return true;
  }

  async function saveItems(nextItems) {
    const sorted = sortByDate(nextItems, "expiryDate");
    setItems(sorted);
    await saveCollection(STORAGE_KEYS.warranty, sorted);
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
        let invoiceUri = oldItem?.invoiceUri || "";
        if (invoiceAsset) {
          await removeInvoice(invoiceUri);
          invoiceUri = await persistInvoice(invoiceAsset, editId);
        }
        const updated = {
          ...oldItem,
          name: form.name.trim(),
          purchaseDate: form.purchaseDate,
          warrantyMonths: Number(form.warrantyMonths),
          expiryDate: calculateExpiryDate(form.purchaseDate, Number(form.warrantyMonths)),
          invoiceUri,
          updatedAt: now,
        };
        updated.notificationIds = await safeSchedule("warranty", updated);
        await saveItems(items.map((item) => (item.id === editId ? updated : item)));
      } else {
        const id = createId("warranty");
        const item = {
          id,
          name: form.name.trim(),
          purchaseDate: form.purchaseDate,
          warrantyMonths: Number(form.warrantyMonths),
          expiryDate: calculateExpiryDate(form.purchaseDate, Number(form.warrantyMonths)),
          invoiceUri: invoiceAsset ? await persistInvoice(invoiceAsset, id) : "",
          notificationIds: [],
          createdAt: now,
          updatedAt: now,
        };
        item.notificationIds = await safeSchedule("warranty", item);
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
    setInvoiceAsset(null);
    setForm({
      name: item.name,
      purchaseDate: item.purchaseDate,
      warrantyMonths: String(item.warrantyMonths),
    });
  }

  function clearForm() {
    setEditId(null);
    setInvoiceAsset(null);
    setForm(blankForm);
  }

  async function deleteItem(item) {
    setLoading(true);
    setError("");
    try {
      await cancelItemNotifications(item.notificationIds);
      await removeInvoice(item.invoiceUri);
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
    { key: "active", label: t.activeFilter },
    { key: "soon", label: t.expiringSoonFilter },
    { key: "expired", label: t.expiredFilter },
  ];
  const visibleItems = items.filter((item) => {
    const status = getWarrantyStatus(item, t);
    if (filter === "active") return status.kind === "active";
    if (filter === "soon") return ["today", "soon"].includes(status.kind);
    if (filter === "expired") return status.kind === "expired";
    return true;
  }).filter((item) => matchesSearch(item, searchQuery));
  const emptyMessage = searchQuery.trim() ? t.noMatches : t.emptyWarranty;

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <AppHeader title={t.warranty} t={t} language={language} setLanguage={setLanguage} onProfilePress={onProfilePress} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder={t.searchWarranty} />
        <View style={styles.form}>
          <FormInput label={t.name} value={form.name} onChangeText={(value) => updateForm("name", value)} />
          <FormInput label={`${t.purchaseDate} (YYYY-MM-DD)`} value={form.purchaseDate} onChangeText={(value) => updateForm("purchaseDate", value)} />
          <FormInput label={t.warrantyMonths} value={form.warrantyMonths} keyboardType="numeric" onChangeText={(value) => updateForm("warrantyMonths", value)} />
          <ActionButton label={invoiceAsset ? t.invoiceSelected : t.chooseInvoice} icon="image-outline" variant="light" onPress={chooseInvoice} />
          <ActionButton label={editId ? t.update : t.add} icon={editId ? "save-outline" : "add-outline"} onPress={addOrUpdateItem} disabled={loading} />
          {editId ? <ActionButton label={t.cancel} icon="close-outline" variant="light" onPress={clearForm} /> : null}
        </View>

        <FilterChips filters={filters} activeFilter={filter} onChange={setFilter} />

        {loading ? <Text style={styles.info}>{t.loading}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!loading && !visibleItems.length ? <Text style={styles.info}>{emptyMessage}</Text> : null}

        {visibleItems.map((item) => {
          const status = getWarrantyStatus(item, t);
          return (
            <View key={item.id} style={[styles.card, ["soon", "today"].includes(status.kind) && styles.alertCard, status.kind === "expired" && styles.overdueCard]}>
              <View style={styles.cardTop}>
                <View style={styles.cardCopy}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.cardLine}>{t.expiresOn}: {status.expiryDate}</Text>
                  <StatusBadge text={status.text} kind={status.kind} />
                </View>
                {item.invoiceUri ? (
                  <Image source={{ uri: item.invoiceUri }} style={styles.thumbnail} />
                ) : (
                  <View style={styles.emptyThumb}>
                    <Ionicons name="image-outline" size={22} color={COLORS.muted} />
                  </View>
                )}
              </View>
              {item.invoiceUri ? (
                <ActionButton label={t.viewInvoice} icon="eye-outline" variant="light" onPress={() => setPreviewUri(item.invoiceUri)} />
              ) : (
                <Text style={styles.cardLine}>{t.noInvoiceAttached}</Text>
              )}
              <View style={styles.actions}>
                <ActionButton label={t.edit} icon="create-outline" variant="light" onPress={() => startEdit(item)} />
                <ActionButton label={t.delete} icon="trash-outline" variant="danger" onPress={() => confirmDelete(t, () => deleteItem(item))} />
              </View>
            </View>
          );
        })}
      </ScrollView>

      <Modal visible={Boolean(previewUri)} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.closeButton} onPress={() => setPreviewUri("")}>
            <Ionicons name="close-outline" size={28} color={COLORS.white} />
          </Pressable>
          {previewUri ? <Image source={{ uri: previewUri }} style={styles.previewImage} resizeMode="contain" /> : null}
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function normalizeWarranty(item) {
  const purchaseDate = item.purchaseDate || item.purchase_date || "";
  const warrantyMonths = Number(item.warrantyMonths || item.warranty_months || 0);
  return {
    id: item.id || createId("warranty"),
    name: item.name || "",
    purchaseDate,
    warrantyMonths,
    expiryDate: item.expiryDate || calculateExpiryDate(purchaseDate, warrantyMonths),
    invoiceUri: item.invoiceUri || item.invoice_image_url || item.invoice_image_path || "",
    notificationIds: item.notificationIds || [],
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || new Date().toISOString(),
  };
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 96, gap: 14 },
  form: { gap: 10 },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 16, gap: 12, borderWidth: 1, borderColor: COLORS.border, ...SHADOW.card },
  alertCard: { borderColor: COLORS.warning, backgroundColor: COLORS.warningLight },
  overdueCard: { borderColor: COLORS.danger, backgroundColor: COLORS.dangerLight },
  cardTop: { flexDirection: "row", gap: 12, alignItems: "center" },
  cardCopy: { flex: 1 },
  cardTitle: { color: COLORS.text, fontSize: 18, fontWeight: "900" },
  cardLine: { color: COLORS.muted, fontSize: 15, marginTop: 4 },
  thumbnail: { width: 74, height: 74, borderRadius: RADIUS.md, backgroundColor: COLORS.neutral },
  emptyThumb: { width: 74, height: 74, borderRadius: RADIUS.md, backgroundColor: COLORS.neutral, alignItems: "center", justifyContent: "center" },
  actions: { gap: 8 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.92)", alignItems: "center", justifyContent: "center", padding: 18 },
  closeButton: { position: "absolute", top: 48, right: 18, width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.16)", zIndex: 1 },
  previewImage: { width: "100%", height: "82%" },
  info: { color: COLORS.muted, fontSize: 15, fontWeight: "700" },
  error: { color: COLORS.danger, fontSize: 15, fontWeight: "800" },
});
