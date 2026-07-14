import { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated, TextInput } from "react-native";
import { Icon } from "../../components/Icons";
import { LUCIDE_ICONS, TYPOGRAPHY } from "../../constants/typography";
import { useTheme } from "../../context/ThemeContext";
import {
  OnboardingLayout,
  OnboardingIcon,
  OnboardingInput,
  AnimatedSelectionCard,
} from "./OnboardingComponents";

const GENDERS = [
  { id: "male", label: "Male", iconKey: "user" as const },
  { id: "female", label: "Female", iconKey: "user" as const },
  { id: "other", label: "Other", iconKey: "smile" as const },
];

const ACTIVITY_LEVELS = [
  { id: "sedentary", label: "Sedentary", desc: "Little or no exercise" },
  { id: "light", label: "Light", desc: "1–3 days/week" },
  { id: "moderate", label: "Moderate", desc: "3–5 days/week" },
  { id: "active", label: "Active", desc: "6–7 days/week" },
  { id: "very_active", label: "Very Active", desc: "Intense daily" },
];

interface BodyData {
  gender: string;
  dateOfBirth: string;
  heightCm: string;
  weightKg: string;
  targetWeightKg: string;
  activityLevel: string;
}

function calcIdealWeight(heightCm: number): number {
  const h = heightCm / 100;
  return Math.round(22 * h * h * 10) / 10;
}

function formatDOB(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  let result = "";
  for (let i = 0; i < digits.length; i++) {
    if (i === 4 || i === 6) result += "-";
    result += digits[i];
  }
  return result;
}

export default function BodyScreen({
  onNext,
  onBack,
}: {
  onNext: (data: BodyData) => void;
  onBack: () => void;
}) {
  const { theme } = useTheme();
  const tc = theme.colors;

  const [gender, setGender] = useState("");
  const [dobDigits, setDobDigits] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [targetWeightKg, setTargetWeightKg] = useState("");
  const [targetAuto, setTargetAuto] = useState(false);
  const [activityLevel, setActivityLevel] = useState("moderate");

  const [genderAnim] = useState(() => GENDERS.map(() => new Animated.Value(0)));
  const [activityAnims] = useState(() =>
    ACTIVITY_LEVELS.map(() => new Animated.Value(0)),
  );

  const dateOfBirth = formatDOB(dobDigits);

  const isValid = gender && weightKg;

  const heightInputRef = useRef<TextInput>(null);
  const targetInputRef = useRef<TextInput>(null);

  const handleHeightChange = (val: string) => {
    setHeightCm(val);
    const h = parseFloat(val);
    const w = parseFloat(weightKg);
    if (h > 0 && w > 0) {
      setTargetWeightKg(String(calcIdealWeight(h)));
      setTargetAuto(true);
    } else if (targetAuto) {
      setTargetWeightKg("");
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
      setTargetWeightKg("");
      setTargetAuto(false);
    }
  };

  const handleDOBChange = (val: string) => {
    const raw = val.replace(/-/g, "");
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

  useEffect(() => {
    Animated.stagger(
      60,
      genderAnim.map((anim) =>
        Animated.spring(anim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 12,
        }),
      ),
    ).start();

    Animated.stagger(
      60,
      activityAnims.map((anim, i) =>
        Animated.spring(anim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 12,
          delay: i * 40,
        }),
      ),
    ).start();
  }, [genderAnim, activityAnims]);

  return (
    <OnboardingLayout
      step={3}
      totalSteps={6}
      title="Tell us about you"
      subtitle="Help us personalize your experience"
      nextLabel="Continue"
      onNext={handleNext}
      onBack={onBack}
      nextDisabled={!isValid}
      scrollable
    >
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: tc.textSecondary }]}>
          Gender
        </Text>
        <View style={styles.genderRow}>
          {GENDERS.map((g, i) => (
            <AnimatedSelectionCard
              key={g.id}
              selected={gender === g.id}
              onPress={() => setGender(g.id)}
              anim={genderAnim[i]}
              index={i}
              variant="accent"
            >
              <View style={styles.genderCardContent}>
                <OnboardingIcon
                  name={g.iconKey}
                  size={22}
                  variant="primary"
                  backgroundColor={gender === g.id ? tc.accentBg : tc.surface}
                />
                <Text
                  style={[
                    styles.genderLabel,
                    { color: gender === g.id ? tc.accent : tc.text },
                  ]}
                >
                  {g.label}
                </Text>
              </View>
            </AnimatedSelectionCard>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: tc.textSecondary }]}>
          Date of Birth{" "}
          <Text style={{ color: tc.textTertiary }}> (optional)</Text>
        </Text>
        <OnboardingInput
          value={dateOfBirth}
          onChangeText={handleDOBChange}
          placeholder="YYYY-MM-DD"
          keyboardType="number-pad"
          maxLength={10}
          helperText="Used to calculate your metrics"
          fontSize={20}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: tc.textSecondary }]}>
          Current Weight (kg)
        </Text>
        <OnboardingInput
          value={weightKg}
          onChangeText={handleWeightChange}
          placeholder="e.g. 75"
          keyboardType="decimal-pad"
          onSubmitEditing={() => heightInputRef.current?.focus()}
          fontSize={28}
          textAlign="center"
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: tc.textSecondary }]}>
          Height (cm)
        </Text>
        <OnboardingInput
          ref={heightInputRef}
          value={heightCm}
          onChangeText={handleHeightChange}
          placeholder="e.g. 175"
          keyboardType="decimal-pad"
          onSubmitEditing={() => targetInputRef.current?.focus()}
          fontSize={28}
          textAlign="center"
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: tc.textSecondary }]}>
          Target Weight (kg)
          {targetAuto && (
            <Text style={styles.autoBadge}> · Auto-calculated</Text>
          )}
        </Text>
        <OnboardingInput
          ref={targetInputRef}
          value={targetWeightKg}
          onChangeText={(v) => {
            setTargetWeightKg(v);
            setTargetAuto(false);
          }}
          placeholder={
            heightCm
              ? `~${calcIdealWeight(parseFloat(heightCm))}`
              : "Enter height first"
          }
          keyboardType="decimal-pad"
          fontSize={28}
          textAlign="center"
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: tc.textSecondary }]}>
          Activity Level
        </Text>
        {ACTIVITY_LEVELS.map((level, i) => (
          <AnimatedSelectionCard
            key={level.id}
            selected={activityLevel === level.id}
            onPress={() => setActivityLevel(level.id)}
            anim={activityAnims[i]}
            index={i}
            variant="accent"
          >
            <View style={styles.activityCardContent}>
              <View style={styles.activityInfo}>
                <Text
                  style={[
                    styles.activityLabel,
                    {
                      color: activityLevel === level.id ? tc.accent : tc.text,
                    },
                  ]}
                >
                  {level.label}
                </Text>
                <Text
                  style={[
                    styles.activityDesc,
                    {
                      color:
                        activityLevel === level.id
                          ? tc.accent + "CC"
                          : tc.textSecondary,
                    },
                  ]}
                >
                  {level.desc}
                </Text>
              </View>
              <OnboardingIcon
                name="checkCircle"
                size={22}
                variant={activityLevel === level.id ? "accent" : "secondary"}
                backgroundColor={
                  activityLevel === level.id ? tc.accent : "transparent"
                }
              />
            </View>
          </AnimatedSelectionCard>
        ))}
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 30 },
  section: { marginBottom: 24 },
  sectionLabel: { ...TYPOGRAPHY.label, marginBottom: 12 },
  genderRow: { flexDirection: "row", gap: 10 },
  genderCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  genderLabel: { ...TYPOGRAPHY.body, fontWeight: "600" },
  autoBadge: { ...TYPOGRAPHY.captionSm, color: "#10b981", fontWeight: "500" },
  activityCardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  activityInfo: { flex: 1 },
  activityLabel: { ...TYPOGRAPHY.body, fontWeight: "600" },
  activityDesc: { ...TYPOGRAPHY.caption, marginTop: 2 },
});
