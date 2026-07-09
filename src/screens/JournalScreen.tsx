import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store';
import { useTheme } from '../context/ThemeContext';
import * as db from '../db/service';
import { Card } from '../components/Card';
import { generateAiProgram } from '../services/ai';

type TabType = 'gym' | 'food' | 'note';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

  const [gymProgram, setGymProgram] = useState<any>(null);
  const [foodProgram, setFoodProgram] = useState<any>(null);
  const [generating, setGenerating] = useState(false);

  const loadRecent = useCallback(async () => {
    const entries = await db.getAllJournalEntries();
    setRecent(entries.slice(0, 10));
  }, []);

  const loadPrograms = useCallback(async () => {
    const gp = await db.getActiveAiProgram('gym');
    setGymProgram(gp ? await db.getAiProgramWithItems(gp.id) : null);
    const fp = await db.getActiveAiProgram('food');
    setFoodProgram(fp ? await db.getAiProgramWithItems(fp.id) : null);
  }, []);

  useEffect(() => {
    loadRecent();
    loadPrograms();
  }, [loadRecent, loadPrograms]);

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

  const handleGenerateProgram = async (type: 'gym' | 'food') => {
    setGenerating(true);
    try {
      const result = await generateAiProgram(type);
      if (type === 'gym') {
        const gp = await db.getActiveAiProgram('gym');
        setGymProgram(gp ? await db.getAiProgramWithItems(gp.id) : null);
      } else {
        const fp = await db.getActiveAiProgram('food');
        setFoodProgram(fp ? await db.getAiProgramWithItems(fp.id) : null);
      }
      Alert.alert('Program Generated', `Your weekly ${type === 'gym' ? 'workout' : 'meal'} program has been created.`);
    } catch (e: any) {
      Alert.alert('Generation Failed', e.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleItem = async (itemId: number, currentStatus: number) => {
    await db.toggleAiProgramItem(itemId, currentStatus ? 0 : 1);
    if (gymProgram) {
      const updated = await db.getAiProgramWithItems(gymProgram.id);
      setGymProgram(updated);
    }
    if (foodProgram) {
      const updated = await db.getAiProgramWithItems(foodProgram.id);
      setFoodProgram(updated);
    }
  };

  const handleRegenerate = (type: 'gym' | 'food') => {
    Alert.alert(
      'Regenerate Program',
      'This will replace your current weekly program. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Regenerate', onPress: () => handleGenerateProgram(type) },
      ]
    );
  };

  const getTodayIndex = () => new Date().getDay();

  const renderProgram = (type: 'gym' | 'food') => {
    const program = type === 'gym' ? gymProgram : foodProgram;
    const label = type === 'gym' ? 'Workout' : 'Meal';
    if (!program) return null;

    const todayIdx = getTodayIndex();
    return (
      <Card title={`Weekly ${label} Program`} style={{ backgroundColor: colors.surface, borderLeftColor: colors.accent, borderLeftWidth: 3 }}>
        <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 8, fontWeight: '500' }}>
          {program.week_start} → {program.week_end}
        </Text>
        {program.items.map((item: any) => {
          const isToday = item.day_index === todayIdx;
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.programItem,
                { borderBottomColor: colors.divider },
                isToday && { backgroundColor: colors.accentBg },
              ]}
              onPress={() => handleToggleItem(item.id, item.is_completed)}
            >
              <View style={[styles.checkbox, item.is_completed ? { backgroundColor: colors.success, borderColor: colors.success } : { borderColor: colors.border }]}>
                {item.is_completed ? <Feather name="check" size={12} color="#fff" /> : null}
              </View>
              <View style={{ flex: 1 }}>
                <View style={[styles.row, { alignItems: 'center', gap: 6 }]}>
                  <Text style={[styles.dayBadge, { backgroundColor: isToday ? colors.accent : colors.bgTertiary, color: isToday ? '#fff' : colors.textTertiary }]}>
                    {DAY_NAMES[item.day_index]}
                  </Text>
                  <Text style={[styles.itemTitle, { color: colors.text }, item.is_completed && { textDecorationLine: 'line-through', color: colors.muted }]}>
                    {item.title}
                  </Text>
                </View>
                {item.description ? (
                  <Text style={{ color: colors.textTertiary, fontSize: 12, marginTop: 4, lineHeight: 18 }} numberOfLines={3}>
                    {item.description}
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </Card>
    );
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
          <>
            {renderProgram('gym')}

            <Card title="AI Workout Program" style={{ backgroundColor: colors.surface }}>
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 12, lineHeight: 20 }}>
                Generate a personalized weekly workout program based on your gym history, daily logs, and goals.
              </Text>
              <View style={[styles.row, { gap: 8 }]}>
                <TouchableOpacity
                  style={[styles.generateBtn, { backgroundColor: colors.accent, flex: 1 }, generating && { opacity: 0.5 }]}
                  onPress={() => handleGenerateProgram('gym')}
                  disabled={generating}
                >
                  {generating ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Feather name="zap" size={14} color="#fff" />
                      <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>Generate Weekly</Text>
                    </>
                  )}
                </TouchableOpacity>
                {gymProgram && (
                  <TouchableOpacity
                    style={[styles.generateBtn, { backgroundColor: colors.warningBg }]}
                    onPress={() => handleRegenerate('gym')}
                    disabled={generating}
                  >
                    <Feather name="refresh-cw" size={14} color={colors.warning} />
                    <Text style={{ color: colors.warning, fontWeight: '600', fontSize: 13 }}>Regenerate</Text>
                  </TouchableOpacity>
                )}
              </View>
            </Card>

            <Card title="Log Workout" style={{ backgroundColor: colors.surface }}>
              <TextInput style={[styles.inp, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }]} placeholder="Workout name (e.g. Push A)" placeholderTextColor={colors.placeholder} value={gym.name} onChangeText={(v) => setGym({ ...gym, name: v })} />
              <TextInput style={[styles.inp, styles.textarea, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }]} placeholder="Exercises" placeholderTextColor={colors.placeholder} multiline value={gym.exercises} onChangeText={(v) => setGym({ ...gym, exercises: v })} />
              <TextInput style={[styles.inp, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }]} placeholder="Duration (min)" placeholderTextColor={colors.placeholder} keyboardType="numeric" value={gym.duration} onChangeText={(v) => setGym({ ...gym, duration: v })} />
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.accent }, saving && { opacity: 0.5 }]} onPress={handleSave} disabled={saving}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>{saving ? 'Saving...' : 'Save Workout'}</Text>
              </TouchableOpacity>
            </Card>
          </>
        )}

        {tab === 'food' && (
          <>
            {renderProgram('food')}

            <Card title="AI Meal Plan" style={{ backgroundColor: colors.surface }}>
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 12, lineHeight: 20 }}>
                Generate a personalized weekly meal plan based on your nutrition history, daily logs, and goals.
              </Text>
              <View style={[styles.row, { gap: 8 }]}>
                <TouchableOpacity
                  style={[styles.generateBtn, { backgroundColor: colors.accent, flex: 1 }, generating && { opacity: 0.5 }]}
                  onPress={() => handleGenerateProgram('food')}
                  disabled={generating}
                >
                  {generating ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Feather name="zap" size={14} color="#fff" />
                      <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>Generate Weekly</Text>
                    </>
                  )}
                </TouchableOpacity>
                {foodProgram && (
                  <TouchableOpacity
                    style={[styles.generateBtn, { backgroundColor: colors.warningBg }]}
                    onPress={() => handleRegenerate('food')}
                    disabled={generating}
                  >
                    <Feather name="refresh-cw" size={14} color={colors.warning} />
                    <Text style={{ color: colors.warning, fontWeight: '600', fontSize: 13 }}>Regenerate</Text>
                  </TouchableOpacity>
                )}
              </View>
            </Card>

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
          </>
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
  generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12, borderRadius: 10 },
  programItem: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, gap: 10, alignItems: 'flex-start' },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  dayBadge: { fontSize: 10, fontWeight: '700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' },
  itemTitle: { fontSize: 14, fontWeight: '500', flexShrink: 1 },
});
