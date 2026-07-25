import React, { useEffect, useRef } from "react";
import { View, Text, TouchableWithoutFeedback, Animated, Easing, StyleSheet, useWindowDimensions } from "react-native";
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
  const fadeIn = useRef(new Animated.Value(0)).current;
  const timerPulse = useRef(new Animated.Value(1)).current;
  const hintOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(3000),
        Animated.timing(hintOpacity, {
          toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  useEffect(() => {
    if (!running) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(timerPulse, {
          toValue: 0.97, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true,
        }),
        Animated.timing(timerPulse, {
          toValue: 1, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [running]);

  return (
    <TouchableWithoutFeedback onPress={onDoubleTap}>
      <SafeAreaView
        style={[styles.screenSaver, { backgroundColor: "#000000" }]}
        edges={["top", "bottom"]}
      >
        <Animated.View style={{ flex: 1, opacity: fadeIn }}>
          <FocusScene t={t} running={running} width={width} height={height} conditions={conditions} particlesActive={particlesActive} season={season} />
        </Animated.View>
        <View style={styles.saverBody} pointerEvents="box-none">
          <Animated.View
            style={[
              styles.saverTimerWrap,
              { opacity: fadeIn, transform: [{ scale: fadeIn.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }] },
            ]}
          >
            <Animated.Text
              style={[
                styles.saverTimer,
                { color: done ? "#32D583" : "#ffffff", transform: [{ scale: timerPulse }] },
              ]}
            >
              {String(min).padStart(2, "0")}:{String(sec).padStart(2, "0")}
            </Animated.Text>
          </Animated.View>
          <Animated.View
            style={[
              styles.saverTree,
              { opacity: fadeIn, transform: [{ scale: fadeIn.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.1] }) }] },
            ]}
          >
            <BanyanTree
              pct={progress}
              isDark={true}
              running={running}
              completedPomodoros={completedPomodoros}
              sessionProgress={sessionProgress}
              season={season}
            />
          </Animated.View>
          <Animated.Text style={[styles.saverHint, { opacity: hintOpacity }]}>
            Double-tap to exit
          </Animated.Text>
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
