import React, { useRef, useEffect, useMemo, useState, memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStore } from "../store";
import { useTheme } from "../context/ThemeContext";
import { Icon } from "../components/Icons";
import { Avatar } from "../components/Avatar";
import { LUCIDE_ICONS, TYPOGRAPHY } from "../constants/typography";
import BottomNavBar from "../components/BottomNavBar";

import DashboardScreen from "../screens/DashboardScreen";
import TrackerScreen from "../screens/tracker";
import JournalScreen from "../screens/JournalScreen";
import BudgetScreen from "../screens/BudgetScreen";
import PlannerScreen from "../screens/PlannerScreen";
import SettingsScreen from "../screens/SettingsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import AISettingsScreen from "../screens/AISettingsScreen";

import GreetingScreen from "../screens/GreetingScreen";
import FocusScreen from "../screens/FocusScreen";

type RouteName =
  | "Greeting"
  | "Focus"
  | "Dashboard"
  | "Trackers"
  | "Journal"
  | "Budget"
  | "Planner"
  | "Settings"
  | "Profile"
  | "AISettings";

const SCREENS: { name: RouteName; component: React.FC }[] = [
  { name: "Greeting", component: GreetingScreen },
  { name: "Focus", component: FocusScreen },
  { name: "Dashboard", component: DashboardScreen },
  { name: "Trackers", component: TrackerScreen },
  { name: "Journal", component: JournalScreen },
  { name: "Budget", component: BudgetScreen },
  { name: "Planner", component: PlannerScreen },
  { name: "Settings", component: SettingsScreen },
  { name: "Profile", component: ProfileScreen },
  { name: "AISettings", component: AISettingsScreen },
];

const NAV_ITEMS: {
  name: RouteName;
  label: string;
  icon: keyof typeof LUCIDE_ICONS;
}[] = [
  { name: "Greeting", label: "Home", icon: "home" },
  { name: "Focus", label: "Focus", icon: "target" },
  { name: "Budget", label: "Budget", icon: "dollarSign" },
  { name: "Profile", label: "Profile", icon: "user" },
  { name: "Settings", label: "Settings", icon: "settings" },
  { name: "AISettings", label: "AI Settings", icon: "cpu" },
];

export default function DrawerNavigator() {
  const currentRoute = useStore((s) => s.currentRoute) as RouteName;
  const setCurrentRoute = useStore((s) => s.setCurrentRoute) as (
    route: RouteName,
  ) => void;
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const setSidebarOpen = useStore((s) => s.setSidebarOpen);
  const slideAnim = useRef(new Animated.Value(-260)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const { theme, isDark, toggle } = useTheme();
  const userProfile = useStore((s) => s.userProfile);

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

  const mainRoutes = useMemo(() => ["Dashboard", "Planner", "Trackers", "Journal"], []);
  const showBottomNav = mainRoutes.includes(currentRoute);
  const [visitedRoutes, setVisitedRoutes] = useState<Set<string>>(() => new Set([currentRoute]));

  // Keep main tab screens mounted and switch via opacity for smooth, jank-free transitions
  const screenOpacities = useRef(
    Object.fromEntries(mainRoutes.map((r) => [r, new Animated.Value(r === currentRoute ? 1 : 0)])),
  ).current;

  useEffect(() => {
    if (mainRoutes.includes(currentRoute)) {
      setVisitedRoutes((prev: Set<string>) => (prev.has(currentRoute) ? prev : new Set([...prev, currentRoute])));
    }
    mainRoutes.forEach((route) => {
      Animated.timing(screenOpacities[route], {
        toValue: route === currentRoute ? 1 : 0,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }).start();
    });
  }, [currentRoute, mainRoutes, screenOpacities]);

  // Pre-mount all main tabs in the background after launch so first switches are smooth
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisitedRoutes((prev: Set<string>) => {
        const next = new Set(prev);
        mainRoutes.forEach((r) => next.add(r));
        return next.size === prev.size ? prev : next;
      });
    }, 800);
    return () => clearTimeout(timer);
  }, [mainRoutes]);

  const OtherScreen = useMemo(
    () => !mainRoutes.includes(currentRoute)
      ? SCREENS.find((s) => s.name === currentRoute)?.component || DashboardScreen
      : null,
    [currentRoute, mainRoutes],
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          {mainRoutes.map((route) => {
            if (!visitedRoutes.has(route)) return null;
            const Screen = SCREENS.find((s) => s.name === route)?.component;
            if (!Screen) return null;
            const isActive = currentRoute === route;
            return (
              <Animated.View
                key={route}
                style={[
                  StyleSheet.absoluteFill,
                  { opacity: screenOpacities[route], zIndex: isActive ? 1 : 0 },
                ]}
                pointerEvents={isActive ? "auto" : "none"}
              >
                <MemoizedScreen component={Screen} />
              </Animated.View>
            );
          })}
          {OtherScreen && (
            <View style={{ flex: 1 }}>
              <OtherScreen />
            </View>
          )}
        </View>
        {showBottomNav && <BottomNavBar />}
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
        {/* App header */}
        <View
          style={[
            styles.sidebarHeader,
            {
              borderBottomColor: theme.colors.divider,
              paddingTop: insets.top + 12,
            },
          ]}
        >
          <View style={styles.brandRow}>
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: theme.colors.accentBg },
              ]}
            >
              <Image
                source={require("../../assets/icon.png")}
                style={styles.appIcon}
                resizeMode="contain"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.brand, { color: theme.colors.heading }]}>
                arete
              </Text>
              <Text
                style={[
                  styles.brandSub,
                  { color: theme.colors.textTertiary },
                ]}
              >
                Live with intention
              </Text>
            </View>
          </View>
        </View>

        {userProfile?.name ? (
          <View style={[styles.userSection, { borderBottomColor: theme.colors.divider }]}>
            <TouchableOpacity
              style={styles.userRow}
              onPress={() => { setCurrentRoute("Profile"); setSidebarOpen(false); }}
              activeOpacity={0.7}
            >
              <Avatar
                uri={userProfile?.avatar_uri}
                name={userProfile?.name}
                gender={userProfile?.gender}
                size={36}
                iconSize={16}
                textSize={12}
              />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.userName, { color: theme.colors.heading }]} numberOfLines={1}>
                  {userProfile.name}
                </Text>
                <Text style={[styles.userMeta, { color: theme.colors.textTertiary }]} numberOfLines={1}>
                  View profile
                </Text>
              </View>
              <Icon name={LUCIDE_ICONS.chevronRight} size={14} color={theme.colors.border} />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Section label */}
        <Text
          style={[
            styles.sectionLabel,
            { color: theme.colors.textTertiary },
          ]}
        >
          Menu
        </Text>

        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
        >
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
                <Icon
                  name={LUCIDE_ICONS[item.icon]}
                  size={18}
                  color={
                    focused ? theme.colors.accent : theme.colors.textTertiary
                  }
                />
                <Text
                  style={[
                    styles.navItemLabel,
                    { color: theme.colors.text },
                    focused && {
                      color: theme.colors.accent,
                      fontWeight: "600",
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TouchableOpacity
          style={[styles.themeToggle, { borderTopColor: theme.colors.divider }]}
          onPress={toggle}
          activeOpacity={0.7}
        >
          <Icon
            name={isDark ? LUCIDE_ICONS.sun : LUCIDE_ICONS.moon}
            size={18}
            color={theme.colors.textSecondary}
          />
          <Text
            style={[
              styles.themeToggleLabel,
              { color: theme.colors.textSecondary },
            ]}
          >
            {isDark ? "Light Mode" : "Dark Mode"}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const MemoizedScreen = memo(function MemoizedScreen({ component: Component }: { component: React.FC }) {
  return <Component />;
});

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
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  appIcon: {
    width: 36,
    height: 36,
  },
  brand: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  brandSub: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 1,
  },
  userSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
  },
  userMeta: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 1,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 6,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    ...TYPOGRAPHY.h4,
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
    ...TYPOGRAPHY.body,
    fontWeight: "500",
  },
  navItemLabelActive: {
    color: "#6366f1",
    fontWeight: "600",
  },
  themeToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  themeToggleLabel: {
    ...TYPOGRAPHY.body,
    fontWeight: "500",
  },
});
