import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Icon } from "../Icons";
import { TYPOGRAPHY } from "../../constants/typography";
import type { LevelInfo } from "./constants";

interface LevelBadgeProps {
  level: LevelInfo;
  totalTrees: number;
  toNext: number;
  colors: {
    bgSecondary: string;
    borderLight: string;
    text: string;
    textTertiary: string;
  };
}

export function LevelBadge({ level, totalTrees, toNext, colors }: LevelBadgeProps) {
  return (
    <View
      style={[
        styles.levelBadge,
        { backgroundColor: colors.bgSecondary, borderColor: colors.borderLight },
      ]}
    >
      <Icon name={level.iconKey} size={18} color={colors.text} />
      <Text style={[TYPOGRAPHY.bodySm, { fontWeight: "700", color: colors.text }]}>
        {level.title}
      </Text>
      <Text style={[TYPOGRAPHY.captionSm, { color: colors.textTertiary }]}>
        {totalTrees} trees ·{" "}
        {toNext > 0 ? `${toNext} to next` : "Max level"}
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
});
