import React, { useEffect, useRef } from "react";
import { View, Text, Animated, Easing, StyleSheet } from "react-native";
import { TYPOGRAPHY } from "../../constants/typography";
import { GREEN, MAX_POMODOROS, treeAge } from "./constants";

interface StatsRowProps {
  streak: number;
  totalPomodoros: number;
  streakPulse: Animated.Value;
  streakGlow?: Animated.Value;
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
  streakGlow,
  colors,
}: StatsRowProps) {
  const age = treeAge(totalPomodoros);
  const mountAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(mountAnim, {
          toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const highlightColor = streakGlow?.interpolate
    ? streakGlow.interpolate({
        inputRange: [0, 1],
        outputRange: [colors.warning, "#ff6b6b"],
      })
    : colors.warning;

  return (
    <Animated.View
      style={[
        styles.forestStats,
        {
          borderColor: colors.borderLight,
          opacity: mountAnim,
          transform: [{ translateY: mountAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
        },
      ]}
    >
      <View style={styles.statItem}>
        <Animated.Text
          style={[
            styles.statVal,
            { color: highlightColor, transform: [{ scale: streakPulse }] },
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
    </Animated.View>
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
