import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, SafeAreaView } from 'react-native';
import { Icon } from '../../components/Icons';
import { LUCIDE_ICONS, TYPOGRAPHY } from '../../constants/typography';
import { useTheme } from '../../context/ThemeContext';
import { OnboardingLayout, OnboardingButton, OnboardingIcon } from './OnboardingComponents';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FEATURES = [
  { icon: 'barChart2', label: 'Track Everything', description: 'Habits, health, finance & more' },
  { icon: 'target', label: 'Set Goals', description: 'Daily, weekly, monthly targets' },
  { icon: 'trendingUp', label: 'See Progress', description: 'Visualize your growth' },
];

export default function WelcomeScreen({ onNext }: { onNext: () => void }) {
  const { theme } = useTheme();
  const tc = theme.colors;

  const logoAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const btnAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(150, [
      Animated.spring(logoAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }),
      Animated.timing(contentAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(btnAnim, {
        toValue: 1,
        delay: 200,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [logoAnim, contentAnim, btnAnim]);

  const logoScale = logoAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });
  const logoOpacity = logoAnim.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 0.5, 1],
  });
  const contentTranslateY = contentAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [40, 0],
  });
  const contentOpacity = contentAnim;
  const btnTranslateY = btnAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [30, 0],
  });
  const btnOpacity = btnAnim;

  return (
    <OnboardingLayout
      step={0}
      totalSteps={6}
      title="Welcome to Arete"
      subtitle="Your personal companion for building better habits, tracking progress, and achieving your goals."
      showProgress={false}
      onNext={onNext}
      onBack={() => {}}
      nextLabel="Get Started"
      backLabel=""
    >
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <OnboardingIcon
          name="award"
          size={40}
          variant="accent"
          containerStyle={styles.logoWrapper}
        />
      </Animated.View>

      <Animated.View
        style={{
          opacity: contentOpacity,
          transform: [{ translateY: contentTranslateY }],
        }}
      >
        <View style={styles.featuresContainer}>
          {FEATURES.map((feature, index) => (
            <View key={feature.icon} style={styles.featureCard}>
              <OnboardingIcon
                name={feature.icon as keyof typeof LUCIDE_ICONS}
                size={24}
                variant="primary"
                containerStyle={styles.featureIcon}
              />
              <Text style={[styles.featureLabel, { color: tc.text }]}>{feature.label}</Text>
              <Text style={[styles.featureDesc, { color: tc.textSecondary }]}>{feature.description}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      <Animated.View
        style={{
          opacity: btnOpacity,
          transform: [{ translateY: btnTranslateY }],
        }}
      >
        <Text style={[styles.brandTagline, { color: tc.textTertiary }]}>Arete — Excellence in every habit</Text>
      </Animated.View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
    marginTop: 8,
  },
  featureCard: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  featureIcon: {
    marginBottom: 12,
  },
  featureLabel: {
    ...TYPOGRAPHY.h4,
    textAlign: 'center',
    marginBottom: 4,
  },
  featureDesc: {
    ...TYPOGRAPHY.caption,
    textAlign: 'center',
    lineHeight: 16,
  },
  brandTagline: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});