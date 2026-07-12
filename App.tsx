import 'react-native-gesture-handler';
import React, { useState, useEffect, useCallback } from 'react';

// Strip console logs in release builds to reduce JS thread noise
if (!__DEV__) {
  console.log = () => {};
  console.info = () => {};
  console.warn = () => {};
  console.error = () => {};
}

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from './src/context/ThemeContext';
import { AppProvider, useAppContext } from './src/context/AppContext';
import DrawerNavigator from './src/navigation/DrawerNavigator';
import OnboardingFlow from './src/screens/onboarding/OnboardingFlow';
import AsyncStorage from '@react-native-async-storage/async-storage';

function AppContent() {
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const { forceRehydrate } = useAppContext();

  const checkOnboardingStatus = useCallback(async () => {
    try {
      const completed = await AsyncStorage.getItem('onboarding_completed');
      setIsOnboarded(completed === 'true');
    } catch (e) {
      setIsOnboarded(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkOnboardingStatus();
  }, [checkOnboardingStatus]);

  const handleOnboardingComplete = useCallback((data: any) => {
    setOnboardingComplete(true);
    setIsOnboarded(true);
    // Force rehydration after onboarding completes
    setTimeout(() => {
      forceRehydrate();
    }, 100);
  }, [forceRehydrate]);

  if (loading || isOnboarded === null) {
    return null; // Or show a loading spinner
  }

  if (!isOnboarded) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  return <DrawerNavigator />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <ThemeProvider>
            <StatusBar style="auto" />
            <AppContent />
          </ThemeProvider>
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
