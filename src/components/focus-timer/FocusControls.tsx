import React, { useRef } from "react";
import { View, Text, TouchableOpacity, Animated, Easing, StyleSheet } from "react-native";
import { Icon } from "../Icons";
import { LUCIDE_ICONS } from "../../constants/typography";

interface FocusControlsProps {
  running: boolean;
  done: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onAddYears?: () => void;
  colors: {
    bgSecondary: string;
    textTertiary: string;
    warningBg: string;
    warning: string;
    successBg: string;
    success: string;
    accentBg: string;
    accent: string;
  };
  doneGlow?: Animated.Value;
  doneScale?: Animated.Value;
}

function PressScale({
  children,
  onPress,
  style,
}: {
  children: React.ReactNode;
  onPress: () => void;
  style?: any;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.88,
        duration: 60,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 4,
        tension: 250,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}

export function FocusControls({
  running,
  done,
  onStart,
  onPause,
  onReset,
  onAddYears,
  colors,
  doneGlow,
  doneScale,
}: FocusControlsProps) {
  const mainBtnGlow = doneGlow?.interpolate
    ? doneGlow.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.9],
      })
    : 0;

  const mainScale = doneScale?.interpolate
    ? doneScale.interpolate({
        inputRange: [0.8, 1.12],
        outputRange: [0.8, 1.12],
      })
    : 1;

  return (
    <View style={styles.controls}>
      <PressScale onPress={onReset} style={[styles.ctrlBtn, { backgroundColor: colors.bgSecondary }]}>
        <Icon name={LUCIDE_ICONS.refreshCw} size={18} color={colors.textTertiary} />
      </PressScale>

      {running ? (
        <PressScale onPress={onPause} style={[styles.mainBtn, { backgroundColor: colors.warningBg }]}>
          <Icon name={LUCIDE_ICONS.pause} size={22} color={colors.warning} />
        </PressScale>
      ) : (
        <PressScale onPress={onStart} style={[
          styles.mainBtn,
          {
            backgroundColor: done ? colors.successBg : colors.accentBg,
            shadowOpacity: mainBtnGlow,
            shadowColor: colors.success,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 0 },
            elevation: 6,
            transform: [{ scale: mainScale }],
          },
        ]}>
          <Icon name={done ? LUCIDE_ICONS.check : LUCIDE_ICONS.play} size={22} color={done ? colors.success : colors.accent} />
        </PressScale>
      )}

      {onAddYears ? (
        <PressScale onPress={onAddYears} style={[styles.ctrlBtn, { backgroundColor: colors.bgSecondary }]}>
          <Text style={[styles.addLabel, { color: colors.textTertiary }]}>+5yr</Text>
        </PressScale>
      ) : (
        <View style={[styles.ctrlBtn, { opacity: 0 }]}>
          <Icon name={LUCIDE_ICONS.refreshCw} size={18} color="transparent" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  controls: { flexDirection: "row", alignItems: "center", gap: 24 },
  ctrlBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  mainBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  addLabel: { fontSize: 11, fontWeight: "600" },
});
