import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Vibration,
  useWindowDimensions,
  LayoutChangeEvent,
  AppState,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "../components/Icons";
import { LUCIDE_ICONS } from "../constants/typography";
import { useStore } from "../store";
import { useTheme } from "../context/ThemeContext";
import * as db from "../db/service";
import { getCurrentConditions } from "../services/weather";
import type { SceneConditions } from "../services/weather";
import {
  DURATIONS,
  MAX_POMODOROS,
  MAX_AGE,
  getTreeStage,
  TREE_STAGES,

  DurationPicker,
  TimerDisplay,
  StatsRow,
  FocusControls,
  BanyanTree,
  ConfettiField,
  StageUnlockBanner,
  MilestoneToast,
  LevelBadge,
  ScreensaverView,
  FocusHistorySheet,
  FocusScene,
  SceneDebugPanel,
  buildOverrideConditions,
} from "../components/focus-timer";
import type { TimeOfDay, WeatherType } from "../services/weather";

export default function FocusScreen() {
  const { theme, isDark } = useTheme();
  const tc = theme.colors;
  const setCurrentRoute = useStore((s) => s.setCurrentRoute);
  const { width: winW, height: winH } = useWindowDimensions();

  const [sceneSize, setSceneSize] = useState({ width: winW, height: winH * 0.5 });
  const [conditions, setConditions] = useState<SceneConditions | null>(null);
  const [debugTime, setDebugTime] = useState<TimeOfDay | null>(null);
  const [debugWeather, setDebugWeather] = useState<WeatherType | null>(null);
  const [debugPanelVisible, setDebugPanelVisible] = useState(false);
  const [duration, setDuration] = useState(25 * 60);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [stats, setStats] = useState({
    totalTrees: 0,
    totalSessions: 0,
    streak: 0,
    todaySessions: 0,
  });
  const [milestone, setMilestone] = useState<number | null>(null);
  const [screensaver, setScreensaver] = useState(false);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [stageUnlockVisible, setStageUnlockVisible] = useState(false);
  const [unlockedStageName, setUnlockedStageName] = useState("");
  const [unlockedStageEmoji, setUnlockedStageEmoji] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [unlockedStageIndices, setUnlockedStageIndices] = useState<number[]>(
    [],
  );
  const [bonusPomodoros, setBonusPomodoros] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animMilestone = useRef(new Animated.Value(0)).current;
  const lastActivityRef = useRef(Date.now());
  const lastTapRef = useRef(0);
  const prevStageIdxRef = useRef(0);
  const streakPulse = useRef(new Animated.Value(1)).current;
  const doneGlow = useRef(new Animated.Value(0)).current;

  const progress = duration > 0 ? (elapsed / duration) * 100 : 0;
  const remaining = duration - elapsed;
  const min = Math.floor(remaining / 60);
  const sec = remaining % 60;
  const completedPomodoros = stats.totalSessions + bonusPomodoros;
  const sessionProgress = duration > 0 ? elapsed / duration : 0;
  const sceneT = Math.min((completedPomodoros + sessionProgress) / MAX_POMODOROS, 1);

  const effectiveConditions = useMemo(
    () => buildOverrideConditions(debugTime, debugWeather) ?? conditions,
    [debugTime, debugWeather, conditions],
  );

  const particlesActive = running || debugTime !== null || debugWeather !== null;

  const onSceneLayout = useCallback((e: LayoutChangeEvent) => {
    setSceneSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height });
  }, []);

  useEffect(() => {
    db.getFocusStats().then((s) => {
      setStats(s);
      const currentStage = getTreeStage(s.totalSessions);
      prevStageIdxRef.current = currentStage.index;
      setUnlockedStageIndices(
        TREE_STAGES.filter((_, i) => i <= currentStage.index).map(
          (_, i) => i,
        ),
      );
    });
  }, []);

  useEffect(() => {
    if (done) {
      db.getFocusStats().then(setStats);
    }
  }, [done]);

  useEffect(() => {
    getCurrentConditions().then(setConditions);
    const interval = setInterval(() => getCurrentConditions().then(setConditions), 5 * 60 * 1000);
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") getCurrentConditions().then(setConditions);
    });
    return () => { clearInterval(interval); sub.remove(); };
  }, []);

  function showStageUnlock(index: number) {
    const st = TREE_STAGES[index];
    if (!st) return;
    setUnlockedStageEmoji(st.emoji);
    setUnlockedStageName(st.name);
    setStageUnlockVisible(true);
    Vibration.vibrate([0, 60, 60, 120]);
    setTimeout(() => setStageUnlockVisible(false), 1800);
  }

  const handleAddYears = useCallback(() => {
    const pomsPer5Years = Math.round(5 / (MAX_AGE / MAX_POMODOROS));
    setBonusPomodoros((p) => {
      const newTotal = stats.totalSessions + p + pomsPer5Years;
      const currentStage = getTreeStage(stats.totalSessions + p);
      const nextStage = getTreeStage(stats.totalSessions + p + pomsPer5Years);
      if (nextStage.index > currentStage.index) {
        prevStageIdxRef.current = nextStage.index;
        showStageUnlock(nextStage.index);
      }
      return p + pomsPer5Years;
    });
  }, [stats.totalSessions]);

  useEffect(() => {
    if (stats.streak > 0) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(streakPulse, {
            toValue: 1.18,
            duration: 650,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(streakPulse, {
            toValue: 1,
            duration: 650,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
  }, [stats.streak]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => {
          const next = prev + 1;
          if (next >= duration) {
            setRunning(false);
            setDone(true);
            Vibration.vibrate([0, 200, 100, 200]);
            setSessionId((id) => {
              if (id) db.completeFocusSession(id, duration);
              return null;
            });
            const prevStage = getTreeStage(stats.totalSessions);
            const nextStage = getTreeStage(stats.totalSessions + 1);
            if (nextStage.index > prevStage.index) {
              prevStageIdxRef.current = nextStage.index;
              setMilestone(nextStage.index);
              setUnlockedStageIndices((prev) =>
                prev.includes(nextStage.index)
                  ? prev
                  : [...prev, nextStage.index],
              );
              showStageUnlock(nextStage.index);
            }
            setConfettiTrigger((v) => v + 1);
            Animated.sequence([
              Animated.timing(doneGlow, {
                toValue: 1,
                duration: 500,
                useNativeDriver: false,
              }),
              Animated.timing(doneGlow, {
                toValue: 0,
                duration: 1200,
                useNativeDriver: false,
              }),
            ]).start();
            return duration;
          }
          const totalPoms = stats.totalSessions + next / duration;
          const newStage = getTreeStage(Math.floor(totalPoms));
          if (newStage.index > prevStageIdxRef.current && next < duration) {
            prevStageIdxRef.current = newStage.index;
            setMilestone(newStage.index);
            Vibration.vibrate(80);
            setUnlockedStageIndices((prev) =>
              prev.includes(newStage.index) ? prev : [...prev, newStage.index],
            );
            showStageUnlock(newStage.index);
          }
          if (
            Math.floor(prev / 300) < Math.floor(next / 300) &&
            next % 300 === 0
          ) {
            Vibration.vibrate(80);
          }
          return next;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, duration]);

  useEffect(() => {
    if (milestone !== null) {
      animMilestone.setValue(0);
      Animated.sequence([
        Animated.spring(animMilestone, {
          toValue: 1,
          friction: 5,
          tension: 90,
          useNativeDriver: true,
        }),
        Animated.delay(1200),
        Animated.timing(animMilestone, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => setMilestone(null));
    }
  }, [milestone]);

  const handleStart = useCallback(() => {
    if (done) {
      setElapsed(0);
      setDone(false);
    }
    setRunning(true);
    lastActivityRef.current = Date.now();
    db.insertFocusSession(duration, new Date().toISOString()).then(setSessionId);
  }, [done, duration]);

  const handlePause = useCallback(() => {
    setRunning(false);
    lastActivityRef.current = Date.now();
  }, []);

  const handleReset = useCallback(() => {
    setRunning(false);
    setSessionId((id) => {
      if (id) db.interruptFocusSession(id, elapsed);
      return null;
    });
    setElapsed(0);
    setDone(false);
    lastActivityRef.current = Date.now();
  }, [elapsed]);

  const handleDuration = useCallback((d: number) => {
    setRunning(false);
    setSessionId((id) => {
      if (id) db.interruptFocusSession(id, elapsed);
      return null;
    });
    setDuration(d);
    setElapsed(0);
    setDone(false);
    lastActivityRef.current = Date.now();
  }, [elapsed]);

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
      <ScreensaverView
        min={min}
        sec={sec}
        done={done}
        progress={progress}
        running={running}
        completedPomodoros={completedPomodoros}
        sessionProgress={sessionProgress}
        onDoubleTap={handleScreenTap}
      />
    );
  }

  return (
    <SafeAreaView
      style={[s.screen, { backgroundColor: tc.bg }]}
      edges={["top", "bottom"]}
      onTouchStart={() => {
        lastActivityRef.current = Date.now();
      }}
    >
      <View style={[s.header, { borderBottomColor: tc.divider }]}>
        <TouchableOpacity
          onPress={() => {
            setSessionId((id) => {
              if (id) db.interruptFocusSession(id, elapsed);
              return null;
            });
            setRunning(false);
            setCurrentRoute("Greeting");
          }}
          style={s.backBtn}
        >
          <Icon
            name={LUCIDE_ICONS.arrowLeft}
            size={20}
            color={tc.textSecondary}
          />
        </TouchableOpacity>
        <DurationPicker
          durations={DURATIONS}
          selected={duration}
          onSelect={handleDuration}
          colors={tc}
        />
        <TouchableOpacity
          onPress={() => setShowHistory(true)}
          style={s.historyBtn}
        >
          <Icon
            name={LUCIDE_ICONS.barChart}
            size={20}
            color={tc.textSecondary}
          />
        </TouchableOpacity>
      </View>

      <MilestoneToast milestone={milestone} animValue={animMilestone} />

      <StageUnlockBanner
        visible={stageUnlockVisible}
        stageEmoji={unlockedStageEmoji}
        stageName={unlockedStageName}
      />

      <View style={s.body}>
        <LevelBadge
          totalPomodoros={stats.totalSessions}
          colors={tc}
        />

        <View style={s.treeStage} onLayout={onSceneLayout}>
          <FocusScene t={sceneT} running={running} width={sceneSize.width} height={sceneSize.height} conditions={effectiveConditions ?? undefined} particlesActive={particlesActive} />
          <BanyanTree
            pct={progress}
            isDark={isDark}
            running={running}
            completedPomodoros={completedPomodoros}
            sessionProgress={sessionProgress}
          />
          <ConfettiField trigger={confettiTrigger} />
        </View>

        <TimerDisplay
          min={min}
          sec={sec}
          done={done}
          running={running}
          colors={tc}
        />

        <StatsRow
          streak={stats.streak}
          totalPomodoros={stats.totalSessions}
          streakPulse={streakPulse}
          colors={tc}
        />

        <FocusControls
          running={running}
          done={done}
          onStart={handleStart}
          onPause={handlePause}
          onReset={handleReset}
          onAddYears={handleAddYears}
          colors={tc}
          doneGlow={doneGlow}
        />
      </View>

      <FocusHistorySheet
        visible={showHistory}
        onClose={() => setShowHistory(false)}
      />

      <SceneDebugPanel
        visible={debugPanelVisible}
        onToggle={() => setDebugPanelVisible((v) => !v)}
        selectedTime={debugTime}
        selectedWeather={debugWeather}
        onSelectTime={setDebugTime}
        onSelectWeather={setDebugWeather}
      />
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
  historyBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    paddingHorizontal: 28,
    paddingBottom: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  treeStage: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    width: "100%",
    position: "relative",
    paddingBottom: 8,
  },
});
