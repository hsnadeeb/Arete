import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { TYPOGRAPHY } from "../../constants/typography";

interface TimerDisplayProps {
  min: number;
  sec: number;
  done: boolean;
  running: boolean;
  colors: { success: string; heading: string; textTertiary: string };
}

export function TimerDisplay({ min, sec, done, running, colors }: TimerDisplayProps) {
  const label = done ? "Well done!" : running ? "Stay focused" : "Press start";

  return (
    <View style={styles.timerSection}>
      <Text
        style={[styles.timerText, { color: done ? colors.success : colors.heading }]}
      >
        {String(min).padStart(2, "0")}:{String(sec).padStart(2, "0")}
      </Text>
      <Text style={[styles.timerLabel, { color: colors.textTertiary }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  timerSection: { alignItems: "center", marginBottom: 16 },
  timerText: { ...TYPOGRAPHY.monoLg, fontSize: 32 },
  timerLabel: { ...TYPOGRAPHY.label, marginTop: 4 },
});
