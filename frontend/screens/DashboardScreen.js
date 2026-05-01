import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import AppHeader from "../components/AppHeader";
import { COLORS } from "../utils/constants";
import {
  getDateStatus,
  getWarrantyStatus,
  isCurrentMonth,
  sortByDate,
} from "../utils/dateUtils";
import { formatCurrency } from "../utils/format";
import { loadAllData } from "../utils/storage";

export default function DashboardScreen({ t, language, setLanguage }) {
  const [data, setData] = useState({ autopay: [], bills: [], tasks: [], warranty: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      setData(await loadAllData());
    } catch (err) {
      setError(t.storageError);
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [language])
  );

  const billsDueThisMonth = data.bills.filter((item) => !item.paid && isCurrentMonth(item.dueDate));
  const autopayDueThisMonth = data.autopay.filter((item) => !item.paid && isCurrentMonth(item.date));
  const tasksPendingThisMonth = data.tasks.filter((item) => !item.done && isCurrentMonth(item.dueDate));
  const monthlyPendingAmount = [...billsDueThisMonth, ...autopayDueThisMonth, ...tasksPendingThisMonth].reduce(
    (total, item) => total + Number(item.amount || 0),
    0
  );

  const upcomingPayments = sortByDate(
    [
      ...data.bills.filter((item) => !item.paid).map((item) => ({ ...item, type: "bill", displayDate: item.dueDate })),
      ...data.autopay.filter((item) => !item.paid).map((item) => ({ ...item, type: "autopay", displayDate: item.date })),
    ],
    "displayDate"
  );
  const warrantyAlerts = data.warranty
    .map((item) => ({ ...item, statusInfo: getWarrantyStatus(item, t) }))
    .filter((item) => ["expired", "today", "soon"].includes(item.statusInfo.kind))
    .sort((a, b) => a.statusInfo.days - b.statusInfo.days);
  const pendingTasks = sortByDate(data.tasks.filter((item) => !item.done), "dueDate");

  const hasAnyData =
    data.autopay.length || data.bills.length || data.tasks.length || data.warranty.length;

  return (
    <View style={styles.page}>
      <AppHeader title={t.dashboard} t={t} language={language} setLanguage={setLanguage} />
      <ScrollView contentContainerStyle={styles.content}>
        {loading ? <Text style={styles.info}>{t.loading}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!loading && !hasAnyData ? <Text style={styles.info}>{t.emptyDashboard}</Text> : null}

        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>{t.monthlyPendingAmount}</Text>
          <Text style={styles.summaryAmount}>{formatCurrency(monthlyPendingAmount)}</Text>
        </View>

        <View style={styles.summaryGrid}>
          <MiniSummary label={t.billsDue} value={billsDueThisMonth.length} icon="receipt-outline" />
          <MiniSummary label={t.autopayDue} value={autopayDueThisMonth.length} icon="card-outline" />
          <MiniSummary label={t.tasksPending} value={tasksPendingThisMonth.length} icon="checkbox-outline" />
        </View>

        <Section title={t.upcomingPayments} icon="calendar-outline">
          {upcomingPayments.length ? (
            upcomingPayments.slice(0, 5).map((item) => {
              const status = getDateStatus(item.displayDate, false, t, t.paid);
              return (
                <SmallRow
                  key={`${item.type}-${item.id}`}
                  name={item.name}
                  value={`${formatCurrency(item.amount)} · ${status.text}`}
                  badge={item.type === "bill" ? t.bills : t.autopay}
                  statusKind={status.kind}
                />
              );
            })
          ) : (
            <Text style={styles.empty}>{t.emptyBills}</Text>
          )}
        </Section>

        <Section title={t.warrantyAlerts} icon="shield-checkmark-outline">
          {warrantyAlerts.length ? (
            warrantyAlerts.slice(0, 5).map((item) => (
              <SmallRow
                key={item.id}
                name={item.name}
                value={`${item.statusInfo.text} · ${item.statusInfo.expiryDate}`}
                badge={t.warranty}
                statusKind={item.statusInfo.kind}
              />
            ))
          ) : (
            <Text style={styles.empty}>{t.emptyWarranty}</Text>
          )}
        </Section>

        <Section title={t.pendingTasks} icon="checkbox-outline">
          {pendingTasks.length ? (
            pendingTasks.slice(0, 5).map((item) => {
              const status = getDateStatus(item.dueDate, false, t, t.done);
              return (
                <SmallRow
                  key={item.id}
                  name={item.name}
                  value={`${formatCurrency(item.amount)} · ${status.text}`}
                  badge={t.tasks}
                  statusKind={status.kind}
                />
              );
            })
          ) : (
            <Text style={styles.empty}>{t.emptyTasks}</Text>
          )}
        </Section>
      </ScrollView>
    </View>
  );
}

function MiniSummary({ label, value, icon }) {
  return (
    <View style={styles.miniCard}>
      <Ionicons name={icon} size={20} color={COLORS.primary} />
      <Text style={styles.miniValue}>{value}</Text>
      <Text style={styles.miniLabel}>{label}</Text>
    </View>
  );
}

function Section({ title, icon, children }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionTitle}>
        <Ionicons name={icon} size={20} color={COLORS.primary} />
        <Text style={styles.heading}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function SmallRow({ name, value, badge, statusKind }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowName}>{name}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
      <Text style={[styles.badge, ["overdue", "expired"].includes(statusKind) && styles.dangerBadge]}>
        {badge}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    paddingBottom: 96,
    gap: 14,
  },
  summary: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 18,
  },
  summaryLabel: {
    color: "#dff6ff",
    fontSize: 15,
    fontWeight: "800",
  },
  summaryAmount: {
    color: COLORS.white,
    fontSize: 34,
    fontWeight: "900",
    marginTop: 4,
  },
  summaryGrid: {
    flexDirection: "row",
    gap: 10,
  },
  miniCard: {
    flex: 1,
    minHeight: 92,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "space-between",
  },
  miniValue: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "900",
  },
  miniLabel: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  heading: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "900",
  },
  row: {
    minHeight: 58,
    borderTopWidth: 1,
    borderTopColor: "#eef2f7",
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  rowText: {
    flex: 1,
  },
  rowName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
  },
  rowValue: {
    color: COLORS.muted,
    fontSize: 14,
    marginTop: 2,
  },
  badge: {
    color: COLORS.warning,
    backgroundColor: COLORS.warningBg,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    fontWeight: "800",
  },
  dangerBadge: {
    color: COLORS.danger,
    backgroundColor: "#fff1f2",
  },
  info: {
    color: COLORS.muted,
    fontSize: 15,
    fontWeight: "700",
  },
  empty: {
    color: COLORS.muted,
    fontSize: 15,
  },
  error: {
    color: COLORS.danger,
    fontSize: 15,
    fontWeight: "800",
  },
});
