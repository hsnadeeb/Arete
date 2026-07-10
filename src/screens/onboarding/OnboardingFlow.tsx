import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import WelcomeScreen from './WelcomeScreen';
import NameScreen from './NameScreen';
import GoalsScreen from './GoalsScreen';
import PreferencesScreen from './PreferencesScreen';
import DataRestoreScreen from './DataRestoreScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';
import { getDb, initDatabase } from '../../db/service';

interface OnboardingData {
  name: string;
  goals: string[];
  preferences: string[];
}

export default function OnboardingFlow({ onComplete }: { onComplete: (data: OnboardingData) => void }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Partial<OnboardingData>>({});
  const [showRestorePopup, setShowRestorePopup] = useState(false);
  const [hasOldData, setHasOldData] = useState(false);
  const [dataChecked, setDataChecked] = useState(false);

  useEffect(() => {
    checkForExistingData();
  }, []);

  const checkForExistingData = async () => {
    try {
      // Check if database has any data
      const db = await SQLite.openDatabaseAsync('hasan-os.db');
      const result = await db.getFirstAsync<any>('SELECT id FROM daily_logs LIMIT 1');
      await db.closeAsync();

      if (result) {
        setHasOldData(true);
        setShowRestorePopup(true);
      }
    } catch (e) {
      console.error('Error checking for existing data:', e);
    } finally {
      setDataChecked(true);
    }
  };

  const clearAllData = async () => {
    try {
      // Clear AsyncStorage
      await AsyncStorage.clear();

      // Delete and recreate database
      try {
        const db = await SQLite.openDatabaseAsync('hasan-os.db');
        await db.execAsync('DROP TABLE IF EXISTS daily_logs');
        await db.execAsync('DROP TABLE IF EXISTS prayer_logs');
        await db.execAsync('DROP TABLE IF EXISTS gym_logs');
        await db.execAsync('DROP TABLE IF EXISTS nutrition_logs');
        await db.execAsync('DROP TABLE IF EXISTS transactions');
        await db.execAsync('DROP TABLE IF EXISTS timetable');
        await db.execAsync('DROP TABLE IF EXISTS habits');
        await db.execAsync('DROP TABLE IF EXISTS dashboard_widgets');
        await db.execAsync('DROP TABLE IF EXISTS prayer_timings');
        await db.execAsync('DROP TABLE IF EXISTS focus_sessions');
        await db.closeAsync();
      } catch (e) {
        console.error('Error clearing database:', e);
      }

      // Reinitialize database with fresh schema
      await initDatabase();

      console.log('All data cleared successfully');
    } catch (e) {
      console.error('Error clearing data:', e);
    }
  };

  const handleStartFresh = async () => {
    setShowRestorePopup(false);
    await clearAllData();
    // Reset the db reference in the service module
    const { resetDb } = await import('../../db/service');
    if (resetDb) resetDb();
    setStep(0);
  };

  const handleKeepData = () => {
    setShowRestorePopup(false);
    setStep(0);
  };

  const handleNameNext = (name: string) => {
    setData(prev => ({ ...prev, name }));
    setStep(2);
  };

  const handleGoalsNext = (goals: string[]) => {
    setData(prev => ({ ...prev, goals }));
    setStep(3);
  };

  const handlePreferencesComplete = async (preferences: string[]) => {
    const finalData: OnboardingData = {
      name: data.name || '',
      goals: data.goals || [],
      preferences,
    };

    // Save onboarding completion
    await AsyncStorage.setItem('onboarding_completed', 'true');
    await AsyncStorage.setItem('user_name', finalData.name);
    await AsyncStorage.setItem('user_goals', JSON.stringify(finalData.goals));
    await AsyncStorage.setItem('user_preferences', JSON.stringify(finalData.preferences));
    await AsyncStorage.setItem('fresh_install', 'false'); // Mark that fresh setup is complete

    onComplete(finalData);
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  if (!dataChecked) {
    return null; // Loading state
  }

  return (
    <>
      <DataRestoreScreen
        visible={showRestorePopup}
        hasOldData={hasOldData}
        onStartFresh={handleStartFresh}
        onKeepData={handleKeepData}
      />
      {(() => {
        switch (step) {
          case 0:
            return <WelcomeScreen onNext={() => setStep(1)} />;
          case 1:
            return <NameScreen onNext={handleNameNext} onBack={handleBack} />;
          case 2:
            return <GoalsScreen onNext={handleGoalsNext} onBack={handleBack} />;
          case 3:
            return <PreferencesScreen onNext={handlePreferencesComplete} onBack={handleBack} />;
          default:
            return <WelcomeScreen onNext={() => setStep(1)} />;
        }
      })()}
    </>
  );
}
