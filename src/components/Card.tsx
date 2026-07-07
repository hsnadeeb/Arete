import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  style?: ViewStyle;
  accentColor?: string;
}

export function Card({ title, children, style, accentColor }: CardProps) {
  return (
    <View style={[styles.card, accentColor ? { borderLeftWidth: 3, borderLeftColor: accentColor } : undefined, style]}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {children}
    </View>
  );
}

export function MetricTile({ label, value, unit, color }: { label: string; value: string | number; unit?: string; color?: string }) {
  return (
    <View style={styles.tile}>
      <Text style={[styles.tileValue, color ? { color } : undefined]}>{value}</Text>
      {unit ? <Text style={styles.tileUnit}>{unit}</Text> : null}
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

export function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowContent}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#efefef',
    marginBottom: 12,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9b9a97',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 12,
  },
  tile: {
    alignItems: 'center',
    gap: 2,
  },
  tileValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#37352f',
    letterSpacing: -0.3,
  },
  tileUnit: {
    fontSize: 12,
    color: '#9b9a97',
    marginTop: -2,
  },
  tileLabel: {
    fontSize: 11,
    color: '#9b9a97',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  rowLabel: {
    fontSize: 13,
    color: '#37352f',
    fontWeight: '500',
    width: 100,
  },
  rowContent: {
    flex: 1,
  },
});
