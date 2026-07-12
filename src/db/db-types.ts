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
  steps_target: number | null;
  water_target: number | null;
  sleep_target: number | null;
  weight_target: number | null;
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

export interface AiProviderRow {
  id: number;
  provider: string;
  model: string;
  api_key: string;
  is_active: number;
  created_at?: string;
}

export interface AiProgramRow {
  id: number;
  type: string;
  title: string;
  week_start: string;
  week_end: string;
  context_snapshot: string | null;
  raw_response: string | null;
  is_active: number;
  created_at?: string;
}

export interface AiProgramItemRow {
  id: number;
  program_id: number;
  day_index: number;
  day_label: string;
  title: string;
  description: string | null;
  is_completed: number;
  sort_order: number;
  created_at?: string;
}

export interface UserProfileRow {
  id: number;
  name: string;
  gender: string;
  date_of_birth: string;
  height_cm: number;
  weight_kg: number;
  target_weight_kg: number;
  activity_level: string;
  goals: string;
  preferences: string;
  created_at?: string;
  updated_at?: string;
}