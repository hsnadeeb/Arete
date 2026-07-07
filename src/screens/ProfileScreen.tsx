import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import * as db from '../db/service';
import { DAY_NAMES, PRAYER_NAMES } from '../types';

interface Section {
  key: string;
  label: string;
  icon: string;
  color: string;
  fetch: () => Promise<any[]>;
  deleteFn: (id: number) => Promise<void>;
  renderItem: (item: any) => string;
  renderDetail: (item: any) => string[];
}

const SECTIONS: Section[] = [
  { key: 'daily', label: 'Daily Logs', icon: '📋', color: '#0b6bcf', fetch: db.getAllDailyLogs, deleteFn: db.deleteDailyLogById,
    renderItem: i => i.date, renderDetail: i => [
      i.weight ? `Weight: ${i.weight} kg` : '', i.water_ml ? `Water: ${i.water_ml}ml` : '',
      i.steps ? `Steps: ${i.steps}` : '', i.mood ? `Mood: ${i.mood}/5` : '',
      i.sleep_hours ? `Sleep: ${i.sleep_hours}h` : '',
    ].filter(Boolean) },
  { key: 'prayers', label: 'Prayer Logs', icon: '🕌', color: '#8b5cf6', fetch: db.getAllPrayers, deleteFn: db.deletePrayerById,
    renderItem: i => `${i.date} · ${i.prayer_name}`, renderDetail: i => [
      i.on_time ? 'On time' : i.qada ? 'Qada' : 'Missed',
    ] },
  { key: 'gym', label: 'Gym Logs', icon: '🏋️', color: '#e03e3e', fetch: db.getAllGymLogs, deleteFn: db.deleteGymLogById,
    renderItem: i => `${i.date} · ${i.workout_name}`, renderDetail: i => [
      i.duration_minutes ? `${i.duration_minutes} min` : '', i.exercises || '',
    ].filter(Boolean) },
  { key: 'nutrition', label: 'Nutrition Logs', icon: '🍽️', color: '#0a8c2e', fetch: db.getAllNutritionLogs, deleteFn: db.deleteNutritionLogById,
    renderItem: i => `${i.date} · ${i.meal_type}`, renderDetail: i => [
      i.calories ? `${i.calories} kcal` : '', i.protein_g ? `${i.protein_g}g protein` : '',
    ].filter(Boolean) },
  { key: 'transactions', label: 'Transactions', icon: '💰', color: '#d9730d', fetch: db.getAllTransactions, deleteFn: db.deleteTransactionById,
    renderItem: i => `${i.date} · ${i.category}`, renderDetail: i => [
      `${i.type === 'income' ? '+' : '-'}$${Math.abs(i.amount).toFixed(2)}`,
      i.description || '',
    ].filter(Boolean) },
  { key: 'schedule', label: 'Schedule', icon: '📅', color: '#6366f1', fetch: db.getAllTimetable, deleteFn: db.deleteTimetableItem,
    renderItem: i => `${i.start_time}${i.end_time ? '-' + i.end_time : ''} ${i.activity}`,
    renderDetail: i => [DAY_NAMES[i.day_of_week] || '', i.repeat_type === 'once' ? `Once: ${i.specific_date}` : i.repeat_type || 'Weekly'].filter(Boolean) },
  { key: 'habits', label: 'Habits', icon: '✅', color: '#0891b2', fetch: db.getHabits, deleteFn: db.deleteHabitById,
    renderItem: i => i.name, renderDetail: i => [
      i.emoji || '', i.target_per_day ? `${i.target_per_day}${i.unit ? ' ' + i.unit : ''}/day` : '',
    ].filter(Boolean) },
  { key: 'habitLogs', label: 'Habit Logs', icon: '📊', color: '#0ea5e9', fetch: db.getHabitLogs, deleteFn: db.deleteHabitLogById,
    renderItem: i => `Habit #${i.habit_id} · ${i.date}`, renderDetail: i => [`Count: ${i.count}`] },
  { key: 'journal', label: 'Journal Entries', icon: '📝', color: '#d9730d', fetch: db.getAllJournalEntries, deleteFn: db.deleteJournalEntryById,
    renderItem: i => `${i.date} · ${i.title || 'Untitled'}`, renderDetail: i => [
      i.type || 'general', i.content ? i.content.substring(0, 60) + (i.content.length > 60 ? '...' : '') : '',
    ].filter(Boolean) },
  { key: 'goals', label: 'Goals', icon: '🎯', color: '#e03e3e', fetch: db.getGoals, deleteFn: db.deleteGoalById,
    renderItem: i => i.title, renderDetail: i => [
      i.target_value ? `${i.current_value || 0} / ${i.target_value} ${i.unit || ''}` : '',
      i.area || '',
    ].filter(Boolean) },
  { key: 'budgetCats', label: 'Budget Categories', icon: '🏷️', color: '#0a8c2e', fetch: db.getBudgetCategories, deleteFn: db.deleteBudgetCategoryById,
    renderItem: i => `${i.icon || '💰'} ${i.name}`, renderDetail: i => [
      i.monthly_budget ? `Budget: $${i.monthly_budget}` : '',
    ].filter(Boolean) },
];

export default function ProfileScreen() {
  const { setSidebarOpen } = useApp();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [data, setData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const toggle = useCallback(async (key: string) => {
    if (expanded === key) { setExpanded(null); return; }
    setExpanded(key);
    if (!data[key]) {
      setLoading(p => ({ ...p, [key]: true }));
      const section = SECTIONS.find(s => s.key === key);
      if (section) {
        const items = await section.fetch();
        setData(p => ({ ...p, [key]: items }));
      }
      setLoading(p => ({ ...p, [key]: false }));
    }
  }, [expanded, data]);

  const removeItem = useCallback(async (sectionKey: string, id: number) => {
    const section = SECTIONS.find(s => s.key === sectionKey);
    if (!section) return;
    await section.deleteFn(id);
    setData(p => ({
      ...p,
      [sectionKey]: (p[sectionKey] || []).filter((item: any) => item.id !== id),
    }));
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => setSidebarOpen(true)} style={styles.menuBtn}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>My Data</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageDesc}>
          All your data in one place. Tap a category to view items, tap ✕ to delete.
        </Text>

        {SECTIONS.map(section => (
          <View key={section.key} style={styles.card}>
            <TouchableOpacity style={styles.cardHeader} onPress={() => toggle(section.key)} activeOpacity={0.7}>
              <View style={[styles.cardIcon, { backgroundColor: section.color + '18' }]}>
                <Text style={styles.cardIconText}>{section.icon}</Text>
              </View>
              <Text style={styles.cardLabel}>{section.label}</Text>
              <View style={[styles.countBadge, { backgroundColor: section.color }]}>
                <Text style={styles.countBadgeText}>
                  {data[section.key] !== undefined ? data[section.key].length : '?'}
                </Text>
              </View>
              <Text style={styles.arrow}>{expanded === section.key ? '▾' : '▸'}</Text>
            </TouchableOpacity>

            {expanded === section.key && (
              <View style={styles.cardBody}>
                {loading[section.key] ? (
                  <ActivityIndicator size="small" color="#ccc" style={{ margin: 16 }} />
                ) : !data[section.key] || data[section.key].length === 0 ? (
                  <Text style={styles.emptyText}>No entries</Text>
                ) : (
                  data[section.key].map((item: any) => (
                    <View key={item.id} style={styles.itemRow}>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemTitle} numberOfLines={1}>{section.renderItem(item)}</Text>
                        {section.renderDetail(item).map((line, i) => (
                          line ? <Text key={i} style={styles.itemDetail} numberOfLines={2}>{line}</Text> : null
                        ))}
                      </View>
                      <TouchableOpacity
                        style={styles.deleteItemBtn}
                        onPress={() => removeItem(section.key, item.id)}
                      >
                        <Text style={styles.deleteItemBtnText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>
            )}
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fafafa' },
  scroll: { flex: 1 },
  topbar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 48,
    backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#efefef',
  },
  menuBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  menuIcon: { fontSize: 18, color: '#9b9a97' },
  topTitle: { fontSize: 16, fontWeight: '600', color: '#37352f', marginLeft: 4, flex: 1 },
  pageDesc: {
    fontSize: 13, color: '#b3b3af', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6, lineHeight: 18,
  },
  card: {
    marginHorizontal: 16, marginTop: 8, backgroundColor: '#ffffff',
    borderRadius: 12, borderWidth: 1, borderColor: '#efefef', overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 14, gap: 10,
  },
  cardIcon: {
    width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  cardIconText: { fontSize: 16 },
  cardLabel: { fontSize: 14, fontWeight: '600', color: '#37352f', flex: 1 },
  countBadge: {
    paddingHorizontal: 9, paddingVertical: 2, borderRadius: 12,
  },
  countBadgeText: {
    fontSize: 12, fontWeight: '700', color: '#ffffff',
  },
  arrow: { fontSize: 14, color: '#cccccc', width: 16, textAlign: 'center' },
  cardBody: {
    borderTopWidth: 1, borderTopColor: '#f5f5f5',
  },
  emptyText: {
    fontSize: 13, color: '#d0d0d0', textAlign: 'center', paddingVertical: 20, fontWeight: '500',
  },
  itemRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#f5f5f5',
  },
  itemInfo: { flex: 1, marginRight: 8 },
  itemTitle: { fontSize: 13, fontWeight: '600', color: '#37352f' },
  itemDetail: { fontSize: 11, color: '#b3b3af', marginTop: 1, lineHeight: 15 },
  deleteItemBtn: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#fef2f2',
    alignItems: 'center', justifyContent: 'center',
  },
  deleteItemBtnText: { fontSize: 12, color: '#e03e3e', fontWeight: '600' },
});
