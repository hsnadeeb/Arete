import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode, Dispatch, SetStateAction } from 'react';
import * as db from '../db/service';
import { DailyLog, PrayerLog, MonthlyStats, PRAYER_NAMES, PrayerTimings, IslamicDate, WidgetLayout } from '../types';
import { fetchPrayerTimings, extractTimings, getIslamicDateInfo } from '../services/prayerApi';

interface AppContextValue {
  loaded: boolean;
  dailyLog: DailyLog | null;
  prayers: PrayerLog[];
  monthlyStats: MonthlyStats | null;
  streak: number;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  refresh: () => Promise<void>;
  logWeight: (weight: number) => Promise<void>;
  logWater: (ml: number) => Promise<void>;
  logSteps: (steps: number) => Promise<void>;
  logMood: (mood: number) => Promise<void>;
  togglePrayer: (name: string) => Promise<void>;
  logSleep: (hours: number, quality: number) => Promise<void>;
  // Prayer timings & Islamic data
  prayerTimings: PrayerTimings | null;
  islamicDate: IslamicDate | null;
  timingsLoading: boolean;
  refreshPrayerTimings: () => Promise<void>;
  // Expense management
  addExpense: (category: string, amount: number, description?: string) => Promise<void>;
  todayTransactions: any[];
  // Dashboard widget layout
  widgetLayouts: WidgetLayout[];
  setWidgetLayouts: Dispatch<SetStateAction<WidgetLayout[]>>;
  saveWidgetLayouts: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null);
  const [prayers, setPrayers] = useState<PrayerLog[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
  const [streak, setStreak] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // New state
  const [prayerTimings, setPrayerTimings] = useState<PrayerTimings | null>(null);
  const [islamicDate, setIslamicDate] = useState<IslamicDate | null>(null);
  const [timingsLoading, setTimingsLoading] = useState(false);
  const [todayTransactions, setTodayTransactions] = useState<any[]>([]);
  // Widget layout state
  const [widgetLayouts, setWidgetLayouts] = useState<WidgetLayout[]>([]);

  const today = new Date().toISOString().split('T')[0];
  const month = today.slice(0, 7);

  // Load prayer timings from cache or API
  const loadPrayerTimings = useCallback(async () => {
    try {
      setTimingsLoading(true);
      // First check DB cache
      const cached = await db.getPrayerTimings(today);
      if (cached) {
        setPrayerTimings(cached);
        setIslamicDate({
          hijriDate: cached.hijri_date,
          hijriMonth: cached.hijri_month,
          hijriYear: cached.hijri_year,
          gregorianDate: cached.gregorian_date,
          dayOfWeek: '',
        });
        setTimingsLoading(false);
        return;
      }
      // Fetch from API
      const data = await fetchPrayerTimings(today);
      if (data) {
        const timings = extractTimings(data);
        const islamic = getIslamicDateInfo(data);
        // Save to DB
        await db.savePrayerTimings({
          date: today,
          ...timings,
        });
        // Sync prayer timings to timetable
        await db.syncPrayersToTimetable(timings, today);
        // Update state
        const saved = await db.getPrayerTimings(today);
        if (saved) setPrayerTimings(saved);
        setIslamicDate(islamic);
      }
    } catch (e) {
      console.warn('Failed to load prayer timings:', e);
    } finally {
      setTimingsLoading(false);
    }
  }, [today]);

  const loadData = useCallback(async () => {
    try {
      const database = await db.initDatabase();
      await db.seedAllData();
      // Always seed widget layouts separately — seedAllData returns early if daily_logs exist
      await db.seedWidgetLayouts();
      const [log, prayerRows, stats, streakVal, txns, widgetRows] = await Promise.all([
        db.getDailyLog(today),
        db.getPrayers(today),
        db.getMonthlyStats(month),
        db.getStreak(),
        db.getTransactions(today.slice(0, 7)),
        db.getWidgetLayouts(),
      ]);
      setDailyLog(log);
      setPrayers(prayerRows);
      setMonthlyStats(stats[0] || null);
      setStreak(streakVal);
      // Filter today's transactions
      setTodayTransactions((txns || []).filter((t: any) => t.date === today));
      // Load widget layouts
      if (widgetRows && widgetRows.length > 0) {
        setWidgetLayouts(widgetRows.map((w: any) => ({
          id: w.id,
          widget_key: w.widget_key,
          sort_order: w.sort_order,
          visible: !!w.visible,
        })));
      }
      setLoaded(true);
      // Load prayer timings after main data
      loadPrayerTimings();
    } catch (e) {
      console.error('Failed to load data:', e);
      setLoaded(true);
    }
  }, [today, month, loadPrayerTimings]);

  useEffect(() => { loadData(); }, [loadData]);

  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  const logWeight = useCallback(async (weight: number) => {
    await db.updateDailyLog(today, { weight });
    const log = await db.getDailyLog(today);
    setDailyLog(log);
  }, [today]);

  const logWater = useCallback(async (ml: number) => {
    await db.updateDailyLog(today, { water_ml: ml });
    const log = await db.getDailyLog(today);
    setDailyLog(log);
  }, [today]);

  const logSteps = useCallback(async (steps: number) => {
    await db.updateDailyLog(today, { steps });
    const log = await db.getDailyLog(today);
    setDailyLog(log);
  }, [today]);

  const logMood = useCallback(async (mood: number) => {
    await db.updateDailyLog(today, { mood });
    const log = await db.getDailyLog(today);
    setDailyLog(log);
  }, [today]);

  const togglePrayer = useCallback(async (name: string) => {
    const existing = prayers.find(p => p.prayer_name === name);
    const onTime = existing ? existing.on_time === 0 : true;
    await db.togglePrayer(today, name, onTime);
    const rows = await db.getPrayers(today);
    setPrayers(rows);
  }, [today, prayers]);

  const logSleep = useCallback(async (hours: number, quality: number) => {
    await db.updateDailyLog(today, { sleep_hours: hours, sleep_quality: quality });
    const log = await db.getDailyLog(today);
    setDailyLog(log);
  }, [today]);

  // New: Refresh prayer timings (re-fetch from API)
  const refreshPrayerTimings = useCallback(async () => {
    await loadPrayerTimings();
  }, [loadPrayerTimings]);

  // New: Save widget order to DB
  const saveWidgetLayouts = useCallback(async () => {
    try {
      await db.saveWidgetOrder(widgetLayouts.map((w, i) => ({
        widget_key: w.widget_key,
        sort_order: i,
      })));
    } catch (e) {
      console.warn('Failed to save widget layouts:', e);
    }
  }, [widgetLayouts]);

  // New: Add expense transaction
  const addExpense = useCallback(async (category: string, amount: number, description?: string) => {
    await db.addTransaction({
      date: today,
      category,
      amount,
      type: 'expense',
      description: description || '',
    });
    // Refresh transactions
    const txns = await db.getTransactions(today.slice(0, 7));
    setTodayTransactions((txns || []).filter((t: any) => t.date === today));
  }, [today]);

  return (
    <AppContext.Provider value={{
      loaded, dailyLog, prayers, monthlyStats, streak,
      sidebarOpen, setSidebarOpen,
      refresh, logWeight, logWater, logSteps, logMood, togglePrayer, logSleep,
      prayerTimings, islamicDate, timingsLoading, refreshPrayerTimings,
      addExpense, todayTransactions,
      widgetLayouts, setWidgetLayouts, saveWidgetLayouts,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
