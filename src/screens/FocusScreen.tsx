import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Easing,
  Vibration,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "../components/Icons";
import { LUCIDE_ICONS, TYPOGRAPHY } from "../constants/typography";
import { useStore } from "../store";
import { useTheme } from "../context/ThemeContext";
import * as db from "../db/service";

const DURATIONS = [
  { label: "40m", value: 40 * 60 },
  { label: "25m", value: 25 * 60 },
  { label: "15m", value: 15 * 60 },
  { label: "5m", value: 5 * 60 },
];

const GREEN = ["#e8f5e9", "#a5d6a7", "#66bb6a", "#43a047", "#2e7d32"];
const BRN = "#5d4037";
const BRN_L = "#8d6e63";
const FLW = ["#f48fb1", "#ce93d8", "#ffcc02"];

const LEVELS = [
  { minTrees: 0, title: "Seedling", iconKey: "Sprout" as const },
  { minTrees: 5, title: "Sprout", iconKey: "TreePine" as const },
  { minTrees: 15, title: "Sapling", iconKey: "TreePine" as const },
  { minTrees: 30, title: "Forest Keeper", iconKey: "TreeDeciduous" as const },
  { minTrees: 50, title: "Forest Guardian", iconKey: "Mountain" as const },
  { minTrees: 100, title: "Ancient Forest", iconKey: "TreePine" as const },
];

function hash(i: number, t: number): number {
  return ((i * 16807 + t * 100) % 2147483647) / 2147483647;
}

function getLevel(trees: number) {
  let lvl = LEVELS[0];
  for (const l of LEVELS) {
    if (trees >= l.minTrees) lvl = l;
  }
  return lvl;
}

function nextLevelTrees(trees: number): number {
  for (const l of LEVELS) {
    if (trees < l.minTrees) return l.minTrees - trees;
  }
  return 0;
}

// ─── Growing tree component ───

function GrowingTree({ pct, isDark }: { pct: number; isDark: boolean }) {
  const t = Math.min(pct / 100, 1);
  const trunkH = 20 + t * 70;
  const trunkW = 8 + t * 14;
  const trunkBot = 24;
  const cx = 100; // center x of treeWrap (200w)

  const canopy = useMemo(() => {
    const count = Math.max(1, Math.floor(t * 11));
    const circles: { lx: number; by: number; r: number; color: string }[] = [];
    const baseR = 12 + t * 18;
    const spread = 20 + t * 40;
    const centerBY = trunkBot + trunkH; // bottom of canopy center = top of trunk
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.PI / 2; // start from top
      const dist = spread * (0.4 + t * 0.6) * (0.6 + hash(i, 0.5) * 0.4);
      const ci = Math.min(3, Math.floor(t * 4));
      circles.push({
        lx: cx + Math.cos(angle) * dist,
        by: centerBY + Math.sin(angle) * dist,
        r: baseR * (0.5 + hash(i, 0.3) * 0.5) * (0.6 + t * 0.4),
        color: GREEN[ci + (i % 2 === 0 ? 0 : 1)],
      });
    }
    circles.push({
      lx: cx, by: centerBY,
      r: 10 + t * 22,
      color: GREEN[Math.min(4, Math.floor(t * 5))],
    });
    return circles;
  }, [t]);

  const decorations = useMemo(() => {
    if (t < 0.5) return [];
    const count = t > 0.85 ? 5 : t > 0.65 ? 3 : 1;
    const spread = 20 + t * 40;
    const centerBY = trunkBot + trunkH;
    return Array.from({ length: count }, (_, i) => {
      const angle = hash(i, 0.7) * Math.PI * 2;
      const dist = spread * (0.2 + hash(i, 0.9) * 0.7);
      return {
        lx: cx + Math.cos(angle) * dist,
        by: centerBY + Math.sin(angle) * dist,
        size: 4 + hash(i, 0.2) * 5,
        color: FLW[Math.floor(hash(i, 0.4) * FLW.length)],
      };
    });
  }, [t]);

  const animScale = useRef(new Animated.Value(0.01)).current;
  useEffect(() => {
    Animated.spring(animScale, {
      toValue: 1, friction: 6, tension: 60, useNativeDriver: true,
    }).start();
  }, [t]);

  return (
    <Animated.View style={[s.treeWrap, { transform: [{ scale: animScale }] }]}>
      <View style={[s.pot, { backgroundColor: isDark ? BRN_L : BRN, borderColor: isDark ? BRN_L : BRN }]}>
        <Text style={s.potText}>{Math.floor(pct)}%</Text>
      </View>
      <View style={[s.trunk, { width: trunkW, height: trunkH, backgroundColor: isDark ? BRN_L : BRN, bottom: trunkBot, left: cx - trunkW / 2 }]} />
      {canopy.map((c, i) => (
        <View key={i} style={[s.leaf, { left: c.lx - c.r, bottom: c.by - c.r, width: c.r * 2, height: c.r * 2, borderRadius: c.r, backgroundColor: c.color, opacity: 0.85 }]} />
      ))}
      {decorations.map((d, i) => (
        <View key={`d${i}`} style={[s.flower, { left: d.lx - d.size / 2, bottom: d.by - d.size / 2, width: d.size, height: d.size, borderRadius: d.size / 2, backgroundColor: d.color }]} />
      ))}
    </Animated.View>
  );
}

// ─── Main screen ───

export default function FocusScreen() {
  const { theme, isDark } = useTheme();
  const tc = theme.colors;
  const setCurrentRoute = useStore((s) => s.setCurrentRoute);

  const [duration, setDuration] = useState(25 * 60);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [stats, setStats] = useState({ totalTrees: 0, totalSessions: 0, streak: 0, todaySessions: 0 });
  const [milestone, setMilestone] = useState<number | null>(null);
  const [screensaver, setScreensaver] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animMilestone = useRef(new Animated.Value(0)).current;
  const lastActivityRef = useRef(Date.now());
  const lastTapRef = useRef(0);

  const progress = duration > 0 ? (elapsed / duration) * 100 : 0;
  const remaining = duration - elapsed;
  const min = Math.floor(remaining / 60);
  const sec = remaining % 60;
  const treesThisSession = Math.floor(elapsed / 300);
  const level = useMemo(() => getLevel(stats.totalTrees), [stats.totalTrees]);
  const toNext = useMemo(() => nextLevelTrees(stats.totalTrees), [stats.totalTrees]);

  useEffect(() => {
    db.getFocusStats().then(setStats);
  }, []);

  // Reload stats after session completes
  useEffect(() => {
    if (done) {
      db.getFocusStats().then(setStats);
    }
  }, [done]);

  // Tick
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => {
          const next = prev + 1;
          if (next >= duration) {
            setRunning(false);
            setDone(true);
            Vibration.vibrate([0, 200, 100, 200]);
            db.saveFocusSession(duration, duration);
            setMilestone(100);
            return duration;
          }
          // Milestone checks (every 25%)
          const prevMilestone = Math.floor(prev / (duration / 4));
          const currMilestone = Math.floor(next / (duration / 4));
          if (currMilestone > prevMilestone && currMilestone < 4) {
            setMilestone(currMilestone * 25);
            Vibration.vibrate(100);
          }
          // Tree milestone (every 5 min = 300s)
          if (Math.floor(prev / 300) < Math.floor(next / 300) && next % 300 === 0) {
            Vibration.vibrate(80);
          }
          return next;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, duration]);

  // Milestone animation
  useEffect(() => {
    if (milestone !== null) {
      animMilestone.setValue(0);
      Animated.sequence([
        Animated.timing(animMilestone, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(1200),
        Animated.timing(animMilestone, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => setMilestone(null));
    }
  }, [milestone]);

  const handleStart = useCallback(() => {
    if (done) { setElapsed(0); setDone(false); }
    setRunning(true);
    lastActivityRef.current = Date.now();
  }, [done]);

  const handlePause = useCallback(() => { setRunning(false); lastActivityRef.current = Date.now(); }, []);
  const handleReset = useCallback(() => { setRunning(false); setElapsed(0); setDone(false); lastActivityRef.current = Date.now(); }, []);
  const handleDuration = useCallback((d: number) => { setDuration(d); setElapsed(0); setRunning(false); setDone(false); lastActivityRef.current = Date.now(); }, []);

  // Screensaver: activate after 10s of inactivity, exit on double-tap
  useEffect(() => {
    const id = setInterval(() => {
      if (!screensaver && Date.now() - lastActivityRef.current > 10000) {
        setScreensaver(true);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [screensaver]);

  const handleScreenTap = useCallback(() => {
    const now = Date.now();
    if (screensaver) {
      if (now - lastTapRef.current < 350) {
        setScreensaver(false);
        lastActivityRef.current = now;
      }
      lastTapRef.current = now;
    } else {
      lastActivityRef.current = now;
    }
  }, [screensaver]);

  if (screensaver) {
    return (
      <TouchableWithoutFeedback onPress={handleScreenTap}>
        <SafeAreaView style={[s.screenSaver, { backgroundColor: "#000000" }]} edges={["top", "bottom"]}>
          <View style={s.saverBody}>
            <Text style={[s.saverTimer, { color: done ? tc.success : "#ffffff" }]}>
              {String(min).padStart(2, "0")}:{String(sec).padStart(2, "0")}
            </Text>
            <View style={s.saverTree}>
              <GrowingTree pct={progress} isDark={true} />
            </View>
            <Text style={s.saverHint}>Double-tap to exit</Text>
          </View>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    );
  }

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: tc.bg }]} edges={["top", "bottom"]}
      onTouchStart={() => { lastActivityRef.current = Date.now(); }}
    >
      {/* Header */}
      <View style={[s.header, { borderBottomColor: tc.divider }]}>
        <TouchableOpacity onPress={() => setCurrentRoute("Greeting")} style={s.backBtn}>
          <Icon name={LUCIDE_ICONS.arrowLeft} size={20} color={tc.textSecondary} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          {DURATIONS.map((d) => (
            <TouchableOpacity
              key={d.value}
              onPress={() => handleDuration(d.value)}
              style={[s.durChip, { backgroundColor: duration === d.value ? tc.accentBg : tc.bgSecondary, borderColor: duration === d.value ? tc.accent : tc.borderLight }]}
            >
              <Text style={[s.durChipText, { color: duration === d.value ? tc.accent : tc.textTertiary, fontWeight: duration === d.value ? "700" : "500" }]}>
                {d.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Milestone toast */}
      {milestone !== null && (
        <Animated.View style={[s.mToast, { opacity: animMilestone, transform: [{ translateY: animMilestone.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
          <Text style={s.mToastText}>
            {milestone === 100 ? "Session Complete!" : `${milestone}% — Keep going!`}
          </Text>
        </Animated.View>
      )}

      {/* Body */}
      <View style={s.body}>
        {/* Level badge */}
        <View style={[s.levelBadge, { backgroundColor: tc.bgSecondary, borderColor: tc.borderLight }]}>
          <Icon name={level.iconKey as any} size={18} color={tc.text} />
          <Text style={[TYPOGRAPHY.bodySm, { fontWeight: "700", color: tc.text }]}>{level.title}</Text>
          <Text style={[TYPOGRAPHY.captionSm, { color: tc.textTertiary }]}>
            {stats.totalTrees} trees · {toNext > 0 ? `${toNext} to next` : "Max level"}
          </Text>
        </View>

        {/* Tree */}
        <View style={s.treeArea}>
          <GrowingTree pct={progress} isDark={isDark} />
        </View>

        {/* Timer */}
        <View style={s.timerSection}>
          <Text style={[s.timerText, { color: done ? tc.success : tc.heading }]}>
            {String(min).padStart(2, "0")}:{String(sec).padStart(2, "0")}
          </Text>
          <Text style={[s.timerLabel, { color: tc.textTertiary }]}>
            {done ? "Well done!" : running ? "Stay focused" : "Press start"}
          </Text>
        </View>

        {/* Stats row */}
        <View style={[s.forestStats, { borderColor: tc.borderLight }]}>
          <View style={s.statItem}>
            <Text style={[s.statVal, { color: tc.warning }]}>{stats.streak}</Text>
            <Text style={[s.statLbl, { color: tc.textTertiary }]}>Streak</Text>
          </View>
          <View style={[s.statDiv, { backgroundColor: tc.borderLight }]} />
          <View style={s.statItem}>
            <Text style={[s.statVal, { color: tc.accent }]}>{stats.totalTrees + treesThisSession}</Text>
            <Text style={[s.statLbl, { color: tc.textTertiary }]}>Trees</Text>
          </View>
          <View style={[s.statDiv, { backgroundColor: tc.borderLight }]} />
          <View style={s.statItem}>
            <Text style={[s.statVal, { color: GREEN[3] }]}>{Math.floor(progress)}%</Text>
            <Text style={[s.statLbl, { color: tc.textTertiary }]}>Growth</Text>
          </View>
        </View>

        {/* Controls */}
        <View style={s.controls}>
          <TouchableOpacity onPress={handleReset} style={[s.ctrlBtn, { backgroundColor: tc.bgSecondary }]} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Icon name={LUCIDE_ICONS.refreshCw} size={18} color={tc.textTertiary} />
          </TouchableOpacity>
          {running ? (
            <TouchableOpacity onPress={handlePause} style={[s.mainBtn, { backgroundColor: tc.warningBg }]}>
              <Icon name={LUCIDE_ICONS.pause} size={22} color={tc.warning} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleStart} style={[s.mainBtn, { backgroundColor: done ? tc.successBg : tc.accentBg }]}>
              <Icon name={done ? LUCIDE_ICONS.check : LUCIDE_ICONS.play} size={22} color={done ? tc.success : tc.accent} />
            </TouchableOpacity>
          )}
          <View style={[s.ctrlBtn, { opacity: 0 }]}><Icon name={LUCIDE_ICONS.refreshCw} size={18} color="transparent" /></View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, height: 52, borderBottomWidth: 1, gap: 12,
  },
  backBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1, flexDirection: "row", justifyContent: "center", gap: 8 },
  durChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  durChipText: { ...TYPOGRAPHY.bodySm },
  mToast: {
    position: "absolute", top: 60, left: 0, right: 0,
    alignItems: "center", zIndex: 100,
  },
  mToastText: {
    backgroundColor: "rgba(0,0,0,0.75)", color: "#fff",
    ...TYPOGRAPHY.body, fontWeight: "700",
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20,
    overflow: "hidden",
  },
  body: { flex: 1, paddingHorizontal: 28, paddingBottom: 32, justifyContent: "center", alignItems: "center" },
  levelBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, marginBottom: 8,
  },
  treeArea: { flex: 1, justifyContent: "center", alignItems: "center" },
  treeWrap: { width: 200, height: 220, position: "relative" },
  pot: { position: "absolute", bottom: 0, left: 72, width: 56, height: 22, borderRadius: 6, borderWidth: 1, alignItems: "center", justifyContent: "center", zIndex: 5 },
  potText: { ...TYPOGRAPHY.captionSm, fontWeight: "700", color: "#fff" },
  trunk: { position: "absolute", borderRadius: 4, zIndex: 2 },
  leaf: { position: "absolute", zIndex: 3 },
  flower: { position: "absolute", zIndex: 4 },
  timerSection: { alignItems: "center", marginBottom: 16 },
  timerText: { ...TYPOGRAPHY.monoLg, fontSize: 32 },
  timerLabel: { ...TYPOGRAPHY.label, marginTop: 4 },
  forestStats: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 16, borderWidth: 1,
    paddingVertical: 12, paddingHorizontal: 20, marginBottom: 16,
  },
  statItem: { flex: 1, alignItems: "center", gap: 2 },
  statVal: { ...TYPOGRAPHY.mono },
  statLbl: { ...TYPOGRAPHY.label },
  statDiv: { width: 1, height: 28 },
  controls: { flexDirection: "row", alignItems: "center", gap: 24 },
  ctrlBtn: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  mainBtn: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  screenSaver: { flex: 1, justifyContent: "center", alignItems: "center" },
  saverBody: { flex: 1, justifyContent: "center", alignItems: "center", gap: 24 },
  saverTimer: { ...TYPOGRAPHY.monoLg, fontSize: 56, letterSpacing: 2 },
  saverTree: { transform: [{ scale: 1.2 }] },
  saverHint: { ...TYPOGRAPHY.captionSm, color: "rgba(255,255,255,0.35)", marginTop: 24 },
});
