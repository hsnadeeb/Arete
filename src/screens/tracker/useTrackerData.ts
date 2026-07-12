import { useState, useEffect, useMemo, useCallback } from "react";
import { useStore } from "../../store";
import * as db from "../../db/service";

function getPastDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}
import type { WeekData, HabitGridData } from "./types";

export function today(): string {
  return new Date().toISOString().split("T")[0];
}

export function useTrackerData() {
  const dailyLog = useStore((s) => s.dailyLog);
  const [loaded, setLoaded] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [habits, setHabits] = useState<any[]>([]);
  const [habitLogs, setHabitLogs] = useState<any[]>([]);

  const loadAll = useCallback(async () => {
    try {
      const since = getPastDate(90);
      const [l, , h, hl] = await Promise.all([
        db.getDailyLogsSince(since).catch(() => []),
        db.getAllNutritionLogs().catch(() => []),
        db.getHabits().catch(() => []),
        db.getHabitLogs().catch(() => []),
      ]);
      setLogs(l);
      setHabits(h);
      setHabitLogs(hl);
    } catch {
      setLogs([]);
      setHabits([]);
      setHabitLogs([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  // Load on mount and whenever the global dailyLog changes (keeps charts in sync)
  useEffect(() => {
    loadAll();
  }, [loadAll, dailyLog]);

  const weekData = useMemo<WeekData>(() => {
    if (!loaded || !logs.length)
      return { weights: [], waters: [], steps: [], moods: [], sleep: [] };
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        label: weekDays[d.getDay()],
        date: d.toISOString().split("T")[0],
      };
    });
    return {
      weights: days.map((d) => ({
        label: d.label,
        value: logs.find((l) => l.date === d.date)?.weight ?? 0,
      })),
      waters: days.map((d) => ({
        label: d.label,
        value: logs.find((l) => l.date === d.date)?.water_ml ?? 0,
      })),
      steps: days.map((d) => ({
        label: d.label,
        value: logs.find((l) => l.date === d.date)?.steps ?? 0,
      })),
      moods: days.map((d) => ({
        label: d.label,
        value: logs.find((l) => l.date === d.date)?.mood ?? 0,
      })),
      sleep: days.map((d) => ({
        label: d.label,
        value: logs.find((l) => l.date === d.date)?.sleep_hours ?? 0,
      })),
    };
  }, [loaded, logs]);

  const habitGrid = useMemo<HabitGridData>(() => {
    const days: { date: string; day: number; month: string }[] = [];
    const now = new Date();
    for (let i = 89; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      days.push({
        date: d.toISOString().split("T")[0],
        day: d.getDay(),
        month: d.toLocaleDateString("en", { month: "short" }),
      });
    }
    const weeks: typeof days[] = [];
    let currentWeek: typeof days = [];
    for (const d of days) {
      currentWeek.push(d);
      if (d.day === 6 || d === days[days.length - 1]) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    const monthLabels: { label: string; col: number }[] = [];
    let lastMonth = "";
    weeks.forEach((w, i) => {
      const m = w[0]?.month;
      if (m && m !== lastMonth) {
        monthLabels.push({ label: m, col: i });
        lastMonth = m;
      }
    });
    return { weeks, monthLabels };
  }, []);

  const refreshHabits = async () => {
    const h = await db.getHabits();
    setHabits(h);
  };

  const refreshHabitLogs = async () => {
    const hl = await db.getHabitLogs();
    setHabitLogs(hl);
  };

  return {
    loaded,
    logs,
    habits,
    habitLogs,
    weekData,
    habitGrid,
    refreshHabits,
    refreshHabitLogs,
  };
}
