import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function WelcomeScreen({ onNext }: { onNext: () => void }) {
  const { theme } = useTheme();
  const tc = theme.colors;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={[styles.logo, { backgroundColor: tc.accent }]}>
            <Text style={[styles.logoText, { color: '#fff' }]}>A</Text>
          </View>
        </View>

        <Text style={[styles.title, { color: tc.text }]}>Welcome to Arete</Text>
        <Text style={[styles.subtitle, { color: tc.textSecondary }]}>
          Your personal companion for building better habits, tracking progress, and achieving your goals.
        </Text>

        <View style={styles.features}>
          <View style={styles.feature}>
            <View style={[styles.featureIcon, { backgroundColor: tc.accentBg }]}>
              <Text style={styles.featureEmoji}>📊</Text>
            </View>
            <Text style={[styles.featureText, { color: tc.text }]}>Track Everything</Text>
          </View>
          <View style={styles.feature}>
            <View style={[styles.featureIcon, { backgroundColor: tc.accentBg }]}>
              <Text style={styles.featureEmoji}>🎯</Text>
            </View>
            <Text style={[styles.featureText, { color: tc.text }]}>Set Goals</Text>
          </View>
          <View style={styles.feature}>
            <View style={[styles.featureIcon, { backgroundColor: tc.accentBg }]}>
              <Text style={styles.featureEmoji}>📈</Text>
            </View>
            <Text style={[styles.featureText, { color: tc.text }]}>See Progress</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: tc.accent }]}
        onPress={onNext}
      >
        <Text style={[styles.buttonText, { color: '#fff' }]}>Get Started</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 32,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 40,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 48,
    paddingHorizontal: 20,
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
  },
  feature: {
    alignItems: 'center',
  },
  featureIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureEmoji: {
    fontSize: 28,
  },
  featureText: {
    fontSize: 12,
    fontWeight: '500',
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
