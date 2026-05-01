import React from "react";
import { StyleSheet, Text, View } from "react-native";

import LanguageToggle from "./LanguageToggle";


export default function AppHeader({ title, t, language, setLanguage }) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.appName}>{t.appName}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
      <LanguageToggle
        language={language}
        setLanguage={setLanguage}
        label={t.language}
      />
    </View>
  );
}


const styles = StyleSheet.create({
  header: {
    paddingTop: 54,
    paddingHorizontal: 18,
    paddingBottom: 14,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  appName: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "700",
  },
  title: {
    color: "#111827",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 2,
  },
});
