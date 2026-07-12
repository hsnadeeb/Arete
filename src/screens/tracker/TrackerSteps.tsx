import React, { useRef, useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
} from "react-native";
import { useApp } from "../../context/AppContext";
import { BarChart } from "../../components/Charts";
import { AnimatedCircularProgress } from "../../components/AnimatedProgress";
import { Icon } from "../../components/Icons";
import { LUCIDE_ICONS } from "../../constants/typography";
import { TYPOGRAPHY } from "../../constants/typography";
import { trackerStyles as s } from "./styles";
import type { WeekData, ThemeColors } from "./types";
import {
  TRACKER_COLORS,
  getProgressPercentage,
  getGoalColor,
} from "./constants";

interface Props {
  week: WeekData;
  T: ThemeColors;
}

export function TrackerSteps({ week, T }: Props) {
  const { dailyLog, logSteps } = useApp();
  const [stepsInput, setStepsInput] = useState("");
  const dotAnims = useRef(
    Array.from({ length: 10 }, () => new Animated.Value(0)),
  ).current;

  const colors = TRACKER_COLORS.steps;

  const stepTarget = useMemo(
    () => dailyLog?.steps_target ?? 10000,
    [dailyLog?.steps_target],
  );
  const steps = dailyLog?.steps || 0;
  const filledDots = Math.floor(steps / 1000);
  const progress = getProgressPercentage(steps, stepTarget);
  const activeColor = getGoalColor(colors.primary, colors.completed, progress);

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

  const handleLogSteps = () => {
    const n = parseInt(stepsInput);
    if (n > 0) {
      logSteps(n);
      setStepsInput("");
    }
  };

  return (
    <ScrollView
      style={s.tabScroll}
      contentContainerStyle={s.tabScrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[s.sectionTitle, { color: T.textMuted }]}>Steps</Text>

      <View style={{ alignItems: "center", marginVertical: 4 }}>
        <AnimatedCircularProgress
          value={steps}
          max={stepTarget}
          size={130}
          strokeWidth={12}
          color={colors.primary}
          completedColor={colors.completed}
          bgColor={T.borderSoft}
          label={steps.toLocaleString()}
          sublabel={`/ ${stepTarget.toLocaleString()}`}
        />
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
              i < filledDots && { backgroundColor: activeColor },
              i < filledDots &&
                progress >= 100 && { backgroundColor: colors.completed },
            ]}
          />
        ))}
      </View>

      <Text
        style={[
          TYPOGRAPHY.captionSm,
          { color: T.textMuted, textAlign: "center" },
        ]}
      >
        Each dot = 1,000 steps
      </Text>

      {/* Quick add steps */}
      <View style={[s.actionRow, { backgroundColor: T.surfaceAlt }]}>
        <TextInput
          style={[s.input, { color: T.textPrimary }]}
          value={stepsInput}
          onChangeText={setStepsInput}
          keyboardType="numeric"
          placeholder="Add steps"
          placeholderTextColor={T.placeholder}
        />
        <TouchableOpacity
          style={[s.logBtn, { backgroundColor: activeColor }]}
          onPress={handleLogSteps}
          activeOpacity={0.7}
        >
          <Icon name={LUCIDE_ICONS.plus} size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View>
        <Text style={[s.trendLabel, { color: T.textMuted }]}>7-day trend</Text>
        <BarChart
          data={week.steps.map((w) => ({
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