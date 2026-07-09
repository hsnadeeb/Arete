import type { SQLiteDatabase } from 'expo-sqlite';
import type { DashboardWidgetRow } from '../db-types';
import { getDb } from '../service';

const TABLE = 'dashboard_widgets';

export class WidgetRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async getAll(): Promise<DashboardWidgetRow[]> {
    return this.db.getAllAsync<DashboardWidgetRow>(
      `SELECT * FROM ${TABLE} ORDER BY sort_order`
    );
  }

  async saveOrder(
    items: { widget_key: string; sort_order: number }[]
  ): Promise<void> {
    for (const item of items) {
      await this.db.runAsync(
        `UPDATE ${TABLE} SET sort_order = ?, visible = 1 WHERE widget_key = ?`,
        item.sort_order,
        item.widget_key
      );
    }
  }

  async toggleVisibility(
    widgetKey: string,
    visible: boolean
  ): Promise<void> {
    await this.db.runAsync(
      `UPDATE ${TABLE} SET visible = ? WHERE widget_key = ?`,
      visible ? 1 : 0,
      widgetKey
    );
  }

  async updateSortOrder(
    widgetKey: string,
    sortOrder: number
  ): Promise<void> {
    await this.db.runAsync(
      `UPDATE ${TABLE} SET sort_order = ? WHERE widget_key = ?`,
      sortOrder,
      widgetKey
    );
  }
}

let _instance: WidgetRepository | null = null;

export function createWidgetRepository(
  db: SQLiteDatabase
): WidgetRepository {
  return new WidgetRepository(db);
}

export function getWidgetRepo(): WidgetRepository {
  if (!_instance) {
    _instance = new WidgetRepository(getDb());
  }
  return _instance;
}