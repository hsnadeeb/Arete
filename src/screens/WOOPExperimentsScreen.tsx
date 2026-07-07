import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import { useHasan } from '../data/context';
import { Section, Callout, ExperimentCard, TwoCol } from '../components/Scores';

export default function WOOPExperimentsScreen() {
  const { data: d } = useHasan();

  return (
    <ScreenWrapper
      title="WOOP & Experiments"
      icon="🎯"
      subtitle="Wish · Outcome · Obstacle · Plan — plus weekly self-experiments."
    >
      <TwoCol>
        {/* Left */}
        <View style={{ flex: 1 }}>
          {/* Current WOOP */}
          <Section title="🎯 Current WOOP">
            <View style={styles.woopCard}>
              <Text style={styles.woopWish}>✨ Wish: {d.woop.currentWish}</Text>
              <Text style={styles.woopOutcome}>🏆 Best Outcome: {d.woop.outcome}</Text>
              {d.woop.obstacle.map((o, i) => (
                <View key={i} style={styles.woopObstacle}>
                  <Text style={{ fontWeight: '500', fontSize: 12, color: '#37352f' }}>🚧 Obstacle: {o.obstacle}</Text>
                  <Text style={styles.woopPlan}>
                    When <Text style={{ color: '#e03e3e' }}>{o.obstacle}</Text>, I will{' '}
                    <Text style={{ color: '#0b6bcf' }}>{o.plan}</Text>
                  </Text>
                </View>
              ))}
            </View>
          </Section>
        </View>

        {/* Right */}
        <View style={{ flex: 1 }}>
          {/* Behavior Experiments */}
          <Section title="🧪 Weekly Behavior Experiments">
            {d.behaviorExperiments.map((exp, i) => (
              <ExperimentCard
                key={i}
                hypothesis={exp.hypothesis}
                result={exp.result}
                status={exp.status}
              />
            ))}
          </Section>

          {/* Info callout */}
          <View style={[styles.infoCallout, { backgroundColor: '#f7f6f3', borderLeftColor: '#0b6bcf' }]}>
            <Text style={{ fontSize: 16 }}>💡</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '500', fontSize: 13, color: '#37352f' }}>
                Scientific mindset: Treat every week as an experiment. If a strategy fails, it's not a personal failure — it's data. Adjust the variable and try again.
              </Text>
            </View>
          </View>
        </View>
      </TwoCol>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  woopCard: {
    padding: 16,
    backgroundColor: '#fef3c7',
    borderRadius: 10,
    overflow: 'hidden',
  },
  woopWish: {
    fontWeight: '600',
    fontSize: 14,
    color: '#37352f',
  },
  woopOutcome: {
    fontSize: 12,
    color: '#9b9a97',
    marginVertical: 6,
  },
  woopObstacle: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 6,
    marginVertical: 4,
  },
  woopPlan: {
    color: '#0b6bcf',
    fontWeight: '500',
    fontFamily: 'monospace',
    fontSize: 11,
    marginTop: 4,
  },
  infoCallout: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: 6,
    borderLeftWidth: 4,
    marginVertical: 8,
  },
});
