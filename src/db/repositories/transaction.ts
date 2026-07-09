import type { SQLiteDatabase } from 'expo-sqlite';
import type { TransactionRow } from '../db-types';
import { getDb } from '../service';

const TABLE = 'transactions';

export class TransactionRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async getByMonth(monthPrefix: string): Promise<TransactionRow[]> {
    return this.db.getAllAsync<TransactionRow>(
      `SELECT *, created_at FROM ${TABLE} WHERE date LIKE ? ORDER BY date DESC`,
      `${monthPrefix}%`
    );
  }

  async add(t: Omit<TransactionRow, 'id'>): Promise<void> {
    await this.db.runAsync(
      `INSERT INTO ${TABLE} (date, category, amount, type, description) VALUES (?, ?, ?, ?, ?)`,
      t.date,
      t.category,
      t.amount,
      t.type,
      t.description ?? ''
    );
  }

  async getByDate(date: string): Promise<TransactionRow[]> {
    return this.db.getAllAsync<TransactionRow>(
      `SELECT * FROM ${TABLE} WHERE date = ? ORDER BY category`,
      date
    );
  }
}

let _instance: TransactionRepository | null = null;

export function createTransactionRepository(db: SQLiteDatabase): TransactionRepository {
  return new TransactionRepository(db);
}

export function getTransactionRepo(): TransactionRepository {
  if (!_instance) {
    _instance = new TransactionRepository(getDb());
  }
  return _instance;
}