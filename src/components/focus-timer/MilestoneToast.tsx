import React from "react";
import { Text, Animated, StyleSheet } from "react-native";
import { TYPOGRAPHY } from "../../constants/typography";

interface MilestoneToastProps {
  milestone: number | null;
  animValue: Animated.Value;
}

export function MilestoneToast({ milestone, animValue }: MilestoneToastProps) {
  if (milestone === null) return null;

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
                outputRange: [-20, 0],
              }),
            },
            {
              scale: animValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0.85, 1],
              }),
            },
          ],
        },
      ]}
    >
      <Text style={styles.mToastText}>
        {milestone === 100
          ? "\u{1F332} Session Complete!"
          : `${milestone}% \u2014 Keep going!`}
      </Text>
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
