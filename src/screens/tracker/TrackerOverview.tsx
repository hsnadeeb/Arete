import React from "react";
import { View, Text, ScrollView } from "react-native";
import { useApp } from "../../context/AppContext";
import { AnimatedStatCard } from "./AnimatedStatCard";
import { LUCIDE_ICONS } from "../../constants/typography";
import { trackerStyles as s } from "./styles";
import type { WeekData, ThemeColors } from "./types";

interface Props {
  week: WeekData;
  T: ThemeColors;
}

export function TrackerOverview({ week, T }: Props) {
  const { dailyLog } = useApp();

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
          iconColor="#0b6bcf"
          label="Weight"
          value={`${dailyLog?.weight || 0} kg`}
          valueColor="#0b6bcf"
          spark={{
            values: week.weights.map((w) => w.value),
            color: "#0b6bcf",
          }}
          delay={0}
          surfaceColor={T.surface}
          borderColor={T.borderSoft}
          mutedColor={T.textTertiary}
        />

        <AnimatedStatCard
          icon={LUCIDE_ICONS.droplet}
          iconColor="#0ea5e9"
          label="Water"
          value={`${((dailyLog?.water_ml || 0) / 250).toFixed(0)} cups`}
          valueColor="#0ea5e9"
          spark={{
            values: week.waters.map((w) => w.value),
            color: "#0ea5e9",
          }}
          delay={60}
          surfaceColor={T.surface}
          borderColor={T.borderSoft}
          mutedColor={T.textTertiary}
        />

        <AnimatedStatCard
          icon={LUCIDE_ICONS.run}
          iconColor="#f59e0b"
          label="Steps"
          value={(dailyLog?.steps || 0).toLocaleString()}
          valueColor="#f59e0b"
          spark={{
            values: week.steps.map((w) => w.value),
            color: "#f59e0b",
          }}
          delay={120}
          surfaceColor={T.surface}
          borderColor={T.borderSoft}
          mutedColor={T.textTertiary}
        />

        <AnimatedStatCard
          icon={LUCIDE_ICONS.smile}
          iconColor="#8b5cf6"
          label="Mood"
          value={`${dailyLog?.mood || 0}/5`}
          valueColor="#8b5cf6"
          spark={{
            values: week.moods.map((w) => w.value),
            color: "#8b5cf6",
          }}
          delay={180}
          surfaceColor={T.surface}
          borderColor={T.borderSoft}
          mutedColor={T.textTertiary}
        />

        <AnimatedStatCard
          icon={LUCIDE_ICONS.moon}
          iconColor="#6366f1"
          label="Sleep"
          value={`${dailyLog?.sleep_hours || 0} h`}
          valueColor="#6366f1"
          spark={{
            values: week.sleep.map((w) => w.value),
            color: "#6366f1",
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
