import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Icon } from '../../components/Icons';
import { LUCIDE_ICONS, TYPOGRAPHY } from '../../constants/typography';
import { useTheme } from '../../context/ThemeContext';
import { TRACKER_COLORS } from '../tracker/constants';
import { OnboardingLayout, OnboardingIcon } from './OnboardingComponents';

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

interface GoalSliderProps {
  goal: typeof TRACKER_GOALS[0];
  value: number;
  onChange: (v: number) => void;
  anim: Animated.Value;
}

const GoalSlider: React.FC<GoalSliderProps> = ({
  goal,
  value,
  onChange,
  anim,
}) => {
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

  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
  });
  const opacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [30, 0],
  });

  return (
    <Animated.View
      style={{
        transform: [{ scale }, { translateY }],
        opacity,
      }}
    >
      <View style={[styles.goalCard, { backgroundColor: tc.surface, borderColor: tc.border }]}>
        <View style={styles.goalHeader}>
          <OnboardingIcon
            name={goal.icon}
            size={22}
            variant="primary"
            backgroundColor={goal.color + '18'}
          />
          <View style={styles.goalInfo}>
            <Text style={[styles.goalLabel, { color: tc.text }]}>{goal.label}</Text>
            <Text style={[styles.goalUnit, { color: tc.textSecondary }]}>{goal.unit}</Text>
          </View>
        </View>

        <Animated.View style={{ transform: [{ scale: scaleAnim }], alignItems: 'center' }}>
          <Text style={[styles.goalValue, { color: goal.color }]}>
            {goal.key === 'water'
              ? `${value}`
              : goal.key === 'sleep'
              ? value.toFixed(1)
              : value.toLocaleString()}
          </Text>
        </Animated.View>

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
            activeOpacity={0.7}
          >
            <Icon name={LUCIDE_ICONS.chevronDown} size={18} color={goal.color} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.adjustBtn, { backgroundColor: goal.color + '15' }]}
            onPress={() => adjust(goal.step)}
            activeOpacity={0.7}
          >
            <Icon name={LUCIDE_ICONS.chevronUp} size={18} color={goal.color} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

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

  const [cardAnims] = useState(() =>
    TRACKER_GOALS.map(() => new Animated.Value(0))
  );

  const updateGoal = (key: string, value: number) => {
    setGoals((prev) => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    onNext({
      steps_target: goals.steps,
      water_target: goals.water,
      sleep_target: goals.sleep,
    });
  };

  React.useEffect(() => {
    Animated.stagger(100, cardAnims.map((anim) =>
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 100, friction: 12 })
    )).start();
  }, [cardAnims]);

  return (
    <OnboardingLayout
      step={4}
      totalSteps={6}
      title="Set your daily targets"
      subtitle="Customize your tracking goals for each area"
      nextLabel="Continue"
      onNext={handleNext}
      onBack={onBack}
      scrollable
    >
      {TRACKER_GOALS.map((g, i) => (
        <GoalSlider
          key={g.key}
          goal={g}
          value={goals[g.key as keyof typeof goals]}
          onChange={(v) => updateGoal(g.key, v)}
          anim={cardAnims[i]}
        />
      ))}
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollArea: { flex: 1 },
  scrollContent: { paddingBottom: 20, paddingHorizontal: 24 },
  goalCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
    gap: 14,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  goalInfo: { flex: 1 },
  goalLabel: { fontSize: 17, fontWeight: '600' },
  goalUnit: { fontSize: 13, marginTop: 2 },
  goalValue: { fontSize: 36, fontWeight: '700' },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 4 },
  progressFill: { height: '100%', borderRadius: 3 },
  adjustRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    marginTop: 4,
  },
  adjustBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});