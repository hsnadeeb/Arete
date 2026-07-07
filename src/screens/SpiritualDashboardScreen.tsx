import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import { useHasan } from '../data/context';
import { Section, PrayerCard, StatItem, ProgressBar, Callout, TwoCol } from '../components/Scores';

export default function SpiritualDashboardScreen() {
  const { data: d } = useHasan();
  const sp = d.spiritual;

  return (
    <ScreenWrapper
      title="Spiritual Dashboard"
      icon="🕌"
      subtitle={`Score: ${d.spiritualScore}/100 · "${sp.currentStudy}"`}
    >
      {/* Prayer Consistency */}
      <Section title="📿 Prayer Consistency">
        <View style={styles.prayerGrid}>
          {sp.prayerConsistency.map((p, i) => (
            <PrayerCard key={i} name={p.name} percentage={p.percentage} status={p.status} />
          ))}
        </View>
        <View style={styles.prayerStats}>
          <View style={styles.prayerStat}><Text style={styles.psLabel}>On Time</Text><Text style={[styles.psValue, { color: '#0a8c2e' }]}>{sp.onTime}%</Text></View>
          <View style={styles.prayerStat}><Text style={styles.psLabel}>Qada</Text><Text style={[styles.psValue, { color: '#d9730d' }]}>{sp.qada}%</Text></View>
          <View style={styles.prayerStat}><Text style={styles.psLabel}>Missed</Text><Text style={[styles.psValue, { color: '#e03e3e' }]}>{sp.missed}%</Text></View>
        </View>
      </Section>

      <TwoCol>
        {/* Left */}
        <View style={{ flex: 1 }}>
          {/* Quran */}
          <Section title="📖 Quran">
            <View style={[styles.infoCallout, { backgroundColor: '#e8f0fe', borderLeftColor: '#0b6bcf' }]}>
              <Text style={{ fontSize: 16 }}>📖</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '600', fontSize: 13, color: '#37352f' }}>
                  {sp.quranPages} pages this month
                </Text>
                <Text style={{ fontSize: 11, color: '#9b9a97', marginTop: 2 }}>
                  Daily avg: {sp.quranDailyAvg} · {sp.currentStudy}
                </Text>
              </View>
            </View>
          </Section>

          {/* Extra Worship */}
          <Section title="🤲 Extra Worship">
            <View style={styles.table}>
              <View style={styles.tableRow}>
                <Text style={[styles.th, { flex: 2 }]}>Practice</Text>
                <Text style={[styles.th, { flex: 2 }]}>Value</Text>
                <Text style={styles.th}>Trend</Text>
              </View>
              {sp.extraWorship.map((e, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={[styles.td, { flex: 2, fontWeight: '500' }]}>{e.name}</Text>
                  <Text style={[styles.td, { flex: 2 }]}>{e.value}</Text>
                  <Text style={styles.td}>{e.trend}</Text>
                </View>
              ))}
            </View>
          </Section>
        </View>

        {/* Right */}
        <View style={{ flex: 1 }}>
          {/* Charity */}
          <Section title="🤲 Charity">
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <StatItem label="Given" value={`$${sp.charity.total}`} />
              <StatItem label="Goal" value={`$${sp.charity.goal}`} />
            </View>
            <ProgressBar progress={sp.charity.progress} color="#9b6bd7" height={6} style={{ marginTop: 8 }} />
          </Section>

          {/* Reflection */}
          <Section title="💭 Reflection">
            <View style={[styles.infoCallout, { backgroundColor: '#f7f6f3', borderLeftColor: '#0b6bcf' }]}>
              <Text style={{ fontSize: 16 }}>💭</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '500', fontSize: 13, color: '#37352f' }}>
                  Iman: 4/5 · Focus: Improve Isha consistency — set alarm 15min before Isha
                </Text>
              </View>
            </View>
          </Section>
        </View>
      </TwoCol>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  prayerGrid: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  prayerStats: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  prayerStat: {
    flex: 1,
    alignItems: 'center',
  },
  psLabel: { fontSize: 10, color: '#9b9a97', fontWeight: '500', textTransform: 'uppercase' },
  psValue: { fontSize: 18, fontWeight: '700', marginTop: 2 },
  infoCallout: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: 6,
    borderLeftWidth: 3,
    marginVertical: 4,
  },
  table: { marginVertical: 4 },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0ee',
    alignItems: 'center',
  },
  th: {
    flex: 1,
    fontSize: 10,
    fontWeight: '500',
    color: '#9b9a97',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  td: { flex: 1, fontSize: 12, color: '#37352f' },
});
