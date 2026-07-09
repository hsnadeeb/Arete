// ─── Stats Slice ───
// Manages: monthly aggregates, dashboard stats, streak

import type { MonthlyStatsRow } from '../../db/db-types';
import { getStatsRepo } from '../../db/repositories/stats';
import { getDailyLogRepo } from '../../db/repositories/dailyLog';

export interface StatsSlice {
  // State
  monthly: MonthlyStatsRow | null;
  daysTracked: number;
  loading: boolean;

  // Actions
  fetchMonth: (yearMonth: string) => Promise<void>;
  fetchStreak: () => Promise<void>;
}

export const createStatsSlice = (
  set: (partial: Partial<StatsSlice> | ((s: StatsSlice) => Partial<StatsSlice>)) => void,
  get: () => StatsSlice
): StatsSlice => ({
  monthly: null,
  daysTracked: 0,
  loading: false,

  fetchMonth: async (yearMonth: string) => {
    set({ loading: true });
    try {
      const repo = getStatsRepo();
      const rows = await repo.getMonthly(yearMonth);
      set({ monthly: rows[0] || null, loading: false });
    } catch (e) {
      set({ loading: false });
    }
  },

  fetchStreak: async () => {
    const repo = getStatsRepo();
    const daysTracked = await repo.getStreak();
    set({ daysTracked });
  },
});
