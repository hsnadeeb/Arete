import { LUCIDE_ICONS, type LucideIconName } from "./constants/typography";

export interface DailyLog {
  id: number;
  date: string;
  weight: number | null;
  water_ml: number;
  steps: number;
  mood: number | null;
  sleep_hours: number | null;
  sleep_quality: number | null;
  calories: number | null;
  protein_g: number | null;
  notes: string | null;
}

export interface PrayerLog {
  id: number;
  date: string;
  prayer_name: string;
  on_time: number;
  qada: number;
}

export interface GymLog {
  id: number;
  date: string;
  workout_name: string;
  exercises: string;
  duration_minutes: number;
  notes: string;
}

export interface NutritionLog {
  id: number;
  date: string;
  meal_type: string;
  foods: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  notes: string;
}

export interface Transaction {
  id: number;
  date: string;
  category: string;
  amount: number;
  type: string;
  description: string;
}

export interface TimetableItem {
  id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  activity: string;
  color: string;
}

export interface Habit {
  id: number;
  name: string;
  emoji: string;
  target_per_day: number;
  unit: string;
}

export interface HabitLog {
  id: number;
  habit_id: number;
  date: string;
  count: number;
}

export interface JournalEntry {
  id: number;
  date: string;
  title: string;
  content: string;
  type: string;
}

export interface Goal {
  id: number;
  title: string;
  target_date: string | null;
  target_value: number | null;
  current_value: number;
  unit: string;
  area: string;
  color: string;
  archived: number;
}

export interface BudgetSummary {
  category: string;
  type: string;
  total: number;
}

export interface MonthlyStats {
  avg_weight: number | null;
  avg_water: number | null;
  avg_steps: number | null;
  avg_mood: number | null;
  avg_sleep: number | null;
  days_tracked: number;
}

export interface PrayerTimings {
  id: number;
  date: string;
  city: string;
  country: string;
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  hijri_date: string;
  hijri_month: string;
  hijri_year: string;
  gregorian_date: string;
  fetched_at: string;
}

export interface IslamicDate {
  hijriDate: string;
  hijriMonth: string;
  hijriYear: string;
  gregorianDate: string;
  dayOfWeek: string;
}


export const PRAYER_NAMES = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
export const PRAYER_TIMES_ORDER = [
  "fajr",
  "sunrise",
  "dhuhr",
  "asr",
  "maghrib",
  "isha",
] as const;
export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"];
export const BUDGET_CATEGORIES = [
  "Rent",
  "Food",
  "Transport",
  "Entertainment",
  "Learning",
  "Savings",
  "Healthcare",
  "Shopping",
  "Bills",
  "Other",
];

export function today(): string {
  return new Date().toISOString().split("T")[0];
}

export function formatDate(date: string): string {
  const d = new Date(date + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// export const PRAYER_ICONS: Record<string, { name: string; color: string }> = {
//   fajr: { name: 'sunrise', color: '#f59e0b' },
//   sunrise: { name: 'sun', color: '#f59e0b' },
//   dhuhr: { name: 'sun', color: '#f59e0b' },
//   asr: { name: 'cloud', color: '#8b5cf6' },
//   maghrib: { name: 'sunset', color: '#e03e3e' },
//   isha: { name: 'moon', color: '#6366f1' },
// };

export const PRAYER_ICONS: Record<
  string,
  {
    name: LucideIconName;
    color: string;
  }
> = {
  fajr: { name: LUCIDE_ICONS.sunrise, color: "#f59e0b" },
  sunrise: { name: LUCIDE_ICONS.sun, color: "#f59e0b" },
  dhuhr: { name: LUCIDE_ICONS.sun, color: "#f59e0b" },
  asr: { name: LUCIDE_ICONS.cloud, color: "#8b5cf6" },
  maghrib: { name: LUCIDE_ICONS.sunset, color: "#e03e3e" },
  isha: { name: LUCIDE_ICONS.moon, color: "#6366f1" },
};

export const PRAYER_DISPLAY: Record<string, string> = {
  fajr: "Fajr",
  sunrise: "Sunrise",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
};

// ─── Dashboard Widget Layout ───

export interface WidgetLayout {
  id?: number;
  widget_key: string;
  sort_order: number;
  visible: boolean;
}

export interface WidgetDefinition {
  key: string;
  title: string;
  icon: LucideIconName;
  accentColor: string;
}

export const WIDGET_DEFINITIONS: WidgetDefinition[] = [
  {
    key: "at-a-glance",
    title: "At a Glance",
    icon: LUCIDE_ICONS.compass,
    accentColor: "#8b5cf6",
  },
  {
    key: "quick-stats",
    title: "Quick Stats",
    icon: LUCIDE_ICONS.barChart2,
    accentColor: "#0b6bcf",
  },
  { key: "quick-log", title: "Quick Log", icon: LUCIDE_ICONS.zap, accentColor: "#0ea5e9" },
  { key: "mood", title: "Mood", icon: LUCIDE_ICONS.smile, accentColor: "#6366f1" },
  {
    key: "expenses",
    title: "Expenses",
    icon: LUCIDE_ICONS.dollarSign,
    accentColor: "#059669",
  },
  {
    key: "monthly-stats",
    title: "Monthly Stats",
    icon: LUCIDE_ICONS.trendingUp,
    accentColor: "#d97706",
  },
];

export function getNextPrayer(timings: {
  [key: string]: string;
}): { name: string; time: string; remaining: string } | null {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (const prayer of PRAYER_TIMES_ORDER) {
    if (prayer === "sunrise") continue; // Skip sunrise for next prayer
    const [h, m] = (timings[prayer] || "").split(":").map(Number);
    if (isNaN(h) || isNaN(m)) continue;
    const prayerMinutes = h * 60 + m;
    if (prayerMinutes > currentMinutes) {
      const diff = prayerMinutes - currentMinutes;
      const hours = Math.floor(diff / 60);
      const mins = diff % 60;
      const remaining = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
      return {
        name: PRAYER_DISPLAY[prayer] || prayer,
        time: timings[prayer],
        remaining,
      };
    }
  }
  return null; // All prayers passed for today
}
