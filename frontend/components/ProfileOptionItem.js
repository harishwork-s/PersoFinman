import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { COLORS, RADIUS, SHADOW } from "../utils/constants";

export default function ProfileOptionItem({ icon, title, value, onPress, danger = false }) {
  return (
    <Pressable style={styles.item} onPress={onPress}>
      <View style={[styles.iconBox, danger && styles.dangerIconBox]}>
        <Ionicons name={icon} size={20} color={danger ? COLORS.danger : COLORS.primary} />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.title, danger && styles.dangerText]}>{title}</Text>
        {value ? <Text style={styles.value}>{value}</Text> : null}
      </View>
      <Ionicons name="chevron-forward-outline" size={20} color={COLORS.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    minHeight: 64,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    ...SHADOW.soft,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  dangerIconBox: {
    backgroundColor: COLORS.dangerLight,
  },
  copy: {
    flex: 1,
  },
  title: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "900",
  },
  dangerText: {
    color: COLORS.danger,
  },
  value: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },
});
