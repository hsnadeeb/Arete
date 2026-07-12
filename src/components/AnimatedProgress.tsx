import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedProps,
  Easing,
} from "react-native-reanimated";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CircularProgressProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  completedColor?: string;
  bgColor?: string;
  label?: string;
  sublabel?: string;
}

/**
 * Single smooth SVG arc with Reanimated — used by Steps, Sleep, Water trackers.
 * Starts from top (12 o'clock), draws a clean continuous arc to 100%.
 */
export function AnimatedCircularProgress({
  value,
  max,
  size = 130,
  strokeWidth = 12,
  color = "#6366f1",
  completedColor = "#10b981",
  bgColor = "#e5e7eb",
  label = "",
  sublabel,
}: CircularProgressProps) {
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const progress = useSharedValue(pct);
  const isComplete = pct >= 1;
  const currentColor = isComplete ? completedColor : color;

  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const halfSize = size / 2;

  React.useEffect(() => {
    progress.value = withTiming(pct, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, [pct, progress]);

  const animatedProps = useAnimatedProps(() => {
    const p = progress.value;
    const strokeDashoffset = circumference * (1 - p);
    return {
      strokeDashoffset,
    };
  });

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle
          cx={halfSize}
          cy={halfSize}
          r={r}
          stroke={bgColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={halfSize}
          cy={halfSize}
          r={r}
          stroke={currentColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          transform={`rotate(-90 ${halfSize} ${halfSize})`}
        />
      </Svg>

      <View
        style={{
          width: size - strokeWidth * 2,
          height: size - strokeWidth * 2,
          borderRadius: (size - strokeWidth * 2) / 2,
          backgroundColor: "transparent",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={[styles.ringValue, { color: currentColor }]}>
          {Math.round(pct * 100)}%
        </Text>
        {label ? (
          <Text style={[styles.ringLabel, { color: currentColor }]}>{label}</Text>
        ) : null}
        {sublabel ? (
          <Text style={[styles.ringSublabel]}>{sublabel}</Text>
        ) : null}
      </View>
    </View>
  );
}

interface FillingWaveProps {
  value: number;
  max: number;
  height?: number;
  color?: string;
  completedColor?: string;
  bgColor?: string;
}

export function FillingWave({
  value,
  max,
  height = 160,
  color = "#0ea5e9",
  completedColor = "#06b6d4",
  bgColor = "#e0f2fe",
}: FillingWaveProps) {
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const isComplete = pct >= 1;
  const currentColor = isComplete ? completedColor : color;

  return (
    <View
      style={{
        width: "100%",
        height,
        borderRadius: 16,
        backgroundColor: bgColor,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: pct * height,
          backgroundColor: currentColor + "99",
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={[
            styles.waveValue,
            { color: isComplete ? "#fff" : currentColor },
          ]}
        >
          {Math.round(pct * 100)}%
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ringValue: { fontSize: 22, fontWeight: "700" },
  ringLabel: { fontSize: 13, fontWeight: "600", marginTop: 2 },
  ringSublabel: { fontSize: 11, color: "#94a3b8", marginTop: 1 },
  waveValue: { fontSize: 28, fontWeight: "700" },
});