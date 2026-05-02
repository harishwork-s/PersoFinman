import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { COLORS, RADIUS, SHADOW } from "../utils/constants";


export default function ActionButton({ label, icon, onPress, variant = "primary", disabled = false }) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      {icon ? <Ionicons name={icon} size={18} color={variant === "light" || variant === "neutral" || disabled ? COLORS.primary : COLORS.white} /> : null}
      <Text style={[styles.text, (variant === "light" || variant === "neutral") && styles.lightText]}>{label}</Text>
    </Pressable>
  );
}


const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    ...SHADOW.soft,
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
  neutral: {
    backgroundColor: COLORS.neutral,
  },
  disabled: {
    backgroundColor: COLORS.neutral,
    shadowOpacity: 0,
    elevation: 0,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
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
