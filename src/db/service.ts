import * as SQLite from 'expo-sqlite';
import { SCHEMA } from './schema';

let db: SQLite.SQLiteDatabase | null = null;

export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('hasan-os.db');
  await db.execAsync(SCHEMA);
  // Migrate: add columns for existing databases
  try { await db.execAsync("ALTER TABLE timetable ADD COLUMN repeat_type TEXT DEFAULT 'weekly'"); } catch (_) {}
  try { await db.execAsync("ALTER TABLE timetable ADD COLUMN specific_date TEXT DEFAULT ''"); } catch (_) {}
  // Migrate: dashboard_widgets - replace grid cols with sort_order
  try {
    await db.execAsync("ALTER TABLE dashboard_widgets ADD COLUMN sort_order INTEGER DEFAULT 0");
    // Copy old row_pos values into sort_order for existing rows
    await db.execAsync("UPDATE dashboard_widgets SET sort_order = row_pos WHERE sort_order = 0");
  } catch (_) {}
  return db;
}

export function getDb(): SQLite.SQLiteDatabase {
  if (!db) throw new Error('Database not initialized');
  return db;
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

// ─── Daily Logs ───

export async function getDailyLog(date?: string) {
  const d = date || today();
  const row = await getDb().getFirstAsync<any>(
    'SELECT * FROM daily_logs WHERE date = ?', d
  );
  if (row) return row;
  await getDb().runAsync(
    'INSERT INTO daily_logs (date) VALUES (?)', d
  );
  return await getDb().getFirstAsync<any>(
    'SELECT * FROM daily_logs WHERE date = ?', d
  );
}

export async function updateDailyLog(date: string, fields: Record<string, any>) {
  const keys = Object.keys(fields);
  const sets = keys.map(k => `${k} = ?`).join(', ');
  const vals = keys.map(k => fields[k]);
  await getDb().runAsync(
    `UPDATE daily_logs SET ${sets} WHERE date = ?`, ...vals, date
  );
}

// ─── Prayers ───

export async function getPrayers(date?: string) {
  const d = date || today();
  return await getDb().getAllAsync<any>(
    'SELECT * FROM prayer_logs WHERE date = ? ORDER BY prayer_name', d
  );
}

export async function togglePrayer(date: string, prayerName: string, onTime: boolean) {
  const existing = await getDb().getFirstAsync<any>(
    'SELECT * FROM prayer_logs WHERE date = ? AND prayer_name = ?', date, prayerName
  );
  if (existing) {
    await getDb().runAsync(
      'UPDATE prayer_logs SET on_time = ?, qada = ? WHERE id = ?',
      onTime ? 1 : 0, onTime ? 0 : 1, existing.id
    );
  } else {
    await getDb().runAsync(
      'INSERT INTO prayer_logs (date, prayer_name, on_time, qada) VALUES (?, ?, ?, ?)',
      date, prayerName, onTime ? 1 : 0, onTime ? 0 : 1
    );
  }
}

export const PRAYER_NAMES = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

// ─── Gym Logs ───

export async function getGymLogs(date?: string) {
  const d = date || today();
  return await getDb().getAllAsync<any>(
    'SELECT * FROM gym_logs WHERE date = ? ORDER BY created_at', d
  );
}

export async function addGymLog(log: { date: string; workout_name: string; exercises: string; duration_minutes: number; notes?: string }) {
  const { date, workout_name, exercises, duration_minutes, notes } = log;
  return await getDb().runAsync(
    'INSERT INTO gym_logs (date, workout_name, exercises, duration_minutes, notes) VALUES (?, ?, ?, ?, ?)',
    date, workout_name, exercises, duration_minutes, notes || ''
  );
}

// ─── Nutrition ───

export async function getNutritionLogs(date?: string) {
  const d = date || today();
  return await getDb().getAllAsync<any>(
    'SELECT * FROM nutrition_logs WHERE date = ? ORDER BY meal_type', d
  );
}

export async function addNutritionLog(log: { date: string; meal_type: string; foods: string; calories: number; protein_g: number; carbs_g: number; fat_g: number; notes?: string }) {
  const { date, meal_type, foods, calories, protein_g, carbs_g, fat_g, notes } = log;
  return await getDb().runAsync(
    'INSERT INTO nutrition_logs (date, meal_type, foods, calories, protein_g, carbs_g, fat_g, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    date, meal_type, foods, calories, protein_g, carbs_g, fat_g, notes || ''
  );
}

// ─── Transactions / Budget ───

export async function getTransactions(month?: string) {
  const prefix = month || today().slice(0, 7);
  return await getDb().getAllAsync<any>(
    'SELECT * FROM transactions WHERE date LIKE ? ORDER BY date DESC',
    `${prefix}%`
  );
}

export async function addTransaction(t: { date: string; category: string; amount: number; type: string; description?: string }) {
  return await getDb().runAsync(
    'INSERT INTO transactions (date, category, amount, type, description) VALUES (?, ?, ?, ?, ?)',
    t.date, t.category, t.amount, t.type, t.description || ''
  );
}

export async function getBudgetSummary(month?: string) {
  const prefix = month || today().slice(0, 7);
  return await getDb().getAllAsync<any>(
    `SELECT category, type, SUM(amount) as total FROM transactions
     WHERE date LIKE ? GROUP BY category, type`,
    `${prefix}%`
  );
}

// ─── Timetable ───

export async function getTimetable(dayOfWeek: number) {
  return await getDb().getAllAsync<any>(
    'SELECT * FROM timetable WHERE day_of_week = ? ORDER BY start_time', dayOfWeek
  );
}

export async function getAllTimetable() {
  return await getDb().getAllAsync<any>(
    'SELECT * FROM timetable ORDER BY day_of_week, start_time'
  );
}

export async function addTimetableItem(item: { day_of_week: number; start_time: string; end_time?: string; activity: string; color?: string; repeat_type?: string; specific_date?: string }) {
  return await getDb().runAsync(
    'INSERT INTO timetable (day_of_week, start_time, end_time, activity, color, repeat_type, specific_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
    item.day_of_week, item.start_time, item.end_time || '', item.activity, item.color || '#0b6bcf',
    item.repeat_type || 'weekly', item.specific_date || ''
  );
}

export async function updateTimetableItem(id: number, fields: { day_of_week?: number; start_time?: string; end_time?: string; activity?: string; color?: string; repeat_type?: string; specific_date?: string }) {
  const sets: string[] = [];
  const vals: any[] = [];
  if (fields.day_of_week !== undefined) { sets.push('day_of_week = ?'); vals.push(fields.day_of_week); }
  if (fields.start_time !== undefined) { sets.push('start_time = ?'); vals.push(fields.start_time); }
  if (fields.end_time !== undefined) { sets.push('end_time = ?'); vals.push(fields.end_time); }
  if (fields.activity !== undefined) { sets.push('activity = ?'); vals.push(fields.activity); }
  if (fields.color !== undefined) { sets.push('color = ?'); vals.push(fields.color); }
  if (fields.repeat_type !== undefined) { sets.push('repeat_type = ?'); vals.push(fields.repeat_type); }
  if (fields.specific_date !== undefined) { sets.push('specific_date = ?'); vals.push(fields.specific_date); }
  if (sets.length === 0) return;
  await getDb().runAsync(`UPDATE timetable SET ${sets.join(', ')} WHERE id = ?`, ...vals, id);
}

export async function deleteTimetableItem(id: number) {
  await getDb().runAsync('DELETE FROM timetable WHERE id = ?', id);
}

// ─── Journal ───

export async function getJournalEntries(date?: string) {
  const d = date || today();
  return await getDb().getAllAsync<any>(
    'SELECT * FROM journal_entries WHERE date = ? ORDER BY created_at DESC', d
  );
}

export async function addJournalEntry(e: { date: string; title?: string; content: string; type?: string }) {
  return await getDb().runAsync(
    'INSERT INTO journal_entries (date, title, content, type) VALUES (?, ?, ?, ?)',
    e.date, e.title || '', e.content, e.type || 'general'
  );
}

// ─── Habit Tracking ───

export async function getHabits() {
  return await getDb().getAllAsync<any>(
    'SELECT * FROM habits ORDER BY created_at'
  );
}

export async function addHabit(h: { name: string; emoji?: string; target_per_day?: number; unit?: string }) {
  return await getDb().runAsync(
    'INSERT INTO habits (name, emoji, target_per_day, unit) VALUES (?, ?, ?, ?)',
    h.name, h.emoji || '✅', h.target_per_day || 1, h.unit || ''
  );
}

export async function logHabit(habitId: number, date: string, count: number = 1) {
  const existing = await getDb().getFirstAsync<any>(
    'SELECT * FROM habit_logs WHERE habit_id = ? AND date = ?', habitId, date
  );
  if (existing) {
    await getDb().runAsync(
      'UPDATE habit_logs SET count = ? WHERE id = ?', count, existing.id
    );
  } else {
    await getDb().runAsync(
      'INSERT INTO habit_logs (habit_id, date, count) VALUES (?, ?, ?)',
      habitId, date, count
    );
  }
}

// ─── Stats / Aggregations ───

export async function getMonthlyStats(yearMonth: string) {
  return await getDb().getAllAsync<any>(
    `SELECT
       AVG(weight) as avg_weight,
       AVG(water_ml) as avg_water,
       AVG(steps) as avg_steps,
       AVG(mood) as avg_mood,
       AVG(sleep_hours) as avg_sleep,
       COUNT(*) as days_tracked
     FROM daily_logs WHERE date LIKE ?`,
    `${yearMonth}%`
  );
}

export async function getStreak(): Promise<number> {
  const rows = await getDb().getAllAsync<any>(
    'SELECT DISTINCT date FROM daily_logs WHERE weight IS NOT NULL OR water_ml > 0 OR steps > 0 ORDER BY date DESC'
  );
  if (rows.length === 0) return 0;
  let streak = 0;
  const todayDate = new Date();
  for (let i = 0; i < rows.length; i++) {
    const expected = new Date(todayDate);
    expected.setDate(expected.getDate() - i);
    const expectedStr = expected.toISOString().split('T')[0];
    if (rows[i].date === expectedStr) streak++;
    else break;
  }
  return streak;
}

export async function seedTimetable() {
  const existing = await getDb().getFirstAsync<any>('SELECT id FROM timetable LIMIT 1');
  if (existing) return;

  const items = [
    { day: 0, time: '08:00', activity: 'Morning reflection', color: '#6366f1' },
    { day: 0, time: '10:00', activity: 'Gym - Push A', color: '#e03e3e' },
    { day: 0, time: '14:00', activity: 'LeetCode study', color: '#0b6bcf' },
    { day: 1, time: '06:30', activity: 'Fajr + morning adhkar', color: '#8b5cf6' },
    { day: 1, time: '09:00', activity: 'Deep work: system design', color: '#0b6bcf' },
    { day: 1, time: '12:00', activity: 'Lunch + walk', color: '#0ea5e9' },
    { day: 1, time: '18:00', activity: 'Evening study - Spring Boot', color: '#d9730d' },
    { day: 2, time: '07:00', activity: 'Cardio + stretching', color: '#e03e3e' },
    { day: 2, time: '10:00', activity: 'Job applications', color: '#0b6bcf' },
    { day: 2, time: '15:00', activity: 'Quran reading', color: '#8b5cf6' },
    { day: 2, time: '20:00', activity: 'Wind down + journal', color: '#6366f1' },
    { day: 3, time: '06:30', activity: 'Fajr + gym - Pull', color: '#e03e3e' },
    { day: 3, time: '09:00', activity: 'DSA practice', color: '#0b6bcf' },
    { day: 3, time: '14:00', activity: 'Budget review', color: '#0a8c2e' },
    { day: 3, time: '19:00', activity: 'Tahajjud prep', color: '#8b5cf6' },
    { day: 4, time: '08:00', activity: 'Morning routine', color: '#6366f1' },
    { day: 4, time: '10:00', activity: 'Interview prep', color: '#0b6bcf' },
    { day: 4, time: '12:30', activity: 'Gym - Legs', color: '#e03e3e' },
    { day: 4, time: '16:00', activity: 'Read 10 pages', color: '#d9730d' },
    { day: 5, time: '07:00', activity: 'Fajr + meal prep', color: '#0ea5e9' },
    { day: 5, time: '10:00', activity: 'Deep work block', color: '#0b6bcf' },
    { day: 5, time: '15:00', activity: 'Weekly review', color: '#6366f1' },
    { day: 5, time: '18:00', activity: 'Family time', color: '#0a8c2e' },
    { day: 6, time: '08:00', activity: 'Sleep in + recovery', color: '#0ea5e9' },
    { day: 6, time: '11:00', activity: 'Light reading', color: '#d9730d' },
    { day: 6, time: '15:00', activity: 'Plan next week', color: '#6366f1' },
  ];

  for (const item of items) {
    await getDb().runAsync(
      'INSERT INTO timetable (day_of_week, start_time, activity, color) VALUES (?, ?, ?, ?)',
      item.day, item.time, item.activity, item.color
    );
  }
}

// ─── Dashboard Widget Layout ───

export async function getWidgetLayouts(): Promise<any[]> {
  return await getDb().getAllAsync<any>(
    'SELECT * FROM dashboard_widgets ORDER BY sort_order'
  );
}

export async function saveWidgetOrder(widgets: { widget_key: string; sort_order: number }[]) {
  for (const w of widgets) {
    await getDb().runAsync(
      'UPDATE dashboard_widgets SET sort_order = ? WHERE widget_key = ?',
      w.sort_order, w.widget_key
    );
  }
}

export async function seedWidgetLayouts() {
  const existing = await getDb().getFirstAsync<any>('SELECT id FROM dashboard_widgets LIMIT 1');
  if (existing) return;

  const defaults = [
    'at-a-glance', 'quick-stats', 'quick-log', 'mood',
    'expenses', 'prayer-tracker', 'monthly-stats',
  ];

  for (let i = 0; i < defaults.length; i++) {
    await getDb().runAsync(
      'INSERT INTO dashboard_widgets (widget_key, sort_order) VALUES (?, ?)',
      defaults[i], i
    );
  }
}

// ─── Prayer Timings ───

export async function getPrayerTimings(date?: string) {
  const d = date || today();
  return await getDb().getFirstAsync<any>(
    'SELECT * FROM prayer_timings WHERE date = ?', d
  );
}

export async function savePrayerTimings(t: {
  date: string; city?: string; country?: string;
  fajr: string; sunrise?: string; dhuhr: string; asr: string; maghrib: string; isha: string;
  hijri_date?: string; hijri_month?: string; hijri_year?: string; gregorian_date?: string;
}) {
  await getDb().runAsync(
    `INSERT OR REPLACE INTO prayer_timings
     (date, city, country, fajr, sunrise, dhuhr, asr, maghrib, isha, hijri_date, hijri_month, hijri_year, gregorian_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    t.date, t.city || '', t.country || '',
    t.fajr, t.sunrise || '', t.dhuhr, t.asr, t.maghrib, t.isha,
    t.hijri_date || '', t.hijri_month || '', t.hijri_year || '', t.gregorian_date || ''
  );
}

export async function syncPrayersToTimetable(timings: { fajr: string; sunrise?: string; dhuhr: string; asr: string; maghrib: string; isha: string }, date: string) {
  const dayOfWeek = new Date(date + 'T12:00:00').getDay();
  const prayerItems = [
    { name: 'Fajr', time: timings.fajr, color: '#6366f1' },
    { name: 'Sunrise', time: timings.sunrise || '', color: '#f59e0b' },
    { name: 'Dhuhr', time: timings.dhuhr, color: '#0b6bcf' },
    { name: 'Asr', time: timings.asr, color: '#0ea5e9' },
    { name: 'Maghrib', time: timings.maghrib, color: '#e03e3e' },
    { name: 'Isha', time: timings.isha, color: '#8b5cf6' },
  ];

  for (const prayer of prayerItems) {
    if (!prayer.time) continue;
    // Check if prayer block already exists for this day
    const existing = await getDb().getFirstAsync<any>(
      'SELECT id FROM timetable WHERE day_of_week = ? AND activity = ? AND repeat_type = ? AND specific_date = ?',
      dayOfWeek, `🕌 ${prayer.name} - ${prayer.time}`, 'weekly', date
    );
    if (!existing) {
      // Delete old prayer entries for this day
      await getDb().runAsync(
        'DELETE FROM timetable WHERE day_of_week = ? AND activity LIKE ? AND repeat_type = ?',
        dayOfWeek, `🕌 ${prayer.name}%`, 'weekly'
      );
      await getDb().runAsync(
        'INSERT INTO timetable (day_of_week, start_time, activity, color, repeat_type, specific_date) VALUES (?, ?, ?, ?, ?, ?)',
        dayOfWeek, prayer.time, `🕌 ${prayer.name}`, prayer.color, 'weekly', date
      );
    }
  }
}

// ─── Data Management (Profile) ───

export async function getAllDailyLogs() {
  return await getDb().getAllAsync<any>('SELECT * FROM daily_logs ORDER BY date DESC');
}

export async function getAllPrayers() {
  return await getDb().getAllAsync<any>('SELECT * FROM prayer_logs ORDER BY date DESC, prayer_name');
}

export async function getAllGymLogs() {
  return await getDb().getAllAsync<any>('SELECT * FROM gym_logs ORDER BY date DESC');
}

export async function getAllNutritionLogs() {
  return await getDb().getAllAsync<any>('SELECT * FROM nutrition_logs ORDER BY date DESC');
}

export async function getAllTransactions() {
  return await getDb().getAllAsync<any>('SELECT * FROM transactions ORDER BY date DESC');
}

export async function getAllJournalEntries() {
  return await getDb().getAllAsync<any>('SELECT * FROM journal_entries ORDER BY date DESC');
}

export async function getGoals() {
  return await getDb().getAllAsync<any>('SELECT * FROM goals ORDER BY created_at DESC');
}

export async function getBudgetCategories() {
  return await getDb().getAllAsync<any>('SELECT * FROM budget_categories ORDER BY name');
}

export async function getHabitLogs() {
  return await getDb().getAllAsync<any>('SELECT * FROM habit_logs ORDER BY date DESC');
}

export async function getHabitStreak(habitId: number): Promise<number> {
  const rows = await getDb().getAllAsync<any>(
    'SELECT DISTINCT date FROM habit_logs WHERE habit_id = ? ORDER BY date DESC',
    habitId
  );
  if (rows.length === 0) return 0;
  let streak = 0;
  const todayStr = new Date().toISOString().split('T')[0];
  for (let i = 0; i < rows.length; i++) {
    const expected = new Date();
    expected.setDate(expected.getDate() - i);
    const expectedStr = expected.toISOString().split('T')[0];
    if (rows[i].date === expectedStr) streak++;
    else break;
  }
  return streak;
}

export async function getHabitAnalytics(
  habitId: number,
  days: number = 7
): Promise<{ date: string; count: number }[]> {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  const rows = await getDb().getAllAsync<any>(
    'SELECT date, count FROM habit_logs WHERE habit_id = ? AND date >= ? AND date <= ? ORDER BY date',
    habitId,
    start.toISOString().split('T')[0],
    end.toISOString().split('T')[0]
  );
  return rows;
}

// Delete helpers
export async function deleteDailyLogById(id: number) {
  await getDb().runAsync('DELETE FROM daily_logs WHERE id = ?', id);
}
export async function deletePrayerById(id: number) {
  await getDb().runAsync('DELETE FROM prayer_logs WHERE id = ?', id);
}
export async function deleteGymLogById(id: number) {
  await getDb().runAsync('DELETE FROM gym_logs WHERE id = ?', id);
}
export async function deleteNutritionLogById(id: number) {
  await getDb().runAsync('DELETE FROM nutrition_logs WHERE id = ?', id);
}
export async function deleteTransactionById(id: number) {
  await getDb().runAsync('DELETE FROM transactions WHERE id = ?', id);
}
export async function deleteJournalEntryById(id: number) {
  await getDb().runAsync('DELETE FROM journal_entries WHERE id = ?', id);
}
export async function deleteGoalById(id: number) {
  await getDb().runAsync('DELETE FROM goals WHERE id = ?', id);
}
export async function deleteHabitById(id: number) {
  await getDb().runAsync('DELETE FROM habits WHERE id = ?', id);
}
export async function deleteHabitLogById(id: number) {
  await getDb().runAsync('DELETE FROM habit_logs WHERE id = ?', id);
}
export async function deleteBudgetCategoryById(id: number) {
  await getDb().runAsync('DELETE FROM budget_categories WHERE id = ?', id);
}

// ─── Seed Data ───

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

export async function seedAllData() {
  const existing = await getDb().getFirstAsync<any>('SELECT id FROM daily_logs LIMIT 1');
  if (existing) return; // already seeded

  const today = daysAgo(0);
  const yesterday = daysAgo(1);

  // ─── Daily Logs (7 days) — deterministic ───
  const dailySeed = [
    { date: daysAgo(6), w: 78.5, wa: 1500, s: 5000, mo: 3, sl: 6.5, sq: 3, c: 1800, p: 80, note: 'Good day' },
    { date: daysAgo(5), w: 79.0, wa: 1800, s: 8000, mo: 4, sl: 7.0, sq: 4, c: 2000, p: 120, note: 'Focused' },
    { date: daysAgo(4), w: 78.2, wa: 2000, s: 10000, mo: 5, sl: 8.0, sq: 5, c: 2200, p: 140, note: 'Tired' },
    { date: daysAgo(3), w: 79.5, wa: 1200, s: 6000, mo: 3, sl: 6.0, sq: 3, c: 1900, p: 90, note: 'Productive' },
    { date: daysAgo(2), w: 78.8, wa: 1600, s: 7000, mo: 4, sl: 7.5, sq: 4, c: 2100, p: 110, note: 'Meh' },
    { date: daysAgo(1), w: 79.3, wa: 1900, s: 9000, mo: 5, sl: 8.5, sq: 5, c: 2300, p: 130, note: 'Great' },
    { date: daysAgo(0), w: 78.6, wa: 2000, s: 10000, mo: 5, sl: 8.0, sq: 5, c: 2500, p: 150, note: 'Okay' },
  ];
  for (const dd of dailySeed) {
    await getDb().runAsync(
      'INSERT OR IGNORE INTO daily_logs (date, weight, water_ml, steps, mood, sleep_hours, sleep_quality, calories, protein_g, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      dd.date, dd.w, dd.wa, dd.s, dd.mo, dd.sl, dd.sq, dd.c, dd.p, dd.note
    );
  }

  // ─── Prayer Logs (today + yesterday) ───
  for (const date of [today, yesterday]) {
    for (const name of ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']) {
      await getDb().runAsync(
        'INSERT OR IGNORE INTO prayer_logs (date, prayer_name, on_time, qada) VALUES (?, ?, ?, ?)',
        date, name, 1, 0 // all on time, no qada
      );
    }
  }

  // ─── Gym Logs (3 sessions) ───
  const gymWorkouts = [
    { date: daysAgo(5), name: 'Push A', ex: 'Bench Press 4x8, OHP 3x10, Tricep Pushdown 3x12', dur: 50, note: 'Felt strong' },
    { date: daysAgo(3), name: 'Pull A', ex: 'Deadlift 3x5, Pull-ups 3x8, Barbell Row 3x10', dur: 55, note: 'Good form' },
    { date: daysAgo(1), name: 'Legs', ex: 'Squat 4x6, RDL 3x8, Leg Press 3x12', dur: 50, note: 'Legs sore' },
  ];
  for (const w of gymWorkouts) {
    await getDb().runAsync(
      'INSERT OR IGNORE INTO gym_logs (date, workout_name, exercises, duration_minutes, notes) VALUES (?, ?, ?, ?, ?)',
      w.date, w.name, w.ex, w.dur, w.note
    );
  }

  // ─── Nutrition Logs (2 per day for 3 days) ───
  const meals = [
    { date: daysAgo(2), type: 'Breakfast', foods: 'Oatmeal, banana, protein shake', cal: 450, protein: 35 },
    { date: daysAgo(2), type: 'Lunch', foods: 'Chicken breast, rice, broccoli', cal: 650, protein: 45 },
    { date: daysAgo(1), type: 'Breakfast', foods: 'Eggs, toast, avocado', cal: 420, protein: 25 },
    { date: daysAgo(1), type: 'Lunch', foods: 'Salmon, sweet potato, asparagus', cal: 580, protein: 40 },
    { date: today, type: 'Breakfast', foods: 'Greek yogurt, granola, berries', cal: 380, protein: 28 },
    { date: today, type: 'Lunch', foods: 'Turkey sandwich, salad', cal: 520, protein: 32 },
  ];
  for (const m of meals) {
    await getDb().runAsync(
      'INSERT INTO nutrition_logs (date, meal_type, foods, calories, protein_g, carbs_g, fat_g) VALUES (?, ?, ?, ?, ?, ?, ?)',
      m.date, m.type, m.foods, m.cal, m.protein, Math.floor(Math.random() * 60) + 30, Math.floor(Math.random() * 30) + 15
    );
  }

  // ─── Transactions (12 entries over past week) ───
  const txns = [
    { date: daysAgo(6), cat: 'Food', amount: 45.50, type: 'expense', desc: 'Groceries' },
    { date: daysAgo(6), cat: 'Transport', amount: 12.00, type: 'expense', desc: 'Metro card' },
    { date: daysAgo(5), cat: 'Salary', amount: 3500.00, type: 'income', desc: 'Monthly salary' },
    { date: daysAgo(4), cat: 'Food', amount: 28.30, type: 'expense', desc: 'Dinner out' },
    { date: daysAgo(4), cat: 'Learning', amount: 19.99, type: 'expense', desc: 'Udemy course' },
    { date: daysAgo(3), cat: 'Shopping', amount: 85.00, type: 'expense', desc: 'New shoes' },
    { date: daysAgo(3), cat: 'Food', amount: 52.10, type: 'expense', desc: 'Weekly groceries' },
    { date: daysAgo(2), cat: 'Bills', amount: 120.00, type: 'expense', desc: 'Electricity bill' },
    { date: daysAgo(2), cat: 'Food', amount: 15.50, type: 'expense', desc: 'Coffee + snack' },
    { date: daysAgo(1), cat: 'Savings', amount: 500.00, type: 'expense', desc: 'Auto-transfer' },
    { date: today, cat: 'Food', amount: 33.75, type: 'expense', desc: 'Lunch' },
    { date: today, cat: 'Healthcare', amount: 25.00, type: 'expense', desc: 'Vitamins' },
  ];
  for (const t of txns) {
    await getDb().runAsync(
      'INSERT INTO transactions (date, category, amount, type, description) VALUES (?, ?, ?, ?, ?)',
      t.date, t.cat, t.amount, t.type, t.desc
    );
  }

  // ─── Journal Entries (4 entries) ───
  const entries = [
    { date: daysAgo(6), title: 'Week Reflection', content: 'This week was productive. I managed to hit all my goals except for the workout. Need to focus on consistency next week.', type: 'reflection' },
    { date: daysAgo(4), title: 'Great Workout', content: 'Had an amazing push session today. Felt strong on bench press and hit a new PR of 4x8 at 185lbs.', type: 'general' },
    { date: daysAgo(2), title: 'Feeling Tired', content: 'Did not sleep well last night. Need to prioritize sleep hygiene. Going to bed by 10pm tonight no excuses.', type: 'general' },
    { date: today, title: 'Daily Standup', content: 'Today\'s focus: complete the system design review, hit the gym, and read 10 pages of Atomic Habits.', type: 'planning' },
  ];
  for (const e of entries) {
    await getDb().runAsync(
      'INSERT INTO journal_entries (date, title, content, type) VALUES (?, ?, ?, ?)',
      e.date, e.title, e.content, e.type
    );
  }

  // ─── Habits (5 habits) ───
  const habits = [
    { name: 'Read 10 pages', emoji: '📖', target: 1, unit: 'pages' },
    { name: 'Drink water', emoji: '💧', target: 8, unit: 'glasses' },
    { name: 'Meditate', emoji: '🧘', target: 1, unit: 'session' },
    { name: 'No sugar', emoji: '🚫', target: 1, unit: 'day' },
    { name: 'Walk 10k steps', emoji: '🚶', target: 10000, unit: 'steps' },
  ];
  for (const h of habits) {
    await getDb().runAsync(
      'INSERT INTO habits (name, emoji, target_per_day, unit) VALUES (?, ?, ?, ?)',
      h.name, h.emoji, h.target, h.unit
    );
  }

  // ─── Habit Logs (some logged data) ───
  for (let i = 0; i < 5; i++) {
    for (let d = 0; d < 4; d++) {
      await getDb().runAsync(
        'INSERT OR IGNORE INTO habit_logs (habit_id, date, count) VALUES (?, ?, ?)',
        i + 1, daysAgo(d), Math.floor(Math.random() * 2) + 1
      );
    }
  }

  // ─── Goals (4 goals) ───
  const goals = [
    { title: 'Lose 5kg', target: 5, current: 2.5, unit: 'kg', area: 'Health', color: '#e03e3e' },
    { title: 'Save $5,000', target: 5000, current: 1800, unit: '$', area: 'Finance', color: '#0a8c2e' },
    { title: 'Complete AWS Certification', target: 1, current: 0.3, unit: 'cert', area: 'Career', color: '#0b6bcf' },
    { title: 'Read 20 books', target: 20, current: 7, unit: 'books', area: 'Learning', color: '#8b5cf6' },
  ];
  for (const g of goals) {
    await getDb().runAsync(
      'INSERT INTO goals (title, target_value, current_value, unit, area, color) VALUES (?, ?, ?, ?, ?, ?)',
      g.title, g.target, g.current, g.unit, g.area, g.color
    );
  }

  // ─── Budget Categories (6 categories) ───
  const budgetCats = [
    { name: 'Rent', budget: 1200, icon: '🏠' },
    { name: 'Food', budget: 500, icon: '🍎' },
    { name: 'Transport', budget: 150, icon: '🚇' },
    { name: 'Learning', budget: 200, icon: '📚' },
    { name: 'Savings', budget: 500, icon: '💰' },
    { name: 'Entertainment', budget: 150, icon: '🎬' },
  ];
  for (const bc of budgetCats) {
    await getDb().runAsync(
      'INSERT INTO budget_categories (name, monthly_budget, icon) VALUES (?, ?, ?)',
      bc.name, bc.budget, bc.icon
    );
  }

  // ─── Dashboard Widget Layouts ───
  await seedWidgetLayouts();

  // ─── Daily Affirmations (7 days) ───
  const affirmations = [
    'I am consistent and disciplined.',
    'Every small step compounds into greatness.',
    'I choose progress over perfection.',
    'My focus is my superpower.',
    'I am building the future I want to live in.',
    'Discipline is the bridge between goals and accomplishment.',
    'Today I will be better than yesterday.',
  ];
  for (let i = 0; i < 7; i++) {
    await getDb().runAsync(
      'INSERT OR IGNORE INTO daily_affirmations (date, content) VALUES (?, ?)',
      daysAgo(i), affirmations[i]
    );
  }
}
