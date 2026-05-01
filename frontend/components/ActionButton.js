import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";


export default function ActionButton({ label, icon, onPress, variant = "primary", disabled = false }) {
  return (
    <Pressable
      style={[styles.button, styles[variant], disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
    >
      {icon ? <Ionicons name={icon} size={18} color={variant === "light" ? "#176B87" : "#ffffff"} /> : null}
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
    backgroundColor: "#176B87",
  },
  danger: {
    backgroundColor: "#b42318",
  },
  success: {
    backgroundColor: "#16803c",
  },
  light: {
    backgroundColor: "#e9f5f8",
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },
  lightText: {
    color: "#176B87",
  },
});
