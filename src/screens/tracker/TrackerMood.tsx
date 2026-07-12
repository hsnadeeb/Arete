import React, { useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Animated } from "react-native";
import { useApp } from "../../context/AppContext";
import { BarChart } from "../../components/Charts";
import { Icon } from "../../components/Icons";
import { LUCIDE_ICONS, TYPOGRAPHY } from "../../constants/typography";
import type { LucideIconName } from "../../constants/typography";
import { trackerStyles as s } from "./styles";
import type { WeekData, ThemeColors } from "./types";

interface Props {
  week: WeekData;
  T: ThemeColors;
}

const MOODS = [
  { val: 1, icon: "frown" as LucideIconName, label: "Awful", color: "#ef4444" },
  { val: 2, icon: "frown" as LucideIconName, label: "Bad", color: "#f97316" },
  { val: 3, icon: "meh" as LucideIconName, label: "Meh", color: "#f59e0b" },
  { val: 4, icon: "smile" as LucideIconName, label: "Good", color: "#22c55e" },
  { val: 5, icon: "smile" as LucideIconName, label: "Great", color: "#0891b2" },
];

export function TrackerMood({ week, T }: Props) {
  const { dailyLog, logMood } = useApp();
  const moodAnims = useRef(
    Array.from({ length: 5 }, () => new Animated.Value(1)),
  ).current;
  const activeScale = useRef(new Animated.Value(1)).current;

  const selectedMood = dailyLog?.mood || 0;

  useEffect(() => {
    if (selectedMood > 0) {
      Animated.sequence([
        Animated.spring(activeScale, {
          toValue: 1.2,
          useNativeDriver: true,
          tension: 100,
          friction: 4,
        }),
        Animated.spring(activeScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 6,
        }),
      ]).start();
    }
  }, [selectedMood, activeScale]);

  const handleMoodPress = (mood: number) => {
    Animated.sequence([
      Animated.spring(moodAnims[mood - 1], {
        toValue: 1.25,
        useNativeDriver: true,
        tension: 120,
        friction: 4,
      }),
      Animated.spring(moodAnims[mood - 1], {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 6,
      }),
    ]).start();
    logMood(mood);
  };

  const avgMood =
    week.moods.filter((m) => m.value > 0).reduce((a, b) => a + b.value, 0) /
      Math.max(week.moods.filter((m) => m.value > 0).length, 1) || 0;

  return (
    <ScrollView
      style={s.tabScroll}
      contentContainerStyle={s.tabScrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[s.sectionTitle, { color: T.textMuted }]}>Mood</Text>

      {/* Average mood display */}
      <View style={{ alignItems: "center", marginBottom: 8 }}>
        <Animated.View style={{ transform: [{ scale: selectedMood > 0 ? activeScale : 1 }] }}>
          <Text style={[TYPOGRAPHY.monoLg, { color: T.textPrimary, fontSize: 40 }]}>
            {avgMood > 0 ? avgMood.toFixed(1) : "—"}
          </Text>
        </Animated.View>
        <Text style={[TYPOGRAPHY.caption, { color: T.textMuted }]}>7-day average</Text>
        {/* Mood target */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: selectedMood >= 4 ? "#22c55e" : "#f59e0b" }} />
          <Text style={[TYPOGRAPHY.captionSm, { color: T.textMuted }]}>
            Goal: {selectedMood >= 4 ? "Achieved" : "4+/5"}
          </Text>
        </View>
      </View>

      <View style={s.moodRow}>
        {MOODS.map((m) => {
          const isActive = selectedMood === m.val;
          return (
            <Animated.View
              key={m.val}
              style={{
                flex: 1,
                transform: [{ scale: moodAnims[m.val - 1] }],
              }}
            >
              <TouchableOpacity
                style={[
                  s.moodBtn,
                  {
                    backgroundColor: isActive ? m.color + "18" : T.surfaceAlt,
                    borderColor: isActive ? m.color : T.border,
                    borderWidth: isActive ? 2 : 1,
                  },
                ]}
                onPress={() => handleMoodPress(m.val)}
                activeOpacity={0.6}
              >
                <Icon
                  name={m.icon}
                  size={28}
                  color={isActive ? m.color : T.textTertiary}
                />
                <Text
                  style={[
                    s.moodLabel,
                    { color: isActive ? m.color : T.textTertiary },
                  ]}
                >
                  {m.label}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>

      <View>
        <Text style={[s.trendLabel, { color: T.textMuted }]}>7-day trend</Text>
        <BarChart
          data={week.moods.map((w) => ({
            label: w.label,
            value: Math.round(w.value * 20),
            color: selectedMood >= 4 ? "#22c55e" : "#f97316",
          }))}
          height={120}
          showValues={false}
          accentColor={selectedMood >= 4 ? "#22c55e" : "#f97316"}
        />
      </View>
    </ScrollView>
  );
}
