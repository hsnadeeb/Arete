import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import { useHasan } from '../data/context';
import { Section, Callout, StatItem, ProgressBar, ChronotypeCard, RecoveryActivity, DopamineItem, getScoreColor, TwoCol } from '../components/Scores';

export default function EnergyRecoveryScreen() {
  const { data: d } = useHasan();
  const em = d.energyManagement;
  const sr = d.stressRecovery;

  return (
    <ScreenWrapper
      title="Energy & Recovery"
      icon="🌙"
      subtitle={`Stress: ${sr.currentStress}/10 · Recovery: ${sr.recoveryScore}% · Circadian Alignment: ${em.circadianAlignment.adherence}%`}
    >
      <TwoCol>
        {/* Left */}
        <View style={{ flex: 1 }}>
          {/* Circadian Energy Curve */}
          <Section title="🌞 Circadian Energy Curve">
            <ChronotypeCard chronotype={em.chronotype} />
            <View style={styles.energyCurve}>
              {[
                { label: '6am', h: 30, task: 'Wake' },
                { label: '9am', h: 90, task: 'Deep work' },
                { label: '12pm', h: 70, task: 'Moderate' },
                { label: '3pm', h: 30, task: 'Shallow' },
                { label: '6pm', h: 50, task: 'Moderate' },
                { label: '9pm', h: 75, task: 'Learning' },
                { label: '11pm', h: 10, task: 'Wind down' },
              ].map((e, i) => (
                <View key={i} style={[styles.energyBlock, { height: `${e.h}%`, backgroundColor: e.h > 70 ? '#22c55e' : e.h > 40 ? '#f59e0b' : '#e03e3e' }]}>
                  <Text style={styles.energyTask}>{e.task}</Text>
                  <Text style={styles.energyLabel}>{e.label}</Text>
                </View>
              ))}
            </View>
          </Section>

          {/* Peak Performance Windows */}
          <Section title="⏰ Peak Performance Windows">
            <View style={styles.statsCol}>
              <View style={styles.statBlock}>
                <Text style={styles.statBlockLabel}>🟢 Peak ({em.peakHours.start}-{em.peakHours.end})</Text>
                <Text style={styles.statBlockValue}>{em.peakHours.taskType}</Text>
              </View>
              <View style={styles.statBlock}>
                <Text style={styles.statBlockLabel}>🟡 Dip ({em.dipHours.start}-{em.dipHours.end})</Text>
                <Text style={styles.statBlockValue}>{em.dipHours.taskType}</Text>
              </View>
              <View style={styles.statBlock}>
                <Text style={styles.statBlockLabel}>🔵 Second Wind ({em.secondWind.start}-{em.secondWind.end})</Text>
                <Text style={styles.statBlockValue}>{em.secondWind.taskType}</Text>
              </View>
            </View>
          </Section>
        </View>

        {/* Right */}
        <View style={{ flex: 1 }}>
          {/* Stress-Recovery Balance */}
          <Section title="🧘 Stress-Recovery Balance">
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <StatItem label="Current Stress" value={`${sr.currentStress}/10`} />
              <StatItem label="Recovery Score" value={`${sr.recoveryScore}%`} />
            </View>
            <ProgressBar progress={sr.currentStress * 10} color="#e03e3e" height={10} style={{ marginVertical: 8 }} />
            <Text style={{ fontSize: 11, color: '#9b9a97', marginBottom: 8 }}>Stress level (lower is better)</Text>
            <View style={[styles.infoCallout, { backgroundColor: '#fffbeb', borderLeftColor: '#f59e0b' }]}>
              <Text style={{ fontSize: 16 }}>💡</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '600', fontSize: 12, color: '#37352f' }}>{sr.actionableInsight}</Text>
              </View>
            </View>
          </Section>

          {/* Recovery Activities */}
          <Section title="🌿 Recovery Activities">
            <View style={styles.menuGrid}>
              {sr.recoveryActivities.map((a, i) => (
                <RecoveryActivity key={i} text={a} />
              ))}
            </View>
          </Section>

          {/* Circadian Alignment */}
          <Section title="🌙 Circadian Alignment">
            {Object.entries(em.circadianAlignment)
              .filter(([k]) => k !== 'adherence')
              .map(([k, v]) => (
                <View key={k} style={styles.circRow}>
                  <Text style={styles.circLabel}>{k.replace(/([A-Z])/g, ' $1').trim()}</Text>
                  <Text style={styles.circValue}>{v}</Text>
                </View>
              ))}
            <View style={{ marginTop: 8 }}>
              <Text style={{ fontSize: 11, color: '#9b9a97', marginBottom: 4 }}>
                Adherence: {em.circadianAlignment.adherence}%
              </Text>
              <ProgressBar progress={em.circadianAlignment.adherence} color="#f59e0b" height={6} />
            </View>
          </Section>
        </View>
      </TwoCol>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  energyCurve: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    height: 90,
    paddingVertical: 10,
  },
  energyBlock: {
    flex: 1,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'flex-end',
    minHeight: 10,
  },
  energyTask: {
    fontSize: 7,
    color: '#9b9a97',
    textAlign: 'center',
    paddingHorizontal: 1,
  },
  energyLabel: {
    fontSize: 8,
    color: '#b3b3af',
    marginTop: 3,
  },
  statsCol: {
    gap: 8,
  },
  statBlock: {
    marginVertical: 2,
  },
  statBlockLabel: {
    fontSize: 11,
    color: '#9b9a97',
    fontWeight: '500',
  },
  statBlockValue: {
    fontSize: 13,
    color: '#37352f',
    fontWeight: '500',
    marginTop: 1,
  },
  infoCallout: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: 6,
    borderLeftWidth: 3,
    marginVertical: 4,
  },
  menuGrid: {
    gap: 4,
  },
  circRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0ee',
  },
  circLabel: {
    flex: 1,
    fontSize: 11,
    color: '#37352f',
    textTransform: 'capitalize',
  },
  circValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#37352f',
  },
});
