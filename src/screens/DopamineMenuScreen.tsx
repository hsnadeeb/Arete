import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import { useHasan } from '../data/context';
import { Section, DopamineItem } from '../components/Scores';

export default function DopamineMenuScreen() {
  const { data: d } = useHasan();

  return (
    <ScreenWrapper
      title="Dopamine Menu"
      icon="⚡"
      subtitle="Healthy rewards & substitution rules. Retrain your dopamine response."
    >
      {/* Info callout */}
      <View style={[styles.infoCallout, { backgroundColor: '#f0fdf4', borderLeftColor: '#22c55e' }]}>
        <Text style={{ fontSize: 16 }}>🧠</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '600', fontSize: 13, color: '#37352f' }}>
            Dopamine scheduling: Dopamine is released in anticipation of reward. By scheduling healthy rewards, you train your brain to crave the right things.
          </Text>
        </View>
      </View>

      <View style={styles.twoCol}>
        {/* Left */}
        <View style={{ flex: 1 }}>
          <Section title="⚡ Fast (1-2 min)">
            <View style={styles.menuGrid}>
              {d.dopamineMenu.fast.map((item, i) => (
                <DopamineItem key={i} icon="⚡" text={item} />
              ))}
            </View>
          </Section>

          <Section title="⏱️ Medium (5-15 min)">
            <View style={styles.menuGrid}>
              {d.dopamineMenu.medium.map((item, i) => (
                <DopamineItem key={i} icon="⏱️" text={item} />
              ))}
            </View>
          </Section>
        </View>

        {/* Right */}
        <View style={{ flex: 1 }}>
          <Section title="🐢 Slow (15+ min)">
            <View style={styles.menuGrid}>
              {d.dopamineMenu.slow.map((item, i) => (
                <DopamineItem key={i} icon="🐢" text={item} />
              ))}
            </View>
          </Section>

          <Section title="🔄 Substitution Rules">
            {d.dopamineMenu.substitutionRules.map((r, i) => (
              <View key={i} style={styles.subCard}>
                <Text style={{ fontSize: 11, color: '#9b9a97' }}>When I crave unhealthy → healthy alternative</Text>
                <Text style={{ fontWeight: '500', fontSize: 12, color: '#37352f', marginTop: 4 }}>{r.when}</Text>
                <Text style={{ color: '#0b6bcf', fontSize: 12, marginTop: 2 }}>→ {r.instead}</Text>
              </View>
            ))}
          </Section>

          {/* Unhealthy dopamine sources */}
          <View style={[styles.infoCallout, { backgroundColor: '#fef2f2', borderLeftColor: '#dc2626' }]}>
            <Text style={{ fontSize: 16 }}>⚠️</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '600', fontSize: 12, color: '#37352f' }}>
                Unhealthy dopamine sources to minimize:
              </Text>
              {d.dopamineMenu.unhealthy.map((u, i) => (
                <Text key={i} style={{ fontSize: 11, color: '#9b9a97', marginTop: 2 }}>· {u}</Text>
              ))}
            </View>
          </View>
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
  twoCol: {
    gap: 16,
  },
  menuGrid: {
    gap: 6,
  },
  subCard: {
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
    backgroundColor: '#f0fdf4',
    borderRadius: 6,
    marginVertical: 4,
  },
});
