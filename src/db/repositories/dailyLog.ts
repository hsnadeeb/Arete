import type { SQLiteDatabase } from 'expo-sqlite';
import type { DailyLogRow } from '../db-types';
import { getDb } from '../service';

const TABLE = 'daily_logs';

export class DailyLogRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async getByDate(date: string): Promise<DailyLogRow> {
    const row = await this.db.getFirstAsync<DailyLogRow>(
      `SELECT * FROM ${TABLE} WHERE date = ?`,
      date
    );
    if (row) return row;
    await this.db.runAsync(
      `INSERT INTO ${TABLE} (date) VALUES (?)`,
      date
    );
    const created = await this.db.getFirstAsync<DailyLogRow>(
      `SELECT * FROM ${TABLE} WHERE date = ?`,
      date
    );
    if (!created) throw new Error(`Failed to create daily log for ${date}`);
    return created;
  }

  async upsert(
    date: string,
    fields: Partial<DailyLogRow>
  ): Promise<DailyLogRow> {
    const existing = await this.db.getFirstAsync<DailyLogRow>(
      `SELECT id FROM ${TABLE} WHERE date = ?`,
      date
    );
    if (existing) {
      const keys = Object.keys(fields) as (keyof DailyLogRow)[];
      const sets = keys.map((k) => `${k} = ?`).join(', ');
      const vals = keys.map((k) => fields[k]).filter((v): v is NonNullable<typeof v> => v !== undefined);
      await this.db.runAsync(
        `UPDATE ${TABLE} SET ${sets} WHERE date = ?`,
        ...vals,
        date
      );
    } else {
      const keys = Object.keys(fields);
      const cols = ['date', ...keys].join(', ');
      const placeholders = keys.map(() => '?');
      const vals = [date, ...keys.map((k) => (fields as any)[k])].filter((v) => v !== undefined);
      await this.db.runAsync(
        `INSERT INTO ${TABLE} (${cols}) VALUES (${['?', ...placeholders].join(', ')})`,
        ...vals
      );
    }
    const updated = await this.db.getFirstAsync<DailyLogRow>(
      `SELECT * FROM ${TABLE} WHERE date = ?`,
      date
    );
    if (!updated) throw new Error(`Failed to fetch daily log after upsert for ${date}`);
    return updated;
  }

  async getMonthly(date: string): Promise<DailyLogRow[]> {
    const monthPrefix = date.slice(0, 7);
    return this.db.getAllAsync<DailyLogRow>(
      `SELECT * FROM ${TABLE} WHERE date LIKE ? ORDER BY date DESC`,
      `${monthPrefix}%`
    );
  }

  async getAll(): Promise<DailyLogRow[]> {
    return this.db.getAllAsync<DailyLogRow>(
      `SELECT * FROM ${TABLE} ORDER BY date DESC`
    );
  }
}

let _instance: DailyLogRepository | null = null;

export function createDailyLogRepository(db: SQLiteDatabase): DailyLogRepository {
  return new DailyLogRepository(db);
}

export function getDailyLogRepo(): DailyLogRepository {
  if (!_instance) {
    _instance = new DailyLogRepository(getDb());
  }
  return _instance;
}