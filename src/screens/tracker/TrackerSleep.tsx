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

const SLEEP_TARGET = 8;

export function TrackerSleep({ week, T }: Props) {
  const { dailyLog, logSleep } = useApp();
  const [sleepH, setSleepH] = useState("");
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const hours = dailyLog?.sleep_hours || 0;
  const progress = Math.min((hours / SLEEP_TARGET) * 100, 100);
  const quality = hours >= 7 ? "Great" : hours >= 6 ? "Fair" : hours > 0 ? "Low" : "—";
  const qualityColor = hours >= 7 ? "#22c55e" : hours >= 6 ? "#f59e0b" : "#ef4444";

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    if (hours >= 7) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.03, duration: 1500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        ]),
      ).start();
    }
  }, [hours, pulseAnim]);

  const handleLog = () => {
    const h = parseFloat(sleepH);
    if (h >= 0 && h <= 24) {
      logSleep(h, 3);
      setSleepH("");
    }
  };

  return (
    <ScrollView
      style={s.tabScroll}
      contentContainerStyle={s.tabScrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[s.sectionTitle, { color: T.textMuted }]}>Sleep</Text>

      <View style={{ alignItems: "center", marginVertical: 4 }}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: pulseAnim }] }}>
          <ProgressRing
            value={progress}
            max={100}
            size={150}
            strokeWidth={14}
            color="#8b5cf6"
            bgColor={T.borderSoft}
            label={hours ? `${hours}h` : "—"}
          />
        </Animated.View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: qualityColor }} />
          <Text style={[TYPOGRAPHY.body, { color: qualityColor, fontWeight: "600" }]}>
            {quality} quality
          </Text>
        </View>
        <Text style={[TYPOGRAPHY.captionSm, { color: T.textMuted, marginTop: 4 }]}>
          Target: {SLEEP_TARGET}h per night
        </Text>
      </View>

      {/* Sleep stages visualization */}
      <View
        style={{
          flexDirection: "row",
          borderRadius: 12,
          overflow: "hidden",
          height: 32,
          marginVertical: 8,
        }}
      >
        <View style={{ flex: hours > 0 ? 0.3 : 0, backgroundColor: "#6366f1" }} />
        <View style={{ flex: hours > 0 ? 0.45 : 0, backgroundColor: "#8b5cf6" }} />
        <View style={{ flex: hours > 0 ? 0.2 : 0, backgroundColor: "#a78bfa" }} />
        <View style={{ flex: hours > 0 ? 0.05 : 1, backgroundColor: T.border }} />
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
        {["Deep", "Light", "REM", "Awake"].map((label, i) => (
          <View key={label} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: ["#6366f1", "#8b5cf6", "#a78bfa", T.border][i],
              }}
            />
            <Text style={[TYPOGRAPHY.captionSm, { color: T.textMuted }]}>{label}</Text>
          </View>
        ))}
      </View>

      <View style={s.actionRow}>
        <TextInput
          style={[s.input, { backgroundColor: T.surfaceAlt, borderColor: T.border, color: T.textPrimary }]}
          value={sleepH}
          onChangeText={setSleepH}
          keyboardType="numeric"
          placeholder="Hours slept"
          placeholderTextColor={T.placeholder}
        />
        <TouchableOpacity
          style={[s.logBtn, { backgroundColor: "#8b5cf6" }]}
          onPress={handleLog}
          activeOpacity={0.7}
        >
          <Text style={s.logBtnText}>Log</Text>
        </TouchableOpacity>
      </View>

      <View>
        <Text style={[s.trendLabel, { color: T.textMuted }]}>7-day trend</Text>
        <BarChart
          data={week.sleep.map((w) => ({
            label: w.label,
            value: Math.round(w.value * 10),
            color: "#8b5cf6",
          }))}
          height={120}
          showValues={false}
          accentColor="#8b5cf6"
        />
      </View>
    </ScrollView>
  );
}
