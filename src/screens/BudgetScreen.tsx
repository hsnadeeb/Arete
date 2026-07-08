import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { Card, Row } from '../components/Card';
import { BUDGET_CATEGORIES } from '../types';

export default function BudgetScreen() {
  const { setSidebarOpen, addTransaction, transactions } = useApp();
  const [txCat, setTxCat] = useState(BUDGET_CATEGORIES[0]);
  const [txAmount, setTxAmount] = useState('');
  const [txDesc, setTxDesc] = useState('');
  const [showCatPicker, setShowCatPicker] = useState(false);

  const income = (transactions || []).filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = (transactions || []).filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const addTx = async () => {
    const amt = parseFloat(txAmount);
    if (!amt) return;
    await addTransaction({
      date: new Date().toISOString().split('T')[0],
      category: txCat,
      amount: Math.abs(amt),
      type: amt >= 0 ? 'income' : 'expense',
      description: txDesc,
    });
    setTxAmount(''); setTxDesc('');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => setSidebarOpen(true)} style={styles.menuBtn}>
              <Feather name="menu" size={18} color="#9b9a97" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Budget</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card>
          <View style={styles.summary}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Income</Text>
              <Text style={[styles.summaryValue, { color: '#0a8c2e' }]}>+${income.toFixed(0)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Expenses</Text>
              <Text style={[styles.summaryValue, { color: '#e03e3e' }]}>-${expense.toFixed(0)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Net</Text>
              <Text style={[styles.summaryValue, { color: income - expense >= 0 ? '#0a8c2e' : '#e03e3e' }]}>
                ${(income - expense).toFixed(0)}
              </Text>
            </View>
          </View>
        </Card>

        <Card title="Add Transaction">
          <View style={styles.catRow}>
            <TouchableOpacity style={styles.catPicker} onPress={() => setShowCatPicker(!showCatPicker)}>
              <Text style={styles.catPickerText}>{txCat} ▼</Text>
            </TouchableOpacity>
          </View>
          {showCatPicker && (
            <View style={styles.catGrid}>
              {BUDGET_CATEGORIES.map(c => (
                <TouchableOpacity key={c} style={[styles.catChip, txCat === c && styles.catChipActive]} onPress={() => { setTxCat(c); setShowCatPicker(false); }}>
                  <Text style={[styles.catChipText, txCat === c && styles.catChipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <View style={styles.txRow}>
            <TextInput style={[styles.input, { flex: 1 }]} value={txAmount} onChangeText={setTxAmount} keyboardType="numeric" placeholder="Amount" placeholderTextColor="#ccc" />
            <TextInput style={[styles.input, { flex: 2 }]} value={txDesc} onChangeText={setTxDesc} placeholder="Description" placeholderTextColor="#ccc" />
          </View>
          <View style={styles.txHint}>
            <Text style={styles.txHintText}>Positive = income · Negative = expense</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={addTx}><Text style={styles.addBtnText}>Add Transaction</Text></TouchableOpacity>
        </Card>

        {transactions && transactions.length > 0 && (
          <Card title="Recent">
            {transactions.slice(0, 10).map((tx: any, i) => (
              <Row key={tx.id || i} label={tx.category}>
                <Text style={[styles.txAmount, { color: tx.type === 'income' ? '#0a8c2e' : '#e03e3e' }]}>
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
  safe: { flex: 1, backgroundColor: '#fafafa' },
  topbar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 48,
    backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#efefef',
  },
  menuBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  menuIcon: { fontSize: 18, color: '#9b9a97' },
  topTitle: { fontSize: 16, fontWeight: '600', color: '#37352f', marginLeft: 4 },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 48 },
  input: {
    borderWidth: 1, borderColor: '#efefef', borderRadius: 8, paddingHorizontal: 12,
    paddingVertical: 10, fontSize: 14, color: '#37352f', backgroundColor: '#fafafa', marginBottom: 8,
  },
  addBtn: { backgroundColor: '#0b6bcf', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 4 },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  summary: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 11, color: '#9b9a97', fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.3 },
  summaryValue: { fontSize: 20, fontWeight: '700', marginTop: 4 },
  divider: { width: 1, backgroundColor: '#efefef' },
  expenseAmount: { fontSize: 14, fontWeight: '600', color: '#e03e3e' },
  catRow: { marginBottom: 8 },
  catPicker: { paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#f7f6f3', borderRadius: 8, borderWidth: 1, borderColor: '#efefef' },
  catPickerText: { fontSize: 14, color: '#37352f', fontWeight: '500' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  catChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, backgroundColor: '#f7f6f3', borderWidth: 1, borderColor: '#efefef' },
  catChipActive: { backgroundColor: '#e0f2fe', borderColor: '#0b6bcf' },
  catChipText: { fontSize: 12, color: '#9b9a97' },
  catChipTextActive: { color: '#0b6bcf', fontWeight: '600' },
  txRow: { flexDirection: 'row', gap: 8 },
  txHint: { marginBottom: 4 },
  txHintText: { fontSize: 11, color: '#b3b3af' },
  txAmount: { fontSize: 14, fontWeight: '600' },
});