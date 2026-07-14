import React, { useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Icon } from '../../components/Icons';
import { LUCIDE_ICONS, TYPOGRAPHY } from '../../constants/typography';
import { useTheme } from '../../context/ThemeContext';
import { OnboardingLayout, OnboardingIcon, AnimatedSelectionCard } from './OnboardingComponents';

const PREFERENCES = [
  { id: 'daily_reminders', label: 'Daily Reminders', description: 'Get gentle nudges to stay on track', iconKey: 'bell' as const },
  { id: 'weekly_reports', label: 'Weekly Reports', description: 'See your progress every week', iconKey: 'barChart2' as const },
  { id: 'morning_motivation', label: 'Morning Motivation', description: 'Start your day with inspiration', iconKey: 'sun' as const },
  { id: 'evening_reflection', label: 'Evening Reflection', description: 'End your day with gratitude', iconKey: 'moon' as const },
];

export default function PreferencesScreen({
  onNext,
  onBack,
}: { onNext: (prefs: string[]) => void; onBack: () => void }) {
  const { theme } = useTheme();
  const tc = theme.colors;
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>(['daily_reminders']);

  const [cardAnims] = React.useState(() =>
    PREFERENCES.map(() => new Animated.Value(0))
  );

  const togglePref = (prefId: string) => {
    setSelectedPrefs((prev) =>
      prev.includes(prefId)
        ? prev.filter((id) => id !== prefId)
        : [...prev, prefId]
    );
  };

  const handleNext = () => {
    onNext(selectedPrefs);
  };

  React.useEffect(() => {
    Animated.stagger(80, cardAnims.map((anim) =>
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 100, friction: 12 })
    )).start();
  }, [cardAnims]);

  return (
    <OnboardingLayout
      step={5}
      totalSteps={6}
      title="Customize your experience"
      subtitle="Choose how you'd like to stay motivated"
      nextLabel="Complete Setup"
      onNext={handleNext}
      onBack={onBack}
      scrollable
    >
      {PREFERENCES.map((pref, i) => (
            <AnimatedSelectionCard
              key={pref.id}
              selected={selectedPrefs.includes(pref.id)}
              onPress={() => togglePref(pref.id)}
              anim={cardAnims[i]}
              index={i}
              variant="accent"
            >
              <View style={styles.prefCardContent}>
                <OnboardingIcon
                  name={pref.iconKey}
                  size={24}
                  variant={selectedPrefs.includes(pref.id) ? 'accent' : 'primary'}
                  backgroundColor={selectedPrefs.includes(pref.id) ? tc.accent + '15' : tc.accentBg}
                />
                <View style={styles.prefInfo}>
                  <Text style={[styles.prefLabel, { color: selectedPrefs.includes(pref.id) ? tc.accent : tc.text }]}>
                    {pref.label}
                  </Text>
                  <Text style={[styles.prefDescription, { color: tc.textSecondary }]}>
                    {pref.description}
                  </Text>
                </View>
                <OnboardingIcon
                  name="checkCircle"
                  size={22}
                  variant={selectedPrefs.includes(pref.id) ? 'accent' : 'secondary'}
                  backgroundColor={selectedPrefs.includes(pref.id) ? tc.accent : 'transparent'}
                />
              </View>
            </AnimatedSelectionCard>
      ))}
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  prefCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  prefInfo: { flex: 1 },
  prefLabel: { ...TYPOGRAPHY.h4, marginBottom: 4 },
  prefDescription: { ...TYPOGRAPHY.body },
});