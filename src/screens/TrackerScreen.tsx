import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";
import { Card } from "../components/Card";
import { BarChart, ProgressRing } from "../components/Charts";
import * as db from "../db/service";

type Tab =
  | "overview"
  | "weight"
  | "water"
  | "steps"
  | "sleep"
  | "mood"
  | "habits";

const TABS: { key: Tab; label: string; icon: string; color: string }[] = [
  { key: "overview", label: "Today", icon: "📊", color: "#6366f1" },
  { key: "weight", label: "Weight", icon: "⚖️", color: "#0b6bcf" },
  { key: "water", label: "Water", icon: "💧", color: "#0ea5e9" },
  { key: "steps", label: "Steps", icon: "🚶", color: "#f59e0b" },
  { key: "sleep", label: "Sleep", icon: "🌙", color: "#8b5cf6" },
  { key: "mood", label: "Mood", icon: "😊", color: "#f97316" },
  { key: "habits", label: "Habits", icon: "✅", color: "#0891b2" },
];

function today(): string {
  return new Date().toISOString().split("T")[0];
}

export default function TrackerScreen() {
  const {
    setSidebarOpen,
    dailyLog,
    logWeight,
    logWater,
    logSteps,
    logMood,
    logSleep,
  } = useApp();
  const { theme, isDark } = useTheme();
  const tc = theme.colors;
  const [active, setActive] = useState<Tab>("overview");
  const [weight, setWeight] = useState("");
  const [sleepH, setSleepH] = useState("");

  // ── Loaded state ──
  const [loaded, setLoaded] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [habits, setHabits] = useState<any[]>([]);
  const [habitLogs, setHabitLogs] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      db.getAllDailyLogs(),
      db.getAllNutritionLogs(),
      db.getHabits(),
      db.getHabitLogs(),
    ]).then(([l, n, h, hl]) => {
      setLogs(l);
      setHabits(h);
      setHabitLogs(hl);
      setLoaded(true);
    });
  }, []);

  // ── 7-day week data for charts ──
  const week = useMemo(() => {
    if (!loaded || !logs.length)
      return { weights: [], waters: [], steps: [], moods: [], sleep: [] };
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        label: weekDays[d.getDay()],
        date: d.toISOString().split("T")[0],
      };
    });
    return {
      weights: days.map((d) => ({
        label: d.label,
        value: logs.find((l) => l.date === d.date)?.weight ?? 0,
      })),
      waters: days.map((d) => ({
        label: d.label,
        value: logs.find((l) => l.date === d.date)?.water_ml ?? 0,
      })),
      steps: days.map((d) => ({
        label: d.label,
        value: logs.find((l) => l.date === d.date)?.steps ?? 0,
      })),
      moods: days.map((d) => ({
        label: d.label,
        value: logs.find((l) => l.date === d.date)?.mood ?? 0,
      })),
      sleep: days.map((d) => ({
        label: d.label,
        value: logs.find((l) => l.date === d.date)?.sleep_hours ?? 0,
      })),
    };
  }, [loaded, logs]);

  // Theme-mapped color tokens (preserve original hex in light mode)
  const T = {
    bg: isDark ? tc.bg : "#f8f9fa",
    surface: isDark ? tc.surface : "#ffffff",
    surfaceAlt: isDark ? tc.bgSecondary : "#f8fafc",
    border: isDark ? tc.border : "#e2e8f0",
    borderSoft: isDark ? tc.borderLight : "#f1f5f9",
    borderMuted: isDark ? tc.divider : "#f0f0f0",
    textPrimary: isDark ? tc.heading : "#1e293b",
    textSecondary: isDark ? tc.textSecondary : "#475569",
    textTertiary: isDark ? tc.textTertiary : "#64748b",
    textMuted: isDark ? tc.textTertiary : "#94a3b8",
    accent: isDark ? tc.accent : "#6366f1",
    accentBg: isDark ? tc.accentBg : "#f0fdf4",
    successBorder: isDark ? tc.success : "#22c55e",
    pillBg: isDark ? tc.bgSecondary : "#f1f5f9",
    placeholder: isDark ? tc.placeholder : "#94a3b8",
    sleepBg: isDark ? tc.bgSecondary : "#e8d9ff",
    waterBg: isDark ? tc.infoBg : "#e0f2fe",
    moodBg: isDark ? tc.warningBg : "#fef3c7",
    moodBorder: isDark ? tc.warning : "#f97316",
  };

  if (!loaded) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={["top"]}>
        <View
          style={[
            styles.header,
            { backgroundColor: T.surface, borderBottomColor: T.borderSoft },
          ]}
        >
          <TouchableOpacity onPress={() => setSidebarOpen(true)}>
            <Text style={{ fontSize: 22, color: T.textPrimary }}>☰</Text>
          </TouchableOpacity>
          <Text style={{ marginLeft: 8, color: T.textPrimary }}>
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={["top"]}>
      <View
        style={[
          styles.header,
          { backgroundColor: T.surface, borderBottomColor: T.borderSoft },
        ]}
      >
        <TouchableOpacity
          onPress={() => setSidebarOpen(true)}
          style={styles.hamburger}
        >
          <Text style={{ fontSize: 20, color: T.textPrimary }}>☰</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: T.textPrimary }]}>
          {todayStr}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[
          styles.tabBar,
          { backgroundColor: T.surface, borderBottomColor: T.borderMuted },
        ]}
      >
        <View style={{ flexDirection: "row", padding: 12, gap: 6 }}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[
                styles.pill,
                { backgroundColor: T.pillBg, borderColor: T.border },
                active === t.key && {
                  backgroundColor: t.color + "20",
                  borderColor: t.color,
                },
              ]}
              onPress={() => setActive(t.key)}
            >
              <Text style={{ fontSize: 13 }}>{t.icon}</Text>
              <Text
                style={[
                  styles.pillLabel,
                  { color: T.textSecondary },
                  active === t.key && { color: t.color, fontWeight: "600" },
                ]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 80, gap: 20 }}
      >
        {/* ─── OVERVIEW ─── */}
        {active === "overview" && (
          <View>
            <Text style={[styles.tabTitle, { color: T.textMuted }]}>
              Today's stats
            </Text>
            <View style={{ gap: 12 }}>
              <View
                style={[
                  styles.statRow,
                  { backgroundColor: T.surface, borderColor: T.borderSoft },
                ]}
              >
                <View
                  style={[styles.statIcon, { backgroundColor: "#0b6bcf20" }]}
                >
                  <Text>⚖️</Text>
                </View>
                <View style={styles.statData}>
                  <Text style={[styles.statLabel, { color: T.textTertiary }]}>
                    Weight
                  </Text>
                  <Text style={[styles.statVal, { color: "#0b6bcf" }]}>
                    {dailyLog?.weight || 0} kg
                  </Text>
                </View>
                <BarChart
                  data={[{ label: "Mon", value: dailyLog?.weight ?? 0 }]}
                  height={64}
                  barWidth={48}
                  showValues={false}
                  accentColor="#0b6bcf"
                />
              </View>
              <View
                style={[
                  styles.statRow,
                  { backgroundColor: T.surface, borderColor: T.borderSoft },
                ]}
              >
                <View
                  style={[styles.statIcon, { backgroundColor: "#0ea5e920" }]}
                >
                  <Text>💧</Text>
                </View>
                <View style={styles.statData}>
                  <Text style={[styles.statLabel, { color: T.textTertiary }]}>
                    Water
                  </Text>
                  <Text style={[styles.statVal, { color: "#0ea5e9" }]}>
                    {(dailyLog?.water_ml || 0) / 250} cups
                  </Text>
                </View>
                <View style={[styles.miniTrendRow, { height: 16 }]}>
                  {week.waters.slice(-7).map((w, i) => (
                    <View
                      key={i}
                      style={[
                        styles.trendDot,
                        {
                          backgroundColor: T.border,
                          opacity:
                            0.2 +
                            (w.value /
                              Math.max(...week.waters.map((x) => x.value), 1)) *
                              0.8,
                        },
                      ]}
                    />
                  ))}
                </View>
              </View>
              <View
                style={[
                  styles.statRow,
                  { backgroundColor: T.surface, borderColor: T.borderSoft },
                ]}
              >
                <View
                  style={[styles.statIcon, { backgroundColor: "#f59e0b20" }]}
                >
                  <Text>🚶</Text>
                </View>
                <View style={styles.statData}>
                  <Text style={[styles.statLabel, { color: T.textTertiary }]}>
                    Steps
                  </Text>
                  <Text style={[styles.statVal, { color: "#f59e0b" }]}>
                    {(dailyLog?.steps || 0).toLocaleString()}
                  </Text>
                </View>
                <View style={[styles.miniTrendRow, { height: 16 }]}>
                  {week.steps.slice(-7).map((w, i) => (
                    <View
                      key={i}
                      style={[
                        styles.trendDot,
                        {
                          backgroundColor: T.border,
                          opacity:
                            0.2 +
                            (w.value /
                              Math.max(...week.steps.map((x) => x.value), 1)) *
                              0.8,
                        },
                      ]}
                    />
                  ))}
                </View>
              </View>
              <View
                style={[
                  styles.statRow,
                  { backgroundColor: T.surface, borderColor: T.borderSoft },
                ]}
              >
                <View
                  style={[styles.statIcon, { backgroundColor: "#8b5cf620" }]}
                >
                  <Text>😊</Text>
                </View>
                <View style={styles.statData}>
                  <Text style={[styles.statLabel, { color: T.textTertiary }]}>
                    Mood
                  </Text>
                  <Text style={[styles.statVal, { color: "#8b5cf6" }]}>
                    {dailyLog?.mood || 0}/5
                  </Text>
                </View>
                <View style={[styles.miniTrendRow, { height: 16 }]}>
                  {week.moods.slice(-7).map((w, i) => (
                    <View
                      key={i}
                      style={[
                        styles.trendDot,
                        {
                          backgroundColor: T.border,
                          opacity:
                            0.2 +
                            (w.value /
                              Math.max(...week.moods.map((x) => x.value), 1)) *
                              0.8,
                        },
                      ]}
                    />
                  ))}
                </View>
              </View>
              <View
                style={[
                  styles.statRow,
                  { backgroundColor: T.surface, borderColor: T.borderSoft },
                ]}
              >
                <View
                  style={[styles.statIcon, { backgroundColor: "#6366f120" }]}
                >
                  <Text>🌙</Text>
                </View>
                <View style={styles.statData}>
                  <Text style={[styles.statLabel, { color: T.textTertiary }]}>
                    Sleep
                  </Text>
                  <Text style={[styles.statVal, { color: "#6366f1" }]}>
                    {dailyLog?.sleep_hours || 0} h
                  </Text>
                </View>
                <View style={[styles.miniTrendRow, { height: 16 }]}>
                  {week.sleep.slice(-7).map((w, i) => (
                    <View
                      key={i}
                      style={[
                        styles.trendDot,
                        {
                          backgroundColor: T.border,
                          opacity:
                            0.2 +
                            (w.value /
                              Math.max(...week.sleep.map((x) => x.value), 1)) *
                              0.8,
                        },
                      ]}
                    />
                  ))}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ─── WEIGHT ─── */}
        {active === "weight" && (
          <View>
            <Text style={[styles.tabTitle, { color: T.textMuted }]}>
              Weight
            </Text>
            <View style={styles.bigValRow}>
              <Text style={[styles.bigVal, { color: T.textPrimary }]}>
                {dailyLog?.weight ?? "—"}
              </Text>
              <Text style={{ fontSize: 14, color: T.textMuted }}>kg</Text>
            </View>
            <View style={styles.actionRow}>
              <TextInput
                style={[
                  styles.inp,
                  {
                    backgroundColor: T.surfaceAlt,
                    borderColor: T.border,
                    color: T.textPrimary,
                  },
                ]}
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
                placeholder="kg"
                placeholderTextColor={T.placeholder}
              />
              <TouchableOpacity
                style={styles.btn}
                onPress={() => {
                  const w = parseFloat(weight);
                  if (w > 0) {
                    logWeight(w);
                    setWeight("");
                  }
                }}
              >
                <Text style={styles.btnText}>Log</Text>
              </TouchableOpacity>
            </View>
            <View style={{ marginTop: 12 }}>
              <Text style={[styles.trendLabel, { color: T.textMuted }]}>
                7-day trend
              </Text>
              <BarChart
                data={week.weights.map((w) => ({
                  label: w.label,
                  value: w.value,
                  color: "#0b6bcf",
                }))}
                height={120}
                barWidth={48}
                showValues={false}
                accentColor="#0b6bcf"
              />
            </View>
          </View>
        )}

        {/* ─── WATER ─── */}
        {active === "water" && (
          <View>
            <Text style={[styles.tabTitle, { color: T.textMuted }]}>Water</Text>
            <View style={styles.bigValRow}>
              <Text style={[styles.bigVal, { color: "#0ea5e9" }]}>
                {dailyLog?.water_ml
                  ? `${(dailyLog.water_ml / 1000).toFixed(1)}L`
                  : "0L"}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
                justifyContent: "center",
                marginVertical: 8,
              }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.waterCup,
                    { backgroundColor: T.surfaceAlt, borderColor: T.border },
                    (dailyLog?.water_ml ?? 0) >= i * 250 && {
                      backgroundColor: T.waterBg,
                      borderColor: "#0ea5e9",
                    },
                  ]}
                  onPress={() => logWater(i * 250)}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "500",
                      color: T.textPrimary,
                    }}
                  >
                    {i}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ marginTop: 12 }}>
              <Text style={[styles.trendLabel, { color: T.textMuted }]}>
                7-day trend
              </Text>
              <BarChart
                data={week.waters.map((w) => ({
                  label: w.label,
                  value: Math.round(w.value / 100),
                  color: "#0ea5e9",
                }))}
                height={120}
                barWidth={48}
                showValues={false}
                accentColor="#0ea5e9"
              />
            </View>
          </View>
        )}

        {/* ─── STEPS ─── */}
        {active === "steps" && (
          <View>
            <Text style={[styles.tabTitle, { color: T.textMuted }]}>Steps</Text>
            <View style={styles.bigValRow}>
              <Text style={[styles.bigVal, { color: "#f59e0b" }]}>
                {dailyLog?.steps?.toLocaleString() ?? "0"}
              </Text>
              <Text style={{ fontSize: 14, color: T.textMuted }}>/ 10,000</Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                gap: 4,
                marginVertical: 12,
              }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.stepDot,
                    { backgroundColor: T.border },
                    (dailyLog?.steps ?? 0) >= i * 1000 && {
                      backgroundColor: "#f59e0b",
                    },
                  ]}
                />
              ))}
            </View>
            <View style={{ marginTop: 12 }}>
              <Text style={[styles.trendLabel, { color: T.textMuted }]}>
                7-day trend
              </Text>
              <BarChart
                data={week.steps.map((w) => ({
                  label: w.label,
                  value: Math.round(w.value / 100),
                  color: "#f59e0b",
                }))}
                height={120}
                barWidth={48}
                showValues={false}
                accentColor="#f59e0b"
              />
            </View>
          </View>
        )}

        {/* ─── SLEEP ─── */}
        {active === "sleep" && (
          <View>
            <Text style={[styles.tabTitle, { color: T.textMuted }]}>Sleep</Text>
            <View style={{ alignItems: "center", marginBottom: 16 }}>
              <ProgressRing
                value={dailyLog?.sleep_hours ?? 0}
                max={8}
                size={160}
                strokeWidth={14}
                color="#8b5cf6"
                bgColor={T.sleepBg}
                label={dailyLog?.sleep_hours ? `${dailyLog.sleep_hours}h` : "—"}
              />
            </View>
            <View style={styles.actionRow}>
              <TextInput
                style={[
                  styles.inp,
                  {
                    flex: 1,
                    backgroundColor: T.surfaceAlt,
                    borderColor: T.border,
                    color: T.textPrimary,
                  },
                ]}
                value={sleepH}
                onChangeText={setSleepH}
                keyboardType="numeric"
                placeholder="Hours slept"
                placeholderTextColor={T.placeholder}
              />
              <TouchableOpacity
                style={styles.btn}
                onPress={() => {
                  const h = parseFloat(sleepH);
                  if (h >= 0 && h <= 24) {
                    logSleep(h, 3);
                    setSleepH("");
                  }
                }}
              >
                <Text style={styles.btnText}>Log</Text>
              </TouchableOpacity>
            </View>
            <View style={{ marginTop: 12 }}>
              <Text style={[styles.trendLabel, { color: T.textMuted }]}>
                7-day trend
              </Text>
              <BarChart
                data={week.sleep.map((w) => ({
                  label: w.label,
                  value: Math.round(w.value * 10),
                  color: "#8b5cf6",
                }))}
                height={120}
                barWidth={48}
                showValues={false}
                accentColor="#8b5cf6"
              />
            </View>
          </View>
        )}

        {/* ─── MOOD ─── */}
        {active === "mood" && (
          <View>
            <Text style={[styles.tabTitle, { color: T.textMuted }]}>Mood</Text>
            <View
              style={{
                flexDirection: "row",
                gap: 8,
                justifyContent: "center",
                marginVertical: 8,
              }}
            >
              {[1, 2, 3, 4, 5].map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[
                    styles.moodBtn,
                    { backgroundColor: T.surfaceAlt, borderColor: T.border },
                    dailyLog?.mood === m && {
                      backgroundColor: T.moodBg,
                      borderColor: T.moodBorder,
                    },
                  ]}
                  onPress={() => logMood(m)}
                >
                  <Text style={{ fontSize: 28 }}>
                    {["😢", "😟", "😐", "🙂", "😊"][m - 1]}
                  </Text>
                  <Text style={{ fontSize: 11, color: T.textTertiary }}>
                    {["Awful", "Bad", "Meh", "Good", "Great"][m - 1]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ marginTop: 12 }}>
              <Text style={[styles.trendLabel, { color: T.textMuted }]}>
                7-day trend
              </Text>
              <BarChart
                data={week.moods.map((w) => ({
                  label: w.label,
                  value: Math.round(w.value * 20),
                  color: "#f97316",
                }))}
                height={120}
                barWidth={48}
                showValues={false}
                accentColor="#f97316"
              />
            </View>
          </View>
        )}

        {/* ─── HABITS ─── */}
        {active === "habits" && (
          <View>
            <Text style={[styles.tabTitle, { color: T.textMuted }]}>
              Habits
            </Text>
            {habits.map((h) => {
              const done = habitLogs.find(
                (l) => l.habit_id === h.id && l.date === today(),
              );
              const count = done?.count ?? 0;
              return (
                <View
                  key={h.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: T.borderSoft,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Text style={{ fontSize: 18 }}>{h.emoji}</Text>
                    <Text style={{ fontWeight: "600", color: T.textPrimary }}>
                      {h.name}
                    </Text>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Text style={{ color: T.textTertiary }}>
                      {count}/{h.target_per_day ?? 1}
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.habitPlus,
                        {
                          backgroundColor: T.accentBg,
                          borderColor: T.successBorder,
                        },
                      ]}
                      onPress={() =>
                        db.logHabit(h.id, today(), count + 1).then(() => {
                          db.getHabitLogs().then(setHabitLogs);
                        })
                      }
                    >
                      <Text
                        style={{
                          color: "#0891b2",
                          fontWeight: "700",
                          fontSize: 16,
                          textAlign: "center",
                        }}
                      >
                        +
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ── Header ──
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 52,
    borderBottomWidth: 1,
  },
  hamburger: { width: 32 },
  headerTitle: { fontSize: 14, fontWeight: "600", marginLeft: 8 },

  // ── Pills ──
  tabBar: {
    maxHeight: 52,
    borderBottomWidth: 1,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  pillLabel: { fontSize: 12 },

  // ── Shared ──
  tabTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  bigVal: { fontSize: 32, fontWeight: "700" },
  bigValRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    gap: 4,
  },
  trendLabel: { fontSize: 11, marginBottom: 8 },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statData: { flexDirection: "column", gap: 2 },
  statLabel: { fontSize: 12, fontWeight: "500" },
  statVal: { fontSize: 22, fontWeight: "700", marginTop: 1 },
  miniTrendRow: { flexDirection: "row", alignItems: "flex-end", gap: 4 },
  trendDot: { width: 8, height: 8, borderRadius: 4 },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginTop: 8,
  },
  inp: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
  },
  btn: {
    backgroundColor: "#6366f1",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  waterCup: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  stepDot: { width: 10, height: 10, borderRadius: 5 },
  moodBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  habitPlus: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
