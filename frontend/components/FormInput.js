import React from "react";
import { StyleSheet, TextInput } from "react-native";

import { COLORS, RADIUS, SHADOW } from "../utils/constants";

export default function FormInput({ label, ...props }) {
  return (
    <TextInput
      style={styles.input}
      placeholder={label}
      placeholderTextColor={COLORS.muted}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 52,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.text,
    ...SHADOW.soft,
    elevation: 1,
  },
});
