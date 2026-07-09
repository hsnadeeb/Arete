import type { SQLiteDatabase } from 'expo-sqlite';
import type { TimetableRow } from '../db-types';
import { getDb } from '../service';

const TABLE = 'timetable';

export class TimetableRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async getAll(): Promise<TimetableRow[]> {
    return this.db.getAllAsync<TimetableRow>(
      `SELECT * FROM ${TABLE} ORDER BY day_of_week, start_time`
    );
  }

  async getByDay(day: number): Promise<TimetableRow[]> {
    return this.db.getAllAsync<TimetableRow>(
      `SELECT * FROM ${TABLE} WHERE day_of_week = ? ORDER BY start_time`,
      day
    );
  }

  async add(item: Omit<TimetableRow, 'id'>): Promise<void> {
    await this.db.runAsync(
      `INSERT INTO ${TABLE} (day_of_week, start_time, end_time, activity, color, repeat_type, specific_date) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      item.day_of_week,
      item.start_time,
      item.end_time ?? '',
      item.activity,
      item.color ?? '#0b6bcf',
      item.repeat_type ?? 'weekly',
      item.specific_date ?? ''
    );
  }

  async update(id: number, fields: Partial<TimetableRow>): Promise<void> {
    const sets: string[] = [];
    const vals: any[] = [];
    const settable: Record<string, any> = {
      day_of_week: fields.day_of_week,
      start_time: fields.start_time,
      end_time: fields.end_time,
      activity: fields.activity,
      color: fields.color,
      repeat_type: fields.repeat_type,
      specific_date: fields.specific_date,
    };
    for (const [col, val] of Object.entries(settable)) {
      if (val !== undefined) {
        sets.push(`${col} = ?`);
        vals.push(val);
      }
    }
    if (sets.length === 0) return;
    vals.push(id);
    await this.db.runAsync(
      `UPDATE ${TABLE} SET ${sets.join(', ')} WHERE id = ?`,
      ...vals
    );
  }

  async delete(id: number): Promise<void> {
    await this.db.runAsync(`DELETE FROM ${TABLE} WHERE id = ?`, id);
  }
}

let _instance: TimetableRepository | null = null;

export function createTimetableRepository(db: SQLiteDatabase): TimetableRepository {
  return new TimetableRepository(db);
}

export function getTimetableRepo(): TimetableRepository {
  if (!_instance) {
    _instance = new TimetableRepository(getDb());
  }
  return _instance;
}