import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import { useHasan } from '../data/context';
import { Section, ProgressBar, StatusBadge } from '../components/Scores';

export default function CommitmentDevicesScreen() {
  const { data: d } = useHasan();

  return (
    <ScreenWrapper
      title="Commitment Devices"
      icon="🔗"
      subtitle="Ulysses Pacts · Deposit Contracts · Precommitment — bind your future self to the right path."
    >
      {/* Info callout */}
      <View style={[styles.infoCallout, { backgroundColor: '#fef3c7', borderLeftColor: '#f59e0b' }]}>
        <Text style={{ fontSize: 16 }}>📜</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '600', fontSize: 13, color: '#37352f' }}>
            The Ulysses Pact: Make it harder to do the wrong thing than the right thing.
          </Text>
          <Text style={{ fontSize: 11, color: '#9b9a97', marginTop: 2 }}>
            Remove options before temptation strikes. Your future self will thank you.
          </Text>
        </View>
      </View>

      {/* Commitment Cards */}
      <View style={styles.cardGrid}>
        {d.commitmentDevices.map((c, i) => (
          <View key={i} style={styles.commitmentCard}>
            <Text style={styles.commitType}>{c.type}</Text>
            <Text style={styles.commitName}>{c.name}</Text>
            <Text style={styles.commitDetails}>{c.details}</Text>
            <Text style={styles.commitPenalty}>⚠ {c.penalty}</Text>
            <View style={styles.commitFooter}>
              <View style={styles.effectBadge}>
                <Text style={styles.effectText}>Effectiveness: {c.effectiveness}/5</Text>
              </View>
              <StatusBadge text={c.status} color="green" />
            </View>
            <ProgressBar progress={c.effectiveness * 20} color="#dc2626" height={6} style={{ marginTop: 6 }} />
          </View>
        ))}
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
  cardGrid: {
    gap: 12,
  },
  commitmentCard: {
    padding: 14,
    borderWidth: 1,
    borderColor: '#e9e9e7',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
  },
  commitType: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#b3b3af',
  },
  commitName: {
    fontWeight: '600',
    fontSize: 14,
    color: '#37352f',
    marginTop: 4,
  },
  commitDetails: {
    fontSize: 12,
    color: '#9b9a97',
    marginVertical: 6,
    lineHeight: 16,
  },
  commitPenalty: {
    fontSize: 12,
    color: '#dc2626',
  },
  commitFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  effectBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#fef3c7',
    borderRadius: 10,
  },
  effectText: {
    fontSize: 11,
    color: '#b45309',
    fontWeight: '500',
  },
});
