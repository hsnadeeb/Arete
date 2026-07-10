import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  AppState,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useStore } from "../store";
import { useTheme } from "../context/ThemeContext";
import { Icon } from "../components/Icons";
import { LUCIDE_ICONS, TYPOGRAPHY } from "../constants/typography";

function formatTime(d: Date): string {
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function dayProgress(): number {
  const now = new Date();
  const sec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  return (sec / 86400) * 100;
}

function yearProgress(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 86400000;
  const dayOfYear = Math.floor(diff / oneDay);
  const total = (now.getFullYear() % 4 === 0 && (now.getFullYear() % 100 !== 0 || now.getFullYear() % 400 === 0)) ? 366 : 365;
  return (dayOfYear / total) * 100;
}

export default function GreetingScreen() {
  const { theme, isDark } = useTheme();
  const tc = theme.colors;
  const setCurrentRoute = useStore((s) => s.setCurrentRoute);
  const timetable = useStore((s) => s.timetable);
  const islamicDate = useStore((s) => s.islamicDate);
  const prayerTimings = useStore((s) => s.prayerTimings);
  const refreshPrayerTimings = useStore((s) => s.refreshPrayerTimings);

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 10000);
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") tick();
    });
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, []);

  useEffect(() => {
    if (!prayerTimings) {
      refreshPrayerTimings();
    }
  }, []);

  const nextItem = useMemo(() => {
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

    // 1. Currently active (start_time <= current <= end_time, only if end_time is set)
    const nowActive = todayItems.find(
      (t: any) =>
        t.start_time <= currentTime &&
        t.end_time &&
        t.end_time !== "" &&
        t.end_time >= currentTime
    );
    if (nowActive) return { ...nowActive, _state: "now" };

    // 2. Next upcoming (any future task, regardless of end_time)
    const upcoming = todayItems.find((t: any) => t.start_time > currentTime);
    if (upcoming) return { ...upcoming, _state: "upcoming" };

    // 3. Wrap-around — first item of the day (for after-midnight display)
    if (todayItems.length > 0) return { ...todayItems[0], _state: "wrap" };

    return null;
  }, [timetable, now]);

  const dayPct = useMemo(() => dayProgress(), [now]);
  const yearPct = useMemo(() => yearProgress(), [now]);

  const breath = useRef(new Animated.Value(1)).current;
  const ringScale2 = useRef(new Animated.Value(1)).current;
  const ringScale3 = useRef(new Animated.Value(1)).current;
  const textPulse = useRef(new Animated.Value(1)).current;

  // Floating sparkle dots: each with a vertical bob + horizontal drift
  const sparkles = useRef(
    Array.from({ length: 5 }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    const loops: Animated.CompositeAnimation[] = [];

    // Inner breathing
    loops.push(
      Animated.loop(
        Animated.sequence([
          Animated.timing(breath, { toValue: 1.04, duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(breath, { toValue: 1, duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      )
    );

    // Outer ring — slower, wider pulse
    loops.push(
      Animated.loop(
        Animated.sequence([
          Animated.timing(ringScale2, { toValue: 1.07, duration: 3800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(ringScale2, { toValue: 1, duration: 3800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      )
    );

    // Outermost ring — even slower
    loops.push(
      Animated.loop(
        Animated.sequence([
          Animated.timing(ringScale3, { toValue: 1.1, duration: 5200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(ringScale3, { toValue: 1, duration: 5200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      )
    );

    // Text label pulse
    loops.push(
      Animated.loop(
        Animated.sequence([
          Animated.timing(textPulse, { toValue: 1.04, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(textPulse, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      )
    );

    // Sparkle bobbing — each sparkle drifts in a small figure-8-ish path
    sparkles.forEach((s, i) => {
      const dur = 5000 + i * 1200;
      loops.push(
        Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(s.x, { toValue: i % 2 === 0 ? 18 : -18, duration: dur / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
              Animated.timing(s.y, { toValue: -12, duration: dur / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(s.x, { toValue: i % 2 === 0 ? -18 : 18, duration: dur / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
              Animated.timing(s.y, { toValue: 12, duration: dur / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            ]),
          ])
        )
      );
    });

    Animated.parallel(loops).start();
    return () => loops.forEach((l) => l.stop());
  }, []);

  const mountOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(mountOpacity, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [mountOpacity]);

  const accentColor = nextItem?.color || tc.accent;
  const timeStr = formatTime(now);
  const timeDigits = timeStr.replace(/[^0-9]/g, "");
  const timeSuffix = timeStr.replace(/[0-9]/g, "").trim();

  return (
    <SafeAreaView
      style={[s.screen, { backgroundColor: tc.bg }]}
      edges={["top", "bottom"]}
    >
      {/* Content area — fills space, bubble stays roughly centered */}
      <Animated.View style={[s.contentArea, { opacity: mountOpacity }]}>
        <View style={{ flex: 0.3 }} />

        {/* Time & Date */}
        <View style={s.topSection}>
          <View style={s.timeRow}>
            <Text style={[s.time, { color: tc.heading }]}>{timeDigits}</Text>
            <Text style={[s.timeAmPm, { color: tc.textSecondary }]}>
              {timeSuffix}
            </Text>
          </View>
          <Text style={[s.date, { color: tc.textSecondary }]}>
            {formatDate(now)}
          </Text>
          {islamicDate && (
            <Text style={[s.hijri, { color: tc.textTertiary }]}>
              {islamicDate.hijriDate} {islamicDate.hijriMonth}{" "}
              {islamicDate.hijriYear} AH
            </Text>
          )}
        </View>

        {/* Progress bars */}
        <View style={s.progressSection}>
          <View style={s.progressRow}>
            <View style={s.progressMeta}>
              <Text style={[s.progressLabel, { color: tc.textTertiary }]}>Day</Text>
              <Text style={[s.progressPct, { color: tc.textSecondary }]}>
                {dayPct.toFixed(1)}%
              </Text>
            </View>
            <View style={[s.progressTrack, { backgroundColor: tc.borderLight }]}>
              <View
                style={[
                  s.progressFill,
                  { width: `${dayPct}%` as any, backgroundColor: tc.accent },
                ]}
              />
            </View>
          </View>
          <View style={s.progressRow}>
            <View style={s.progressMeta}>
              <Text style={[s.progressLabel, { color: tc.textTertiary }]}>Year</Text>
              <Text style={[s.progressPct, { color: tc.textSecondary }]}>
                {yearPct.toFixed(1)}%
              </Text>
            </View>
            <View style={[s.progressTrack, { backgroundColor: tc.borderLight }]}>
              <View
                style={[
                  s.progressFill,
                  { width: `${yearPct}%` as any, backgroundColor: tc.accent },
                ]}
              />
            </View>
          </View>
        </View>

        <View style={{ flex: 0.4 }} />

        {/* Soothing bubble — animated concentric rings + sparkles */}
        <View style={s.bubbleStage}>
          {/* Outermost ring */}
          <Animated.View
            style={[
              s.bubbleRing3,
              {
                borderColor: isDark ? accentColor + "18" : accentColor + "0c",
                transform: [{ scale: ringScale3 }],
              },
            ]}
          />
          {/* Middle ring */}
          <Animated.View
            style={[
              s.bubbleRing2,
              {
                borderColor: isDark ? accentColor + "20" : accentColor + "10",
                transform: [{ scale: ringScale2 }],
              },
            ]}
          />
          {/* Core breathing bubble */}
          <Animated.View
            style={[
              s.bubbleOuter,
              {
                transform: [{ scale: breath }],
                backgroundColor: isDark ? accentColor + "18" : accentColor + "0a",
                borderColor: isDark ? accentColor + "25" : accentColor + "14",
              },
            ]}
          >
            <Animated.View
              style={[
                s.bubbleInner,
                {
                  backgroundColor: isDark ? accentColor + "22" : accentColor + "10",
                  borderColor: isDark ? accentColor + "30" : accentColor + "18",
                },
              ]}
            >
              {nextItem ? (
                <Animated.View style={[{ transform: [{ scale: textPulse }] }, s.bubbleTextWrap]}>
                  <Text style={[s.bubbleHead, { color: accentColor }]}>
                    {nextItem._state === "now"
                      ? "Now"
                      : nextItem._state === "wrap"
                      ? "First Up"
                      : "Up Next"}
                  </Text>
                  <Text
                    style={[s.bubbleTitle, { color: isDark ? "#fff" : tc.heading }]}
                    numberOfLines={1}
                  >
                    {nextItem.activity}
                  </Text>
                  <Text style={[s.bubbleSub, { color: tc.textTertiary }]}>
                    {nextItem.start_time}
                    {nextItem.end_time ? ` - ${nextItem.end_time}` : ""}
                  </Text>
                </Animated.View>
              ) : (
                <View style={s.bubbleTextWrap}>
                  <Icon name={LUCIDE_ICONS.clock} size={22} color={tc.textTertiary} label="clock" />
                  <Text style={[s.bubbleHead, { color: tc.textTertiary, marginTop: 8 }]}>
                    All Clear
                  </Text>
                  <Text style={[s.bubbleSub, { color: tc.muted }]}>
                    Nothing scheduled
                  </Text>
                </View>
              )}
            </Animated.View>
          </Animated.View>

          {/* Floating sparkles */}
          {nextItem &&
            sparkles.map((s, i) => {
              const angleOffset = (i / sparkles.length) * Math.PI * 2;
              const orbitR = 120;
              const cx = Math.cos(angleOffset) * orbitR;
              const cy = Math.sin(angleOffset) * orbitR;
              return (
                <Animated.View
                  key={i}
                  style={[
                    s.sparkle,
                    {
                      backgroundColor: accentColor,
                      opacity: textPulse.interpolate({
                        inputRange: [1, 1.04],
                        outputRange: [0.15, 0.45],
                      }),
                      transform: [
                        { translateX: s.x },
                        { translateY: s.y },
                        { translateX: cx },
                        { translateY: cy },
                      ],
                    },
                  ]}
                />
              );
            })}
        </View>

        <View style={{ flex: 1 }} />
      </Animated.View>

      {/* Action buttons — pinned to bottom */}
      <View style={s.bottomButtons}>
        <TouchableOpacity
          style={[s.enterBtn, { backgroundColor: tc.accent }]}
          onPress={() => setCurrentRoute("Dashboard")}
          activeOpacity={0.85}
        >
          <Text style={s.enterBtnText}>Enter Brain</Text>
          <Icon name={LUCIDE_ICONS.arrowRight} size={18} color="#fff" label="enter" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.focusBtn, { borderColor: tc.borderLight }]}
          onPress={() => setCurrentRoute("Focus")}
          activeOpacity={0.7}
        >
          <Icon name={LUCIDE_ICONS.target} size={16} color={tc.accent} label="focus" />
          <Text style={[s.focusBtnText, { color: tc.textSecondary }]}>Focus</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  contentArea: { flex: 1, paddingHorizontal: 28 },
  topSection: { alignItems: "center" },
  timeRow: { flexDirection: "row", alignItems: "flex-end", gap: 6 },
  time: { ...TYPOGRAPHY.monoLg, fontSize: 60, letterSpacing: -1 },
  timeAmPm: { fontSize: 18, fontWeight: "600", paddingBottom: 10 },
  date: { fontSize: 15, fontWeight: "500", marginTop: 2 },
  hijri: { ...TYPOGRAPHY.body, marginTop: 4 },
  progressSection: { marginTop: 20, gap: 10 },
  progressRow: { gap: 6 },
  progressMeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  progressLabel: { ...TYPOGRAPHY.label },
  progressPct: { ...TYPOGRAPHY.captionSm, fontWeight: "600" },
  progressTrack: { height: 4, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2 },
  bubbleStage: {
    alignSelf: "center", width: 260, height: 260,
    alignItems: "center", justifyContent: "center",
  },
  bubbleRing3: {
    position: "absolute", width: 260, height: 260, borderRadius: 130,
    borderWidth: 1,
  },
  bubbleRing2: {
    position: "absolute", width: 230, height: 230, borderRadius: 115,
    borderWidth: 1.5,
  },
  bubbleOuter: {
    width: 200, height: 200, borderRadius: 100,
    borderWidth: 1, alignItems: "center", justifyContent: "center",
  },
  bubbleInner: {
    width: 150, height: 150, borderRadius: 75,
    borderWidth: 1, alignItems: "center", justifyContent: "center",
  },
  bubbleTextWrap: { alignItems: "center", paddingHorizontal: 16 },
  bubbleHead: { ...TYPOGRAPHY.label, letterSpacing: 1 },
  bubbleTitle: { fontSize: 17, fontWeight: "700", marginTop: 6, textAlign: "center" },
  bubbleSub: { ...TYPOGRAPHY.caption, marginTop: 4 },
  sparkle: {
    position: "absolute", width: 6, height: 6, borderRadius: 3,
  },
  enterBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 16, borderRadius: 16,
  },
  enterBtnText: { color: "#fff", ...TYPOGRAPHY.h4 },
  focusBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderRadius: 16, borderWidth: 1, marginTop: 10,
  },
  focusBtnText: { ...TYPOGRAPHY.btn },
  bottomButtons: { paddingHorizontal: 28, paddingBottom: 20, gap: 10 },
});
