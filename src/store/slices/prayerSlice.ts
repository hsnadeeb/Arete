// ─── Prayer Slice ───
// Manages: prayer logs, toggle on-time/qada, streak

import type { PrayerLogRow } from '../../db/db-types';
import { getPrayerRepo } from '../../db/repositories/prayer';

export interface PrayerSlice {
  // State
  prayers: PrayerLogRow[];
  streak: number;
  loading: boolean;

  // Actions
  fetchToday: () => Promise<void>;
  toggle: (name: string, onTime: boolean) => Promise<void>;
  refreshStreak: () => Promise<void>;
}

export const createPrayerSlice = (
  set: (partial: Partial<PrayerSlice> | ((state: PrayerSlice) => Partial<PrayerSlice>)) => void,
  get: () => PrayerSlice
): PrayerSlice => ({
  prayers: [],
  streak: 0,
  loading: false,

  fetchToday: async () => {
    set({ loading: true });
    try {
      const repo = getPrayerRepo();
      const today = new Date().toISOString().split('T')[0];
      const prayers = await repo.getByDate(today);
      set({ prayers, loading: false });
    } catch (e) {
      set({ loading: false });
    }
  },

  toggle: async (name: string) => {
    const repo = getPrayerRepo();
    const today = new Date().toISOString().split('T')[0];
    await repo.toggle(today, name);
    // Re-fetch to sync state
    const prayers = await repo.getByDate(today);
    set({ prayers });
  },

  refreshStreak: async () => {
    const repo = getPrayerRepo();
    const streak = await repo.getStreak();
    set({ streak });
  },
});
