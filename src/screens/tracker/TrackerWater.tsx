import React, { useRef, useEffect, useMemo } from "react";
import { View, Text, TouchableOpacity, ScrollView, Animated } from "react-native";
import { useApp } from "../../context/AppContext";
import { BarChart } from "../../components/Charts";
import { AnimatedCircularProgress } from "../../components/AnimatedProgress";
import { TYPOGRAPHY } from "../../constants/typography";
import { trackerStyles as s } from "./styles";
import type { WeekData, ThemeColors } from "./types";
import { TRACKER_COLORS, getProgressPercentage, getGoalColor } from "./constants";

interface Props {
  week: WeekData;
  T: ThemeColors;
}

const CUPS = 12;
const ML_PER_CUP = 250;

export function TrackerWater({ week, T }: Props) {
  const { dailyLog, logWater } = useApp();
  const cupAnims = useRef(
    Array.from({ length: CUPS }, () => new Animated.Value(0)),
  ).current;

  const colors = TRACKER_COLORS.water;

  const targetMl = useMemo(() => dailyLog?.water_target ?? 3000, [dailyLog?.water_target]);
  const waterMl = dailyLog?.water_ml || 0;
  const filledCups = Math.floor(waterMl / ML_PER_CUP);
  const progress = getProgressPercentage(waterMl, targetMl);
  const activeColor = getGoalColor(colors.primary, colors.completed, progress);

  useEffect(() => {
    Animated.stagger(
      40,
      cupAnims.map((a, i) =>
        Animated.spring(a, {
          toValue: i < filledCups ? 1 : 0,
          useNativeDriver: true,
          tension: 80,
          friction: 8,
        }),
      ),
    ).start();
  }, [filledCups, cupAnims]);

  const handleCupPress = (cupIndex: number) => {
    logWater((cupIndex + 1) * ML_PER_CUP);
  };

  return (
    <ScrollView
      style={s.tabScroll}
      contentContainerStyle={s.tabScrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[s.sectionTitle, { color: T.textMuted }]}>Water</Text>

      <View style={{ alignItems: "center", marginVertical: 4 }}>
        <AnimatedCircularProgress
          value={waterMl}
          max={targetMl}
          size={130}
          strokeWidth={12}
          color={colors.primary}
          completedColor={colors.completed}
          bgColor={T.borderSoft}
          label={`${(waterMl / 1000).toFixed(1)}L`}
          sublabel={`/${(targetMl / 1000).toFixed(1)}L`}
        />
      </View>

      <View style={s.waterGrid}>
        {Array.from({ length: CUPS }, (_, i) => {
          const isFilled = i < filledCups;
          return (
            <Animated.View
              key={i}
              style={{
                transform: [
                  {
                    scale: cupAnims[i].interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.85, 1],
                    }),
                  },
                ],
                opacity: cupAnims[i].interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.4, 1],
                }),
              }}
            >
              <TouchableOpacity
                style={[
                  s.waterCup,
                  {
                    backgroundColor: isFilled ? activeColor + "20" : T.surfaceAlt,
                    borderColor: isFilled ? activeColor : T.border,
                  },
                ]}
                onPress={() => handleCupPress(i)}
                activeOpacity={0.6}
              >
                <Text
                  style={[
                    s.waterCupLabel,
                    { color: isFilled ? activeColor : T.textTertiary },
                  ]}
                >
                  {i + 1}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>

      <View>
        <Text style={[s.trendLabel, { color: T.textMuted }]}>7-day trend</Text>
        <BarChart
          data={week.waters.map((w) => ({
            label: w.label,
            value: Math.round(w.value / 100),
            color: activeColor,
          }))}
          height={120}
          showValues={false}
          accentColor={activeColor}
        />
      </View>
    </ScrollView>
  );
}
