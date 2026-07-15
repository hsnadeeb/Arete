import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
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
  Animated,
  PanResponder,
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
import * as db from "../db/service";
import { generateAiProgram } from "../services/ai";

// ─── Design tokens ───
// A single, shared scale keeps spacing/radius/typography consistent across
// every widget instead of each one inventing its own numbers.
const RADIUS = { sm: 8, md: 12, lg: 16, xl: 22, pill: 999 };
const SPACE = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 };

function cardShadow(color: string = "#000") {
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  } as const;
}

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

// Small reusable "icon in a tinted circle" bit used across widgets for a
// consistent, premium look instead of bare icons floating in rows.
function IconAvatar({
  icon,
  color,
  bg,
  size = 16,
  boxSize = 32,
}: {
  icon: any;
  color: string;
  bg: string;
  size?: number;
  boxSize?: number;
}) {
  return (
    <View
      style={{
        width: boxSize,
        height: boxSize,
        borderRadius: boxSize / 2,
        backgroundColor: bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon name={icon} size={size} color={color} />
    </View>
  );
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
  const timetable = useApp((s) => s.timetable);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 10000);
    return () => clearInterval(id);
  }, []);

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

  const nextCalendarItem = useMemo(() => {
    const day = now.getDay();
    const currentTime = now.toTimeString().slice(0, 5);

    const todayItems = timetable
      .filter((t: any) => {
        if (t.repeat_type === "once") {
          const ds = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
          return t.specific_date === ds;
        }
        if (t.repeat_type === "daily") return true;
        return t.day_of_week === day;
      })
      .sort((a: any, b: any) => a.start_time.localeCompare(b.start_time));

    const nowActive = todayItems.find(
      (t: any) =>
        t.start_time <= currentTime &&
        t.end_time &&
        t.end_time !== "" &&
        t.end_time >= currentTime,
    );
    if (nowActive) return { ...nowActive, _state: "now" };

    const upcoming = todayItems.find((t: any) => t.start_time > currentTime);
    if (upcoming) return { ...upcoming, _state: "upcoming" };

    if (todayItems.length > 0) return { ...todayItems[0], _state: "wrap" };

    return null;
  }, [timetable, now]);

  const allDone = useMemo(
    () => prayers.length >= 5 && prayers.every((p: any) => p.on_time === 1),
    [prayers],
  );

  return (
    <Card title="At a Glance" titleStyle={{ color: tc.textTertiary }}>
      {islamicDate && (
        <View style={s.glanceRow}>
          <View>
            <Text style={[s.hijriDate, { color: tc.heading }]}>
              {islamicDate.hijriDate} {islamicDate.hijriMonth}{" "}
              {islamicDate.hijriYear} AH
            </Text>
            <Text style={[s.hijriDay, { color: tc.textTertiary }]}>
              {islamicDate.dayOfWeek ||
                new Date().toLocaleDateString("en-US", { weekday: "long" })}
            </Text>
          </View>
        </View>
      )}

      {allDone ? (
        <View
          style={[
            s.nextPrayerBox,
            { backgroundColor: tc.successBg, borderColor: tc.success + "33" },
          ]}
        >
          <View style={s.rowCenter}>
            <IconAvatar
              icon={LUCIDE_ICONS.checkCircle}
              color="#fff"
              bg={tc.success}
              size={16}
              boxSize={30}
            />
            <Text style={[s.npLabelSolo, { color: tc.success }]}>
              All prayers completed
            </Text>
          </View>
        </View>
      ) : nextCalendarItem ? (
        <View
          style={[
            s.nextPrayerBox,
            { backgroundColor: tc.accentBg, borderColor: tc.accent + "33" },
          ]}
        >
          <Text style={[s.npLabel, { color: tc.accent }]}>
            {nextCalendarItem._state === "now"
              ? "Now"
              : nextCalendarItem._state === "wrap"
                ? "First Up"
                : "Up Next"}
          </Text>
          <View style={s.npMainRow}>
            <Text style={[s.npName, { color: tc.heading }]}>
              {nextCalendarItem.activity}
            </Text>
            <View style={[s.npBadge, { backgroundColor: tc.accent }]}>
              <Text style={s.npBadgeText}>
                {nextCalendarItem._state === "now" ? "LIVE" : "NEXT"}
              </Text>
            </View>
          </View>
          <Text style={[s.npTime, { color: tc.textSecondary }]}>
            {nextCalendarItem.start_time}
            {nextCalendarItem.end_time ? ` - ${nextCalendarItem.end_time}` : ""}
          </Text>
        </View>
      ) : nextPrayer ? (
        <View
          style={[
            s.nextPrayerBox,
            { backgroundColor: tc.accentBg, borderColor: tc.accent + "33" },
          ]}
        >
          <Text style={[s.npLabel, { color: tc.accent }]}>Next Prayer</Text>
          <View style={s.npMainRow}>
            <Text style={[s.npName, { color: tc.heading }]}>
              {nextPrayer.name}
            </Text>
            <View style={[s.npBadge, { backgroundColor: tc.accent }]}>
              <Text style={s.npBadgeText}>{nextPrayer.remaining}</Text>
            </View>
          </View>
          <Text style={[s.npTime, { color: tc.textSecondary }]}>
            at {t12(nextPrayer.time)}
          </Text>
        </View>
      ) : null}

      {prayerTimings && (
        <View style={s.prayerStrip}>
          {PRAYER_TIMES_ORDER.filter((p) => p !== "sunrise").map((prayer) => {
            const time = prayerTimings[prayer] as string;
            const [h, m] = (time || "").split(":").map(Number);
            const prayerMinutes = h * 60 + m;
            const nowMinutes =
              new Date().getHours() * 60 + new Date().getMinutes();
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
                    ? togglePrayer(
                        prayer.charAt(0).toUpperCase() + prayer.slice(1),
                      )
                    : undefined
                }
                style={[
                  s.pStripItem,
                  {
                    backgroundColor: done ? tc.accent : tc.bgSecondary,
                    borderColor: done ? tc.accent : tc.borderLight,
                  },
                  done && cardShadow(tc.accent),
                  isNext &&
                    !done && { borderColor: tc.accent, borderWidth: 1.5 },
                  !canToggle && { opacity: 0.45 },
                  allDone && { opacity: 0.4 },
                ]}
                disabled={!canToggle}
                activeOpacity={0.7}
              >
                <Icon
                  name={PRAYER_ICONS[prayer]?.name ?? LUCIDE_ICONS.sun}
                  size={14}
                  color={done ? "#fff" : tc.textTertiary}
                  style={{ marginBottom: 4 }}
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
                  <View style={[s.qadaBadge, { backgroundColor: tc.warning }]}>
                    <Text style={s.qadaBadgeText}>Q</Text>
                  </View>
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
          activeOpacity={0.7}
        >
          <View style={s.rowCenterGap6}>
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
          style={{ marginTop: SPACE.sm }}
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
      key: "weight",
      l: "Weight",
      icon: LUCIDE_ICONS.weight,
      color: tc.info,
      v: w,
      set: setW,
      ph: "e.g. 70.5",
      action: () => {
        const n = parseFloat(w);
        if (n > 0 && n < 300) {
          logWeight(n);
          setW("");
        }
      },
    },
    {
      key: "water",
      l: "Water",
      icon: LUCIDE_ICONS.droplet,
      color: "#0ea5e9",
      v: wa,
      set: setWa,
      ph: "ml, e.g. 250",
      action: () => {
        const n = parseInt(wa);
        if (n > 0) {
          logWater((dailyLog?.water_ml || 0) + n);
          setWa("");
        }
      },
    },
    {
      key: "steps",
      l: "Steps",
      icon: LUCIDE_ICONS.activity,
      color: tc.warning,
      v: st,
      set: setSt,
      ph: "e.g. 8000",
      action: () => {
        const n = parseInt(st);
        if (n > 0) {
          logSteps(n);
          setSt("");
        }
      },
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
        ? `${"\u25CF".repeat(dailyLog.mood)}${"\u25CB".repeat(5 - dailyLog.mood)}`
        : "\u2014",
      c: tc.accent,
    },
  ];

  return (
    <Card title="Quick Log" titleStyle={{ color: tc.textTertiary }}>
      <View style={s.statGrid}>
        {items.map((it) => (
          <View
            key={it.l}
            style={[s.statTile, { backgroundColor: tc.bgSecondary }]}
          >
            <Text style={[s.statValue, { color: it.c }]}>{it.v}</Text>
            <Text style={[s.statLabel, { color: tc.textTertiary }]}>
              {it.l}
            </Text>
          </View>
        ))}
      </View>
      <View style={{ gap: SPACE.sm, marginTop: SPACE.sm }}>
        {rows.map((r) => (
          <View key={r.key} style={s.qlRow}>
            <IconAvatar icon={r.icon} color={r.color} bg={r.color + "1A"} />
            <View style={[s.qlInputRow, { backgroundColor: tc.bgSecondary }]}>
              <TextInput
                style={[s.qlInput, { color: tc.text }]}
                value={r.v}
                onChangeText={r.set}
                keyboardType="numeric"
                placeholder={r.ph}
                placeholderTextColor={tc.placeholder}
              />
              <TouchableOpacity
                style={[
                  s.qlBtn,
                  {
                    backgroundColor: r.v ? tc.accent : tc.border,
                  },
                ]}
                onPress={r.action}
                activeOpacity={0.7}
                disabled={!r.v}
              >
                <Icon name={LUCIDE_ICONS.plus} size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
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
        {moods.map((m) => {
          const selected = dailyLog?.mood === m.v;
          return (
            <TouchableOpacity
              key={m.v}
              style={[
                s.moodBtn,
                {
                  backgroundColor: tc.bgSecondary,
                  borderColor: tc.borderLight,
                },
                selected && {
                  backgroundColor: tc.accentBg,
                  borderColor: tc.accent,
                },
                selected && cardShadow(tc.accent),
              ]}
              onPress={() => logMood(m.v)}
              activeOpacity={0.7}
            >
              <Icon
                name={m.icon}
                size={20}
                color={selected ? tc.accent : tc.textTertiary}
                style={{ marginBottom: 4 }}
                label={m.l}
              />
              <Text
                style={[
                  s.moodLabel,
                  { color: tc.textTertiary },
                  selected && { color: tc.accent, fontWeight: "700" },
                ]}
              >
                {m.l}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </Card>
  );
}

// Swipe-left-to-delete row. Uses only the built-in Animated + PanResponder
// APIs (no extra gesture-library dependency needed) and collapses its own
// height smoothly once the delete animation finishes.
const SWIPE_DELETE_THRESHOLD = -90;
const SWIPE_MAX = -84;

function SwipeableTodoRow({
  todo,
  tc,
  onToggle,
  onDelete,
}: {
  todo: any;
  tc: any;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const collapse = useRef(new Animated.Value(1)).current; // 1 = full size, animates to 0
  const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);
  const isDeleting = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, g) =>
        Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderMove: (_, g) => {
        if (g.dx < 0) {
          translateX.setValue(Math.max(g.dx, SWIPE_MAX * 1.4));
        } else {
          translateX.setValue(0);
        }
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx < SWIPE_DELETE_THRESHOLD) {
          runDelete();
        } else if (g.dx < SWIPE_MAX / 2) {
          Animated.spring(translateX, {
            toValue: SWIPE_MAX,
            useNativeDriver: true,
            bounciness: 0,
          }).start();
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 0,
          }).start();
        }
      },
    }),
  ).current;

  const runDelete = () => {
    if (isDeleting.current) return;
    isDeleting.current = true;
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: -420,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(collapse, {
        toValue: 0,
        duration: 220,
        useNativeDriver: false,
      }),
    ]).start(({ finished }) => {
      if (finished) onDelete();
    });
  };

  const done = todo.completed === 1;

  return (
    <Animated.View
      style={{
        opacity: collapse,
        maxHeight:
          measuredHeight != null
            ? collapse.interpolate({
                inputRange: [0, 1],
                outputRange: [0, measuredHeight],
              })
            : undefined,
        overflow: "hidden",
      }}
    >
      <View
        onLayout={(e) => {
          if (measuredHeight == null) {
            setMeasuredHeight(e.nativeEvent.layout.height);
          }
        }}
      >
        <View style={[s.swipeBg, { backgroundColor: tc.error }]}>
          <TouchableOpacity
            style={s.swipeBgTouchable}
            onPress={runDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name={LUCIDE_ICONS.x} size={18} color="#fff" label="delete" />
          </TouchableOpacity>
        </View>
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            s.todoItem,
            { borderBottomColor: tc.divider, backgroundColor: tc.surface },
            { transform: [{ translateX }] },
          ]}
        >
          <TouchableOpacity
            style={[
              s.todoCheckbox,
              { borderColor: tc.border },
              done && {
                backgroundColor: tc.accent,
                borderColor: tc.accent,
              },
            ]}
            onPress={onToggle}
            activeOpacity={0.6}
          >
            {done && <Icon name={LUCIDE_ICONS.check} size={12} color="#fff" />}
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={onToggle}
            activeOpacity={0.6}
          >
            <Text
              style={[
                s.todoText,
                { color: tc.text },
                done && {
                  textDecorationLine: "line-through",
                  color: tc.textTertiary,
                },
              ]}
              numberOfLines={1}
            >
              {todo.title}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Animated.View>
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
        <View style={s.todoEmptyWrap}>
          <Icon
            name={LUCIDE_ICONS.checkCircle}
            size={20}
            color={tc.textTertiary}
            label="no tasks"
          />
          <Text style={[s.todoEmpty, { color: tc.textTertiary }]}>
            No tasks yet — add one above
          </Text>
        </View>
      ) : (
        <>
          {visible.map((t: any) => (
            <SwipeableTodoRow
              key={t.id}
              todo={t}
              tc={tc}
              onToggle={() => toggleTodo(t.id, !(t.completed === 1))}
              onDelete={() => deleteTodo(t.id)}
            />
          ))}
          <Text style={[s.swipeHint, { color: tc.textTertiary }]}>
            Swipe left to delete
          </Text>
        </>
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
  const total = exps.reduce((sum: number, t: any) => sum + t.amount, 0);
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
      <View style={s.expHeaderRow}>
        <View>
          <Text style={[s.cardTitle, { color: tc.heading }]}>Expenses</Text>
          <Text style={[s.expTotal, { color: tc.error }]}>
            ₹ {total.toFixed(2)} today
          </Text>
        </View>
        <TouchableOpacity
          style={[s.addExpBtn, { backgroundColor: tc.success }]}
          onPress={() => setShow(true)}
          activeOpacity={0.8}
        >
          <View style={s.rowCenterGap6}>
            <Icon
              name={LUCIDE_ICONS.plus}
              size={14}
              color="#fff"
              label="add expense"
            />
            <Text style={s.addExpBtnText}>Add</Text>
          </View>
        </TouchableOpacity>
      </View>
      {exps.length > 0 ? (
        <View style={{ marginTop: SPACE.xs }}>
          {exps.slice(0, 5).map((t: any, i: number) => (
            <View
              key={t.id || i}
              style={[s.expRow, { borderBottomColor: tc.divider }]}
            >
              <IconAvatar
                icon={
                  LUCIDE_ICONS[CATEGORY_ICONS[t.category]] ?? LUCIDE_ICONS.pin
                }
                color={tc.heading}
                bg={tc.bgSecondary}
                size={14}
                boxSize={28}
              />
              <View style={s.expMid}>
                <Text style={[s.expCat, { color: tc.heading }]}>
                  {t.category}
                </Text>
                <Text
                  style={[s.expDesc, { color: tc.textTertiary }]}
                  numberOfLines={1}
                >
                  {t.description || "—"}
                </Text>
              </View>
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
          <View
            style={[s.modal, { backgroundColor: tc.surface }, cardShadow()]}
          >
            <View style={s.modalHandle} />
            <View style={s.rowCenterGap8}>
              <IconAvatar
                icon={LUCIDE_ICONS.dollarSign}
                color={tc.success}
                bg={tc.successBg}
                boxSize={36}
                size={18}
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
                  activeOpacity={0.7}
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
                activeOpacity={0.7}
              >
                <Text style={[s.cancelBtnText, { color: tc.textTertiary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.saveBtn, { backgroundColor: tc.success }]}
                onPress={handleAdd}
                activeOpacity={0.85}
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
          style={{
            color: tc.textTertiary,
            textAlign: "center",
            padding: SPACE.md,
          }}
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
          <View
            key={it.l}
            style={[s.statTile, { backgroundColor: tc.bgSecondary }]}
          >
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

function AiPlanWidget() {
  const { theme } = useTheme();
  const tc = theme.colors;
  const [gymProg, setGymProg] = useState<any>(null);
  const [mealProg, setMealProg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const gp = await db.getActiveAiProgram("gym");
        const mp = await db.getActiveAiProgram("food");
        if (mounted) {
          setGymProg(gp ? await db.getAiProgramWithItems(gp.id) : null);
          setMealProg(mp ? await db.getAiProgramWithItems(mp.id) : null);
        }
      } catch (e) {
        console.error("AiPlanWidget load failed:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [refreshTick]);

  const todayIdx = new Date().getDay();

  const detailsForProgram = (prog: any) => {
    const items =
      prog?.items?.filter((i: any) => i.day_index === todayIdx) || [];
    return items.flatMap((item: any) =>
      (prog?.details || [])
        .filter((d: any) => d.item_id === item.id)
        .sort((a: any, b: any) => a.sort_order - b.sort_order),
    );
  };

  const gymDetails = gymProg ? detailsForProgram(gymProg) : [];
  const mealDetails = mealProg ? detailsForProgram(mealProg) : [];

  const handleToggle = async (detailId: number, current: number) => {
    await db.toggleAiProgramItemDetail(detailId, current ? 0 : 1);
    setRefreshTick((t) => t + 1);
  };

  const handleRegenerate = async (type: "gym" | "food") => {
    try {
      await generateAiProgram(type);
      setRefreshTick((t) => t + 1);
    } catch (e: any) {
      Alert.alert("Generation Failed", e.message);
    }
  };

  const handleReset = async (programId: number) => {
    await db.resetAiProgramCompletions(programId);
    setRefreshTick((t) => t + 1);
  };

  const formatSubtitle = (detail: any) => {
    try {
      const m = JSON.parse(detail.metadata_json || "{}");
      if (detail.type === "exercise") {
        return `${m.sets ?? "—"}×${m.reps ?? "—"} @ ${m.weight || "—"}`;
      }
      return `${m.calories ?? "—"} cal · P:${m.protein ?? "—"}`;
    } catch {
      return "";
    }
  };

  if (loading) {
    return (
      <Card title="Today's Plan" titleStyle={{ color: tc.textTertiary }}>
        <ActivityIndicator
          size="small"
          color={tc.accent}
          style={{ margin: SPACE.md }}
        />
      </Card>
    );
  }

  if (!gymProg && !mealProg) {
    return (
      <Card title="Today's Plan" titleStyle={{ color: tc.textTertiary }}>
        <View style={s.aiEmptyWrap}>
          <IconAvatar
            icon={LUCIDE_ICONS.sparkles}
            color={tc.accent}
            bg={tc.accentBg}
            boxSize={44}
            size={22}
          />
          <Text style={[s.aiEmptyText, { color: tc.textSecondary }]}>
            No AI plan yet. Go to Journal → Gym or Food to generate one.
          </Text>
        </View>
      </Card>
    );
  }

  const renderPlanCard = (
    prog: any,
    details: any[],
    emoji: string,
    type: "gym" | "food",
  ) => (
    <View
      style={[
        s.planMiniCard,
        { backgroundColor: tc.bgSecondary, borderColor: tc.border },
      ]}
    >
      <View style={s.planHeaderRow}>
        <Text style={[s.planTitle, { color: tc.text }]} numberOfLines={1}>
          {emoji} {prog.title}
        </Text>
        <TouchableOpacity
          onPress={() => handleRegenerate(type)}
          style={s.planIconBtn}
          activeOpacity={0.6}
        >
          <Icon name={LUCIDE_ICONS.refresh} size={14} color={tc.accent} />
        </TouchableOpacity>
      </View>
      {details.slice(0, 5).map((detail: any) => (
        <View
          key={detail.id}
          style={[s.planMiniRow, { borderBottomColor: tc.divider }]}
        >
          <TouchableOpacity
            onPress={() => handleToggle(detail.id, detail.is_completed)}
            style={[
              s.miniCheckbox,
              { borderColor: tc.border },
              detail.is_completed === 1 && {
                backgroundColor: tc.success,
                borderColor: tc.success,
              },
            ]}
            activeOpacity={0.6}
          >
            {detail.is_completed === 1 && (
              <Icon name={LUCIDE_ICONS.check} size={10} color="#fff" />
            )}
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "500",
                color: detail.is_completed ? tc.textTertiary : tc.text,
                textDecorationLine: detail.is_completed
                  ? "line-through"
                  : "none",
              }}
            >
              {detail.name}
            </Text>
            <Text
              style={{ fontSize: 10, color: tc.textTertiary, marginTop: 1 }}
            >
              {formatSubtitle(detail)}
            </Text>
          </View>
        </View>
      ))}
      {details.length > 5 && (
        <Text style={{ fontSize: 11, color: tc.textTertiary, paddingLeft: 28 }}>
          +{details.length - 5} more
        </Text>
      )}
      <TouchableOpacity
        onPress={() => handleReset(prog.id)}
        style={{ paddingTop: 2 }}
        activeOpacity={0.6}
      >
        <Text style={{ fontSize: 11, fontWeight: "600", color: tc.accent }}>
          {details.filter((d: any) => d.is_completed).length}/{details.length}{" "}
          done
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Card title="Today's Plan" titleStyle={{ color: tc.textTertiary }}>
      <View style={{ gap: SPACE.md }}>
        {gymProg && renderPlanCard(gymProg, gymDetails, "🏋️", "gym")}
        {mealProg && renderPlanCard(mealProg, mealDetails, "🍽️", "food")}
      </View>
    </Card>
  );
}

const WIDGET_MAP: Record<string, React.FC> = {
  "at-a-glance": AtAGlanceWidget,
  "ai-plan": AiPlanWidget,
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
                { backgroundColor: tc.accentBg, borderColor: tc.accent + "40" },
              ]}
            >
              <TouchableOpacity
                style={[
                  s.editArrow,
                  { backgroundColor: tc.accent },
                  index === 0 && { backgroundColor: tc.border },
                ]}
                onPress={() => moveUp(index)}
                disabled={index === 0}
                activeOpacity={0.7}
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
                  { backgroundColor: tc.accent },
                  index === data.length - 1 && { backgroundColor: tc.border },
                ]}
                onPress={() => moveDown(index)}
                disabled={index === data.length - 1}
                activeOpacity={0.7}
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
            activeOpacity={0.7}
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
            activeOpacity={0.7}
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
          <TouchableOpacity
            onPress={refresh}
            style={s.iconBtn}
            activeOpacity={0.7}
          >
            <Icon
              name={LUCIDE_ICONS.refreshCw}
              size={16}
              color={tc.heading}
              label="refresh"
            />
          </TouchableOpacity>
        </View>
        <View style={s.emptyContainer}>
          <IconAvatar
            icon={LUCIDE_ICONS.barChart2}
            color={tc.accent}
            bg={tc.accentBg}
            boxSize={72}
            size={32}
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
            activeOpacity={0.85}
          >
            <View style={s.rowCenterGap6}>
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
          cardShadow(),
        ]}
      >
        <TouchableOpacity
          onPress={() => setSidebarOpen(true)}
          style={s.menuBtn}
          activeOpacity={0.7}
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
            <View style={s.rowCenterGap6}>
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
            <TouchableOpacity
              onPress={refresh}
              style={s.iconBtn}
              activeOpacity={0.7}
            >
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
              activeOpacity={0.7}
            >
              <View style={s.rowCenterGap4}>
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
              <View style={s.rowCenterGap4}>
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
            activeOpacity={0.85}
          >
            <View style={s.rowCenterGap4}>
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
        contentContainerStyle={{
          paddingHorizontal: SPACE.md,
          paddingTop: SPACE.sm,
          paddingBottom: 48,
        }}
      />
    </SafeAreaView>
  );
}

// ─── Styles (static layout, dynamic colors inline) ───

const s = StyleSheet.create({
  safe: { flex: 1 },

  // Shared row helpers
  rowCenter: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowCenterGap4: { flexDirection: "row", alignItems: "center", gap: 4 },
  rowCenterGap6: { flexDirection: "row", alignItems: "center", gap: 6 },
  rowCenterGap8: { flexDirection: "row", alignItems: "center", gap: 8 },

  topbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACE.lg,
    height: 58,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuBtn: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  topCenter: { flex: 1, marginLeft: SPACE.sm },
  greeting: { fontSize: 15, fontWeight: "800", letterSpacing: 0.1 },
  dateSmall: { fontSize: 11, marginTop: 2, fontWeight: "500" },
  editHint: { fontSize: 13, fontWeight: "600" },
  iconBtn: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 2,
  },
  editBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    marginRight: SPACE.sm,
  },
  editBtnText: { fontSize: 12, fontWeight: "700" },
  doneBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
  },
  doneBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  streak: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
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
    gap: 10,
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 4,
  },
  emptyRefreshBtn: {
    marginTop: 12,
    paddingVertical: 13,
    paddingHorizontal: 26,
    borderRadius: RADIUS.md,
  },
  emptyRefreshBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  cardWrap: { marginBottom: SPACE.md, position: "relative" },

  planMiniCard: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACE.md,
    gap: SPACE.xs,
  },
  planHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  planTitle: { fontSize: 14, fontWeight: "700", flex: 1 },
  planIconBtn: { padding: 4 },
  planMiniRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  miniCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },

  aiEmptyWrap: { padding: SPACE.lg, alignItems: "center", gap: SPACE.sm },
  aiEmptyText: { textAlign: "center", fontSize: 13, lineHeight: 19 },

  editControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACE.xl,
    paddingVertical: SPACE.sm,
    marginBottom: SPACE.md,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  editArrow: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  editIndex: {
    fontSize: 13,
    fontWeight: "800",
    minWidth: 20,
    textAlign: "center",
  },

  glanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACE.sm,
  },
  hijriDate: { fontSize: 14, fontWeight: "700" },
  hijriDay: { fontSize: 12, fontWeight: "500", marginTop: 2 },
  nextPrayerBox: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACE.md,
    marginBottom: SPACE.md,
  },
  npLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  npLabelSolo: { fontSize: 14, fontWeight: "700" },
  npTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  npMainRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: SPACE.sm,
  },
  npName: { fontSize: 17, fontWeight: "800" },
  npBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  npBadgeText: { fontSize: 11, fontWeight: "800", color: "#fff" },
  npTime: { fontSize: 12, marginTop: 2, fontWeight: "500" },
  qadaChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  qadaChipText: { fontSize: 10, fontWeight: "800", color: "#fff" },
  markDoneBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: RADIUS.pill,
  },
  markDoneBtnText: { fontSize: 12, fontWeight: "700", color: "#fff" },
  refreshPrayerBtn: {
    paddingVertical: SPACE.sm + 2,
    borderRadius: RADIUS.md,
    alignItems: "center",
    marginTop: SPACE.xs,
  },
  refreshPrayerBtnText: { fontSize: 13, fontWeight: "700" },

  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACE.sm,
  },
  statTile: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    width: "47.5%",
    borderRadius: RADIUS.md,
    paddingVertical: SPACE.md,
  },
  statValue: { fontSize: 18, fontWeight: "800" },
  statLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    textAlign: "center",
  },

  qlRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.sm,
  },
  qlInputRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: RADIUS.pill,
    paddingLeft: SPACE.md,
    paddingRight: 5,
    height: 46,
    gap: 6,
  },
  qlInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  qlBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.pill,
    alignItems: "center",
    justifyContent: "center",
  },

  moodRow: { flexDirection: "row", gap: SPACE.sm },
  moodBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: SPACE.md - 2,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  moodLabel: { fontSize: 10, fontWeight: "700" },

  cardTitle: { fontSize: 17, fontWeight: "800" },
  expHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACE.sm,
  },
  expTotal: { fontSize: 13, fontWeight: "700", marginTop: 2 },
  addExpBtn: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: RADIUS.sm,
  },
  addExpBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  expRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: SPACE.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  expMid: { flex: 1 },
  expCat: { fontSize: 13, fontWeight: "700" },
  expDesc: { fontSize: 12, marginTop: 1 },
  expAmt: { fontSize: 13, fontWeight: "700" },
  expEmpty: { textAlign: "center", fontSize: 13, paddingVertical: SPACE.md },

  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modal: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACE.xl,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#00000022",
    alignSelf: "center",
    marginBottom: SPACE.md,
  },
  modalTitle: { fontSize: 19, fontWeight: "800" },
  label: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
    marginTop: SPACE.md,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: SPACE.sm },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  catLabel: { fontSize: 12, fontWeight: "600" },
  modalInput: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  modalActions: { flexDirection: "row", gap: SPACE.md, marginTop: SPACE.lg },
  cancelBtn: {
    flex: 1,
    paddingVertical: SPACE.md + 2,
    borderRadius: RADIUS.md,
    alignItems: "center",
  },
  cancelBtnText: { fontSize: 15, fontWeight: "700" },
  saveBtn: {
    flex: 1,
    paddingVertical: SPACE.md + 2,
    borderRadius: RADIUS.md,
    alignItems: "center",
  },
  saveBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },

  todoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.sm,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    paddingHorizontal: SPACE.md,
    paddingVertical: 4,
    marginBottom: SPACE.sm,
  },
  todoInput: { flex: 1, paddingVertical: 10, fontSize: 14 },
  todoAddBtn: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  todoEmptyWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACE.sm,
    paddingVertical: SPACE.lg,
  },
  todoEmpty: { fontSize: 13 },
  todoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACE.sm + 2,
    gap: SPACE.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  todoCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  todoText: { flex: 1, fontSize: 14, fontWeight: "500" },

  prayerStrip: {
    flexDirection: "row",
    gap: SPACE.sm,
  },
  pStripItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACE.sm + 2,
    paddingHorizontal: SPACE.xs,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    minWidth: 58,
  },
  pStripLabel: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    textAlign: "center",
  },
  pStripTime: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
    textAlign: "center",
  },
  qadaBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  qadaBadgeText: { fontSize: 10, fontWeight: "800", color: "#fff" },

  swipeBg: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    width: 84,
    alignItems: "center",
    justifyContent: "center",
  },
  swipeBgTouchable: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  swipeHint: {
    fontSize: 11,
    textAlign: "center",
    marginTop: SPACE.xs,
    fontWeight: "500",
  },
});
