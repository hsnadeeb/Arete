import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LUCIDE_ICONS, TYPOGRAPHY } from '../../constants/typography';
import { useTheme } from '../../context/ThemeContext';
import { Icon } from '../../components/Icons';

const GENDERS = [
  { id: 'male', label: 'Male', iconKey: 'user' as const },
  { id: 'female', label: 'Female', iconKey: 'user' as const },
  { id: 'other', label: 'Other', iconKey: 'smile' as const },
];

const ACTIVITY_LEVELS = [
  { id: 'sedentary', label: 'Sedentary', desc: 'Little or no exercise' },
  { id: 'light', label: 'Light', desc: '1–3 days/week' },
  { id: 'moderate', label: 'Moderate', desc: '3–5 days/week' },
  { id: 'active', label: 'Active', desc: '6–7 days/week' },
  { id: 'very_active', label: 'Very Active', desc: 'Intense daily' },
];

interface BodyData {
  gender: string;
  dateOfBirth: string;
  heightCm: string;
  weightKg: string;
  targetWeightKg: string;
  activityLevel: string;
}

// Compute ideal target weight from height using BMI 22 (healthy midpoint).
function calcIdealWeight(heightCm: number): number {
  const h = heightCm / 100;
  return Math.round(22 * h * h * 10) / 10;
}

// Format DOB input: auto-insert "-" after 4 digits (year) and 2 digits (month).
// Only shows digits at positions the user has reached.
function formatDOB(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  let result = '';
  for (let i = 0; i < digits.length; i++) {
    if (i === 4 || i === 6) result += '-';
    result += digits[i];
  }
  return result;
}

export default function BodyScreen({ onNext, onBack }: { onNext: (data: BodyData) => void; onBack: () => void }) {
  const { theme } = useTheme();
  const tc = theme.colors;
  const [gender, setGender] = useState('');
  const [dobDigits, setDobDigits] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [targetWeightKg, setTargetWeightKg] = useState('');
  const [targetAuto, setTargetAuto] = useState(false);
  const [activityLevel, setActivityLevel] = useState('moderate');

  const dateOfBirth = formatDOB(dobDigits);

  const isValid = gender && weightKg;

  const handleHeightChange = (val: string) => {
    setHeightCm(val);
    // Auto-fill target weight if we have both height and weight
    const h = parseFloat(val);
    const w = parseFloat(weightKg);
    if (h > 0 && w > 0) {
      setTargetWeightKg(String(calcIdealWeight(h)));
      setTargetAuto(true);
    } else if (targetAuto) {
      setTargetWeightKg('');
      setTargetAuto(false);
    }
  };

  const handleWeightChange = (val: string) => {
    setWeightKg(val);
    const h = parseFloat(heightCm);
    const w = parseFloat(val);
    if (h > 0 && w > 0) {
      setTargetWeightKg(String(calcIdealWeight(h)));
      setTargetAuto(true);
    } else if (targetAuto) {
      setTargetWeightKg('');
      setTargetAuto(false);
    }
  };

  const handleDOBChange = (val: string) => {
    // strip existing hyphens to get raw digits, then reformat
    const raw = val.replace(/-/g, '');
    setDobDigits(raw);
  };

  const handleNext = () => {
    if (!isValid) return;
    onNext({
      gender,
      dateOfBirth,
      heightCm,
      weightKg,
      targetWeightKg,
      activityLevel,
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
            <View style={[styles.progressBar, { backgroundColor: tc.accent, width: '60%' }]} />
          </View>

          <Text style={[styles.title, { color: tc.text }]}>Tell us about you</Text>
          <Text style={[styles.subtitle, { color: tc.textSecondary }]}>
            Help us personalize your experience
          </Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Gender */}
            <Text style={[styles.fieldLabel, { color: tc.textSecondary }]}>Gender</Text>
            <View style={styles.genderRow}>
              {GENDERS.map(g => (
                <TouchableOpacity
                  key={g.id}
                  style={[
                    styles.genderCard,
                    {
                      backgroundColor: gender === g.id ? tc.accentBg : tc.surface,
                      borderColor: gender === g.id ? tc.accent : tc.border,
                    },
                  ]}
                  onPress={() => setGender(g.id)}
                >
                  <Icon
                    name={LUCIDE_ICONS[g.iconKey]}
                    size={20}
                    color={gender === g.id ? tc.accent : tc.textSecondary}
                  />
                  <Text style={[styles.genderLabel, { color: gender === g.id ? tc.accent : tc.text }]}>
                    {g.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Date of Birth */}
            <Text style={[styles.fieldLabel, { color: tc.textSecondary }]}>Date of Birth (optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: tc.surface, borderColor: tc.border, color: tc.text }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={tc.placeholder ?? tc.textSecondary}
              value={dateOfBirth}
              onChangeText={handleDOBChange}
              keyboardType="number-pad"
              maxLength={10}
            />

            {/* Weight */}
            <Text style={[styles.fieldLabel, { color: tc.textSecondary }]}>Current Weight (kg)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: tc.surface, borderColor: tc.border, color: tc.text }]}
              placeholder="e.g. 75"
              placeholderTextColor={tc.textSecondary}
              value={weightKg}
              onChangeText={handleWeightChange}
              keyboardType="decimal-pad"
            />

            {/* Height */}
            <Text style={[styles.fieldLabel, { color: tc.textSecondary }]}>Height (cm)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: tc.surface, borderColor: tc.border, color: tc.text }]}
              placeholder="e.g. 175"
              placeholderTextColor={tc.textSecondary}
              value={heightCm}
              onChangeText={handleHeightChange}
              keyboardType="decimal-pad"
            />

            {/* Target Weight — auto-calculated */}
            <Text style={[styles.fieldLabel, { color: tc.textSecondary }]}>
              Target Weight (kg)
              {targetAuto ? '  · auto-calculated' : ''}
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: tc.surface, borderColor: tc.border, color: tc.text }]}
              placeholder={heightCm ? `~${calcIdealWeight(parseFloat(heightCm))}` : 'Enter height first'}
              placeholderTextColor={tc.textSecondary}
              value={targetWeightKg}
              onChangeText={(v) => { setTargetWeightKg(v); setTargetAuto(false); }}
              keyboardType="decimal-pad"
            />

            {/* Activity Level */}
            <Text style={[styles.fieldLabel, { color: tc.textSecondary }]}>Activity Level</Text>
            {ACTIVITY_LEVELS.map(level => (
              <TouchableOpacity
                key={level.id}
                style={[
                  styles.activityCard,
                  {
                    backgroundColor: activityLevel === level.id ? tc.accentBg : tc.surface,
                    borderColor: activityLevel === level.id ? tc.accent : tc.border,
                  },
                ]}
                onPress={() => setActivityLevel(level.id)}
              >
                <View style={styles.activityContent}>
                  <Text style={[styles.activityLabel, { color: activityLevel === level.id ? tc.accent : tc.text }]}>
                    {level.label}
                  </Text>
                  <Text style={[styles.activityDesc, { color: tc.textSecondary }]}>{level.desc}</Text>
                </View>
                {activityLevel === level.id && (
                  <Icon name={LUCIDE_ICONS.checkCircle} size={20} color={tc.accent} />
                )}
              </TouchableOpacity>
            ))}

            <View style={{ height: 24 }} />
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
            style={[styles.nextButton, { backgroundColor: tc.accent, opacity: isValid ? 1 : 0.5 }]}
            onPress={handleNext}
            disabled={!isValid}
          >
            <Text style={[styles.nextButtonText, { color: '#fff' }]}>Next</Text>
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
  fieldLabel: {
    ...TYPOGRAPHY.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    fontSize: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 4,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
  },
  genderCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  genderLabel: {
    ...TYPOGRAPHY.body,
    fontWeight: '500',
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  activityContent: {
    flex: 1,
  },
  activityLabel: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
  },
  activityDesc: {
    ...TYPOGRAPHY.captionSm,
    marginTop: 2,
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
