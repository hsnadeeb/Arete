import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import { useHasan } from '../data/context';
import { Section, Callout, MetricCard, CheckboxItem, StatItem, ProgressBar, TwoMinuteBadge } from '../components/Scores';

export default function DailyCommandCenterScreen() {
  const { data: d, getScoreColor, toggleQuest } = useHasan();
  const s = d.dailyStats;

  return (
    <ScreenWrapper
      title="Daily Command Center"
      icon="📅"
      subtitle={`${s.dayOfWeek}, ${s.month} ${s.date.split('-')[2]}, ${s.year} · Day #${s.dayNumber}`}
    >
      {/* Affirmation */}
      <View style={[styles.idCallout, { backgroundColor: '#eef2ff', borderLeftColor: '#6366f1' }]}>
        <Text style={{ fontSize: 16 }}>🦋</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontStyle: 'italic', fontSize: 14, color: '#37352f' }}>"{s.affirmation}"</Text>
        </View>
      </View>

      {/* Metrics Row */}
      <View style={styles.metricsRow}>
        <MetricCard label="Energy" value={`${s.energy}/5`} />
        <MetricCard label="Mood" value={s.mood} />
        <MetricCard label="Productivity" value={`${s.productivity}/10`} />
        <MetricCard label="Daily Score" value={`${s.dailyScore}`} trendColor={getScoreColor(s.dailyScore)} />
      </View>

      {/* Today's Focus */}
      <Section title="🎯 Today's Focus">
        <View style={[styles.focusCallout, { backgroundColor: '#e8f0fe', borderLeftColor: '#0b6bcf' }]}>
          <Text style={{ fontSize: 16 }}>🎯</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '500', fontSize: 14, color: '#37352f' }}>{s.focus}</Text>
          </View>
        </View>
      </Section>

      {/* Daily Quests */}
      <Section title={`⚔️ Daily Quests (${s.xpEarned} XP)`}>
        {d.dailyQuests.map((q, i) => (
          <TouchableOpacity key={i} onPress={() => toggleQuest(i)} activeOpacity={0.7}>
            <View style={styles.questItem}>
              <View style={[styles.checkboxBox, q.done && styles.checkboxDone]}>
                {q.done ? <Text style={styles.checkboxCheck}>✓</Text> : null}
              </View>
              <Text style={[styles.questLabel, q.done && styles.questDone]}>{q.name}</Text>
              <TwoMinuteBadge text={q.twoMinuteVersion} />
              <Text style={styles.xpTag}>+{q.xp} XP</Text>
            </View>
          </TouchableOpacity>
        ))}
      </Section>

      {/* Two Column: Sleep & Energy + Water & Nutrition */}
      <View style={styles.twoColSection}>
        {/* Sleep */}
        <View style={{ flex: 1 }}>
          <Section title="😴 Sleep & Energy">
            <StatItem label="Hours Slept" value={`${s.sleepHours}h`} />
            <StatItem label="Sleep Quality" value={'⭐'.repeat(s.sleepQuality)} />
            <View style={{ height: 12 }} />
            <StatItem label="Weight" value={`${s.weight} kg`} />
            <StatItem label="BP" value={`${d.clinicalHealth.bloodPressure.systolic}/${d.clinicalHealth.bloodPressure.diastolic}`} />
          </Section>
        </View>

        {/* Nutrition */}
        <View style={{ flex: 1 }}>
          <Section title="💧 Water & Nutrition">
            <StatItem label="Water" value={`${s.water}/${s.waterGoal}ml`} />
            <ProgressBar progress={(s.water / s.waterGoal) * 100} color="#0b6bcf" height={6} style={{ marginVertical: 4 }} />
            <View style={{ height: 8 }} />
            <StatItem label="Calories" value={`${s.calories} kcal`} />
            <Text style={styles.nutritionText}>Protein: {s.protein}g · Fiber: {s.fiber}g · Sugar: {s.sugar}g</Text>
          </Section>
        </View>
      </View>

      {/* Workout */}
      <Section title="🏋️ Workout">
        {s.workout ? (
          <View style={[styles.focusCallout, { backgroundColor: '#f0fdf4', borderLeftColor: '#22c55e' }]}>
            <Text style={{ fontSize: 16 }}>✅</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '600', fontSize: 14, color: '#37352f' }}>{s.workoutName} completed today</Text>
            </View>
          </View>
        ) : (
          <View style={[styles.focusCallout, { backgroundColor: '#fffbeb', borderLeftColor: '#f59e0b' }]}>
            <Text style={{ fontSize: 16 }}>⏳</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: '#37352f' }}>Workout not logged yet — try the two-minute version: 10 pushups</Text>
            </View>
          </View>
        )}
      </Section>

      {/* Prayer Tracker */}
      <Section title="🕌 Prayer Tracker">
        <StatItem label="Prayers Completed" value={`${s.prayerCount}/5`} />
        {['Fajr (On Time)', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((p, i) => (
          <View key={p} style={styles.prayerItem}>
            <View style={[styles.checkboxBox, { borderColor: i < s.prayerCount ? '#0b6bcf' : '#b3b3af' }]}>
              {i < s.prayerCount ? <Text style={styles.checkboxCheck}>✓</Text> : null}
            </View>
            <Text style={styles.prayerLabel}>{p}</Text>
          </View>
        ))}
      </Section>
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
    gap: 8,
    marginVertical: 8,
  },
  focusCallout: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: 6,
    borderLeftWidth: 3,
  },
  questItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 5,
  },
  checkboxBox: {
    width: 16,
    height: 16,
    borderWidth: 2,
    borderColor: '#b3b3af',
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: '#0b6bcf',
    borderColor: '#0b6bcf',
  },
  checkboxCheck: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  questLabel: {
    flex: 1,
    fontSize: 13.5,
    color: '#37352f',
  },
  questDone: {
    textDecorationLine: 'line-through',
    color: '#b3b3af',
  },
  xpTag: {
    fontSize: 11,
    color: '#b3b3af',
    fontWeight: '500',
  },
  twoColSection: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  nutritionText: {
    fontSize: 12,
    color: '#9b9a97',
    marginTop: 4,
  },
  prayerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  prayerLabel: {
    fontSize: 13.5,
    color: '#37352f',
  },
});
