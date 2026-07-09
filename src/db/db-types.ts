/** Canonical row types matching the SQL schema exactly. */

export interface DailyLogRow {
  id: number;
  date: string;
  weight: number | null;
  water_ml: number | null;
  steps: number | null;
  mood: number | null;
  sleep_hours: number | null;
  sleep_quality: number | null;
  calories: number | null;
  protein_g: number | null;
  notes: string | null;
}

export interface PrayerLogRow {
  id: number;
  date: string;
  prayer_name: string;
  on_time: number;
  qada: number;
}

export interface TransactionRow {
  id: number;
  date: string;
  category: string;
  amount: number;
  type: 'expense' | 'income';
  description: string | null;
  created_at?: string;
}

export interface TimetableRow {
  id: number;
  day_of_week: number;
  start_time: string;
  end_time: string | null;
  activity: string;
  color: string;
  repeat_type: string;
  specific_date: string;
}

export interface DashboardWidgetRow {
  id: number;
  widget_key: string;
  sort_order: number;
  visible: number;
}

export interface PrayerTimingRow {
  id: number;
  date: string;
  city: string;
  country: string;
  fajr: string;
  sunrise: string | null;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  hijri_date: string | null;
  hijri_month: string | null;
  hijri_year: string | null;
  gregorian_date: string | null;
}

export interface MonthlyStatsRow {
  avg_weight: number | null;
  avg_water: number | null;
  avg_steps: number | null;
  avg_mood: number | null;
  avg_sleep: number | null;
  days_tracked: number;
}