import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import LanguageToggle from "./LanguageToggle";
import { COLORS } from "../utils/constants";


export default function AppHeader({ title, t, language, setLanguage, onProfilePress, showProfileButton = true }) {
  return (
    <View style={styles.header}>
      <View style={styles.titleBlock}>
        <Text style={styles.appName}>{t.appName}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.actions}>
        <LanguageToggle
          language={language}
          setLanguage={setLanguage}
          label={t.language}
        />
        {showProfileButton ? (
          <Pressable style={styles.profileButton} onPress={onProfilePress}>
            <Ionicons name="person-circle-outline" size={24} color={COLORS.primary} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  header: {
    paddingTop: 54,
    paddingHorizontal: 18,
    paddingBottom: 14,
    backgroundColor: COLORS.white,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 10,
  },
  titleBlock: {
    flex: 1,
  },
  appName: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "700",
  },
  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "900",
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
});
