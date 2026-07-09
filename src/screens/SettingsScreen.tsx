import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card } from "../components/Card";
import { useStore } from "../store";
import { useTheme } from "../context/ThemeContext";
import { today, formatDate } from "../types";
import { exportToFile, shareBackup } from "../services/exportImport";
import {
  getAllScheduled,
  saveSchedule,
  requestNotificationPermissions,
} from "../services/notifications";

export default function SettingsScreen() {
  const { theme, isDark, toggle: toggleTheme } = useTheme();
  const setSidebarOpen = useStore((s) => s.setSidebarOpen);
  const streak = useStore((s) => s.streak);
  const monthlyStats = useStore((s) => s.monthlyStats);

  const [exporting, setExporting] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [notifLoading, setNotifLoading] = useState(false);

  const colors = theme.colors;

  useEffect(() => {
    getAllScheduled().then((n) => {
      const prayer = n.filter((x) => x.type === "prayer");
      setNotifEnabled(prayer.some((p) => p.enabled));
    });
  }, []);

  const handleExport = async () => {
    setExporting(true);
    const ok = await exportToFile();
    setExporting(false);
    if (ok) {
      Alert.alert("Exported!", "Your data has been exported and shared.");
    } else {
      Alert.alert("Error", "Export failed. Try again.");
    }
  };

  const handleShare = async () => {
    setExporting(true);
    const ok = await shareBackup();
    setExporting(false);
    if (ok) {
      Alert.alert("Shared!", "Your backup is ready.");
    }
  };

  const handleNotifToggle = async (val: boolean) => {
    setNotifLoading(true);
    setNotifEnabled(val);
    const saved = await getAllScheduled();
    const updated = saved.map((n) => ({ ...n, enabled: val }));
    await saveSchedule(updated);
    if (val) {
      await requestNotificationPermissions();
      Alert.alert("Notifications enabled", "Prayer and habit reminders will appear.");
    } else {
      Alert.alert("Notifications disabled", "You can re-enable anytime.");
    }
    setNotifLoading(false);
  };

  const s = theme.spacing;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.bg }}
      edges={["top"]}
    >
      <View
        style={[
          styles.header,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity
          onPress={() => setSidebarOpen(true)}
          style={{ padding: 8 }}
        >
          <Feather name="menu" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            color: colors.text,
            marginLeft: 8,
          }}
        >
          Settings
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: s.md, gap: s.md, paddingBottom: 60 }}
      >
        {/* ── Theme ── */}
        <Card title="Appearance" style={{ backgroundColor: colors.card }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 8,
            }}
          >
            <Text style={{ color: colors.text, fontSize: 13 }}>Dark Mode</Text>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{
                false: colors.border,
                true: colors.accent,
              }}
              thumbColor={isDark ? colors.accent : colors.muted}
            />
          </View>
        </Card>

        {/* ── Profile ── */}
        <Card
          title="Profile"
          style={{
            backgroundColor: colors.card,
            borderLeftColor: colors.accent,
          }}
        >
          <View style={styles.profileRow}>
            <View
              style={[
                styles.avatar,
                { backgroundColor: colors.accent },
              ]}
            >
              <Text style={styles.avatarText}>H</Text>
            </View>
            <View>
              <Text style={{ color: colors.heading, fontSize: 16, fontWeight: "600" }}>
                Hasan Adeeb
              </Text>
              <Text style={{ color: colors.textTertiary, fontSize: 12 }}>
                Your Second Brain
              </Text>
            </View>
          </View>
        </Card>

        {/* ── Stats ── */}
        <Card title="Your Stats" style={{ backgroundColor: colors.card }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingVertical: 8,
              borderBottomWidth: 1,
              borderBottomColor: colors.divider,
            }}
          >
            <Text style={{ color: colors.text, fontSize: 13 }}>Streak</Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Feather name="zap" size={14} color={colors.warning} />
              <Text
                style={{
                  color: colors.text,
                  fontWeight: "600",
                }}
              >
                {streak} days
              </Text>
            </View>
          </View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingVertical: 8,
              borderBottomWidth: 1,
              borderBottomColor: colors.divider,
            }}
          >
            <Text style={{ color: colors.text, fontSize: 13 }}>Today</Text>
            <Text style={{ color: colors.text, fontWeight: "600" }}>
              {formatDate(today())}
            </Text>
          </View>
          {monthlyStats && (
            <>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingVertical: 8,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.divider,
                }}
              >
                <Text style={{ color: colors.text, fontSize: 13 }}>
                  Days tracked this month
                </Text>
                <Text style={{ color: colors.text, fontWeight: "600" }}>
                  {monthlyStats.days_tracked}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingVertical: 8,
                }}
              >
                <Text style={{ color: colors.text, fontSize: 13 }}>
                  Avg mood
                </Text>
                <Text style={{ color: colors.text, fontWeight: "600" }}>
                  {monthlyStats.avg_mood
                    ? `${"•".repeat(Math.round(monthlyStats.avg_mood))}${"○".repeat(
                        5 - Math.round(monthlyStats.avg_mood)
                      )}`
                    : "—"}
                </Text>
              </View>
            </>
          )}
        </Card>

        {/* ── Export / Import ── */}
        <Card title="Data" style={{ backgroundColor: colors.card }}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.accentBg }]}
            onPress={handleExport}
            disabled={exporting}
          >
            {exporting ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Feather name="download" size={16} color={colors.accent} />
            )}
            <Text
              style={{
                color: colors.accent,
                fontWeight: "600",
                fontSize: 13,
              }}
            >
              {exporting ? "Exporting..." : "Export & Share"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.successBg }]}
            onPress={handleShare}
            disabled={exporting}
          >
            <Feather name="share-2" size={16} color={colors.success} />
            <Text
              style={{
                color: colors.success,
                fontWeight: "600",
                fontSize: 13,
              }}
            >
              Share Backup
            </Text>
          </TouchableOpacity>
        </Card>

        {/* ── Notifications ── */}
        <Card title="Notifications" style={{ backgroundColor: colors.card }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 8,
            }}
          >
            <Text style={{ color: colors.text, fontSize: 13 }}>
              Prayer & Habit Reminders
            </Text>
            <Switch
              value={notifEnabled}
              onValueChange={handleNotifToggle}
              trackColor={{
                false: colors.border,
                true: colors.success,
              }}
              thumbColor={notifEnabled ? colors.success : colors.muted}
            />
          </View>
          {notifLoading && (
            <ActivityIndicator
              size="small"
              color={colors.accent}
              style={{ marginTop: 8 }}
            />
          )}
        </Card>

        {/* ── About ── */}
        <Card title="About" style={{ backgroundColor: colors.card }}>
          <Text
            style={{
              color: colors.textTertiary,
              fontSize: 13,
              lineHeight: 20,
              marginBottom: 8,
            }}
          >
            A minimal second brain for tracking life — weight, water, steps, mood,
            prayers, gym, food, budget, and more. All data lives on your device in
            SQLite with periodic backups.
          </Text>
          <Text
            style={{
              color: colors.muted,
              fontSize: 11,
              textAlign: "center",
              marginTop: 8,
            }}
          >
            v1.0 · Built by shaz
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 48,
    borderBottomWidth: 1,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 20, fontWeight: "700" },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
});