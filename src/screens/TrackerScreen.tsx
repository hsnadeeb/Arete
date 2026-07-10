import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";
import { Card } from "../components/Card";
import { Icon, getIconName } from "../components/Icons";
import { LUCIDE_ICONS, TYPOGRAPHY } from "../constants/typography";
import { BarChart, ProgressRing } from "../components/Charts";
import * as db from "../db/service";
import type { LucideIconName } from "../constants/typography";

type Tab =
  | "overview"
  | "weight"
  | "water"
  | "steps"
  | "sleep"
  | "mood"
  | "habits";

const TABS: { key: Tab; label: string; icon: LucideIconName; color: string }[] = [
  { key: "overview", label: "Today", icon: "BarChart", color: "#6366f1" },
  { key: "weight", label: "Weight", icon: "Weight", color: "#0b6bcf" },
  { key: "water", label: "Water", icon: "Droplet", color: "#0ea5e9" },
  { key: "steps", label: "Steps", icon: "Footprints", color: "#f59e0b" },
  { key: "sleep", label: "Sleep", icon: "Moon", color: "#8b5cf6" },
  { key: "mood", label: "Mood", icon: "Smile", color: "#f97316" },
  { key: "habits", label: "Habits", icon: "CheckCircle", color: "#0891b2" },
];

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function renderHabitGrid(
  habitId: number,
  color: string,
  grid: { weeks: { date: string; day: number; month: string }[][]; monthLabels: { label: string; col: number }[] },
  habitLogs: any[],
  onToggle: (habitId: number, date: string) => void,
  T: any,
  tc: any,
) {
  const gap = 3;
  const screenWidth = Dimensions.get('window').width;
  const containerPad = 16;
  const dayLabelW = 24;
  const availableW = screenWidth - containerPad * 2 - dayLabelW - (grid.weeks.length - 1) * gap;
  const cellSize = Math.max(10, Math.floor(availableW / grid.weeks.length));
  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

  return (
    <View>
      <View style={{ flexDirection: 'row', marginLeft: 28, marginBottom: 10, height: 14 }}>
        {grid.monthLabels.map((m, i) => (
          <View key={i} style={{ position: 'absolute', left: m.col * (cellSize + gap) }}>
            <Text style={[TYPOGRAPHY.captionSm, { color: T.textMuted, fontWeight: '500' }]}>{m.label}</Text>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row' }}>
        <View style={{ width: 24, gap: gap }}>
          {dayLabels.map((l, i) => (
            <Text key={i} style={[TYPOGRAPHY.captionSm, { color: T.textMuted, height: cellSize, lineHeight: cellSize }]}>{l}</Text>
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: gap }}>
          {grid.weeks.map((week, wi) => (
            <View key={wi} style={{ gap: gap }}>
              {week.map((d) => {
                const done = habitLogs.some((l) => l.habit_id === habitId && l.date === d.date);
                return (
                  <TouchableOpacity
                    key={d.date}
                    onPress={() => onToggle(habitId, d.date)}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      borderRadius: 3,
                      backgroundColor: done ? color : T.border,
                      opacity: done ? 1 : 0.3,
                    }}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const HABIT_COLORS = ['#6366f1', '#f97316', '#22c55e', '#ef4444', '#ec4899', '#14b8a6', '#eab308', '#a855f7', '#06b6d4', '#78716c'];

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
  const [activeIdx, setActiveIdx] = useState(0);
  const [active, setActive] = useState<Tab>("overview");
  const screenWidth = Dimensions.get('window').width;
  const pagerRef = useRef<ScrollView>(null);
  const [weight, setWeight] = useState("");
  const [sleepH, setSleepH] = useState("");

  // ── Loaded state ──
  const [loaded, setLoaded] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [habits, setHabits] = useState<any[]>([]);
  const [habitLogs, setHabitLogs] = useState<any[]>([]);
  const [addHabitModal, setAddHabitModal] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitEmoji, setNewHabitEmoji] = useState('✅');
  const [selectedHabit, setSelectedHabit] = useState<any>(null);
  const [colorFilter, setColorFilter] = useState<string | null>(null);
  const [newHabitColor, setNewHabitColor] = useState('#6366f1');

  const onMomentumScrollEnd = (e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
    if (idx !== activeIdx && idx >= 0 && idx < TABS.length) {
      setActiveIdx(idx);
      setActive(TABS[idx].key);
    }
  };

  const goToPage = (idx: number) => {
    setActiveIdx(idx);
    setActive(TABS[idx].key);
    pagerRef.current?.scrollTo({ x: idx * screenWidth, animated: true });
  };

  useEffect(() => {
    Promise.all([
      db.getAllDailyLogs().catch(() => []),
      db.getAllNutritionLogs().catch(() => []),
      db.getHabits().catch(() => []),
      db.getHabitLogs().catch(() => []),
    ]).then(([l, n, h, hl]) => {
      setLogs(l);
      setHabits(h);
      setHabitLogs(hl);
      setLoaded(true);
    }).catch((e) => {
      console.error('Error loading tracker data:', e);
      setLogs([]);
      setHabits([]);
      setHabitLogs([]);
      setLoaded(true);
    });
  }, []);

  const handleAddHabit = async () => {
    if (!newHabitName.trim()) return;
    await db.addHabit({ name: newHabitName.trim(), emoji: newHabitEmoji, color: newHabitColor, target_per_day: 1 });
    setNewHabitName('');
    setAddHabitModal(false);
    setNewHabitColor('#6366f1');
    setNewHabitEmoji('✅');
    const h = await db.getHabits();
    setHabits(h);
  };

  const handleToggleHabitDay = async (habitId: number, date: string) => {
    const existing = habitLogs.find((l) => l.habit_id === habitId && l.date === date);
    if (existing) {
      await db.deleteHabitLogById(existing.id);
    } else {
      await db.logHabit(habitId, date, 1);
    }
    const hl = await db.getHabitLogs();
    setHabitLogs(hl);
  };

  const handleDeleteHabit = (id: number, name: string) => {
    Alert.alert('Delete Habit', `Remove "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await db.deleteHabitById(id);
        const h = await db.getHabits();
        setHabits(h);
        setSelectedHabit(null);
      }},
    ]);
  };

  // Generate grid data: last 90 days arranged by week columns
  const habitGrid = useMemo(() => {
    const days: { date: string; day: number; month: string }[] = [];
    const today = new Date();
    for (let i = 89; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push({
        date: d.toISOString().split('T')[0],
        day: d.getDay(),
        month: d.toLocaleDateString('en', { month: 'short' }),
      });
    }
    // Group into weeks (columns)
    const weeks: typeof days[] = [];
    let currentWeek: typeof days = [];
    for (const d of days) {
      currentWeek.push(d);
      if (d.day === 6 || d === days[days.length - 1]) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    // Month labels per column
    const monthLabels: { label: string; col: number }[] = [];
    let lastMonth = '';
    weeks.forEach((w, i) => {
      const m = w[0]?.month;
      if (m && m !== lastMonth) {
        monthLabels.push({ label: m, col: i });
        lastMonth = m;
      }
    });
    return { weeks, monthLabels };
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
            <Icon name={LUCIDE_ICONS.menu} size={22} color={T.textPrimary} />
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
            <Icon name={LUCIDE_ICONS.menu} size={20} color={T.textPrimary} />
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
              onPress={() => goToPage(TABS.indexOf(t))}
            >
              <Text style={[TYPOGRAPHY.bodySm, { color: T.textMuted, fontWeight: '600' }]}>{t.icon}</Text>
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
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        onMomentumScrollEnd={onMomentumScrollEnd}
      >
        {/* ─── OVERVIEW ─── */}
        <View style={{ width: screenWidth, flex: 1 }}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 80, gap: 20 }}>
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
                  <Icon name={LUCIDE_ICONS.weight} size={18} color="#0b6bcf" />
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
                  <Icon name={LUCIDE_ICONS.droplet} size={18} color="#0ea5e9" />
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
                  <Icon name={LUCIDE_ICONS.run} size={18} color="#f59e0b" />
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
                  <Icon name={LUCIDE_ICONS.smile} size={18} color="#8b5cf6" />
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
                  <Icon name={LUCIDE_ICONS.moon} size={18} color="#6366f1" />
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
          </ScrollView>
        </View>

        {/* ─── WEIGHT ─── */}
        <View style={{ width: screenWidth, flex: 1 }}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 80, gap: 20 }}>
            <View>
            <Text style={[styles.tabTitle, { color: T.textMuted }]}>
              Weight
            </Text>
            <View style={styles.bigValRow}>
              <Text style={[styles.bigVal, { color: T.textPrimary }]}>
                {dailyLog?.weight ?? "—"}
              </Text>
              <Text style={[TYPOGRAPHY.body, { color: T.textMuted }]}>kg</Text>
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
                showValues={false}
                accentColor="#0b6bcf"
              />
            </View>
            </View>
          </ScrollView>
        </View>

        {/* ─── WATER ─── */}
        <View style={{ width: screenWidth, flex: 1 }}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 80, gap: 20 }}>
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
                showValues={false}
                accentColor="#0ea5e9"
              />
            </View>
            </View>
          </ScrollView>
        </View>

        {/* ─── STEPS ─── */}
        <View style={{ width: screenWidth, flex: 1 }}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 80, gap: 20 }}>
            <View>
            <Text style={[styles.tabTitle, { color: T.textMuted }]}>Steps</Text>
            <View style={styles.bigValRow}>
              <Text style={[styles.bigVal, { color: "#f59e0b" }]}>
                {dailyLog?.steps?.toLocaleString() ?? "0"}
              </Text>
              <Text style={[TYPOGRAPHY.body, { color: T.textMuted }]}>/ 10,000</Text>
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
                showValues={false}
                accentColor="#f59e0b"
              />
            </View>
            </View>
          </ScrollView>
        </View>

        {/* ─── SLEEP ─── */}
        <View style={{ width: screenWidth, flex: 1 }}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 80, gap: 20 }}>
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
                showValues={false}
                accentColor="#8b5cf6"
              />
            </View>
            </View>
          </ScrollView>
        </View>

        {/* ─── MOOD ─── */}
        <View style={{ width: screenWidth, flex: 1 }}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 80, gap: 20 }}>
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
                  <Icon
                    name={([LUCIDE_ICONS.frown, LUCIDE_ICONS.frown, LUCIDE_ICONS.meh, LUCIDE_ICONS.smile, LUCIDE_ICONS.smile] as LucideIconName[])[m - 1]}
                    size={28}
                    color={dailyLog?.mood === m ? T.moodBorder : T.textTertiary}
                  />
                  <Text style={[TYPOGRAPHY.captionSm, { color: T.textTertiary }]}>
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
                showValues={false}
                accentColor="#f97316"
              />
            </View>
            </View>
          </ScrollView>
        </View>

        {/* ─── HABITS ─── */}
        <View style={{ width: screenWidth, flex: 1 }}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 80, gap: 20 }}>
            <View style={{ paddingBottom: 80 }}>
            {habits.length === 0 ? (
              <View style={{ alignItems: 'center', paddingTop: 40, gap: 8 }}>
                <Icon name={LUCIDE_ICONS.checkCircle} size={40} color={T.textTertiary} />
                <Text style={[TYPOGRAPHY.body, { color: T.textTertiary }]}>No habits yet</Text>
                <Text style={[TYPOGRAPHY.caption, { color: T.textMuted }]}>Tap + to add your first habit</Text>
              </View>
            ) : selectedHabit ? (
              <View>
                <TouchableOpacity onPress={() => setSelectedHabit(null)} style={[styles.backBtn, { borderColor: T.border }]}>
                  <Text style={{ color: T.textSecondary }}>← Back</Text>
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Icon name={getIconName(selectedHabit.emoji)} size={24} color={selectedHabit.color || tc.accent} />
                  <Text style={[TYPOGRAPHY.h3, { color: T.textPrimary }]}>{selectedHabit.name}</Text>
                  <TouchableOpacity onPress={() => handleDeleteHabit(selectedHabit.id, selectedHabit.name)} style={{ marginLeft: 'auto' }}>
                    <Text style={[TYPOGRAPHY.bodySm, { color: tc.error }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
                {renderHabitGrid(selectedHabit.id, selectedHabit.color || '#6366f1', habitGrid, habitLogs, handleToggleHabitDay, T, tc)}
              </View>
            ) : (
              <>
                {/* Color filter bar */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', gap: 8, paddingRight: 8 }}>
                    <TouchableOpacity
                      onPress={() => setColorFilter(null)}
                      style={[styles.filterChip, { backgroundColor: colorFilter === null ? tc.accentBg : T.surface, borderColor: colorFilter === null ? tc.accent : T.border }]}
                    >
                      <Text style={[TYPOGRAPHY.btnSm, { color: colorFilter === null ? tc.accent : T.textSecondary }]}>All</Text>
                    </TouchableOpacity>
                    {HABIT_COLORS.map((c) => {
                      const count = habits.filter((h) => (h.color || '#6366f1') === c).length;
                      if (count === 0) return null;
                      return (
                        <TouchableOpacity
                          key={c}
                          onPress={() => setColorFilter(c === colorFilter ? null : c)}
                          style={[styles.filterChip, { backgroundColor: colorFilter === c ? c + '20' : T.surface, borderColor: colorFilter === c ? c : T.border }]}
                        >
                          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c }} />
                          <Text style={[TYPOGRAPHY.btnSm, { color: T.textSecondary }]}>{count}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>

                {(colorFilter ? habits.filter((h) => (h.color || '#6366f1') === colorFilter) : habits).map((h) => {
                  const c = h.color || '#6366f1';
                  const todayLog = habitLogs.find((l) => l.habit_id === h.id && l.date === today());
                  const checked = !!todayLog;
                  return (
                    <TouchableOpacity
                      key={h.id}
                      onPress={() => { setSelectedHabit(h); setColorFilter(null); }}
                      style={[styles.habitCard, { backgroundColor: T.surface, borderColor: T.borderSoft }]}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                        <Icon name={getIconName(h.emoji)} size={22} color={c} />
                        <View>
                          <Text style={[TYPOGRAPHY.body, { fontWeight: '600', color: T.textPrimary }]}>{h.name}</Text>
                          <Text style={[TYPOGRAPHY.captionSm, { color: T.textTertiary, marginTop: 1 }]}>
                            {habitLogs.filter((l) => l.habit_id === h.id && l.date >= new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0]).length} / 90 days
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleToggleHabitDay(h.id, today())}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={[styles.checkCircle, { borderColor: checked ? c : T.border, backgroundColor: checked ? c : 'transparent' }]}
                      >
                        {checked && <Icon name={LUCIDE_ICONS.check} size={12} color="#fff" />}
                      </TouchableOpacity>
                      <Icon name={LUCIDE_ICONS.chevronRight} size={18} color={T.textMuted} />
                    </TouchableOpacity>
                  );
                })}
              </>
            )}
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      {active === 'habits' && (
        <TouchableOpacity
          onPress={() => setAddHabitModal(true)}
          style={[styles.fab, { backgroundColor: tc.accent }]}
        >
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: '600', lineHeight: 26 }}>+</Text>
        </TouchableOpacity>
      )}

      <Modal visible={addHabitModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setAddHabitModal(false)} />
          <View style={[styles.modalSheet, { backgroundColor: tc.surface }]}>
            <Text style={[TYPOGRAPHY.h3, { color: T.textPrimary, marginBottom: 16 }]}>New Habit</Text>
            <Text style={[TYPOGRAPHY.btnSm, { color: T.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, marginTop: 8 }]}>Emoji</Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
              {['✅', '💪', '🏃', '📖', '🧘', '🥗', '💧', '😴', '🎯', '✍️', '🎨', '🧠', '🚴', '🏋️', '🧹', '🌱', '📝', '🎵', '☕', '🙏'].map((e) => (
                <TouchableOpacity
                  key={e}
                  onPress={() => setNewHabitEmoji(e)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: newHabitEmoji === e ? T.border : 'transparent',
                    borderWidth: 1,
                    borderColor: newHabitEmoji === e ? tc.accent : T.border,
                  }}
                >
                  <Text style={{ fontSize: 18 }}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[TYPOGRAPHY.btnSm, { color: T.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, marginTop: 8 }]}>Name</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: tc.bg, borderColor: T.border, color: T.textPrimary }]}
              value={newHabitName}
              onChangeText={setNewHabitName}
              placeholder="e.g. Morning run"
              placeholderTextColor={T.placeholder}
              autoFocus
            />
            <Text style={[TYPOGRAPHY.btnSm, { color: T.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, marginTop: 14 }]}>Color</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
              {HABIT_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setNewHabitColor(c)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: c,
                    borderWidth: newHabitColor === c ? 3 : 1,
                    borderColor: newHabitColor === c ? T.textPrimary : T.border,
                  }}
                />
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { backgroundColor: tc.bgSecondary }]}
                onPress={() => { setAddHabitModal(false); setNewHabitName(''); }}
              >
                <Text style={{ color: T.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, { backgroundColor: tc.accent }]}
                onPress={handleAddHabit}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  headerTitle: { ...TYPOGRAPHY.body, fontWeight: "600", marginLeft: 8 },

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
  pillLabel: { ...TYPOGRAPHY.caption },

  // ── Shared ──
  tabTitle: {
    ...TYPOGRAPHY.title,
    marginBottom: 8,
  },
  bigVal: { ...TYPOGRAPHY.monoLg },
  bigValRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    gap: 4,
  },
  trendLabel: { ...TYPOGRAPHY.captionSm, marginBottom: 8 },
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
  statLabel: { ...TYPOGRAPHY.statLabel },
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
    ...TYPOGRAPHY.input,
  },
  btn: {
    backgroundColor: "#6366f1",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: "center",
  },
  btnText: { color: "#fff", ...TYPOGRAPHY.btn },
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

  // ── Habits redesign ──
  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    ...TYPOGRAPHY.h3,
    marginBottom: 16,
  },
  modalLabel: {
    ...TYPOGRAPHY.btnSm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    marginTop: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...TYPOGRAPHY.input,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
});
