import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
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

export function DurationPicker({
  durations,
  selected,
  onSelect,
  colors,
}: DurationPickerProps) {
  return (
    <View style={styles.headerCenter}>
      {durations.map((d) => (
        <TouchableOpacity
          key={d.value}
          onPress={() => onSelect(d.value)}
          style={[
            styles.durChip,
            {
              backgroundColor:
                selected === d.value ? colors.accentBg : colors.bgSecondary,
              borderColor:
                selected === d.value ? colors.accent : colors.borderLight,
            },
          ]}
        >
          <Text
            style={[
              styles.durChipText,
              {
                color:
                  selected === d.value ? colors.accent : colors.textTertiary,
                fontWeight: selected === d.value ? "700" : "500",
              },
            ]}
          >
            {d.label}
          </Text>
        </TouchableOpacity>
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
