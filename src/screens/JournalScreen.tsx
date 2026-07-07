import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { Card } from '../components/Card';
import { today, formatDate } from '../types';
import * as db from '../db/service';

type TabType = 'gym' | 'food' | 'note';

export default function JournalScreen() {
  const { setSidebarOpen } = useApp();
  const [tab, setTab] = useState<TabType>('gym');

  // Gym state
  const [gymLogs, setGymLogs] = useState<any[]>([]);
  const [gymName, setGymName] = useState('');
  const [gymDuration, setGymDuration] = useState('');
  const [gymExercises, setGymExercises] = useState('');

  // Food state
  const [foodLogs, setFoodLogs] = useState<any[]>([]);
  const [mealType, setMealType] = useState('');
  const [foods, setFoods] = useState('');
  const [calories, setCalories] = useState('');

  // Note state
  const [notes, setNotes] = useState<any[]>([]);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  useEffect(() => {
    loadTab(tab);
  }, [tab]);

  const loadTab = async (t: TabType) => {
    if (t === 'gym') {
      const logs = await db.getGymLogs(today());
      setGymLogs(logs);
    } else if (t === 'food') {
      const logs = await db.getNutritionLogs(today());
      setFoodLogs(logs);
    } else {
      const entries = await db.getJournalEntries(today());
      setNotes(entries);
    }
  };

  const addGym = async () => {
    if (!gymName) return;
    await db.addGymLog({
      date: today(), workout_name: gymName,
      exercises: gymExercises, duration_minutes: parseInt(gymDuration) || 0,
    });
    setGymName(''); setGymDuration(''); setGymExercises('');
    loadTab('gym');
  };

  const addFood = async () => {
    if (!foods) return;
    await db.addNutritionLog({
      date: today(), meal_type: mealType || 'Snack',
      foods, calories: parseInt(calories) || 0, protein_g: 0, carbs_g: 0, fat_g: 0,
    });
    setFoods(''); setCalories(''); setMealType('');
    loadTab('food');
  };

  const addNote = async () => {
    if (!noteContent) return;
    await db.addJournalEntry({
      date: today(), title: noteTitle, content: noteContent, type: 'general',
    });
    setNoteTitle(''); setNoteContent('');
    loadTab('note');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => setSidebarOpen(true)} style={styles.menuBtn}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>Journal</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['gym', 'food', 'note'] as TabType[]).map(t => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'gym' ? '🏋️ Gym' : t === 'food' ? '🥗 Food' : '📝 Notes'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {tab === 'gym' && (
          <>
            <Card title="Log Workout">
              <TextInput style={styles.input} value={gymName} onChangeText={setGymName} placeholder="Workout name (e.g. Push A)" placeholderTextColor="#ccc" />
              <View style={styles.row}>
                <TextInput style={[styles.input, { flex: 1 }]} value={gymDuration} onChangeText={setGymDuration} keyboardType="numeric" placeholder="Duration (min)" placeholderTextColor="#ccc" />
              </View>
              <TextInput style={[styles.input, styles.multiline]} value={gymExercises} onChangeText={setGymExercises} multiline placeholder="Exercises (one per line)" placeholderTextColor="#ccc" />
              <TouchableOpacity style={styles.addBtn} onPress={addGym}><Text style={styles.addBtnText}>Save Workout</Text></TouchableOpacity>
            </Card>
            {gymLogs.map((log, i) => (
              <Card key={log.id || i} title={log.workout_name}>
                <Text style={styles.logMeta}>{log.duration_minutes} min</Text>
                {log.exercises ? <Text style={styles.logContent}>{log.exercises}</Text> : null}
              </Card>
            ))}
          </>
        )}

        {tab === 'food' && (
          <>
            <Card title="Log Meal">
              <View style={styles.mealRow}>
                {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(m => (
                  <TouchableOpacity key={m} style={[styles.mealBtn, mealType === m && styles.mealActive]} onPress={() => setMealType(m)}>
                    <Text style={[styles.mealText, mealType === m && styles.mealTextActive]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput style={[styles.input, styles.multiline]} value={foods} onChangeText={setFoods} multiline placeholder="What did you eat?" placeholderTextColor="#ccc" />
              <TextInput style={styles.input} value={calories} onChangeText={setCalories} keyboardType="numeric" placeholder="Calories (optional)" placeholderTextColor="#ccc" />
              <TouchableOpacity style={styles.addBtn} onPress={addFood}><Text style={styles.addBtnText}>Save Meal</Text></TouchableOpacity>
            </Card>
            {foodLogs.map((log, i) => (
              <Card key={log.id || i} title={log.meal_type}>
                <Text style={styles.logContent}>{log.foods}</Text>
                {log.calories > 0 ? <Text style={styles.logMeta}>{log.calories} kcal</Text> : null}
              </Card>
            ))}
          </>
        )}

        {tab === 'note' && (
          <>
            <Card title="Quick Note">
              <TextInput style={styles.input} value={noteTitle} onChangeText={setNoteTitle} placeholder="Title (optional)" placeholderTextColor="#ccc" />
              <TextInput style={[styles.input, styles.multiline, { minHeight: 100 }]} value={noteContent} onChangeText={setNoteContent} multiline placeholder="Write your thoughts..." placeholderTextColor="#ccc" />
              <TouchableOpacity style={styles.addBtn} onPress={addNote}><Text style={styles.addBtnText}>Save Note</Text></TouchableOpacity>
            </Card>
            {notes.map((n, i) => (
              <Card key={n.id || i} title={n.title || 'Note'}>
                <Text style={styles.logContent}>{n.content}</Text>
              </Card>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fafafa' },
  topbar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 48,
    backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#efefef',
  },
  menuBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  menuIcon: { fontSize: 18, color: '#9b9a97' },
  topTitle: { fontSize: 16, fontWeight: '600', color: '#37352f', marginLeft: 4 },
  tabs: {
    flexDirection: 'row', backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#efefef',
    paddingHorizontal: 16,
  },
  tab: { paddingVertical: 12, paddingHorizontal: 16, marginRight: 4 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#0b6bcf' },
  tabText: { fontSize: 14, color: '#9b9a97', fontWeight: '500' },
  tabTextActive: { color: '#0b6bcf', fontWeight: '600' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 48 },
  input: {
    borderWidth: 1, borderColor: '#efefef', borderRadius: 8, paddingHorizontal: 12,
    paddingVertical: 10, fontSize: 14, color: '#37352f', backgroundColor: '#fafafa',
    marginBottom: 8,
  },
  multiline: { minHeight: 60, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 8 },
  addBtn: {
    backgroundColor: '#0b6bcf', paddingVertical: 12, borderRadius: 8,
    alignItems: 'center', marginTop: 4,
  },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  logMeta: { fontSize: 12, color: '#9b9a97', marginTop: 4 },
  logContent: { fontSize: 14, color: '#37352f', lineHeight: 20 },
  mealRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  mealBtn: {
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16,
    backgroundColor: '#f7f6f3', borderWidth: 1, borderColor: '#efefef',
  },
  mealActive: { backgroundColor: '#e0f2fe', borderColor: '#0b6bcf' },
  mealText: { fontSize: 12, color: '#9b9a97', fontWeight: '500' },
  mealTextActive: { color: '#0b6bcf', fontWeight: '600' },
});
