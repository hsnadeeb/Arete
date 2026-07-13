import React from "react";
import { View, Text, TouchableOpacity, Animated, StyleSheet } from "react-native";
import { Icon } from "../Icons";
import { LUCIDE_ICONS } from "../../constants/typography";

interface FocusControlsProps {
  running: boolean;
  done: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onAddTime?: () => void;
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
}

export function FocusControls({
  running,
  done,
  onStart,
  onPause,
  onReset,
  onAddTime,
  colors,
  doneGlow,
}: FocusControlsProps) {
  const mainBtnGlow = doneGlow?.interpolate
    ? doneGlow.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.9],
      })
    : 0;

  return (
    <View style={styles.controls}>
      <TouchableOpacity
        onPress={onReset}
        style={[styles.ctrlBtn, { backgroundColor: colors.bgSecondary }]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Icon
          name={LUCIDE_ICONS.refreshCw}
          size={18}
          color={colors.textTertiary}
        />
      </TouchableOpacity>
      {running ? (
        <TouchableOpacity
          onPress={onPause}
          style={[styles.mainBtn, { backgroundColor: colors.warningBg }]}
        >
          <Icon name={LUCIDE_ICONS.pause} size={22} color={colors.warning} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={onStart} activeOpacity={0.85}>
          <Animated.View
            style={[
              styles.mainBtn,
              {
                backgroundColor: done ? colors.successBg : colors.accentBg,
                shadowOpacity: mainBtnGlow,
                shadowColor: colors.success,
                shadowRadius: 16,
              },
            ]}
          >
            <Icon
              name={done ? LUCIDE_ICONS.check : LUCIDE_ICONS.play}
              size={22}
              color={done ? colors.success : colors.accent}
            />
          </Animated.View>
        </TouchableOpacity>
      )}
      {onAddTime ? (
        <TouchableOpacity
          onPress={onAddTime}
          style={[styles.ctrlBtn, { backgroundColor: colors.bgSecondary }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.addLabel, { color: colors.textTertiary }]}>
            +5m
          </Text>
        </TouchableOpacity>
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
