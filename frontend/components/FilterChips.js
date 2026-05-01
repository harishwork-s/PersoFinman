import React from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

import { COLORS } from "../utils/constants";

export default function FilterChips({ filters, activeFilter, onChange }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.wrap}>
      {filters.map((filter) => {
        const active = activeFilter === filter.key;
        return (
          <Pressable
            key={filter.key}
            style={[styles.chip, active && styles.activeChip]}
            onPress={() => onChange(filter.key)}
          >
            <Text style={[styles.text, active && styles.activeText]}>{filter.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
    paddingRight: 16,
  },
  chip: {
    minHeight: 40,
    borderRadius: 8,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  text: {
    color: COLORS.muted,
    fontWeight: "800",
  },
  activeText: {
    color: COLORS.white,
  },
});
