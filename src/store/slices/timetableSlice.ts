// ─── Timetable Slice ───
// Manages: planner items — add, update, delete, fetch

import type { TimetableRow } from '../../db/db-types';
import { getTimetableRepo } from '../../db/repositories/timetable';

export interface TimetableSlice {
  // State
  timetable: TimetableRow[];
  loading: boolean;

  // Actions
  fetchAll: () => Promise<void>;
  add: (item: Omit<TimetableRow, 'id'>) => Promise<void>;
  update: (id: number, fields: Partial<TimetableRow>) => Promise<void>;
  delete: (id: number) => Promise<void>;
}

export const createTimetableSlice = (
  set: (partial: Partial<TimetableSlice> | ((s: TimetableSlice) => Partial<TimetableSlice>)) => void,
  get: () => TimetableSlice
): TimetableSlice => ({
  timetable: [],
  loading: false,

  fetchAll: async () => {
    set({ loading: true });
    try {
      const repo = getTimetableRepo();
      const timetable = await repo.getAll();
      set({ timetable, loading: false });
    } catch (e) {
      set({ loading: false });
    }
  },

  add: async (item: Omit<TimetableRow, 'id'>) => {
    const repo = getTimetableRepo();
    await repo.add(item);
    await get().fetchAll();
  },

  update: async (id: number, fields: Partial<TimetableRow>) => {
    const repo = getTimetableRepo();
    await repo.update(id, fields);
    await get().fetchAll();
  },

  delete: async (id: number) => {
    const repo = getTimetableRepo();
    await repo.delete(id);
    await get().fetchAll();
  },
});
