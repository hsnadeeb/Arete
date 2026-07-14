import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, Keyboard } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { TYPOGRAPHY, LUCIDE_ICONS } from '../../constants/typography';
import { Icon } from '../../components/Icons';
import { OnboardingLayout, OnboardingIcon, OnboardingInput } from './OnboardingComponents';

export default function NameScreen({ onNext, onBack }: { onNext: (name: string) => void; onBack: () => void }) {
  const { theme } = useTheme();
  const tc = theme.colors;
  const [name, setName] = useState('');
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  const handleNext = () => {
    if (name.trim()) {
      Keyboard.dismiss();
      onNext(name.trim());
    }
  };

  const isValid = name.trim().length >= 2;

  return (
    <OnboardingLayout
      step={1}
      totalSteps={6}
      title="What's your name?"
      subtitle="Let's get to know you better"
      onNext={handleNext}
      onBack={onBack}
      nextDisabled={!isValid}
      nextLabel="Next"
      backLabel="Back"
    >
      <View style={styles.headerWrapper}>
        <OnboardingIcon
          name="user"
          size={32}
          variant="primary"
          containerStyle={styles.headerIcon}
        />
      </View>

      <View style={styles.inputWrapper}>
        <OnboardingInput
          ref={inputRef}
          value={name}
          onChangeText={setName}
          placeholder="Enter your name"
          onSubmitEditing={handleNext}
          autoFocus={true}
          maxLength={30}
          fontSize={24}
          textAlign="center"
          helperText="At least 2 characters"
        />
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  headerWrapper: {
    alignItems: 'center',
    marginBottom: 8,
  },
  headerIcon: {},
  inputWrapper: {
    alignItems: 'center',
    width: '100%',
  },
  input: {
    fontSize: 24,
    fontWeight: '500',
    padding: 20,
    borderRadius: 16,
    textAlign: 'center',
    letterSpacing: 0.2,
    width: '100%',
    minWidth: 280,
  },
  charCount: {
    alignSelf: 'flex-end',
    marginTop: 8,
    paddingRight: 4,
  },
  charCountText: {
    ...TYPOGRAPHY.captionSm,
  },
  hint: {
    marginTop: 12,
    alignItems: 'center',
  },
  hintText: {
    ...TYPOGRAPHY.captionSm,
  },
});

import { StyleSheet } from 'react-native';