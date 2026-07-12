import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Icon } from '../components/Icons';
import { LUCIDE_ICONS, TYPOGRAPHY } from '../constants/typography';
import { DAY_NAMES } from '../types';
import * as db from '../db/service';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const COLORS = ['#6366f1','#0b6bcf','#e03e3e','#0a8c2e','#d9730d','#0ea5e9','#8b5cf6','#0891b2'];

const HOUR_HEIGHT = 56;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function parseHour(s: string): number {
  const [h, m] = s.split(':').map(Number);
  return h + (m || 0) / 60;
}

function dateKey(d: Date) {
  return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`;
}
function dayName(d: Date) {
  return DAY_NAMES[d.getDay()];
}
function isSameDay(a: Date, b: Date) {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
}
function toDateStr(y: number, m: number, d: number) {
  return `${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
}
function fromDateStr(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m, d);
}

function getYTDates(): string[] {
  const n = new Date();
  const y = new Date(n); y.setDate(y.getDate() - 1);
  const t = new Date(n); t.setDate(t.getDate() + 1);
  return [
    toDateStr(y.getFullYear(), y.getMonth(), y.getDate()),
    toDateStr(n.getFullYear(), n.getMonth(), n.getDate()),
    toDateStr(t.getFullYear(), t.getMonth(), t.getDate()),
  ];
}

export default function PlannerScreen() {
  const { setSidebarOpen } = useApp();
  const { theme, isDark } = useTheme();
  const c = theme.colors;
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDates, setSelectedDates] = useState<string[]>(getYTDates());
  const [timetable, setTimetable] = useState<any[]>([]);

  // Modal state
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [modalDay, setModalDay] = useState(now.getDay());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [activity, setActivity] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [itemColor, setItemColor] = useState(COLORS[0]);
  const [repeatType, setRepeatType] = useState('weekly');
  const [specificDate, setSpecificDate] = useState('');

  const headerScrollRef = useRef<ScrollView>(null);
  const gridScrollRef = useRef<ScrollView>(null);
  const syncScrollRef = useRef<'header' | 'grid' | null>(null);
  const scrollXRef = useRef(0);

  useEffect(() => { db.getAllTimetable().then(setTimetable); }, []);

  const todayStr = toDateStr(now.getFullYear(), now.getMonth(), now.getDate());

  const sortedDates = useMemo(
    () => [...selectedDates].sort(),
    [selectedDates],
  );

  const weeks = useMemo(() => {
    const first = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const n = new Date();
    const cells: any[] = [];
    for (let i = 0; i < first; i++) cells.push({ day: 0, month, year, isCurrent: false, isToday: false });
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        day: d, month, year, isCurrent: true,
        isToday: d === n.getDate() && month === n.getMonth() && year === n.getFullYear(),
      });
    }
    // pad trailing cells so the last row has 7 columns
    const trailing = (7 - (cells.length % 7)) % 7;
    for (let i = 0; i < trailing; i++) cells.push({ day: 0, month, year, isCurrent: false, isToday: false });
    const w: any[][] = [];
    for (let i = 0; i < cells.length; i += 7) w.push(cells.slice(i, i + 7));
    return w;
  }, [year, month]);

  const navigate = (dir: number) => {
    let m = month + dir;
    let y = year;
    if (m < 0) { m = 11; y--; } else if (m > 11) { m = 0; y++; }
    setMonth(m); setYear(y);
  };

  const goToday = () => {
    const n = new Date();
    setYear(n.getFullYear()); setMonth(n.getMonth());
    setSelectedDates(getYTDates());
  };

  const toggleDate = (y: number, m: number, d: number) => {
    const key = toDateStr(y, m, d);
    setSelectedDates(prev => {
      if (prev.includes(key)) {
        const next = prev.filter(k => k !== key);
        return next.length === 0 ? prev : next;
      }
      return [...prev, key];
    });
  };

  const getSchedule = (date: Date) => {
    const ds = toDateStr(date.getFullYear(), date.getMonth(), date.getDate());
    const dayOfWeek = date.getDay();
    return timetable.filter((t: any) => {
      if (t.repeat_type === 'once') return t.specific_date === ds;
      if (t.repeat_type === 'daily') return true;
      return t.day_of_week === dayOfWeek;
    }).sort((a: any, b: any) => a.start_time.localeCompare(b.start_time));
  };

  const isToday = (ds: string) => ds === todayStr;

  // ─── Add ───
  const openAdd = (dayOfWeek: number, hour?: number, dateStr?: string) => {
    setModalMode('add');
    setEditingId(null);
    setModalDay(dayOfWeek);
    setActivity('');
    if (hour !== undefined) {
      const hh = hour.toString().padStart(2, '0');
      setStartTime(`${hh}:00`);
      setEndTime(`${hh}:30`);
    } else {
      setStartTime('');
      setEndTime('');
    }
    setItemColor(COLORS[0]);
    setRepeatType('weekly');
    setSpecificDate(dateStr || '');
  };

  const addItem = async () => {
    if (!activity || !startTime) return;
    await db.addTimetableItem({
      day_of_week: modalDay, start_time: startTime,
      end_time: endTime, activity, color: itemColor,
      repeat_type: repeatType,
      specific_date: repeatType === 'once' ? specificDate : '',
    });
    setModalMode(null);
    db.getAllTimetable().then(setTimetable);
  };

  // ─── Edit ───
  const openEdit = (item: any) => {
    setModalMode('edit');
    setEditingId(item.id);
    setModalDay(item.day_of_week);
    setActivity(item.activity);
    setStartTime(item.start_time);
    setEndTime(item.end_time || '');
    setItemColor(item.color || COLORS[0]);
    setRepeatType(item.repeat_type || 'weekly');
    setSpecificDate(item.specific_date || '');
  };

  const saveEdit = async () => {
    if (!editingId || !activity || !startTime) return;
    await db.updateTimetableItem(editingId, {
      day_of_week: modalDay, start_time: startTime,
      end_time: endTime, activity, color: itemColor,
      repeat_type: repeatType,
      specific_date: repeatType === 'once' ? specificDate : '',
    });
    setModalMode(null);
    db.getAllTimetable().then(setTimetable);
  };

  const deleteItem = async () => {
    if (!editingId) return;
    await db.deleteTimetableItem(editingId);
    setModalMode(null);
    db.getAllTimetable().then(setTimetable);
  };

  // Theme-mapped color tokens (keep original hex as fallback for light mode)
  const T = {
    bg: isDark ? c.bg : '#fafafa',
    surface: isDark ? c.surface : '#ffffff',
    surfaceAlt: isDark ? c.bgSecondary : '#ffffff',
    border: isDark ? c.border : '#efefef',
    borderSoft: isDark ? c.divider : '#f5f5f5',
    borderCalendar: isDark ? c.borderLight : '#f0f0f0',
    borderEmpty: isDark ? c.border : '#e0e0e0',
    textPrimary: isDark ? c.heading : '#37352f',
    textSecondary: isDark ? c.textTertiary : '#9b9a97',
    textMuted: isDark ? c.textTertiary : '#b3b3af',
    textInverse: '#ffffff',
    accent: isDark ? c.accent : '#0b6bcf',
    accentSoft: isDark ? c.accentBg : '#e8f0fe',
    placeholder: isDark ? c.placeholder : '#ccc',
    empty: isDark ? c.muted : '#cccccc',
    error: isDark ? c.error : '#e03e3e',
    errorBg: isDark ? c.errorBg : '#fee2e2',
    modalOverlay: 'rgba(0,0,0,0.3)',
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: T.bg }]} edges={['top']}>
      <View style={[styles.topbar, { backgroundColor: T.surface, borderBottomColor: T.border }]}>
        <TouchableOpacity onPress={() => setSidebarOpen(true)} style={styles.menuBtn}>
          <Icon name={LUCIDE_ICONS.menu} size={18} color={T.textSecondary} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: T.textPrimary }]}>Calendar</Text>
        <TouchableOpacity style={[styles.todayBtn, { backgroundColor: T.borderSoft }]} onPress={goToday}>
          <Text style={[styles.todayBtnText, { color: T.accent }]}>Today</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ─── Month Header ─── */}
        <View style={[styles.monthHeader, { backgroundColor: T.surface, borderBottomColor: T.borderSoft }]}>
            <TouchableOpacity onPress={() => navigate(-1)} style={[styles.navBtn, { backgroundColor: T.borderSoft }]}>
              <Icon name={LUCIDE_ICONS.chevronLeft} size={16} color={T.textPrimary} />
            </TouchableOpacity>
          <Text style={[styles.monthTitle, { color: T.textPrimary }]}>{MONTHS[month]} {year}</Text>
            <TouchableOpacity onPress={() => navigate(1)} style={[styles.navBtn, { backgroundColor: T.borderSoft }]}>
              <Icon name={LUCIDE_ICONS.chevronRight} size={16} color={T.textPrimary} />
            </TouchableOpacity>
        </View>

        {/* ─── Day Names ─── */}
        <View style={[styles.dayNames, { backgroundColor: T.surface }]}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <View key={`dn-${i}`} style={styles.dayNameCell}><Text style={[styles.dayNameText, { color: T.textMuted }]}>{d}</Text></View>
          ))}
        </View>

        {/* ─── Calendar Grid (Multi-Select) ─── */}
        <View style={[styles.calGrid, { backgroundColor: T.surface }]}>
          {weeks.map((week, wi) => (
            <View key={wi} style={styles.weekRow}>
              {week.map((cell, ci) => {
                const ds = cell.day > 0 ? toDateStr(cell.year, cell.month, cell.day) : '';
                const isSel = ds !== '' && selectedDates.includes(ds);
                const isT = cell.isToday;
                return (
                  <TouchableOpacity
                    key={`${wi}-${ci}`}
                    style={[styles.calCell, !cell.isCurrent && styles.calCellDimmed]}
                    onPress={() => { if (cell.isCurrent) toggleDate(cell.year, cell.month, cell.day); }}
                    disabled={!cell.isCurrent}
                    activeOpacity={cell.isCurrent ? 0.7 : 1}
                  >
                    {cell.day > 0 ? (
                      <>
                        <View style={[
                          styles.calDayNum,
                          isT && { backgroundColor: T.accent },
                          isSel && !isT && { backgroundColor: T.accentSoft },
                        ]}>
                          <Text style={[
                            styles.calDayNumText,
                            { color: T.textPrimary },
                            isT && { color: T.textInverse, fontWeight: '600' },
                            isSel && !isT && { color: T.accent, fontWeight: '600' },
                          ]}>
                            {cell.day}
                          </Text>
                        </View>
                        {timetable.filter((t: any) => t.day_of_week === new Date(cell.year, cell.month, cell.day).getDay()).length > 0 && (
                          <View style={styles.dotRow}><View style={[styles.dot, { backgroundColor: T.accent }]} /></View>
                        )}
                      </>
                    ) : (
                      <View style={styles.calDayNum} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* ─── Google Calendar-style Schedule ─── */}
        {sortedDates.length > 0 && (
          <View style={styles.calSection}>
            {/* Day headers */}
            <View style={styles.calDayHeaders}>
              <View style={styles.calGutter} />
              <ScrollView
                horizontal
                ref={headerScrollRef}
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled
                scrollEventThrottle={16}
                onScroll={(e) => {
                  const x = e.nativeEvent.contentOffset.x;
                  if (syncScrollRef.current !== 'header') {
                    syncScrollRef.current = 'grid';
                    scrollXRef.current = x;
                    gridScrollRef.current?.scrollTo({ x, animated: false });
                  }
                }}
                onMomentumScrollEnd={() => { syncScrollRef.current = null; }}
                onScrollEndDrag={() => { syncScrollRef.current = null; }}
              >
                <View style={styles.calDayHeadersRow}>
                  {sortedDates.map(ds => {
                    const date = fromDateStr(ds);
                    const isT = isToday(ds);
                    return (
                      <TouchableOpacity
                        key={ds}
                        style={styles.calDayHeader}
                        onPress={() => setSelectedDates(prev => prev.filter(k => k !== ds))}
                      >
                        <Text style={[styles.calDayHeaderLabel, { color: T.textPrimary }, isT && { color: T.accent }]}>
                          {isT ? 'Today' : dateKey(date)}
                        </Text>
                        <Text style={[styles.calDayHeaderSub, { color: T.textMuted }]}>{dayName(date)}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            {/* Time grid (no nested vertical scroll — main page handles it) */}
            <View style={styles.calGridRow}>
              {/* Time gutter */}
              <View style={styles.calGutter}>
                {HOURS.map(h => (
                  <View key={h} style={styles.calGutterSlot}>
                    <Text style={[styles.calGutterSlotText, { color: T.textMuted }]}>
                      {h.toString().padStart(2, '0')}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Day columns */}
              <ScrollView
                horizontal
                ref={gridScrollRef}
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled
                scrollEventThrottle={16}
                onScroll={(e) => {
                  const x = e.nativeEvent.contentOffset.x;
                  if (syncScrollRef.current !== 'grid') {
                    syncScrollRef.current = 'header';
                    scrollXRef.current = x;
                    headerScrollRef.current?.scrollTo({ x, animated: false });
                  }
                }}
                onMomentumScrollEnd={() => { syncScrollRef.current = null; }}
                onScrollEndDrag={() => { syncScrollRef.current = null; }}
              >
                <View style={styles.calDaysRow}>
                  {sortedDates.map((ds, di) => {
                    const date = fromDateStr(ds);
                    const schedule = getSchedule(date);
                    return (
                        <View key={ds} style={[styles.calDayCol, { backgroundColor: T.surface }, di < sortedDates.length - 1 && { borderRightColor: T.borderCalendar }]}>
                          {/* Hour grid lines — tap to add at that hour */}
                          {HOURS.map(h => (
                            <TouchableOpacity
                              key={h}
                              style={[styles.calHourSlot, { borderTopColor: T.borderCalendar }]}
                              onPress={() => openAdd(date.getDay(), h, ds)}
                              activeOpacity={0.4}
                            />
                          ))}

                        {/* Events */}
                        {schedule.map((item: any) => {
                          const startF = parseHour(item.start_time);
                          const endF = item.end_time ? parseHour(item.end_time) : startF + 1;
                          return (
                            <TouchableOpacity
                              key={item.id}
                              style={[styles.calEvent, {
                                top: startF * HOUR_HEIGHT,
                                height: Math.max((endF - startF) * HOUR_HEIGHT, 24),
                                backgroundColor: item.color || '#6366f1',
                              }]}
                              onPress={() => openEdit(item)}
                              activeOpacity={0.8}
                            >
                              <Text style={styles.calEventTime}>{item.start_time}</Text>
                              <Text style={styles.calEventTitle} numberOfLines={2}>{item.activity}</Text>
                            </TouchableOpacity>
                          );
                        })}

                        {/* Empty state */}
                        {schedule.length === 0 && (
                          <TouchableOpacity
                            style={[styles.calEmptyBtn, { top: 4 * HOUR_HEIGHT, borderColor: T.borderEmpty }]}
                            onPress={() => openAdd(date.getDay())}
                          >
                            <Text style={[styles.calEmptyBtnText, { color: T.empty }]}>+</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ─── FAB: Add Event ─── */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          const lastDs = sortedDates[sortedDates.length - 1] || todayStr;
          openAdd(fromDateStr(lastDs).getDay());
        }}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* ─── Add / Edit Modal ─── */}
      <Modal visible={modalMode !== null} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: T.modalOverlay }]}>
          {/* Tap outside the modal to close */}
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setModalMode(null)} />
          <View style={[styles.modal, { backgroundColor: T.surface }]} onStartShouldSetResponder={() => true}>
            <Text style={[styles.modalTitle, { color: T.textPrimary }]}>
              {modalMode === 'add' ? 'New Event' : 'Edit Event'} · {DAY_NAMES[modalDay]}
            </Text>

            <TextInput
              style={[styles.modalInput, { borderColor: T.border, color: T.textPrimary, backgroundColor: T.bg }]}
              value={activity}
              onChangeText={setActivity}
              placeholder="Activity"
              placeholderTextColor={T.placeholder}
              autoFocus
            />

            <View style={styles.modalRow}>
              <TextInput
                style={[styles.modalInput, { flex: 1, borderColor: T.border, color: T.textPrimary, backgroundColor: T.bg }]}
                value={startTime}
                onChangeText={setStartTime}
                placeholder="Start (09:00)"
                placeholderTextColor={T.placeholder}
              />
              <TextInput
                style={[styles.modalInput, { flex: 1, borderColor: T.border, color: T.textPrimary, backgroundColor: T.bg }]}
                value={endTime}
                onChangeText={setEndTime}
                placeholder="End (10:00)"
                placeholderTextColor={T.placeholder}
              />
            </View>

            <View style={styles.colorRow}>
              {COLORS.map(c2 => (
                <TouchableOpacity
                  key={c2}
                  style={[styles.colorDot, { backgroundColor: c2 }, itemColor === c2 && { borderColor: T.textPrimary }]}
                  onPress={() => setItemColor(c2)}
                />
              ))}
            </View>

            {/* Repeat type */}
            <View style={styles.repeatRow}>
              {['weekly', 'daily', 'once'].map(r => (
                <TouchableOpacity
                  key={r}
                  style={[styles.repeatBtn, { backgroundColor: T.borderSoft }, repeatType === r && { backgroundColor: T.accentSoft }]}
                  onPress={() => setRepeatType(r)}
                >
                  <Text style={[styles.repeatBtnText, { color: T.textSecondary }, repeatType === r && { color: T.accent }]}>
                    {r === 'weekly' ? 'Weekly' : r === 'daily' ? 'Daily' : 'Once'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {repeatType === 'once' && (
              <TextInput
                style={[styles.modalInput, { borderColor: T.border, color: T.textPrimary, backgroundColor: T.bg }]}
                value={specificDate}
                onChangeText={setSpecificDate}
                placeholder="Date (YYYY-MM-DD)"
                placeholderTextColor={T.placeholder}
              />
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: T.borderSoft }]} onPress={() => setModalMode(null)}>
                <Text style={[styles.cancelBtnText, { color: T.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>

              {modalMode === 'edit' && (
                <TouchableOpacity style={[styles.deleteBtn, { backgroundColor: T.errorBg }]} onPress={deleteItem}>
                  <Text style={[styles.deleteBtnText, { color: T.error }]}>Delete</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: T.accent }]}
                onPress={modalMode === 'add' ? addItem : saveEdit}
              >
                <Text style={[styles.saveBtnText, { color: T.textInverse }]}>{modalMode === 'add' ? 'Add' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  topbar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 48,
    borderBottomWidth: 1,
  },
  menuBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  menuIcon: { fontSize: 18 },
  topTitle: { fontSize: 16, fontWeight: '600', marginLeft: 4, flex: 1 },
  todayBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  todayBtnText: { fontSize: 13, fontWeight: '600' },

  // ─── Month ───
  monthHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1,
  },
  navBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  navBtnText: { fontSize: 16, fontWeight: '600' },
  monthTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },

  // ─── Day Names ───
  dayNames: { flexDirection: 'row', paddingHorizontal: 12, paddingTop: 6 },
  dayNameCell: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  dayNameText: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },

  // ─── Calendar Grid ───
  calGrid: { paddingHorizontal: 12, paddingBottom: 6 },
  weekRow: { flexDirection: 'row', alignItems: 'stretch' },
  calCell: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 5, minHeight: 46 },
  calCellDimmed: { opacity: 0 },
  calDayNum: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  calDayNumText: { fontSize: 13, fontWeight: '500' },
  dotRow: { flexDirection: 'row', gap: 3, marginTop: 1 },
  dot: { width: 4, height: 4, borderRadius: 2 },

  // ─── Google Calendar-Style Schedule ───
  calSection: {
    paddingHorizontal: 12, paddingTop: 16, paddingBottom: 16,
  },
  calDayHeaders: {
    flexDirection: 'row', marginBottom: 4,
  },
  calDayHeadersRow: {
    flexDirection: 'row',
  },
  calDayHeader: {
    width: 180, alignItems: 'center', paddingVertical: 8,
    paddingHorizontal: 4,
  },
  calDayHeaderLabel: {
    fontSize: 13, fontWeight: '700',
  },
  calDayHeaderSub: {
    fontSize: 10, fontWeight: '500', marginTop: 1,
  },
  calGridRow: {
    flexDirection: 'row',
  },
  calGutter: {
    width: 44, paddingTop: 0,
  },
  calGutterSlot: {
    height: HOUR_HEIGHT, justifyContent: 'flex-start', paddingTop: 1,
    alignItems: 'flex-end', paddingRight: 6,
  },
  calGutterSlotText: {
    fontSize: 10, fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  calDaysRow: {
    flexDirection: 'row',
  },
  calDayCol: {
    width: 180, position: 'relative',
  },
  calHourSlot: {
    height: HOUR_HEIGHT,
    borderTopWidth: 1,
  },
  calEvent: {
    position: 'absolute', left: 3, right: 3,
    borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3,
    overflow: 'hidden',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15, shadowRadius: 2,
  },
  calEventTime: {
    fontSize: 9, fontWeight: '700', color: '#ffffff', opacity: 0.9,
    fontVariant: ['tabular-nums'],
  },
  calEventTitle: {
    fontSize: 11, fontWeight: '600', color: '#ffffff', marginTop: 1,
    lineHeight: 14,
  },
  calEmptyBtn: {
    position: 'absolute', left: 3, right: 3,
    height: 28, borderRadius: 6, borderWidth: 1,
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center',
  },
  calEmptyBtnText: {
    fontSize: 14, fontWeight: '500',
  },

  // ─── FAB ───
  fab: {
    position: 'absolute', bottom: 24, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#0b6bcf',
    alignItems: 'center', justifyContent: 'center',
    elevation: 6, shadowColor: '#0b6bcf', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8,
  },
  fabText: {
    fontSize: 28, color: '#ffffff', fontWeight: '400', lineHeight: 30,
  },

  // ─── Modal ───
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modal: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  modalInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 12 },
  modalRow: { flexDirection: 'row', gap: 10 },
  colorRow: { flexDirection: 'row', gap: 8, marginBottom: 16, justifyContent: 'center' },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorDotSelected: { borderWidth: 3 },
  modalActions: { flexDirection: 'row', gap: 10 },
  repeatRow: {
    flexDirection: 'row', gap: 6, marginBottom: 14, justifyContent: 'center',
  },
  repeatBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
  },
  repeatBtnActive: {},
  repeatBtnText: {
    fontSize: 12, fontWeight: '600',
  },
  repeatBtnTextActive: {},
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '600' },
  deleteBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  deleteBtnText: { fontSize: 15, fontWeight: '600' },
  saveBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { fontSize: 15, fontWeight: '600' },
});