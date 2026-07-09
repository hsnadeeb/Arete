import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

// ═══════════════════════════════════════════
// 7-Day Bar Chart — plain RN, no lib
// ═══════════════════════════════════════════

interface BarData {
  label: string;
  value: number;
  maxValue?: number;
  color?: string;
}

export function BarChart({
  data,
  height = 120,
  barWidth = 28,
  barRadius = 6,
  showLabels = true,
  showValues = true,
  accentColor = "#6366f1",
  emptyText = "No data",
}: {
  data: BarData[];
  height?: number;
  barWidth?: number;
  barRadius?: number;
  showLabels?: boolean;
  showValues?: boolean;
  accentColor?: string;
  emptyText?: string;
}) {
  const max = useMemo(() => Math.max(...data.map((d) => d.value), 1), [data]);

  if (!data || data.length === 0) {
    return (
      <View style={{ height, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: "#9ca3af", fontSize: 13 }}>{emptyText}</Text>
      </View>
    );
  }

  return (
    <View style={styles.barChart}>
      <View style={[styles.barRow, { height }]}>
        {data.map((d, i) => {
          const pct = max > 0 ? (d.value / max) * 100 : 0;
          const barH = Math.max((pct / 100) * height, 4);
          return (
            <View key={i} style={styles.barCol}>
              {showValues && (
                <Text
                  style={[styles.barValue, { color: d.color || accentColor }]}
                >
                  {formatNum(d.value)}
                </Text>
              )}
              <View
                style={[
                  styles.bar,
                  {
                    height: barH,
                    backgroundColor: d.color || accentColor,
                    borderTopLeftRadius: barRadius,
                    borderTopRightRadius: barRadius,
                    width: barWidth,
                  },
                ]}
              />
              {showLabels && <Text style={styles.barLabel}>{d.label}</Text>}
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════
// Progress Ring (circular)
// ═══════════════════════════════════════════

export function ProgressRing({
  value,
  max,
  size = 80,
  strokeWidth = 8,
  color = "#6366f1",
  bgColor = "#e5e7eb",
  label = "",
  onPress,
}: {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  label?: string;
  onPress?: () => void;
}) {
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const halfSize = size / 2;
  // The arc: rotate by (pct * 360) degrees
  const rotation = pct * 360;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.ringContainer, { width: size, height: size }]}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: halfSize,
          backgroundColor: bgColor,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* Arc — only show pct% of circle by splitting border into 4 */}
        <View
          style={{
            position: "absolute",
            width: size,
            height: size,
            borderRadius: halfSize,
            borderWidth: strokeWidth,
            borderColor: "transparent",
            borderTopColor: color,
            transform: [{ rotate: `${rotation}deg` }],
          }}
        />
        {/* Background fill (shows the missing portion behind) */}
        <View
          style={{
            position: "absolute",
            width: size,
            height: size,
            borderRadius: halfSize,
            borderWidth: strokeWidth,
            borderColor: bgColor,
          }}
        />
        <View style={styles.ringCenter}>
          <Text style={[styles.ringValue, { color }]}>{Math.round(pct)}%</Text>
          {label ? <Text style={styles.ringLabel}>{label}</Text> : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ═══════════════════════════════════════════
// Mini Trend — small vertical dots/lines
// ═══════════════════════════════════════════

export function MiniTrend({
  data,
  height = 40,
  dotSize = 6,
  color = "#6366f1",
}: {
  data: number[];
  height?: number;
  dotSize?: number;
  color?: string;
}) {
  const max = Math.max(...data, 1);
  return (
    <View style={[styles.trendContainer, { height }]}>
      {data.map((v, i) => {
        const pct = max > 0 ? (v / max) * 100 : 0;
        const h = Math.max((pct / 100) * height, dotSize);
        return (
          <View
            key={i}
            style={[
              styles.trendDot,
              {
                width: dotSize,
                height: h,
                backgroundColor: color,
                borderRadius: dotSize / 2,
                minHeight: dotSize,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

// ═══════════════════════════════════════════
// Weekly Comparison (this week vs last)
// ═══════════════════════════════════════════

export function WeekComparison({
  current,
  previous,
  labels,
  color = "#6366f1",
  prevColor = "#9ca3af",
}: {
  current: number[];
  previous: number[];
  labels: string[];
  color?: string;
  prevColor?: string;
}) {
  const max = Math.max(...current, ...previous, 1);
  return (
    <View style={styles.compContainer}>
      {labels.map((l, i) => (
        <View key={i} style={styles.compCol}>
          <Text style={styles.compLabel}>{l}</Text>
          <View style={styles.compStack}>
            <View
              style={[
                styles.compPrevBar,
                {
                  height: max > 0 ? (previous[i] / max) * 32 : 4,
                  backgroundColor: prevColor,
                },
              ]}
            />
            <View
              style={[
                styles.compCurrBar,
                {
                  height: max > 0 ? (current[i] / max) * 32 : 4,
                  backgroundColor: color,
                },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

// ═══════════════════════════════════════════
// Stat Card with mini chart
// ═══════════════════════════════════════════

export function StatCard({
  title,
  value,
  unit,
  trend = [],
  color = "#6366f1",
  icon = "📊",
}: {
  title: string;
  value: string | number;
  unit?: string;
  trend?: number[];
  color?: string;
  icon?: string;
}) {
  return (
    <View style={[styles.statCard]}>
      <View style={styles.statLeft}>
        <View style={[styles.statIconBg, { backgroundColor: color + "20" }]}>
          <Text style={{ fontSize: 18 }}>{icon}</Text>
        </View>
        <View>
          <Text style={styles.statTitle}>{title}</Text>
          <Text style={[styles.statValueText, { color }]}>
            {value}
            {unit ? ` ${unit}` : ""}
          </Text>
        </View>
      </View>
      {trend.length > 0 && <MiniTrend data={trend} color={color} />}
    </View>
  );
}

// ─── Helpers ───

function formatNum(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  if (n >= 100) return n.toFixed(0);
  return n.toFixed(1);
}

// ─── Styles ───

const styles = StyleSheet.create({
  // Bar Chart
  barChart: { marginBottom: 8, paddingTop: 4 },
  barRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
  },
  barCol: { alignItems: "center", paddingHorizontal: 2 },
  bar: { minHeight: 4 },
  barValue: { fontSize: 11, fontWeight: "600" },
  barLabel: { fontSize: 10, color: "#9ca3af", marginTop: 2 },

  // Progress Ring
  ringContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  ringBg: { position: "absolute" },
  ringFill: { position: "absolute", borderColor: "transparent" },
  ringCenter: { position: "absolute", alignItems: "center" },
  ringValue: { fontSize: 16, fontWeight: "700" },
  ringLabel: { fontSize: 10, color: "#9ca3af", marginTop: 2 },

  // Mini Trend
  trendContainer: { flexDirection: "row", alignItems: "flex-end", gap: 3 },
  trendDot: { minWidth: 6 },

  // Week Comparison
  compContainer: { flexDirection: "row", gap: 3 },
  compCol: { flex: 1, alignItems: "center", gap: 2 },
  compLabel: { fontSize: 10, color: "#9ca3af" },
  compStack: { flexDirection: "column", alignItems: "center", gap: 1 },

  // Stat Card
  statCard: {
    flex: 1,
    minWidth: "45%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  statLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  statIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statTitle: { fontSize: 12, color: "#64748b", fontWeight: "500" },
  statValueText: { fontSize: 20, fontWeight: "700", marginTop: 1 },
  compPrevBar: { width: 20, borderRadius: 4 },
  compCurrBar: { width: 20, borderRadius: 4 },
});
