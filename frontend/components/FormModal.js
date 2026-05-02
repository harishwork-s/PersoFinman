import React from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { COLORS, RADIUS, SHADOW } from "../utils/constants";

export default function FormModal({ visible, title, closeLabel, onClose, children }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={styles.scrim} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable style={styles.closeIcon} onPress={onClose}>
              <Ionicons name="close-outline" size={24} color={COLORS.text} />
            </Pressable>
          </View>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeText}>{closeLabel}</Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.35)",
  },
  sheet: {
    maxHeight: "88%",
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    ...SHADOW.card,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.border,
    alignSelf: "center",
    marginBottom: 10,
  },
  header: {
    paddingHorizontal: 18,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "900",
  },
  closeIcon: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.neutral,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 16,
    paddingBottom: 30,
    gap: 10,
  },
  closeButton: {
    minHeight: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.neutral,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "900",
  },
});
