import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import { useHasan } from '../data/context';
import { Section, MetricCard, ChartBars, GLP1Item, GlucoseTip, ProgressBar, TwoCol, GoalItem } from '../components/Scores';

export default function PrediabetesScreen() {
  const { data: d } = useHasan();
  const ch = d.clinicalHealth;

  return (
    <ScreenWrapper
      title="Prediabetes Reversal Plan"
      icon="🩸"
      subtitle={`HbA1c: ${ch.prediabetes.hba1c.current}% → Target: ${ch.prediabetes.hba1c.target}% · ~${ch.prediabetes.monthsToReversal} months at current pace`}
    >
      {/* Metrics */}
      <View style={styles.metricsRow}>
        <MetricCard label="HbA1c" value={`${ch.prediabetes.hba1c.current}%`} trend={ch.prediabetes.hba1c.trend} trendColor="#d9730d" />
        <MetricCard label="Fasting Glucose" value={`${ch.prediabetes.fastingGlucose.current}`} trend={ch.prediabetes.fastingGlucose.trend} trendColor="#d9730d" />
        <MetricCard label="Weight Loss" value="4.8kg" trend="72% toward 5-7% target" trendColor="#0a8c2e" />
        <MetricCard label="Exercise" value="120min" trend="80% of 150min target" trendColor="#d9730d" />
      </View>

      <TwoCol>
        {/* Left */}
        <View style={{ flex: 1 }}>
          {/* HbA1c Trend */}
          <Section title="📈 HbA1c Trend">
            <ChartBars
              data={d.healthTrend.filter(m => m.hba1c)}
              keyExtractor={m => m.month}
              valueExtractor={m => m.hba1c!}
              color="#e03e3e"
              labelExtractor={m => m.month}
              height={90}
              maxWidth={36}
            />
            <Text style={{ fontSize: 10, color: '#b3b3af', textAlign: 'center', marginTop: 4 }}>
              Target: &lt;{ch.prediabetes.hba1c.target}%
            </Text>
          </Section>

          {/* Reversal Checklist */}
          <Section title="📋 Reversal Checklist">
            {ch.prediabetes.reversalStrategies.map((s, i) => {
              const pct = parseInt((s.progress.match(/\d+/)?.[0] || '0').toString());
              return (
                <GoalItem
                  key={i}
                  icon={pct >= 80 ? '✅' : pct >= 50 ? '🔄' : '⏳'}
                  name={s.strategy}
                  meta={s.progress}
                  progress={Math.min(pct, 100)}
                  progressColor={pct >= 80 ? '#0a8c2e' : pct >= 50 ? '#d9730d' : '#e03e3e'}
                />
              );
            })}
          </Section>
        </View>

        {/* Right */}
        <View style={{ flex: 1 }}>
          {/* Glucose Management */}
          <Section title="🔄 Glucose Management">
            {ch.glucoregulation.recommendations.map((r, i) => (
              <GlucoseTip key={i} text={r} />
            ))}
          </Section>

          {/* GLP-1 Boosters */}
          <Section title="🧬 GLP-1 Natural Boosters">
            {ch.glp1NaturalBoosters.boosters.map((b, i) => (
              <GLP1Item key={i} action={b.action} effect={b.glp1Effect} adherence={b.adherence} />
            ))}
          </Section>

          {/* Dawn Phenomenon */}
          <Section title="🧠 Dawn Phenomenon">
            <View style={[styles.infoCallout, { backgroundColor: '#fffbeb', borderLeftColor: '#f59e0b' }]}>
              <Text style={{ fontSize: 16 }}>🌅</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: '#37352f' }}>{ch.glucoregulation.dawnPhenomenon}</Text>
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
  infoCallout: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: 6,
    borderLeftWidth: 3,
    marginVertical: 4,
  },
});
