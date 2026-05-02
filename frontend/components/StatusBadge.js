import React from "react";
import { StyleSheet, Text } from "react-native";

import { COLORS, RADIUS } from "../utils/constants";

export default function StatusBadge({ text, kind }) {
  return <Text style={[styles.badge, styles[kind] || styles.upcoming]}>{text}</Text>;
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: RADIUS.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    fontWeight: "900",
    overflow: "hidden",
  },
  complete: {
    color: COLORS.success,
    backgroundColor: COLORS.successLight,
  },
  active: {
    color: COLORS.primaryDark,
    backgroundColor: COLORS.primaryLight,
  },
  upcoming: {
    color: COLORS.primaryDark,
    backgroundColor: COLORS.primaryLight,
  },
  soon: {
    color: COLORS.warning,
    backgroundColor: COLORS.warningLight,
  },
  today: {
    color: COLORS.warning,
    backgroundColor: COLORS.warningLight,
  },
  overdue: {
    color: COLORS.danger,
    backgroundColor: COLORS.dangerLight,
  },
  expired: {
    color: COLORS.danger,
    backgroundColor: COLORS.dangerLight,
  },
});
