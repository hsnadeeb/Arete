import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import WelcomeScreen from './WelcomeScreen';
import NameScreen from './NameScreen';
import GoalsScreen from './GoalsScreen';
import BodyScreen from './BodyScreen';
import PreferencesScreen from './PreferencesScreen';
import DataRestoreScreen from './DataRestoreScreen';
import TrackerGoalsScreen from './TrackerGoalsScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initDatabase, getDb, resetDb, updateUserProfile, setTrackerTargets } from '../../db/service';

interface OnboardingData {
  name: string;
  goals: string[];
  body: {
    gender: string;
    dateOfBirth: string;
    heightCm: string;
    weightKg: string;
    targetWeightKg: string;
    activityLevel: string;
  };
  preferences: string[];
  trackerTargets: {
    steps_target: number;
    water_target: number;
    sleep_target: number;
    weight_target: number;
  };
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
      await initDatabase();
      const result = await getDb().getFirstAsync<any>('SELECT id FROM daily_logs LIMIT 1');

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
      await AsyncStorage.clear();

      try {
        const db = getDb();
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
        await db.execAsync('DROP TABLE IF EXISTS user_profile');
      } catch (e) {
        console.error('Error clearing database:', e);
      }

      // Reset the cached connection so initDatabase() reopens fresh
      resetDb();
      await initDatabase();

      console.log('All data cleared successfully');
    } catch (e) {
      console.error('Error clearing data:', e);
    }
  };

  const handleStartFresh = async () => {
    setShowRestorePopup(false);
    await clearAllData();
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

  const handleBodyNext = (body: OnboardingData['body']) => {
    setData(prev => ({ ...prev, body }));
    setStep(4);
  };

  const handleTrackerGoalsNext = (trackerTargets: { steps_target: number; water_target: number; sleep_target: number }) => {
    setData(prev => ({
      ...prev,
      trackerTargets: {
        ...trackerTargets,
        weight_target: prev.body?.targetWeightKg ? parseFloat(prev.body.targetWeightKg) : 75,
      },
    }));
    setStep(5);
  };

  const handlePreferencesComplete = async (preferences: string[]) => {
    const finalData: OnboardingData = {
      name: data.name || '',
      goals: data.goals || [],
      body: data.body || { gender: '', dateOfBirth: '', heightCm: '', weightKg: '', targetWeightKg: '', activityLevel: 'moderate' },
      preferences,
      trackerTargets: data.trackerTargets || { steps_target: 10000, water_target: 3000, sleep_target: 8, weight_target: 75 },
    };

    // Save to AsyncStorage
    await AsyncStorage.setItem('onboarding_completed', 'true');
    await AsyncStorage.setItem('user_name', finalData.name);
    await AsyncStorage.setItem('user_goals', JSON.stringify(finalData.goals));
    await AsyncStorage.setItem('user_preferences', JSON.stringify(finalData.preferences));
    await AsyncStorage.setItem('fresh_install', 'false');

    // Persist profile to DB
    try {
      await initDatabase();
      await updateUserProfile({
        name: finalData.name,
        gender: finalData.body.gender,
        date_of_birth: finalData.body.dateOfBirth,
        height_cm: finalData.body.heightCm ? parseFloat(finalData.body.heightCm) : 0,
        weight_kg: finalData.body.weightKg ? parseFloat(finalData.body.weightKg) : 0,
        target_weight_kg: finalData.body.targetWeightKg ? parseFloat(finalData.body.targetWeightKg) : 0,
        activity_level: finalData.body.activityLevel,
        goals: JSON.stringify(finalData.goals),
        preferences: JSON.stringify(finalData.preferences),
      });
      // Save tracker targets to DB
      await setTrackerTargets(finalData.trackerTargets);
    } catch (e) {
      console.error('Failed to save profile to DB:', e);
    }

    onComplete(finalData);
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  if (!dataChecked) {
    return null;
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
            return <BodyScreen onNext={handleBodyNext} onBack={handleBack} />;
          case 4:
            return <TrackerGoalsScreen onNext={handleTrackerGoalsNext} onBack={handleBack} />;
          case 5:
            return <PreferencesScreen onNext={handlePreferencesComplete} onBack={handleBack} />;
          default:
            return <WelcomeScreen onNext={() => setStep(1)} />;
        }
      })()}
    </>
  );
}
