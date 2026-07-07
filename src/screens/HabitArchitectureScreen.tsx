import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import { useHasan } from '../data/context';
import { Section, Callout, ProgressBar, TwoCol, NeverMissTwice, TwoMinuteBadge } from '../components/Scores';

export default function HabitArchitectureScreen() {
  const { data: d } = useHasan();

  return (
    <ScreenWrapper
      title="Habit Architecture"
      icon="🏗️"
      subtitle="Built on Fogg B=MAP, Atomic Habits 4 Laws, Implementation Intentions, and the Two-Minute Rule."
    >
      {/* Guiding Principles */}
      <View style={[styles.principlesCard, { backgroundColor: '#fef3c7', borderLeftColor: '#f59e0b' }]}>
        <Text style={{ fontSize: 16 }}>⚙️</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '600', fontSize: 14, color: '#37352f' }}>Guiding Principles:</Text>
          {d.habitArchitecture.guidingPrinciples.map((p, i) => (
            <Text key={i} style={{ fontSize: 11, marginTop: 2, color: '#9b9a97' }}>· {p}</Text>
          ))}
        </View>
      </View>

      {/* The Habit Loop */}
      <Section title="🔄 The Habit Loop">
        <Text style={{ fontSize: 12, color: '#9b9a97', marginBottom: 8 }}>
          Every habit follows: Cue → Craving → Response → Reward. Here's how your habits map:
        </Text>
        <View style={styles.habitLoop}>
          {[
            { step: 'Cue', icon: '🔔', text: 'Make it obvious', color: '#f59e0b' },
            { step: 'Craving', icon: '🔥', text: 'Make it attractive', color: '#e03e3e' },
            { step: 'Response', icon: '⚡', text: 'Make it easy', color: '#0b6bcf' },
            { step: 'Reward', icon: '🎉', text: 'Make it satisfying', color: '#0a8c2e' },
          ].map((h, i) => (
            <View key={i} style={[styles.loopStep, { borderTopColor: h.color }]}>
              <Text style={styles.loopLabel}>{h.step}</Text>
              <Text style={{ fontSize: 18 }}>{h.icon}</Text>
              <Text style={styles.loopText}>{h.text}</Text>
              {i < 3 ? <Text style={styles.loopArrow}>→</Text> : null}
            </View>
          ))}
        </View>
      </Section>

      <TwoCol>
        {/* Left Column */}
        <View style={{ flex: 1 }}>
          {/* Habit Stacks */}
          <Section title="🔗 Habit Stacks">
            <Text style={{ fontSize: 11, color: '#9b9a97', marginBottom: 8 }}>
              After [current habit], I will [new habit].
            </Text>
            {d.habitStacks.filter(s => s.active).map((s, i) => (
              <View key={i} style={styles.stackCard}>
                <Text style={styles.stackFormula}>After {s.anchor} → I will {s.newHabit}</Text>
                <Text style={styles.stackMeta}>
                  Cue: {s.cue} · Location: {s.location} · {s.frequency} · <TwoMinuteBadge text={`+${s.xp} XP`} />
                </Text>
              </View>
            ))}
          </Section>

          {/* Implementation Intentions */}
          <Section title="🎯 Implementation Intentions">
            <Text style={{ fontSize: 11, color: '#9b9a97', marginBottom: 8 }}>
              "When [situation], I will [action]." — Reduces decision latency by up to 2-3x.
            </Text>
            {d.implementationIntentions.map((ii, i) => (
              <View key={i} style={styles.implCard}>
                <Text style={styles.implText}>
                  <Text style={{ color: '#e03e3e' }}>When </Text>
                  {ii.situation}, <Text style={{ color: '#0b6bcf' }}>I will </Text>
                  {ii.action}
                </Text>
                <Text style={styles.implMeta}>
                  Because {ii.because} · Success: {ii.success}/{ii.attempts} ({Math.round(ii.success / ii.attempts * 100)}%)
                </Text>
              </View>
            ))}
          </Section>
        </View>

        {/* Right Column */}
        <View style={{ flex: 1 }}>
          {/* Temptation Bundling */}
          <Section title="🔄 Temptation Bundling">
            <Text style={{ fontSize: 11, color: '#9b9a97', marginBottom: 8 }}>
              Pair something you WANT with something you NEED.
            </Text>
            {d.temptationBundles.map((b, i) => (
              <View key={i} style={styles.bundleCard}>
                <Text style={styles.bundleFormula}>
                  <Text style={{ color: '#e03e3e', fontWeight: '500' }}>Want: {b.want}</Text>
                  <Text style={{ color: '#b3b3af' }}> + </Text>
                  <Text style={{ color: '#0b6bcf', fontWeight: '500' }}>Need: {b.need}</Text>
                  <Text style={{ color: '#b3b3af' }}> = </Text>
                  <Text style={{ color: '#0a8c2e', fontWeight: '500' }}>{b.bundle}</Text>
                </Text>
                <Text style={{ fontSize: 11, color: '#9b9a97', marginTop: 6 }}>Adherence: <Text style={{ fontWeight: '600' }}>{b.adherence}%</Text></Text>
                <ProgressBar progress={b.adherence} color="#0ea5e9" />
              </View>
            ))}
          </Section>

          {/* Two-Minute Rule */}
          <Section title="⏱️ Two-Minute Rule">
            <Text style={{ fontSize: 11, color: '#9b9a97', marginBottom: 8 }}>
              Every habit has a two-minute version. Master the art of showing up.
            </Text>
            <View style={[styles.principlesCard, { backgroundColor: '#ecfdf5', borderLeftColor: '#10b981' }]}>
              <Text style={{ fontSize: 16 }}>⏱️</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '600', fontSize: 13, color: '#37352f' }}>
                  When motivation is low, do the two-minute version:
                </Text>
                {d.dailyQuests.slice(0, 6).map((q, i) => (
                  <Text key={i} style={{ fontSize: 11, marginTop: 2, color: '#9b9a97' }}>
                    · {q.name} → <TwoMinuteBadge text={q.twoMinuteVersion} />
                  </Text>
                ))}
              </View>
            </View>
          </Section>

          {/* Never Miss Twice */}
          <Section title="🛡️ Never Miss Twice">
            <NeverMissTwice
              principle="Never Miss Twice"
              rule={d.relapsePrevention.neverMissTwice.rule}
              emergencyProtocol={d.relapsePrevention.neverMissTwice.emergencyProtocol}
            />
          </Section>
        </View>
      </TwoCol>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  principlesCard: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: 6,
    borderLeftWidth: 4,
    marginBottom: 8,
  },
  habitLoop: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 8,
  },
  loopStep: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f7f6f3',
    borderRadius: 6,
    borderTopWidth: 3,
    position: 'relative',
  },
  loopLabel: { fontSize: 9, textTransform: 'uppercase', color: '#9b9a97', fontWeight: '600', marginBottom: 2 },
  loopText: { fontSize: 10, textAlign: 'center', lineHeight: 14, marginTop: 2 },
  loopArrow: { position: 'absolute', right: -6, top: '50%', color: '#b3b3af', fontSize: 12 },
  stackCard: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#e9e9e7',
    borderRadius: 10,
    marginVertical: 4,
    backgroundColor: '#ffffff',
  },
  stackFormula: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#0b6bcf',
    marginBottom: 6,
    padding: 6,
    backgroundColor: '#e8f0fe',
    borderRadius: 4,
    overflow: 'hidden',
  },
  stackMeta: { fontSize: 12, color: '#9b9a97' },
  implCard: {
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#8b5cf6',
    backgroundColor: '#f5f3ff',
    borderRadius: 6,
    marginVertical: 4,
  },
  implText: { fontFamily: 'monospace', fontSize: 12, fontWeight: '500', color: '#37352f' },
  implMeta: { fontSize: 10, color: '#9b9a97', marginTop: 4 },
  bundleCard: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#e9e9e7',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#0ea5e9',
    marginVertical: 4,
  },
  bundleFormula: { fontFamily: 'monospace', fontSize: 11, lineHeight: 18 },
});
