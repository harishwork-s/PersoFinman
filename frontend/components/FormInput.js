import React from "react";
import { StyleSheet, TextInput } from "react-native";

import { COLORS } from "../utils/constants";

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
    minHeight: 50,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#d8dee8",
    paddingHorizontal: 14,
    fontSize: 16,
    color: COLORS.text,
  },
});
