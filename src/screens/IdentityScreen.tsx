import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import { useHasan } from '../data/context';
import { Section, Callout, IdentityStatement, ReframeCard } from '../components/Scores';

export default function IdentityScreen() {
  const { data: d } = useHasan();

  return (
    <ScreenWrapper
      title="Identity & Mindset"
      icon="🦋"
      subtitle="Behavioral psychology: Identity-based habits outlast outcome-based motivation."
    >
      {/* Science callout */}
      <View style={[styles.scienceCallout, { backgroundColor: '#eef2ff', borderLeftColor: '#6366f1' }]}>
        <Text style={{ fontSize: 16 }}>📖</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '600', fontSize: 14, color: '#37352f' }}>
            The Science:
          </Text>
          <Text style={{ fontSize: 12, color: '#9b9a97', marginTop: 2 }}>
            Every action is a vote for the type of person you want to become. You don't need to change your identity overnight. You just need to win one vote at a time.
          </Text>
          <Text style={{ fontSize: 11, color: '#9b9a97', marginTop: 4, fontStyle: 'italic' }}>— James Clear, Atomic Habits</Text>
        </View>
      </View>

      {/* Two Column: Identity Shift + Cognitive Dissonance */}
      <View style={styles.twoCol}>
        {/* Left */}
        <View style={{ flex: 1 }}>
          <Section title="🔄 Identity Shift">
            <View style={styles.identityCard}>
              <Text style={{ fontSize: 28 }}>🐛</Text>
              <Text style={styles.idLabel}>Current Identity</Text>
              <Text style={styles.idValue}>"{d.identity.current}"</Text>
              <Text style={{ color: '#0b6bcf', fontSize: 18, marginVertical: 6 }}>↓ becoming ↓</Text>
              <Text style={{ fontSize: 28 }}>🦋</Text>
              <Text style={styles.idLabel}>Target Identity</Text>
              <Text style={styles.idValue}>"{d.identity.target}"</Text>
            </View>
          </Section>

          <Section title="💭 Identity Statements">
            {d.identity.identityStatements.map((s, i) => (
              <IdentityStatement key={i} text={s} />
            ))}
          </Section>
        </View>

        {/* Right */}
        <View style={{ flex: 1 }}>
          <Section title="🧠 Cognitive Dissonance Triggers">
            {d.identity.cognitiveDissonanceTriggers.map((t, i) => (
              <View key={i} style={styles.dissonanceCard}>
                <Text style={{ fontSize: 16 }}>⚠️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontStyle: 'italic', fontSize: 12, color: '#37352f' }}>"{t}"</Text>
                  <Text style={{ fontSize: 11, color: '#9b9a97', marginTop: 2 }}>This tension means growth. Let it guide your next choice.</Text>
                </View>
              </View>
            ))}
          </Section>

          <Section title="🧬 Growth Mindset Reframes">
            {d.growthMindset.reframes.map((r, i) => (
              <ReframeCard key={i} fixed={r.fixed} growth={r.growth} />
            ))}
          </Section>

          <View style={[styles.scienceCallout, { backgroundColor: '#f0fdf4', borderLeftColor: '#22c55e' }]}>
            <Text style={{ fontSize: 16 }}>💪</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontStyle: 'italic', fontSize: 13, color: '#37352f' }}>"{d.growthMindset.effortCelebration}"</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Stages of Change */}
      <Section title="🔄 Stages of Change (Transtheoretical Model)">
        <View style={styles.stagesRow}>
          {Object.entries(d.stagesOfChange).map(([area, stage]) => {
            const bgColors: Record<string, string> = {
              maintenance: '#def7e5', action: '#dbeafe', preparation: '#fef3c7', contemplation: '#fee2e2',
            };
            const textColors: Record<string, string> = {
              maintenance: '#0a8c2e', action: '#0b6bcf', preparation: '#b45309', contemplation: '#991b1b',
            };
            return (
              <View key={area} style={styles.stageItem}>
                <Text style={styles.stageLabel}>{area.charAt(0).toUpperCase() + area.slice(1)}</Text>
                <View style={[styles.stageBadge, { backgroundColor: bgColors[stage] || '#f7f6f3' }]}>
                  <Text style={[styles.stageText, { color: textColors[stage] || '#9b9a97' }]}>
                    {stage.charAt(0).toUpperCase() + stage.slice(1)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </Section>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scienceCallout: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: 6,
    borderLeftWidth: 4,
    marginBottom: 12,
  },
  twoCol: {
    gap: 16,
  },
  identityCard: {
    padding: 16,
    borderWidth: 2,
    borderColor: '#e9e9e7',
    borderStyle: 'dashed',
    borderRadius: 10,
    alignItems: 'center',
  },
  idLabel: { fontSize: 12, color: '#9b9a97', marginTop: 4, marginBottom: 2 },
  idValue: { fontWeight: '600', fontSize: 14, color: '#37352f', textAlign: 'center' },
  dissonanceCard: {
    flexDirection: 'row',
    gap: 10,
    padding: 10,
    backgroundColor: '#fef2f2',
    borderLeftWidth: 3,
    borderLeftColor: '#dc2626',
    borderRadius: 6,
    marginVertical: 3,
  },
  stagesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stageItem: {
    alignItems: 'center',
    width: '18%',
    minWidth: 70,
    marginBottom: 4,
  },
  stageLabel: {
    fontSize: 11,
    color: '#9b9a97',
    fontWeight: '500',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  stageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stageText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
