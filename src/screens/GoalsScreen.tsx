import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import { useHasan } from '../data/context';
import { GoalItem, StatusBadge } from '../components/Scores';

export default function GoalsScreen() {
  const { data: d } = useHasan();

  return (
    <ScreenWrapper
      title="Goals"
      icon="🎯"
      subtitle={`${d.goals.filter(g => g.status === 'In Progress').length} in progress`}
    >
      <View>
        {d.goals.map((g, i) => {
          const area = d.lifeAreas.find(a => a.id === g.area);
          return (
            <View key={i} style={styles.goalItem}>
              <Text style={styles.goalIcon}>{g.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.goalName}>{g.name}</Text>
                <Text style={styles.goalMeta}>
                  {area ? area.name : ''} · Due: {g.target} · {g.status}
                </Text>
              </View>
              <View style={{ width: 120 }}>
                <Text style={styles.goalPct}>{g.progress}%</Text>
                <View style={styles.progressBg}>
                  <View style={[styles.progressFill, {
                    width: `${g.progress}%`,
                    backgroundColor: g.progress > 50 ? '#0a8c2e' : g.progress > 25 ? '#d9730d' : '#e03e3e',
                  }]} />
                </View>
              </View>
              <StatusBadge
                text={g.status}
                color={g.status === 'In Progress' ? 'blue' : g.status === 'Not Started' ? 'gray' : 'green'}
              />
            </View>
          );
        })}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0ee',
  },
  goalIcon: { fontSize: 20 },
  goalName: { fontSize: 13, fontWeight: '500', color: '#37352f' },
  goalMeta: { fontSize: 11, color: '#9b9a97', marginTop: 1 },
  goalPct: { fontSize: 11, color: '#9b9a97', textAlign: 'right', marginBottom: 2 },
  progressBg: {
    height: 4,
    backgroundColor: '#efefef',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
});
