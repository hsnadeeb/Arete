import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import { useHasan } from '../data/context';
import { Section, HBAR, ProgressBar, PipelineStage, TwoCol, StatusBadge } from '../components/Scores';

export default function CareerDashboardScreen() {
  const { data: d } = useHasan();
  const c = d.career;
  const total = c.pipeline.saved + c.pipeline.applied + c.pipeline.screening + c.pipeline.interview + c.pipeline.offer;
  const conv = total > 0 ? Math.round(c.pipeline.interview / total * 100) : 0;

  return (
    <ScreenWrapper
      title="Career Dashboard"
      icon="💼"
      subtitle={`Score: ${d.careerScore}/100 · Conv: ${conv}% · ${c.learningThisMonth.leetcodeStreak}-day LeetCode streak`}
    >
      {/* Pipeline */}
      <Section title="📋 Pipeline">
        <View style={styles.pipeline}>
          {[
            { label: 'Saved', count: c.pipeline.saved, color: '#64748b' },
            { label: 'Applied', count: c.pipeline.applied, color: '#0b6bcf' },
            { label: 'Screening', count: c.pipeline.screening, color: '#f8a30e' },
            { label: 'Interview', count: c.pipeline.interview, color: '#d9730d' },
            { label: 'Offer', count: c.pipeline.offer, color: '#0a8c2e' },
          ].map((s, i) => (
            <PipelineStage
              key={s.label}
              count={s.count}
              label={s.label}
              color={s.color}
              isLast={i === 4}
            />
          ))}
        </View>
        <View style={styles.pipelineStats}>
          <Text style={{ fontSize: 11, color: '#9b9a97' }}>
            Applied→Interview: <Text style={{ fontWeight: '600', color: '#37352f' }}>{conv}%</Text>
          </Text>
          <Text style={{ fontSize: 11, color: '#9b9a97' }}>
            Interview→Offer: <Text style={{ fontWeight: '600', color: '#37352f' }}>
              {c.pipeline.interview > 0 ? Math.round(c.pipeline.offer / c.pipeline.interview * 100) : 0}%
            </Text>
          </Text>
        </View>
      </Section>

      <TwoCol>
        {/* Left */}
        <View style={{ flex: 1 }}>
          {/* Skills */}
          <Section title="📈 Skills">
            {c.skillLevels.map((s, i) => (
              <HBAR key={i} label={s.name} value={s.level} color={s.color} />
            ))}
          </Section>

          {/* Learning */}
          <Section title="📚 Learning">
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.learnLabel}>Study Hours</Text>
                <Text style={styles.learnValue}>
                  {c.learningThisMonth.studyHours}<Text style={{ fontSize: 13, color: '#9b9a97' }}>/{c.learningThisMonth.studyTarget}h</Text>
                </Text>
                <ProgressBar
                  progress={(c.learningThisMonth.studyHours / c.learningThisMonth.studyTarget) * 100}
                  color="#0b6bcf"
                  height={4}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.learnLabel}>LeetCode</Text>
                <Text style={styles.learnValue}>
                  {c.learningThisMonth.leetcodeSolved}<Text style={{ fontSize: 13, color: '#9b9a97' }}>/{c.learningThisMonth.leetcodeTarget}</Text>
                </Text>
                <ProgressBar
                  progress={(c.learningThisMonth.leetcodeSolved / c.learningThisMonth.leetcodeTarget) * 100}
                  color="#d9730d"
                  height={4}
                />
              </View>
            </View>
          </Section>
        </View>

        {/* Right */}
        <View style={{ flex: 1 }}>
          {/* Applications */}
          <Section title="📋 Applications">
            <View style={styles.table}>
              <View style={styles.tableRow}>
                <Text style={[styles.tableHeader, { flex: 2 }]}>Company</Text>
                <Text style={[styles.tableHeader, { flex: 2 }]}>Status</Text>
                <Text style={styles.tableHeader}>Follow-up</Text>
              </View>
              {c.applications.map((a, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2, fontWeight: '500', color: a.color }]}>{a.company}</Text>
                  <View style={{ flex: 2 }}>
                    <StatusBadge
                      text={a.status}
                      color={a.status.includes('Interview') ? 'blue' : a.status === 'Screening' ? 'yellow' : 'gray'}
                    />
                  </View>
                  <Text style={[styles.tableCell, { color: '#9b9a97', fontSize: 11 }]}>{a.followUp}</Text>
                </View>
              ))}
            </View>
          </Section>

          {/* Upcoming Interviews */}
          {c.upcomingInterviews.length > 0 ? (
            <Section title="⏰ Upcoming Interviews">
              {c.upcomingInterviews.map((inter, i) => (
                <View key={i} style={styles.interviewCard}>
                  <Text style={{ fontSize: 16 }}>📅</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '600', fontSize: 13, color: '#37352f' }}>{inter.company}</Text>
                    <Text style={{ fontSize: 12, color: '#9b9a97' }}>{inter.role}</Text>
                    <Text style={{ fontSize: 11, color: '#0b6bcf', marginTop: 2 }}>{inter.date}</Text>
                  </View>
                </View>
              ))}
            </Section>
          ) : null}
        </View>
      </TwoCol>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  pipeline: {
    flexDirection: 'row',
    gap: 6,
  },
  pipelineStats: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 6,
  },
  learnLabel: { fontSize: 10, color: '#9b9a97', marginTop: 2 },
  learnValue: { fontSize: 16, fontWeight: '600', color: '#37352f', marginBottom: 4 },
  table: { marginVertical: 4 },
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
  tableCell: { flex: 1, fontSize: 12, color: '#37352f' },
  interviewCard: {
    flexDirection: 'row',
    gap: 8,
    padding: 10,
    backgroundColor: '#e8f0fe',
    borderLeftWidth: 3,
    borderLeftColor: '#0b6bcf',
    borderRadius: 6,
    marginVertical: 3,
  },
});
