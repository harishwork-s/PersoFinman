import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import AppHeader from "../components/AppHeader";


function money(value) {
  return `₹${Number(value || 0).toFixed(2)}`;
}


function sum(items) {
  return items.reduce((total, item) => total + Number(item.amount || 0), 0);
}


export default function DashboardScreen({ apiBaseUrl, t, language, setLanguage }) {
  const [data, setData] = useState({ autopay: [], bills: [], tasks: [], warranty: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [autopayRes, billsRes, tasksRes, warrantyRes] = await Promise.all([
        fetch(`${apiBaseUrl}/autopay`),
        fetch(`${apiBaseUrl}/bills`),
        fetch(`${apiBaseUrl}/tasks`),
        fetch(`${apiBaseUrl}/warranty`),
      ]);
      if (!autopayRes.ok || !billsRes.ok || !tasksRes.ok || !warrantyRes.ok) {
        throw new Error("API error");
      }
      setData({
        autopay: await autopayRes.json(),
        bills: await billsRes.json(),
        tasks: await tasksRes.json(),
        warranty: await warrantyRes.json(),
      });
    } catch (err) {
      setError(t.apiError);
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [apiBaseUrl, language])
  );

  const unpaidAutopay = data.autopay.filter((item) => item.status === "unpaid");
  const unpaidBills = data.bills.filter((item) => item.status === "unpaid");
  const pendingTasks = data.tasks.filter((item) => item.status === "pending");
  const monthlyTotal = sum(unpaidAutopay) + sum(unpaidBills) + sum(pendingTasks);
  const upcoming = [...unpaidAutopay, ...unpaidBills].filter((item) => item.is_due_soon);
  const warrantyAlerts = data.warranty.filter((item) => item.is_due_soon);
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
          <Text style={styles.summaryLabel}>{t.totalMonthly}</Text>
          <Text style={styles.summaryAmount}>{money(monthlyTotal)}</Text>
        </View>

        <Section title={t.upcomingPayments} icon="calendar-outline">
          {upcoming.length ? (
            upcoming.slice(0, 5).map((item) => (
              <SmallRow
                key={`${item.name}-${item.id}`}
                name={item.name}
                value={`${money(item.amount)} · ${item.days_remaining} ${t.days}`}
                alertText={t.dueSoon}
              />
            ))
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
                value={`${item.expiry_date} · ${item.days_remaining} ${t.days}`}
                alertText={t.expiresSoon}
              />
            ))
          ) : (
            <Text style={styles.empty}>{t.emptyWarranty}</Text>
          )}
        </Section>

        <Section title={t.pendingTasks} icon="checkbox-outline">
          {pendingTasks.length ? (
            pendingTasks.slice(0, 5).map((item) => (
              <SmallRow
                key={item.id}
                name={item.name}
                value={`${money(item.amount)} · ${item.due_date}`}
                alertText={item.is_due_soon ? t.dueSoon : ""}
              />
            ))
          ) : (
            <Text style={styles.empty}>{t.emptyTasks}</Text>
          )}
        </Section>
      </ScrollView>
    </View>
  );
}


function Section({ title, icon, children }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionTitle}>
        <Ionicons name={icon} size={20} color="#176B87" />
        <Text style={styles.heading}>{title}</Text>
      </View>
      {children}
    </View>
  );
}


function SmallRow({ name, value, alertText }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowName}>{name}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
      {alertText ? <Text style={styles.badge}>{alertText}</Text> : null}
    </View>
  );
}


const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#f7f9fc",
  },
  content: {
    padding: 16,
    gap: 14,
  },
  summary: {
    backgroundColor: "#176B87",
    borderRadius: 8,
    padding: 18,
  },
  summaryLabel: {
    color: "#dff6ff",
    fontSize: 15,
    fontWeight: "800",
  },
  summaryAmount: {
    color: "#ffffff",
    fontSize: 34,
    fontWeight: "900",
    marginTop: 4,
  },
  section: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  sectionTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  heading: {
    color: "#111827",
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
    color: "#111827",
    fontSize: 16,
    fontWeight: "800",
  },
  rowValue: {
    color: "#64748b",
    fontSize: 14,
    marginTop: 2,
  },
  badge: {
    color: "#92400e",
    backgroundColor: "#fff7ed",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    fontWeight: "800",
  },
  info: {
    color: "#475569",
    fontSize: 15,
    fontWeight: "700",
  },
  empty: {
    color: "#64748b",
    fontSize: 15,
  },
  error: {
    color: "#b42318",
    fontSize: 15,
    fontWeight: "800",
  },
});
