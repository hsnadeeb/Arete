// ─── Transaction Slice ───
// Manages: budget/expense entries, monthly filtering, today's transactions

import type { TransactionRow } from '../../db/db-types';
import { getTransactionRepo } from '../../db/repositories/transaction';

export interface TransactionSlice {
  // State
  transactions: TransactionRow[];
  todayTransactions: TransactionRow[];
  monthlyTotal: number;
  loading: boolean;

  // Actions
  fetchMonth: (prefix: string) => Promise<void>;
  fetchToday: () => Promise<void>;
  add: (t: Omit<TransactionRow, 'id'>) => Promise<void>;
  refresh: () => Promise<void>;
}

export const createTransactionSlice = (
  set: (partial: Partial<TransactionSlice> | ((state: TransactionSlice) => Partial<TransactionSlice>)) => void,
  get: () => TransactionSlice
): TransactionSlice => ({
  transactions: [],
  todayTransactions: [],
  monthlyTotal: 0,
  loading: false,

  fetchMonth: async (prefix: string) => {
    set({ loading: true });
    try {
      const repo = getTransactionRepo();
      const transactions = await repo.getByMonth(prefix);
      const total = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      set({ transactions, monthlyTotal: total, loading: false });
    } catch (e) {
      set({ loading: false });
    }
  },

  fetchToday: async () => {
    const today = new Date().toISOString().split('T')[0];
    const repo = getTransactionRepo();
    const monthPrefix = today.slice(0, 7);
    const allTxns = await repo.getByMonth(monthPrefix);
    const todayTransactions = allTxns.filter(t => t.date === today);
    set({ todayTransactions });
  },

  add: async (t: Omit<TransactionRow, 'id'>) => {
    const repo = getTransactionRepo();
    await repo.add(t);
    await get().fetchMonth(t.date.slice(0, 7));
  },

  refresh: async () => {
    const today = new Date().toISOString().split('T')[0];
    const repo = getTransactionRepo();
    const transactions = await repo.getByMonth(today.slice(0, 7));
    const todayTransactions = transactions.filter(t => t.date === today);
    const monthlyTotal = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    set({ transactions, todayTransactions, monthlyTotal });
  },
});
