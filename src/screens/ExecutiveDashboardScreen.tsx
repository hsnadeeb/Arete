import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import { useHasan } from '../data/context';
import {
  Section, Callout, ScoreCard, MetricCard, ProgressBar, HBAR, ActivityItem,
  GoalItem, AchievementCard, getScoreColor, TwoCol
} from '../components/Scores';

export default function ExecutiveDashboardScreen() {
  const { data: d } = useHasan();

  return (
    <ScreenWrapper
      title="Executive Dashboard"
      icon="🏢"
      subtitle={`${d.user.title} Lv.${d.user.level} · Day ${d.user.daysTracked} · ${d.user.streak}-day streak`}
    >
      {/* Identity in progress callout */}
      <View style={[styles.idCallout, { backgroundColor: '#eef2ff', borderLeftColor: '#6366f1' }]}>
        <Text style={{ fontSize: 16, lineHeight: 20 }}>🦋</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '600', fontSize: 14, color: '#37352f' }}>
            Identity in progress: <Text style={{ color: '#37352f' }}>"{d.identity.current}"</Text> → <Text style={{ fontWeight: '600' }}>"{d.identity.target}"</Text>
          </Text>
          <Text style={{ fontSize: 12, color: '#9b9a97', marginTop: 2 }}>
            Every action is a vote for the person you want to become.
          </Text>
        </View>
      </View>

      {/* Metrics Row */}
      <View style={styles.metricsRow}>
        {[
          { label: 'Health', value: d.healthScore },
          { label: 'Clinical', value: d.clinicalHealth.prediabetes.progressScore },
          { label: 'Career', value: d.careerScore },
          { label: 'Finance', value: d.financeScore },
          { label: 'Spiritual', value: d.spiritualScore },
          { label: 'Environment', value: d.environmentScore },
        ].map(m => (
          <View key={m.label} style={styles.metricCard}>
            <Text style={styles.metricLabel}>{m.label}</Text>
            <Text style={[styles.metricValue, { color: getScoreColor(m.value) }]}>
              {m.value}<Text style={{ fontSize: 12, color: '#9b9a97' }}>/100</Text>
            </Text>
            <ProgressBar progress={m.value} color={getScoreColor(m.value)} height={6} style={{ width: '100%', marginTop: 4 }} />
          </View>
        ))}
      </View>

      <TwoCol>
        {/* Left Column */}
        <View style={{ flex: 1 }}>
          {/* Identity-Based Goals */}
          <Section title="🎯 Identity-Based Goals">
          {d.identityBasedGoals.flatMap((g, gi) =>
            g.goals.map((gg, i) => (
              <GoalItem
                key={`${gi}-${i}`}
                icon="🦋"
                name={gg.name}
                meta={`${g.identity} · Stage: ${gg.stage}`}
                progress={gg.progress}
              />
            ))
          )}
          </Section>

          {/* Fogg Behavior Model */}
          <Section title="🧬 Behavior Model Audit (Fogg B=MAP)">
            <View style={styles.foggRow}>
              {[
                { label: 'Motivation', value: d.foggBehaviorModel.motivation.current, target: d.foggBehaviorModel.motivation.target, color: '#f59e0b' },
                { label: 'Ability', value: d.foggBehaviorModel.ability.current, target: d.foggBehaviorModel.ability.target, color: '#0b6bcf' },
                { label: 'Prompt', value: d.foggBehaviorModel.prompts.current, target: d.foggBehaviorModel.prompts.target, color: '#8b5cf6' },
              ].map(m => (
                <View key={m.label} style={[styles.foggCard, { borderLeftColor: m.color }]}>
                  <Text style={styles.foggLabel}>{m.label}</Text>
                  <Text style={[styles.foggValue, { color: m.color }]}>
                    {m.value}<Text style={{ fontSize: 13, color: '#9b9a97' }}>/10</Text>
                  </Text>
                  <Text style={styles.foggTarget}>Target: {m.target} · Gap: {m.target - m.value}</Text>
                </View>
              ))}
            </View>
          </Section>

          {/* Clinical Alerts */}
          <Section title="🚨 Clinical Alerts">
            {[
              { icon: '🩸', title: `Prediabetes (HbA1c: ${d.clinicalHealth.prediabetes.hba1c.current})`, desc: `${d.clinicalHealth.prediabetes.monthsToReversal} months to reversal at current pace. Prioritize sugar reduction & fiber.` },
              { icon: '💉', title: `BP Elevated (${d.clinicalHealth.bloodPressure.systolic}/${d.clinicalHealth.bloodPressure.diastolic})`, desc: `${d.clinicalHealth.continuousImprovement.criteriaMet}/3 metabolic syndrome criteria met. Urgent lifestyle intervention.` },
              { icon: '🧬', title: 'NAFLD (Mild)', desc: `ALT 45, reversal probability ${d.clinicalHealth.liverHealth.reversalProbability}% — continue coffee, omega-3, exercise.` },
              { icon: '🧠', title: 'Stress-recovery balance', desc: `${d.stressRecovery.currentStress}/10 stress · Recovery score ${d.stressRecovery.recoveryScore}% — add recovery activity daily.` },
              { icon: '✅', title: 'Weight trending down', desc: `-0.8kg this month · 4.8kg total · 72% toward 5-7% body weight target for prediabetes reversal.` },
            ].map((a, i) => (
              <View key={i} style={[
                styles.alertCard,
                i === 4 ? { backgroundColor: '#f0fdf4', borderLeftColor: '#22c55e' } : { backgroundColor: '#fffbeb', borderLeftColor: '#f59e0b' },
              ]}>
                <Text style={{ fontSize: 16 }}>{a.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '600', fontSize: 13, color: '#37352f' }}>{a.title}</Text>
                  <Text style={{ fontSize: 12, color: '#9b9a97', marginTop: 1 }}>{a.desc}</Text>
                </View>
              </View>
            ))}
          </Section>
        </View>

        {/* Right Column */}
        <View style={{ flex: 1 }}>
          {/* Weekly Score */}
          <Section title="📈 Weekly Score">
            <View style={styles.weekGrid}>
              {d.weeklySchedule.map(day => (
                <View key={day.day} style={styles.weekDay}>
                  <Text style={styles.weekDayLabel}>{day.day}</Text>
                  <Text style={styles.weekDayScore}>{day.score}</Text>
                  <Text style={{ fontSize: 14 }}>{day.status}</Text>
                </View>
              ))}
            </View>
          </Section>

          {/* Scientific Adherence Scores */}
          <Section title="⚡ Scientific Adherence Scores">
            <HBAR label="Habit Architecture" value={d.dailyStats.habitArchitectureScore} color="#6366f1" />
            <HBAR label="Environment Design" value={d.environmentScore} color="#0ea5e9" />
            <HBAR label="Circadian Alignment" value={d.dailyStats.energyAlignmentScore} color="#f59e0b" />
            <HBAR label="Stress-Recovery" value={d.stressRecovery.recoveryScore} color="#8b5cf6" />
            <HBAR label="Decision Energy" value={d.dailyStats.decisionFatigueScore} color="#e03e3e" />
          </Section>

          {/* Recent Activity */}
          <Section title="⚡ Recent Activity">
            {d.recentActivity.map((a, i) => (
              <ActivityItem key={i} icon={a.icon} text={a.text} time={a.time} />
            ))}
          </Section>

          {/* Achievements */}
          <Section title="🏆 Achievements">
            <View style={styles.achGrid}>
              {d.achievements.slice(0, 4).map((a, i) => (
                <AchievementCard
                  key={i}
                  icon={a.icon}
                  name={a.name}
                  description={a.description}
                  unlocked={a.unlocked}
                  progress={a.progress}
                />
              ))}
            </View>
          </Section>

          {/* Lifetime Stats */}
          <Section title="📊 Lifetime Stats">
            <View style={styles.statsRow}>
              <View style={styles.statItem}><Text style={styles.statLabel}>Days Tracked</Text><Text style={styles.statValue}>{d.user.daysTracked}</Text></View>
              <View style={styles.statItem}><Text style={styles.statLabel}>Total XP</Text><Text style={styles.statValue}>{d.user.xp.toLocaleString()}</Text></View>
              <View style={styles.statItem}><Text style={styles.statLabel}>Weight Lost</Text><Text style={styles.statValue}>{Math.abs(d.measurements.changes.weight)} kg</Text></View>
              <View style={styles.statItem}><Text style={styles.statLabel}>BP Reduction</Text><Text style={styles.statValue}>{d.healthTrend[0].bp - d.healthTrend[d.healthTrend.length - 1].bp} pts</Text></View>
            </View>
          </Section>
        </View>
      </TwoCol>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  idCallout: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: 6,
    borderLeftWidth: 4,
    marginBottom: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  metricCard: {
    width: '30%',
    minWidth: 90,
    backgroundColor: '#f7f6f3',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f0f0ee',
  },
  metricLabel: {
    fontSize: 11,
    color: '#9b9a97',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  foggRow: {
    flexDirection: 'row',
    gap: 8,
  },
  foggCard: {
    flex: 1,
    backgroundColor: '#f7f6f3',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f0f0ee',
    borderLeftWidth: 3,
  },
  foggLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9b9a97',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  foggValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  foggTarget: {
    fontSize: 11,
    color: '#9b9a97',
    marginTop: 2,
  },
  alertCard: {
    flexDirection: 'row',
    gap: 10,
    padding: 10,
    borderRadius: 6,
    marginVertical: 3,
    borderLeftWidth: 3,
  },
  weekGrid: {
    flexDirection: 'row',
    gap: 4,
  },
  weekDay: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f7f6f3',
    borderRadius: 8,
  },
  weekDayLabel: {
    fontSize: 10,
    color: '#9b9a97',
    fontWeight: '600',
  },
  weekDayScore: {
    fontSize: 16,
    fontWeight: '700',
    marginVertical: 2,
    color: '#37352f',
  },
  achGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#9b9a97',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#37352f',
    marginTop: 2,
  },
});
