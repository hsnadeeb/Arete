import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import { useHasan } from '../data/context';
import { Section, ProgressBar, getScoreColor } from '../components/Scores';

export default function DASHDietScreen() {
  const { data: d } = useHasan();
  const bp = d.clinicalHealth.bloodPressure;

  return (
    <ScreenWrapper
      title="DASH Diet Tracker"
      icon="🥗"
      subtitle={`Dietary Approaches to Stop Hypertension · BP: ${bp.systolic}/${bp.diastolic} · Adherence: ${bp.dashDietAdherence}%`}
    >
      {/* Info callout */}
      <View style={[styles.infoCallout, { backgroundColor: '#f0fdf4', borderLeftColor: '#22c55e' }]}>
        <Text style={{ fontSize: 16 }}>🥗</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '500', fontSize: 13, color: '#37352f' }}>
            The DASH Diet is clinically proven to reduce BP in 2 weeks. Focus on: potassium (bananas, spinach, potatoes), calcium (yogurt, leafy greens), magnesium (nuts, seeds, whole grains), and low sodium (&lt;1500mg/day).
          </Text>
        </View>
      </View>

      {/* Nutrient Targets */}
      <Section title="📊 Nutrient Targets">
        {Object.entries(bp.dashTargets).map(([nutrient, data]) => {
          const pct = data.adherence;
          const color = pct >= 80 ? '#0a8c2e' : pct >= 60 ? '#d9730d' : '#e03e3e';
          return (
            <View key={nutrient} style={styles.dashItem}>
              <Text style={styles.dashNutrient} numberOfLines={1}>
                {nutrient.charAt(0).toUpperCase() + nutrient.slice(1)}
              </Text>
              <View style={styles.dashBar}>
                <ProgressBar progress={pct} color={color} height={10} />
              </View>
              <Text style={styles.dashCurrent}>
                {data.current} / {data.target} {data.unit}
              </Text>
            </View>
          );
        })}
      </Section>
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
  dashItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  dashNutrient: {
    width: 90,
    fontSize: 12,
    fontWeight: '500',
    color: '#37352f',
    textTransform: 'capitalize',
  },
  dashBar: {
    flex: 1,
  },
  dashCurrent: {
    width: 80,
    fontSize: 11,
    color: '#9b9a97',
    textAlign: 'right',
  },
});
