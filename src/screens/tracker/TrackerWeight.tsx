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
import { LUCIDE_ICONS, TYPOGRAPHY } from "../../constants/typography";
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

export function TrackerWeight({ week, T }: Props) {
  const { dailyLog, logWeight } = useApp();
  const [weightInput, setWeightInput] = useState("");
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const colors = TRACKER_COLORS.weight;

  const targetWeight = useMemo(
    () => dailyLog?.weight_target ?? 75,
    [dailyLog?.weight_target],
  );
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
    const w = parseFloat(weightInput);
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
      setWeightInput("");
    }
  };

  return (
    <ScrollView
      style={s.tabScroll}
      contentContainerStyle={s.tabScrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[s.sectionTitle, { color: T.textMuted }]}>Weight</Text>

      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
          opacity: fadeAnim,
          alignItems: "center",
          marginVertical: 4,
        }}
      >
        <AnimatedCircularProgress
          value={weightVal}
          max={targetWeight}
          size={130}
          strokeWidth={12}
          color={colors.primary}
          completedColor={colors.completed}
          bgColor={T.borderSoft}
          label={`${weightVal} kg`}
          sublabel={`/ ${targetWeight} kg`}
        />
      </Animated.View>

      <View style={{ alignItems: "center", gap: 4 }}>
        <Text style={[TYPOGRAPHY.body, { color: T.textSecondary }]}>
          {weightVal} kg · target {targetWeight} kg
        </Text>
      </View>

      <View style={[s.actionRow, { backgroundColor: T.surfaceAlt }]}>
        <TextInput
          style={[s.input, { color: T.textPrimary }]}
          value={weightInput}
          onChangeText={setWeightInput}
          keyboardType="numeric"
          placeholder="Enter weight (kg)"
          placeholderTextColor={T.placeholder}
        />
        <TouchableOpacity
          style={[s.logBtn, { backgroundColor: activeColor }]}
          onPress={handleLog}
          activeOpacity={0.7}
        >
          <Icon name={LUCIDE_ICONS.plus} size={20} color="#fff" />
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