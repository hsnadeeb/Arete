// ─── Daily Log Slice ───
// Manages: weight, water, steps, mood, sleep, calories, protein, notes

import type { DailyLogRow } from '../../db/db-types';
import { getDailyLogRepo } from '../../db/repositories/dailyLog';

export interface DailySlice {
  // State
  log: DailyLogRow | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchToday: () => Promise<void>;
  logWeight: (weight: number) => Promise<void>;
  logWater: (ml: number) => Promise<void>;
  logSteps: (steps: number) => Promise<void>;
  logMood: (mood: number) => Promise<void>;
  logSleep: (hours: number, quality: number) => Promise<void>;
}

export const createDailySlice = (
  set: (partial: Partial<DailySlice> | ((state: DailySlice) => Partial<DailySlice>)) => void,
  get: () => DailySlice
): DailySlice => ({
  log: null,
  loading: false,
  error: null,

  fetchToday: async () => {
    set({ loading: true, error: null });
    try {
      const repo = getDailyLogRepo();
      const today = new Date().toISOString().split('T')[0];
      const log = await repo.getByDate(today);
      set({ log, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  logWeight: async (weight: number) => {
    const repo = getDailyLogRepo();
    const today = new Date().toISOString().split('T')[0];
    const updated = await repo.upsert(today, { weight });
    set({ log: updated });
  },

  logWater: async (ml: number) => {
    const repo = getDailyLogRepo();
    const today = new Date().toISOString().split('T')[0];
    const updated = await repo.upsert(today, { water_ml: ml });
    set({ log: updated });
  },

  logSteps: async (steps: number) => {
    const repo = getDailyLogRepo();
    const today = new Date().toISOString().split('T')[0];
    const updated = await repo.upsert(today, { steps });
    set({ log: updated });
  },

  logMood: async (mood: number) => {
    const repo = getDailyLogRepo();
    const today = new Date().toISOString().split('T')[0];
    const updated = await repo.upsert(today, { mood });
    set({ log: updated });
  },

  logSleep: async (hours: number, quality: number) => {
    const repo = getDailyLogRepo();
    const today = new Date().toISOString().split('T')[0];
    const updated = await repo.upsert(today, { sleep_hours: hours, sleep_quality: quality });
    set({ log: updated });
  },
});
