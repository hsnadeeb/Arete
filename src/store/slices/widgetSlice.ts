// ─── Widget Slice ───
// Manages: dashboard widget layout, sort order, visibility

import type { DashboardWidgetRow } from '../../db/db-types';
import { getWidgetRepo } from '../../db/repositories/widget';

export interface WidgetSlice {
  // State
  widgets: DashboardWidgetRow[];
  loading: boolean;

  // Actions
  fetchAll: () => Promise<void>;
  saveOrder: (items: { widget_key: string; sort_order: number }[]) => Promise<void>;
}

export const createWidgetSlice = (
  set: (partial: Partial<WidgetSlice> | ((s: WidgetSlice) => Partial<WidgetSlice>)) => void,
  get: () => WidgetSlice
): WidgetSlice => ({
  widgets: [],
  loading: false,

  fetchAll: async () => {
    set({ loading: true });
    try {
      const repo = getWidgetRepo();
      const widgets = await repo.getAll();
      set({ widgets, loading: false });
    } catch (e) {
      set({ loading: false });
    }
  },

  saveOrder: async (items: { widget_key: string; sort_order: number }[]) => {
    const repo = getWidgetRepo();
    await repo.saveOrder(items);
    // Re-fetch to sync
    const widgets = await repo.getAll();
    set({ widgets });
  },
});
