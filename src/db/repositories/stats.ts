import type { SQLiteDatabase } from 'expo-sqlite';
import type { MonthlyStatsRow } from '../db-types';
import { getDb } from '../service';

const TABLE = 'daily_logs';

export class StatsRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async getMonthly(yearMonth: string): Promise<MonthlyStatsRow[]> {
    return this.db.getAllAsync<MonthlyStatsRow>(
      `SELECT
         AVG(weight) as avg_weight,
         AVG(water_ml) as avg_water,
         AVG(steps) as avg_steps,
         AVG(mood) as avg_mood,
         AVG(sleep_hours) as avg_sleep,
         COUNT(*) as days_tracked
       FROM ${TABLE} WHERE date LIKE ?`,
      `${yearMonth}%`
    );
  }

  async getStreak(): Promise<number> {
    const rows = await this.db.getAllAsync<{ date: string }>(
      `SELECT DISTINCT date FROM ${TABLE}
       WHERE weight IS NOT NULL OR water_ml > 0 OR steps > 0
       ORDER BY date DESC`
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

let _instance: StatsRepository | null = null;

export function createStatsRepository(db: SQLiteDatabase): StatsRepository {
  return new StatsRepository(db);
}

export function getStatsRepo(): StatsRepository {
  if (!_instance) {
    _instance = new StatsRepository(getDb());
  }
  return _instance;
}