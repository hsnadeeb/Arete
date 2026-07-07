import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import { useHasan } from '../data/context';
import { StatusBadge, CheckboxItem } from '../components/Scores';

export default function JobApplicationsScreen() {
  const { data: d } = useHasan();
  const career = d.career;

  return (
    <ScreenWrapper
      title="Job Applications"
      icon="📋"
      subtitle={`${career.applications.length} active`}
    >
      <View style={styles.table}>
        <View style={styles.tableRow}>
          <Text style={[styles.th, { flex: 2 }]}>Company</Text>
          <Text style={[styles.th, { flex: 2 }]}>Role</Text>
          <Text style={styles.th}>Status</Text>
          <Text style={styles.th}>Applied</Text>
          <Text style={styles.th}>Follow-up</Text>
        </View>
        {career.applications.map((a, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={[styles.td, { flex: 2, fontWeight: '500', color: a.color }]}>{a.company}</Text>
            <Text style={[styles.td, { flex: 2 }]}>{a.role}</Text>
            <StatusBadge
              text={a.status}
              color={a.status.includes('Interview') ? 'blue' : a.status === 'Screening' ? 'yellow' : 'gray'}
            />
            <Text style={[styles.td, { color: '#9b9a97' }]}>{a.date}</Text>
            <Text style={[styles.td, { color: '#9b9a97' }]}>{a.followUp}</Text>
          </View>
        ))}
      </View>

      <View style={{ marginTop: 16 }}>
        <Text style={styles.sectionTitle}>⏰ Next Actions</Text>
        <CheckboxItem label="Prepare System Design for Company B (Jul 10)" done={false} />
        <CheckboxItem label="Follow up with Company A" done={false} />
        <CheckboxItem label="Apply to 5 more companies this week" done={false} />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  table: { marginVertical: 8 },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0ee',
    alignItems: 'center',
    gap: 4,
  },
  th: {
    flex: 1,
    fontSize: 10,
    fontWeight: '500',
    color: '#9b9a97',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  td: { flex: 1, fontSize: 11, color: '#37352f' },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#9b9a97',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0ee',
  },
});
