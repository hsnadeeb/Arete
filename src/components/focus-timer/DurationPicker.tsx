import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Animated, Easing, StyleSheet } from "react-native";
import { TYPOGRAPHY } from "../../constants/typography";

interface DurationOption {
  label: string;
  value: number;
}

interface DurationPickerProps {
  durations: readonly DurationOption[];
  selected: number;
  onSelect: (value: number) => void;
  colors: {
    accentBg: string;
    bgSecondary: string;
    accent: string;
    borderLight: string;
    textTertiary: string;
  };
}

function DurationChip({
  label,
  selected,
  onPress,
  colors,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  colors: DurationPickerProps["colors"];
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const bgAnim = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(bgAnim, {
      toValue: selected ? 1 : 0,
      friction: 6,
      tension: 100,
      useNativeDriver: false,
    }).start();
  }, [selected]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.92,
        duration: 80,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 4,
        tension: 200,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  const bgColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.bgSecondary, colors.accentBg],
  });

  const borderColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.borderLight, colors.accent],
  });

  const textColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.textTertiary, colors.accent],
  });

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
      <Animated.View
        style={[
          styles.durChip,
          {
            backgroundColor: bgColor,
            borderColor: borderColor,
            transform: [{ scale }],
          },
        ]}
      >
        <Animated.Text
          style={[
            styles.durChipText,
            {
              color: textColor,
              fontWeight: selected ? "700" : "500",
            },
          ]}
        >
          {label}
        </Animated.Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export function DurationPicker({
  durations,
  selected,
  onSelect,
  colors,
}: DurationPickerProps) {
  return (
    <View style={styles.headerCenter}>
      {durations.map((d) => (
        <DurationChip
          key={d.value}
          label={d.label}
          selected={selected === d.value}
          onPress={() => onSelect(d.value)}
          colors={colors}
        />
      ))}
    </View>
  );
}

export function FocusHeader({
  onBack,
  children,
  colors,
}: {
  onBack: () => void;
  children: React.ReactNode;
  colors: { divider: string };
}) {
  return (
    <View style={[styles.header, { borderBottomColor: colors.divider }]}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Text style={{ color: "transparent" }}> </Text>
      </TouchableOpacity>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 52,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  durChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  durChipText: { ...TYPOGRAPHY.bodySm },
});
