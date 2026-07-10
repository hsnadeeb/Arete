import React, { useRef, useEffect } from "react";
import { View, Text, ScrollView, Animated } from "react-native";
import { useApp } from "../../context/AppContext";
import { BarChart, ProgressRing } from "../../components/Charts";
import { TYPOGRAPHY } from "../../constants/typography";
import { trackerStyles as s } from "./styles";
import type { WeekData, ThemeColors } from "./types";

interface Props {
  week: WeekData;
  T: ThemeColors;
}

const STEP_TARGET = 10000;

export function TrackerSteps({ week, T }: Props) {
  const { dailyLog } = useApp();
  const dotAnims = useRef(
    Array.from({ length: 10 }, () => new Animated.Value(0)),
  ).current;

  const steps = dailyLog?.steps || 0;
  const filledDots = Math.floor(steps / 1000);
  const progress = Math.min((steps / STEP_TARGET) * 100, 100);

  useEffect(() => {
    Animated.stagger(
      50,
      dotAnims.map((a, i) =>
        Animated.spring(a, {
          toValue: i < filledDots ? 1 : 0,
          useNativeDriver: true,
          tension: 80,
          friction: 8,
        }),
      ),
    ).start();
  }, [filledDots, dotAnims]);

  return (
    <ScrollView
      style={s.tabScroll}
      contentContainerStyle={s.tabScrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[s.sectionTitle, { color: T.textMuted }]}>Steps</Text>

      <View style={{ alignItems: "center", marginVertical: 4 }}>
        <ProgressRing
          value={progress}
          max={100}
          size={130}
          strokeWidth={12}
          color="#f59e0b"
          bgColor={T.borderSoft}
          label={steps.toLocaleString()}
        />
        <Text style={[TYPOGRAPHY.body, { color: T.textMuted, marginTop: 8 }]}>
          / {STEP_TARGET.toLocaleString()} steps
        </Text>
      </View>

      <View style={s.stepsRow}>
        {Array.from({ length: 10 }, (_, i) => (
          <Animated.View
            key={i}
            style={[
              s.stepDot,
              {
                backgroundColor: T.border,
                transform: [
                  {
                    scaleY: dotAnims[i].interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1],
                    }),
                  },
                ],
                opacity: dotAnims[i].interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 1],
                }),
              },
              i < filledDots && { backgroundColor: "#f59e0b" },
            ]}
          />
        ))}
      </View>

      <Text style={[TYPOGRAPHY.captionSm, { color: T.textMuted, textAlign: "center" }]}>
        Each dot = 1,000 steps
      </Text>

      <View>
        <Text style={[s.trendLabel, { color: T.textMuted }]}>7-day trend</Text>
        <BarChart
          data={week.steps.map((w) => ({
            label: w.label,
            value: Math.round(w.value / 100),
            color: "#f59e0b",
          }))}
          height={120}
          showValues={false}
          accentColor="#f59e0b"
        />
      </View>
    </ScrollView>
  );
}
