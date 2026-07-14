import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { TYPOGRAPHY } from "../constants/typography";

interface CardProps {
  title?: string;
  children?: React.ReactNode;
  style?: ViewStyle;
  titleStyle?: any;
}

export function Card({ title, children, style, titleStyle }: CardProps) {
  return (
    <View style={[styles.card, style]}>
      {title ? <Text style={[styles.title, titleStyle]}>{title}</Text> : null}
      {children}
    </View>
  );
}

export function MetricTile({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: string | number;
  unit?: string;
  color?: string;
}) {
  return (
    <View style={styles.tile}>
      <Text style={[styles.tileValue, color ? { color } : undefined]}>
        {value}
      </Text>
      {unit ? <Text style={styles.tileUnit}>{unit}</Text> : null}
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

export function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowContent}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  title: {
    ...TYPOGRAPHY.title,
    color: "#9b9a97",
    marginBottom: 12,
  },
  tile: {
    alignItems: "center",
    gap: 2,
  },
  tileValue: {
    fontSize: TYPOGRAPHY.h2.fontSize,
    fontWeight: TYPOGRAPHY.h2.fontWeight,
    color: "#37352f",
    letterSpacing: -0.3,
  },
  tileUnit: {
    ...TYPOGRAPHY.caption,
    color: "#9b9a97",
    marginTop: -2,
  },
  tileLabel: {
    ...TYPOGRAPHY.statLabel,
    color: "#9b9a97",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  rowLabel: {
    ...TYPOGRAPHY.bodySm,
    color: "#37352f",
    fontWeight: "500",
    width: 100,
  },
  rowContent: {
    flex: 1,
  },
});
