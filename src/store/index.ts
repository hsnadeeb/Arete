// ─── Combined Zustand Store ───
// This is the single source of truth for the entire app.
// Each domain slice is a separate module, combined here.
// Screens use `useStore(store, selector)` for fine-grained re-renders.

import { create } from 'zustand';
import type { DailyLogRow } from '../db/db-types';
import type { PrayerLogRow } from '../db/db-types';
import type { TransactionRow } from '../db/db-types';
import type { TimetableRow } from '../db/db-types';
import type { DashboardWidgetRow } from '../db/db-types';
import type { MonthlyStatsRow } from '../db/db-types';
import type { PrayerTimingRow } from '../db/db-types';
import type { IslamicDate } from '../types';
import { getDailyLogRepo } from '../db/repositories/dailyLog';
import { getPrayerRepo } from '../db/repositories/prayer';
import { getTimetableRepo } from '../db/repositories/timetable';
import { getTransactionRepo } from '../db/repositories/transaction';
import { getWidgetRepo } from '../db/repositories/widget';
import { getStatsRepo } from '../db/repositories/stats';
import { initDatabase, deleteTransactionById, savePrayerTimings, getDb, seedWidgetLayouts } from '../db/service';
import { runSeed as runSeedData, wipeAllData, type SeedOptions, type SeedResult } from '../data/seedData';
import { fetchPrayerTimings, extractTimings, getIslamicDateInfo } from '../services/prayerApi';

// ─── App Store Interface ───
export interface AppStore {
  // Global
  loaded: boolean;
  hydrating: boolean;
  error: string | null;
  currentRoute: string;
  setCurrentRoute: (route: string) => void;

  // ── Daily Life ──
  dailyLog: DailyLogRow | null;
  setDailyLog: (log: DailyLogRow | null) => void;
  logWeight: (w: number) => Promise<void>;
  logWater: (ml: number) => Promise<void>;
  logSteps: (s: number) => Promise<void>;
  logMood: (m: number) => Promise<void>;
  logSleep: (h: number, q: number) => Promise<void>;

  // ── Prayer ──
  prayers: PrayerLogRow[];
  setPrayers: (p: PrayerLogRow[]) => void;
  togglePrayer: (name: string, onTime?: boolean) => Promise<void>;

  // ── Transactions ──
  transactions: TransactionRow[];
  todayTransactions: TransactionRow[];
  setTransactions: (t: TransactionRow[]) => void;
  setTodayTransactions: (t: TransactionRow[]) => void;
  addExpense: (cat: string, amt: number, desc?: string) => Promise<void>;
  addTransaction: (t: Omit<TransactionRow, 'id'>) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;

  // ── Timetable ──
  timetable: TimetableRow[];
  setTimetable: (t: TimetableRow[]) => void;
  addTimetableItem: (item: Omit<TimetableRow, 'id'>) => Promise<void>;
  updateTimetableItem: (id: number, fields: Partial<TimetableRow>) => Promise<void>;
  deleteTimetableItem: (id: number) => Promise<void>;

  // ── Widgets ──
  widgetLayouts: DashboardWidgetRow[];
  setWidgetLayouts: (w: DashboardWidgetRow[]) => void;
  saveWidgetLayouts: () => Promise<void>;

  // ── Stats ──
  monthlyStats: MonthlyStatsRow | null;
  streak: number;
  setMonthlyStats: (m: MonthlyStatsRow | null) => void;
  setStreak: (s: number) => void;

  // ── Prayer Timings ──
  prayerTimings: PrayerTimingRow | null;
  islamicDate: IslamicDate | null;
  timingsLoading: boolean;
  refreshPrayerTimings: () => Promise<void>;

  // ── Sidebar ──
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  // ── System ──
  hydrate: () => Promise<void>;
  refresh: () => Promise<void>;

  // ── Test Data Seeding (on-demand) ──
  seeding: boolean;
  deleting: boolean;
  seedResult: SeedResult | null;
  seedDatabase: (opts?: SeedOptions) => Promise<SeedResult>;
  wipeDatabase: () => Promise<void>;
}

// ─── Create Store ───
export const useStore = create<AppStore>()((set, get) => ({
  // ── Global ──
  loaded: false,
  hydrating: false,
  error: null,

  // ── Daily Life ──
  dailyLog: null,
  setDailyLog: (log) => set({ dailyLog: log }),
  logWeight: async (w) => {
    const repo = getDailyLogRepo();
    const today = new Date().toISOString().split('T')[0];
    const updated = await repo.upsert(today, { weight: w });
    set({ dailyLog: updated });
  },
  logWater: async (ml) => {
    const repo = getDailyLogRepo();
    const today = new Date().toISOString().split('T')[0];
    const updated = await repo.upsert(today, { water_ml: ml });
    set({ dailyLog: updated });
  },
  logSteps: async (s) => {
    const repo = getDailyLogRepo();
    const today = new Date().toISOString().split('T')[0];
    const updated = await repo.upsert(today, { steps: s });
    set({ dailyLog: updated });
  },
  logMood: async (m) => {
    const repo = getDailyLogRepo();
    const today = new Date().toISOString().split('T')[0];
    const updated = await repo.upsert(today, { mood: m });
    set({ dailyLog: updated });
  },
  logSleep: async (h, q) => {
    const repo = getDailyLogRepo();
    const today = new Date().toISOString().split('T')[0];
    const updated = await repo.upsert(today, { sleep_hours: h, sleep_quality: q });
    set({ dailyLog: updated });
  },

  // ── Prayer ──
  prayers: [],
  setPrayers: (p) => set({ prayers: p }),
  togglePrayer: async (name, onTime?) => {
    const repo = getPrayerRepo();
    const today = new Date().toISOString().split('T')[0];
    await repo.toggle(today, name);
    const prayers = await repo.getByDate(today);
    set({ prayers });
  },

  // ── Transactions ──
  transactions: [],
  todayTransactions: [],
  setTransactions: (t) => set({ transactions: t }),
  setTodayTransactions: (t) => set({ todayTransactions: t }),
  addExpense: async (cat, amt, desc) => {
    try {
      const repo = getTransactionRepo();
      await repo.add({
        date: new Date().toISOString().split('T')[0],
        category: cat,
        amount: amt,
        type: 'expense',
        description: desc || '',
      });
    } catch (e) {
      console.error('Add expense failed:', e);
    }
    const repo = getTransactionRepo();
    const txns = await repo.getByMonth(new Date().toISOString().split('T')[0].slice(0, 7));
    const today = new Date().toISOString().split('T')[0];
    const todayTxns = txns.filter(t => t.date === today);
    set({ transactions: txns, todayTransactions: todayTxns });
  },
  addTransaction: async (t) => {
    try {
      const repo = getTransactionRepo();
      await repo.add(t);
    } catch (e) {
      console.error('Add transaction failed:', e);
    }
    // Always refresh from DB to keep everything in sync
    const repo = getTransactionRepo();
    const txns = await repo.getByMonth(t.date.slice(0, 7));
    const todayStr = new Date().toISOString().split('T')[0];
    const todayTxns = txns.filter((tx: any) => tx.date === todayStr);
    set({ transactions: txns, todayTransactions: todayTxns });
  },
  deleteTransaction: async (id: number) => {
    try {
      await deleteTransactionById(id);
    } catch (e) {
      console.error('Delete transaction failed:', e);
    }
    const repo = getTransactionRepo();
    const txns = await repo.getByMonth(new Date().toISOString().split('T')[0].slice(0, 7));
    const todayStr = new Date().toISOString().split('T')[0];
    const todayTxns = txns.filter((tx: any) => tx.date === todayStr);
    set({ transactions: txns, todayTransactions: todayTxns });
  },

  // ── Timetable ──
  timetable: [],
  setTimetable: (t) => set({ timetable: t }),
  addTimetableItem: async (item) => {
    const repo = getTimetableRepo();
    await repo.add(item);
    const all = await repo.getAll();
    set({ timetable: all });
  },
  updateTimetableItem: async (id, fields) => {
    const repo = getTimetableRepo();
    await repo.update(id, fields);
    const all = await repo.getAll();
    set({ timetable: all });
  },
  deleteTimetableItem: async (id) => {
    const repo = getTimetableRepo();
    await repo.delete(id);
    const all = await repo.getAll();
    set({ timetable: all });
  },

  // ── Widgets ──
  widgetLayouts: [],
  setWidgetLayouts: (w) => set({ widgetLayouts: w }),
  saveWidgetLayouts: async () => {
    const repo = getWidgetRepo();
    const widgets = get().widgetLayouts;
    await repo.saveOrder(widgets.map((w, i) => ({
      widget_key: w.widget_key,
      sort_order: w.sort_order ?? i,
    })));
    const updated = await repo.getAll();
    set({ widgetLayouts: updated });
  },

  // ── Stats ──
  monthlyStats: null,
  streak: 0,
  setMonthlyStats: (m) => set({ monthlyStats: m }),
  setStreak: (s) => set({ streak: s }),

  // ── Prayer Timings ──
  prayerTimings: null,
  islamicDate: null,
  timingsLoading: false,
  refreshPrayerTimings: async () => {
    const today = new Date().toISOString().split('T')[0];
    set({ timingsLoading: true });
    try {
      const data = await fetchPrayerTimings();
      if (!data) {
        set({ timingsLoading: false });
        return;
      }
      const timings = extractTimings(data);
      const dateInfo = getIslamicDateInfo(data);
      // Save to local DB for persistence
      await savePrayerTimings({
        date: today,
        city: 'Mumbai',
        country: 'India',
        ...timings,
        ...dateInfo,
        fajr: timings.fajr,
        sunrise: timings.sunrise,
        dhuhr: timings.dhuhr,
        asr: timings.asr,
        maghrib: timings.maghrib,
        isha: timings.isha,
        hijri_date: dateInfo.hijriDate,
        hijri_month: dateInfo.hijriMonth,
        hijri_year: dateInfo.hijriYear,
        gregorian_date: dateInfo.gregorianDate,
      });
      set({
        prayerTimings: {
          id: 0,
          date: today,
          city: 'Mumbai',
          country: 'India',
          fajr: timings.fajr,
          sunrise: timings.sunrise,
          dhuhr: timings.dhuhr,
          asr: timings.asr,
          maghrib: timings.maghrib,
          isha: timings.isha,
          hijri_date: timings.hijri_date,
          hijri_month: timings.hijri_month,
          hijri_year: timings.hijri_year,
          gregorian_date: timings.gregorian_date,
        },
        islamicDate: dateInfo,
        timingsLoading: false,
      });
    } catch (e) {
      console.error('Failed to refresh prayer timings:', e);
      set({ timingsLoading: false });
    }
  },

  // ── Sidebar ──
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  currentRoute: "Greeting",
  setCurrentRoute: (route) => set({ currentRoute: route }),

  // ── System ──
  seeding: false,
  deleting: false,
  seedResult: null,
  seedDatabase: async (opts?: SeedOptions) => {
    set({ seeding: true, error: null });
    try {
      const result = await runSeedData(opts ?? { days: 14 });
      set({ seedResult: result, seeding: false });
      // Re-hydrate the store so all screens reflect the new data
      await get().hydrate();
      return result;
    } catch (e) {
      console.error('Seed failed:', e);
      set({ error: (e as Error).message, seeding: false });
      throw e;
    }
  },
  wipeDatabase: async () => {
    set({ deleting: true, error: null });
    try {
      await wipeAllData();
      set({ deleting: false });
      // Re-hydrate so screens reflect the empty state.
      await get().hydrate();
    } catch (e) {
      console.error('Wipe failed:', e);
      set({ error: (e as Error).message, deleting: false });
      throw e;
    }
  },

  hydrate: async () => {
    set({ hydrating: true, error: null });
    try {
      await initDatabase();
      const today = new Date().toISOString().split('T')[0];
      const month = today.slice(0, 7);

      // Seed default widget layouts (one-time, idempotent)
      await seedWidgetLayouts();

      // Fetch all initial data in parallel
      const [dailyLog, prayers, txns, timetable, widgets, stats, todayTimings] = await Promise.allSettled([
        getDailyLogRepo().getByDate(today),
        getPrayerRepo().getByDate(today),
        getTransactionRepo().getByMonth(month),
        getTimetableRepo().getAll(),
        getWidgetRepo().getAll(),
        getStatsRepo().getMonthly(month),
        // Check if today's prayer timings exist in DB
        getDb().getFirstAsync<any>('SELECT * FROM prayer_timings WHERE date = ?', today),
      ]);

      // Filter today's transactions
      const todayTxns = (txns.status === 'fulfilled' ? txns.value : [])
        .filter((t: any) => t.date === today);

      set({
        dailyLog: dailyLog.status === 'fulfilled' ? dailyLog.value : null,
        prayers: prayers.status === 'fulfilled' ? prayers.value : [],
        transactions: txns.status === 'fulfilled' ? txns.value : [],
        todayTransactions: todayTxns,
        timetable: timetable.status === 'fulfilled' ? timetable.value : [],
        widgetLayouts: widgets.status === 'fulfilled' ? widgets.value : [],
        monthlyStats: stats.status === 'fulfilled' ? stats.value[0] || null : null,
        // If timings exist in DB, use them; otherwise show empty
        prayerTimings: todayTimings.status === 'fulfilled' ? todayTimings.value : null,
        timingsLoading: false,
        loaded: true,
        hydrating: false,
      });
    } catch (e) {
      console.error('Hydration failed:', e);
      set({ error: (e as Error).message, loaded: true, hydrating: false });
    }
  },

  refresh: async () => {
    await get().hydrate();
  },
}));
