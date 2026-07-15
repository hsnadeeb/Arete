import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { TYPOGRAPHY } from "../../constants/typography";
import { getTreeStage, TREE_STAGES, treeAge, MAX_POMODOROS } from "./constants";

interface LevelBadgeProps {
  totalPomodoros: number;
  colors: {
    bgSecondary: string;
    borderLight: string;
    text: string;
    textTertiary: string;
  };
}

export function LevelBadge({ totalPomodoros, colors }: LevelBadgeProps) {
  const { stage, index } = getTreeStage(totalPomodoros);
  const nextStage = TREE_STAGES[Math.min(index + 1, TREE_STAGES.length - 1)];
  const nextMin = nextStage?.minPomodoros ?? MAX_POMODOROS;
  const pomsToNext = nextMin - totalPomodoros;
  const age = treeAge(totalPomodoros);

  return (
    <View
      style={[
        styles.levelBadge,
        { backgroundColor: colors.bgSecondary, borderColor: colors.borderLight },
      ]}
    >
      <Text style={styles.emoji}>{stage.emoji}</Text>
      <Text style={[TYPOGRAPHY.bodySm, { fontWeight: "700", color: colors.text }]}>
        {stage.name}
      </Text>
      <Text style={[TYPOGRAPHY.captionSm, { color: colors.textTertiary }]}>
        {Math.floor(age)} yrs · {totalPomodoros}/{MAX_POMODOROS} poms
        {pomsToNext > 0 ? ` · ${pomsToNext} to next` : ""}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 8,
  },
  emoji: { fontSize: 16 },
});
