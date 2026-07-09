/**
 * Seed Data — Comprehensive dummy data for UI testing
 *
 * This script seeds every table in the database with realistic data
 * that covers all screens and features of the app, including:
 * - 30+ days of daily logs with proper trends
 * - Weekly/monthly aggregation data for charts
 * - Realistic spending patterns
 * - Habit tracking with history
 *
 * IMPORTANT: Prayer timings are NOT seeded here — they are fetched
 * from the Aladhan API at runtime (see services/prayerApi.ts).
 */

import * as db from '../db/service';

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals = 1): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}



// ─── PRAYER NAMES (in sync with schema) ───
const PRAYER_NAMES = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

/**
 * Seed ALL tables with comprehensive dummy data.
 * Safe to call multiple times — uses INSERT OR IGNORE.
 */
export async function seedAllTables(): Promise<void> {
  const dbInstance = await db.initDatabase();

  // Check if data already exists
  const existing = await dbInstance.getFirstAsync('SELECT id FROM daily_logs LIMIT 1');
  if (existing) return; // already seeded

  const existingWidget = await dbInstance.getFirstAsync<any>('SELECT id FROM dashboard_widgets LIMIT 1');
  if (!existingWidget) {

  // ────────────────────────────────────────────
  // 1. DAILY LOGS — 30 days of analytics data
  //    Covers: weight, water, steps, mood, sleep,
  //    calories, protein with realistic trends
  // ────────────────────────────────────────────

  // Generate 30 days of data with a realistic weight trend (slight downward)
  const baseWeight = 79.5;
  const dailyLogs: Array<{
    date: string; weight: number; water_ml: number; steps: number;
    mood: number; sleep_hours: number; sleep_quality: number;
    calories: number; protein_g: number; notes: string;
  }> = [];

  for (let i = 0; i < 30; i++) {
    const d = daysAgo(i);
    const dayOfWeek = new Date(d + 'T12:00:00').getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dayIndex = 29 - i; // 0 = 30 days ago, 29 = today

    // Trends over 30 days:
    // - Weight: slight downward trend (2kg loss) with daily fluctuation
    const weightTrend = baseWeight - (dayIndex * 0.065) + (Math.random() - 0.5) * 0.4;
    // - Water: weekends less, weekdays more
    const waterBase = isWeekend ? 1600 : 2100;
    // - Steps: weekends are low, weekdays are higher
    const stepsBase = isWeekend ? 4500 : 8500;
    // - Mood: later days higher (improving mood)
    const moodBase = Math.min(5, Math.round(2.5 + dayIndex * 0.08));
    // - Sleep: slight improvement
    const sleepBase = 6.2 + Math.random() * 1.8;

    dailyLogs.push({
      date: d,
      weight: parseFloat(weightTrend.toFixed(1)),
      water_ml: Math.round(waterBase + (Math.random() - 0.5) * 600),
      steps: Math.round(stepsBase + (Math.random() - 0.5) * 3000),
      mood: Math.max(1, Math.min(5, moodBase)),
      sleep_hours: parseFloat(sleepBase.toFixed(1)),
      sleep_quality: Math.round(Math.min(5, Math.max(1, 2.5 + Math.random() * 2.5))),
      calories: Math.round(1900 + Math.random() * 700),
      protein_g: parseFloat((60 + Math.random() * 90).toFixed(0)),
      notes: pick([
        'Focused day — hit all targets',
        'Skipped gym, stayed on diet',
        'Good sleep = good day',
        'Productive morning, slacked afternoon',
        'Ate well, walked 10k',
        'Hard study session, light dinner',
        'Rest day — recovery focus',
        'Nailed the routine today',
        'Meh — need to bounce back',
        'Great progress this week',
      ]),
    });
  }

  for (const log of dailyLogs) {
    await dbInstance.runAsync(
      `INSERT OR IGNORE INTO daily_logs
       (date, weight, water_ml, steps, mood, sleep_hours, sleep_quality, calories, protein_g, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      log.date, log.weight, log.water_ml, log.steps, log.mood,
      log.sleep_hours, log.sleep_quality, log.calories, log.protein_g, log.notes
    );
  }

  // ────────────────────────────────────────────
  // 2. PRAYER LOGS — 30 days × 5 prayers
  //    Shows: on-time streak, qada pattern
  // ────────────────────────────────────────────
  // Realistic prayer logging pattern
  for (let i = 0; i < 30; i++) {
    const d = daysAgo(i);
    const dayOfWeek = new Date(d + 'T12:00:00').getDay();
    // Weekend pattern: slightly more qada
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    for (const name of PRAYER_NAMES) {
      // Fajr: 80% on time, rest qada
      // Dhuhr/Asr: 90% on time (workdays) / 70% (weekends)
      // Maghrib/Isha: 95% on time
      let p;
      if (name === 'Fajr') {
        p = Math.random() < 0.8 ? { onTime: 1, qada: 0 } : { onTime: 0, qada: 1 };
      } else if (isWeekend && (name === 'Dhuhr' || name === 'Asr')) {
        p = Math.random() < 0.7 ? { onTime: 1, qada: 0 } : { onTime: 0, qada: 1 };
      } else {
        p = Math.random() < 0.9 ? { onTime: 1, qada: 0 } : { onTime: 0, qada: 1 };
      }

      await dbInstance.runAsync(
        `INSERT OR IGNORE INTO prayer_logs (date, prayer_name, on_time, qada) VALUES (?, ?, ?, ?)`,
        d, name, p.onTime, p.qada
      );
    }
  }

  // ────────────────────────────────────────────
  // 3. GYM LOGS — 12 sessions (3 per week × 4 weeks)
  // ────────────────────────────────────────────
  const WORKOUTS = [
    { name: 'Push A', ex: 'Bench Press 4×8\nOHP 3×10\nTricep Pushdown 3×12\nLateral Raise 3×15', dur: 50 },
    { name: 'Push B', ex: 'Incline Bench 4×8\nDB Shoulder Press 3×10\nSkull Crushers 3×12\nFront Raise 3×15', dur: 45 },
    { name: 'Pull A', ex: 'Deadlift 3×5\nPull-ups 3×8\nBarbell Row 3×10\nFace Pulls 3×15', dur: 55 },
    { name: 'Pull B', ex: 'RDL 3×8\nLat Pulldown 3×10\nCable Row 3×12\nShrugs 3×15', dur: 50 },
    { name: 'Legs A', ex: 'Squat 4×6\nRDL 3×8\nLeg Press 3×12\nCalf Raises 4×15', dur: 55 },
    { name: 'Legs B', ex: 'Front Squat 4×6\nBulgarian Split Squat 3×10\nHamstring Curl 3×12\nWalking Lunges 3×15', dur: 50 },
    { name: 'Cardio + Core', ex: 'Treadmill 20min\nJump Rope 10min\nPlanks 3×60s\nCrunches 3×15', dur: 45 },
    { name: 'Full Body', ex: 'Clean & Jerk 3×5\nPull-ups 3×8\nSquat 3×10\nPush Press 3×10', dur: 60 },
    { name: 'Upper Hypertrophy', ex: 'Incline Bench 4×10\nLat Pulldown 4×10\nDB Curl 3×15\nTricep Rope 3×15', dur: 40 },
    { name: 'Lower Strength', ex: 'Deadlift 5×3\nBulgarian Split Squat 3×10\nNordic Curl 3×8\nBack Extensions 3×12', dur: 50 },
    { name: 'Active Recovery', ex: 'Stretching 20min\nFoam Rolling 15min\nMobility Drills 15min', dur: 50 },
    { name: 'Chest & Tris', ex: 'Dumbbell Press 4×10\nIncline Fly 3×12\nTricep Pushdown 4×12\nOverhead Extension 3×12', dur: 45 },
  ];

  for (let i = 0; i < 12; i++) {
    const d = daysAgo(randomInt(0, 28));
    const w = WORKOUTS[i % WORKOUTS.length];
    await dbInstance.runAsync(
      `INSERT OR IGNORE INTO gym_logs (date, workout_name, exercises, duration_minutes, notes) VALUES (?, ?, ?, ?, ?)`,
      d, w.name, w.ex, w.dur + randomInt(-5, 10),
      pick(['Felt strong!', 'Good form', 'PR attempt', 'Light session', 'Recovery day', 'Nailed it'])
    );
  }

  // ────────────────────────────────────────────
  // 4. NUTRITION LOGS — 60 meals (2 per day × 30 days)
  // ────────────────────────────────────────────
  const MEALS = [
    { type: 'Breakfast', foods: 'Oatmeal with berries + protein shake', cal: 450, p: 35, c: 55, f: 12 },
    { type: 'Breakfast', foods: 'Eggs (3) + avocado toast + orange juice', cal: 520, p: 25, c: 40, f: 22 },
    { type: 'Breakfast', foods: 'Greek yogurt parfait + granola + almonds', cal: 380, p: 28, c: 45, f: 14 },
    { type: 'Lunch', foods: 'Grilled chicken + brown rice + broccoli', cal: 650, p: 45, c: 60, f: 10 },
    { type: 'Lunch', foods: 'Salmon + sweet potato + asparagus', cal: 580, p: 40, c: 50, f: 15 },
    { type: 'Lunch', foods: 'Turkey sandwich + side salad + apple', cal: 520, p: 32, c: 45, f: 8 },
    { type: 'Dinner', foods: 'Beef stir-fry + jasmine rice', cal: 720, p: 50, c: 65, f: 18 },
    { type: 'Dinner', foods: 'Lentil curry + naan + raita', cal: 580, p: 28, c: 80, f: 12 },
    { type: 'Dinner', foods: 'Pasta + meatballs + garlic bread', cal: 650, p: 35, c: 75, f: 20 },
    { type: 'Snack', foods: 'Protein bar + almonds + apple', cal: 320, p: 22, c: 35, f: 10 },
    { type: 'Snack', foods: 'Hummus + carrots + whole wheat crackers', cal: 280, p: 12, c: 30, f: 14 },
  ];

  for (let i = 0; i < 30; i++) {
    for (let m = 0; m < 2; m++) {
      const meal = pick(MEALS);
      await dbInstance.runAsync(
        `INSERT INTO nutrition_logs (date, meal_type, foods, calories, protein_g, carbs_g, fat_g) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        daysAgo(i), meal.type, meal.foods,
        meal.cal + randomInt(-50, 50), meal.p + randomInt(-5, 5),
        meal.c + randomInt(-10, 10), meal.f + randomInt(-3, 3)
      );
    }
  }

  // ────────────────────────────────────────────
  // 5. TRANSACTIONS — 40+ entries for budget charts
  //    Covers: income, expenses, categories
  // ────────────────────────────────────────────
  const CATS = ['Food', 'Transport', 'Shopping', 'Bills', 'Healthcare', 'Learning', 'Entertainment', 'Savings', 'Rent', 'Other'];
  const DESCS = [
    'Groceries', 'Metro card', 'Uber', 'Zomato', 'Swiggy',
    'Netflix', 'Spotify', 'Electricity', 'Rent',
    'AWS credits', 'Gym membership', 'Supplements',
    'Coffee', 'Lunch', 'Udemy course', 'Books',
  ];

  // Incomes
  for (let i = 0; i < 3; i++) {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
    await dbInstance.runAsync(
      `INSERT INTO transactions (date, category, amount, type, description) VALUES (?, ?, ?, ?, ?)`,
      formatDate(d), 'Salary', 45000 + randomInt(-5000, 5000), 'income', 'Monthly salary'
    );
  }

  // Expenses — mix of fixed + variable
  // Rent (fixed monthly)
  for (let i = 0; i < 3; i++) {
    const d = new Date(); d.setDate(5); d.setMonth(d.getMonth() - i);
    await dbInstance.runAsync(
      `INSERT INTO transactions (date, category, amount, type, description) VALUES (?, ?, ?, ?, ?)`,
      formatDate(d), 'Rent', 12000, 'expense', 'Apartment rent'
    );
  }

  // Variable expenses
  for (let i = 0; i < 34; i++) {
    const cat = pick(CATS);
    await dbInstance.runAsync(
      `INSERT INTO transactions (date, category, amount, type, description) VALUES (?, ?, ?, ?, ?)`,
      daysAgo(randomInt(0, 29)), cat,
      cat === 'Food' ? randomFloat(200, 2000, 0) :
      cat === 'Transport' ? randomInt(100, 1500) :
      cat === 'Learning' ? randomInt(500, 5000) :
      cat === 'Savings' ? randomInt(2000, 10000) :
      randomFloat(50, 3000, 0),
      'expense',
      pick(DESCS)
    );
  }

  // ────────────────────────────────────────────
  // 6. TIMETABLE — 28 items for weekly schedule
  // ────────────────────────────────────────────
  const SCHEDULE = [
    // Sunday
    { d: 0, t: '08:00', a: 'Morning reflection & Quran', c: '#8b5cf6' },
    { d: 0, t: '09:30', a: 'Gym — Push day', c: '#e03e3e' },
    { d: 0, t: '12:00', a: 'Family lunch', c: '#0a8c2e' },
    { d: 0, t: '15:00', a: 'LeetCode / DSA practice', c: '#0b6bcf' },
    { d: 0, t: '18:00', a: 'Evening walk + podcast', c: '#0ea5e9' },
    { d: 0, t: '20:00', a: 'Plan next week', c: '#6366f1' },
    // Monday
    { d: 1, t: '06:30', a: 'Fajr + Morning adhkar', c: '#8b5cf6' },
    { d: 1, t: '09:00', a: 'Deep work — System Design', c: '#0b6bcf' },
    { d: 1, t: '12:00', a: 'Lunch + Walk', c: '#0ea5e9' },
    { d: 1, t: '14:00', a: 'Spring Boot study', c: '#d9730d' },
    { d: 1, t: '18:00', a: 'Maghrib + Isha', c: '#8b5cf6' },
    { d: 1, t: '20:00', a: 'Wind down / Journal', c: '#6366f1' },
    // Tuesday
    { d: 2, t: '06:30', a: 'Fajr + Gym — Pull', c: '#e03e3e' },
    { d: 2, t: '10:00', a: 'Job applications', c: '#0b6bcf' },
    { d: 2, t: '14:00', a: 'DSA practice', c: '#0b6bcf' },
    { d: 2, t: '16:00', a: 'Quran reading', c: '#8b5cf6' },
    { d: 2, t: '19:00', a: 'Budget review', c: '#0a8c2e' },
    // Wednesday
    { d: 3, t: '06:30', a: 'Fajr + Cardio', c: '#e03e3e' },
    { d: 3, t: '09:00', a: 'Interview prep', c: '#0b6bcf' },
    { d: 3, t: '12:00', a: 'Gym — Legs', c: '#e03e3e' },
    { d: 3, t: '15:00', a: 'Read 10 pages', c: '#d9730d' },
    { d: 3, t: '18:00', a: 'Family time', c: '#0a8c2e' },
    { d: 3, t: '20:00', a: 'Tahajjud prep', c: '#8b5cf6' },
    // Thursday
    { d: 4, t: '08:00', a: 'Morning routine', c: '#6366f1' },
    { d: 4, t: '10:00', a: 'Deep work block', c: '#0b6bcf' },
    { d: 4, t: '12:30', a: 'Gym — Upper', c: '#e03e3e' },
    { d: 4, t: '16:00', a: 'Weekly review', c: '#6366f1' },
    // Friday
    { d: 5, t: '07:00', a: 'Fajr + meal prep', c: '#0ea5e9' },
    { d: 5, t: '10:00', a: 'Deep work', c: '#0b6bcf' },
    { d: 5, t: '15:00', a: "Jumu'ah + rest", c: '#8b5cf6' },
    { d: 5, t: '17:00', a: 'Light reading', c: '#d9730d' },
    // Saturday
    { d: 6, t: '08:00', a: 'Sleep in + brunch', c: '#0ea5e9' },
    { d: 6, t: '11:00', a: 'Errands', c: '#d9730d' },
    { d: 6, t: '15:00', a: 'Plan next week', c: '#6366f1' },
    { d: 6, t: '18:00', a: 'Review goals', c: '#0a8c2e' },
  ];

  for (const s of SCHEDULE) {
    await dbInstance.runAsync(
      `INSERT INTO timetable (day_of_week, start_time, activity, color, repeat_type) VALUES (?, ?, ?, ?, ?)`,
      s.d, s.t, s.a, s.c, 'weekly'
    );
  }

  // ────────────────────────────────────────────
  // 7. HABITS — 8 habits with tracking
  // ────────────────────────────────────────────
  const HABITS = [
    { n: 'Read 10 pages', e: '📖', t: 1, u: 'pages' },
    { n: 'Drink 8 glasses water', e: '💧', t: 8, u: 'glasses' },
    { n: 'Meditate 10 min', e: '🧘', t: 1, u: 'session' },
    { n: 'No sugar day', e: '🚫', t: 1, u: 'day' },
    { n: 'Walk 10k steps', e: '🚶', t: 10000, u: 'steps' },
    { n: 'Gym session', e: '🏋️', t: 1, u: 'workout' },
    { n: 'Pray on time', e: '🕌', t: 5, u: 'prayers' },
    { n: 'Sleep by 10pm', e: '🌙', t: 1, u: 'night' },
  ];

  let hid = 0;
  for (const h of HABITS) {
    await dbInstance.runAsync(`INSERT OR IGNORE INTO habits (name, emoji, target_per_day, unit) VALUES (?, ?, ?, ?)`, h.n, h.e, h.t, h.u);
    hid++;
  }

  // Habit logs — 14 days
  const habitIds = Array.from({ length: hid }, (_, i) => i + 1);
  for (const id of habitIds) {
    for (let d = 0; d < 14; d++) {
      await dbInstance.runAsync(
        `INSERT OR IGNORE INTO habit_logs (habit_id, date, count) VALUES (?, ?, ?)`,
        id, daysAgo(d), randomInt(1, 3)
      );
    }
  }

  // ────────────────────────────────────────────
  // 8. JOURNAL — 12 entries
  // ────────────────────────────────────────────
  const ENTRIES = [
    { t: 'Week 1 Reflection', c: 'Started strong. Hit all targets except gym on Wednesday. Need to block that slot.', ty: 'reflection' },
    { t: 'Push PR!', c: 'Bench press 4×8 at 185lbs today. Felt amazing. Form is really coming together after 6 weeks of consistency.', ty: 'general' },
    { t: 'Sleep Struggles', c: 'Been up late scrolling. Need the 10pm cutoff. Setting a phone timer to enforce it.', ty: 'general' },
    { t: 'System Design Progress', c: 'Completed chapter on distributed systems. CAP theorem and consistency models next. Making good progress.', ty: 'planning' },
    { t: 'Gratitude', c: 'Alhamdulillah for another day. Grateful for family, health, and the chance to learn and grow.', ty: 'gratitude' },
    { t: 'Weekend Review', c: '5/7 days on time for prayers. 3 gym sessions. 1 cheat meal. Room for improvement — target: 7/7 next week.', ty: 'reflection' },
    { t: 'Meal Prep Done', c: 'Prepped: 2kg chicken, 1kg rice, 500g broccoli, sweet potato. Overnight oats for 4 days ready.', ty: 'general' },
    { t: 'Quran Tracker', c: 'Completed Surah Al-Kahf. Working on Ya-Seen. Target: 1 juz per week with reflection.', ty: 'general' },
    { t: 'Budget Check', c: 'Monthly expenses: ₹45,200. Under budget (₹50k). Food is the biggest category at ₹15k — can optimize by cooking more.', ty: 'planning' },
    { t: 'Interview Prep', c: '3 LeetCode mediums + 1 hard. System design on rate limiting. Feeling more confident with each session.', ty: 'planning' },
    { t: 'Morning Routine Win', c: 'New routine: 5am wake, Fajr, 30min reading, then gym. Been working for 5 days straight. Consistency is the key.', ty: 'general' },
    { t: 'Deep Work Log', c: '3 hours of focused coding today. Implemented auth flow. Zero distractions — no phone in the room. Game changer.', ty: 'general' },
  ];

  for (const e of ENTRIES) {
    await dbInstance.runAsync(
      `INSERT INTO journal_entries (date, title, content, type) VALUES (?, ?, ?, ?)`,
      daysAgo(randomInt(0, 14)), e.t, e.c, e.ty
    );
  }

  // ────────────────────────────────────────────
  // 9. GOALS — 6 with progress
  // ────────────────────────────────────────────
  const GOALS = [
    { t: 'Lose 5kg body fat', tv: 5, cv: 2.5, u: 'kg', a: 'Health', c: '#e03e3e' },
    { t: 'Save ₹50k this year', tv: 50000, cv: 18500, u: '₹', a: 'Finance', c: '#0a8c2e' },
    { t: 'AWS SAA Certified', tv: 1, cv: 0.4, u: 'cert', a: 'Career', c: '#0b6bcf' },
    { t: 'Read 20 books', tv: 20, cv: 7, u: 'books', a: 'Learning', c: '#8b5cf6' },
    { t: 'Bench Press 100kg', tv: 100, cv: 85, u: 'kg', a: 'Fitness', c: '#e03e3e' },
    { t: '30-day prayer streak', tv: 30, cv: 12, u: 'days', a: 'Spiritual', c: '#8b5cf6' },
  ];

  for (const g of GOALS) {
    await dbInstance.runAsync(
      `INSERT INTO goals (title, target_value, current_value, unit, area, color) VALUES (?, ?, ?, ?, ?, ?)`,
      g.t, g.tv, g.cv, g.u, g.a, g.c
    );
  }

  // ────────────────────────────────────────────
  // 10. BUDGET CATEGORIES — 8
  // ────────────────────────────────────────────
  const BUDGETS = [
    { n: 'Rent', b: 12000, i: '🏠' },
    { n: 'Food', b: 8000, i: '🍎' },
    { n: 'Transport', b: 2500, i: '🚇' },
    { n: 'Learning', b: 3000, i: '📚' },
    { n: 'Savings', b: 8000, i: '💰' },
    { n: 'Entertainment', b: 2000, i: '🎬' },
    { n: 'Healthcare', b: 1500, i: '💊' },
    { n: 'Shopping', b: 3000, i: '🛍️' },
  ];

  for (const b of BUDGETS) {
    await dbInstance.runAsync(`INSERT OR IGNORE INTO budget_categories (name, monthly_budget, icon) VALUES (?, ?, ?)`, b.n, b.b, b.i);
  }

  // ────────────────────────────────────────────
  // 11. DAILY AFFIRMATIONS — 7
  // ────────────────────────────────────────────
  const AFFIRMATIONS = [
    'I am consistent and disciplined. Every small step compounds into greatness.',
    'I choose progress over perfection. My focus is my superpower.',
    'I am building the future I want to live in. Discipline is the bridge.',
    'Today I will be better than yesterday. Every moment is an opportunity.',
    'I am grateful for this journey. Patience and persistence pay off.',
    'My goals are clear and achievable. I take one step at a time.',
    'Alhamdulillah for everything. Trust the process, embrace the growth.',
  ];

  for (let i = 0; i < 7; i++) {
    await dbInstance.runAsync(`INSERT OR IGNORE INTO daily_affirmations (date, content) VALUES (?, ?)`, daysAgo(i), AFFIRMATIONS[i]);
  }

  // ────────────────────────────────────────────
  // 12. DASHBOARD WIDGETS
  // ────────────────────────────────────────────
  const widgetKeys = ['at-a-glance', 'quick-stats', 'quick-log', 'mood', 'expenses', 'prayer-tracker', 'monthly-stats'];
  for (let i = 0; i < widgetKeys.length; i++) {
    await dbInstance.runAsync(
      `INSERT INTO dashboard_widgets (widget_key, sort_order, visible) VALUES (?, ?, ?)`,
      widgetKeys[i], i, 1
    );
  }
}

/**
 * Verify all tables have data.
 */
export async function verifySeedData(): Promise<Record<string, number>> {
  const dbInstance = await db.initDatabase();
  const tables = [
    'daily_logs', 'prayer_logs', 'gym_logs', 'nutrition_logs',
    'transactions', 'timetable', 'habits', 'habit_logs',
    'journal_entries', 'goals', 'budget_categories',
    'daily_affirmations', 'dashboard_widgets',
  ];

  const counts: Record<string, number> = {};
  for (const table of tables) {
    try {
      const rows = await dbInstance.getAllAsync<any>(`SELECT COUNT(*) as count FROM ${table}`);
      counts[table] = rows[0]?.count || 0;
    } catch {
      counts[table] = -1;
    }
  }
  return counts;
}