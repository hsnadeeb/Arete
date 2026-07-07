import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import { useHasan } from '../data/context';
import { Section, MetricCard, DecisionDrainer, DecisionSolution, getScoreColor, TwoCol } from '../components/Scores';

export default function DecisionFatigueScreen() {
  const { data: d } = useHasan();
  const df = d.decisionFatigue;

  return (
    <ScreenWrapper
      title="Decision Fatigue Management"
      icon="🤔"
      subtitle={`Score: ${df.score}/100 · ${df.dailyDecisions} decisions/day · Optimal: ${df.optimalDecisions}`}
    >
      {/* Metrics */}
      <View style={styles.metricsRow}>
        <MetricCard label="Decision Score" value={`${df.score}`} trendColor={getScoreColor(df.score)} />
        <MetricCard
          label="Daily Decisions"
          value={`${df.dailyDecisions}`}
          trend={`Over limit by ${df.dailyDecisions - df.optimalDecisions}`}
          trendColor="#d9730d"
        />
      </View>

      <TwoCol>
        {/* Left */}
        <View style={{ flex: 1 }}>
          <Section title="🔋 Decision Energy Drainers">
            {df.drainers.map((item, i) => (
              <DecisionDrainer key={i} text={item} />
            ))}
          </Section>
        </View>

        {/* Right */}
        <View style={{ flex: 1 }}>
          <Section title="✅ Solutions">
            {df.solutions.map((s, i) => (
              <DecisionSolution key={i} text={s} />
            ))}
          </Section>
        </View>
      </TwoCol>

      {/* Info callout */}
      <View style={[styles.infoCallout, { backgroundColor: '#fef3c7', borderLeftColor: '#f59e0b' }]}>
        <Text style={{ fontSize: 16 }}>💡</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '600', fontSize: 13, color: '#37352f' }}>
            The Science: Decision fatigue depletes willpower. Each decision reduces your ability to make good choices.
          </Text>
          <Text style={{ fontSize: 11, color: '#9b9a97', marginTop: 2 }}>
            Solution: Automate, schedule, and eliminate decisions. "I will do this at this time" removes the choice entirely.
          </Text>
        </View>
      </View>
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
    padding: 14,
    borderRadius: 6,
    borderLeftWidth: 4,
    marginVertical: 12,
  },
});
