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
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card } from "../components/Card";
import { Icon, getIconName } from "../components/Icons";
import { LUCIDE_ICONS, TYPOGRAPHY } from "../constants/typography";
import { useStore } from "../store";
import { useTheme } from "../context/ThemeContext";
import { today, formatDate } from "../types";
import {
  exportToFile,
  shareBackup,
  importFromJSON,
  formatImportResult,
  importFromFile,
  type ImportResult,
} from "../services/exportImport";
import { verifySeedData, formatSeedResult, type SeedResult } from "../data/seedData";
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
  const seedDatabase = useStore((s) => s.seedDatabase);
  const wipeDatabase = useStore((s) => s.wipeDatabase);
  const deleting = useStore((s) => s.deleting);
  const refresh = useStore((s) => s.refresh);
  const userProfile = useStore((s) => s.userProfile);

  const [exporting, setExporting] = useState(false);
  const [notifications, setNotifications] = useState<ScheduledNotification[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [seedBusy, setSeedBusy] = useState(false);
  const [lastSeed, setLastSeed] = useState<SeedResult | null>(null);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);

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

  const handleImportClick = () => {
    Alert.alert(
      "Import Backup?",
      "This will REPLACE every row in the database with the contents of the backup file. This cannot be undone.\n\nTip: Export your current data first if you want to keep it.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          onPress: () => {
            setImportText("");
            setImportModalVisible(true);
          },
        },
      ],
    );
  };

  const handleImportSubmit = async () => {
    const trimmed = importText.trim();
    if (!trimmed) {
      Alert.alert("Empty Input", "Paste the backup JSON content first.");
      return;
    }
    setImporting(true);
    let result: ImportResult;
    try {
      result = await importFromJSON(trimmed);
    } catch (e) {
      result = {
        success: false,
        imported: {},
        totalRows: 0,
        duration_ms: 0,
        error: (e as Error).message,
      };
    }
    setImporting(false);
    setImportModalVisible(false);
    setImportText("");

    if (result.success) {
      Alert.alert("Import Complete", formatImportResult(result), [
        {
          text: "Refresh Dashboard",
          onPress: async () => {
            try {
              await refresh();
            } catch {}
          },
        },
        { text: "OK" },
      ]);
      // Auto-refresh the store so all screens reflect the new data
      try {
        await refresh();
      } catch {}
    } else {
      Alert.alert("Import Failed", result.error ?? "Unknown error");
    }
  };

  const handleImportCancel = () => {
    setImportModalVisible(false);
    setImportText("");
  };

  const handleUploadFile = async () => {
    setImporting(true);
    try {
      const result = await importFromFile();
      setImporting(false);
      if (result.success) {
        // Refresh the store FIRST so all screens see the imported data
        await refresh();
        Alert.alert(
          "Upload Complete",
          `Imported ${result.totalRows} rows from ${Object.keys(result.imported).filter(k => result.imported[k] > 0).length} tables.`,
          [
            { text: "Refresh Dashboard", onPress: () => refresh() },
            { text: "OK" },
          ],
        );
      } else if (result.error !== "No file selected.") {
        Alert.alert("Import Failed", result.error);
      }
    } catch (e) {
      setImporting(false);
      Alert.alert("Error", (e as Error).message);
    }
  };

  // ── Test Data / Seeding handlers ──────────────────────────────────────
  const runSeedAction = async (opts: { days: number; force: boolean }) => {
    setSeedBusy(true);
    try {
      const result = await seedDatabase(opts);
      setLastSeed(result);
      Alert.alert(
        opts.force ? "Reset & Seed Complete" : "Seed Complete",
        formatSeedResult(result),
      );
    } catch (e) {
      Alert.alert("Seed Failed", (e as Error).message);
    } finally {
      setSeedBusy(false);
    }
  };

  const handleSeed = () => {
    Alert.alert(
      "Seed Test Data?",
      "This will populate every table with 14 days of realistic dummy data. Tables that already have data will be skipped.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Seed (2 weeks)",
          onPress: () => runSeedAction({ days: 14, force: false }),
        },
        {
          text: "Seed 30 days",
          onPress: () => runSeedAction({ days: 30, force: false }),
        },
      ],
    );
  };

  const handleDeleteData = () => {
    Alert.alert(
      "Delete Your Data?",
      "This will permanently delete EVERY row from every table — daily logs, transactions, journal, prayers, habits, goals, focus sessions, AI programs, everything.\n\nPreserved: AI provider API keys (so you don't have to re-enter them).\n\nThis cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Everything",
          style: "destructive",
          onPress: async () => {
            setSeedBusy(true);
            try {
              await wipeDatabase();
              setLastSeed(null);
              Alert.alert(
                "Data Deleted",
                "All rows have been wiped. The database is now empty (except your AI provider keys).\n\nUse \"Show Table Counts\" to verify, or tap \"Seed Test Data\" to repopulate.",
              );
            } catch (e) {
              Alert.alert("Delete Failed", (e as Error).message);
            } finally {
              setSeedBusy(false);
            }
          },
        },
      ],
    );
  };

  const handleShowCounts = async () => {
    const counts = await verifySeedData();
    const lines = Object.entries(counts)
      .map(([t, n]) => `${t}: ${n}`)
      .join("\n");
    Alert.alert("Database Row Counts", lines || "No data");
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
          <Icon name={LUCIDE_ICONS.menu} size={20} color={colors.text} />
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
              <Text style={styles.avatarText}>
                {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: colors.heading,
                  fontSize: 16,
                  fontWeight: "600",
                }}
              >
                {userProfile?.name || 'Set up your profile'}
              </Text>
              <Text style={{ color: colors.textTertiary, fontSize: 12 }}>
                {userProfile?.weight_kg ? `${userProfile.weight_kg} kg` : 'Add your stats'}
                {userProfile?.height_cm ? ` · ${userProfile.height_cm} cm` : ''}
              </Text>
            </View>
            <Icon
              name={LUCIDE_ICONS.chevronRight}
              size={18}
              color={colors.textTertiary}
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
              <Icon name={LUCIDE_ICONS.zap} size={14} color={colors.warning} />
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
                    <Icon name={getIconName(group.icon)} size={16} color={colors.textSecondary} />
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
                    <Icon
                      name={
                        expandedGroup === group.type
                          ? LUCIDE_ICONS.chevronDown
                          : LUCIDE_ICONS.chevronRight
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
              <Icon name={LUCIDE_ICONS.download} size={16} color={colors.accent} />
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
            <Icon name={LUCIDE_ICONS.share2} size={16} color={colors.success} />
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
          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: colors.bgSecondary },
            ]}
            onPress={handleUploadFile}
          >
            {importing ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Icon name={LUCIDE_ICONS.fileText} size={16} color={colors.accent} />
            )}
            <Text
              style={{
                color: colors.accent,
                fontWeight: "600",
                fontSize: 13,
              }}
            >
              {importing ? "Uploading…" : "Upload JSON File"}
            </Text>
          </TouchableOpacity>
        </Card>

        {/* ── Test Data (developer / UI testing) ── */}
        <Card title="Test Data" style={{ backgroundColor: colors.card }}>
          <Text
            style={{
              color: colors.textTertiary,
              fontSize: 11,
              marginBottom: 8,
              lineHeight: 16,
            }}
          >
            Populate the database with realistic dummy data for UI testing.
            Tables that already have data are skipped. Prayer timings are
            always fetched live from the API.
          </Text>
          {lastSeed && (
            <Text
              style={{
                color: colors.textTertiary,
                fontSize: 10,
                marginBottom: 6,
                fontStyle: "italic",
              }}
            >
              Last run: {lastSeed.days}d{lastSeed.force ? " (force)" : ""} ·{" "}
              {lastSeed.duration_ms}ms ·{" "}
              {Object.values(lastSeed.counts).reduce((a, b) => a + b, 0)} rows
            </Text>
          )}
          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: colors.accentBg, opacity: seedBusy ? 0.6 : 1 },
            ]}
            onPress={handleSeed}
            disabled={seedBusy}
          >
            {seedBusy ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Icon name={LUCIDE_ICONS.database} size={16} color={colors.accent} />
            )}
            <Text
              style={{
                color: colors.accent,
                fontWeight: "600",
                fontSize: 13,
              }}
            >
              {seedBusy ? "Seeding…" : "Seed Test Data"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: colors.errorBg, opacity: (seedBusy || deleting) ? 0.6 : 1 },
            ]}
            onPress={handleDeleteData}
            disabled={seedBusy || deleting}
          >
            {deleting ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <Icon name={LUCIDE_ICONS.trash2} size={16} color={colors.error} />
            )}
            <Text
              style={{
                color: colors.error,
                fontWeight: "600",
                fontSize: 13,
              }}
            >
              {deleting ? "Deleting…" : "Delete Your Data"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: colors.divider || "#f1f5f9" },
            ]}
            onPress={handleShowCounts}
          >
            <Icon name={LUCIDE_ICONS.list} size={16} color={colors.text} />
            <Text
              style={{
                color: colors.text,
                fontWeight: "600",
                fontSize: 13,
              }}
            >
              Show Table Counts
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

      {/* ── Import Data Modal ────────────────────────────────────────── */}
      <Modal
        visible={importModalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleImportCancel}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={[styles.modalBackdrop]}
        >
          <View
            style={[styles.modalCard, { backgroundColor: colors.card }]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.heading }]}>
                Import Backup
              </Text>
              <TouchableOpacity
                onPress={handleImportCancel}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name={LUCIDE_ICONS.x} size={22} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Text
              style={[
                styles.modalSubtitle,
                { color: colors.textTertiary },
              ]}
            >
              Paste the full JSON backup content below. Every existing row
              will be replaced.
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  color: colors.text,
                  backgroundColor: colors.bgSecondary,
                  borderColor: colors.border,
                },
              ]}
              value={importText}
              onChangeText={setImportText}
              placeholder='{"meta":{"version":"1.1.0",...},"tables":{...}}'
              placeholderTextColor={colors.textTertiary}
              multiline
              autoCorrect={false}
              autoCapitalize="none"
              spellCheck={false}
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  { backgroundColor: colors.bgSecondary },
                ]}
                onPress={handleImportCancel}
                disabled={importing}
              >
                <Text style={{ color: colors.text, fontWeight: "600" }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  {
                    backgroundColor: colors.accent,
                    opacity: importing ? 0.6 : 1,
                  },
                ]}
                onPress={handleImportSubmit}
                disabled={importing}
              >
                {importing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "700" }}>
                    Import
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  avatarText: { color: "#fff", ...TYPOGRAPHY.h2 },
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

  // ── Import Modal ──
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 32,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  modalTitle: {
    ...TYPOGRAPHY.h3,
  },
  modalSubtitle: {
    ...TYPOGRAPHY.caption,
    lineHeight: 17,
    marginBottom: 14,
  },
  modalInput: {
    minHeight: 180,
    maxHeight: 320,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    ...TYPOGRAPHY.captionSm,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
