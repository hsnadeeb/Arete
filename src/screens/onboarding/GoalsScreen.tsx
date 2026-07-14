import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { Icon } from "../../components/Icons";
import { LUCIDE_ICONS, TYPOGRAPHY } from "../../constants/typography";
import { useTheme } from "../../context/ThemeContext";
import { OnboardingLayout, OnboardingIcon } from "./OnboardingComponents";

const GOALS = [
  {
    id: "fitness",
    label: "Fitness & Health",
    iconKey: "activity" as const,
    color: "#10b981",
  },
  {
    id: "productivity",
    label: "Productivity",
    iconKey: "clock" as const,
    color: "#6366f1",
  },
  {
    id: "mindfulness",
    label: "Mindfulness",
    iconKey: "moon" as const,
    color: "#8b5cf6",
  },
  {
    id: "learning",
    label: "Learning",
    iconKey: "book" as const,
    color: "#f59e0b",
  },
  {
    id: "finance",
    label: "Finance",
    iconKey: "dollarSign" as const,
    color: "#0ea5e9",
  },
  {
    id: "social",
    label: "Social",
    iconKey: "users" as const,
    color: "#ec4899",
  },
];

interface GoalCardProps {
  goal: (typeof GOALS)[0];
  selected: boolean;
  index: number;
  onPress: () => void;
  anim: Animated.Value;
}

const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  selected,
  index,
  onPress,
  anim,
}) => {
  const { theme } = useTheme();
  const tc = theme.colors;

  const scaleAnim = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1],
  });
  const opacityAnim = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1],
  });
  const translateYAnim = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [25, 0],
  });

  const borderColor = selected ? goal.color : tc.border;
  const bgColor = selected ? goal.color + "15" : tc.surface;
  const textColor = selected ? goal.color : tc.text;
  const iconBgColor = selected
    ? goal.color + "20"
    : tc.bgSecondary || "#f1f5f9";

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }, { translateY: translateYAnim }],
        opacity: opacityAnim,
      }}
    >
      <TouchableOpacity
        style={[
          styles.goalCard,
          {
            backgroundColor: bgColor,
            borderColor,
            borderWidth: selected ? 2 : 1,
          },
        ]}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <View style={styles.goalContent}>
          <View style={[styles.goalIconWrap, { backgroundColor: iconBgColor }]}>
            <Icon
              name={LUCIDE_ICONS[goal.iconKey]}
              size={26}
              color={textColor}
            />
          </View>

          <Text style={[styles.goalLabel, { color: textColor }]}>
            {goal.label}
          </Text>
        </View>

        {selected && (
          <View style={[styles.checkBadge, { backgroundColor: goal.color }]}>
            <Icon name={LUCIDE_ICONS.check} size={16} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function GoalsScreen({
  onNext,
  onBack,
}: {
  onNext: (goals: string[]) => void;
  onBack: () => void;
}) {
  const { theme } = useTheme();
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [cardAnims] = useState(() => GOALS.map(() => new Animated.Value(0)));

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

  useEffect(() => {
    Animated.stagger(
      80,
      cardAnims.map((anim) =>
        Animated.spring(anim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }),
      ),
    ).start();
  }, [cardAnims]);

  return (
    <OnboardingLayout
      step={2}
      totalSteps={6}
      title="What are your goals?"
      subtitle="Select areas you want to focus on (choose at least one)"
      nextLabel="Continue"
      onNext={handleNext}
      onBack={onBack}
      nextDisabled={selectedGoals.length === 0}
      scrollable
    >
      {GOALS.map((goal, index) => (
        <GoalCard
          key={goal.id}
          goal={goal}
          selected={selectedGoals.includes(goal.id)}
          index={index}
          onPress={() => toggleGoal(goal.id)}
          anim={cardAnims[index]}
        />
      ))}
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  goalCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    margin: 10,
    borderRadius: 16,
    marginBottom: 6,
    // minHeight: 78,
  },
  goalContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 16,
  },
  goalIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    marginLeft: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  goalLabel: {
    fontSize: 17,
    fontWeight: "600",
    flex: 1,
    letterSpacing: -0.2,
  },
  checkBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
});
