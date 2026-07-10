import React, { useRef, useEffect } from "react";
import { View, Text, Animated } from "react-native";
import { Icon } from "../../components/Icons";
import type { LucideIconName } from "../../constants/typography";
import { trackerStyles as s } from "./styles";

interface SparkData {
  values: number[];
  color: string;
}

interface Props {
  icon: LucideIconName;
  iconColor: string;
  label: string;
  value: string;
  valueColor: string;
  spark?: SparkData;
  delay?: number;
  surfaceColor: string;
  borderColor: string;
  mutedColor: string;
}

export function AnimatedStatCard({
  icon,
  iconColor,
  label,
  value,
  valueColor,
  spark,
  delay = 0,
  surfaceColor,
  borderColor,
  mutedColor,
}: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, fadeAnim, slideAnim]);

  const max = spark ? Math.max(...spark.values, 1) : 1;

  return (
    <Animated.View
      style={[
        s.statCard,
        {
          backgroundColor: surfaceColor,
          borderColor,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={[s.statIconWrap, { backgroundColor: iconColor + "18" }]}>
        <Icon name={icon} size={20} color={iconColor} />
      </View>

      <View style={s.statData}>
        <Text style={[s.statLabel, { color: mutedColor }]}>{label}</Text>
        <Text style={[s.statVal, { color: valueColor }]}>{value}</Text>
      </View>

      {spark && spark.values.length > 0 && (
        <View style={s.miniSparkline}>
          {spark.values.map((v, i) => (
            <View
              key={i}
              style={[
                s.sparkBar,
                {
                  height: Math.max(4, (v / max) * 28),
                  backgroundColor: spark.color,
                  opacity: 0.2 + (v / max) * 0.8,
                },
              ]}
            />
          ))}
        </View>
      )}
    </Animated.View>
  );
}
