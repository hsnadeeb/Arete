import type { SQLiteDatabase } from 'expo-sqlite';
import type { PrayerLogRow } from '../db-types';
import { getDb } from '../service';

const TABLE = 'prayer_logs';

export class PrayerRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async getByDate(date: string): Promise<PrayerLogRow[]> {
    return this.db.getAllAsync<PrayerLogRow>(
      `SELECT * FROM ${TABLE} WHERE date = ? ORDER BY prayer_name`,
      date
    );
  }

  async toggle(date: string, name: string): Promise<void> {
    const existing = await this.db.getFirstAsync<PrayerLogRow>(
      `SELECT * FROM ${TABLE} WHERE date = ? AND prayer_name = ?`,
      date,
      name
    );
    if (existing) {
      if (existing.on_time === 1) {
        await this.db.runAsync(`DELETE FROM ${TABLE} WHERE id = ?`, existing.id);
      } else {
        await this.db.runAsync(
          `UPDATE ${TABLE} SET on_time = 1, qada = 0 WHERE id = ?`,
          existing.id
        );
      }
    } else {
      await this.db.runAsync(
        `INSERT INTO ${TABLE} (date, prayer_name, on_time, qada) VALUES (?, ?, 1, 0)`,
        date,
        name
      );
    }
  }

  async getStreak(): Promise<number> {
    const rows = await this.db.getAllAsync<{ date: string }>(
      `SELECT DISTINCT date FROM ${TABLE} ORDER BY date DESC`
    );
    if (rows.length === 0) return 0;
    let streak = 0;
    const todayStr = new Date().toISOString().split('T')[0];
    for (let i = 0; i < rows.length; i++) {
      const expected = new Date();
      expected.setDate(expected.getDate() - i);
      const expectedStr = expected.toISOString().split('T')[0];
      if (rows[i].date === expectedStr) streak++;
      else break;
    }
    return streak;
  }
}

let _instance: PrayerRepository | null = null;

export function createPrayerRepository(db: SQLiteDatabase): PrayerRepository {
  return new PrayerRepository(db);
}

export function getPrayerRepo(): PrayerRepository {
  if (!_instance) {
    _instance = new PrayerRepository(getDb());
  }
  return _instance;
}