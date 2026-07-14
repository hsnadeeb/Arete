import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { Icon } from "./Icons";
import { LUCIDE_ICONS } from "../constants/typography";
import { Card } from "./Card";
import * as db from "../db/service";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface DetailRow {
  id: number;
  program_id: number;
  item_id: number;
  type: string;
  name: string;
  metadata_json: string;
  is_completed: number;
  sort_order: number;
}

interface AiProgramItem {
  id: number;
  program_id: number;
  day_index: number;
  day_label: string;
  title: string;
  description: string | null;
  is_completed: number;
  sort_order: number;
}

interface Props {
  program: {
    id: number;
    type: string;
    title: string;
    items: AiProgramItem[];
    details: DetailRow[];
  };
  onRefresh: () => void;
}

function parseMetadata(detail: DetailRow): Record<string, any> {
  try {
    return JSON.parse(detail.metadata_json || "{}");
  } catch {
    return {};
  }
}

export function AiPlanCard({ program, onRefresh }: Props) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [editingDetailId, setEditingDetailId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editMeta, setEditMeta] = useState("");

  const detailsByItem = (itemId: number) =>
    program.details.filter((d) => d.item_id === itemId).sort((a, b) => a.sort_order - b.sort_order);

  const handleToggleDetail = async (detail: DetailRow) => {
    await db.toggleAiProgramItemDetail(detail.id, detail.is_completed ? 0 : 1);
    onRefresh();
  };

  const handleToggleItem = async (item: AiProgramItem) => {
    const ds = detailsByItem(item.id);
    const allDone = ds.every((d) => d.is_completed === 1);
    const newState = allDone ? 0 : 1;
    for (const d of ds) {
      await db.toggleAiProgramItemDetail(d.id, newState);
    }
    onRefresh();
  };

  const startEditingDetail = (detail: DetailRow) => {
    setEditingDetailId(detail.id);
    setEditName(detail.name);
    setEditMeta(JSON.stringify(parseMetadata(detail), null, 2));
  };

  const saveEditingDetail = async () => {
    if (editingDetailId === null) return;
    try {
      const metadata = JSON.parse(editMeta);
      await db.updateAiProgramItemDetail(editingDetailId, {
        name: editName.trim(),
        metadata,
      });
    } catch {
      // invalid JSON; keep as string metadata
      await db.updateAiProgramItemDetail(editingDetailId, {
        name: editName.trim(),
        metadata: { raw: editMeta },
      });
    }
    setEditingDetailId(null);
    onRefresh();
  };

  const dayItems = program.items.filter((i) => i.day_index === selectedDay);
  const dayDetails = dayItems.flatMap((i) => detailsByItem(i.id));
  const completedCount = dayDetails.filter((d) => d.is_completed).length;
  const totalCount = dayDetails.length;

  const formatDetailSubtitle = (detail: DetailRow) => {
    const m = parseMetadata(detail);
    if (detail.type === "exercise") {
      return `${m.sets ?? "—"} × ${m.reps ?? "—"} @ ${m.weight || "—"}${m.rest_seconds ? ` · rest ${m.rest_seconds}s` : ""}`;
    }
    if (detail.type === "meal") {
      return `${m.calories ?? "—"} cal · P:${m.protein ?? "—"} · C:${m.carbs ?? "—"} · F:${m.fat ?? "—"}${m.portion ? ` · ${m.portion}` : ""}`;
    }
    return "";
  };

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 12, paddingHorizontal: 4 }}
      >
        {DAY_NAMES.map((dayName, idx) => {
          const items = program.items.filter((i) => i.day_index === idx);
          const details = items.flatMap((i) => detailsByItem(i.id));
          const completed = details.filter((d) => d.is_completed).length;
          const isSelected = idx === selectedDay;
          return (
            <TouchableOpacity
              key={idx}
              onPress={() => setSelectedDay(idx)}
              style={[
                styles.dayTab,
                {
                  backgroundColor: isSelected ? colors.accent : colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.dayInitial, { color: isSelected ? "#fff" : colors.textTertiary }]}>
                {dayName.slice(0, 3)}
              </Text>
              {details.length > 0 && (
                <View style={[styles.dayProgress, { backgroundColor: isSelected ? "rgba(255,255,255,0.3)" : colors.bgSecondary }]}>
                  <View
                    style={[
                      styles.dayProgressFill,
                      { width: `${(completed / details.length) * 100}%`, backgroundColor: colors.success },
                    ]}
                  />
                </View>
              )}
              <Text style={[styles.dayCount, { color: isSelected ? "#fff" : colors.text }]}>
                {completed}/{details.length}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={[styles.progressHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.progressTitle, { color: colors.text }]}>{program.title}</Text>
        <Text style={{ color: colors.textTertiary, fontSize: 12 }}>
          {DAY_NAMES[selectedDay]} · {completedCount}/{totalCount} done
        </Text>
        <View style={[styles.bar, { backgroundColor: colors.bgSecondary }]}>
          <View
            style={[
              styles.barFill,
              { width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`, backgroundColor: colors.success },
            ]}
          />
        </View>
      </View>

      {dayItems.length === 0 && (
        <Text style={{ color: colors.textTertiary, textAlign: "center", padding: 20 }}>
          No tasks for this day.
        </Text>
      )}

      {dayItems.map((item) => {
        const details = detailsByItem(item.id);
        const itemDone = details.length > 0 && details.every((d) => d.is_completed === 1);
        return (
          <Card
            key={item.id}
            style={{ ...styles.itemCard, backgroundColor: colors.surface, borderColor: itemDone ? colors.success + "44" : colors.border } as any}
          >
            <View style={styles.itemHeader}>
              <TouchableOpacity
                onPress={() => handleToggleItem(item)}
                style={[styles.checkbox, itemDone ? { backgroundColor: colors.success, borderColor: colors.success } : { borderColor: colors.textTertiary }]}
              >
                {itemDone && <Icon name={LUCIDE_ICONS.check} size={14} color="#fff" />}
              </TouchableOpacity>
              <Text style={[styles.itemTitle, { color: colors.text }]}>{item.title}</Text>
            </View>

            {item.description ? (
              <Text style={[styles.itemDesc, { color: colors.textSecondary }]}>{item.description}</Text>
            ) : null}

            <View style={[styles.detailsSection, { borderTopColor: colors.border }]}>
              <Text style={[styles.detailsLabel, { color: colors.textTertiary }]}>
                {program.type === "gym" ? "EXERCISES" : "MEALS"}
              </Text>
              {details.map((detail) => {
                const isEditing = editingDetailId === detail.id;
                return (
                  <View key={detail.id} style={styles.detailRow}>
                    <TouchableOpacity
                      onPress={() => handleToggleDetail(detail)}
                      style={[
                        styles.detailCheckbox,
                        { borderColor: colors.textTertiary },
                        detail.is_completed === 1 ? { backgroundColor: colors.success, borderColor: colors.success } : undefined,
                      ]}
                    >
                      {detail.is_completed === 1 && <Icon name={LUCIDE_ICONS.check} size={12} color="#fff" />}
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                      {isEditing ? (
                        <>
                          <TextInput
                            style={[styles.editInput, { color: colors.text }]}
                            value={editName}
                            onChangeText={setEditName}
                            autoFocus
                          />
                          <TextInput
                            style={[styles.editMeta, { color: colors.text }]}
                            value={editMeta}
                            onChangeText={setEditMeta}
                            multiline
                            numberOfLines={2}
                          />
                          <TouchableOpacity
                            onPress={saveEditingDetail}
                            style={{ marginTop: 4, alignSelf: "flex-start" }}
                          >
                            <Text style={{ color: colors.accent, fontWeight: "600", fontSize: 12 }}>Save</Text>
                          </TouchableOpacity>
                        </>
                      ) : (
                        <TouchableOpacity onPress={() => startEditingDetail(detail)}>
                          <Text
                            style={[
                              styles.detailName,
                              { color: detail.is_completed ? colors.textTertiary : colors.text },
                              detail.is_completed ? { textDecorationLine: "line-through" } : undefined,
                            ]}
                          >
                            {detail.name}
                          </Text>
                          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{formatDetailSubtitle(detail)}</Text>
                          {parseMetadata(detail).notes ? (
                            <Text style={{ color: colors.textTertiary, fontSize: 11, marginTop: 2 }}>
                              {parseMetadata(detail).notes}
                            </Text>
                          ) : null}
                        </TouchableOpacity>
                      )}
                    </View>
                    <TouchableOpacity onPress={() => startEditingDetail(detail)} style={styles.editBtn}>
                      <Icon name={LUCIDE_ICONS.edit} size={16} color={colors.textTertiary} />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </Card>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  dayTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 6,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    minWidth: 60,
  },
  dayInitial: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  dayProgress: {
    height: 4,
    width: "100%",
    borderRadius: 2,
    overflow: "hidden",
    marginVertical: 3,
  },
  dayProgressFill: {
    height: "100%",
    borderRadius: 2,
  },
  dayCount: {
    fontSize: 11,
    fontWeight: "500",
  },
  progressHeader: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
    gap: 6,
  },
  progressTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  bar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 3,
  },
  itemCard: {
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 10,
    padding: 14,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
  },
  itemDesc: {
    fontSize: 13,
    marginTop: 4,
  },
  detailsSection: {
    marginTop: 10,
    borderTopWidth: 1,
    paddingTop: 10,
  },
  detailsLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 6,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 6,
  },
  detailCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  detailName: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  editBtn: {
    padding: 6,
  },
  editInput: {
    fontSize: 14,
    fontWeight: "500",
    padding: 0,
  },
  editMeta: {
    fontSize: 11,
    padding: 0,
    marginTop: 2,
    fontFamily: "monospace",
  },
});