import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { COLORS, RADIUS } from "../utils/constants";


export default function LanguageToggle({ language, setLanguage, label }) {
  return (
    <Pressable
      style={styles.button}
      onPress={() => setLanguage(language === "en" ? "ta" : "en")}
    >
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}


const styles = StyleSheet.create({
  button: {
    minHeight: 42,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primaryLight,
  },
  text: {
    color: COLORS.primaryDark,
    fontSize: 14,
    fontWeight: "800",
  },
});
