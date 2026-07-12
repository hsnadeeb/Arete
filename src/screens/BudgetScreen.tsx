import React, { useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated as RNAnimated,
  PanResponder,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";
import { Icon } from "../components/Icons";
import { LUCIDE_ICONS, TYPOGRAPHY } from "../constants/typography";
import { Card, Row } from "../components/Card";
import { BarChart } from "../components/Charts";
import { today, BUDGET_CATEGORIES } from "../types";

function formatCompact(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 10000000) return `${sign}${(abs / 10000000).toFixed(2)}Cr`;
  if (abs >= 100000) return `${sign}${(abs / 100000).toFixed(2)}L`;
  if (abs >= 1000) return `${sign}${(abs / 1000).toFixed(1)}k`;
  return `${sign}${abs.toFixed(0)}`;
}

function SwipeableRow({
  onDelete,
  T,
  children,
}: {
  onDelete: () => void;
  T: any;
  children: React.ReactNode;
}) {
  const translateX = useRef(new RNAnimated.Value(0)).current;
  const SWIPE_THRESHOLD = -80;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 8 && Math.abs(gs.dx) > Math.abs(gs.dy) * 1.5,
      onPanResponderMove: (_, gs) => {
        if (gs.dx < 0) translateX.setValue(gs.dx);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dx < SWIPE_THRESHOLD) {
          RNAnimated.timing(translateX, {
            toValue: -300,
            duration: 180,
            useNativeDriver: true,
          }).start(() => onDelete());
        } else {
          RNAnimated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 120,
            friction: 10,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        RNAnimated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    }),
  ).current;

  return (
    <View style={styles.swipeContainer}>
      <View style={[styles.deleteBg, { backgroundColor: T.error }]}>
        <Icon name={LUCIDE_ICONS.trash2} size={18} color="#fff" />
        <Text style={styles.deleteText}>Delete</Text>
      </View>
      <RNAnimated.View
        {...panResponder.panHandlers}
        style={{ transform: [{ translateX }] }}
      >
        {children}
      </RNAnimated.View>
    </View>
  );
}

export default function BudgetScreen() {
  const { setSidebarOpen, transactions, addTransaction, deleteTransaction } =
    useApp();
  const { theme, isDark } = useTheme();
  const tc = theme.colors;
  const [txCat, setTxCat] = useState(BUDGET_CATEGORIES[0]);
  const [txType, setTxType] = useState<"income" | "expense">("expense");
  const [txAmount, setTxAmount] = useState("");
  const [txDesc, setTxDesc] = useState("");
  const [showCatPicker, setShowCatPicker] = useState(false);

  const currentMonth = today().slice(0, 7);

  // Summary is derived from the global store transactions so it stays in sync with Dashboard
  const summary = useMemo(() => {
    const map = new Map<string, any>();
    transactions.forEach((t: any) => {
      if (t.date?.slice(0, 7) !== currentMonth) return;
      const key = `${t.category}|${t.type}`;
      if (!map.has(key))
        map.set(key, { category: t.category, type: t.type, total: 0 });
      map.get(key).total += Math.abs(t.amount);
    });
    return Array.from(map.values());
  }, [transactions, currentMonth]);

  const addTx = async () => {
    const amt = parseFloat(txAmount);
    if (!amt) return;
    await addTransaction({
      date: today(),
      category: txCat,
      amount: Math.abs(amt),
      type: txType,
      description: txDesc,
    });
    setTxAmount("");
    setTxDesc("");
  };

  const getTotal = (type: string) => {
    return summary
      .filter((s) => s.type === type)
      .reduce((sum, s) => sum + s.total, 0);
  };

  const income = getTotal("income");
  const expense = getTotal("expense");

  const analytics = useMemo(() => {
    const todayDate = new Date();
    const last7Days: {
      label: string;
      date: string;
      income: number;
      expense: number;
    }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(todayDate);
      d.setDate(todayDate.getDate() - i);
      const iso = d.toISOString().split("T")[0];
      last7Days.push({
        label: d.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 1),
        date: iso,
        income: 0,
        expense: 0,
      });
    }
    transactions.forEach((tx: any) => {
      const day = last7Days.find((d) => d.date === tx.date);
      if (day) {
        if (tx.type === "income") day.income += Math.abs(tx.amount);
        else day.expense += Math.abs(tx.amount);
      }
    });

    const expenseByCategory = summary
      .filter((s: any) => s.type === "expense")
      .sort((a: any, b: any) => b.total - a.total);
    const totalExpense =
      expenseByCategory.reduce((sum: number, s: any) => sum + s.total, 0) || 1;

    const daysPassed = todayDate.getDate();
    const avgDaily = daysPassed > 0 ? expense / daysPassed : 0;
    const savingsRate =
      income > 0 ? Math.max(0, ((income - expense) / income) * 100) : 0;
    const topCategory = expenseByCategory[0];
    const topCategoryPct = topCategory
      ? (topCategory.total / totalExpense) * 100
      : 0;
    const daysWithSpending = last7Days.filter((d) => d.expense > 0).length;

    return {
      last7Days,
      expenseByCategory,
      totalExpense,
      avgDaily,
      savingsRate,
      topCategory,
      topCategoryPct,
      daysWithSpending,
    };
  }, [transactions, summary, income, expense]);

  // Theme-mapped color tokens (preserve original hex in light mode)
  const T = {
    bg: isDark ? tc.bg : "#fafafa",
    surface: isDark ? tc.surface : "#ffffff",
    surfaceAlt: isDark ? tc.bgSecondary : "#fafafa",
    border: isDark ? tc.border : "#efefef",
    borderSoft: isDark ? tc.borderLight : "#f7f6f3",
    textPrimary: isDark ? tc.heading : "#37352f",
    textSecondary: isDark ? tc.textTertiary : "#9b9a97",
    textMuted: isDark ? tc.textTertiary : "#b3b3af",
    accent: isDark ? tc.accent : "#0b6bcf",
    accentSoft: isDark ? tc.infoBg : "#e0f2fe",
    success: isDark ? tc.success : "#0a8c2e",
    error: isDark ? tc.error : "#e03e3e",
    placeholder: isDark ? tc.placeholder : "#ccc",
    textInverse: "#fff",
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: T.bg }]}
      edges={["top"]}
    >
      <View
        style={[
          styles.topbar,
          { backgroundColor: T.surface, borderBottomColor: T.border },
        ]}
      >
        <TouchableOpacity
          onPress={() => setSidebarOpen(true)}
          style={styles.menuBtn}
        >
          <Icon name={LUCIDE_ICONS.menu} size={18} color={T.textSecondary} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: T.textPrimary }]}>Budget</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Card>
          <View style={styles.summary}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: T.textSecondary }]}>
                Income
              </Text>
              <Text
                style={[styles.summaryValue, { color: T.success }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
              >
                +₹ {formatCompact(income)}
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: T.border }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: T.textSecondary }]}>
                Expenses
              </Text>
              <Text
                style={[styles.summaryValue, { color: T.error }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
              >
                -₹ {formatCompact(expense)}
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: T.border }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: T.textSecondary }]}>
                Net
              </Text>
              <Text
                style={[
                  styles.summaryValue,
                  { color: income - expense >= 0 ? T.success : T.error },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
              >
                ₹ {formatCompact(income - expense)}
              </Text>
            </View>
          </View>
        </Card>

        <Card title="Add Transaction">
          <View style={styles.catRow}>
            <TouchableOpacity
              style={[
                styles.catPicker,
                { backgroundColor: T.borderSoft, borderColor: T.border },
              ]}
              onPress={() => setShowCatPicker(!showCatPicker)}
            >
              <Text style={[styles.catPickerText, { color: T.textPrimary }]}>
                {txCat} ▼
              </Text>
            </TouchableOpacity>
          </View>
          {showCatPicker && (
            <View style={styles.catGrid}>
              {BUDGET_CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.catChip,
                    { backgroundColor: T.borderSoft, borderColor: T.border },
                    txCat === c && {
                      backgroundColor: T.accentSoft,
                      borderColor: T.accent,
                    },
                  ]}
                  onPress={() => {
                    setTxCat(c);
                    setShowCatPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.catChipText,
                      { color: T.textSecondary },
                      txCat === c && { color: T.accent, fontWeight: "600" },
                    ]}
                  >
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <View style={styles.txRow}>
            <TextInput
              style={[
                styles.input,
                {
                  flex: 1,
                  borderColor: T.border,
                  color: T.textPrimary,
                  backgroundColor: T.surfaceAlt,
                },
              ]}
              value={txAmount}
              onChangeText={setTxAmount}
              keyboardType="numeric"
              placeholder="Amount"
              placeholderTextColor={T.placeholder}
            />
            <TextInput
              style={[
                styles.input,
                {
                  flex: 2,
                  borderColor: T.border,
                  color: T.textPrimary,
                  backgroundColor: T.surfaceAlt,
                },
              ]}
              value={txDesc}
              onChangeText={setTxDesc}
              placeholder="Description"
              placeholderTextColor={T.placeholder}
            />
          </View>

          <View style={[styles.typeToggle, { backgroundColor: T.borderSoft }]}>
            <TouchableOpacity
              style={[
                styles.typeBtn,
                txType === "income" && { backgroundColor: T.success + "22" },
              ]}
              onPress={() => setTxType("income")}
              activeOpacity={0.7}
            >
              <Icon
                name={LUCIDE_ICONS.arrowDown}
                size={14}
                color={txType === "income" ? T.success : T.textSecondary}
              />
              <Text
                style={[
                  styles.typeBtnText,
                  { color: txType === "income" ? T.success : T.textSecondary },
                  txType === "income" && { fontWeight: "600" },
                ]}
              >
                Income
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeBtn,
                txType === "expense" && { backgroundColor: T.error + "22" },
              ]}
              onPress={() => setTxType("expense")}
              activeOpacity={0.7}
            >
              <Icon
                name={LUCIDE_ICONS.arrowUp}
                size={14}
                color={txType === "expense" ? T.error : T.textSecondary}
              />
              <Text
                style={[
                  styles.typeBtnText,
                  { color: txType === "expense" ? T.error : T.textSecondary },
                  txType === "expense" && { fontWeight: "600" },
                ]}
              >
                Expense
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: T.accent }]}
            onPress={addTx}
          >
            <Text style={[styles.addBtnText, { color: T.textInverse }]}>
              Add Transaction
            </Text>
          </TouchableOpacity>
        </Card>

        {transactions.length > 0 && (
          <>
            <Card title="Analytics">
              <View style={styles.metricsGrid}>
                <View style={styles.metricItem}>
                  <Text style={[styles.metricValue, { color: T.accent }]}>
                    ₹ {analytics.avgDaily.toFixed(0)}
                  </Text>
                  <Text
                    style={[styles.metricLabel, { color: T.textSecondary }]}
                  >
                    Avg daily spend
                  </Text>
                </View>
                <View
                  style={[styles.metricDivider, { backgroundColor: T.border }]}
                />
                <View style={styles.metricItem}>
                  <Text
                    style={[
                      styles.metricValue,
                      {
                        color:
                          analytics.savingsRate >= 20
                            ? T.success
                            : analytics.savingsRate > 0
                              ? T.textPrimary
                              : T.error,
                      },
                    ]}
                  >
                    {analytics.savingsRate.toFixed(0)}%
                  </Text>
                  <Text
                    style={[styles.metricLabel, { color: T.textSecondary }]}
                  >
                    Savings rate
                  </Text>
                </View>
                <View
                  style={[styles.metricDivider, { backgroundColor: T.border }]}
                />
                <View style={styles.metricItem}>
                  <Text style={[styles.metricValue, { color: T.error }]}>
                    {analytics.daysWithSpending}/7
                  </Text>
                  <Text
                    style={[styles.metricLabel, { color: T.textSecondary }]}
                  >
                    Active days
                  </Text>
                </View>
              </View>
              {analytics.topCategory && (
                <View
                  style={[
                    styles.topCatBanner,
                    { backgroundColor: T.borderSoft },
                  ]}
                >
                  <Icon
                    name={LUCIDE_ICONS.target}
                    size={14}
                    color={T.textSecondary}
                  />
                  <Text style={[styles.topCatText, { color: T.textSecondary }]}>
                    Top category:{" "}
                  </Text>
                  <Text style={[styles.topCatName, { color: T.textPrimary }]}>
                    {analytics.topCategory.category}
                  </Text>
                  <Text style={[styles.topCatPct, { color: T.error }]}>
                    {analytics.topCategoryPct.toFixed(0)}%
                  </Text>
                </View>
              )}
            </Card>

            <Card title="Last 7 Days">
              <BarChart
                data={analytics.last7Days.map((d) => ({
                  label: d.label,
                  value: d.expense,
                  color: T.error,
                }))}
                height={120}
                showValues={true}
                accentColor={T.error}
                emptyText="No expenses in the last 7 days"
              />
              <View
                style={[styles.incomeRow, { borderTopColor: T.borderSoft }]}
              >
                <Text style={[styles.incomeLabel, { color: T.textSecondary }]}>
                  7-day income
                </Text>
                <Text style={[styles.incomeValue, { color: T.success }]}>
                  +₹{" "}
                  {analytics.last7Days
                    .reduce((s, d) => s + d.income, 0)
                    .toFixed(0)}
                </Text>
              </View>
            </Card>

            {analytics.expenseByCategory.length > 0 && (
              <Card title="Category Breakdown">
                {analytics.expenseByCategory.map((c: any, i: number) => {
                  const pct = (c.total / analytics.totalExpense) * 100;
                  return (
                    <View key={i} style={styles.catBreakRow}>
                      <View style={styles.catBreakTop}>
                        <Text
                          style={[
                            styles.catBreakName,
                            { color: T.textPrimary },
                          ]}
                        >
                          {c.category}
                        </Text>
                        <Text
                          style={[
                            styles.catBreakAmount,
                            { color: T.textPrimary },
                          ]}
                        >
                          -₹ {c.total.toFixed(0)}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.catBreakBarBg,
                          { backgroundColor: T.borderSoft },
                        ]}
                      >
                        <View
                          style={[
                            styles.catBreakBarFill,
                            {
                              width: `${Math.max(pct, 2)}%`,
                              backgroundColor: T.error,
                            },
                          ]}
                        />
                      </View>
                      <Text
                        style={[styles.catBreakPct, { color: T.textMuted }]}
                      >
                        {pct.toFixed(1)}% of total spending
                      </Text>
                    </View>
                  );
                })}
              </Card>
            )}

            <Card title="Recent">
              <View style={styles.txList}>
                {transactions
                  .slice(0, 10)
                  .map((tx: any, i: number, arr: any[]) => (
                    <React.Fragment key={tx.id}>
                      <SwipeableRow
                        onDelete={() => deleteTransaction(tx.id)}
                        T={T}
                      >
                        <View
                          style={[
                            styles.txItem,
                            { backgroundColor: T.surface },
                          ]}
                        >
                          <View
                            style={[
                              styles.txIconWrap,
                              {
                                backgroundColor:
                                  tx.type === "income"
                                    ? T.success + "18"
                                    : T.error + "18",
                              },
                            ]}
                          >
                            <Icon
                              name={
                                tx.type === "income"
                                  ? LUCIDE_ICONS.arrowDown
                                  : LUCIDE_ICONS.arrowUp
                              }
                              size={14}
                              color={tx.type === "income" ? T.success : T.error}
                            />
                          </View>
                          <View style={styles.txBody}>
                            <Text
                              style={[styles.txTitle, { color: T.textPrimary }]}
                              numberOfLines={1}
                            >
                              {tx.category}
                            </Text>
                            {tx.description ? (
                              <Text
                                style={[styles.txDesc, { color: T.textMuted }]}
                                numberOfLines={1}
                              >
                                {tx.description}
                              </Text>
                            ) : null}
                          </View>
                          <Text
                            style={[
                              styles.txAmountVal,
                              {
                                color:
                                  tx.type === "income" ? T.success : T.error,
                              },
                            ]}
                          >
                            {tx.type === "income" ? "+" : "-"}₹{" "}
                            {Math.abs(tx.amount).toFixed(0)}
                          </Text>
                        </View>
                      </SwipeableRow>
                      {i < arr.length - 1 && (
                        <View
                          style={[
                            styles.txSeparator,
                            { backgroundColor: T.borderSoft },
                          ]}
                        />
                      )}
                    </React.Fragment>
                  ))}
              </View>
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 48,
    borderBottomWidth: 1,
  },
  menuBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: { ...TYPOGRAPHY.h4, marginLeft: 4 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 8, paddingBottom: 48 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...TYPOGRAPHY.input,
    marginBottom: 8,
  },
  addBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 4,
  },
  addBtnText: { ...TYPOGRAPHY.btn },
  summary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "stretch",
  },
  summaryItem: { flex: 1, alignItems: "center", paddingHorizontal: 2 },
  summaryLabel: { ...TYPOGRAPHY.statLabel, marginBottom: 4 },
  summaryValue: {
    ...TYPOGRAPHY.monoLg,
    marginTop: 4,
    textAlign: "center",
    fontSize: 16,
    lineHeight: 22,
  },
  divider: { width: 1 },
  expenseAmount: { ...TYPOGRAPHY.body, fontWeight: "600" },
  catRow: { marginBottom: 8 },
  catPicker: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  catPickerText: { ...TYPOGRAPHY.input, fontWeight: "500" },
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8 },
  catChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  catChipActive: {},
  catChipText: { ...TYPOGRAPHY.caption },
  catChipTextActive: {},
  txRow: { flexDirection: "row", gap: 8 },
  txHint: { marginBottom: 4 },
  txHintText: { ...TYPOGRAPHY.captionSm },
  typeToggle: {
    flexDirection: "row",
    borderRadius: 14,
    paddingHorizontal: 4,
    paddingVertical: 4,
    gap: 4,
    marginTop: 4,
    marginBottom: 8,
  },
  typeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  typeBtnText: { ...TYPOGRAPHY.btnSm },

  metricsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  metricItem: { flex: 1, alignItems: "center" },
  metricDivider: { width: 1, alignSelf: "stretch" },
  metricValue: { ...TYPOGRAPHY.monoLg, marginBottom: 2 },
  metricLabel: { ...TYPOGRAPHY.statLabel, textAlign: "center" },
  topCatBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
  },
  topCatText: { ...TYPOGRAPHY.bodySm },
  topCatName: { ...TYPOGRAPHY.bodySm, fontWeight: "600", flex: 1 },
  topCatPct: { ...TYPOGRAPHY.bodySm, fontWeight: "700" },
  incomeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  incomeLabel: { ...TYPOGRAPHY.bodySm },
  incomeValue: { ...TYPOGRAPHY.body, fontWeight: "700" },

  catBreakRow: { marginBottom: 14 },
  catBreakTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  catBreakName: { ...TYPOGRAPHY.body, fontWeight: "500" },
  catBreakAmount: { ...TYPOGRAPHY.body, fontWeight: "600" },
  catBreakBarBg: { height: 6, borderRadius: 3, overflow: "hidden" },
  catBreakBarFill: { height: 6, borderRadius: 3 },
  catBreakPct: { ...TYPOGRAPHY.captionSm, marginTop: 4 },

  swipeContainer: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 10,
  },
  deleteBg: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    gap: 6,
    width: "100%",
  },
  deleteText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  txList: { gap: 0 },
  txItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: "transparent",
    borderRadius: 10,
  },
  txIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  txBody: { flex: 1, gap: 2 },
  txTitle: { ...TYPOGRAPHY.body, fontWeight: "600" },
  txDesc: { ...TYPOGRAPHY.captionSm },
  txAmountVal: {
    ...TYPOGRAPHY.body,
    fontWeight: "700",
    fontVariant: ["tabular-nums"] as any,
  },
  txSeparator: { height: 1, marginLeft: 48 },
});
