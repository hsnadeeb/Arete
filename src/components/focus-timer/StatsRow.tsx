import React from "react";
import { View, Text, Animated, StyleSheet } from "react-native";
import { TYPOGRAPHY } from "../../constants/typography";
import { GREEN } from "./constants";

interface StatsRowProps {
  streak: number;
  totalTrees: number;
  treesThisSession: number;
  progress: number;
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
  totalTrees,
  treesThisSession,
  progress,
  streakPulse,
  colors,
}: StatsRowProps) {
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
          {totalTrees + treesThisSession}
        </Text>
        <Text style={[styles.statLbl, { color: colors.textTertiary }]}>Trees</Text>
      </View>
      <View style={[styles.statDiv, { backgroundColor: colors.borderLight }]} />
      <View style={styles.statItem}>
        <Text style={[styles.statVal, { color: GREEN[3] }]}>
          {Math.floor(progress)}%
        </Text>
        <Text style={[styles.statLbl, { color: colors.textTertiary }]}>Growth</Text>
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
