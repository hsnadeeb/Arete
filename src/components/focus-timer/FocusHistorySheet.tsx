import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { Icon } from "../Icons";
import { TYPOGRAPHY } from "../../constants/typography";
import * as db from "../../db/service";
import { LEVELS } from "./constants";

interface Session {
  id: number;
  duration: number;
  elapsed: number;
  date: string;
  started_at: string | null;
  status: "completed" | "interrupted" | "in_progress";
  completed_at: string | null;
}

interface FocusHistorySheetProps {
  visible: boolean;
  onClose: () => void;
}

function fmtTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function fmtDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

export function FocusHistorySheet({ visible, onClose }: FocusHistorySheetProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const tc = theme.colors;

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    db.getFocusSessionHistory(100).then((rows) => {
      setSessions(rows as Session[]);
      setLoading(false);
    });
  }, [visible]);

  const completed = sessions.filter((s) => s.status === "completed");
  const totalFocus = completed.reduce((sum, s) => sum + s.elapsed, 0);
  const totalTrees = completed.reduce((sum, s) => sum + Math.floor(s.elapsed / 300), 0);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[s.overlay, { backgroundColor: "rgba(0,0,0,0.35)" }]}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <View
          style={[
            s.sheet,
            {
              backgroundColor: tc.bg,
              paddingBottom: insets.bottom + 16,
            },
          ]}
        >
          <View style={s.handleRow}>
            <View style={[s.handle, { backgroundColor: tc.borderLight }]} />
          </View>

          <Text style={[s.title, { color: tc.heading }]}>Focus History</Text>

          {/* Summary cards */}
          <View style={s.summaryRow}>
            <View style={[s.summaryCard, { backgroundColor: tc.surface, borderColor: tc.border }]}>
              <Text style={[s.summaryVal, { color: tc.accent }]}>{completed.length}</Text>
              <Text style={[s.summaryLbl, { color: tc.textTertiary }]}>Sessions</Text>
            </View>
            <View style={[s.summaryCard, { backgroundColor: tc.surface, borderColor: tc.border }]}>
              <Text style={[s.summaryVal, { color: tc.warning }]}>{fmtDuration(totalFocus)}</Text>
              <Text style={[s.summaryLbl, { color: tc.textTertiary }]}>Focus Time</Text>
            </View>
            <View style={[s.summaryCard, { backgroundColor: tc.surface, borderColor: tc.border }]}>
              <Text style={[s.summaryVal, { color: "#22c55e" }]}>{totalTrees}</Text>
              <Text style={[s.summaryLbl, { color: tc.textTertiary }]}>Trees</Text>
            </View>
          </View>

          {/* Achievements */}
          <Text style={[s.sectionTitle, { color: tc.heading }]}>Achievements</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.achScroll}>
            {LEVELS.map((lvl, i) => {
              const unlocked = totalTrees >= lvl.minTrees;
              const next = LEVELS[i + 1];
              const progress =
                next && !unlocked
                  ? (totalTrees - lvl.minTrees) / (next.minTrees - lvl.minTrees)
                  : 1;
              return (
                <View
                  key={lvl.title}
                  style={[
                    s.achCard,
                    {
                      backgroundColor: unlocked ? tc.surface : tc.bgSecondary,
                      borderColor: unlocked ? tc.border : tc.divider,
                      opacity: unlocked ? 1 : 0.55,
                    },
                  ]}
                >
                  <View
                    style={[
                      s.achIconWrap,
                      {
                        backgroundColor: unlocked ? "#22c55e18" : tc.divider,
                      },
                    ]}
                  >
                    <Icon
                      name={lvl.iconKey as any}
                      size={20}
                      color={unlocked ? "#22c55e" : tc.textTertiary}
                    />
                  </View>
                  <Text
                    style={[
                      s.achTitle,
                      { color: unlocked ? tc.text : tc.textTertiary },
                    ]}
                    numberOfLines={1}
                  >
                    {lvl.title}
                  </Text>
                  <Text style={[s.achReq, { color: tc.textTertiary }]}>
                    {lvl.minTrees === 0
                      ? "Start"
                      : `${lvl.minTrees} trees`}
                  </Text>
                  {unlocked ? (
                    <Text style={[s.achUnlocked, { color: "#22c55e" }]}>
                      Unlocked
                    </Text>
                  ) : (
                    <>
                      <View style={s.achProgressWrap}>
                        <View
                          style={[
                            s.achProgressBg,
                            { backgroundColor: tc.divider },
                          ]}
                        >
                          <View
                            style={[
                              s.achProgressFill,
                              {
                                backgroundColor: tc.textTertiary,
                                width: `${Math.min(100, Math.max(0, progress * 100))}%`,
                              },
                            ]}
                          />
                        </View>
                      </View>
                      <Text style={[s.achToUnlock, { color: tc.textTertiary }]}>
                        {lvl.minTrees - totalTrees > 0
                          ? `${lvl.minTrees - totalTrees} to unlock`
                          : "Locked"}
                      </Text>
                    </>
                  )}
                </View>
              );
            })}
          </ScrollView>

          {/* Session list */}
          {loading ? (
            <ActivityIndicator size="small" color={tc.muted} style={{ marginVertical: 40 }} />
          ) : sessions.length === 0 ? (
            <View style={s.empty}>
              <Text style={[TYPOGRAPHY.body, { color: tc.textTertiary, textAlign: "center" }]}>
                No focus sessions yet.{'\n'}Start your first session to see stats here.
              </Text>
            </View>
          ) : (
            <ScrollView style={s.list} showsVerticalScrollIndicator={false}>
              {sessions.map((sess) => {
                const isComplete = sess.status === "completed";
                const pct = Math.round((sess.elapsed / Math.max(sess.duration, 1)) * 100);
                return (
                  <View
                    key={sess.id}
                    style={[s.row, { borderBottomColor: tc.divider }]}
                  >
                    <View style={s.rowLeft}>
                      <Text style={[s.rowDate, { color: tc.text }]}>
                        {sess.started_at
                          ? new Date(sess.started_at).toLocaleDateString(undefined, {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })
                          : sess.date}
                      </Text>
                      <Text style={[s.rowTime, { color: tc.textTertiary }]}>
                        {sess.started_at
                          ? new Date(sess.started_at).toLocaleTimeString(undefined, {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </Text>
                    </View>
                    <View style={s.rowCenter}>
                      <Text style={[s.rowDuration, { color: tc.text }]}>
                        {fmtTime(sess.elapsed)}
                      </Text>
                      <Text style={[s.rowGoal, { color: tc.textTertiary }]}>
                        / {fmtTime(sess.duration)}
                      </Text>
                    </View>
                    <View style={s.rowRight}>
                      <View
                        style={[
                          s.badge,
                          {
                            backgroundColor: isComplete
                              ? "#22c55e18"
                              : "#ef444418",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            s.badgeText,
                            { color: isComplete ? "#22c55e" : "#ef4444" },
                          ]}
                        >
                          {isComplete ? `${pct}%` : "Interrupted"}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    paddingHorizontal: 20,
  },
  handleRow: { alignItems: "center", paddingVertical: 10 },
  handle: { width: 36, height: 4, borderRadius: 2 },
  title: { ...TYPOGRAPHY.h3, marginBottom: 16 },
  summaryRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: "center",
    gap: 4,
  },
  summaryVal: { ...TYPOGRAPHY.h3, fontWeight: "700" },
  summaryLbl: { ...TYPOGRAPHY.captionSm, fontWeight: "500" },
  list: { maxHeight: 400 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLeft: { flex: 1, gap: 1 },
  rowDate: { ...TYPOGRAPHY.bodySm, fontWeight: "600" },
  rowTime: { ...TYPOGRAPHY.captionSm },
  rowCenter: { flexDirection: "row", alignItems: "baseline", gap: 2 },
  rowDuration: { ...TYPOGRAPHY.mono, fontSize: 15 },
  rowGoal: { ...TYPOGRAPHY.captionSm },
  rowRight: { marginLeft: 12 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { ...TYPOGRAPHY.captionSm, fontWeight: "600" },
  empty: { paddingVertical: 48, alignItems: "center" },
  sectionTitle: { ...TYPOGRAPHY.h4, marginBottom: 10 },
  achScroll: { marginBottom: 20 },
  achCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginRight: 10,
    width: 120,
    alignItems: "center",
    gap: 6,
  },
  achIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  achTitle: { ...TYPOGRAPHY.bodySm, fontWeight: "700", textAlign: "center" },
  achReq: { ...TYPOGRAPHY.captionSm, fontWeight: "500" },
  achUnlocked: { ...TYPOGRAPHY.captionSm, fontWeight: "700" },
  achToUnlock: { ...TYPOGRAPHY.captionSm, fontWeight: "600" },
  achProgressWrap: { width: "100%", paddingHorizontal: 4 },
  achProgressBg: { height: 4, borderRadius: 2, overflow: "hidden" },
  achProgressFill: { height: 4, borderRadius: 2 },
});
