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
import { Icon } from "../components/Icons";
import {
  PRAYER_ICONS,
  PRAYER_DISPLAY,
  PRAYER_TIMES_ORDER,
  getNextPrayer,
  WidgetLayout,
} from "../types";
import { LUCIDE_ICONS, TYPOGRAPHY } from "../constants/typography";
import { getIslamicGreeting, getGreeting } from "../services/prayerApi";

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
const CATEGORY_ICONS: Record<string, keyof typeof LUCIDE_ICONS> = {
  Food: "apple",
  Transport: "train",
  Shopping: "shoppingBag",
  Bills: "fileText",
  Healthcare: "pill",
  Learning: "book",
  Entertainment: "film",
  Savings: "dollarSign",
  Other: "pin",
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
  const prayerTimings = useApp((s) => s.prayerTimings);
  const islamicDate = useApp((s) => s.islamicDate);
  const timingsLoading = useApp((s) => s.timingsLoading);
  const refreshPrayerTimings = useApp((s) => s.refreshPrayerTimings);
  const prayers = useApp((s) => s.prayers);
  const togglePrayer = useApp((s) => s.togglePrayer);
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

  const allDone = useMemo(
    () => prayers.length >= 5 && prayers.every((p: any) => p.on_time === 1),
    [prayers],
  );

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

      {allDone ? (
        <View style={[s.nextPrayerBox, { backgroundColor: tc.successBg }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name={LUCIDE_ICONS.checkCircle} size={18} color={tc.success} />
            <Text style={[s.npLabel, { color: tc.success }]}>
              All prayers completed
            </Text>
          </View>
        </View>
      ) : nextPrayer ? (
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
      ) : null}

      {prayerTimings && (
        <View style={[s.prayerStrip, { marginBottom: 12 }]}>
          {PRAYER_TIMES_ORDER.filter((p) => p !== "sunrise").map((prayer) => {
            const time = prayerTimings[prayer] as string;
            const [h, m] = (time || '').split(':').map(Number);
            const prayerMinutes = h * 60 + m;
            const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
            const canToggle = nowMinutes >= prayerMinutes;
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
                  canToggle
                    ? togglePrayer(prayer.charAt(0).toUpperCase() + prayer.slice(1))
                    : undefined
                }
                style={[
                  s.pStripItem,
                  {
                    backgroundColor: done ? tc.accent : tc.bgSecondary,
                    borderColor: done ? tc.accent : tc.borderLight,
                  },
                  isNext && { borderColor: tc.accent, borderWidth: 2 },
                  !canToggle && { opacity: 0.5 },
                  allDone && { opacity: 0.4 },
                ]}
                disabled={!canToggle}
              >
                <Icon
                  name={PRAYER_ICONS[prayer]?.name ?? LUCIDE_ICONS.sun}
                  size={14}
                  color={done ? "#fff" : tc.textTertiary}
                  style={{ marginBottom: 2 }}
                  label={PRAYER_DISPLAY[prayer]}
                />
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
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Icon
              name={LUCIDE_ICONS.compass}
              size={14}
              color={tc.accent}
              label="load timings"
            />
            <Text style={[s.refreshPrayerBtnText, { color: tc.accent }]}>
              Load Prayer Timings
            </Text>
          </View>
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

function QuickLogWidget() {
  const { theme } = useTheme();
  const tc = theme.colors;
  const dailyLog = useApp((s) => s.dailyLog);
  const logWeight = useApp((s) => s.logWeight);
  const logWater = useApp((s) => s.logWater);
  const logSteps = useApp((s) => s.logSteps);
  const [w, setW] = useState("");
  const [wa, setWa] = useState("");
  const [st, setSt] = useState("");
  const rows = [
    {
      l: "Weight",
      icon: LUCIDE_ICONS.weight,
      v: w,
      s: setW,
      ph: "Please log your weight in kg",
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
      l: "Water",
      icon: LUCIDE_ICONS.droplet,
      v: wa,
      s: setWa,
      ph: "Please log water intake in ml",
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
      l: "Steps",
      icon: LUCIDE_ICONS.activity,
      v: st,
      s: setSt,
      ph: "Please log you todays steps",
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
      {rows.map((r: any) => (
        <View key={r.l} style={s.qlRow}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              width: 72,
            }}
          >
            <Icon
              name={r.icon}
              size={14}
              color={tc.textSecondary}
              label={r.l}
            />
            <Text style={[s.qlLabel, { color: tc.textSecondary }]}>{r.l}</Text>
          </View>
          <View style={[s.qlInputRow, { backgroundColor: tc.bgSecondary }]}>
            <TextInput
              style={[s.qlInput, { color: tc.text }]}
              value={r.v}
              onChangeText={r.s}
              keyboardType="numeric"
              placeholder={r.ph}
              placeholderTextColor={tc.placeholder}
            />
            <TouchableOpacity
              style={[s.qlBtn, { backgroundColor: tc.accent }]}
              onPress={r.a}
              activeOpacity={0.7}
            >
              <Icon name={LUCIDE_ICONS.plus} size={18} color="#fff" />
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
  const dailyLog = useApp((s) => s.dailyLog);
  const logMood = useApp((s) => s.logMood);
  const moods = [
    { v: 1, icon: LUCIDE_ICONS.frown, l: "Awful" },
    { v: 2, icon: LUCIDE_ICONS.frown, l: "Bad" },
    { v: 3, icon: LUCIDE_ICONS.meh, l: "Meh" },
    { v: 4, icon: LUCIDE_ICONS.smile, l: "Good" },
    { v: 5, icon: LUCIDE_ICONS.smile, l: "Great" },
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
            <Icon
              name={m.icon}
              size={22}
              color={dailyLog?.mood === m.v ? tc.accent : tc.textTertiary}
              style={{ marginBottom: 4 }}
              label={m.l}
            />
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

function TodoWidget() {
  const { theme } = useTheme();
  const tc = theme.colors;
  const todos = useApp((s) => s.todos);
  const addTodo = useApp((s) => s.addTodo);
  const toggleTodo = useApp((s) => s.toggleTodo);
  const deleteTodo = useApp((s) => s.deleteTodo);
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = () => {
    const t = input.trim();
    if (!t || submitting) return;
    setSubmitting(true);
    addTodo(t).finally(() => {
      setInput("");
      setSubmitting(false);
    });
  };

  const visible = todos.slice(0, 5);

  return (
    <Card title="To-Do">
      <View
        style={[
          s.todoRow,
          { backgroundColor: tc.bgSecondary, borderColor: tc.border },
        ]}
      >
        <TextInput
          style={[s.todoInput, { color: tc.text }]}
          value={input}
          onChangeText={setInput}
          placeholder="Add a task..."
          placeholderTextColor={tc.placeholder}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
          editable={!submitting}
        />
        <TouchableOpacity
          style={[
            s.todoAddBtn,
            { backgroundColor: tc.accent },
            !input.trim() && { opacity: 0.4 },
          ]}
          onPress={handleAdd}
          disabled={!input.trim() || submitting}
          activeOpacity={0.7}
        >
          <Icon name={LUCIDE_ICONS.plus} size={16} color="#fff" />
        </TouchableOpacity>
      </View>
      {visible.length === 0 ? (
        <Text style={[s.todoEmpty, { color: tc.textTertiary }]}>
          No tasks yet — add one above
        </Text>
      ) : (
        visible.map((t: any) => {
          const done = t.completed === 1;
          return (
            <View
              key={t.id}
              style={[s.todoItem, { borderBottomColor: tc.divider }]}
            >
              <TouchableOpacity
                style={[
                  s.todoCheckbox,
                  { borderColor: tc.border },
                  done && { backgroundColor: tc.accent, borderColor: tc.accent },
                ]}
                onPress={() => toggleTodo(t.id, !done)}
                activeOpacity={0.6}
              >
                {done && (
                  <Icon name={LUCIDE_ICONS.check} size={12} color="#fff" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => toggleTodo(t.id, !done)}
                activeOpacity={0.6}
              >
                <Text
                  style={[
                    s.todoText,
                    { color: tc.text },
                    done && {
                      textDecorationLine: 'line-through',
                      color: tc.textTertiary,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {t.title}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
              onPress={() => deleteTodo(t.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name={LUCIDE_ICONS.x} size={14} color={tc.textTertiary} />
            </TouchableOpacity>
          </View>
        );
        })
      )}
    </Card>
  );
}

function ExpensesWidget() {
  const { theme } = useTheme();
  const tc = theme.colors;
  const addExpense = useApp((s) => s.addExpense);
  const todayTransactions = useApp((s) => s.todayTransactions);
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
    <Card>
      <View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text style={[s.cardTitle, { color: tc.textTertiary }]}>
            Expenses · ₹ {total.toFixed(2)}
          </Text>

          <TouchableOpacity
            style={[s.addExpBtn, { backgroundColor: tc.success }]}
            onPress={() => setShow(true)}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Icon
                name={LUCIDE_ICONS.plus}
                size={14}
                color="#fff"
                label="add expense"
              />
              <Text style={s.addExpBtnText}>Add Expense</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
      {exps.length > 0 ? (
        <View>
          {exps.slice(0, 5).map((t: any, i: number) => (
            <View
              key={t.id || i}
              style={[s.expRow, { borderBottomColor: tc.divider }]}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  width: 90,
                }}
              >
                <Icon
                  name={
                    LUCIDE_ICONS[CATEGORY_ICONS[t.category]] ?? LUCIDE_ICONS.pin
                  }
                  size={14}
                  color={tc.heading}
                  label={t.category}
                />
                <Text style={[s.expCat, { color: tc.heading }]}>
                  {t.category}
                </Text>
              </View>
              <Text
                style={[s.expDesc, { color: tc.textTertiary }]}
                numberOfLines={1}
              >
                {t.description}
              </Text>
              <Text style={[s.expAmt, { color: tc.error }]}>
                ₹ {t.amount.toFixed(2)}
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
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Icon
                name={LUCIDE_ICONS.dollarSign}
                size={20}
                color={tc.heading}
                label="add expense"
              />
              <Text style={[s.modalTitle, { color: tc.heading }]}>
                Add Expense
              </Text>
            </View>
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
                  <Icon
                    name={LUCIDE_ICONS[CATEGORY_ICONS[c]] ?? LUCIDE_ICONS.pin}
                    size={14}
                    color={cat === c ? tc.success : tc.textSecondary}
                    style={{ marginRight: 4 }}
                    label={c}
                  />
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
              Amount (₹)
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
  const monthlyStats = useApp((s) => s.monthlyStats);
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
  todos: TodoWidget,
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
                <Icon
                  name={LUCIDE_ICONS.arrowUp}
                  size={16}
                  color="#fff"
                  label="move up"
                />
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
                <Icon
                  name={LUCIDE_ICONS.arrowDown}
                  size={16}
                  color="#fff"
                  label="move down"
                />
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
  const loaded = useApp((s) => s.loaded);
  const streak = useApp((s) => s.streak);
  const setSidebarOpen = useApp((s) => s.setSidebarOpen);
  const refresh = useApp((s) => s.refresh);
  const widgetLayouts = useApp((s) => s.widgetLayouts);
  const setWidgetLayouts = useApp((s) => s.setWidgetLayouts);
  const saveWidgetLayouts = useApp((s) => s.saveWidgetLayouts);
  const userProfile = useApp((s) => s.userProfile);

  const [editing, setEditing] = useState(false);
  // const greeting = useMemo(() => getIslamicGreeting, []);
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
      setWidgetLayouts(
        items.map((w, i) => ({
          ...w,
          sort_order: i,
          id: w.id ?? 0,
          visible: w.visible ? 1 : 0,
        })) as any,
      );
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
            <Icon
              name={LUCIDE_ICONS.menu}
              size={20}
              color={tc.heading}
              label="menu"
            />
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
            <Icon
              name={LUCIDE_ICONS.menu}
              size={20}
              color={tc.heading}
              label="menu"
            />
          </TouchableOpacity>
          <View style={s.topCenter}>
            <Text style={[s.greeting, { color: tc.heading }]}>
              {getGreeting(userProfile?.name)}
            </Text>
            <Text style={[s.dateSmall, { color: tc.textTertiary }]}>
              {todayStr}
            </Text>
          </View>
          <TouchableOpacity onPress={refresh} style={s.iconBtn}>
            <Icon
              name={LUCIDE_ICONS.refreshCw}
              size={16}
              color={tc.heading}
              label="refresh"
            />
          </TouchableOpacity>
        </View>
        <View style={s.emptyContainer}>
          <Icon
            name={LUCIDE_ICONS.barChart2}
            size={48}
            color={tc.textTertiary}
            style={{ marginBottom: 8 }}
            label="dashboard"
          />
          <Text style={[s.emptyTitle, { color: tc.heading }]}>
            {userProfile?.name
              ? `Welcome, ${userProfile.name}`
              : "Welcome to your Dashboard"}
          </Text>
          <Text style={[s.emptySubtitle, { color: tc.textTertiary }]}>
            Tap refresh to load your data and start tracking.
          </Text>
          <TouchableOpacity
            style={[s.emptyRefreshBtn, { backgroundColor: tc.accent }]}
            onPress={refresh}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Icon
                name={LUCIDE_ICONS.refreshCw}
                size={14}
                color="#fff"
                label="refresh"
              />
              <Text style={s.emptyRefreshBtnText}>Refresh</Text>
            </View>
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
          <Icon
            name={LUCIDE_ICONS.menu}
            size={20}
            color={tc.heading}
            label="menu"
          />
        </TouchableOpacity>
        <View style={s.topCenter}>
          {!editing ? (
            <>
              <Text style={[s.greeting, { color: tc.heading }]}>
                {getGreeting(userProfile?.name)}
              </Text>
              <Text style={[s.dateSmall, { color: tc.textTertiary }]}>
                {todayStr}
              </Text>
            </>
          ) : (
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Icon
                name={LUCIDE_ICONS.arrowUp}
                size={14}
                color={tc.accent}
                label="reorder"
              />
              <Icon
                name={LUCIDE_ICONS.arrowDown}
                size={14}
                color={tc.accent}
                label="reorder"
              />
              <Text style={[s.editHint, { color: tc.accent }]}>
                Use arrows to reorder
              </Text>
            </View>
          )}
        </View>
        {!editing ? (
          <>
            <TouchableOpacity onPress={refresh} style={s.iconBtn}>
              <Icon
                name={LUCIDE_ICONS.refreshCw}
                size={16}
                color={tc.heading}
                label="refresh"
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setEditing(true)}
              style={[s.editBtn, { backgroundColor: tc.bgSecondary }]}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              >
                <Icon
                  name={LUCIDE_ICONS.edit}
                  size={12}
                  color={tc.accent}
                  label="edit"
                />
                <Text style={[s.editBtnText, { color: tc.accent }]}>Edit</Text>
              </View>
            </TouchableOpacity>
            <View style={[s.streak, { backgroundColor: tc.warningBg }]}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              >
                <Icon
                  name={LUCIDE_ICONS.zap}
                  size={12}
                  color={tc.warning}
                  label="streak"
                />
                <Text style={[s.streakText, { color: tc.warning }]}>
                  {streak}
                </Text>
              </View>
            </View>
          </>
        ) : (
          <TouchableOpacity
            onPress={exitEdit}
            style={[s.doneBtn, { backgroundColor: tc.accent }]}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Icon
                name={LUCIDE_ICONS.check}
                size={14}
                color="#fff"
                label="done"
              />
              <Text style={s.doneBtnText}>Done</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      <ReorderableList
        data={visible.map((w) => ({ ...w, visible: !!w.visible }))}
        onReorder={handleReorder}
        renderItem={renderCard}
        editing={editing}
        contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 48 }}
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
  qlLabel: { ...TYPOGRAPHY.bodySm, fontWeight: "600" },
  qlInputRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    paddingHorizontal: 6,
    paddingVertical: 6,
    gap: 6,
  },
  qlInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    fontSize: 14,
    fontWeight: "500",
  },
  qlBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
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

  todoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  todoInput: { flex: 1, paddingVertical: 8, fontSize: 14 },
  todoAddBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  todoEmpty: { fontSize: 13, paddingVertical: 8 },
  todoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
  },
  todoCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  todoText: { flex: 1, fontSize: 14 },
});
