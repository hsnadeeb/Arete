import React from "react";
import { View, Text, TouchableWithoutFeedback, StyleSheet, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TYPOGRAPHY } from "../../constants/typography";
import { BanyanTree } from "./BanyanTree";
import { FocusScene } from "./FocusScene";
import type { Season } from "./constants";
import type { SceneConditions } from "../../services/weather";

interface ScreensaverViewProps {
  min: number;
  sec: number;
  done: boolean;
  progress: number;
  running: boolean;
  completedPomodoros?: number;
  sessionProgress?: number;
  onDoubleTap: () => void;
  t: number;
  season: Season;
  conditions?: SceneConditions;
  particlesActive: boolean;
}

export function ScreensaverView({
  min,
  sec,
  done,
  progress,
  running,
  completedPomodoros = 0,
  sessionProgress = 0,
  onDoubleTap,
  t,
  season,
  conditions,
  particlesActive,
}: ScreensaverViewProps) {
  const { width, height } = useWindowDimensions();
  return (
    <TouchableWithoutFeedback onPress={onDoubleTap}>
      <SafeAreaView
        style={[styles.screenSaver, { backgroundColor: "#000000" }]}
        edges={["top", "bottom"]}
      >
        <FocusScene t={t} running={running} width={width} height={height} conditions={conditions} particlesActive={particlesActive} season={season} />
        <View style={styles.saverBody} pointerEvents="box-none">
          <View style={styles.saverTimerWrap}>
            <Text
              style={[styles.saverTimer, { color: done ? "#32D583" : "#ffffff" }]}
            >
              {String(min).padStart(2, "0")}:{String(sec).padStart(2, "0")}
            </Text>
          </View>
          <View style={styles.saverTree}>
            <BanyanTree
              pct={progress}
              isDark={true}
              running={running}
              completedPomodoros={completedPomodoros}
              sessionProgress={sessionProgress}
              season={season}
            />
          </View>
          <Text style={styles.saverHint}>Double-tap to exit</Text>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  screenSaver: { flex: 1, justifyContent: "center", alignItems: "center" },
  saverBody: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
    zIndex: 10,
  },
  saverTimerWrap: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  saverTimer: {
    ...TYPOGRAPHY.monoLg,
    fontSize: 56,
    letterSpacing: 2,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  saverTree: { transform: [{ scale: 1.1 }] },
  saverHint: {
    ...TYPOGRAPHY.captionSm,
    color: "rgba(255,255,255,0.35)",
    marginTop: 24,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
