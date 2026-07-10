import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../../components/Icons';
import { LUCIDE_ICONS, TYPOGRAPHY } from '../../constants/typography';
import { useTheme } from '../../context/ThemeContext';

const PREFERENCES = [
  { id: 'daily_reminders', label: 'Daily Reminders', description: 'Get gentle nudges to stay on track', iconKey: 'bell' as const },
  { id: 'weekly_reports', label: 'Weekly Reports', description: 'See your progress every week', iconKey: 'barChart2' as const },
  { id: 'morning_motivation', label: 'Morning Motivation', description: 'Start your day with inspiration', iconKey: 'sun' as const },
  { id: 'evening_reflection', label: 'Evening Reflection', description: 'End your day with gratitude', iconKey: 'moon' as const },
];

export default function PreferencesScreen({ onNext, onBack }: { onNext: (prefs: string[]) => void; onBack: () => void }) {
  const { theme } = useTheme();
  const tc = theme.colors;
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>(['daily_reminders']);

  const togglePref = (prefId: string) => {
    setSelectedPrefs(prev =>
      prev.includes(prefId)
        ? prev.filter(id => id !== prefId)
        : [...prev, prefId]
    );
  };

  const handleNext = () => {
    onNext(selectedPrefs);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]}>
      <View style={styles.content}>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: tc.accent, width: '80%' }]} />
        </View>

        <Text style={[styles.title, { color: tc.text }]}>Customize your experience</Text>
        <Text style={[styles.subtitle, { color: tc.textSecondary }]}>
          Choose how you'd like to stay motivated
        </Text>

        <ScrollView style={styles.prefsContainer} showsVerticalScrollIndicator={false}>
          {PREFERENCES.map(pref => (
            <TouchableOpacity
              key={pref.id}
              style={[
                styles.prefCard,
                {
                  backgroundColor: selectedPrefs.includes(pref.id) ? tc.accentBg : tc.surface,
                  borderColor: selectedPrefs.includes(pref.id) ? tc.accent : tc.border,
                },
              ]}
              onPress={() => togglePref(pref.id)}
            >
              <View style={[styles.iconContainer, { backgroundColor: selectedPrefs.includes(pref.id) ? tc.accent + '20' : tc.bgSecondary }]}>
                <Icon name={LUCIDE_ICONS[pref.iconKey]} size={24} color={selectedPrefs.includes(pref.id) ? tc.accent : tc.textSecondary} />
              </View>
              <View style={styles.prefContent}>
                <Text style={[styles.prefLabel, { color: tc.text }]}>{pref.label}</Text>
                <Text style={[styles.prefDescription, { color: tc.textSecondary }]}>{pref.description}</Text>
              </View>
              {selectedPrefs.includes(pref.id) && (
                <Icon name={LUCIDE_ICONS.checkCircle} size={24} color={tc.accent} />
              )}
            </TouchableOpacity>
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
          <Text style={[styles.nextButtonText, { color: '#fff' }]}>Complete Setup</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
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
  prefsContainer: {
    flex: 1,
    marginBottom: 16,
  },
  prefCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  prefContent: {
    flex: 1,
  },
  prefLabel: {
    ...TYPOGRAPHY.h4,
    marginBottom: 4,
  },
  prefDescription: {
    ...TYPOGRAPHY.body,
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
