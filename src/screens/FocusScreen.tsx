// FocusScreen.tsx
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated from "react-native-reanimated";

import { Icon } from "../components/Icons";
import { LUCIDE_ICONS, TYPOGRAPHY } from "../constants/typography";
import { useStore } from "../store";
import { useTheme } from "../context/ThemeContext";
import * as db from "../db/service";

import {
  GrowingTree,
  CelebrationBurst,
  ConfettiField,
  LevelUpBanner,
} from "../../src/components";

// Constants & Helpers
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
const SPARK = ["#ffd54f", "#fff176", "#ffecb3", "#a5d6a7"];
const CONFETTI = [
  "#43a047",
  "#ffd54f",
  "#f48fb1",
  "#4fc3f7",
  "#ce93d8",
  "#ff8a65",
];

const SKY_STOPS = [
  { at: 0, glow: "#bcd9c9", halo: "#e8f5e9" },
  { at: 50, glow: "#9fd8b0", halo: "#d7f0dc" },
  { at: 85, glow: "#ffd98a", halo: "#fff1cf" },
  { at: 100, glow: "#ffb997", halo: "#ffe0c2" },
];

const LEVELS = [
  { minTrees: 0, title: "Seedling", iconKey: "Sprout" as const },
  { minTrees: 5, title: "Sprout", iconKey: "TreePine" as const },
  { minTrees: 15, title: "Sapling", iconKey: "TreePine" as const },
  { minTrees: 30, title: "Forest Keeper", iconKey: "TreeDeciduous" as const },
  { minTrees: 50, title: "Forest Guardian", iconKey: "Mountain" as const },
  { minTrees: 100, title: "Ancient Forest", iconKey: "TreePine" as const },
];

// Helper functions
function hash(i: number, t: number): number {
  return ((i * 16807 + t * 100) % 2147483647) / 2147483647;
}

function lerpColor(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ar = (pa >> 16) & 255,
    ag = (pa >> 8) & 255,
    ab = pa & 255;
  const br = (pb >> 16) & 255,
    bg = (pb >> 8) & 255,
    bb = pb & 255;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `#${((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1)}`;
}

function skyColorAt(progress: number, key: "glow" | "halo"): string {
  const p = Math.max(0, Math.min(100, progress));
  for (let i = 0; i < SKY_STOPS.length - 1; i++) {
    const a = SKY_STOPS[i],
      b = SKY_STOPS[i + 1];
    if (p >= a.at && p <= b.at) {
      const t = b.at === a.at ? 0 : (p - a.at) / (b.at - a.at);
      return lerpColor(a[key], b[key], t);
    }
  }
  return SKY_STOPS[SKY_STOPS.length - 1][key];
}

function getLevel(trees: number) {
  let lvl = LEVELS[0];
  for (const l of LEVELS) if (trees >= l.minTrees) lvl = l;
  return lvl;
}

function nextLevelTrees(trees: number): number {
  for (const l of LEVELS) {
    if (trees < l.minTrees) return l.minTrees - trees;
  }
  return 0;
}

// ─── Main Component ───
export default function FocusScreen() {
  const { theme, isDark } = useTheme();
  const tc = theme.colors;
  const setCurrentRoute = useStore((s) => s.setCurrentRoute);
  const { width, height } = useWindowDimensions();

  const [duration, setDuration] = useState(25 * 60);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [stats, setStats] = useState({
    totalTrees: 0,
    totalSessions: 0,
    streak: 0,
    todaySessions: 0,
  });

  const [milestone, setMilestone] = useState<number | null>(null);
  const [screensaver, setScreensaver] = useState(false);
  const [burstTrigger, setBurstTrigger] = useState(0);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [levelUpVisible, setLevelUpVisible] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef(Date.now());
  const lastTapRef = useRef(0);
  const prevLevelTitleRef = useRef<string | null>(null);

  const progress = duration > 0 ? (elapsed / duration) * 100 : 0;
  const remaining = duration - elapsed;
  const min = Math.floor(remaining / 60);
  const sec = remaining % 60;
  const treesThisSession = Math.floor(elapsed / 300);
  const treeSize = Math.min(240, Math.max(180, Math.min(width * 0.56, 240)));
  const treeStageHeight = Math.max(280, Math.min(340, height * 0.36));

  const level = useMemo(() => getLevel(stats.totalTrees), [stats.totalTrees]);
  const toNext = useMemo(
    () => nextLevelTrees(stats.totalTrees),
    [stats.totalTrees],
  );

  // Load stats
  useEffect(() => {
    db.getFocusStats().then(setStats);
  }, []);

  useEffect(() => {
    if (done) db.getFocusStats().then(setStats);
  }, [done]);

  // Level-up detection
  useEffect(() => {
    if (prevLevelTitleRef.current === null) {
      prevLevelTitleRef.current = level.title;
      return;
    }
    if (level.title !== prevLevelTitleRef.current) {
      prevLevelTitleRef.current = level.title;
      setLevelUpVisible(true);
      setBurstTrigger((v) => v + 1);
      setTimeout(() => setLevelUpVisible(false), 1800);
    }
  }, [level.title]);

  // Timer
  useEffect(() => {
    if (!running) return;

    intervalRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (next >= duration) {
          setRunning(false);
          setDone(true);
          db.saveFocusSession(duration, duration);
          setMilestone(100);
          setConfettiTrigger((v) => v + 1);
          setBurstTrigger((v) => v + 1);
          return duration;
        }

        // Milestones
        const prevM = Math.floor(prev / (duration / 4));
        const currM = Math.floor(next / (duration / 4));
        if (currM > prevM && currM < 4) setMilestone(currM * 25);

        if (Math.floor(prev / 300) < Math.floor(next / 300)) {
          setBurstTrigger((v) => v + 1);
        }

        return next;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, duration]);

  const handleStart = useCallback(() => {
    if (done) {
      setElapsed(0);
      setDone(false);
    }
    setRunning(true);
    lastActivityRef.current = Date.now();
  }, [done]);

  const handlePause = useCallback(() => {
    setRunning(false);
    lastActivityRef.current = Date.now();
  }, []);

  const handleReset = useCallback(() => {
    setRunning(false);
    setElapsed(0);
    setDone(false);
    lastActivityRef.current = Date.now();
  }, []);

  const handleDuration = useCallback((d: number) => {
    setDuration(d);
    setElapsed(0);
    setRunning(false);
    setDone(false);
  }, []);

  // Screensaver logic
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
      }
      lastTapRef.current = now;
    } else {
      lastActivityRef.current = now;
    }
  }, [screensaver]);

  if (screensaver) {
    return (
      <TouchableWithoutFeedback onPress={handleScreenTap}>
        <SafeAreaView style={[s.screenSaver, { backgroundColor: "#000" }]}>
          <View style={s.saverBody}>
            <Text style={s.saverTimer}>
              {String(min).padStart(2, "0")}:{String(sec).padStart(2, "0")}
            </Text>
            <View style={s.saverTree}>
              <GrowingTree pct={progress} isDark running={running} />
            </View>
            <Text style={s.saverHint}>Double-tap to exit</Text>
          </View>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    );
  }

  return (
    <SafeAreaView
      style={[s.screen, { backgroundColor: tc.bg }]}
      edges={["top", "bottom"]}
      onTouchStart={() => (lastActivityRef.current = Date.now())}
    >
      {/* Header */}
      <View style={[s.header, { borderBottomColor: tc.divider }]}>
        <TouchableOpacity
          onPress={() => setCurrentRoute("Greeting")}
          style={s.backBtn}
        >
          <Icon
            name={LUCIDE_ICONS.arrowLeft}
            size={20}
            color={tc.textSecondary}
          />
        </TouchableOpacity>

        <View style={s.headerCenter}>
          {DURATIONS.map((d) => (
            <TouchableOpacity
              key={d.value}
              onPress={() => handleDuration(d.value)}
              style={[
                s.durChip,
                {
                  backgroundColor:
                    duration === d.value ? tc.accentBg : tc.bgSecondary,
                  borderColor:
                    duration === d.value ? tc.accent : tc.borderLight,
                },
              ]}
            >
              <Text
                style={[
                  s.durChipText,
                  { color: duration === d.value ? tc.accent : tc.textTertiary },
                ]}
              >
                {d.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Body */}
      <View style={s.body}>
        <LevelUpBanner
          visible={levelUpVisible}
          title={level.title}
          iconKey={level.iconKey}
        />

        <View
          style={[
            s.treeStage,
            {
              minHeight: treeStageHeight,
              borderColor: tc.borderLight,
              backgroundColor: tc.bgSecondary,
              paddingTop: 12,
              paddingBottom: Math.round(treeSize * 0.18),
            },
          ]}
        >
          <GrowingTree
            pct={progress}
            isDark={isDark}
            running={running}
            size={treeSize}
          />
          <CelebrationBurst
            trigger={burstTrigger}
            colorSet={SPARK}
            count={10}
          />
          <ConfettiField trigger={confettiTrigger} />
        </View>
        
        {/* Timer */}
        <View style={s.timerSection}>
          <Text
            style={[s.timerText, { color: done ? tc.success : tc.heading }]}
          >
            {String(min).padStart(2, "0")}:{String(sec).padStart(2, "0")}
          </Text>
          <Text style={[s.timerLabel, { color: tc.textTertiary }]}>
            {done ? "Well done!" : running ? "Stay focused" : "Press start"}
          </Text>
        </View>

        {/* Stats */}
        <View style={[s.forestStats, { borderColor: tc.borderLight }]}>
          <View style={s.statItem}>
            <Text style={[s.statVal, { color: tc.warning }]}>
              {stats.streak}
            </Text>
            <Text style={[s.statLbl, { color: tc.textTertiary }]}>Streak</Text>
          </View>
          <View style={[s.statDiv, { backgroundColor: tc.borderLight }]} />
          <View style={s.statItem}>
            <Text style={[s.statVal, { color: tc.accent }]}>
              {stats.totalTrees + treesThisSession}
            </Text>
            <Text style={[s.statLbl, { color: tc.textTertiary }]}>Trees</Text>
          </View>
          <View style={[s.statDiv, { backgroundColor: tc.borderLight }]} />
          <View style={s.statItem}>
            <Text style={[s.statVal, { color: GREEN[3] }]}>
              {Math.floor(progress)}%
            </Text>
            <Text style={[s.statLbl, { color: tc.textTertiary }]}>Growth</Text>
          </View>
        </View>

        {/* Controls */}
        <View style={s.controls}>
          <TouchableOpacity
            onPress={handleReset}
            style={[s.ctrlBtn, { backgroundColor: tc.bgSecondary }]}
          >
            <Icon
              name={LUCIDE_ICONS.refreshCw}
              size={18}
              color={tc.textTertiary}
            />
          </TouchableOpacity>

          {running ? (
            <TouchableOpacity
              onPress={handlePause}
              style={[s.mainBtn, { backgroundColor: tc.warningBg }]}
            >
              <Icon name={LUCIDE_ICONS.pause} size={22} color={tc.warning} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleStart} activeOpacity={0.85}>
              <View
                style={[
                  s.mainBtn,
                  { backgroundColor: done ? tc.successBg : tc.accentBg },
                ]}
              >
                <Icon
                  name={done ? LUCIDE_ICONS.check : LUCIDE_ICONS.play}
                  size={22}
                  color={done ? tc.success : tc.accent}
                />
              </View>
            </TouchableOpacity>
          )}

          <View style={[s.ctrlBtn, { opacity: 0 }]} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 52,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  durChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  durChipText: { ...TYPOGRAPHY.bodySm },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    justifyContent: "space-between",
    alignItems: "center",
  },
  treeStage: {
    width: "100%",
    maxWidth: 420,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "visible",
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 32,
    borderWidth: 1,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  timerSection: { alignItems: "center", marginTop: 4, marginBottom: 16 },
  timerText: { ...TYPOGRAPHY.monoLg, fontSize: 44 },
  timerLabel: { ...TYPOGRAPHY.label, marginTop: 4 },
  forestStats: {
    width: "100%",
    maxWidth: 360,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statItem: { flex: 1, alignItems: "center", gap: 2 },
  statVal: { ...TYPOGRAPHY.mono },
  statLbl: { ...TYPOGRAPHY.label },
  statDiv: { width: 1, height: 28 },
  controls: {
    width: "100%",
    maxWidth: 260,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },
  ctrlBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  mainBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  screenSaver: { flex: 1, justifyContent: "center", alignItems: "center" },
  saverBody: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
  },
  saverTimer: {
    ...TYPOGRAPHY.monoLg,
    fontSize: 56,
    letterSpacing: 2,
    color: "#fff",
  },
  saverTree: { transform: [{ scale: 1.2 }] },
  saverHint: {
    ...TYPOGRAPHY.captionSm,
    color: "rgba(255,255,255,0.35)",
    marginTop: 24,
  },
});
