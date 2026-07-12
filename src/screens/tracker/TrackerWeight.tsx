import React, { useRef, useEffect, useState, useMemo } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Animated } from "react-native";
import { useApp } from "../../context/AppContext";
import { BarChart } from "../../components/Charts";
import { FillingWave } from "../../components/AnimatedProgress";
import { TYPOGRAPHY } from "../../constants/typography";
import { trackerStyles as s } from "./styles";
import type { WeekData, ThemeColors } from "./types";
import { TRACKER_COLORS, getProgressPercentage, getGoalColor } from "./constants";

interface Props {
  week: WeekData;
  T: ThemeColors;
}

export function TrackerWeight({ week, T }: Props) {
  const { dailyLog, logWeight } = useApp();
  const [weight, setWeight] = useState("");
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const colors = TRACKER_COLORS.weight;

  const targetWeight = useMemo(() => dailyLog?.weight_target ?? 75, [dailyLog?.weight_target]);
  const weightVal = dailyLog?.weight ?? 0;
  const progress = getProgressPercentage(weightVal, targetWeight);
  const activeColor = getGoalColor(colors.primary, colors.completed, progress);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 60,
        friction: 8,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, fadeAnim]);

  const handleLog = () => {
    const w = parseFloat(weight);
    if (w > 0) {
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.1,
          useNativeDriver: true,
          tension: 100,
          friction: 4,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 6,
        }),
      ]).start();
      logWeight(w);
      setWeight("");
    }
  };

  return (
    <ScrollView
      style={s.tabScroll}
      contentContainerStyle={s.tabScrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[s.sectionTitle, { color: T.textMuted }]}>Weight</Text>

      <View style={{ marginVertical: 8 }}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }], opacity: fadeAnim }}>
          <FillingWave
            value={weightVal}
            max={targetWeight}
            height={160}
            color={colors.primary}
            completedColor={colors.completed}
            bgColor={colors.primary + "15"}
          />
        </Animated.View>
        <Text style={[TYPOGRAPHY.body, { color: T.textMuted, textAlign: "center", marginTop: 8 }]}>
          {weightVal} kg · target {targetWeight} kg
        </Text>
      </View>

      <View style={s.actionRow}>
        <TextInput
          style={[s.input, { backgroundColor: T.surfaceAlt, borderColor: T.border, color: T.textPrimary }]}
          value={weight}
          onChangeText={setWeight}
          keyboardType="numeric"
          placeholder="Enter weight (kg)"
          placeholderTextColor={T.placeholder}
        />
        <TouchableOpacity
          style={[s.logBtn, { backgroundColor: activeColor }]}
          onPress={handleLog}
          activeOpacity={0.7}
        >
          <Text style={s.logBtnText}>Log</Text>
        </TouchableOpacity>
      </View>

      <View>
        <Text style={[s.trendLabel, { color: T.textMuted }]}>7-day trend</Text>
        <BarChart
          data={week.weights.map((w) => ({
            label: w.label,
            value: w.value,
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
