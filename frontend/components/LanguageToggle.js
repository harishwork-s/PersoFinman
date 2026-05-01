import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";


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
    minHeight: 44,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#e9f5f8",
  },
  text: {
    color: "#176B87",
    fontSize: 14,
    fontWeight: "800",
  },
});
