import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";
import { Card } from "../components/Card";
import * as db from "../db/service";
import {
  PRAYER_NAMES,
  PRAYER_EMOJIS,
  PRAYER_DISPLAY,
  PRAYER_TIMES_ORDER,
  getNextPrayer,
  WIDGET_DEFINITIONS,
  WidgetLayout,
} from "../types";
import { getIslamicGreeting } from "../services/prayerApi";

const EXPENSE_CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Healthcare",
  "Learning",
  "Entertainment",
  "Savings",
  "Other",
];
const CATEGORY_EMOJIS: Record<string, string> = {
  Food: "🍎",
  Transport: "🚇",
  Shopping: "🛍️",
  Bills: "📄",
  Healthcare: "💊",
  Learning: "📚",
  Entertainment: "🎬",
  Savings: "💰",
  Other: "📌",
};

function t12(time: string): string {
  if (!time) return "\u2014";
  const [h, m] = time.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return time;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

// ─── Individual Widget Components ───

function AtAGlanceWidget() {
  const { theme } = useTheme();
  const tc = theme.colors;
  const {
    prayerTimings,
    islamicDate,
    timingsLoading,
    refreshPrayerTimings,
    prayers,
    togglePrayer,
  } = useApp();
  const nextPrayer = useMemo(() => {
    if (!prayerTimings) return null;
    return getNextPrayer({
      fajr: prayerTimings.fajr,
      dhuhr: prayerTimings.dhuhr,
      asr: prayerTimings.asr,
      maghrib: prayerTimings.maghrib,
      isha: prayerTimings.isha,
    });
  }, [prayerTimings]);

  return (
    <Card title="At a Glance" titleStyle={{ color: tc.textTertiary }}>
      {islamicDate && (
        <View style={[s.glanceRow]}>
          <Text style={[s.hijriDate, { color: tc.heading }]}>
            {islamicDate.hijriDate} {islamicDate.hijriMonth}{" "}
            {islamicDate.hijriYear} AH
          </Text>
          <Text style={[s.hijriDay, { color: tc.accent }]}>
            {islamicDate.dayOfWeek ||
              new Date().toLocaleDateString("en-US", { weekday: "long" })}
          </Text>
        </View>
      )}

      {nextPrayer ? (
        <View style={[s.nextPrayerBox, { backgroundColor: tc.accentBg }]}>
          <Text style={[s.npLabel, { color: tc.accent }]}>Next Prayer</Text>
          <Text style={[s.npName, { color: tc.heading }]}>
            {nextPrayer.name}
          </Text>
          <Text style={[s.npTime, { color: tc.textSecondary }]}>
            at {t12(nextPrayer.time)} · in{" "}
            <Text style={[s.npCountdown, { color: tc.accent }]}>
              {nextPrayer.remaining}
            </Text>
          </Text>
        </View>
      ) : (
        <View style={[s.nextPrayerBox, { backgroundColor: tc.bgSecondary }]}>
          <Text style={[s.npLabel, { color: tc.textTertiary }]}>
            All prayers completed today
          </Text>
          <Text style={[s.npAlhamd, { color: tc.success }]}>الحمد لله 🤲</Text>
        </View>
      )}

      {prayerTimings && (
        <View style={[s.prayerStrip, { marginBottom: 12 }]}>
          {PRAYER_TIMES_ORDER.filter((p) => p !== "sunrise").map((prayer) => {
            const time = prayerTimings[prayer] as string;
            const isNext = nextPrayer?.name?.toLowerCase() === prayer;
            const pData = prayers.find(
              (p) => p.prayer_name.toLowerCase() === prayer,
            );
            const done = pData?.on_time === 1;
            const qada = pData?.qada === 1 && !done;
            return (
              <TouchableOpacity
                key={prayer}
                onPress={() =>
                  togglePrayer(prayer.charAt(0).toUpperCase() + prayer.slice(1))
                }
                style={[
                  s.pStripItem,
                  {
                    backgroundColor: done ? tc.accent : tc.bgSecondary,
                    borderColor: done ? tc.accent : tc.borderLight,
                  },
                  isNext && { borderColor: tc.accent, borderWidth: 2 },
                ]}
              >
                <Text style={s.pStripEmoji}>{PRAYER_EMOJIS[prayer]}</Text>
                <Text
                  style={[
                    s.pStripLabel,
                    { color: done ? "#fff" : tc.textTertiary },
                  ]}
                >
                  {PRAYER_DISPLAY[prayer]}
                </Text>
                <Text
                  style={[
                    s.pStripTime,
                    { color: done ? "#fff" : tc.textSecondary },
                  ]}
                >
                  {t12(time)}
                </Text>
                {qada && (
                  <Text style={[s.qadaBadge, { color: tc.warning }]}>Q</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {!prayerTimings && !timingsLoading && (
        <TouchableOpacity
          style={[s.refreshPrayerBtn, { backgroundColor: tc.accentBg }]}
          onPress={refreshPrayerTimings}
        >
          <Text style={[s.refreshPrayerBtnText, { color: tc.accent }]}>
            🔮 Load Prayer Timings
          </Text>
        </TouchableOpacity>
      )}
      {timingsLoading && (
        <ActivityIndicator
          size="small"
          color={tc.accent}
          style={{ marginTop: 8 }}
        />
      )}
    </Card>
  );
}

// function QuickStatsWidget() {
//   const { theme } = useTheme();
//   const tc = theme.colors;
//   const { dailyLog } = useApp();
//   const items = [
//     {
//       l: "Weight",
//       v: dailyLog?.weight ? `${dailyLog.weight} kg` : "\u2014",
//       c: tc.info,
//     },
//     {
//       l: "Water",
//       v: dailyLog?.water_ml
//         ? `${(dailyLog.water_ml / 1000).toFixed(1)}L`
//         : "\u2014",
//       c: "#0ea5e9",
//     },
//     {
//       l: "Steps",
//       v: dailyLog?.steps?.toLocaleString() || "\u2014",
//       c: tc.warning,
//     },
//     {
//       l: "Mood",
//       v: dailyLog?.mood
//         ? `${"\u2022".repeat(dailyLog.mood)}${"\u25CB".repeat(5 - dailyLog.mood)}`
//         : "\u2014",
//       c: tc.accent,
//     },
//   ];
//   return (
//     <Card title="Quick Stats" titleStyle={{ color: tc.textTertiary }}>
//       <View style={s.statGrid}>
//         {items.map((it) => (
//           <View key={it.l} style={s.statTile}>
//             <Text style={[s.statValue, { color: it.c }]}>{it.v}</Text>
//             <Text style={[s.statLabel, { color: tc.textTertiary }]}>
//               {it.l}
//             </Text>
//           </View>
//         ))}
//       </View>
//     </Card>
//   );
// }

function QuickLogWidget() {
  const { theme } = useTheme();
  const tc = theme.colors;
  const { dailyLog, logWeight, logWater, logSteps } = useApp();
  const [w, setW] = useState("");
  const [wa, setWa] = useState("");
  const [st, setSt] = useState("");
  const rows = [
    {
      l: "⚖️  Weight",
      v: w,
      s: setW,
      ph: "kg",
      a: () => {
        const n = parseFloat(w);
        if (n > 0 && n < 300) {
          logWeight(n);
          setW("");
        }
      },
      b: "Log",
    },
    {
      l: "💧  Water",
      v: wa,
      s: setWa,
      ph: "ml",
      a: () => {
        const n = parseInt(wa);
        if (n > 0) {
          logWater((dailyLog?.water_ml || 0) + n);
          setWa("");
        }
      },
      b: "Add",
    },
    {
      l: "🚶  Steps",
      v: st,
      s: setSt,
      ph: "0",
      a: () => {
        const n = parseInt(st);
        if (n > 0) {
          logSteps(n);
          setSt("");
        }
      },
      b: "Set",
    },
  ];
  const items = [
    {
      l: "Weight",
      v: dailyLog?.weight ? `${dailyLog.weight} kg` : "\u2014",
      c: tc.info,
    },
    {
      l: "Water",
      v: dailyLog?.water_ml
        ? `${(dailyLog.water_ml / 1000).toFixed(1)}L`
        : "\u2014",
      c: "#0ea5e9",
    },
    {
      l: "Steps",
      v: dailyLog?.steps?.toLocaleString() || "\u2014",
      c: tc.warning,
    },
    {
      l: "Mood",
      v: dailyLog?.mood
        ? `${"\u2022".repeat(dailyLog.mood)}${"\u25CB".repeat(5 - dailyLog.mood)}`
        : "\u2014",
      c: tc.accent,
    },
  ];
  return (
    <Card title="Quick Log" titleStyle={{ color: tc.textTertiary }}>
      <View style={s.statGrid}>
        {items.map((it) => (
          <View key={it.l} style={s.statTile}>
            <Text style={[s.statValue, { color: it.c }]}>{it.v}</Text>
            <Text style={[s.statLabel, { color: tc.textTertiary }]}>
              {it.l}
            </Text>
          </View>
        ))}
      </View>
      {rows.map((r) => (
        <View key={r.l} style={s.qlRow}>
          <Text style={[s.qlLabel, { color: tc.textSecondary }]}>{r.l}</Text>
          <View style={s.qlInputRow}>
            <TextInput
              style={[
                s.qlInput,
                {
                  backgroundColor: tc.bgSecondary,
                  borderColor: tc.borderLight,
                  color: tc.text,
                },
              ]}
              value={r.v}
              onChangeText={r.s}
              keyboardType="numeric"
              placeholder={r.ph}
              placeholderTextColor={tc.placeholder}
            />
            <TouchableOpacity
              style={[s.qlBtn, { backgroundColor: tc.accent }]}
              onPress={r.a}
            >
              <Text style={s.qlBtnText}>{r.b}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </Card>
  );
}

function MoodWidget() {
  const { theme } = useTheme();
  const tc = theme.colors;
  const { dailyLog, logMood } = useApp();
  const moods = [
    { v: 1, e: "😢", l: "Awful" },
    { v: 2, e: "😟", l: "Bad" },
    { v: 3, e: "😑", l: "Meh" },
    { v: 4, e: "🙂", l: "Good" },
    { v: 5, e: "😊", l: "Great" },
  ];
  return (
    <Card title="Mood" titleStyle={{ color: tc.textTertiary }}>
      <View style={s.moodRow}>
        {moods.map((m) => (
          <TouchableOpacity
            key={m.v}
            style={[
              s.moodBtn,
              { backgroundColor: tc.bgSecondary, borderColor: tc.borderLight },
              dailyLog?.mood === m.v && {
                backgroundColor: tc.accentBg,
                borderColor: tc.accent,
              },
            ]}
            onPress={() => logMood(m.v)}
          >
            <Text style={s.moodEmoji}>{m.e}</Text>
            <Text
              style={[
                s.moodLabel,
                { color: tc.textTertiary },
                dailyLog?.mood === m.v && {
                  color: tc.accent,
                  fontWeight: "700",
                },
              ]}
            >
              {m.l}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </Card>
  );
}

function ExpensesWidget() {
  const { theme } = useTheme();
  const tc = theme.colors;
  const { addExpense, todayTransactions } = useApp();
  const [show, setShow] = useState(false);
  const [cat, setCat] = useState(EXPENSE_CATEGORIES[0]);
  const [amt, setAmt] = useState("");
  const [desc, setDesc] = useState("");
  const exps = (todayTransactions || []).filter(
    (t: any) => t.type === "expense",
  );
  const total = exps.reduce((s: number, t: any) => s + t.amount, 0);
  const handleAdd = () => {
    const a = parseFloat(amt);
    if (!a || a <= 0) {
      Alert.alert("Invalid", "Enter a valid amount.");
      return;
    }
    addExpense(cat, a, desc || "");
    setAmt("");
    setDesc("");
    setShow(false);
  };
  return (
    // <Card
    //   title={`Expenses · $${total.toFixed(2)}`}
    //   titleStyle={{ color: tc.textTertiary }}
    // >
    //   <TouchableOpacity
    //     style={[s.addExpBtn, { backgroundColor: tc.success }]}
    //     onPress={() => setShow(true)}
    //   >
    //     <Text style={s.addExpBtnText}>➕ New Expense</Text>
    //   </TouchableOpacity>

    <Card>
      <View style={[{ display: "flex" }]}>
        <Text style={[s.cardTitle, { color: tc.textTertiary }]}>
          Expenses · ${total.toFixed(2)}
        </Text>

        <TouchableOpacity
          style={[s.addExpBtn, { backgroundColor: tc.success }]}
          onPress={() => setShow(true)}
        >
          <Text style={s.addExpBtnText}>➕ Add Expense</Text>
        </TouchableOpacity>
      </View>
      {exps.length > 0 ? (
        <View>
          {exps.slice(0, 5).map((t: any, i: number) => (
            <View
              key={t.id || i}
              style={[s.expRow, { borderBottomColor: tc.divider }]}
            >
              <Text style={[s.expCat, { color: tc.heading }]}>
                {CATEGORY_EMOJIS[t.category]} {t.category}
              </Text>
              <Text
                style={[s.expDesc, { color: tc.textTertiary }]}
                numberOfLines={1}
              >
                {t.description}
              </Text>
              <Text style={[s.expAmt, { color: tc.error }]}>
                -${t.amount.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={[s.expEmpty, { color: tc.textTertiary }]}>
          No expenses today
        </Text>
      )}
      <Modal visible={show} transparent animationType="slide">
        <View style={[s.modalOverlay, { backgroundColor: tc.overlay }]}>
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => setShow(false)}
          />
          <View style={[s.modal, { backgroundColor: tc.surface }]}>
            <Text style={[s.modalTitle, { color: tc.heading }]}>
              💰 Add Expense
            </Text>
            <Text style={[s.label, { color: tc.textSecondary }]}>Category</Text>
            <View style={s.catGrid}>
              {EXPENSE_CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    s.catChip,
                    {
                      backgroundColor: tc.bgSecondary,
                      borderColor: tc.borderLight,
                    },
                    cat === c && {
                      backgroundColor: tc.successBg,
                      borderColor: tc.success,
                    },
                  ]}
                  onPress={() => setCat(c)}
                >
                  <Text style={s.catIcon}>{CATEGORY_EMOJIS[c]}</Text>
                  <Text
                    style={[
                      s.catLabel,
                      { color: tc.textSecondary },
                      cat === c && { color: tc.success },
                    ]}
                  >
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[s.label, { color: tc.textSecondary }]}>
              Amount ($)
            </Text>
            <TextInput
              style={[
                s.modalInput,
                {
                  backgroundColor: tc.bgSecondary,
                  borderColor: tc.borderLight,
                  color: tc.text,
                },
              ]}
              value={amt}
              onChangeText={setAmt}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={tc.placeholder}
              autoFocus
            />
            <Text style={[s.label, { color: tc.textSecondary }]}>
              Description
            </Text>
            <TextInput
              style={[
                s.modalInput,
                {
                  backgroundColor: tc.bgSecondary,
                  borderColor: tc.borderLight,
                  color: tc.text,
                },
              ]}
              value={desc}
              onChangeText={setDesc}
              placeholder="What for?"
              placeholderTextColor={tc.placeholder}
            />
            <View style={s.modalActions}>
              <TouchableOpacity
                style={[s.cancelBtn, { backgroundColor: tc.bgSecondary }]}
                onPress={() => setShow(false)}
              >
                <Text style={[s.cancelBtnText, { color: tc.textTertiary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.saveBtn, { backgroundColor: tc.success }]}
                onPress={handleAdd}
              >
                <Text style={s.saveBtnText}>Add Expense</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Card>
  );
}

function MonthlyStatsWidget() {
  const { theme } = useTheme();
  const tc = theme.colors;
  const { monthlyStats } = useApp();
  if (!monthlyStats)
    return (
      <Card title="Monthly Stats" titleStyle={{ color: tc.textTertiary }}>
        <Text
          style={{ color: tc.textTertiary, textAlign: "center", padding: 8 }}
        >
          No data yet
        </Text>
      </Card>
    );
  const items = [
    {
      l: "Avg Weight",
      v: monthlyStats.avg_weight
        ? monthlyStats.avg_weight.toFixed(1)
        : "\u2014",
      c: tc.info,
    },
    {
      l: "Avg Water",
      v: monthlyStats.avg_water
        ? `${(monthlyStats.avg_water / 1000).toFixed(1)}L`
        : "\u2014",
      c: "#0ea5e9",
    },
    {
      l: "Avg Steps",
      v: monthlyStats.avg_steps
        ? Math.round(monthlyStats.avg_steps).toLocaleString()
        : "\u2014",
      c: tc.warning,
    },
    { l: "Days Logged", v: monthlyStats.days_tracked, c: tc.accent },
  ];
  return (
    <Card title="Monthly Stats" titleStyle={{ color: tc.textTertiary }}>
      <View style={s.statGrid}>
        {items.map((it) => (
          <View key={it.l} style={s.statTile}>
            <Text style={[s.statValue, { color: it.c }]}>{it.v}</Text>
            <Text style={[s.statLabel, { color: tc.textTertiary }]}>
              {it.l}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const WIDGET_MAP: Record<string, React.FC> = {
  "at-a-glance": AtAGlanceWidget,
  // "quick-stats": QuickStatsWidget,
  "quick-log": QuickLogWidget,
  mood: MoodWidget,
  expenses: ExpensesWidget,
  "monthly-stats": MonthlyStatsWidget,
};

// ─── Reorderable List ───

function ReorderableList({
  data,
  onReorder,
  renderItem,
  editing,
  contentContainerStyle,
}: {
  data: WidgetLayout[];
  onReorder: (items: WidgetLayout[]) => void;
  renderItem: (item: WidgetLayout, isActive: boolean) => React.ReactNode;
  editing: boolean;
  contentContainerStyle?: any;
}) {
  const { theme } = useTheme();
  const tc = theme.colors;
  const moveUp = (index: number) => {
    if (index <= 0) return;
    const next = [...data];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onReorder(next.map((w, i) => ({ ...w, sort_order: i })));
  };
  const moveDown = (index: number) => {
    if (index >= data.length - 1) return;
    const next = [...data];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    onReorder(next.map((w, i) => ({ ...w, sort_order: i })));
  };
  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.widget_key}
      renderItem={({ item, index }) => (
        <View>
          {renderItem(item, false)}
          {editing && (
            <View
              style={[
                s.editControls,
                { backgroundColor: tc.accentBg, borderColor: tc.accent + "66" },
              ]}
            >
              <TouchableOpacity
                style={[s.editArrow, index === 0 && s.editArrowDisabled]}
                onPress={() => moveUp(index)}
                disabled={index === 0}
              >
                <Text
                  style={[
                    s.editArrowText,
                    index === 0 && s.editArrowTextDisabled,
                  ]}
                >
                  ▲
                </Text>
              </TouchableOpacity>
              <Text style={[s.editIndex, { color: tc.accent }]}>
                {index + 1}
              </Text>
              <TouchableOpacity
                style={[
                  s.editArrow,
                  index === data.length - 1 && s.editArrowDisabled,
                ]}
                onPress={() => moveDown(index)}
                disabled={index === data.length - 1}
              >
                <Text
                  style={[
                    s.editArrowText,
                    index === data.length - 1 && s.editArrowTextDisabled,
                  ]}
                >
                  ▼
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
      contentContainerStyle={contentContainerStyle}
      style={{ flex: 1 }}
      showsVerticalScrollIndicator={false}
    />
  );
}

// ─── Main Dashboard Screen ───

export default function DashboardScreen() {
  const { theme, isDark } = useTheme();
  const tc = theme.colors;
  const {
    loaded,
    streak,
    setSidebarOpen,
    refresh,
    widgetLayouts,
    setWidgetLayouts,
    saveWidgetLayouts,
  } = useApp();

  const [editing, setEditing] = useState(false);
  const greeting = useMemo(() => getIslamicGreeting(), []);
  const todayStr = useMemo(
    () =>
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    [],
  );
  const visible = useMemo(
    () =>
      widgetLayouts
        .filter((w) => w.visible)
        .sort((a, b) => a.sort_order - b.sort_order),
    [widgetLayouts],
  );

  const handleReorder = useCallback(
    (items: WidgetLayout[]) => {
      setWidgetLayouts(items.map((w, i) => ({ ...w, sort_order: i })));
    },
    [setWidgetLayouts],
  );

  const exitEdit = () => {
    setEditing(false);
    saveWidgetLayouts();
  };

  const renderCard = useCallback((item: WidgetLayout, _active: boolean) => {
    const Comp = WIDGET_MAP[item.widget_key];
    if (!Comp) return null;
    return (
      <View style={s.cardWrap}>
        <Comp />
      </View>
    );
  }, []);

  if (!loaded) {
    return (
      <SafeAreaView
        style={[s.safe, { backgroundColor: tc.bg }]}
        edges={["top"]}
      >
        <View
          style={[
            s.topbar,
            { backgroundColor: tc.surface, borderBottomColor: tc.divider },
          ]}
        >
          <TouchableOpacity
            onPress={() => setSidebarOpen(true)}
            style={s.menuBtn}
          >
            <Text style={[s.menuIcon, { color: tc.heading }]}>☰</Text>
          </TouchableOpacity>
          <View style={s.topCenter}>
            <Text style={[s.greeting, { color: tc.heading }]}>Loading...</Text>
          </View>
        </View>
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color={tc.accent} />
          <Text style={[s.loadingText, { color: tc.textTertiary }]}>
            Loading your dashboard...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (visible.length === 0) {
    return (
      <SafeAreaView
        style={[s.safe, { backgroundColor: tc.bg }]}
        edges={["top"]}
      >
        <View
          style={[
            s.topbar,
            { backgroundColor: tc.surface, borderBottomColor: tc.divider },
          ]}
        >
          <TouchableOpacity
            onPress={() => setSidebarOpen(true)}
            style={s.menuBtn}
          >
            <Text style={[s.menuIcon, { color: tc.heading }]}>☰</Text>
          </TouchableOpacity>
          <View style={s.topCenter}>
            <Text style={[s.greeting, { color: tc.heading }]}>{greeting}</Text>
            <Text style={[s.dateSmall, { color: tc.textTertiary }]}>
              {todayStr}
            </Text>
          </View>
          <TouchableOpacity onPress={refresh} style={s.iconBtn}>
            <Text style={s.iconBtnText}>🔄</Text>
          </TouchableOpacity>
        </View>
        <View style={s.emptyContainer}>
          <Text style={s.emptyIcon}>📊</Text>
          <Text style={[s.emptyTitle, { color: tc.heading }]}>
            Welcome to your Dashboard
          </Text>
          <Text style={[s.emptySubtitle, { color: tc.textTertiary }]}>
            Tap refresh to load your data and start tracking.
          </Text>
          <TouchableOpacity
            style={[s.emptyRefreshBtn, { backgroundColor: tc.accent }]}
            onPress={refresh}
          >
            <Text style={s.emptyRefreshBtnText}>🔄 Refresh</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: tc.bg }]} edges={["top"]}>
      <View
        style={[
          s.topbar,
          { backgroundColor: tc.surface, borderBottomColor: tc.divider },
        ]}
      >
        <TouchableOpacity
          onPress={() => setSidebarOpen(true)}
          style={s.menuBtn}
        >
          <Text style={[s.menuIcon, { color: tc.heading }]}>☰</Text>
        </TouchableOpacity>
        <View style={s.topCenter}>
          {!editing ? (
            <>
              <Text style={[s.greeting, { color: tc.heading }]}>
                {greeting}
              </Text>
              <Text style={[s.dateSmall, { color: tc.textTertiary }]}>
                {todayStr}
              </Text>
            </>
          ) : (
            <Text style={[s.editHint, { color: tc.accent }]}>
              ⬆️⬇️ Use arrows to reorder
            </Text>
          )}
        </View>
        {!editing ? (
          <>
            <TouchableOpacity onPress={refresh} style={s.iconBtn}>
              <Text style={s.iconBtnText}>🔄</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setEditing(true)}
              style={[s.editBtn, { backgroundColor: tc.bgSecondary }]}
            >
              <Text style={[s.editBtnText, { color: tc.accent }]}>✎ Edit</Text>
            </TouchableOpacity>
            <View style={[s.streak, { backgroundColor: tc.warningBg }]}>
              <Text style={[s.streakText, { color: tc.warning }]}>
                🔥 {streak}
              </Text>
            </View>
          </>
        ) : (
          <TouchableOpacity
            onPress={exitEdit}
            style={[s.doneBtn, { backgroundColor: tc.accent }]}
          >
            <Text style={s.doneBtnText}>✓ Done</Text>
          </TouchableOpacity>
        )}
      </View>

      <ReorderableList
        data={visible}
        onReorder={handleReorder}
        renderItem={renderCard}
        editing={editing}
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
      />
    </SafeAreaView>
  );
}

// ─── Styles (static layout, dynamic colors inline) ───

const s = StyleSheet.create({
  safe: { flex: 1 },
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
  },
  menuBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  menuIcon: { fontSize: 20 },
  topCenter: { flex: 1, marginLeft: 10 },
  greeting: { fontSize: 14, fontWeight: "700" },
  dateSmall: { fontSize: 11, marginTop: 1 },
  editHint: { fontSize: 13, fontWeight: "600" },
  iconBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },
  iconBtnText: { fontSize: 16 },
  editBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginRight: 8,
  },
  editBtnText: { fontSize: 12, fontWeight: "600" },
  doneBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  doneBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  streak: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  streakText: { fontSize: 12, fontWeight: "700" },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: { fontSize: 14, fontWeight: "500" },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 8,
  },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "700", textAlign: "center" },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 8,
  },
  emptyRefreshBtn: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  emptyRefreshBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  cardWrap: { marginBottom: 12, position: "relative" },

  editControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingVertical: 8,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  editArrow: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
  },
  editArrowDisabled: { backgroundColor: "#d0d0d0" },
  editArrowText: { fontSize: 16, color: "#fff", fontWeight: "700" },
  editArrowTextDisabled: { color: "#999" },
  editIndex: {
    fontSize: 13,
    fontWeight: "700",
    minWidth: 20,
    textAlign: "center",
  },

  glanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  hijriDate: { fontSize: 14, fontWeight: "600" },
  hijriDay: { fontSize: 12, fontWeight: "500" },
  nextPrayerBox: { borderRadius: 10, padding: 12, marginBottom: 10 },
  npLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  npName: { fontSize: 18, fontWeight: "700", marginTop: 2 },
  npTime: { fontSize: 13, marginTop: 2 },
  npCountdown: { fontWeight: "700" },
  npAlhamd: { fontSize: 16, fontWeight: "600", marginTop: 4 },
  prayerStrip: { flexDirection: "row", gap: 6 },
  pStripItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  pStripEmoji: { fontSize: 14, marginBottom: 2 },
  pStripLabel: { fontSize: 9, fontWeight: "600" },
  pStripTime: {
    fontSize: 10,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  qadaBadge: { fontSize: 9, fontWeight: "700", marginTop: 2 },
  refreshPrayerBtn: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 4,
  },
  refreshPrayerBtnText: { fontSize: 13, fontWeight: "600" },

  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
  },
  statTile: { alignItems: "center", gap: 2, width: "23%" },
  statValue: { fontSize: 18, fontWeight: "700" },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    minHeight: 28,
    alignSelf: "center",
    textAlign: "center",
  },

  qlRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    gap: 8,
  },
  qlLabel: { fontSize: 13, fontWeight: "600", width: 72 },
  qlInputRow: { flex: 1, flexDirection: "row", gap: 8, alignItems: "center" },
  qlInput: {
    flex: 1,
    height: 36,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  qlBtn: {
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  qlBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },

  moodRow: { flexDirection: "row", gap: 8 },
  moodBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  moodEmoji: { fontSize: 22, marginBottom: 4 },
  moodLabel: { fontSize: 10, fontWeight: "600" },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
  },
  addExpBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  addExpBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  expRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  expCat: { fontSize: 13, fontWeight: "600", width: 90 },
  expDesc: { fontSize: 12, flex: 1, marginHorizontal: 8 },
  expAmt: { fontSize: 13, fontWeight: "700" },
  expEmpty: { textAlign: "center", fontSize: 13, paddingVertical: 12 },

  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: { fontSize: 20, fontWeight: "700", marginBottom: 16 },
  label: { fontSize: 12, fontWeight: "600", marginBottom: 6, marginTop: 4 },
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  catChip: {
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  catIcon: { fontSize: 14 },
  catLabel: { fontSize: 12, fontWeight: "600" },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 14,
  },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 8 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelBtnText: { fontSize: 15, fontWeight: "600" },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  saveBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});
