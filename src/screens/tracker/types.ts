import type { LucideIconName } from "../../constants/typography";

export type Tab =
  | "overview"
  | "weight"
  | "water"
  | "steps"
  | "sleep"
  | "mood"
  | "habits";

export interface TabDef {
  key: Tab;
  label: string;
  icon: LucideIconName;
  color: string;
}

export const TABS: TabDef[] = [
  { key: "overview", label: "Today", icon: "BarChart", color: "#6366f1" },
  { key: "weight", label: "Weight", icon: "Weight", color: "#0b6bcf" },
  { key: "water", label: "Water", icon: "Droplet", color: "#0ea5e9" },
  { key: "steps", label: "Steps", icon: "Footprints", color: "#f59e0b" },
  { key: "sleep", label: "Sleep", icon: "Moon", color: "#8b5cf6" },
  { key: "mood", label: "Mood", icon: "Smile", color: "#f97316" },
  { key: "habits", label: "Habits", icon: "CheckCircle", color: "#0891b2" },
];

export const HABIT_COLORS = [
  "#6366f1", "#f97316", "#22c55e", "#ef4444", "#ec4899",
  "#14b8a6", "#eab308", "#a855f7", "#06b6d4", "#78716c",
];

export interface WeekDay {
  label: string;
  date: string;
}

export interface WeekData {
  weights: { label: string; value: number }[];
  waters: { label: string; value: number }[];
  steps: { label: string; value: number }[];
  moods: { label: string; value: number }[];
  sleep: { label: string; value: number }[];
}

export interface HabitGridWeek {
  date: string;
  day: number;
  month: string;
}

export interface HabitGridData {
  weeks: HabitGridWeek[][];
  monthLabels: { label: string; col: number }[];
}

export interface ThemeColors {
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  borderSoft: string;
  borderMuted: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textMuted: string;
  accent: string;
  accentBg: string;
  successBorder: string;
  pillBg: string;
  placeholder: string;
  sleepBg: string;
  waterBg: string;
  moodBg: string;
  moodBorder: string;
}
