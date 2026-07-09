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
  applySchedule,
  getNotificationGroups,
  type ScheduledNotification,
  type NotifGroup,
} from "../services/notifications";

export default function SettingsScreen() {
  const { theme, isDark, toggle: toggleTheme } = useTheme();
  const setSidebarOpen = useStore((s) => s.setSidebarOpen);
  const setCurrentRoute = useStore((s) => s.setCurrentRoute);
  const streak = useStore((s) => s.streak);
  const monthlyStats = useStore((s) => s.monthlyStats);

  const [exporting, setExporting] = useState(false);
  const [notifications, setNotifications] = useState<ScheduledNotification[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const colors = theme.colors;

  useEffect(() => {
    getAllScheduled().then((n) => {
      setNotifications(n);
      setLoading(false);
    });
  }, []);

  const handleGroupToggle = async (group: NotifGroup, val: boolean) => {
    const updated = notifications.map((n) =>
      n.type === group.type ? { ...n, enabled: val } : n,
    );
    setNotifications(updated);
    await saveSchedule(updated);
    await applySchedule(updated);
  };

  const handleNotifToggle = async (id: string, val: boolean) => {
    const updated = notifications.map((n) =>
      n.id === id ? { ...n, enabled: val } : n,
    );
    setNotifications(updated);
    await saveSchedule(updated);
    await applySchedule(updated);
  };

  const groups = getNotificationGroups(notifications);

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

  const s = theme.spacing;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.bg }}
      edges={["top"]}
    >
      {/* Header */}
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
        {/* ── Profile ── */}
        <Card title="Profile" style={{ backgroundColor: colors.card }}>
          <TouchableOpacity
            style={styles.profileRow}
            onPress={() => {
              setCurrentRoute("Profile");
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
              <Text style={styles.avatarText}>H</Text>
            </View>
            <View>
              <Text
                style={{
                  color: colors.heading,
                  fontSize: 16,
                  fontWeight: "600",
                }}
              >
                Hasan Adeeb
              </Text>
              <Text style={{ color: colors.textTertiary, fontSize: 12 }}>
                Your Second Brain
              </Text>
            </View>
            <Feather
              name="chevron-right"
              size={18}
              color={colors.textTertiary}
              style={{ marginLeft: "auto" }}
            />
          </TouchableOpacity>
        </Card>

        {/* ── Stats ── */}
        <Card title="Your Stats" style={{ backgroundColor: colors.card }}>
          <View style={[styles.statRow, { borderBottomColor: colors.divider }]}>
            <Text style={{ color: colors.text, fontSize: 13 }}>Streak</Text>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Feather name="zap" size={14} color={colors.warning} />
              <Text style={{ color: colors.text, fontWeight: "600" }}>
                {streak} days
              </Text>
            </View>
          </View>
          <View style={[styles.statRow, { borderBottomColor: colors.divider }]}>
            <Text style={{ color: colors.text, fontSize: 13 }}>Today</Text>
            <Text style={{ color: colors.text, fontWeight: "600" }}>
              {formatDate(today())}
            </Text>
          </View>
          {monthlyStats && (
            <>
              <View
                style={[styles.statRow, { borderBottomColor: colors.divider }]}
              >
                <Text style={{ color: colors.text, fontSize: 13 }}>
                  Days tracked this month
                </Text>
                <Text style={{ color: colors.text, fontWeight: "600" }}>
                  {monthlyStats.days_tracked}
                </Text>
              </View>
              <View style={styles.statRow}>
                <Text style={{ color: colors.text, fontSize: 13 }}>
                  Avg mood
                </Text>
                <Text style={{ color: colors.text, fontWeight: "600" }}>
                  {monthlyStats.avg_mood
                    ? `${"•".repeat(Math.round(monthlyStats.avg_mood))}${"○".repeat(
                        5 - Math.round(monthlyStats.avg_mood),
                      )}`
                    : "—"}
                </Text>
              </View>
            </>
          )}
        </Card>

        {/* ── Notifications ── */}
        <Card title="Notifications" style={{ backgroundColor: colors.card }}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            groups.map((group) => (
              <View key={group.type}>
                <View
                  style={[
                    styles.notifGroupRow,
                    { borderBottomColor: colors.divider },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.notifGroupLeft}
                    onPress={() =>
                      setExpandedGroup(
                        expandedGroup === group.type ? null : group.type,
                      )
                    }
                    activeOpacity={0.7}
                  >
                    <Text style={{ fontSize: 16 }}>{group.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: colors.text,
                          fontSize: 13,
                          fontWeight: "500",
                        }}
                      >
                        {group.label}
                      </Text>
                      <Text
                        style={{ color: colors.textTertiary, fontSize: 11 }}
                      >
                        {group.notifications.length} notification
                        {group.notifications.length > 1 ? "s" : ""}
                        {group.enabled ? " · Active" : " · Off"}
                      </Text>
                    </View>
                    <Feather
                      name={
                        expandedGroup === group.type
                          ? "chevron-down"
                          : "chevron-right"
                      }
                      size={16}
                      color={colors.textTertiary}
                    />
                  </TouchableOpacity>
                  <Switch
                    value={group.enabled}
                    onValueChange={(v) => handleGroupToggle(group, v)}
                    trackColor={{
                      false: colors.border,
                      true: colors.success,
                    }}
                    thumbColor={group.enabled ? colors.success : colors.muted}
                  />
                </View>

                {expandedGroup === group.type && (
                  <View style={styles.notifSubList}>
                    {group.notifications.map((n) => (
                      <View
                        key={n.id}
                        style={[
                          styles.notifSubRow,
                          { borderBottomColor: colors.divider },
                        ]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              color: colors.text,
                              fontSize: 13,
                            }}
                          >
                            {n.title}
                          </Text>
                          <Text
                            style={{
                              color: colors.textTertiary,
                              fontSize: 11,
                            }}
                          >
                            {`${n.hour.toString().padStart(2, "0")}:${n.minute
                              .toString()
                              .padStart(
                                2,
                                "0",
                              )} · ${n.days?.length ?? 7} days/week`}
                          </Text>
                        </View>
                        <Switch
                          value={n.enabled}
                          onValueChange={(v) => handleNotifToggle(n.id, v)}
                          trackColor={{
                            false: colors.border,
                            true: colors.accent,
                          }}
                          thumbColor={n.enabled ? colors.accent : colors.muted}
                        />
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))
          )}
        </Card>

        {/* ── Data ── */}
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
            A minimal second brain for tracking life — weight, water, steps,
            mood, prayers, gym, food, budget, and more. All data lives on your
            device in SQLite with periodic backups.
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
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  notifGroupRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 8,
  },
  notifGroupLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  notifSubList: {
    paddingLeft: 26,
    paddingTop: 4,
  },
  notifSubRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 8,
  },
});
