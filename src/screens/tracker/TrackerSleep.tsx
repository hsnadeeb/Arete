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
import { TYPOGRAPHY } from "../../constants/typography";
import { trackerStyles as s } from "./styles";
import type { WeekData, ThemeColors } from "./types";
import { TRACKER_COLORS, getProgressPercentage, getGoalColor } from "./constants";

interface Props {
  week: WeekData;
  T: ThemeColors;
}

export function TrackerSleep({ week, T }: Props) {
  const { dailyLog, logSleep } = useApp();
  const [sleepH, setSleepH] = useState("");
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const colors = TRACKER_COLORS.sleep;

  const sleepTarget = useMemo(
    () => dailyLog?.sleep_target ?? 8,
    [dailyLog?.sleep_target],
  );
  const hours = dailyLog?.sleep_hours || 0;
  const progress = getProgressPercentage(hours, sleepTarget);
  const activeColor = getGoalColor(colors.primary, colors.completed, progress);

  const quality =
    hours >= sleepTarget
      ? "Great"
      : hours >= sleepTarget * 0.75
        ? "Fair"
        : hours > 0
          ? "Low"
          : "—";
  const qualityColor =
    hours >= sleepTarget
      ? "#22c55e"
      : hours >= sleepTarget * 0.75
        ? "#f59e0b"
        : "#ef4444";

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

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

      {/* Circular progress — same style as Steps / Water */}
      <Animated.View style={{ opacity: fadeAnim }}>
        <View style={{ alignItems: "center", marginVertical: 4 }}>
          <AnimatedCircularProgress
            value={hours}
            max={sleepTarget}
            size={130}
            strokeWidth={12}
            color={colors.primary}
            completedColor={colors.completed}
            bgColor={T.borderSoft}
            label={`${hours}h`}
            sublabel={`/ ${sleepTarget}h`}
          />
        </View>
      </Animated.View>

      {/* Sleep quality indicator */}
      <View style={{ alignItems: "center", gap: 4 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: qualityColor,
            }}
          />
          <Text
            style={[TYPOGRAPHY.body, { color: qualityColor, fontWeight: "600" }]}
          >
            {hours ? `${hours}h · ${quality}` : "—"}
          </Text>
        </View>
      </View>

      {/* Sleep stages bar */}
      <View
        style={{
          borderRadius: 12,
          overflow: "hidden",
          height: 32,
          marginVertical: 8,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            height: "100%",
          }}
        >
          <View
            style={{
              flex: hours > 0 ? 0.3 : 0,
              backgroundColor: "#6366f1",
              borderRadius: 0,
            }}
          />
          <View
            style={{
              flex: hours > 0 ? 0.45 : 0,
              backgroundColor: "#8b5cf6",
            }}
          />
          <View
            style={{
              flex: hours > 0 ? 0.2 : 0,
              backgroundColor: "#a78bfa",
            }}
          />
          <View
            style={{
              flex: hours > 0 ? 0.05 : 1,
              backgroundColor: T.border,
            }}
          />
        </View>
      </View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        {["Deep", "Light", "REM", "Awake"].map((label, i) => (
          <View
            key={label}
            style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: [
                  "#6366f1",
                  "#8b5cf6",
                  "#a78bfa",
                  T.border,
                ][i],
              }}
            />
            <Text
              style={[TYPOGRAPHY.captionSm, { color: T.textMuted }]}
            >
              {label}
            </Text>
          </View>
        ))}
      </View>

      {/* Log sleep */}
      <View style={s.actionRow}>
        <TextInput
          style={[
            s.input,
            {
              backgroundColor: T.surfaceAlt,
              borderColor: T.border,
              color: T.textPrimary,
            },
          ]}
          value={sleepH}
          onChangeText={setSleepH}
          keyboardType="numeric"
          placeholder="Hours slept"
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

      {/* 7-day trend */}
      <View>
        <Text style={[s.trendLabel, { color: T.textMuted }]}>
          7-day trend
        </Text>
        <BarChart
          data={week.sleep.map((w) => ({
            label: w.label,
            value: Math.round(w.value * 10),
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