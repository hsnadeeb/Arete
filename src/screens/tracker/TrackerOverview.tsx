import React, { useMemo } from "react";
import { View, Text, ScrollView } from "react-native";
import { useApp } from "../../context/AppContext";
import { AnimatedStatCard } from "./AnimatedStatCard";
import { LUCIDE_ICONS } from "../../constants/typography";
import { trackerStyles as s } from "./styles";
import type { WeekData, ThemeColors } from "./types";
import { TRACKER_COLORS, getProgressPercentage, getGoalColor } from "./constants";

interface Props {
  week: WeekData;
  T: ThemeColors;
}

export function TrackerOverview({ week, T }: Props) {
  const { dailyLog } = useApp();

  const stepTarget = useMemo(() => dailyLog?.steps_target ?? 10000, [dailyLog?.steps_target]);
  const waterTarget = useMemo(() => dailyLog?.water_target ?? 3000, [dailyLog?.water_target]);
  const sleepTarget = useMemo(() => dailyLog?.sleep_target ?? 8, [dailyLog?.sleep_target]);
  const weightTarget = useMemo(() => dailyLog?.weight_target ?? 75, [dailyLog?.weight_target]);

  const stepsPct = getProgressPercentage(dailyLog?.steps || 0, stepTarget);
  const waterPct = getProgressPercentage(dailyLog?.water_ml || 0, waterTarget);
  const sleepPct = getProgressPercentage(dailyLog?.sleep_hours || 0, sleepTarget);
  const weightPct = getProgressPercentage(dailyLog?.weight || 0, weightTarget);

  const stepsColor = getGoalColor(TRACKER_COLORS.steps.primary, TRACKER_COLORS.steps.completed, stepsPct);
  const waterColor = getGoalColor(TRACKER_COLORS.water.primary, TRACKER_COLORS.water.completed, waterPct);
  const sleepColor = getGoalColor(TRACKER_COLORS.sleep.primary, TRACKER_COLORS.sleep.completed, sleepPct);
  const weightColor = getGoalColor(TRACKER_COLORS.weight.primary, TRACKER_COLORS.weight.completed, weightPct);

  return (
    <ScrollView
      style={s.tabScroll}
      contentContainerStyle={s.tabScrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[s.sectionTitle, { color: T.textMuted }]}>
        Today's stats
      </Text>

      <View style={{ gap: 10 }}>
        <AnimatedStatCard
          icon={LUCIDE_ICONS.weight}
          iconColor={weightColor}
          label="Weight"
          value={`${dailyLog?.weight || 0} kg`}
          valueColor={weightColor}
          progress={weightPct}
          spark={{
            values: week.weights.map((w) => w.value),
            color: weightColor,
          }}
          delay={0}
          surfaceColor={T.surface}
          borderColor={T.borderSoft}
          mutedColor={T.textTertiary}
        />

        <AnimatedStatCard
          icon={LUCIDE_ICONS.droplet}
          iconColor={waterColor}
          label="Water"
          value={`${((dailyLog?.water_ml || 0) / 250).toFixed(0)} cups`}
          valueColor={waterColor}
          progress={waterPct}
          spark={{
            values: week.waters.map((w) => w.value),
            color: waterColor,
          }}
          delay={60}
          surfaceColor={T.surface}
          borderColor={T.borderSoft}
          mutedColor={T.textTertiary}
        />

        <AnimatedStatCard
          icon={LUCIDE_ICONS.run}
          iconColor={stepsColor}
          label="Steps"
          value={(dailyLog?.steps || 0).toLocaleString()}
          valueColor={stepsColor}
          progress={stepsPct}
          spark={{
            values: week.steps.map((w) => w.value),
            color: stepsColor,
          }}
          delay={120}
          surfaceColor={T.surface}
          borderColor={T.borderSoft}
          mutedColor={T.textTertiary}
        />

        <AnimatedStatCard
          icon={LUCIDE_ICONS.smile}
          iconColor={TRACKER_COLORS.mood.primary}
          label="Mood"
          value={`${dailyLog?.mood || 0}/5`}
          valueColor={TRACKER_COLORS.mood.primary}
          spark={{
            values: week.moods.map((w) => w.value),
            color: TRACKER_COLORS.mood.primary,
          }}
          delay={180}
          surfaceColor={T.surface}
          borderColor={T.borderSoft}
          mutedColor={T.textTertiary}
        />

        <AnimatedStatCard
          icon={LUCIDE_ICONS.moon}
          iconColor={sleepColor}
          label="Sleep"
          value={`${dailyLog?.sleep_hours || 0} h`}
          valueColor={sleepColor}
          progress={sleepPct}
          spark={{
            values: week.sleep.map((w) => w.value),
            color: sleepColor,
          }}
          delay={240}
          surfaceColor={T.surface}
          borderColor={T.borderSoft}
          mutedColor={T.textTertiary}
        />
      </View>
    </ScrollView>
  );
}
