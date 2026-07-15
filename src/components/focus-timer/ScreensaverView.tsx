import React from "react";
import { View, Text, TouchableWithoutFeedback, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TYPOGRAPHY } from "../../constants/typography";
import { BanyanTree } from "./BanyanTree";

interface ScreensaverViewProps {
  min: number;
  sec: number;
  done: boolean;
  progress: number;
  running: boolean;
  completedPomodoros?: number;
  sessionProgress?: number;
  onDoubleTap: () => void;
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
}: ScreensaverViewProps) {
  return (
    <TouchableWithoutFeedback onPress={onDoubleTap}>
      <SafeAreaView
        style={[styles.screenSaver, { backgroundColor: "#000000" }]}
        edges={["top", "bottom"]}
      >
        <View style={styles.saverBody}>
          <Text
            style={[styles.saverTimer, { color: done ? "#32D583" : "#ffffff" }]}
          >
            {String(min).padStart(2, "0")}:{String(sec).padStart(2, "0")}
          </Text>
          <View style={styles.saverTree}>
            <BanyanTree
              pct={progress}
              isDark={true}
              running={running}
              completedPomodoros={completedPomodoros}
              sessionProgress={sessionProgress}
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
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
  },
  saverTimer: { ...TYPOGRAPHY.monoLg, fontSize: 56, letterSpacing: 2 },
  saverTree: { transform: [{ scale: 1.2 }] },
  saverHint: {
    ...TYPOGRAPHY.captionSm,
    color: "rgba(255,255,255,0.35)",
    marginTop: 24,
  },
});
