import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { Icon } from "./Icons";
import { LUCIDE_ICONS, TYPOGRAPHY } from "../constants/typography";
import { Card } from "./Card";
import * as db from "../db/service";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface Detail {
  type: string;
  name: string;
  sets?: number;
  reps?: number;
  rest_seconds?: number;
  weight?: string;
  notes?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  portion?: string;
}

interface AiProgramItem {
  id: number;
  program_id: number;
  day_index: number;
  day_label: string;
  title: string;
  description: string | null;
  details_json: string;
  is_completed: number;
  sort_order: number;
}

interface Props {
  program: {
    id: number;
    type: string;
    title: string;
    items: AiProgramItem[];
  };
  onRefresh: () => void;
}

export function AiPlanCard({ program, onRefresh }: Props) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const handleToggle = async (itemId: number, current: number) => {
    await db.toggleAiProgramItem(itemId, current ? 0 : 1);
    onRefresh();
  };

  const handleToggleDetail = async (
    itemId: number,
    detailIdx: number,
    currentCompletion: number,
  ) => {
    // When a sub-detail is toggled, we update the parent item's completion
    // If all details are done, mark the item complete
    const item = program.items.find((i) => i.id === itemId);
    if (!item) return;
    const details = parseDetails(item);
    const allDone = details.every(
      (_, i) =>
        i === detailIdx
          ? !currentCompletion
          : true, /* toggle the current one in opposite state */
    );
    // For simplicity, toggle parent item
    await db.toggleAiProgramItem(itemId, currentCompletion ? 0 : 1);
    onRefresh();
  };

  const parseDetails = (item: AiProgramItem): Detail[] => {
    try {
      const d = JSON.parse(item.details_json || "[]");
      return Array.isArray(d) ? d : [];
    } catch {
      return [];
    }
  };

  const dayItems = program.items.filter((i) => i.day_index === selectedDay);
  const completedCount = dayItems.filter((i) => i.is_completed).length;
  const totalCount = dayItems.length;

  return (
    <View>
      {/* Day Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 12, paddingHorizontal: 4 }}
      >
        {DAY_NAMES.map((dayName, idx) => {
          const dayItems = program.items.filter((i) => i.day_index === idx);
          const completed = dayItems.filter((i) => i.is_completed).length;
          const isSelected = idx === selectedDay;
          return (
            <TouchableOpacity
              key={idx}
              onPress={() => setSelectedDay(idx)}
              style={[
                styles.dayTab,
                {
                  backgroundColor: isSelected
                    ? colors.accent
                    : colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.dayInitial,
                  { color: isSelected ? "#fff" : colors.textTertiary },
                ]}
              >
                {dayName.slice(0, 3)}
              </Text>
              {dayItems.length > 0 && (
                <View
                  style={[
                    styles.dayProgress,
                    {
                      backgroundColor: isSelected
                        ? "rgba(255,255,255,0.3)"
                        : colors.bgSecondary,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.dayProgressFill,
                      {
                        width: `${(completed / dayItems.length) * 100}%`,
                        backgroundColor: colors.success,
                      },
                    ]}
                  />
                </View>
              )}
              <Text
                style={[
                  styles.dayCount,
                  { color: isSelected ? "#fff" : colors.text },
                ]}
              >
                {completed}/{dayItems.length}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Progress Header */}
      <View
        style={[
          styles.progressHeader,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.progressTitle, { color: colors.text }]}>
          {program.title}
        </Text>
        <Text style={{ color: colors.textTertiary, fontSize: 12 }}>
          Day {selectedDay + 1} — {completedCount}/{totalCount} done
        </Text>
        <View
          style={[
            styles.bar,
            { backgroundColor: colors.bgSecondary },
          ]}
        >
          <View
            style={[
              styles.barFill,
              {
                width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
                backgroundColor: colors.success,
              },
            ]}
          />
        </View>
      </View>

      {/* Day Items */}
      {dayItems.map((item) => {
        const details = parseDetails(item);
        const isEditing = editingItemId === item.id;
        return (
          <Card
            key={item.id}
            style={{ ...styles.itemCard, ...(item.is_completed ? { borderColor: colors.success + "44" } : {}) } as any}
          >
            {/* Title row */}
            <View style={styles.itemHeader}>
              <TouchableOpacity
                onPress={() => handleToggle(item.id, item.is_completed)}
                style={[styles.checkbox, item.is_completed ? styles.checked : undefined]}
              >
                {item.is_completed ? (
                  <Icon name={LUCIDE_ICONS.check} size={14} color="#fff" />
                ) : null}
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                {isEditing ? (
                  <TextInput
                    style={[styles.editInput, { color: colors.text }]}
                    value={editTitle}
                    onChangeText={setEditTitle}
                    autoFocus
                    onBlur={async () => {
                      if (editingItemId !== null) {
                        await db.updateAiProgramItem(editingItemId, {
                          title: editTitle.trim(),
                          description: editDesc.trim(),
                        });
                        setEditingItemId(null);
                        onRefresh();
                      }
                    }}
                  />
                ) : (
                  <TouchableOpacity
                    onPress={() => {
                      setEditingItemId(item.id);
                      setEditTitle(item.title);
                      setEditDesc(item.description || "");
                    }}
                  >
                    <Text
                      style={[
                        styles.itemTitle,
                        {
                          color: colors.text,
                          textDecorationLine: item.is_completed
                            ? "line-through"
                            : "none",
                        },
                      ]}
                    >
                      {item.title}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity
                onPress={() => {
                  setEditingItemId(item.id);
                  setEditTitle(item.title);
                  setEditDesc(item.description || "");
                }}
                style={styles.editBtn}
              >
                <Icon name={LUCIDE_ICONS.edit} size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>

            {/* Description */}
            {item.description ? (
              <Text
                style={[
                  styles.itemDesc,
                  { color: colors.textSecondary },
                  item.is_completed ? { textDecorationLine: "line-through" } : undefined,
                ]}
              >
                {item.description}
              </Text>
            ) : null}

            {/* Structured Details */}
            {details.length > 0 && (
              <View
                style={[
                  styles.detailsSection,
                  { borderTopColor: colors.border },
                ]}
              >
                <Text
                  style={[
                    styles.detailsLabel,
                    { color: colors.textTertiary },
                  ]}
                >
                  {details[0].type === "exercise" ? "EXERCISES" : "MEALS"}
                </Text>
                {details.map((d, i) => (
                  <View key={i} style={styles.detailRow}>
                    <View
                      style={[
                        styles.detailDot,
                        { backgroundColor: colors.accent },
                      ]}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.detailName,
                          { color: colors.text },
                          item.is_completed
                            ? { textDecorationLine: "line-through", color: colors.textTertiary }
                            : undefined,
                        ]}
                      >
                        {d.name}
                      </Text>
                      {d.type === "exercise" && d.sets ? (
                        <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                          {d.sets} × {d.reps} @ {d.weight || "—"}  ·  rest {d.rest_seconds || 60}s
                        </Text>
                      ) : null}
                      {d.type === "meal" && d.calories ? (
                        <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                          {d.calories} cal · P:{d.protein || "—"}g · C:{d.carbs || "—"}g · F:{d.fat || "—"}g
                        </Text>
                      ) : null}
                      {d.notes ? (
                        <Text style={{ color: colors.textTertiary, fontSize: 11, marginTop: 2 }}>
                          {d.notes}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Inline editing for description */}
            {isEditing && (
              <TextInput
                style={[styles.editDesc, { color: colors.text }]}
                value={editDesc}
                onChangeText={setEditDesc}
                multiline
                placeholder="Add details..."
                placeholderTextColor={colors.placeholder}
              />
            )}
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
    borderColor: "#999",
    alignItems: "center",
    justifyContent: "center",
  },
  checked: {
    backgroundColor: "#22c55e",
    borderColor: "#22c55e",
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
  },
  editBtn: {
    padding: 6,
  },
  editInput: {
    fontSize: 16,
    fontWeight: "600",
    padding: 0,
  },
  itemDesc: {
    fontSize: 13,
    marginTop: 4,
    color: "#666",
  },
  editDesc: {
    fontSize: 13,
    paddingVertical: 4,
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
    gap: 8,
    paddingVertical: 4,
  },
  detailDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 5,
  },
  detailName: {
    fontSize: 14,
    fontWeight: "500",
  },
});