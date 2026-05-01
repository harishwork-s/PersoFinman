import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { COLORS } from "../utils/constants";


export default function ActionButton({ label, icon, onPress, variant = "primary", disabled = false }) {
  return (
    <Pressable
      style={[styles.button, styles[variant], disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
    >
      {icon ? <Ionicons name={icon} size={18} color={variant === "light" || disabled ? COLORS.primary : COLORS.white} /> : null}
      <Text style={[styles.text, variant === "light" && styles.lightText]}>{label}</Text>
    </Pressable>
  );
}


const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: 8,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primary: {
    backgroundColor: COLORS.primary,
  },
  danger: {
    backgroundColor: COLORS.danger,
  },
  success: {
    backgroundColor: COLORS.success,
  },
  light: {
    backgroundColor: COLORS.primaryLight,
  },
  disabled: {
    backgroundColor: "#eef2f7",
  },
  text: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "800",
  },
  lightText: {
    color: COLORS.primary,
  },
});
