import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Icon } from '../components/Icons';
import { LUCIDE_ICONS, TYPOGRAPHY } from '../constants/typography';
import { Card, Row } from '../components/Card';
import { today, BUDGET_CATEGORIES } from '../types';
import * as db from '../db/service';

export default function BudgetScreen() {
  const { setSidebarOpen } = useApp();
  const { theme, isDark } = useTheme();
  const tc = theme.colors;
  const [transactions, setTransactions] = useState<any[]>([]);
  const [summary, setSummary] = useState<any[]>([]);
  const [txCat, setTxCat] = useState(BUDGET_CATEGORIES[0]);
  const [txAmount, setTxAmount] = useState('');
  const [txDesc, setTxDesc] = useState('');
  const [showCatPicker, setShowCatPicker] = useState(false);

  const currentMonth = today().slice(0, 7);

  useEffect(() => { loadBudget(); }, []);

  const loadBudget = async () => {
    const [txs, summ] = await Promise.all([
      db.getTransactions(currentMonth),
      db.getBudgetSummary(currentMonth),
    ]);
    setTransactions(txs);
    setSummary(summ);
  };

  const addTx = async () => {
    const amt = parseFloat(txAmount);
    if (!amt) return;
    await db.addTransaction({
      date: today(), category: txCat, amount: Math.abs(amt),
      type: amt >= 0 ? 'income' : 'expense', description: txDesc,
    });
    setTxAmount(''); setTxDesc('');
    loadBudget();
  };

  const getTotal = (type: string) => {
    return summary.filter(s => s.type === type).reduce((sum, s) => sum + s.total, 0);
  };

  const income = getTotal('income');
  const expense = getTotal('expense');

  // Theme-mapped color tokens (preserve original hex in light mode)
  const T = {
    bg: isDark ? tc.bg : '#fafafa',
    surface: isDark ? tc.surface : '#ffffff',
    surfaceAlt: isDark ? tc.bgSecondary : '#fafafa',
    border: isDark ? tc.border : '#efefef',
    borderSoft: isDark ? tc.borderLight : '#f7f6f3',
    textPrimary: isDark ? tc.heading : '#37352f',
    textSecondary: isDark ? tc.textTertiary : '#9b9a97',
    textMuted: isDark ? tc.textTertiary : '#b3b3af',
    accent: isDark ? tc.accent : '#0b6bcf',
    accentSoft: isDark ? tc.infoBg : '#e0f2fe',
    success: isDark ? tc.success : '#0a8c2e',
    error: isDark ? tc.error : '#e03e3e',
    placeholder: isDark ? tc.placeholder : '#ccc',
    textInverse: '#fff',
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: T.bg }]} edges={['top']}>
      <View style={[styles.topbar, { backgroundColor: T.surface, borderBottomColor: T.border }]}>
        <TouchableOpacity onPress={() => setSidebarOpen(true)} style={styles.menuBtn}>
          <Icon name={LUCIDE_ICONS.menu} size={18} color={T.textSecondary} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: T.textPrimary }]}>Budget</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card>
          <View style={styles.summary}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: T.textSecondary }]}>Income</Text>
              <Text style={[styles.summaryValue, { color: T.success }]}>+${income.toFixed(0)}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: T.border }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: T.textSecondary }]}>Expenses</Text>
              <Text style={[styles.summaryValue, { color: T.error }]}>-${expense.toFixed(0)}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: T.border }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: T.textSecondary }]}>Net</Text>
              <Text style={[styles.summaryValue, { color: income - expense >= 0 ? T.success : T.error }]}>
                ${(income - expense).toFixed(0)}
              </Text>
            </View>
          </View>
        </Card>

        {summary.filter(s => s.type === 'expense').length > 0 && (
          <Card title="Spending by Category">
            {summary.filter(s => s.type === 'expense').map((s, i) => (
              <Row key={i} label={s.category}>
                <Text style={[styles.expenseAmount, { color: T.error }]}>-${s.total.toFixed(0)}</Text>
              </Row>
            ))}
          </Card>
        )}

        <Card title="Add Transaction">
          <View style={styles.catRow}>
            <TouchableOpacity style={[styles.catPicker, { backgroundColor: T.borderSoft, borderColor: T.border }]} onPress={() => setShowCatPicker(!showCatPicker)}>
              <Text style={[styles.catPickerText, { color: T.textPrimary }]}>{txCat} ▼</Text>
            </TouchableOpacity>
          </View>
          {showCatPicker && (
            <View style={styles.catGrid}>
              {BUDGET_CATEGORIES.map(c => (
                <TouchableOpacity key={c} style={[styles.catChip, { backgroundColor: T.borderSoft, borderColor: T.border }, txCat === c && { backgroundColor: T.accentSoft, borderColor: T.accent }]} onPress={() => { setTxCat(c); setShowCatPicker(false); }}>
                  <Text style={[styles.catChipText, { color: T.textSecondary }, txCat === c && { color: T.accent, fontWeight: '600' }]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <View style={styles.txRow}>
            <TextInput style={[styles.input, { flex: 1, borderColor: T.border, color: T.textPrimary, backgroundColor: T.surfaceAlt }]} value={txAmount} onChangeText={setTxAmount} keyboardType="numeric" placeholder="Amount" placeholderTextColor={T.placeholder} />
            <TextInput style={[styles.input, { flex: 2, borderColor: T.border, color: T.textPrimary, backgroundColor: T.surfaceAlt }]} value={txDesc} onChangeText={setTxDesc} placeholder="Description" placeholderTextColor={T.placeholder} />
          </View>
          <View style={styles.txHint}>
            <Text style={[styles.txHintText, { color: T.textMuted }]}>Positive = income · Negative = expense</Text>
          </View>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: T.accent }]} onPress={addTx}><Text style={[styles.addBtnText, { color: T.textInverse }]}>Add Transaction</Text></TouchableOpacity>
        </Card>

        {transactions.length > 0 && (
          <Card title="Recent">
            {transactions.slice(0, 10).map((tx: any, i) => (
              <Row key={tx.id || i} label={tx.category}>
                <Text style={[styles.txAmount, { color: tx.type === 'income' ? T.success : T.error }]}>
                  {tx.type === 'income' ? '+' : '-'}${Math.abs(tx.amount).toFixed(0)}
                </Text>
              </Row>
            ))}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topbar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 48,
    borderBottomWidth: 1,
  },
  menuBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  topTitle: { ...TYPOGRAPHY.h4, marginLeft: 4 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 8, paddingBottom: 48 },
  input: {
    borderWidth: 1, borderRadius: 8, paddingHorizontal: 12,
    paddingVertical: 10, ...TYPOGRAPHY.input, marginBottom: 8,
  },
  addBtn: { paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 4 },
  addBtnText: { ...TYPOGRAPHY.btn },
  summary: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { ...TYPOGRAPHY.statLabel },
  summaryValue: { ...TYPOGRAPHY.monoLg, marginTop: 4 },
  divider: { width: 1 },
  expenseAmount: { ...TYPOGRAPHY.body, fontWeight: '600' },
  catRow: { marginBottom: 8 },
  catPicker: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1 },
  catPickerText: { ...TYPOGRAPHY.input, fontWeight: '500' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  catChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1 },
  catChipActive: {},
  catChipText: { ...TYPOGRAPHY.caption },
  catChipTextActive: {},
  txRow: { flexDirection: 'row', gap: 8 },
  txHint: { marginBottom: 4 },
  txHintText: { ...TYPOGRAPHY.captionSm },
  txAmount: { ...TYPOGRAPHY.body, fontWeight: '600' },
});