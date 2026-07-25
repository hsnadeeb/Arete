import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  NativeModules,
  AppState,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../context/ThemeContext";
import { Icon } from "../components/Icons";
import { LUCIDE_ICONS, TYPOGRAPHY } from "../constants/typography";

const STORAGE_KEY = "doomscrolling_enabled";
const BLOCKED_APPS_KEY = "doomscrolling_blocked_apps";

const DEFAULT_BLOCKED_APPS = [
  "com.instagram.android",
  "com.google.android.youtube",
  "com.zhiliaoapp.musically",
  "com.ss.android.ugc.trill",
  "com.snapchat.android",
  "com.facebook.katana",
  "com.twitter.android",
];

const APP_NAMES: Record<string, string> = {
  "com.instagram.android": "Instagram Reels",
  "com.google.android.youtube": "YouTube Shorts",
  "com.zhiliaoapp.musically": "TikTok",
  "com.ss.android.ugc.trill": "TikTok (Lite)",
  "com.snapchat.android": "Snapchat Spotlight",
  "com.facebook.katana": "Facebook Reels",
  "com.twitter.android": "X (Twitter) Videos",
};

export default function BlockDoomscrollingScreen() {
  const { theme } = useTheme();
  const colors = theme.colors;

  const [enabled, setEnabled] = useState(false);
  const [serviceRegistered, setServiceRegistered] = useState(false);
  const [blockedApps, setBlockedApps] = useState<string[]>(DEFAULT_BLOCKED_APPS);
  const [checking, setChecking] = useState(false);
  const appStateRef = useRef(AppState.currentState);

  const checkServiceStatus = useCallback(async () => {
    setChecking(true);
    try {
      const module = NativeModules.DoomscrollingModule;
      if (module) {
        const registered = await module.isAccessibilityServiceEnabled();
        setServiceRegistered(registered);
      }
    } catch {
      setServiceRegistered(false);
    }
    setChecking(false);
  }, []);

  useEffect(() => {
    loadState();
    checkServiceStatus();

    const sub = AppState.addEventListener("change", (nextState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextState === "active"
      ) {
        checkServiceStatus();
      }
      appStateRef.current = nextState;
    });

    const interval = setInterval(checkServiceStatus, 5000);
    const timeout = setTimeout(checkServiceStatus, 1500);

    return () => {
      sub.remove();
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [checkServiceStatus]);

  const loadState = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const apps = await AsyncStorage.getItem(BLOCKED_APPS_KEY);
      if (stored !== null) setEnabled(stored === "true");
      if (apps !== null) setBlockedApps(JSON.parse(apps));
    } catch {}
  };

  const syncToNative = useCallback(async () => {
    try {
      const module = NativeModules.DoomscrollingModule;
      if (module) {
        await module.setEnabled(enabled);
        if (enabled) {
          await module.setBlockedApps(blockedApps);
        }
      }
    } catch {}
  }, [enabled, blockedApps]);

  const toggleEnabled = useCallback(
    async (value: boolean) => {
      setEnabled(value);
      await AsyncStorage.setItem(STORAGE_KEY, value.toString());
      await syncToNative();

      if (value) {
        const registered = await new Promise<boolean>((resolve) => {
          setTimeout(async () => {
            try {
              const module = NativeModules.DoomscrollingModule;
              const r = module
                ? await module.isAccessibilityServiceEnabled()
                : false;
              resolve(r);
            } catch {
              resolve(false);
            }
          }, 500);
        });

        if (!registered) {
          Alert.alert(
            "Enable Accessibility Service",
            "To block short videos across apps, enable 'Arete' in your device's Accessibility settings.\n\n" +
              "Settings → Accessibility → Installed Apps → Arete",
            [
              { text: "Later", style: "cancel" },
              {
                text: "Open Settings",
                onPress: openAccessibilitySettings,
              },
            ],
          );
        }
        checkServiceStatus();
      }
    },
    [syncToNative, checkServiceStatus],
  );

  const toggleBlockedApp = useCallback(
    async (pkg: string) => {
      const next = blockedApps.includes(pkg)
        ? blockedApps.filter((a) => a !== pkg)
        : [...blockedApps, pkg];
      setBlockedApps(next);
      await AsyncStorage.setItem(BLOCKED_APPS_KEY, JSON.stringify(next));
      if (enabled) {
        try {
          const module = NativeModules.DoomscrollingModule;
          if (module) {
            await module.setBlockedApps(next);
          }
        } catch {}
      }
    },
    [blockedApps, enabled],
  );

  const openUsageStatsSettings = () => {
    try {
      const module = NativeModules.DoomscrollingModule;
      if (module) {
        module.openUsageAccessSettings();
      }
    } catch {}
  };

  const openAccessibilitySettings = () => {
    try {
      const module = NativeModules.DoomscrollingModule;
      if (module) {
        module.openAccessibilitySettings();
      }
    } catch {}
  };

  const getStatusBadge = () => {
    if (!enabled) return null;
    if (checking) {
      return {
        bg: colors.bgTertiary,
        icon: LUCIDE_ICONS.clock,
        color: colors.textTertiary,
        text: "Checking...",
      };
    }
    if (serviceRegistered) {
      return {
        bg: colors.successBg,
        icon: LUCIDE_ICONS.checkCircle,
        color: colors.success,
        text: "Service is active",
      };
    }
    return {
      bg: colors.warningBg,
      icon: LUCIDE_ICONS.alertTriangle,
      color: colors.warning,
      text: "Accessibility service not enabled in system settings",
    };
  };

  const statusBadge = getStatusBadge();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <Text style={[styles.headerTitle, { color: colors.heading }]}>
          Block Doomscrolling
        </Text>
        <Text style={[styles.headerSub, { color: colors.textTertiary }]}>
          Take control of your attention
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Toggle Card ── */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.heading }]}>
                Block Short Videos
              </Text>
              <Text
                style={[styles.cardDesc, { color: colors.textTertiary }]}
              >
                Blocks Reels, Shorts, TikToks, and similar short-form video
                feeds across installed apps when the accessibility service is
                active.
              </Text>
            </View>
            <Switch
              value={enabled}
              onValueChange={toggleEnabled}
              trackColor={{
                false: colors.disabled,
                true: colors.success,
              }}
              thumbColor="#fff"
            />
          </View>

          {statusBadge && (
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusBadge.bg },
              ]}
            >
              <Icon
                name={statusBadge.icon}
                size={14}
                color={statusBadge.color}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: statusBadge.color },
                ]}
              >
                {statusBadge.text}
              </Text>
              {!serviceRegistered && !checking && (
                <TouchableOpacity
                  onPress={openAccessibilitySettings}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={{ marginLeft: "auto" }}
                >
                  <Text
                    style={[
                      styles.statusAction,
                      { color: statusBadge.color },
                    ]}
                  >
                    Fix
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* ── Permissions ── */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          REQUIRED PERMISSIONS
        </Text>

        <TouchableOpacity
          style={[
            styles.permissionRow,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={openAccessibilitySettings}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.permissionIcon,
              {
                backgroundColor: serviceRegistered
                  ? colors.successBg
                  : colors.accentBg,
              },
            ]}
          >
            <Icon
              name={serviceRegistered ? LUCIDE_ICONS.checkCircle : LUCIDE_ICONS.hand}
              size={18}
              color={serviceRegistered ? colors.success : colors.accent}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.permissionTitle, { color: colors.heading }]}>
              Accessibility Service
            </Text>
            <Text style={[styles.permissionDesc, { color: colors.textTertiary }]}>
              Required to detect when you open apps and block short-form video
              feeds. No data is read or transmitted.
            </Text>
          </View>
          <View
            style={[
              styles.badge,
              {
                backgroundColor: serviceRegistered
                  ? colors.successBg
                  : colors.warningBg,
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                {
                  color: serviceRegistered ? colors.success : colors.warning,
                },
              ]}
            >
              {serviceRegistered ? "Enabled" : "Disabled"}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.permissionRow,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={openUsageStatsSettings}
          activeOpacity={0.7}
        >
          <View style={[styles.permissionIcon, { backgroundColor: colors.infoBg }]}>
            <Icon
              name={LUCIDE_ICONS.barChart}
              size={18}
              color={colors.info}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.permissionTitle, { color: colors.heading }]}>
              Usage Access
            </Text>
            <Text
              style={[styles.permissionDesc, { color: colors.textTertiary }]}
            >
              Used to track time spent in blocked apps and show you insights.
              Optional — blocking works without it.
            </Text>
          </View>
          <Icon
            name={LUCIDE_ICONS.chevronRight}
            size={16}
            color={colors.border}
          />
        </TouchableOpacity>

        {/* ── Blocked Apps ── */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          BLOCKED APPS
        </Text>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {DEFAULT_BLOCKED_APPS.map((pkg) => (
            <View
              key={pkg}
              style={[
                styles.appRow,
                { borderBottomColor: colors.divider },
              ]}
            >
              <Text style={[styles.appName, { color: colors.text }]}>
                {APP_NAMES[pkg] || pkg}
              </Text>
              <Switch
                value={blockedApps.includes(pkg)}
                onValueChange={() => toggleBlockedApp(pkg)}
                trackColor={{
                  false: colors.disabled,
                  true: colors.error,
                }}
                thumbColor="#fff"
              />
            </View>
          ))}
        </View>

        {/* ── Disclaimers ── */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          DISCLAIMERS
        </Text>

        <View
          style={[
            styles.disclaimerCard,
            {
              backgroundColor: colors.warningBg,
              borderColor: colors.warning,
            },
          ]}
        >
          <Icon
            name={LUCIDE_ICONS.alertTriangle}
            size={16}
            color={colors.warning}
          />
          <Text
            style={[styles.disclaimerText, { color: colors.textSecondary }]}
          >
            This feature uses Android's Accessibility API to detect short-form
            video feeds. It does NOT read, store, or transmit any personal
            data, keystrokes, or screen content.
          </Text>
        </View>

        <View
          style={[
            styles.disclaimerCard,
            {
              backgroundColor: colors.infoBg,
              borderColor: colors.info,
            },
          ]}
        >
          <Icon
            name={LUCIDE_ICONS.info}
            size={16}
            color={colors.info}
          />
          <Text
            style={[styles.disclaimerText, { color: colors.textSecondary }]}
          >
            Blocking is achieved by detecting the app window and performing a
            system back-navigation when a short-form video feed is detected.
            Some apps may attempt to override this behavior.
          </Text>
        </View>

        <View
          style={[
            styles.disclaimerCard,
            {
              backgroundColor: colors.errorBg,
              borderColor: colors.error,
            },
          ]}
        >
          <Icon
            name={LUCIDE_ICONS.shield}
            size={16}
            color={colors.error}
          />
          <Text
            style={[styles.disclaimerText, { color: colors.textSecondary }]}
          >
            This app is not affiliated with Instagram, YouTube, TikTok, or
            any other platform. Use at your own discretion. The blocking
            mechanism relies on Android's available APIs and may not be
            effective against all app versions or updates.
          </Text>
        </View>

        <Text
          style={[styles.tapToRefresh, { color: colors.textTertiary }]}
          onPress={checkServiceStatus}
        >
          Tap to re-check service status
        </Text>

        <Text
          style={[styles.footerText, { color: colors.textTertiary }]}
        >
          Block Doomscrolling v1.0 — Arete. No data leaves your device.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
  },
  headerSub: {
    ...TYPOGRAPHY.caption,
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  cardTitle: {
    ...TYPOGRAPHY.h4,
    marginBottom: 4,
  },
  cardDesc: {
    ...TYPOGRAPHY.caption,
    lineHeight: 18,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  statusText: {
    ...TYPOGRAPHY.captionSm,
    fontWeight: "600",
  },
  statusAction: {
    ...TYPOGRAPHY.captionSm,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  sectionLabel: {
    ...TYPOGRAPHY.label,
    marginBottom: 8,
    marginTop: 8,
  },
  permissionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  permissionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  permissionTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: "600",
  },
  permissionDesc: {
    ...TYPOGRAPHY.caption,
    marginTop: 2,
    lineHeight: 16,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    ...TYPOGRAPHY.captionSm,
    fontWeight: "700",
  },
  appRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  appName: {
    ...TYPOGRAPHY.body,
  },
  disclaimerCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  disclaimerText: {
    ...TYPOGRAPHY.caption,
    flex: 1,
    lineHeight: 18,
  },
  tapToRefresh: {
    ...TYPOGRAPHY.captionSm,
    textAlign: "center",
    marginTop: 12,
    textDecorationLine: "underline",
  },
  footerText: {
    ...TYPOGRAPHY.captionSm,
    textAlign: "center",
    marginTop: 12,
  },
});
