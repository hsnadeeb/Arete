import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import { useHasan } from '../data/context';
import { Section, Callout, SpacedItem, PracticeCard, ProgressBar, TwoCol } from '../components/Scores';

export default function DeliberatePracticeScreen() {
  const { data: d } = useHasan();
  const dp = d.deliberatePractice;

  return (
    <ScreenWrapper
      title="Deliberate Practice & Spaced Repetition"
      icon="🎻"
      subtitle={`Current focus: ${dp.currentFocus} · Skill level: ${dp.skillLevel}/100`}
    >
      <TwoCol>
        {/* Left */}
        <View style={{ flex: 1 }}>
          {/* Current Focus */}
          <Section title="🎯 Current Focus Area">
            <View style={[styles.focusCallout, { backgroundColor: '#e8f0fe', borderLeftColor: '#0b6bcf' }]}>
              <Text style={{ fontSize: 16 }}>🎯</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '600', fontSize: 13, color: '#37352f' }}>{dp.currentFocus}</Text>
                <Text style={{ fontSize: 11, color: '#9b9a97', marginTop: 2 }}>
                  Struggling with: {dp.strugglingWith.join(', ')}
                </Text>
                <Text style={{ fontSize: 11, color: '#0b6bcf', marginTop: 2 }}>
                  Next challenge: {dp.nextChallenge}
                </Text>
              </View>
            </View>
          </Section>

          {/* Practice Sessions */}
          <Section title="📋 Practice Sessions">
            {dp.practiceSessions.map((p, i) => (
              <PracticeCard
                key={i}
                topic={p.topic}
                date={p.date}
                duration={p.duration}
                difficulty={p.difficulty}
                understanding={p.understanding}
              />
            ))}
          </Section>
        </View>

        {/* Right */}
        <View style={{ flex: 1 }}>
          {/* Spaced Repetition Queue */}
          <Section title="🔄 Spaced Repetition Queue">
            {dp.spacedRepetitionReview.map((item, i) => (
              <SpacedItem
                key={i}
                topic={item.topic}
                nextReview={item.nextReview}
                confidence={item.confidence}
              />
            ))}
          </Section>

          {/* Info callout */}
          <View style={[styles.focusCallout, { backgroundColor: '#f5f3ff', borderLeftColor: '#8b5cf6' }]}>
            <Text style={{ fontSize: 16 }}>🧠</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '600', fontSize: 13, color: '#37352f' }}>
                The 85% Rule: You learn best when you succeed about 85% of the time.
              </Text>
              <Text style={{ fontSize: 11, color: '#9b9a97', marginTop: 2 }}>
                If you're finding things too easy, increase difficulty. If you're failing too much, dial it back. Deliberate practice = work at the edge of your ability.
              </Text>
            </View>
          </View>
        </View>
      </TwoCol>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  focusCallout: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: 6,
    borderLeftWidth: 3,
    marginVertical: 4,
  },
});
