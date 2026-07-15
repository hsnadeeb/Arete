import React from "react";
import { View, Text, Animated, StyleSheet } from "react-native";
import { TYPOGRAPHY } from "../../constants/typography";
import { GREEN, MAX_POMODOROS, treeAge } from "./constants";

interface StatsRowProps {
  streak: number;
  totalPomodoros: number;
  streakPulse: Animated.Value;
  colors: {
    warning: string;
    textTertiary: string;
    accent: string;
    borderLight: string;
  };
}

export function StatsRow({
  streak,
  totalPomodoros,
  streakPulse,
  colors,
}: StatsRowProps) {
  const age = treeAge(totalPomodoros);

  return (
    <View style={[styles.forestStats, { borderColor: colors.borderLight }]}>
      <View style={styles.statItem}>
        <Animated.Text
          style={[
            styles.statVal,
            { color: colors.warning, transform: [{ scale: streakPulse }] },
          ]}
        >
          {streak}
        </Animated.Text>
        <Text style={[styles.statLbl, { color: colors.textTertiary }]}>Streak</Text>
      </View>
      <View style={[styles.statDiv, { backgroundColor: colors.borderLight }]} />
      <View style={styles.statItem}>
        <Text style={[styles.statVal, { color: colors.accent }]}>
          {totalPomodoros}
        </Text>
        <Text style={[styles.statLbl, { color: colors.textTertiary }]}>
          / {MAX_POMODOROS} poms
        </Text>
      </View>
      <View style={[styles.statDiv, { backgroundColor: colors.borderLight }]} />
      <View style={styles.statItem}>
        <Text style={[styles.statVal, { color: GREEN[3] }]}>
          {age.toFixed(1)}
        </Text>
        <Text style={[styles.statLbl, { color: colors.textTertiary }]}>Years</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  forestStats: {
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
});
