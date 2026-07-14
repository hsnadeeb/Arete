/**
 * Seed Data — Comprehensive dummy data for UI testing
 *
 * This module is the single source of truth for generating test data
 * across every table in the local SQLite database. It is invoked:
 *
 *   1. Automatically on first app start (via the boot path — see db/service.ts
 *      `seedAllData` for a small 7-day bootstrap).
 *   2. On-demand from the Settings screen ("Seed Test Data" actions).
 *   3. Programmatically via `runSeed({ days, force })` from anywhere in the app.
 *
 * Rules:
 *   • Generates the last `days` days of data for time-series tables
 *     (daily_logs, prayer_logs, gym_logs, nutrition_logs, transactions,
 *      habit_logs, journal_entries, daily_affirmations).
 *   • Fills every table with realistic dummy data so every UI screen has
 *     something to render during testing.
 *   • NEVER seeds `prayer_timings` — those are fetched live from the
 *     Aladhan API at runtime (see services/prayerApi.ts).
 *   • NEVER wipes `ai_providers`, `ai_programs`, `ai_program_items`,
 *     `focus_sessions`, or `prayer_timings` — those hold user state.
 *
 * Usage:
 *
 *   import { runSeed } from '@/data/seedData';
 *   const result = await runSeed({ days: 14 });              // idempotent
 *   const result = await runSeed({ days: 14, force: true }); // wipe & reseed
 */

import * as db from '../db/service';
import type { SQLiteDatabase } from 'expo-sqlite';

// ─── Helpers ───────────────────────────────────────────────────────────────

export function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function formatDate(d: Date): string {
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

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Constants ─────────────────────────────────────────────────────────────

const PRAYER_NAMES = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

const WORKOUTS: Array<{ name: string; exercises: string; duration: number }> = [
  { name: 'Push A', exercises: 'Bench Press 4×8\nOHP 3×10\nTricep Pushdown 3×12\nLateral Raise 3×15', duration: 50 },
  { name: 'Push B', exercises: 'Incline Bench 4×8\nDB Shoulder Press 3×10\nSkull Crushers 3×12\nFront Raise 3×15', duration: 45 },
  { name: 'Pull A', exercises: 'Deadlift 3×5\nPull-ups 3×8\nBarbell Row 3×10\nFace Pulls 3×15', duration: 55 },
  { name: 'Pull B', exercises: 'RDL 3×8\nLat Pulldown 3×10\nCable Row 3×12\nShrugs 3×15', duration: 50 },
  { name: 'Legs A', exercises: 'Squat 4×6\nRDL 3×8\nLeg Press 3×12\nCalf Raises 4×15', duration: 55 },
  { name: 'Legs B', exercises: 'Front Squat 4×6\nBulgarian Split Squat 3×10\nHamstring Curl 3×12\nWalking Lunges 3×15', duration: 50 },
  { name: 'Cardio + Core', exercises: 'Treadmill 20min\nJump Rope 10min\nPlanks 3×60s\nCrunches 3×15', duration: 45 },
  { name: 'Full Body', exercises: 'Clean & Jerk 3×5\nPull-ups 3×8\nSquat 3×10\nPush Press 3×10', duration: 60 },
  { name: 'Upper Hypertrophy', exercises: 'Incline Bench 4×10\nLat Pulldown 4×10\nDB Curl 3×15\nTricep Rope 3×15', duration: 40 },
  { name: 'Lower Strength', exercises: 'Deadlift 5×3\nBulgarian Split Squat 3×10\nNordic Curl 3×8\nBack Extensions 3×12', duration: 50 },
  { name: 'Active Recovery', exercises: 'Stretching 20min\nFoam Rolling 15min\nMobility Drills 15min', duration: 50 },
  { name: 'Chest & Tris', exercises: 'Dumbbell Press 4×10\nIncline Fly 3×12\nTricep Pushdown 4×12\nOverhead Extension 3×12', duration: 45 },
];

const MEALS: Array<{ type: string; foods: string; cal: number; p: number; c: number; f: number }> = [
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

const TRANSACTION_CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Healthcare', 'Learning', 'Entertainment', 'Savings', 'Rent', 'Other'];
const TRANSACTION_DESCS = [
  'Groceries', 'Metro card', 'Uber', 'Zomato', 'Swiggy',
  'Netflix', 'Spotify', 'Electricity', 'Rent',
  'AWS credits', 'Gym membership', 'Supplements',
  'Coffee', 'Lunch', 'Udemy course', 'Books',
];

const SCHEDULE: Array<{ d: number; t: string; a: string; c: string }> = [
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

const HABITS: Array<{ n: string; e: string; t: number; u: string }> = [
  { n: 'Read 10 pages', e: '📖', t: 1, u: 'pages' },
  { n: 'Drink 8 glasses water', e: '💧', t: 8, u: 'glasses' },
  { n: 'Meditate 10 min', e: '🧘', t: 1, u: 'session' },
  { n: 'No sugar day', e: '🚫', t: 1, u: 'day' },
  { n: 'Walk 10k steps', e: '🚶', t: 10000, u: 'steps' },
  { n: 'Gym session', e: '🏋️', t: 1, u: 'workout' },
  { n: 'Pray on time', e: '🕌', t: 5, u: 'prayers' },
  { n: 'Sleep by 10pm', e: '🌙', t: 1, u: 'night' },
];

const JOURNAL_ENTRIES: Array<{ t: string; c: string; ty: string }> = [
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

const GOALS: Array<{ t: string; tv: number; cv: number; u: string; a: string; c: string }> = [
  { t: 'Lose 5kg body fat', tv: 5, cv: 2.5, u: 'kg', a: 'Health', c: '#e03e3e' },
  { t: 'Save ₹50k this year', tv: 50000, cv: 18500, u: '₹', a: 'Finance', c: '#0a8c2e' },
  { t: 'AWS SAA Certified', tv: 1, cv: 0.4, u: 'cert', a: 'Career', c: '#0b6bcf' },
  { t: 'Read 20 books', tv: 20, cv: 7, u: 'books', a: 'Learning', c: '#8b5cf6' },
  { t: 'Bench Press 100kg', tv: 100, cv: 85, u: 'kg', a: 'Fitness', c: '#e03e3e' },
  { t: '30-day prayer streak', tv: 30, cv: 12, u: 'days', a: 'Spiritual', c: '#8b5cf6' },
];

const BUDGETS: Array<{ n: string; b: number; i: string }> = [
  { n: 'Rent', b: 12000, i: '🏠' },
  { n: 'Food', b: 8000, i: '🍎' },
  { n: 'Transport', b: 2500, i: '🚇' },
  { n: 'Learning', b: 3000, i: '📚' },
  { n: 'Savings', b: 8000, i: '💰' },
  { n: 'Entertainment', b: 2000, i: '🎬' },
  { n: 'Healthcare', b: 1500, i: '💊' },
  { n: 'Shopping', b: 3000, i: '🛍️' },
];

const AFFIRMATIONS = [
  'I am consistent and disciplined. Every small step compounds into greatness.',
  'I choose progress over perfection. My focus is my superpower.',
  'I am building the future I want to live in. Discipline is the bridge.',
  'Today I will be better than yesterday. Every moment is an opportunity.',
  'I am grateful for this journey. Patience and persistence pay off.',
  'My goals are clear and achievable. I take one step at a time.',
  'Alhamdulillah for everything. Trust the process, embrace the growth.',
];

const DASHBOARD_WIDGET_KEYS = [
  'at-a-glance',
  'ai-plan',
  'quick-stats',
  'todos',
  'quick-log',
  'mood',
  'expenses',
  'prayer-tracker',
  'monthly-stats',
];

const SEED_GYM_DETAILS = [
  [{ name: 'Bench Press', sets: 4, reps: 8, weight: '185 lbs', rest_seconds: 120, notes: 'Warm up with empty bar' },
   { name: 'Overhead Press', sets: 3, reps: 10, weight: '135 lbs', rest_seconds: 90, notes: 'Strict form' },
   { name: 'Tricep Pushdown', sets: 3, reps: 12, weight: '55 lbs', rest_seconds: 60, notes: 'Squeeze at bottom' },
   { name: 'Lateral Raise', sets: 3, reps: 15, weight: '20 lbs', rest_seconds: 60, notes: 'Light, controlled' }],
  [{ name: 'Deadlift', sets: 3, reps: 5, weight: '315 lbs', rest_seconds: 180, notes: 'Belt on last set' },
   { name: 'Pull-ups', sets: 3, reps: 8, weight: 'bodyweight', rest_seconds: 90, notes: 'Full range' },
   { name: 'Barbell Row', sets: 3, reps: 10, weight: '155 lbs', rest_seconds: 90, notes: 'Chest supported' },
   { name: 'Face Pulls', sets: 3, reps: 15, weight: '40 lbs', rest_seconds: 60, notes: 'Rear delt focus' }],
  [{ name: 'Squat', sets: 4, reps: 6, weight: '275 lbs', rest_seconds: 180, notes: 'Depth check' },
   { name: 'Romanian Deadlift', sets: 3, reps: 8, weight: '225 lbs', rest_seconds: 120, notes: 'Hamstring stretch' },
   { name: 'Leg Press', sets: 3, reps: 12, weight: '360 lbs', rest_seconds: 90, notes: 'Feet shoulder width' },
   { name: 'Calf Raises', sets: 4, reps: 15, weight: '90 lbs', rest_seconds: 60, notes: 'Slow eccentric' }],
  [{ name: 'Incline Bench', sets: 4, reps: 8, weight: '165 lbs', rest_seconds: 120, notes: '45° incline' },
   { name: 'Dumbbell Shoulder Press', sets: 3, reps: 10, weight: '60 lbs', rest_seconds: 90, notes: 'Each arm' },
   { name: 'Skull Crushers', sets: 3, reps: 12, weight: '65 lbs', rest_seconds: 60, notes: 'Elbows in' },
   { name: 'Front Raise', sets: 3, reps: 15, weight: '15 lbs', rest_seconds: 60, notes: 'Alternating' }],
  [{ name: 'Lat Pulldown', sets: 4, reps: 10, weight: '160 lbs', rest_seconds: 90, notes: 'Wide grip' },
   { name: 'Cable Row', sets: 3, reps: 12, weight: '140 lbs', rest_seconds: 90, notes: 'Squeeze shoulder blades' },
   { name: 'Dumbbell Curl', sets: 3, reps: 15, weight: '35 lbs', rest_seconds: 60, notes: 'No swinging' },
   { name: 'Shrugs', sets: 3, reps: 15, weight: '185 lbs', rest_seconds: 60, notes: 'Hold 1s at top' }],
  [{ name: 'Front Squat', sets: 4, reps: 6, weight: '225 lbs', rest_seconds: 180, notes: 'Elbows up' },
   { name: 'Bulgarian Split Squat', sets: 3, reps: 10, weight: '60 lbs', rest_seconds: 90, notes: 'Each leg' },
   { name: 'Hamstring Curl', sets: 3, reps: 12, weight: '80 lbs', rest_seconds: 60, notes: 'Full squeeze' },
   { name: 'Walking Lunges', sets: 3, reps: 15, weight: '50 lbs', rest_seconds: 90, notes: 'Total reps' }],
  [{ name: 'Treadmill', sets: 1, reps: 1, weight: 'n/a', rest_seconds: 0, notes: '20 min easy pace' },
   { name: 'Jump Rope', sets: 3, reps: 1, weight: 'n/a', rest_seconds: 60, notes: '10 min total' },
   { name: 'Planks', sets: 3, reps: 1, weight: 'n/a', rest_seconds: 60, notes: '60 seconds each' },
   { name: 'Crunches', sets: 3, reps: 15, weight: 'bodyweight', rest_seconds: 45, notes: 'Controlled tempo' }],
];

const SEED_MEAL_DETAILS = [
  [{ name: 'Scrambled eggs', calories: 220, protein: 18, carbs: 2, fat: 16, portion: '3 eggs' },
   { name: 'Avocado toast', calories: 280, protein: 6, carbs: 28, fat: 18, portion: '1 slice' },
   { name: 'Protein shake', calories: 140, protein: 26, carbs: 5, fat: 2, portion: '1 scoop' },
   { name: 'Orange juice', calories: 110, protein: 2, carbs: 25, fat: 0, portion: '1 cup' }],
  [{ name: 'Oatmeal', calories: 150, protein: 5, carbs: 27, fat: 3, portion: '1 cup cooked' },
   { name: 'Greek yogurt', calories: 100, protein: 15, carbs: 6, fat: 0, portion: '150g' },
   { name: 'Berries', calories: 60, protein: 1, carbs: 15, fat: 0, portion: '1 cup' },
   { name: 'Almonds', calories: 160, protein: 6, carbs: 6, fat: 14, portion: '1 oz' }],
  [{ name: 'Grilled chicken', calories: 250, protein: 45, carbs: 0, fat: 7, portion: '150g' },
   { name: 'Brown rice', calories: 215, protein: 5, carbs: 45, fat: 2, portion: '1 cup' },
   { name: 'Broccoli', calories: 55, protein: 4, carbs: 11, fat: 1, portion: '1 cup' },
   { name: 'Olive oil', calories: 120, protein: 0, carbs: 0, fat: 14, portion: '1 tbsp' }],
  [{ name: 'Salmon fillet', calories: 300, protein: 38, carbs: 0, fat: 16, portion: '150g' },
   { name: 'Sweet potato', calories: 180, protein: 4, carbs: 41, fat: 0, portion: '1 medium' },
   { name: 'Asparagus', calories: 40, protein: 4, carbs: 7, fat: 0, portion: '1 cup' },
   { name: 'Lemon butter', calories: 100, protein: 0, carbs: 0, fat: 11, portion: '1 tbsp' }],
  [{ name: 'Turkey sandwich', calories: 380, protein: 30, carbs: 42, fat: 12, portion: '1 whole' },
   { name: 'Side salad', calories: 80, protein: 3, carbs: 8, fat: 5, portion: '1 bowl' },
   { name: 'Apple', calories: 95, protein: 0, carbs: 25, fat: 0, portion: '1 medium' },
   { name: 'Hummus', calories: 80, protein: 3, carbs: 10, fat: 5, portion: '2 tbsp' }],
  [{ name: 'Beef stir-fry', calories: 420, protein: 48, carbs: 18, fat: 20, portion: '200g' },
   { name: 'Jasmine rice', calories: 205, protein: 4, carbs: 45, fat: 0, portion: '1 cup' },
   { name: 'Mixed veggies', calories: 90, protein: 3, carbs: 18, fat: 0, portion: '1 cup' },
   { name: 'Sesame oil', calories: 120, protein: 0, carbs: 0, fat: 14, portion: '1 tbsp' }],
  [{ name: 'Lentil curry', calories: 300, protein: 18, carbs: 48, fat: 6, portion: '1 bowl' },
   { name: 'Naan', calories: 180, protein: 5, carbs: 32, fat: 4, portion: '1 piece' },
   { name: 'Raita', calories: 80, protein: 4, carbs: 6, fat: 4, portion: '1/2 cup' },
   { name: 'Cucumber salad', calories: 30, protein: 1, carbs: 6, fat: 0, portion: '1 cup' }],
];

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ─── Types ─────────────────────────────────────────────────────────────────

export interface SeedOptions {
  /** How many days of history to generate (default: 14 = 2 weeks). */
  days?: number;
  /** Wipe all seedable tables first, then reseed (default: false). */
  force?: boolean;
  /** Skip the existing-data check (same as force but without wiping). */
  ignoreExisting?: boolean;
}

export interface SeedResult {
  days: number;
  force: boolean;
  counts: Record<string, number>;
  duration_ms: number;
  skipped_existing: boolean;
}

// ─── Per-table seeders ─────────────────────────────────────────────────────
// Each seeder:
//   • Returns the number of NEW rows it inserted (0 if skipped).
//   • Is idempotent: if force=false and the table already has rows, it skips.
//   • When force=true, the caller clears the table first.
// ───────────────────────────────────────────────────────────────────────────

async function seedDailyLogs(
  dbInstance: SQLiteDatabase,
  days: number,
  force: boolean
): Promise<number> {
  if (!force) {
    const existing = await dbInstance.getFirstAsync<any>('SELECT id FROM daily_logs LIMIT 1');
    if (existing) return 0;
  }

  const baseWeight = 79.5;
  let inserted = 0;

  for (let i = 0; i < days; i++) {
    const d = daysAgo(i);
    const dayOfWeek = new Date(d + 'T12:00:00').getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dayIndex = days - 1 - i; // 0 = oldest day, days-1 = today

    const weightTrend = baseWeight - (dayIndex * 0.065) + (Math.random() - 0.5) * 0.4;
    const waterBase = isWeekend ? 1600 : 2100;
    const stepsBase = isWeekend ? 4500 : 8500;
    const moodBase = Math.min(5, Math.max(1, Math.round(2.5 + dayIndex * 0.08)));
    const sleepBase = 6.2 + Math.random() * 1.8;

    await dbInstance.runAsync(
      `INSERT OR IGNORE INTO daily_logs
       (date, weight, water_ml, steps, mood, sleep_hours, sleep_quality, calories, protein_g, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      d,
      parseFloat(weightTrend.toFixed(1)),
      Math.round(waterBase + (Math.random() - 0.5) * 600),
      Math.round(stepsBase + (Math.random() - 0.5) * 3000),
      moodBase,
      parseFloat(sleepBase.toFixed(1)),
      Math.round(Math.min(5, Math.max(1, 2.5 + Math.random() * 2.5))),
      Math.round(1900 + Math.random() * 700),
      parseFloat((60 + Math.random() * 90).toFixed(0)),
      pick([
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
      ])
    );
    inserted++;
  }
  return inserted;
}

async function seedPrayerLogs(
  dbInstance: SQLiteDatabase,
  days: number,
  force: boolean
): Promise<number> {
  if (!force) {
    const existing = await dbInstance.getFirstAsync<any>('SELECT id FROM prayer_logs LIMIT 1');
    if (existing) return 0;
  }

  let inserted = 0;
  for (let i = 0; i < days; i++) {
    const d = daysAgo(i);
    const dayOfWeek = new Date(d + 'T12:00:00').getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    for (const name of PRAYER_NAMES) {
      let p: { onTime: number; qada: number };
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
      inserted++;
    }
  }
  return inserted;
}

async function seedGymLogs(
  dbInstance: SQLiteDatabase,
  days: number,
  force: boolean
): Promise<number> {
  if (!force) {
    const existing = await dbInstance.getFirstAsync<any>('SELECT id FROM gym_logs LIMIT 1');
    if (existing) return 0;
  }

  // ~3 sessions per week, scaled to `days`
  const sessionCount = Math.max(2, Math.round((days / 7) * 3));
  let inserted = 0;

  for (let i = 0; i < sessionCount; i++) {
    const d = daysAgo(randomInt(0, Math.max(0, days - 1)));
    const w = WORKOUTS[i % WORKOUTS.length];
    await dbInstance.runAsync(
      `INSERT INTO gym_logs (date, workout_name, exercises, duration_minutes, notes) VALUES (?, ?, ?, ?, ?)`,
      d, w.name, w.exercises, w.duration + randomInt(-5, 10),
      pick(['Felt strong!', 'Good form', 'PR attempt', 'Light session', 'Recovery day', 'Nailed it'])
    );
    inserted++;
  }
  return inserted;
}

async function seedNutritionLogs(
  dbInstance: SQLiteDatabase,
  days: number,
  force: boolean
): Promise<number> {
  if (!force) {
    const existing = await dbInstance.getFirstAsync<any>('SELECT id FROM nutrition_logs LIMIT 1');
    if (existing) return 0;
  }

  let inserted = 0;
  for (let i = 0; i < days; i++) {
    // 2 meals per day
    for (let m = 0; m < 2; m++) {
      const meal = pick(MEALS);
      await dbInstance.runAsync(
        `INSERT INTO nutrition_logs (date, meal_type, foods, calories, protein_g, carbs_g, fat_g) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        daysAgo(i), meal.type, meal.foods,
        meal.cal + randomInt(-50, 50),
        meal.p + randomInt(-5, 5),
        meal.c + randomInt(-10, 10),
        meal.f + randomInt(-3, 3)
      );
      inserted++;
    }
  }
  return inserted;
}

async function seedTransactions(
  dbInstance: SQLiteDatabase,
  days: number,
  force: boolean
): Promise<number> {
  if (!force) {
    const existing = await dbInstance.getFirstAsync<any>('SELECT id FROM transactions LIMIT 1');
    if (existing) return 0;
  }

  let inserted = 0;

  // Incomes — last 3 months
  for (let i = 0; i < 3; i++) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    await dbInstance.runAsync(
      `INSERT INTO transactions (date, category, amount, type, description) VALUES (?, ?, ?, ?, ?)`,
      formatDate(d), 'Salary', 45000 + randomInt(-5000, 5000), 'income', 'Monthly salary'
    );
    inserted++;
  }

  // Rent — last 3 months
  for (let i = 0; i < 3; i++) {
    const d = new Date();
    d.setDate(5);
    d.setMonth(d.getMonth() - i);
    await dbInstance.runAsync(
      `INSERT INTO transactions (date, category, amount, type, description) VALUES (?, ?, ?, ?, ?)`,
      formatDate(d), 'Rent', 12000, 'expense', 'Apartment rent'
    );
    inserted++;
  }

  // Variable expenses — scaled to `days`
  const variableCount = Math.max(8, Math.round((days / 7) * 8));
  for (let i = 0; i < variableCount; i++) {
    const cat = pick(TRANSACTION_CATEGORIES);
    const amount =
      cat === 'Food' ? randomFloat(200, 2000, 0) :
      cat === 'Transport' ? randomInt(100, 1500) :
      cat === 'Learning' ? randomInt(500, 5000) :
      cat === 'Savings' ? randomInt(2000, 10000) :
      randomFloat(50, 3000, 0);

    await dbInstance.runAsync(
      `INSERT INTO transactions (date, category, amount, type, description) VALUES (?, ?, ?, ?, ?)`,
      daysAgo(randomInt(0, Math.max(0, days - 1))), cat, amount, 'expense', pick(TRANSACTION_DESCS)
    );
    inserted++;
  }
  return inserted;
}

async function seedTimetable(
  dbInstance: SQLiteDatabase,
  force: boolean
): Promise<number> {
  if (!force) {
    const existing = await dbInstance.getFirstAsync<any>('SELECT id FROM timetable LIMIT 1');
    if (existing) return 0;
  }

  let inserted = 0;
  for (const s of SCHEDULE) {
    await dbInstance.runAsync(
      `INSERT INTO timetable (day_of_week, start_time, activity, color, repeat_type) VALUES (?, ?, ?, ?, ?)`,
      s.d, s.t, s.a, s.c, 'weekly'
    );
    inserted++;
  }
  return inserted;
}

async function seedHabitsAndLogs(
  dbInstance: SQLiteDatabase,
  days: number,
  force: boolean
): Promise<{ habits: number; logs: number }> {
  if (!force) {
    const existing = await dbInstance.getFirstAsync<any>('SELECT id FROM habits LIMIT 1');
    if (existing) return { habits: 0, logs: 0 };
  }

  let habitsInserted = 0;
  for (const h of HABITS) {
    await dbInstance.runAsync(
      `INSERT OR IGNORE INTO habits (name, emoji, target_per_day, unit) VALUES (?, ?, ?, ?)`,
      h.n, h.e, h.t, h.u
    );
    habitsInserted++;
  }

  // Map habit names to ids (they were inserted in order)
  const habitRows = await dbInstance.getAllAsync<any>(
    `SELECT id, name FROM habits WHERE name IN (${HABITS.map(() => '?').join(',')})`,
    ...HABITS.map((h) => h.n)
  );
  const idByName = new Map<string, number>();
  for (const r of habitRows) idByName.set(r.name, r.id);

  let logsInserted = 0;
  // log every habit for `days` days back
  for (const h of HABITS) {
    const hid = idByName.get(h.n);
    if (!hid) continue;
    for (let d = 0; d < days; d++) {
      await dbInstance.runAsync(
        `INSERT OR IGNORE INTO habit_logs (habit_id, date, count) VALUES (?, ?, ?)`,
        hid, daysAgo(d), randomInt(1, 3)
      );
      logsInserted++;
    }
  }
  return { habits: habitsInserted, logs: logsInserted };
}

async function seedJournalEntries(
  dbInstance: SQLiteDatabase,
  days: number,
  force: boolean
): Promise<number> {
  if (!force) {
    const existing = await dbInstance.getFirstAsync<any>('SELECT id FROM journal_entries LIMIT 1');
    if (existing) return 0;
  }

  // ~1 entry per day, capped at the entries we have defined
  const count = Math.min(JOURNAL_ENTRIES.length, Math.max(3, days));
  let inserted = 0;
  for (let i = 0; i < count; i++) {
    const e = JOURNAL_ENTRIES[i];
    await dbInstance.runAsync(
      `INSERT INTO journal_entries (date, title, content, type) VALUES (?, ?, ?, ?)`,
      daysAgo(randomInt(0, Math.max(0, days - 1))), e.t, e.c, e.ty
    );
    inserted++;
  }
  return inserted;
}

async function seedGoals(
  dbInstance: SQLiteDatabase,
  force: boolean
): Promise<number> {
  if (!force) {
    const existing = await dbInstance.getFirstAsync<any>('SELECT id FROM goals LIMIT 1');
    if (existing) return 0;
  }

  let inserted = 0;
  for (const g of GOALS) {
    await dbInstance.runAsync(
      `INSERT INTO goals (title, target_value, current_value, unit, area, color) VALUES (?, ?, ?, ?, ?, ?)`,
      g.t, g.tv, g.cv, g.u, g.a, g.c
    );
    inserted++;
  }
  return inserted;
}

async function seedBudgetCategories(
  dbInstance: SQLiteDatabase,
  force: boolean
): Promise<number> {
  if (!force) {
    const existing = await dbInstance.getFirstAsync<any>('SELECT id FROM budget_categories LIMIT 1');
    if (existing) return 0;
  }

  let inserted = 0;
  for (const b of BUDGETS) {
    await dbInstance.runAsync(
      `INSERT OR IGNORE INTO budget_categories (name, monthly_budget, icon) VALUES (?, ?, ?)`,
      b.n, b.b, b.i
    );
    inserted++;
  }
  return inserted;
}

async function seedDailyAffirmations(
  dbInstance: SQLiteDatabase,
  days: number,
  force: boolean
): Promise<number> {
  if (!force) {
    const existing = await dbInstance.getFirstAsync<any>('SELECT id FROM daily_affirmations LIMIT 1');
    if (existing) return 0;
  }

  let inserted = 0;
  const count = Math.min(AFFIRMATIONS.length, Math.max(1, days));
  for (let i = 0; i < count; i++) {
    await dbInstance.runAsync(
      `INSERT OR IGNORE INTO daily_affirmations (date, content) VALUES (?, ?)`,
      daysAgo(i), AFFIRMATIONS[i]
    );
    inserted++;
  }
  return inserted;
}

async function seedDashboardWidgets(
  dbInstance: SQLiteDatabase,
  force: boolean
): Promise<number> {
  if (!force) {
    const existing = await dbInstance.getFirstAsync<any>('SELECT id FROM dashboard_widgets LIMIT 1');
    if (existing) return 0;
  }

  let inserted = 0;
  for (let i = 0; i < DASHBOARD_WIDGET_KEYS.length; i++) {
    await dbInstance.runAsync(
      `INSERT OR IGNORE INTO dashboard_widgets (widget_key, sort_order, visible) VALUES (?, ?, ?)`,
      DASHBOARD_WIDGET_KEYS[i], i, 1
    );
    inserted++;
  }
  return inserted;
}

async function seedAiPrograms(
  dbInstance: SQLiteDatabase,
  force: boolean
): Promise<{ programs: number; items: number }> {
  if (!force) {
    const existing = await dbInstance.getFirstAsync<any>('SELECT id FROM ai_programs LIMIT 1');
    if (existing) return { programs: 0, items: 0 };
  }

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const ws = weekStart.toISOString().split('T')[0];
  const we = weekEnd.toISOString().split('T')[0];

  let programsInserted = 0;
  let itemsInserted = 0;

  // Deactivate existing programs first if force
  if (force) {
    await dbInstance.runAsync('UPDATE ai_programs SET is_active = 0');
  }

  const programTypes = [
    { type: 'gym', title: 'Seed Push/Pull/Legs Split', details: SEED_GYM_DETAILS },
    { type: 'food', title: 'Seed High Protein Meal Plan', details: SEED_MEAL_DETAILS },
  ];

  for (const program of programTypes) {
    const progResult = await dbInstance.runAsync(
      `INSERT INTO ai_programs (type, title, week_start, week_end, context_snapshot, raw_response, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      program.type,
      program.title,
      ws,
      we,
      '',
      '',
      1
    );
    const programId = progResult.lastInsertRowId;
    programsInserted++;

    for (let day = 0; day < 7; day++) {
      const details = program.details[day % program.details.length];
      await dbInstance.runAsync(
        `INSERT INTO ai_program_items (program_id, day_index, day_label, title, description, details_json, sort_order, is_completed) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        programId,
        day,
        DAY_LABELS[day],
        program.type === 'gym' ? `Day ${day + 1} — ${['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Cardio', 'Recovery'][day]}` : `${DAY_LABELS[day]} Meals`,
        program.type === 'gym' ? `${details.length} exercises for today` : `${details.length} meals planned`,
        JSON.stringify(details.map((d) => ({ type: program.type === 'gym' ? 'exercise' : 'meal', ...d }))),
        day,
        Math.random() < 0.3 ? 1 : 0
      );
      itemsInserted++;
    }
  }

  return { programs: programsInserted, items: itemsInserted };
}

// ─── Force-clear ───────────────────────────────────────────────────────────
// Wipes only seedable tables. Preserves: prayer_timings, ai_providers,
// ai_programs, ai_program_items, focus_sessions (user state).
// ───────────────────────────────────────────────────────────────────────────

async function clearSeedableData(dbInstance: SQLiteDatabase): Promise<void> {
  // Order matters because of FK constraints
  const tables = [
    'habit_logs', 'habits', 'dashboard_widgets', 'timetable',
    'budget_categories', 'goals', 'journal_entries', 'transactions',
    'nutrition_logs', 'gym_logs', 'prayer_logs', 'daily_logs', 'daily_affirmations',
    'user_profile',
  ];
  for (const table of tables) {
    try { await dbInstance.runAsync(`DELETE FROM ${table}`); } catch (_) {}
  }
}

/**
 * Wipe ALL user data from the database for a true empty-DB test.
 *
 * Differs from `clearSeedableData` (used by `force: true`):
 *   • Also wipes `prayer_timings`, `focus_sessions`, `ai_programs`,
 *     `ai_program_items` — the things the force-reset preserves.
 *   • Preserves:
 *       - `ai_providers`       — holds the user's API keys
 *       - `dashboard_widgets`  — the dashboard layout. Without it the
 *         DashboardScreen would collapse to its empty "Welcome" state
 *         instead of showing widgets with empty-data placeholders.
 *
 * Order matters because of FK constraints (children before parents).
 */
export async function wipeAllData(): Promise<{ preserved: string[]; wiped: string[] }> {
  const dbInstance = await db.initDatabase();

  // Children first (FK targets), parents last.
  const tables = [
    'habit_logs', 'ai_program_items', 'habits', 'timetable',
    'budget_categories', 'goals', 'journal_entries', 'transactions',
    'nutrition_logs', 'gym_logs', 'prayer_logs', 'daily_logs',
    'daily_affirmations', 'prayer_timings', 'focus_sessions', 'ai_programs',
    'user_profile',
  ];
  for (const table of tables) {
    try { await dbInstance.runAsync(`DELETE FROM ${table}`); } catch (_) {}
  }
  // NOTE: intentionally NOT wiped:
  //   - ai_providers       → holds user API keys
  //   - dashboard_widgets  → UI layout, not user data

  return {
    preserved: ['ai_providers', 'dashboard_widgets'],
    wiped: [
      'habit_logs',
      'ai_program_items',
      'habits',
      'timetable',
      'budget_categories',
      'goals',
      'journal_entries',
      'transactions',
      'nutrition_logs',
      'gym_logs',
      'prayer_logs',
      'daily_logs',
      'daily_affirmations',
      'prayer_timings',
      'focus_sessions',
      'ai_programs',
      'user_profile',
    ],
  };
}

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Seed every seedable table with realistic dummy data.
 *
 * @param opts.days   How many days of history to generate. Default 14 (2 weeks).
 * @param opts.force  Wipe existing seedable rows first. Default false.
 *                    Safe to use — never wipes user state (prayer_timings,
 *                    AI providers, focus sessions, etc.).
 * @param opts.ignoreExisting  Bypass the "already-seeded" check without
 *                             wiping. Useful when you only want to backfill
 *                             a specific table later.
 *
 * Safe to call multiple times — with `force=false` it short-circuits tables
 * that already have rows.
 */
export async function seedAllTables(opts: SeedOptions = {}): Promise<SeedResult> {
  const days = opts.days ?? 14;
  const force = opts.force ?? false;
  const ignoreExisting = opts.ignoreExisting ?? false;
  const t0 = Date.now();

  const dbInstance = await db.initDatabase();

  if (force) {
    await clearSeedableData(dbInstance);
  }

  const counts: Record<string, number> = {};
  const skipped_existing = !force && !ignoreExisting;

  counts.daily_logs = await seedDailyLogs(dbInstance, days, force);
  await sleep(5);
  counts.prayer_logs = await seedPrayerLogs(dbInstance, days, force);
  await sleep(5);
  counts.gym_logs = await seedGymLogs(dbInstance, days, force);
  await sleep(5);
  counts.nutrition_logs = await seedNutritionLogs(dbInstance, days, force);
  await sleep(5);
  counts.transactions = await seedTransactions(dbInstance, days, force);
  await sleep(5);
  counts.timetable = await seedTimetable(dbInstance, force);
  await sleep(5);

  const habitsResult = await seedHabitsAndLogs(dbInstance, days, force);
  counts.habits = habitsResult.habits;
  counts.habit_logs = habitsResult.logs;
  await sleep(5);

  counts.journal_entries = await seedJournalEntries(dbInstance, days, force);
  await sleep(5);
  counts.goals = await seedGoals(dbInstance, force);
  await sleep(5);
  counts.budget_categories = await seedBudgetCategories(dbInstance, force);
  await sleep(5);
  counts.daily_affirmations = await seedDailyAffirmations(dbInstance, days, force);
  await sleep(5);
  counts.dashboard_widgets = await seedDashboardWidgets(dbInstance, force);
  await sleep(5);

  const aiResult = await seedAiPrograms(dbInstance, force);
  counts.ai_programs = aiResult.programs;
  counts.ai_program_items = aiResult.items;

  return {
    days,
    force,
    counts,
    duration_ms: Date.now() - t0,
    skipped_existing,
  };
}

/**
 * Top-level convenience wrapper. Initializes the DB, runs the seed,
 * and returns a structured result. This is what UI triggers should call.
 *
 *   const result = await runSeed({ days: 14 });
 *   console.log(result.counts); // { daily_logs: 14, prayer_logs: 70, ... }
 */
export async function runSeed(opts: SeedOptions = {}): Promise<SeedResult> {
  return seedAllTables(opts);
}

/**
 * Return the current row count of every seedable table.
 * Used by the Settings UI to show what was just seeded.
 */
export async function verifySeedData(): Promise<Record<string, number>> {
  const dbInstance = await db.initDatabase();
  const tables = [
    'daily_logs',
    'prayer_logs',
    'gym_logs',
    'nutrition_logs',
    'transactions',
    'timetable',
    'habits',
    'habit_logs',
    'journal_entries',
    'goals',
    'budget_categories',
    'daily_affirmations',
    'dashboard_widgets',
    'ai_programs',
    'ai_program_items',
    'user_profile',
  ];

  const counts: Record<string, number> = {};
  for (const table of tables) {
    try {
      const rows = await dbInstance.getAllAsync<any>(
        `SELECT COUNT(*) as count FROM ${table}`
      );
      counts[table] = rows[0]?.count ?? 0;
    } catch {
      counts[table] = -1;
    }
  }
  return counts;
}

/**
 * Format a SeedResult for display in an Alert or log.
 */
export function formatSeedResult(result: SeedResult): string {
  const lines: string[] = [];
  lines.push(
    `Seeded ${result.days} days of data${result.force ? ' (force reset)' : ''} in ${result.duration_ms}ms`
  );
  for (const [table, count] of Object.entries(result.counts)) {
    lines.push(`  ${table}: ${count} row${count === 1 ? '' : 's'}`);
  }
  return lines.join('\n');
}
