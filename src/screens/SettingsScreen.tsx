import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../components/Card';
import { useApp } from '../context/AppContext';
import { today, formatDate } from '../types';

export default function SettingsScreen() {
  const { setSidebarOpen, dailyLog, streak, monthlyStats } = useApp();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => setSidebarOpen(true)} style={styles.menuBtn}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile */}
        <Card title="Profile">
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>H</Text>
            </View>
            <View>
              <Text style={styles.profileName}>Hasan OS</Text>
              <Text style={styles.profileMeta}>Your Second Brain</Text>
            </View>
          </View>
        </Card>

        {/* Stats */}
        <Card title="Your Stats">
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Streak</Text>
            <Text style={styles.statValue}>🔥 {streak} days</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Today</Text>
            <Text style={styles.statValue}>{formatDate(today())}</Text>
          </View>
          {monthlyStats && (
            <>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Days logged this month</Text>
                <Text style={styles.statValue}>{monthlyStats.days_tracked}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Avg mood</Text>
                <Text style={styles.statValue}>{monthlyStats.avg_mood ? ` ${'•'.repeat(Math.round(monthlyStats.avg_mood))}${'○'.repeat(5 - Math.round(monthlyStats.avg_mood))}` : '—'}</Text>
              </View>
            </>
          )}
        </Card>

        {/* About */}
        <Card title="About">
          <Text style={styles.aboutText}>
            A minimal second brain for tracking life — weight, water, steps, mood, prayers, gym, food, budget, and more. All data lives on your device in SQLite.
          </Text>
          <Text style={styles.version}>v1.0 · Built with Expo</Text>
        </Card>
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
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 48 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#0b6bcf', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  profileName: { fontSize: 18, fontWeight: '600', color: '#37352f' },
  profileMeta: { fontSize: 13, color: '#9b9a97', marginTop: 2 },
  statRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
  },
  statLabel: { fontSize: 13, color: '#37352f' },
  statValue: { fontSize: 14, fontWeight: '600', color: '#37352f' },
  aboutText: { fontSize: 13, color: '#9b9a97', lineHeight: 20, marginBottom: 8 },
  version: { fontSize: 12, color: '#ccc', textAlign: 'center', marginTop: 8 },
});
