import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import { useHasan } from '../data/context';
import { Section, Callout, NeverMissTwice, WarningSign, MiniHabit, TwoCol } from '../components/Scores';

export default function RelapsePreventionScreen() {
  const { data: d } = useHasan();
  const rp = d.relapsePrevention;

  return (
    <ScreenWrapper
      title="Relapse Prevention & Resilience"
      icon="🛡️"
      subtitle={'"It\'s not about being perfect. It\'s about never missing twice."'}
    >
      {/* Never Miss Twice */}
      <NeverMissTwice
        principle="Never Miss Twice"
        rule={rp.neverMissTwice.rule}
        forgivenessWindow={rp.neverMissTwice.forgivenessWindow}
        emergencyProtocol={rp.neverMissTwice.emergencyProtocol}
      />

      <TwoCol>
        {/* Left */}
        <View style={{ flex: 1 }}>
          <Section title="⚠️ Warning Signs">
            {rp.warningSigns.map((ws, i) => (
              <WarningSign
                key={i}
                sign={ws.sign}
                severity={ws.severity}
                action={ws.action}
              />
            ))}
          </Section>
        </View>

        {/* Right */}
        <View style={{ flex: 1 }}>
          <Section title="🛡️ Minimum Viable Habits">
            <Text style={{ fontSize: 11, color: '#9b9a97', marginBottom: 8 }}>
              When everything feels hard, do these:
            </Text>
            {Object.entries(rp.minimumViableHabits).map(([area, habit], i) => {
              const icons: Record<string, string> = {
                health: '💪', career: '💼', spiritual: '🕌', finance: '💰', learning: '📚',
              };
              return (
                <MiniHabit
                  key={i}
                  icon={icons[area] || '📋'}
                  area={area.charAt(0).toUpperCase() + area.slice(1)}
                  habit={habit}
                />
              );
            })}
          </Section>

          {/* Info callout */}
          <View style={[styles.infoCallout, { backgroundColor: '#fef3c7', borderLeftColor: '#f59e0b' }]}>
            <Text style={{ fontSize: 16 }}>🛡️</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '600', fontSize: 13, color: '#37352f' }}>
                Relapse is not failure — it's data.
              </Text>
              <Text style={{ fontSize: 11, color: '#9b9a97', marginTop: 2 }}>
                Every slip tells you something about your system. The goal isn't to never slip. The goal is to shorten the time between slip and recovery.
              </Text>
            </View>
          </View>
        </View>
      </TwoCol>
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
    marginVertical: 12,
  },
});
