import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import { useHasan } from '../data/context';
import { ScoreCard, ProgressBar, StatusBadge, getScoreColor } from '../components/Scores';

export default function LifeAreasScreen() {
  const { data: d } = useHasan();

  return (
    <ScreenWrapper
      title="Life Areas"
      icon="🌍"
      subtitle="9 domains scored 0-100"
    >
      <View style={styles.grid}>
        {d.lifeAreas.map((a, i) => (
          <View key={i} style={[styles.areaCard, { borderLeftWidth: 3, borderLeftColor: a.color }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Text style={{ fontSize: 18 }}>{a.icon}</Text>
              <Text style={styles.areaName}>{a.name}</Text>
            </View>
            <Text style={[styles.areaScore, { color: getScoreColor(a.score) }]}>
              {a.score}<Text style={{ fontSize: 13, color: '#9b9a97' }}>/100</Text>
            </Text>
            <Text style={styles.areaMeta}>
              Target: {a.target} · Stage: {a.stage} ·{' '}
              <StatusBadge
                text={a.priority}
                color={a.priority === 'Critical' ? 'red' : a.priority === 'High' ? 'yellow' : 'gray'}
              />
            </Text>
            <ProgressBar progress={a.score} color={a.color} height={4} style={{ marginTop: 6 }} />
          </View>
        ))}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  areaCard: {
    width: '47%',
    minWidth: 140,
    backgroundColor: '#f7f6f3',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f0f0ee',
  },
  areaName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#37352f',
    flex: 1,
  },
  areaScore: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  areaMeta: {
    fontSize: 11,
    color: '#9b9a97',
    marginTop: 4,
  },
});
