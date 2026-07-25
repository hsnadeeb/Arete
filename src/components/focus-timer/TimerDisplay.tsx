import React, { useEffect, useRef } from "react";
import { View, Text, Animated, Easing, StyleSheet } from "react-native";
import { TYPOGRAPHY } from "../../constants/typography";

interface TimerDisplayProps {
  min: number;
  sec: number;
  done: boolean;
  running: boolean;
  colors: { success: string; heading: string; textTertiary: string };
}

export function TimerDisplay({ min, sec, done, running, colors }: TimerDisplayProps) {
  const pulse = useRef(new Animated.Value(1)).current;
  const labelOpacity = useRef(new Animated.Value(0)).current;
  const colorTrans = useRef(new Animated.Value(done ? 1 : 0)).current;

  const label = done ? "Well done!" : running ? "Stay focused" : "Press start";

  useEffect(() => {
    if (running) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 0.96,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
    Animated.timing(pulse, {
      toValue: 1, duration: 300, useNativeDriver: true,
    }).start();
  }, [running]);

  useEffect(() => {
    Animated.timing(colorTrans, {
      toValue: done ? 1 : 0,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [done]);

  useEffect(() => {
    labelOpacity.setValue(0);
    Animated.timing(labelOpacity, {
      toValue: 1,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [label]);

  const timerColor = colorTrans.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.heading, colors.success],
  });

  return (
    <View style={styles.timerSection}>
      <Animated.View style={{ transform: [{ scale: pulse }] }}>
        <Animated.Text
          style={[
            styles.timerText,
            { color: timerColor },
          ]}
        >
          {String(min).padStart(2, "0")}:{String(sec).padStart(2, "0")}
        </Animated.Text>
      </Animated.View>
      <Animated.Text
        style={[
          styles.timerLabel,
          { color: colors.textTertiary, opacity: labelOpacity },
        ]}
      >
        {label}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  timerSection: { alignItems: "center", marginBottom: 16 },
  timerText: { ...TYPOGRAPHY.monoLg, fontSize: 32 },
  timerLabel: { ...TYPOGRAPHY.label, marginTop: 4 },
});
