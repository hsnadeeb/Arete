import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import { useHasan } from '../data/context';
import { Section, MetricCard, HBAR, ProgressBar, StatusBadge, TwoCol } from '../components/Scores';

export default function FinanceDashboardScreen() {
  const { data: d } = useHasan();
  const fin = d.finance;
  const pct = Math.round(fin.totalSpent / fin.totalBudget * 100);

  return (
    <ScreenWrapper
      title="Finance Dashboard"
      icon="💰"
      subtitle={`Score: ${d.financeScore}/100 · Net Worth: $${fin.netWorth.total.toLocaleString()} (${fin.netWorth.change})`}
    >
      {/* Metrics Row */}
      <View style={styles.metricsRow}>
        <MetricCard label="Savings" value={`$${fin.netWorth.savings}`} trend="▲ +$200" trendColor="#0a8c2e" />
        <MetricCard label="Invested" value={`$${fin.netWorth.invested}`} trend="▲ +$50" trendColor="#0a8c2e" />
        <MetricCard label="Savings Rate" value={`${fin.savingsRate}%`} trend={`Target: ${fin.savingsTarget}%`} />
        <MetricCard label="Net Worth" value={`$${fin.netWorth.total.toLocaleString()}`} trend={fin.netWorth.change} trendColor="#0a8c2e" />
      </View>

      <TwoCol>
        {/* Left */}
        <View style={{ flex: 1 }}>
          {/* Budget */}
          <Section title={`📊 Budget (${pct}% used)`}>
            <ProgressBar
              progress={Math.min(pct, 100)}
              color={pct > 100 ? '#e03e3e' : pct > 80 ? '#d9730d' : '#0a8c2e'}
              height={10}
              style={{ marginBottom: 12 }}
            />
            <View style={styles.table}>
              <View style={styles.tableRow}>
                <Text style={[styles.tableHeader, { flex: 2 }]}>Category</Text>
                <Text style={styles.tableHeader}>Budget</Text>
                <Text style={styles.tableHeader}>Spent</Text>
                <Text style={styles.tableHeader}>Remaining</Text>
                <Text style={styles.tableHeader}>Status</Text>
              </View>
              {fin.budget.map((b, i) => {
                const bp = Math.round(b.spent / b.budget * 100);
                return (
                  <View key={i} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { flex: 2, fontWeight: '500' }]}>{b.category}</Text>
                    <Text style={styles.tableCell}>${b.budget}</Text>
                    <Text style={styles.tableCell}>${b.spent}</Text>
                    <Text style={[styles.tableCell, { color: b.remaining < 0 ? '#e03e3e' : '#0a8c2e' }]}>
                      {b.remaining < 0 ? `-$${Math.abs(b.remaining)}` : `$${b.remaining}`}
                    </Text>
                    <StatusBadge
                      text={b.status}
                      color={b.status === 'Good' ? 'green' : b.status === 'On Track' ? 'blue' : b.status === 'Warning' ? 'yellow' : 'red'}
                    />
                  </View>
                );
              })}
              {/* Total row */}
              <View style={[styles.tableRow, { borderTopWidth: 2, borderTopColor: '#e9e9e7' }]}>
                <Text style={[styles.tableCell, { flex: 2, fontWeight: '700' }]}>Total</Text>
                <Text style={[styles.tableCell, { fontWeight: '700' }]}>${fin.totalBudget}</Text>
                <Text style={[styles.tableCell, { fontWeight: '700' }]}>${fin.totalSpent}</Text>
                <Text style={[styles.tableCell, { fontWeight: '700', color: fin.totalRemaining < 0 ? '#e03e3e' : '#0a8c2e' }]}>
                  ${fin.totalRemaining}
                </Text>
                <StatusBadge
                  text={pct > 100 ? 'Over' : pct > 80 ? 'Warn' : 'On Track'}
                  color={pct > 100 ? 'red' : pct > 80 ? 'yellow' : 'green'}
                />
              </View>
            </View>
          </Section>
        </View>

        {/* Right */}
        <View style={{ flex: 1 }}>
          {/* Net Worth Breakdown */}
          <Section title="💰 Net Worth">
            <HBAR label="Savings" value={Math.round(fin.netWorth.savings / fin.netWorth.total * 100)} color="#0a8c2e" />
            <HBAR label="Invested" value={Math.round(fin.netWorth.invested / fin.netWorth.total * 100)} color="#0b6bcf" />
          </Section>

          {/* Savings Rate */}
          <Section title={`📈 Savings Rate (${fin.savingsRate}% / ${fin.savingsTarget}% target)`}>
            <ProgressBar
              progress={fin.savingsRate / fin.savingsTarget * 100}
              color="#0a8c2e"
              height={8}
            />
          </Section>
        </View>
      </TwoCol>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 8,
  },
  table: { marginVertical: 4 },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0ee',
    alignItems: 'center',
  },
  tableHeader: {
    flex: 1,
    fontSize: 10,
    fontWeight: '500',
    color: '#9b9a97',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableCell: { flex: 1, fontSize: 11, color: '#37352f' },
});
