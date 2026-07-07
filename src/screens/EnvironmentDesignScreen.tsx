import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import { useHasan } from '../data/context';
import { Section, EnvPrinciple, ImprovementText, ProgressBar, getScoreColor } from '../components/Scores';

export default function EnvironmentDesignScreen() {
  const { data: d } = useHasan();

  return (
    <ScreenWrapper
      title="Environment Design"
      icon="🏠"
      subtitle={`Score: ${d.environmentScore}/100 · "Your environment is more powerful than your willpower."`}
    >
      {/* The 4 Laws */}
      <View style={[styles.infoCallout, { backgroundColor: '#e0f2fe', borderLeftColor: '#0ea5e9' }]}>
        <Text style={{ fontSize: 16 }}>🏗️</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '600', fontSize: 13, color: '#37352f' }}>
            The 4 Laws of Behavior Change (inverse for bad habits):
          </Text>
          <Text style={{ fontSize: 12, color: '#37352f', marginTop: 2 }}>
            Make good habits: Obvious → Attractive → Easy → Satisfying{'\n'}
            Make bad habits: Invisible → Unattractive → Difficult → Unsatisfying
          </Text>
        </View>
      </View>

      {/* Environment Audit */}
      <Section title="📋 Environment Audit">
        {d.environmentAudit.map((p, i) => (
          <View key={i}>
            <View style={styles.envPrinciple}>
              <Text style={styles.envName}>{p.principle}</Text>
              <Text style={[styles.envScore, { color: getScoreColor(p.score) }]}>{p.score}%</Text>
              <ProgressBar progress={p.score} color={getScoreColor(p.score)} height={4} style={{ flex: 1 }} />
            </View>
            {p.improvements.map((imp, j) => (
              <ImprovementText key={j} text={imp} />
            ))}
          </View>
        ))}
      </Section>

      {/* Design Principle */}
      <View style={[styles.infoCallout, { backgroundColor: '#f7f6f3', borderLeftColor: '#0b6bcf' }]}>
        <Text style={{ fontSize: 16 }}>💡</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '500', fontSize: 13, color: '#37352f' }}>
            Design principle: Don't rely on memory or motivation. Redesign your environment so the right behavior is the path of least resistance.
          </Text>
          <Text style={{ fontSize: 11, color: '#9b9a97', marginTop: 4 }}>
            Examples: Gym bag where you'll trip over it · Phone charger in living room · Healthy food at eye level
          </Text>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  infoCallout: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: 6,
    borderLeftWidth: 4,
    marginBottom: 12,
  },
  envPrinciple: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0ee',
  },
  envName: { flex: 1, fontSize: 12, fontWeight: '500', color: '#37352f' },
  envScore: { fontSize: 13, fontWeight: '700', width: 36, textAlign: 'center' },
});
