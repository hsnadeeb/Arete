import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "../../components/Icons";
import { LUCIDE_ICONS, TYPOGRAPHY } from "../../constants/typography";
import { useTheme } from "../../context/ThemeContext";

const GOALS = [
  { id: "fitness", label: "Fitness & Health", iconKey: "activity" as const },
  { id: "productivity", label: "Productivity", iconKey: "clock" as const },
  { id: "mindfulness", label: "Mindfulness", iconKey: "moon" as const },
  { id: "learning", label: "Learning", iconKey: "book" as const },
  { id: "finance", label: "Finance", iconKey: "dollarSign" as const },
  { id: "social", label: "Social", iconKey: "users" as const },
];

export default function GoalsScreen({
  onNext,
  onBack,
}: {
  onNext: (goals: string[]) => void;
  onBack: () => void;
}) {
  const { theme } = useTheme();
  const tc = theme.colors;
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const toggleGoal = (goalId: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goalId)
        ? prev.filter((id) => id !== goalId)
        : [...prev, goalId],
    );
  };

  const handleNext = () => {
    if (selectedGoals.length > 0) {
      onNext(selectedGoals);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]}>
      <View style={styles.content}>
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressBar,
              { backgroundColor: tc.accent, width: "50%" },
            ]}
          />
        </View>

        <Text style={[styles.title, { color: tc.text }]}>
          What are your goals?
        </Text>
        <Text style={[styles.subtitle, { color: tc.textSecondary }]}>
          Select areas you want to focus on (choose at least one)
        </Text>

        <ScrollView
          style={styles.goalsContainer}
          showsVerticalScrollIndicator={false}
        >
          {GOALS.map((goal) => (
            <TouchableOpacity
              key={goal.id}
              style={[
                styles.goalCard,
                {
                  backgroundColor: selectedGoals.includes(goal.id)
                    ? tc.accentBg
                    : tc.surface,
                  borderColor: selectedGoals.includes(goal.id)
                    ? tc.accent
                    : tc.border,
                },
              ]}
              onPress={() => toggleGoal(goal.id)}
            >
              <Icon
                name={LUCIDE_ICONS[goal.iconKey]}
                size={24}
                color={tc.text}
              />
              <Text style={[styles.goalLabel, { color: tc.text }]}>
                {"   "}
                {goal.label}
              </Text>
              {selectedGoals.includes(goal.id) && (
                <Icon
                  name={LUCIDE_ICONS.checkCircle}
                  size={24}
                  color={tc.accent}
                />
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
          <Text style={[styles.backButtonText, { color: tc.textSecondary }]}>
            Back
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.nextButton,
            {
              backgroundColor: tc.accent,
              opacity: selectedGoals.length > 0 ? 1 : 0.5,
            },
          ]}
          onPress={handleNext}
          disabled={selectedGoals.length === 0}
        >
          <Text style={[styles.nextButtonText, { color: "#fff" }]}>Next</Text>
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
    backgroundColor: "#e0e0e0",
    borderRadius: 2,
    marginBottom: 32,
    alignSelf: "flex-start",
    width: "100%",
  },
  progressBar: {
    height: "100%",
    borderRadius: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  goalsContainer: {
    flex: 1,
    marginBottom: 16,
  },
  goalCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  goalLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
  buttons: {
    flexDirection: "row",
    gap: 12,
  },
  backButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  backButtonText: {
    ...TYPOGRAPHY.h4,
  },
  nextButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  nextButtonText: {
    ...TYPOGRAPHY.h4,
  },
});
