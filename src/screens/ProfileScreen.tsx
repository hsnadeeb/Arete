import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store';
import { useTheme } from '../context/ThemeContext';
import * as db from '../db/service';
import { DAY_NAMES } from '../types';
import { exportToFile, shareBackup, importFromJSON } from '../services/exportImport';

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
    renderItem: (i) => i.date, renderDetail: (i) => [i.weight ? `Weight: ${i.weight} kg` : '', i.water_ml ? `Water: ${i.water_ml}ml` : '', i.steps ? `Steps: ${i.steps}` : '', i.mood ? `Mood: ${i.mood}/5` : '', i.sleep_hours ? `Sleep: ${i.sleep_hours}h` : ''].filter(Boolean) },
  { key: 'prayers', label: 'Prayer Logs', icon: '🕌', color: '#8b5cf6', fetch: db.getAllPrayers, deleteFn: db.deletePrayerById,
    renderItem: (i) => `${i.date} · ${i.prayer_name}`, renderDetail: (i) => [i.on_time ? 'On time' : i.qada ? 'Qada' : 'Missed'] },
  { key: 'gym', label: 'Gym Logs', icon: '🏋️', color: '#e03e3e', fetch: db.getAllGymLogs, deleteFn: db.deleteGymLogById,
    renderItem: (i) => `${i.date} · ${i.workout_name}`, renderDetail: (i) => [i.duration_minutes ? `${i.duration_minutes} min` : '', i.exercises || ''].filter(Boolean) },
  { key: 'nutrition', label: 'Nutrition Logs', icon: '🍽️', color: '#0a8c2e', fetch: db.getAllNutritionLogs, deleteFn: db.deleteNutritionLogById,
    renderItem: (i) => `${i.date} · ${i.meal_type}`, renderDetail: (i) => [i.calories ? `${i.calories} kcal` : '', i.protein_g ? `${i.protein_g}g protein` : ''].filter(Boolean) },
  { key: 'transactions', label: 'Transactions', icon: '💰', color: '#d9730d', fetch: db.getAllTransactions, deleteFn: db.deleteTransactionById,
    renderItem: (i) => `${i.date} · ${i.category}`, renderDetail: (i) => [`${i.type === 'income' ? '+' : '-'}$${Math.abs(i.amount).toFixed(2)}`, i.description || ''].filter(Boolean) },
  { key: 'habits', label: 'Habits', icon: '✅', color: '#0891b2', fetch: db.getHabits, deleteFn: db.deleteHabitById,
    renderItem: (i) => i.name, renderDetail: (i) => [i.emoji || '', i.target_per_day ? `${i.target_per_day}${i.unit ? ' ' + i.unit : ''}/day` : ''].filter(Boolean) },
  { key: 'journal', label: 'Journal Entries', icon: '📝', color: '#d9730d', fetch: db.getAllJournalEntries, deleteFn: db.deleteJournalEntryById,
    renderItem: (i) => `${i.date} · ${i.title || 'Untitled'}`, renderDetail: (i) => [i.type || 'general', i.content ? i.content.substring(0, 60) + (i.content.length > 60 ? '...' : '') : ''].filter(Boolean) },
];

export default function ProfileScreen() {
  const { theme } = useTheme();
  const setSidebarOpen = useStore((s) => s.setSidebarOpen);
  const refresh = useStore((s) => s.refresh);
  const colors = theme.colors;
  const [expanded, setExpanded] = useState<string | null>(null);
  const [data, setData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const toggle = useCallback(async (key: string) => {
    if (expanded === key) { setExpanded(null); return; }
    setExpanded(key);
    if (!data[key]) {
      setLoading((p) => ({ ...p, [key]: true }));
      const section = SECTIONS.find((s) => s.key === key);
      if (section) {
        const items = await section.fetch();
        setData((p) => ({ ...p, [key]: items }));
      }
      setLoading((p) => ({ ...p, [key]: false }));
    }
  }, [expanded, data]);

  const removeItem = useCallback(async (sectionKey: string, id: number) => {
    const section = SECTIONS.find((s) => s.key === sectionKey);
    if (!section) return;
    await section.deleteFn(id);
    setData((p) => ({ ...p, [sectionKey]: (p[sectionKey] || []).filter((item: any) => item.id !== id) }));
  }, []);

  const handleExport = async () => {
    const ok = await exportToFile();
    if (!ok) Alert.alert('Export failed', 'Try again later');
  };

  const handleShare = async () => {
    const ok = await shareBackup();
    if (!ok) Alert.alert('Share failed', 'Try again later');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => setSidebarOpen(true)}>
          <Feather name="menu" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>My Data</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontSize: 13, color: colors.textTertiary, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 }}>
          All your data in one place. Tap a category to view items, tap ✕ to delete.
        </Text>

        <View style={[styles.actionRow, { paddingHorizontal: 16, marginBottom: 8 }]}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.accentBg }]} onPress={handleExport}>
            <Feather name="download" size={14} color={colors.accent} />
            <Text style={{ color: colors.accent, fontWeight: '600', fontSize: 12 }}>Export</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.successBg }]} onPress={handleShare}>
            <Feather name="share-2" size={14} color={colors.success} />
            <Text style={{ color: colors.success, fontWeight: '600', fontSize: 12 }}>Share</Text>
          </TouchableOpacity>
        </View>

        {SECTIONS.map((section) => (
          <View key={section.key} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity style={styles.cardHeader} onPress={() => toggle(section.key)} activeOpacity={0.7}>
              <View style={[styles.cardIcon, { backgroundColor: section.color + '18' }]}>
                <Text style={{ fontSize: 16 }}>{section.icon}</Text>
              </View>
              <Text style={[styles.cardLabel, { color: colors.text }]}>{section.label}</Text>
              <View style={[styles.countBadge, { backgroundColor: section.color }]}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>{data[section.key] !== undefined ? data[section.key].length : '?'}</Text>
              </View>
              <Text style={{ fontSize: 14, color: colors.muted, width: 16, textAlign: 'center' }}>{expanded === section.key ? '▾' : '▸'}</Text>
            </TouchableOpacity>

            {expanded === section.key && (
              <View style={[styles.cardBody, { borderTopColor: colors.divider }]}>
                {loading[section.key] ? (
                  <ActivityIndicator size="small" color={colors.muted} style={{ margin: 16 }} />
                ) : !data[section.key] || data[section.key].length === 0 ? (
                  <Text style={{ fontSize: 13, color: colors.muted, textAlign: 'center', paddingVertical: 20, fontWeight: '500' }}>No entries</Text>
                ) : (
                  data[section.key].map((item: any) => (
                    <View key={item.id} style={[styles.itemRow, { borderBottomColor: colors.divider }]}>
                      <View style={styles.itemInfo}>
                        <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={1}>{section.renderItem(item)}</Text>
                        {section.renderDetail(item).map((line, i) => <Text key={i} style={[styles.itemDetail, { color: colors.textTertiary }]} numberOfLines={2}>{line}</Text>)}
                      </View>
                      <TouchableOpacity style={[styles.deleteItemBtn, { backgroundColor: colors.errorBg }]} onPress={() => removeItem(section.key, item.id)}>
                        <Text style={{ fontSize: 12, color: colors.error, fontWeight: '600' }}>✕</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 48, borderBottomWidth: 1 },
  title: { fontSize: 16, fontWeight: '600', marginLeft: 4, flex: 1 },
  actionRow: { flexDirection: 'row', gap: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  card: { marginHorizontal: 16, marginTop: 8, borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 14, gap: 10 },
  cardIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardLabel: { fontSize: 14, fontWeight: '600', flex: 1 },
  countBadge: { paddingHorizontal: 9, paddingVertical: 2, borderRadius: 12 },
  cardBody: { borderTopWidth: 1 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  itemInfo: { flex: 1, marginRight: 8 },
  itemTitle: { fontSize: 13, fontWeight: '600' },
  itemDetail: { fontSize: 11, marginTop: 1, lineHeight: 15 },
  deleteItemBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});