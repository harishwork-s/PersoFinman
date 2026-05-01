import React, { useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

import DashboardScreen from "./screens/DashboardScreen";
import AutopayScreen from "./screens/AutopayScreen";
import BillsScreen from "./screens/BillsScreen";
import WarrantyScreen from "./screens/WarrantyScreen";
import TasksScreen from "./screens/TasksScreen";

export const APP_NAME = "PersoFinman";
export const API_BASE_URL = "http://192.168.1.34:5000";

const Tab = createBottomTabNavigator();

const translations = {
  en: {
    appName: APP_NAME,
    dashboard: "Home",
    autopay: "Autopay",
    bills: "Bills",
    warranty: "Warranty",
    tasks: "Tasks",
    totalMonthly: "Monthly total",
    upcomingPayments: "Upcoming",
    warrantyAlerts: "Warranty alerts",
    pendingTasks: "Pending tasks",
    add: "Add",
    name: "Name",
    amount: "Amount",
    date: "Date",
    dueDate: "Due date",
    paymentLink: "Payment link",
    purchaseDate: "Purchase date",
    warrantyMonths: "Warranty months",
    chooseInvoice: "Choose invoice",
    invoiceSelected: "Invoice selected",
    noInvoice: "No invoice",
    openLink: "Pay",
    markPaid: "Paid",
    markUnpaid: "Unpaid",
    markDone: "Done",
    markPending: "Pending",
    delete: "Delete",
    paid: "Paid",
    unpaid: "Unpaid",
    completed: "Done",
    pending: "Pending",
    loading: "Loading...",
    emptyAutopay: "No subscriptions yet.",
    emptyBills: "No bills yet.",
    emptyWarranty: "No warranty items yet.",
    emptyTasks: "No tasks yet.",
    emptyDashboard: "Add items to see your money summary.",
    required: "Please fill all fields.",
    invalidAmount: "Amount must be greater than 0.",
    invalidMonths: "Warranty months must be greater than 0.",
    invalidDate: "Date must use YYYY-MM-DD.",
    invalidLink: "Payment link must start with http:// or https://.",
    invoiceRequired: "Please choose invoice image.",
    apiError: "Could not connect. Check backend and local IP.",
    dueSoon: "Due soon",
    expiresSoon: "Expires soon",
    expiresOn: "Expires",
    days: "days",
    language: "தமிழ்",
    selectImageError: "Could not pick image.",
    totalSubscriptions: "Subscription total",
  },
  ta: {
    appName: APP_NAME,
    dashboard: "முகப்பு",
    autopay: "ஆட்டோ பே",
    bills: "பில்",
    warranty: "வாரண்டி",
    tasks: "வேலை",
    totalMonthly: "மாத மொத்தம்",
    upcomingPayments: "வரும் பேமெண்ட்",
    warrantyAlerts: "வாரண்டி அலர்ட்",
    pendingTasks: "முடிக்காத வேலை",
    add: "சேர்",
    name: "பெயர்",
    amount: "தொகை",
    date: "தேதி",
    dueDate: "கடைசி தேதி",
    paymentLink: "பேமெண்ட் லிங்க்",
    purchaseDate: "வாங்கிய தேதி",
    warrantyMonths: "வாரண்டி மாதம்",
    chooseInvoice: "பில் படம் தேர்வு",
    invoiceSelected: "பில் படம் உள்ளது",
    noInvoice: "பில் படம் இல்லை",
    openLink: "பணம் செலுத்து",
    markPaid: "கட்டியது",
    markUnpaid: "கட்டவில்லை",
    markDone: "முடிந்தது",
    markPending: "முடியவில்லை",
    delete: "நீக்கு",
    paid: "கட்டியது",
    unpaid: "கட்டவில்லை",
    completed: "முடிந்தது",
    pending: "முடியவில்லை",
    loading: "ஏறுகிறது...",
    emptyAutopay: "சப்ஸ்கிரிப்ஷன் இல்லை.",
    emptyBills: "பில் இல்லை.",
    emptyWarranty: "வாரண்டி பொருள் இல்லை.",
    emptyTasks: "வேலை இல்லை.",
    emptyDashboard: "சுருக்கம் பார்க்க விஷயங்களை சேர்க்கவும்.",
    required: "எல்லா இடமும் நிரப்பவும்.",
    invalidAmount: "தொகை 0-க்கும் மேலாக இருக்க வேண்டும்.",
    invalidMonths: "வாரண்டி மாதம் 0-க்கும் மேலாக இருக்க வேண்டும்.",
    invalidDate: "தேதி YYYY-MM-DD போல இருக்க வேண்டும்.",
    invalidLink: "லிங்க் http:// அல்லது https:// என்று தொடங்க வேண்டும்.",
    invoiceRequired: "பில் படம் தேர்வு செய்யவும்.",
    apiError: "கனெக்ட் ஆகவில்லை. backend மற்றும் local IP பாருங்கள்.",
    dueSoon: "சீக்கிரம் கடைசி தேதி",
    expiresSoon: "சீக்கிரம் முடியும்",
    expiresOn: "முடியும் தேதி",
    days: "நாள்",
    language: "English",
    selectImageError: "படம் தேர்வு ஆகவில்லை.",
    totalSubscriptions: "சப்ஸ்கிரிப்ஷன் மொத்தம்",
  },
};

function tabIcon(routeName, color, size) {
  const icons = {
    Home: "home-outline",
    Autopay: "card-outline",
    Bills: "receipt-outline",
    Warranty: "shield-checkmark-outline",
    Tasks: "checkbox-outline",
  };
  return <Ionicons name={icons[routeName]} size={size} color={color} />;
}

export default function App() {
  const [language, setLanguage] = useState("en");
  const t = translations[language];
  const screenProps = {
    apiBaseUrl: API_BASE_URL,
    language,
    setLanguage,
    t,
  };

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: "#176B87",
          tabBarInactiveTintColor: "#6b7280",
          tabBarStyle: { height: 64, paddingBottom: 8, paddingTop: 8 },
          tabBarLabelStyle: { fontSize: 12, fontWeight: "700" },
          tabBarIcon: ({ color, size }) => tabIcon(route.name, color, size),
        })}
      >
        <Tab.Screen name="Home" options={{ tabBarLabel: t.dashboard }}>
          {() => <DashboardScreen {...screenProps} />}
        </Tab.Screen>
        <Tab.Screen name="Autopay" options={{ tabBarLabel: t.autopay }}>
          {() => <AutopayScreen {...screenProps} />}
        </Tab.Screen>
        <Tab.Screen name="Bills" options={{ tabBarLabel: t.bills }}>
          {() => <BillsScreen {...screenProps} />}
        </Tab.Screen>
        <Tab.Screen name="Warranty" options={{ tabBarLabel: t.warranty }}>
          {() => <WarrantyScreen {...screenProps} />}
        </Tab.Screen>
        <Tab.Screen name="Tasks" options={{ tabBarLabel: t.tasks }}>
          {() => <TasksScreen {...screenProps} />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}
