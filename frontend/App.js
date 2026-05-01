import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

import DashboardScreen from "./screens/DashboardScreen";
import AutopayScreen from "./screens/AutopayScreen";
import BillsScreen from "./screens/BillsScreen";
import WarrantyScreen from "./screens/WarrantyScreen";
import TasksScreen from "./screens/TasksScreen";
import { loadLanguage, saveLanguage } from "./utils/storage";
import { setupNotificationHandler, requestNotificationPermission } from "./utils/notifications";
import { translations } from "./utils/translations";
import { COLORS } from "./utils/constants";

const Tab = createBottomTabNavigator();

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
  const [language, setLanguageState] = useState("en");
  const t = translations[language];

  useEffect(() => {
    setupNotificationHandler();
    requestNotificationPermission();
    loadLanguage()
      .then((savedLanguage) => setLanguageState(savedLanguage === "ta" ? "ta" : "en"))
      .catch(() => setLanguageState("en"));
  }, []);

  async function setLanguage(nextLanguage) {
    setLanguageState(nextLanguage);
    await saveLanguage(nextLanguage).catch(() => null);
  }

  const screenProps = {
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
          tabBarActiveTintColor: COLORS.primary,
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
