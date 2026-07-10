import React, { useRef, useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Animated } from "react-native";
import { useApp } from "../../context/AppContext";
import { BarChart, ProgressRing } from "../../components/Charts";
import { TYPOGRAPHY } from "../../constants/typography";
import { trackerStyles as s } from "./styles";
import type { WeekData, ThemeColors } from "./types";

interface Props {
  week: WeekData;
  T: ThemeColors;
}

export function TrackerWeight({ week, T }: Props) {
  const { dailyLog, logWeight } = useApp();
  const [weight, setWeight] = useState("");
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

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

  const weightVal = dailyLog?.weight ?? 0;
  const targetWeight = 75;
  const progress = Math.min((weightVal / targetWeight) * 100, 100);

  return (
    <ScrollView
      style={s.tabScroll}
      contentContainerStyle={s.tabScrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[s.sectionTitle, { color: T.textMuted }]}>Weight</Text>

      <View style={{ alignItems: "center", marginVertical: 8 }}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }], opacity: fadeAnim }}>
          <ProgressRing
            value={progress}
            max={100}
            size={140}
            strokeWidth={12}
            color="#0b6bcf"
            bgColor={T.borderSoft}
            label={weightVal ? `${weightVal}` : "—"}
          />
        </Animated.View>
        <Text style={[TYPOGRAPHY.body, { color: T.textMuted, marginTop: 8 }]}>
          kg · target {targetWeight} kg
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
          style={[s.logBtn, { backgroundColor: "#0b6bcf" }]}
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
            color: "#0b6bcf",
          }))}
          height={120}
          showValues={false}
          accentColor="#0b6bcf"
        />
      </View>
    </ScrollView>
  );
}
