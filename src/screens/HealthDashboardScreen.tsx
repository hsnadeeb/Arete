import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import { useHasan } from '../data/context';
import { Section, Callout, MetricCard, StatItem, ChartBars, SimpleBarChart, TwoCol, ProgressBar } from '../components/Scores';

export default function HealthDashboardScreen() {
  const { data: d } = useHasan();
  const ch = d.clinicalHealth;

  return (
    <ScreenWrapper
      title="Health Dashboard"
      icon="🏥"
      subtitle={`Score: ${d.healthScore}/100 · Target: 85 · Clinical Score: ${ch.prediabetes.progressScore}/100`}
    >
      {/* Metrics Row */}
      <View style={styles.metricsRow}>
        <MetricCard label="Weight" value={`${d.measurements.current.weight}kg`} trend="▼ -0.8" trendColor="#0a8c2e" />
        <MetricCard
          label="BP"
          value={`${ch.bloodPressure.systolic}/${ch.bloodPressure.diastolic}`}
          trend="▼ -2"
          trendColor="#0a8c2e"
          style={{ fontSize: 20 }}
        />
        <MetricCard label="HbA1c" value={`${ch.prediabetes.hba1c.current}%`} trend={`Target: ${ch.prediabetes.hba1c.target}%`} trendColor="#d9730d" />
        <MetricCard label="Glucose" value={`${ch.prediabetes.fastingGlucose.current}mg/dL`} trend="▼ -5pts" trendColor="#0a8c2e" />
      </View>

      <TwoCol>
        {/* Left */}
        <View style={{ flex: 1 }}>
          {/* Weight Trend */}
          <Section title="📊 Weight Trend">
            <View style={[styles.chartHost, { height: 120 }]}>
              {d.healthTrend.map((m, i) => {
                const vals = d.healthTrend.map(x => x.weight);
                const range = Math.max(...vals) - Math.min(...vals) || 1;
                const h = ((m.weight - Math.min(...vals)) / range) * 100;
                return (
                  <View key={i} style={styles.chartGroup}>
                    <View style={[styles.chartBar, { height: `${100 - h}%`, backgroundColor: '#e03e3e', maxWidth: 30 }]}>
                      <Text style={styles.chartBarValue}>{m.weight}</Text>
                    </View>
                    <Text style={styles.chartBarLabel}>{m.month}</Text>
                  </View>
                );
              })}
            </View>
          </Section>

          {/* BP Trend */}
          <Section title="💉 BP Trend">
            <View style={[styles.chartHost, { height: 110 }]}>
              {d.healthTrend.map((m, i) => {
                const vals = d.healthTrend.map(x => x.bp);
                const range = Math.max(...vals) - Math.min(...vals) || 1;
                const h = ((m.bp - Math.min(...vals)) / range) * 100;
                return (
                  <View key={i} style={styles.chartGroup}>
                    <View style={[styles.chartBar, { height: `${100 - h}%`, backgroundColor: '#0b6bcf', maxWidth: 30 }]}>
                      <Text style={styles.chartBarValue}>{m.bp}</Text>
                    </View>
                    <Text style={styles.chartBarLabel}>{m.month}</Text>
                  </View>
                );
              })}
            </View>
            <Text style={{ fontSize: 10, color: '#b3b3af', textAlign: 'center', marginTop: 4 }}>
              Systolic · Target: &lt;120
            </Text>
          </Section>

          {/* Strength */}
          <Section title="💪 Strength">
            <View style={styles.table}>
              <View style={styles.tableRow}>
                <Text style={[styles.tableHeader, { flex: 2 }]}>Exercise</Text>
                <Text style={styles.tableHeader}>Start</Text>
                <Text style={styles.tableHeader}>Current</Text>
                <Text style={styles.tableHeader}>Gain</Text>
              </View>
              {d.strengthProgression.map((s, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2, fontWeight: '500' }]}>{s.exercise}</Text>
                  <Text style={styles.tableCell}>{s.start} kg</Text>
                  <Text style={styles.tableCell}>{s.current} kg</Text>
                  <Text style={[styles.tableCell, { color: '#0a8c2e' }]}>{s.gain}</Text>
                </View>
              ))}
            </View>
          </Section>
        </View>

        {/* Right */}
        <View style={{ flex: 1 }}>
          {/* Body Measurements */}
          <Section title="📏 Body Measurements">
            <View style={styles.table}>
              <View style={styles.tableRow}>
                <Text style={[styles.tableHeader, { flex: 2 }]}>Measure</Text>
                <Text style={styles.tableHeader}>Start</Text>
                <Text style={styles.tableHeader}>Current</Text>
                <Text style={styles.tableHeader}>Change</Text>
              </View>
              {Object.entries(d.measurements.start).map(([measure, val]) => {
                const cur = d.measurements.current[measure];
                const chg = d.measurements.changes[measure];
                const label = measure === 'bodyFat' ? 'Body Fat %' : measure === 'bmi' ? 'BMI' : measure.charAt(0).toUpperCase() + measure.slice(1);
                return (
                  <View key={measure} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { flex: 2, fontWeight: '500' }]}>{label}</Text>
                    <Text style={styles.tableCell}>{val}</Text>
                    <Text style={styles.tableCell}>{cur}</Text>
                    <Text style={[styles.tableCell, { color: chg < 0 ? '#0a8c2e' : '#e03e3e' }]}>
                      {chg > 0 ? '+' : ''}{chg}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Section>

          {/* Workout Volume */}
          <Section title="📈 Workout Volume (weekly kg)">
            <View style={[styles.chartHost, { height: 90, gap: 4 }]}>
              {d.workoutVolume.map(w => {
                const maxV = Math.max(...d.workoutVolume.map(x => x.volume));
                const h = (w.volume / maxV) * 100;
                return (
                  <View key={w.week} style={styles.chartGroup}>
                    <View style={[styles.chartBar, { height: `${h}%`, backgroundColor: '#22c55e', maxWidth: 20 }]}>
                      <Text style={styles.chartBarValue}>{(w.volume / 1000).toFixed(0)}k</Text>
                    </View>
                    <Text style={styles.chartBarLabel}>{w.week}</Text>
                  </View>
                );
              })}
            </View>
          </Section>

          {/* Recommendations */}
          <Section title="🚨 Recommendations">
            <View style={[styles.alertCard, { backgroundColor: '#fffbeb', borderLeftColor: '#f59e0b' }]}>
              <Text style={{ fontSize: 16 }}>⚠️</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: '#37352f' }}>
                  BP elevated · DASH diet adherence at {ch.bloodPressure.dashDietAdherence}% — increase potassium & reduce sodium
                </Text>
              </View>
            </View>
            <View style={[styles.alertCard, { backgroundColor: '#fffbeb', borderLeftColor: '#f59e0b' }]}>
              <Text style={{ fontSize: 16 }}>⚠️</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: '#37352f' }}>
                  Sleep below 7.5h on 4/7 days · Gluco-regulation improves with sleep quality
                </Text>
              </View>
            </View>
            <View style={[styles.alertCard, { backgroundColor: '#f0fdf4', borderLeftColor: '#22c55e' }]}>
              <Text style={{ fontSize: 16 }}>✅</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: '#37352f' }}>
                  Weight trending down · 72% toward 5-7% body weight target for prediabetes reversal
                </Text>
              </View>
            </View>
          </Section>
        </View>
      </TwoCol>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 8,
  },
  chartHost: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    paddingVertical: 8,
  },
  chartGroup: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  chartBar: {
    width: '80%',
    borderRadius: 3,
    justifyContent: 'flex-start',
    alignItems: 'center',
    minHeight: 4,
    position: 'relative',
  },
  chartBarValue: {
    position: 'absolute',
    top: -14,
    fontSize: 10,
    color: '#9b9a97',
    fontWeight: '500',
  },
  chartBarLabel: {
    fontSize: 9,
    color: '#b3b3af',
    marginTop: 4,
  },
  table: { marginVertical: 8 },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0ee',
    alignItems: 'center',
  },
  tableHeader: {
    flex: 1,
    fontSize: 10,
    fontWeight: '500',
    color: '#9b9a97',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableCell: {
    flex: 1,
    fontSize: 12,
    color: '#37352f',
  },
  alertCard: {
    flexDirection: 'row',
    gap: 10,
    padding: 10,
    borderRadius: 6,
    marginVertical: 3,
    borderLeftWidth: 3,
  },
});
