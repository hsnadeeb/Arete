import React from "react";
import { Text, Animated, StyleSheet } from "react-native";
import { TYPOGRAPHY } from "../../constants/typography";
import { getBanyanStage, BANYAN_STAGES } from "./constants";

interface MilestoneToastProps {
  milestone: number | null;
  animValue: Animated.Value;
}

export function MilestoneToast({ milestone, animValue }: MilestoneToastProps) {
  if (milestone === null) return null;

  const stage = getBanyanStage(milestone);

  let message = "";
  if (milestone === 100) {
    message = `${stage.emoji} Ancient Banyan \u2014 Session Complete!`;
  } else {
    const prevStageIdx = Math.max(0, stage.index - 1);
    const nextStage = BANYAN_STAGES[Math.min(stage.index + 1, BANYAN_STAGES.length - 1)];
    message = `${stage.emoji} ${stage.name} \u2014 ${milestone}%`;
  }

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
