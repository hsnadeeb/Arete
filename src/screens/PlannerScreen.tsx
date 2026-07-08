import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { DAY_NAMES } from '../types';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const COLORS = ['#6366f1','#0b6bcf','#e03e3e','#0a8c2e','#d9730d','#0ea5e9','#8b5cf6','#0891b2'];

const HOUR_HEIGHT = 56;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function parseHour(s: string): number {
  const [h, m] = s.split(':').map(Number);
  return h + (m || 0) / 60;
}

function dateKey(d: Date) {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
function dayName(d: Date) {
  return DAY_NAMES[d.getDay()];
}
function isSameDay(a: Date, b: Date) {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
}
function toDateStr(y: number, m: number, d: number) {
  return `${y}-${m}-${d}`;
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
  const { setSidebarOpen, timetable, setTimetable, addTimetableItem, updateTimetableItem, deleteTimetableItem } = useApp();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDates, setSelectedDates] = useState<string[]>(getYTDates());

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

  // Timetable is already loaded via AppContext init

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
    return timetable.filter((t: any) => {
      if (t.repeat_type === 'once') return t.specific_date === ds;
      if (t.repeat_type === 'daily') return true;
      return t.day_of_week === date.getDay();
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
    await addTimetableItem({
      day_of_week: modalDay, start_time: startTime,
      end_time: endTime, activity, color: itemColor,
      repeat_type: repeatType,
      specific_date: repeatType === 'once' ? specificDate : '',
    });
    setModalMode(null);
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
    await updateTimetableItem(editingId, {
      day_of_week: modalDay, start_time: startTime,
      end_time: endTime, activity, color: itemColor,
      repeat_type: repeatType,
      specific_date: repeatType === 'once' ? specificDate : '',
    });
    setModalMode(null);
  };

  const deleteItem = async () => {
    if (!editingId) return;
    await deleteTimetableItem(editingId);
    setModalMode(null);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => setSidebarOpen(true)} style={styles.menuBtn}>
              <Feather name="menu" size={18} color="#9b9a97" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Calendar</Text>
        <TouchableOpacity style={styles.todayBtn} onPress={goToday}>
          <Text style={styles.todayBtnText}>Today</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ─── Month Header ─── */}
        <View style={styles.monthHeader}>
          <TouchableOpacity onPress={() => navigate(-1)} style={styles.navBtn}>
            <Text style={styles.navBtnText}>〈</Text>
          </TouchableOpacity>
          <Text style={styles.monthTitle}>{MONTHS[month]} {year}</Text>
          <TouchableOpacity onPress={() => navigate(1)} style={styles.navBtn}>
            <Text style={styles.navBtnText}>〉</Text>
          </TouchableOpacity>
        </View>

        {/* ─── Day Names ─── */}
        <View style={styles.dayNames}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <View key={`dn-${i}`} style={styles.dayNameCell}><Text style={styles.dayNameText}>{d}</Text></View>
          ))}
        </View>

        {/* ─── Calendar Grid (Multi-Select) ─── */}
        <View style={styles.calGrid}>
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
                  >
                    {cell.day > 0 && (
                      <>
                        <View style={[
                          styles.calDayNum,
                          isT && styles.calDayNumToday,
                          isSel && !isT && styles.calDayNumSelected,
                        ]}>
                          <Text style={[
                            styles.calDayNumText,
                            isT && styles.calDayNumTextToday,
                            isSel && !isT && styles.calDayNumTextSelected,
                          ]}>
                            {cell.day}
                          </Text>
                        </View>
                        {timetable.filter((t: any) => t.day_of_week === new Date(cell.year, cell.month, cell.day).getDay()).length > 0 && (
                          <View style={styles.dotRow}><View style={styles.dot} /></View>
                        )}
                      </>
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
              <ScrollView horizontal showsHorizontalScrollIndicator={false} nestedScrollEnabled>
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
                        <Text style={[styles.calDayHeaderLabel, isT && styles.calDayHeaderLabelToday]}>
                          {isT ? 'Today' : dateKey(date)}
                        </Text>
                        <Text style={styles.calDayHeaderSub}>{dayName(date)}</Text>
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
                    <Text style={styles.calGutterSlotText}>
                      {h.toString().padStart(2, '0')}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Day columns */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} nestedScrollEnabled>
                <View style={styles.calDaysRow}>
                  {sortedDates.map((ds, di) => {
                    const date = fromDateStr(ds);
                    const schedule = getSchedule(date);
                    return (
                        <View key={ds} style={[styles.calDayCol, di < sortedDates.length - 1 && styles.calDayColBorder]}>
                          {/* Hour grid lines — tap to add at that hour */}
                          {HOURS.map(h => (
                            <TouchableOpacity
                              key={h}
                              style={styles.calHourSlot}
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
                            style={[styles.calEmptyBtn, { top: 4 * HOUR_HEIGHT }]}
                            onPress={() => openAdd(date.getDay())}
                          >
                            <Text style={styles.calEmptyBtnText}>+</Text>
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
        <View style={styles.modalOverlay}>
          {/* Tap outside the modal to close */}
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setModalMode(null)} />
          <View style={styles.modal} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>
              {modalMode === 'add' ? 'New Event' : 'Edit Event'} · {DAY_NAMES[modalDay]}
            </Text>

            <TextInput
              style={styles.modalInput}
              value={activity}
              onChangeText={setActivity}
              placeholder="Activity"
              placeholderTextColor="#ccc"
              autoFocus
            />

            <View style={styles.modalRow}>
              <TextInput
                style={[styles.modalInput, { flex: 1 }]}
                value={startTime}
                onChangeText={setStartTime}
                placeholder="Start (09:00)"
                placeholderTextColor="#ccc"
              />
              <TextInput
                style={[styles.modalInput, { flex: 1 }]}
                value={endTime}
                onChangeText={setEndTime}
                placeholder="End (10:00)"
                placeholderTextColor="#ccc"
              />
            </View>

            <View style={styles.colorRow}>
              {COLORS.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorDot, { backgroundColor: c }, itemColor === c && styles.colorDotSelected]}
                  onPress={() => setItemColor(c)}
                />
              ))}
            </View>

            {/* Repeat type */}
            <View style={styles.repeatRow}>
              {['weekly', 'daily', 'once'].map(r => (
                <TouchableOpacity
                  key={r}
                  style={[styles.repeatBtn, repeatType === r && styles.repeatBtnActive]}
                  onPress={() => setRepeatType(r)}
                >
                  <Text style={[styles.repeatBtnText, repeatType === r && styles.repeatBtnTextActive]}>
                    {r === 'weekly' ? '🔁 Weekly' : r === 'daily' ? '📅 Daily' : '📌 Once'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {repeatType === 'once' && (
              <TextInput
                style={styles.modalInput}
                value={specificDate}
                onChangeText={setSpecificDate}
                placeholder="Date (YYYY-MM-DD)"
                placeholderTextColor="#ccc"
              />
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalMode(null)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              {modalMode === 'edit' && (
                <TouchableOpacity style={styles.deleteBtn} onPress={deleteItem}>
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={modalMode === 'add' ? addItem : saveEdit}
              >
                <Text style={styles.saveBtnText}>{modalMode === 'add' ? 'Add' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  todayBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#f5f5f5', borderRadius: 6 },
  todayBtnText: { fontSize: 13, fontWeight: '600', color: '#0b6bcf' },

  // ─── Month ───
  monthHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#ffffff',
    borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
  },
  navBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f5f5f5', alignItems: 'center', justifyContent: 'center' },
  navBtnText: { fontSize: 16, color: '#37352f', fontWeight: '600' },
  monthTitle: { fontSize: 20, fontWeight: '700', color: '#37352f', letterSpacing: -0.3 },

  // ─── Day Names ───
  dayNames: { flexDirection: 'row', backgroundColor: '#ffffff', paddingHorizontal: 12, paddingTop: 6 },
  dayNameCell: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  dayNameText: { fontSize: 11, fontWeight: '600', color: '#b3b3af', textTransform: 'uppercase', letterSpacing: 0.5 },

  // ─── Calendar Grid ───
  calGrid: { backgroundColor: '#ffffff', paddingHorizontal: 12, paddingBottom: 6 },
  weekRow: { flexDirection: 'row' },
  calCell: { flex: 1, alignItems: 'center', paddingVertical: 5, minHeight: 42 },
  calCellDimmed: { opacity: 0.2 },
  calDayNum: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  calDayNumToday: { backgroundColor: '#0b6bcf' },
  calDayNumSelected: { backgroundColor: '#e8f0fe' },
  calDayNumText: { fontSize: 13, fontWeight: '500', color: '#37352f' },
  calDayNumTextToday: { color: '#ffffff', fontWeight: '600' },
  calDayNumTextSelected: { color: '#0b6bcf', fontWeight: '600' },
  dotRow: { flexDirection: 'row', gap: 3, marginTop: 1 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#0b6bcf' },

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
    fontSize: 13, fontWeight: '700', color: '#37352f',
  },
  calDayHeaderLabelToday: {
    color: '#0b6bcf',
  },
  calDayHeaderSub: {
    fontSize: 10, color: '#b3b3af', fontWeight: '500', marginTop: 1,
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
    fontSize: 10, fontWeight: '500', color: '#b3b3af',
    fontVariant: ['tabular-nums'],
  },
  calDaysRow: {
    flexDirection: 'row',
  },
  calDayCol: {
    width: 180, backgroundColor: '#ffffff', position: 'relative',
  },
  calDayColBorder: {
    borderRightWidth: 1, borderRightColor: '#f0f0f0',
  },
  calHourSlot: {
    height: HOUR_HEIGHT,
    borderTopWidth: 1, borderTopColor: '#f0f0f0',
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
    height: 28, borderRadius: 6, borderWidth: 1, borderColor: '#e0e0e0',
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center',
  },
  calEmptyBtnText: {
    fontSize: 14, color: '#cccccc', fontWeight: '500',
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#ffffff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#37352f', marginBottom: 16 },
  modalInput: { borderWidth: 1, borderColor: '#efefef', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#37352f', backgroundColor: '#fafafa', marginBottom: 12 },
  modalRow: { flexDirection: 'row', gap: 10 },
  colorRow: { flexDirection: 'row', gap: 8, marginBottom: 16, justifyContent: 'center' },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorDotSelected: { borderWidth: 3, borderColor: '#37352f' },
  modalActions: { flexDirection: 'row', gap: 10 },
  repeatRow: {
    flexDirection: 'row', gap: 6, marginBottom: 14, justifyContent: 'center',
  },
  repeatBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  repeatBtnActive: {
    backgroundColor: '#e8f0fe',
  },
  repeatBtnText: {
    fontSize: 12, fontWeight: '600', color: '#9b9a97',
  },
  repeatBtnTextActive: {
    color: '#0b6bcf',
  },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, backgroundColor: '#f5f5f5', alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#9b9a97' },
  deleteBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, backgroundColor: '#fee2e2', alignItems: 'center' },
  deleteBtnText: { fontSize: 15, fontWeight: '600', color: '#e03e3e' },
  saveBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, backgroundColor: '#0b6bcf', alignItems: 'center' },
  saveBtnText: { fontSize: 15, fontWeight: '600', color: '#ffffff' },
});
