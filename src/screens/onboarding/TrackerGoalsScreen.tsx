import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TYPOGRAPHY } from '../../constants/typography';
import { useTheme } from '../../context/ThemeContext';
import { Icon } from '../../components/Icons';
import { LUCIDE_ICONS } from '../../constants/typography';
import { TRACKER_COLORS } from '../tracker/constants';

const TRACKER_GOALS = [
  {
    key: 'steps',
    label: 'Daily Steps',
    icon: 'run' as const,
    default: 10000,
    unit: 'steps',
    min: 1000,
    max: 50000,
    step: 500,
    color: TRACKER_COLORS.steps.primary,
  },
  {
    key: 'water',
    label: 'Daily Water',
    icon: 'droplet' as const,
    default: 3000,
    unit: 'ml',
    min: 500,
    max: 6000,
    step: 100,
    color: TRACKER_COLORS.water.primary,
  },
  {
    key: 'sleep',
    label: 'Sleep Goal',
    icon: 'moon' as const,
    default: 8,
    unit: 'hours',
    min: 4,
    max: 12,
    step: 0.5,
    color: TRACKER_COLORS.sleep.primary,
  },
];

function GoalSlider({
  goal,
  value,
  onChange,
}: {
  goal: typeof TRACKER_GOALS[0];
  value: number;
  onChange: (v: number) => void;
}) {
  const { theme } = useTheme();
  const tc = theme.colors;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const pct = (value - goal.min) / (goal.max - goal.min);
  const pctOfDefault = Math.min(value / goal.default, 1) * 100;

  const adjust = (delta: number) => {
    const next = Math.max(goal.min, Math.min(goal.max, value + delta));
    if (next !== value) {
      Animated.sequence([
        Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true, tension: 100, friction: 6 }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 100, friction: 6 }),
      ]).start();
      onChange(next);
    }
  };

  return (
    <View style={[styles.goalCard, { backgroundColor: tc.surface, borderColor: tc.border }]}>
      <View style={styles.goalHeader}>
        <View style={[styles.goalIconWrap, { backgroundColor: goal.color + '18' }]}>
          <Icon name={LUCIDE_ICONS[goal.icon]} size={22} color={goal.color} />
        </View>
        <View style={styles.goalInfo}>
          <Text style={[styles.goalLabel, { color: tc.text }]}>{goal.label}</Text>
          <Text style={[styles.goalUnit, { color: tc.textSecondary }]}>{goal.unit}</Text>
        </View>
      </View>

      <Animated.View style={{ transform: [{ scale: scaleAnim }], alignItems: 'center' }}>
        <Text style={[styles.goalValue, { color: goal.color }]}>
          {goal.key === 'water' ? `${value}` : goal.key === 'sleep' ? value.toFixed(1) : value.toLocaleString()}
        </Text>
      </Animated.View>

      {/* Progress bar to default */}
      <View style={[styles.progressTrack, { backgroundColor: tc.bgSecondary }]}>
        <View
          style={[
            styles.progressFill,
            { width: `${Math.min(pctOfDefault, 100)}%`, backgroundColor: goal.color },
          ]}
        />
      </View>

      <View style={styles.adjustRow}>
        <TouchableOpacity
          style={[styles.adjustBtn, { backgroundColor: goal.color + '15' }]}
          onPress={() => adjust(-goal.step)}
        >
          <Icon name={LUCIDE_ICONS.chevronDown} size={18} color={goal.color} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.adjustBtn, { backgroundColor: goal.color + '15' }]}
          onPress={() => adjust(goal.step)}
        >
          <Icon name={LUCIDE_ICONS.chevronUp} size={18} color={goal.color} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function TrackerGoalsScreen({
  onNext,
  onBack,
}: {
  onNext: (goals: { steps_target: number; water_target: number; sleep_target: number }) => void;
  onBack: () => void;
}) {
  const { theme } = useTheme();
  const tc = theme.colors;
  const [goals, setGoals] = useState({
    steps: 10000,
    water: 3000,
    sleep: 8,
  });

  const updateGoal = (key: string, value: number) => {
    setGoals(prev => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    onNext({
      steps_target: goals.steps,
      water_target: goals.water,
      sleep_target: goals.sleep,
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <View style={styles.content}>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: tc.accent, width: '100%' }]} />
          </View>

          <Text style={[styles.title, { color: tc.text }]}>Set your daily targets</Text>
          <Text style={[styles.subtitle, { color: tc.textSecondary }]}>
            Customize your tracking goals for each area
          </Text>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollArea}>
            {TRACKER_GOALS.map(g => (
              <GoalSlider
                key={g.key}
                goal={g}
                value={goals[g.key as keyof typeof goals]}
                onChange={(v) => updateGoal(g.key, v)}
              />
            ))}
          </ScrollView>
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.backButton, { borderColor: tc.border }]}
            onPress={onBack}
          >
            <Text style={[styles.backButtonText, { color: tc.textSecondary }]}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.nextButton, { backgroundColor: tc.accent }]}
            onPress={handleNext}
          >
            <Text style={[styles.nextButtonText, { color: '#fff' }]}>Continue</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  keyboardContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginBottom: 32,
    alignSelf: 'flex-start',
    width: '100%',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  scrollArea: {
    flex: 1,
  },
  goalCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 14,
    gap: 12,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goalIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalInfo: {
    flex: 1,
  },
  goalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  goalUnit: {
    fontSize: 13,
    marginTop: 1,
  },
  goalValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  adjustRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  adjustBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  backButtonText: {
    ...TYPOGRAPHY.h4,
  },
  nextButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    ...TYPOGRAPHY.h4,
  },
});
