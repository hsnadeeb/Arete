import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Alert,
  Modal, ActivityIndicator, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { Card } from '../components/Card';
import * as db from '../db/service';
import {
  PRAYER_NAMES, PRAYER_EMOJIS, PRAYER_DISPLAY, PRAYER_TIMES_ORDER,
  getNextPrayer, WIDGET_DEFINITIONS, WidgetLayout,
} from '../types';
import { getIslamicGreeting } from '../services/prayerApi';

const EXPENSE_CATEGORIES = [
  'Food', 'Transport', 'Shopping', 'Bills', 'Healthcare',
  'Learning', 'Entertainment', 'Savings', 'Other',
];
const CATEGORY_EMOJIS: Record<string, string> = {
  Food: '🍎', Transport: '🚇', Shopping: '🛍️', Bills: '📄',
  Healthcare: '💊', Learning: '📚', Entertainment: '🎬',
  Savings: '💰', Other: '📌',
};

function t12(time: string): string {
  if (!time) return '\u2014';
  const [h, m] = time.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return time;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

// ─── Individual Widget Components ───

function AtAGlanceWidget() {
  const { prayerTimings, islamicDate, timingsLoading, refreshPrayerTimings } = useApp();
  const nextPrayer = useMemo(() => {
    if (!prayerTimings) return null;
    return getNextPrayer({
      fajr: prayerTimings.fajr, dhuhr: prayerTimings.dhuhr,
      asr: prayerTimings.asr, maghrib: prayerTimings.maghrib, isha: prayerTimings.isha,
    });
  }, [prayerTimings]);

  return (
    <Card accentColor="#8b5cf6">
      {islamicDate && (
        <View style={styles.glanceRow}>
          <Text style={styles.hijriDate}>
            {islamicDate.hijriDate} {islamicDate.hijriMonth} {islamicDate.hijriYear} AH
          </Text>
          <Text style={styles.hijriDay}>
            {islamicDate.dayOfWeek || new Date().toLocaleDateString('en-US', { weekday: 'long' })}
          </Text>
        </View>
      )}
      {nextPrayer ? (
        <View style={styles.nextPrayerBox}>
          <Text style={styles.npLabel}>Next Prayer</Text>
          <Text style={styles.npName}>{nextPrayer.name}</Text>
          <Text style={styles.npTime}>
            at {t12(nextPrayer.time)} \u00B7 in <Text style={styles.npCountdown}>{nextPrayer.remaining}</Text>
          </Text>
        </View>
      ) : (
        <View style={styles.nextPrayerBox}>
          <Text style={styles.npLabel}>All prayers completed today</Text>
          <Text style={styles.npAlhamd}>\u0627\u0644\u062D\u0645\u062F \u0644\u0644\u0647 🤲</Text>
        </View>
      )}
      {prayerTimings && (
        <View style={styles.prayerStrip}>
          {PRAYER_TIMES_ORDER.filter(p => p !== 'sunrise').map(prayer => {
            const time = prayerTimings[prayer] as string;
            const isNext = nextPrayer?.name?.toLowerCase() === prayer;
            return (
              <View key={prayer} style={[styles.pStripItem, isNext && styles.pStripItemActive]}>
                <Text style={styles.pStripEmoji}>{PRAYER_EMOJIS[prayer]}</Text>
                <Text style={[styles.pStripLabel, isNext && styles.pStripLabelActive]}>
                  {PRAYER_DISPLAY[prayer]}
                </Text>
                <Text style={[styles.pStripTime, isNext && styles.pStripTimeActive]}>
                  {t12(time)}
                </Text>
              </View>
            );
          })}
        </View>
      )}
      {!prayerTimings && !timingsLoading && (
        <TouchableOpacity style={styles.refreshPrayerBtn} onPress={refreshPrayerTimings}>
          <Text style={styles.refreshPrayerBtnText}>{'\uD83D\uDCFF'} Load Prayer Timings</Text>
        </TouchableOpacity>
      )}
      {timingsLoading && <ActivityIndicator size="small" color="#8b5cf6" style={{ marginTop: 8 }} />}
    </Card>
  );
}

function QuickStatsWidget() {
  const { dailyLog } = useApp();
  const items = [
    { l: 'Weight', v: dailyLog?.weight ? `${dailyLog.weight} kg` : '\u2014', c: '#0b6bcf' },
    { l: 'Water', v: dailyLog?.water_ml ? `${(dailyLog.water_ml / 1000).toFixed(1)}L` : '\u2014', c: '#0ea5e9' },
    { l: 'Steps', v: dailyLog?.steps?.toLocaleString() || '\u2014', c: '#f59e0b' },
    { l: 'Mood', v: dailyLog?.mood ? `${'\u2022'.repeat(dailyLog.mood)}${'\u25CB'.repeat(5 - dailyLog.mood)}` : '\u2014', c: '#8b5cf6' },
  ];
  return (
    <Card accentColor="#0b6bcf">
      <View style={styles.statGrid}>
        {items.map(it => (
          <View key={it.l} style={styles.statTile}>
            <Text style={[styles.statValue, { color: it.c }]}>{it.v}</Text>
            <Text style={styles.statLabel}>{it.l}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

function QuickLogWidget() {
  const { dailyLog, logWeight, logWater, logSteps } = useApp();
  const [w, setW] = useState('');
  const [wa, setWa] = useState('');
  const [st, setSt] = useState('');
  const rows = [
    { l: '\u2696\uFE0F  Weight', v: w, s: setW, ph: 'kg', a: () => { const n = parseFloat(w); if (n > 0 && n < 300) { logWeight(n); setW(''); } }, b: 'Log' },
    { l: '💧  Water', v: wa, s: setWa, ph: 'ml', a: () => { const n = parseInt(wa); if (n > 0) { logWater((dailyLog?.water_ml || 0) + n); setWa(''); } }, b: 'Add' },
    { l: '🚶  Steps', v: st, s: setSt, ph: '0', a: () => { const n = parseInt(st); if (n > 0) { logSteps(n); setSt(''); } }, b: 'Set' },
  ];
  return (
    <Card accentColor="#0ea5e9">
      {rows.map(r => (
        <View key={r.l} style={styles.qlRow}>
          <Text style={styles.qlLabel}>{r.l}</Text>
          <View style={styles.qlInputRow}>
            <TextInput style={styles.qlInput} value={r.v} onChangeText={r.s} keyboardType="numeric" placeholder={r.ph} placeholderTextColor="#bbb" />
            <TouchableOpacity style={styles.qlBtn} onPress={r.a}><Text style={styles.qlBtnText}>{r.b}</Text></TouchableOpacity>
          </View>
        </View>
      ))}
    </Card>
  );
}

function MoodWidget() {
  const { dailyLog, logMood } = useApp();
  const moods = [
    { v: 1, e: '😢', l: 'Awful' }, { v: 2, e: '😟', l: 'Bad' },
    { v: 3, e: '😑', l: 'Meh' }, { v: 4, e: '🙂', l: 'Good' },
    { v: 5, e: '😊', l: 'Great' },
  ];
  return (
    <Card accentColor="#6366f1">
      <View style={styles.moodRow}>
        {moods.map(m => (
          <TouchableOpacity
            key={m.v}
            style={[styles.moodBtn, dailyLog?.mood === m.v && styles.moodActive]}
            onPress={() => logMood(m.v)}
          >
            <Text style={styles.moodEmoji}>{m.e}</Text>
            <Text style={[styles.moodLabel, dailyLog?.mood === m.v && styles.moodLabelActive]}>{m.l}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </Card>
  );
}

function ExpensesWidget() {
  const { addExpense, todayTransactions } = useApp();
  const [show, setShow] = useState(false);
  const [cat, setCat] = useState(EXPENSE_CATEGORIES[0]);
  const [amt, setAmt] = useState('');
  const [desc, setDesc] = useState('');
  const exps = (todayTransactions || []).filter((t: any) => t.type === 'expense');
  const total = exps.reduce((s: number, t: any) => s + t.amount, 0);
  const handleAdd = () => {
    const a = parseFloat(amt);
    if (!a || a <= 0) { Alert.alert('Invalid', 'Enter a valid amount.'); return; }
    addExpense(cat, a, desc || '');
    setAmt('');
    setDesc('');
    setShow(false);
  };
  return (
    <Card accentColor="#059669">
      <TouchableOpacity style={styles.addExpBtn} onPress={() => setShow(true)}>
        <Text style={styles.addExpBtnText}>{'\u2795'} New Expense</Text>
      </TouchableOpacity>
      {exps.length > 0 ? (
        <View>
          {exps.slice(0, 5).map((t: any, i: number) => (
            <View key={t.id || i} style={styles.expRow}>
              <Text style={styles.expCat}>{CATEGORY_EMOJIS[t.category]} {t.category}</Text>
              <Text style={styles.expDesc} numberOfLines={1}>{t.description}</Text>
              <Text style={styles.expAmt}>-${t.amount.toFixed(2)}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.expEmpty}>No expenses today</Text>
      )}
      <Modal visible={show} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShow(false)} />
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{'💰'} Add Expense</Text>
            <Text style={styles.label}>Category</Text>
            <View style={styles.catGrid}>
              {EXPENSE_CATEGORIES.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.catChip, cat === c && styles.catChipActive]}
                  onPress={() => setCat(c)}
                >
                  <Text style={styles.catIcon}>{CATEGORY_EMOJIS[c]}</Text>
                  <Text style={[styles.catLabel, cat === c && styles.catLabelActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Amount ($)</Text>
            <TextInput style={styles.modalInput} value={amt} onChangeText={setAmt} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor="#bbb" autoFocus />
            <Text style={styles.label}>Description</Text>
            <TextInput style={styles.modalInput} value={desc} onChangeText={setDesc} placeholder="What for?" placeholderTextColor="#bbb" />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShow(false)}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}><Text style={styles.saveBtnText}>Add Expense</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Card>
  );
}

function PrayerTrackerWidget() {
  const { prayers, prayerTimings, togglePrayer } = useApp();
  const count = prayers.filter(p => p.on_time).length;
  return (
    <Card accentColor="#f59e0b">
      <View style={styles.ptHeader}><Text style={styles.ptCount}>{count}/5</Text></View>
      <View style={styles.prayerGrid}>
        {PRAYER_NAMES.map(name => {
          const p = prayers.find(p => p.prayer_name === name);
          const done = p?.on_time === 1;
          const qada = p?.qada === 1;
          const tim = (prayerTimings as any)?.[name.toLowerCase()] as string | undefined;
          return (
            <TouchableOpacity
              key={name}
              style={[styles.pBtn, done && styles.pBtnDone, qada && !done && styles.pBtnQada]}
              onPress={() => togglePrayer(name)}
            >
              <Text style={styles.pBtnEmoji}>{PRAYER_EMOJIS[name.toLowerCase()]}</Text>
              <Text style={styles.pBtnName}>{name}</Text>
              {tim && <Text style={styles.pBtnTime}>{t12(tim)}</Text>}
              <Text style={styles.pBtnStatus}>{done ? '\u2705' : qada ? '\u23F3' : '\u25FB'}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </Card>
  );
}

function MonthlyStatsWidget() {
  const { monthlyStats } = useApp();
  if (!monthlyStats) return <Card accentColor="#d97706"><Text style={{ color: '#bbb', textAlign: 'center', padding: 8 }}>No data yet</Text></Card>;
  const items = [
    { l: 'Avg Weight', v: monthlyStats.avg_weight ? monthlyStats.avg_weight.toFixed(1) : '\u2014', c: '#0b6bcf' },
    { l: 'Avg Water', v: monthlyStats.avg_water ? `${(monthlyStats.avg_water / 1000).toFixed(1)}L` : '\u2014', c: '#0ea5e9' },
    { l: 'Avg Steps', v: monthlyStats.avg_steps ? Math.round(monthlyStats.avg_steps).toLocaleString() : '\u2014', c: '#f59e0b' },
    { l: 'Days Logged', v: monthlyStats.days_tracked, c: '#8b5cf6' },
  ];
  return (
    <Card accentColor="#d97706">
      <View style={styles.statGrid}>
        {items.map(it => (
          <View key={it.l} style={styles.statTile}>
            <Text style={[styles.statValue, { color: it.c }]}>{it.v}</Text>
            <Text style={styles.statLabel}>{it.l}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const WIDGET_MAP: Record<string, React.FC> = {
  'at-a-glance': AtAGlanceWidget,
  'quick-stats': QuickStatsWidget,
  'quick-log': QuickLogWidget,
  mood: MoodWidget,
  expenses: ExpensesWidget,
  'prayer-tracker': PrayerTrackerWidget,
  'monthly-stats': MonthlyStatsWidget,
};

// ─── Reorderable List ───

function ReorderableList({
  data, onReorder, renderItem, editing, contentContainerStyle,
}: {
  data: WidgetLayout[];
  onReorder: (items: WidgetLayout[]) => void;
  renderItem: (item: WidgetLayout, isActive: boolean) => React.ReactNode;
  editing: boolean;
  contentContainerStyle?: any;
}) {
  const moveUp = (index: number) => {
    if (index <= 0) return;
    const next = [...data];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onReorder(next.map((w, i) => ({ ...w, sort_order: i })));
  };

  const moveDown = (index: number) => {
    if (index >= data.length - 1) return;
    const next = [...data];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    onReorder(next.map((w, i) => ({ ...w, sort_order: i })));
  };

  return (
    <FlatList
      data={data}
      keyExtractor={item => item.widget_key}
      renderItem={({ item, index }) => (
        <View>
          {renderItem(item, false)}
          {editing && (
            <View style={styles.editControls}>
              <TouchableOpacity
                style={[styles.editArrow, index === 0 && styles.editArrowDisabled]}
                onPress={() => moveUp(index)}
                disabled={index === 0}
              >
                <Text style={[styles.editArrowText, index === 0 && styles.editArrowTextDisabled]}>▲</Text>
              </TouchableOpacity>
              <Text style={styles.editIndex}>{index + 1}</Text>
              <TouchableOpacity
                style={[styles.editArrow, index === data.length - 1 && styles.editArrowDisabled]}
                onPress={() => moveDown(index)}
                disabled={index === data.length - 1}
              >
                <Text style={[styles.editArrowText, index === data.length - 1 && styles.editArrowTextDisabled]}>▼</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
      contentContainerStyle={contentContainerStyle}
      style={{ flex: 1 }}
      showsVerticalScrollIndicator={false}
    />
  );
}

// ─── Main Dashboard Screen ───

export default function DashboardScreen() {
  const {
    loaded, streak, setSidebarOpen, refresh,
    widgetLayouts, setWidgetLayouts, saveWidgetLayouts,
  } = useApp();

  const [editing, setEditing] = useState(false);
  const greeting = useMemo(() => getIslamicGreeting(), []);
  const todayStr = useMemo(
    () => new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
    [],
  );
  const visible = useMemo(
    () => widgetLayouts.filter(w => w.visible).sort((a, b) => a.sort_order - b.sort_order),
    [widgetLayouts],
  );

  const handleReorder = useCallback((items: WidgetLayout[]) => {
    setWidgetLayouts(items.map((w, i) => ({ ...w, sort_order: i })));
  }, [setWidgetLayouts]);

  const exitEdit = () => { setEditing(false); saveWidgetLayouts(); };

  const renderCard = useCallback((item: WidgetLayout, _active: boolean) => {
    const Comp = WIDGET_MAP[item.widget_key];
    if (!Comp) return null;
    return (
      <View style={styles.cardWrap}>
        <Comp />
      </View>
    );
  }, []);

  // If data hasn't loaded yet, show a loading state
  if (!loaded) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.topbar}>
          <TouchableOpacity onPress={() => setSidebarOpen(true)} style={styles.menuBtn}>
            <Text style={styles.menuIcon}>{'\u2630'}</Text>
          </TouchableOpacity>
          <View style={styles.topCenter}>
            <Text style={styles.greeting}>Loading...</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // If no widgets configured yet, show an empty state
  if (visible.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.topbar}>
          <TouchableOpacity onPress={() => setSidebarOpen(true)} style={styles.menuBtn}>
            <Text style={styles.menuIcon}>{'\u2630'}</Text>
          </TouchableOpacity>
          <View style={styles.topCenter}>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.dateSmall}>{todayStr}</Text>
          </View>
          <TouchableOpacity onPress={refresh} style={styles.iconBtn}>
            <Text style={styles.iconBtnText}>{'🔄'}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>{'📊'}</Text>
          <Text style={styles.emptyTitle}>Welcome to your Dashboard</Text>
          <Text style={styles.emptySubtitle}>Tap refresh to load your data and start tracking.</Text>
          <TouchableOpacity style={styles.emptyRefreshBtn} onPress={refresh}>
            <Text style={styles.emptyRefreshBtnText}>{'🔄'} Refresh</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Top bar */}
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => setSidebarOpen(true)} style={styles.menuBtn}>
          <Text style={styles.menuIcon}>{'\u2630'}</Text>
        </TouchableOpacity>
        <View style={styles.topCenter}>
          {!editing ? (
            <>
              <Text style={styles.greeting}>{greeting}</Text>
              <Text style={styles.dateSmall}>{todayStr}</Text>
            </>
          ) : (
            <Text style={styles.editHint}>{'⬆️⬇️'} Use arrows to reorder</Text>
          )}
        </View>
        {!editing ? (
          <>
            <TouchableOpacity onPress={refresh} style={styles.iconBtn}>
              <Text style={styles.iconBtnText}>{'🔄'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setEditing(true)} style={styles.editBtn}>
              <Text style={styles.editBtnText}>{'\u270E'} Edit</Text>
            </TouchableOpacity>
            <View style={styles.streak}>
              <Text style={styles.streakText}>{'🔥'} {streak}</Text>
            </View>
          </>
        ) : (
          <TouchableOpacity onPress={exitEdit} style={styles.doneBtn}>
            <Text style={styles.doneBtnText}>{'\u2713'} Done</Text>
          </TouchableOpacity>
        )}
      </View>

      <ReorderableList
        data={visible}
        onReorder={handleReorder}
        renderItem={renderCard}
        editing={editing}
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8f9fa' },
  topbar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 56,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  menuBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  menuIcon: { fontSize: 20, color: '#37352f' },
  topCenter: { flex: 1, marginLeft: 10 },
  greeting: { fontSize: 14, fontWeight: '700', color: '#37352f' },
  dateSmall: { fontSize: 11, color: '#9b9a97', marginTop: 1 },
  editHint: { fontSize: 13, fontWeight: '600', color: '#6366f1' },
  iconBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  iconBtnText: { fontSize: 16 },
  editBtn: { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#f5f5f5', borderRadius: 8, marginRight: 8 },
  editBtnText: { fontSize: 12, fontWeight: '600', color: '#6366f1' },
  doneBtn: { paddingHorizontal: 14, paddingVertical: 7, backgroundColor: '#6366f1', borderRadius: 8 },
  doneBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  streak: { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#fef3c7', borderRadius: 12 },
  streakText: { fontSize: 12, fontWeight: '700', color: '#b45309' },

  // Loading state
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: '#9b9a97', fontWeight: '500' },

  // Empty state
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 8 },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#37352f', textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: '#9b9a97', textAlign: 'center', lineHeight: 20, marginBottom: 8 },
  emptyRefreshBtn: {
    marginTop: 12, backgroundColor: '#6366f1', paddingVertical: 12, paddingHorizontal: 24,
    borderRadius: 10,
  },
  emptyRefreshBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  cardWrap: { marginBottom: 12, position: 'relative' },

  // Edit controls (move up/down)
  editControls: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16,
    paddingVertical: 8, marginBottom: 12, backgroundColor: '#f5f3ff',
    borderRadius: 8, borderWidth: 1, borderColor: '#e0d9ff',
  },
  editArrow: {
    width: 36, height: 36, borderRadius: 8, backgroundColor: '#6366f1',
    alignItems: 'center', justifyContent: 'center',
  },
  editArrowDisabled: { backgroundColor: '#d0d0d0' },
  editArrowText: { fontSize: 16, color: '#fff', fontWeight: '700' },
  editArrowTextDisabled: { color: '#999' },
  editIndex: {
    fontSize: 13, fontWeight: '700', color: '#6366f1', minWidth: 20, textAlign: 'center',
  },

  // At a Glance
  glanceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  hijriDate: { fontSize: 14, fontWeight: '600', color: '#37352f' },
  hijriDay: { fontSize: 12, fontWeight: '500', color: '#8b5cf6' },
  nextPrayerBox: { backgroundColor: '#f5f3ff', borderRadius: 10, padding: 12, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: '#8b5cf6' },
  npLabel: { fontSize: 11, fontWeight: '600', color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: 0.4 },
  npName: { fontSize: 18, fontWeight: '700', color: '#37352f', marginTop: 2 },
  npTime: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  npCountdown: { fontWeight: '700', color: '#8b5cf6' },
  npAlhamd: { fontSize: 16, fontWeight: '600', color: '#059669', marginTop: 4 },
  prayerStrip: { flexDirection: 'row', gap: 6 },
  pStripItem: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8, backgroundColor: '#fafafa', borderWidth: 1, borderColor: '#f0f0f0' },
  pStripItemActive: { backgroundColor: '#f5f3ff', borderColor: '#8b5cf6' },
  pStripEmoji: { fontSize: 14, marginBottom: 2 },
  pStripLabel: { fontSize: 9, fontWeight: '600', color: '#9b9a97' },
  pStripLabelActive: { color: '#8b5cf6' },
  pStripTime: { fontSize: 10, fontWeight: '700', color: '#37352f', fontVariant: ['tabular-nums'] },
  pStripTimeActive: { color: '#8b5cf6' },
  refreshPrayerBtn: { paddingVertical: 10, borderRadius: 8, backgroundColor: '#f5f3ff', alignItems: 'center', marginTop: 4 },
  refreshPrayerBtnText: { fontSize: 13, fontWeight: '600', color: '#8b5cf6' },

  // Stats
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
  statTile: { alignItems: 'center', gap: 2 },
  statValue: { fontSize: 22, fontWeight: '700', color: '#37352f', letterSpacing: -0.3 },
  statLabel: { fontSize: 11, color: '#9b9a97', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },

  // Quick Log
  qlRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 8 },
  qlLabel: { fontSize: 13, fontWeight: '600', color: '#6b7280', width: 72 },
  qlInputRow: { flex: 1, flexDirection: 'row', gap: 8, alignItems: 'center' },
  qlInput: { flex: 1, height: 36, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 12, fontSize: 14, color: '#37352f', backgroundColor: '#fafafa' },
  qlBtn: { backgroundColor: '#0b6bcf', paddingHorizontal: 16, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  qlBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Mood
  moodRow: { flexDirection: 'row', gap: 8 },
  moodBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10, backgroundColor: '#f7f6f3', borderWidth: 1, borderColor: '#efefef' },
  moodActive: { backgroundColor: '#eef2ff', borderColor: '#6366f1' },
  moodEmoji: { fontSize: 22, marginBottom: 4 },
  moodLabel: { fontSize: 10, color: '#9b9a97', fontWeight: '600' },
  moodLabelActive: { color: '#6366f1', fontWeight: '700' },

  // Expenses
  addExpBtn: { backgroundColor: '#059669', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 10 },
  addExpBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  expRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f8f8f8' },
  expCat: { fontSize: 13, fontWeight: '600', color: '#37352f', width: 90 },
  expDesc: { fontSize: 12, color: '#9b9a97', flex: 1, marginHorizontal: 8 },
  expAmt: { fontSize: 13, fontWeight: '700', color: '#e03e3e' },
  expEmpty: { textAlign: 'center', color: '#bbb', fontSize: 13, paddingVertical: 12 },

  // Expense Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#37352f', marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', color: '#6b7280', marginBottom: 6, marginTop: 4 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  catChip: { flexDirection: 'row', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#f0f0f0' },
  catChipActive: { backgroundColor: '#f0fdf4', borderColor: '#059669' },
  catIcon: { fontSize: 14 },
  catLabel: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  catLabelActive: { color: '#059669' },
  modalInput: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#37352f', backgroundColor: '#fafafa', marginBottom: 14 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, backgroundColor: '#f5f5f5', alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#9b9a97' },
  saveBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, backgroundColor: '#059669', alignItems: 'center' },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  // Prayer Tracker
  ptHeader: { alignItems: 'flex-end', marginBottom: 8 },
  ptCount: { fontSize: 16, fontWeight: '700', color: '#f59e0b' },
  prayerGrid: { flexDirection: 'row', gap: 6 },
  pBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10, backgroundColor: '#f7f6f3', borderWidth: 1, borderColor: '#efefef' },
  pBtnDone: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  pBtnQada: { backgroundColor: '#fffbeb', borderColor: '#fde68a' },
  pBtnEmoji: { fontSize: 16, marginBottom: 2 },
  pBtnName: { fontSize: 10, fontWeight: '700', color: '#37352f' },
  pBtnTime: { fontSize: 8, color: '#9b9a97', marginTop: 1, fontVariant: ['tabular-nums'] },
  pBtnStatus: { fontSize: 14, marginTop: 4 },
});
