import React from "react";
import { Text, Animated, StyleSheet } from "react-native";
import { TYPOGRAPHY } from "../../constants/typography";
import { TREE_STAGES, treeAge, MAX_AGE } from "./constants";

interface MilestoneToastProps {
  milestone: number | null;
  animValue: Animated.Value;
}

export function MilestoneToast({ milestone, animValue }: MilestoneToastProps) {
  if (milestone === null) return null;

  const stage = TREE_STAGES[milestone];
  if (!stage) return null;

  const isLastStage = milestone === TREE_STAGES.length - 1;
  const age = treeAge(stage.minPomodoros);
  const nextStage = isLastStage
    ? null
    : TREE_STAGES[Math.min(milestone + 1, TREE_STAGES.length - 1)];

  const message = isLastStage
    ? `${stage.emoji} ${stage.name} \u2014 ${Math.floor(age)}+ Years!`
    : `${stage.emoji} ${stage.name} \u2014 ${stage.minPomodoros} / ${nextStage ? nextStage.minPomodoros : MAX_AGE} pomodoros`;

  return (
    <Animated.View
      style={[
        styles.mToast,
        {
          opacity: animValue,
          transform: [
            {
              translateY: animValue.interpolate({
                inputRange: [0, 1],
                outputRange: [-24, 0],
              }),
            },
            {
              scale: animValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1],
              }),
            },
          ],
        },
      ]}
    >
      <Text style={styles.mToastText}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  mToast: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 100,
  },
  mToastText: {
    backgroundColor: "rgba(0,0,0,0.75)",
    color: "#fff",
    ...TYPOGRAPHY.body,
    fontWeight: "700",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    overflow: "hidden",
  },
});
