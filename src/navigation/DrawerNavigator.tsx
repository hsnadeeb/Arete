import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStore } from "../store";
import { useTheme } from "../context/ThemeContext";

import DashboardScreen from "../screens/DashboardScreen";
import TrackerScreen from "../screens/TrackerScreen";
import JournalScreen from "../screens/JournalScreen";
import BudgetScreen from "../screens/BudgetScreen";
import PlannerScreen from "../screens/PlannerScreen";
import SettingsScreen from "../screens/SettingsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import WidgetEditor from "../screens/WidgetEditor";
import AISettingsScreen from "../screens/AISettingsScreen";

type RouteName =
  | "Dashboard"
  | "Trackers"
  | "Journal"
  | "Budget"
  | "Planner"
  | "Settings"
  | "Profile"
  | "Widgets"
  | "AISettings";

const SCREENS: { name: RouteName; component: React.FC }[] = [
  { name: "Dashboard", component: DashboardScreen },
  { name: "Trackers", component: TrackerScreen },
  { name: "Journal", component: JournalScreen },
  { name: "Budget", component: BudgetScreen },
  { name: "Planner", component: PlannerScreen },
  { name: "Settings", component: SettingsScreen },
  { name: "Profile", component: ProfileScreen },
  { name: "Widgets", component: WidgetEditor },
  { name: "AISettings", component: AISettingsScreen },
];

const NAV_ITEMS: { name: RouteName; label: string; icon: string }[] = [
  { name: "Dashboard", label: "Dashboard", icon: "home" },
  { name: "Trackers", label: "Trackers", icon: "bar-chart-2" },
  { name: "Journal", label: "Journal", icon: "file-text" },
  { name: "Budget", label: "Budget", icon: "dollar-sign" },
  { name: "Planner", label: "Schedule", icon: "calendar" },
  { name: "Settings", label: "Settings", icon: "settings" },
  { name: "AISettings", label: "AI Settings", icon: "cpu" },
  { name: "Widgets", label: "Widgets", icon: "grid" },
];

export default function DrawerNavigator() {
  const currentRoute = useStore((s) => s.currentRoute) as RouteName;
const setCurrentRoute = useStore((s) => s.setCurrentRoute) as (route: RouteName) => void;
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const setSidebarOpen = useStore((s) => s.setSidebarOpen);
  const slideAnim = useRef(new Animated.Value(-260)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: sidebarOpen ? 0 : -260,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: sidebarOpen ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [sidebarOpen]);

  const ActiveScreen =
    SCREENS.find((s) => s.name === currentRoute)?.component || DashboardScreen;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <View style={{ flex: 1 }}>
        <ActiveScreen />
      </View>

      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { zIndex: 1000, opacity: overlayAnim },
        ]}
        pointerEvents={sidebarOpen ? "auto" : "none"}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.25)" }}
          activeOpacity={1}
          onPress={() => setSidebarOpen(false)}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.sidebar,
          {
            paddingTop: insets.top,
            transform: [{ translateX: slideAnim }],
            zIndex: 1001,
            backgroundColor: theme.colors.card,
          },
        ]}
        pointerEvents={sidebarOpen ? "auto" : "none"}
      >
        <TouchableOpacity
          style={styles.sidebarHeader}
          onPress={() => {
            setCurrentRoute("Profile");
            setSidebarOpen(false);
          }}
          activeOpacity={0.7}
        >
          <View style={[styles.avatar, { backgroundColor: theme.colors.accent }]}>
            <Text style={[styles.avatarText, { color: theme.colors.textInverse }]}>HA</Text>
          </View>
        </TouchableOpacity>
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {NAV_ITEMS.map((item) => {
            const focused = currentRoute === item.name;
            return (
              <TouchableOpacity
                key={item.name}
                style={[
                  styles.navItem,
                  focused && { backgroundColor: theme.colors.accentBg },
                ]}
                onPress={() => {
                  setCurrentRoute(item.name);
                  setSidebarOpen(false);
                }}
                activeOpacity={0.7}
              >
                <Feather
                  name={item.icon as any}
                  size={18}
                  color={focused ? theme.colors.accent : theme.colors.textTertiary}
                />
                <Text
                  style={[
                    styles.navItemLabel,
                    { color: theme.colors.text },
                    focused && { color: theme.colors.accent, fontWeight: "600" },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const SIDEBAR_WIDTH = 260;

const styles = StyleSheet.create({
  sidebar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 10,
  },
  sidebarHeader: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "700",
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    borderRadius: 8,
    gap: 12,
  },
  navItemLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  navItemLabelActive: {
    color: "#6366f1",
    fontWeight: "600",
  },
});