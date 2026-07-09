import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store';
import { useTheme } from '../context/ThemeContext';
import * as db from '../db/service';
import { Card } from '../components/Card';

type TabType = 'gym' | 'food' | 'note';

export default function JournalScreen() {
  const { theme } = useTheme();
  const setSidebarOpen = useStore((s) => s.setSidebarOpen);
  const colors = theme.colors;
  const [tab, setTab] = useState<TabType>('note');
  const [gym, setGym] = useState({ name: '', exercises: '', duration: '', notes: '' });
  const [food, setFood] = useState({ meal: 'Breakfast', foods: '', calories: '', protein: '', notes: '' });
  const [note, setNote] = useState({ title: '', content: '', type: 'general' });
  const [recent, setRecent] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const loadRecent = useCallback(async () => {
    const entries = await db.getAllJournalEntries();
    setRecent(entries.slice(0, 10));
  }, []);

  useEffect(() => {
    loadRecent();
  }, [loadRecent]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      if (tab === 'gym') {
        if (!gym.name) return;
        await db.addGymLog({
          date: today,
          workout_name: gym.name,
          exercises: gym.exercises,
          duration_minutes: parseInt(gym.duration) || 0,
          notes: gym.notes,
        });
        setGym({ name: '', exercises: '', duration: '', notes: '' });
      } else if (tab === 'food') {
        if (!food.foods) return;
        await db.addNutritionLog({
          date: today,
          meal_type: food.meal,
          foods: food.foods,
          calories: parseInt(food.calories) || 0,
          protein_g: parseFloat(food.protein) || 0,
          carbs_g: 0,
          fat_g: 0,
          notes: food.notes,
        });
        setFood({ meal: 'Breakfast', foods: '', calories: '', protein: '', notes: '' });
      } else {
        if (!note.content) return;
        await db.addJournalEntry({
          date: today,
          title: note.title,
          content: note.content,
          type: note.type,
        });
        setNote({ title: '', content: '', type: 'general' });
      }
      await loadRecent();
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => setSidebarOpen(true)} style={styles.menuBtn}>
          <Feather name="menu" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Journal</Text>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 12, gap: 12, paddingBottom: 60 }}>
        <View style={[styles.tabRow, { gap: 6 }]}>
          {[
            { key: 'note' as const, label: 'Note', icon: '✏️' },
            { key: 'gym' as const, label: 'Gym', icon: '🏋️' },
            { key: 'food' as const, label: 'Food', icon: '🍽️' },
          ].map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[
                styles.pill,
                { backgroundColor: colors.bgSecondary, borderColor: colors.border },
                tab === t.key && { backgroundColor: colors.accentBg, borderColor: colors.accent },
              ]}
              onPress={() => setTab(t.key)}
            >
              <Text>{t.icon}</Text>
              <Text style={{ color: tab === t.key ? colors.accent : colors.text, fontWeight: tab === t.key ? '600' : '500' }}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'note' && (
          <Card title="New Entry" style={{ backgroundColor: colors.surface }}>
            <TextInput style={[styles.inp, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }]} placeholder="Title (optional)" placeholderTextColor={colors.placeholder} value={note.title} onChangeText={(v) => setNote({ ...note, title: v })} />
            <TextInput style={[styles.inp, styles.textarea, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }]} placeholder="What's on your mind?" placeholderTextColor={colors.placeholder} multiline value={note.content} onChangeText={(v) => setNote({ ...note, content: v })} />
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.accent }, saving && { opacity: 0.5 }]} onPress={handleSave} disabled={saving}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>{saving ? 'Saving...' : 'Save Entry'}</Text>
            </TouchableOpacity>
          </Card>
        )}

        {tab === 'gym' && (
          <Card title="Log Workout" style={{ backgroundColor: colors.surface }}>
            <TextInput style={[styles.inp, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }]} placeholder="Workout name (e.g. Push A)" placeholderTextColor={colors.placeholder} value={gym.name} onChangeText={(v) => setGym({ ...gym, name: v })} />
            <TextInput style={[styles.inp, styles.textarea, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }]} placeholder="Exercises" placeholderTextColor={colors.placeholder} multiline value={gym.exercises} onChangeText={(v) => setGym({ ...gym, exercises: v })} />
            <TextInput style={[styles.inp, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }]} placeholder="Duration (min)" placeholderTextColor={colors.placeholder} keyboardType="numeric" value={gym.duration} onChangeText={(v) => setGym({ ...gym, duration: v })} />
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.accent }, saving && { opacity: 0.5 }]} onPress={handleSave} disabled={saving}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>{saving ? 'Saving...' : 'Save Workout'}</Text>
            </TouchableOpacity>
          </Card>
        )}

        {tab === 'food' && (
          <Card title="Log Meal" style={{ backgroundColor: colors.surface }}>
            <View style={[styles.row, { gap: 6 }]}>
              {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.pill, { backgroundColor: colors.bgSecondary, borderColor: colors.border }, food.meal === m && { backgroundColor: colors.successBg, borderColor: colors.success }]}
                  onPress={() => setFood({ ...food, meal: m })}
                >
                  <Text style={{ fontSize: 12, color: food.meal === m ? colors.success : colors.text }}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={[styles.inp, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }]} placeholder="Foods" placeholderTextColor={colors.placeholder} value={food.foods} onChangeText={(v) => setFood({ ...food, foods: v })} />
            <View style={[styles.row, { gap: 6 }]}>
              <TextInput style={[styles.inp, { flex: 1, backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }]} placeholder="Calories" placeholderTextColor={colors.placeholder} keyboardType="numeric" value={food.calories} onChangeText={(v) => setFood({ ...food, calories: v })} />
              <TextInput style={[styles.inp, { flex: 1, backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }]} placeholder="Protein (g)" placeholderTextColor={colors.placeholder} keyboardType="numeric" value={food.protein} onChangeText={(v) => setFood({ ...food, protein: v })} />
            </View>
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.accent }, saving && { opacity: 0.5 }]} onPress={handleSave} disabled={saving}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>{saving ? 'Saving...' : 'Save Meal'}</Text>
            </TouchableOpacity>
          </Card>
        )}

        <Card title="Recent" style={{ backgroundColor: colors.surface }}>
          {recent.length === 0 ? (
            <Text style={{ color: colors.muted, fontSize: 13, textAlign: 'center', padding: 12 }}>No entries yet</Text>
          ) : (
            recent.map((e) => (
              <View key={e.id} style={[styles.recentRow, { borderBottomColor: colors.divider }]}>
                <Text style={{ color: colors.textTertiary, fontSize: 12 }}>{e.date}</Text>
                <Text style={{ color: colors.text, fontWeight: '600' }}>{e.title || e.workout_name || e.foods || 'Untitled'}</Text>
              </View>
            ))
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 48, borderBottomWidth: 1 },
  menuBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '600', marginLeft: 4 },
  tabRow: { flexDirection: 'row' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  inp: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, marginBottom: 8 },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  saveBtn: { padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 4 },
  row: { flexDirection: 'row' },
  recentRow: { paddingVertical: 8, borderBottomWidth: 1 },
});