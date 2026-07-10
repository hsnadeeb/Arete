import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

export default function NameScreen({ onNext, onBack }: { onNext: (name: string) => void; onBack: () => void }) {
  const { theme } = useTheme();
  const tc = theme.colors;
  const [name, setName] = useState('');

  const handleNext = () => {
    if (name.trim()) {
      onNext(name.trim());
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <View style={styles.content}>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: tc.accent, width: '33%' }]} />
          </View>

          <Text style={[styles.title, { color: tc.text }]}>What's your name?</Text>
          <Text style={[styles.subtitle, { color: tc.textSecondary }]}>
            Let's get to know you better
          </Text>

          <TextInput
            style={[styles.input, { backgroundColor: tc.surface, borderColor: tc.border, color: tc.text }]}
            placeholder="Enter your name"
            placeholderTextColor={tc.textSecondary}
            value={name}
            onChangeText={setName}
            autoFocus
            onSubmitEditing={handleNext}
          />

          <View style={styles.spacer} />
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.backButton, { borderColor: tc.border }]}
            onPress={onBack}
          >
            <Text style={[styles.backButtonText, { color: tc.textSecondary }]}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.nextButton, { backgroundColor: tc.accent, opacity: name.trim() ? 1 : 0.5 }]}
            onPress={handleNext}
            disabled={!name.trim()}
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
    justifyContent: 'center',
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
    marginBottom: 32,
  },
  input: {
    fontSize: 18,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  spacer: {
    flex: 1,
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
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
