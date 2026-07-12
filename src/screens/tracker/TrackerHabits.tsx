import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Alert,
  Dimensions,
  Animated,
} from "react-native";
import { Icon, getIconName } from "../../components/Icons";
import { LUCIDE_ICONS, TYPOGRAPHY } from "../../constants/typography";
import type { LucideIconName } from "../../constants/typography";
import * as db from "../../db/service";
import { trackerStyles as s } from "./styles";
import type { HabitGridData, ThemeColors } from "./types";
import { HABIT_COLORS } from "./types";

function today(): string {
  return new Date().toISOString().split("T")[0];
}

// Curated habit icons — all from the LUCIDE_ICONS registry
const HABIT_ICONS: LucideIconName[] = [
  LUCIDE_ICONS.book as LucideIconName,
  LUCIDE_ICONS.activity as LucideIconName,
  LUCIDE_ICONS.droplet as LucideIconName,
  LUCIDE_ICONS.moon as LucideIconName,
  LUCIDE_ICONS.sun as LucideIconName,
  LUCIDE_ICONS.coffee as LucideIconName,
  LUCIDE_ICONS.apple as LucideIconName,
  LUCIDE_ICONS.run as LucideIconName,
  LUCIDE_ICONS.briefcase as LucideIconName,
  LUCIDE_ICONS.school as LucideIconName,
  LUCIDE_ICONS.target as LucideIconName,
  LUCIDE_ICONS.star as LucideIconName,
  LUCIDE_ICONS.award as LucideIconName,
  LUCIDE_ICONS.zap as LucideIconName,
  LUCIDE_ICONS.calendar as LucideIconName,
  LUCIDE_ICONS.clock as LucideIconName,
  LUCIDE_ICONS.home as LucideIconName,
  LUCIDE_ICONS.gift as LucideIconName,
  LUCIDE_ICONS.compass as LucideIconName,
  LUCIDE_ICONS.rocket as LucideIconName,
];

/**
 * Resolve a stored habit emoji value to a lucide icon name.
 * New habits store Lucide icon names directly (e.g. "Book").
 * Legacy data stores Unicode emoji (e.g. "✅") — converted via getIconName.
 */
function resolveHabitIcon(emoji: string | undefined | null): LucideIconName {
  if (!emoji) return "Circle";
  if (HABIT_ICONS.includes(emoji as LucideIconName)) {
    return emoji as LucideIconName;
  }
  return getIconName(emoji);
}

interface Props {
  habits: any[];
  habitLogs: any[];
  habitGrid: HabitGridData;
  onRefresh: () => void;
  onRefreshLogs: () => void;
  T: ThemeColors;
  accentColor: string;
}

function HabitGrid({
  habitId,
  color,
  grid,
  habitLogs,
  onToggle,
  T,
}: {
  habitId: number;
  color: string;
  grid: HabitGridData;
  habitLogs: any[];
  onToggle: (habitId: number, date: string) => void;
  T: ThemeColors;
}) {
  const gap = 3;
  const screenWidth = Dimensions.get("window").width;
  const dayLabelW = 28;
  const availableW = screenWidth - 32 - dayLabelW - (grid.weeks.length - 1) * gap;
  const cellSize = Math.max(10, Math.floor(availableW / grid.weeks.length));
  const dayLabels = ["", "Mon", "", "Wed", "", "Fri", ""];

  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          marginLeft: dayLabelW,
          marginBottom: 10,
          height: 14,
        }}
      >
        {grid.monthLabels.map((m, i) => (
          <View
            key={i}
            style={{ position: "absolute", left: m.col * (cellSize + gap) }}
          >
            <Text
              style={[
                TYPOGRAPHY.captionSm,
                { color: T.textMuted, fontWeight: "500" },
              ]}
            >
              {m.label}
            </Text>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: "row" }}>
        <View style={{ width: dayLabelW - 4, gap }}>
          {dayLabels.map((l, i) => (
            <Text
              key={i}
              style={[
                TYPOGRAPHY.captionSm,
                {
                  color: T.textMuted,
                  height: cellSize,
                  lineHeight: cellSize,
                },
              ]}
            >
              {l}
            </Text>
          ))}
        </View>
        <View style={{ flexDirection: "row", gap }}>
          {grid.weeks.map((week, wi) => (
            <View key={wi} style={{ gap }}>
              {week.map((d) => {
                const done = habitLogs.some(
                  (l) => l.habit_id === habitId && l.date === d.date,
                );
                return (
                  <TouchableOpacity
                    key={d.date}
                    onPress={() => onToggle(habitId, d.date)}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      borderRadius: 3,
                      backgroundColor: done ? color : T.border,
                      opacity: done ? 1 : 0.3,
                    }}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

export function TrackerHabits({
  habits,
  habitLogs,
  habitGrid,
  onRefresh,
  onRefreshLogs,
  T,
  accentColor,
}: Props) {
  const [selectedHabit, setSelectedHabit] = useState<any>(null);
  const [colorFilter, setColorFilter] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState<LucideIconName>(HABIT_ICONS[0]);
  const [newColor, setNewColor] = useState("#6366f1");

  const cardAnims = useRef(
    Array.from({ length: 20 }, () => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    Animated.stagger(
      60,
      cardAnims.slice(0, habits.length).map((a) =>
        Animated.timing(a, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, [habits.length, cardAnims]);

  const handleAddHabit = async () => {
    if (!newName.trim()) return;
    await db.addHabit({
      name: newName.trim(),
      emoji: newIcon,
      color: newColor,
      target_per_day: 1,
    });
    setNewName("");
    setShowAddModal(false);
    setNewColor("#6366f1");
    setNewIcon(HABIT_ICONS[0]);
    onRefresh();
  };

  const handleToggleDay = async (habitId: number, date: string) => {
    const existing = habitLogs.find(
      (l) => l.habit_id === habitId && l.date === date,
    );
    if (existing) {
      await db.deleteHabitLogById(existing.id);
    } else {
      await db.logHabit(habitId, date, 1);
    }
    onRefreshLogs();
  };

  const handleDelete = (id: number, name: string) => {
    Alert.alert("Delete Habit", `Remove "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await db.deleteHabitById(id);
          onRefresh();
          setSelectedHabit(null);
        },
      },
    ]);
  };

  const filtered = colorFilter
    ? habits.filter((h) => (h.color || "#6366f1") === colorFilter)
    : habits;

  // Detail view
  if (selectedHabit) {
    return (
      <ScrollView
        style={s.tabScroll}
        contentContainerStyle={s.tabScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          onPress={() => setSelectedHabit(null)}
          style={[s.backBtn, { borderColor: T.border }]}
        >
          <Text style={{ color: T.textSecondary }}>← Back</Text>
        </TouchableOpacity>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            marginBottom: 12,
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: (selectedHabit.color || accentColor) + "18",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon
              name={resolveHabitIcon(selectedHabit.emoji)}
              size={22}
              color={selectedHabit.color || accentColor}
            />
          </View>
          <Text
            style={[TYPOGRAPHY.h3, { color: T.textPrimary, flex: 1 }]}
          >
            {selectedHabit.name}
          </Text>
          <TouchableOpacity
            onPress={() => handleDelete(selectedHabit.id, selectedHabit.name)}
          >
            <Icon name={LUCIDE_ICONS.trash2} size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>

        <HabitGrid
          habitId={selectedHabit.id}
          color={selectedHabit.color || "#6366f1"}
          grid={habitGrid}
          habitLogs={habitLogs}
          onToggle={handleToggleDay}
          T={T}
        />
      </ScrollView>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={s.tabScroll}
        contentContainerStyle={s.tabScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {habits.length === 0 ? (
          <View style={s.emptyState}>
            <Icon
              name={LUCIDE_ICONS.checkCircle}
              size={48}
              color={T.textTertiary}
            />
            <Text style={[TYPOGRAPHY.body, { color: T.textTertiary }]}>
              No habits yet
            </Text>
            <Text style={[TYPOGRAPHY.caption, { color: T.textMuted }]}>
              Tap + to add your first habit
            </Text>
          </View>
        ) : (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 12 }}
            >
              <View style={s.filterRow}>
                <TouchableOpacity
                  onPress={() => setColorFilter(null)}
                  style={[
                    s.filterChip,
                    {
                      backgroundColor:
                        colorFilter === null ? accentColor + "18" : T.surface,
                      borderColor:
                        colorFilter === null ? accentColor : T.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      TYPOGRAPHY.btnSm,
                      {
                        color:
                          colorFilter === null ? accentColor : T.textSecondary,
                      },
                    ]}
                  >
                    All
                  </Text>
                </TouchableOpacity>
                {HABIT_COLORS.map((c) => {
                  const count = habits.filter(
                    (h) => (h.color || "#6366f1") === c,
                  ).length;
                  if (count === 0) return null;
                  return (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setColorFilter(c === colorFilter ? null : c)}
                      style={[
                        s.filterChip,
                        {
                          backgroundColor:
                            colorFilter === c ? c + "20" : T.surface,
                          borderColor: colorFilter === c ? c : T.border,
                        },
                      ]}
                    >
                      <View
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: c,
                        }}
                      />
                      <Text
                        style={[TYPOGRAPHY.btnSm, { color: T.textSecondary }]}
                      >
                        {count}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {filtered.map((h, idx) => {
              const c = h.color || "#6366f1";
              const todayLog = habitLogs.find(
                (l) => l.habit_id === h.id && l.date === today(),
              );
              const checked = !!todayLog;
              const streak = habitLogs.filter(
                (l) => l.habit_id === h.id,
              ).length;

              return (
                <Animated.View
                  key={h.id}
                  style={{
                    opacity: cardAnims[idx] || new Animated.Value(1),
                    transform: [
                      {
                        translateY: (
                          cardAnims[idx] || new Animated.Value(1)
                        ).interpolate({
                          inputRange: [0, 1],
                          outputRange: [16, 0],
                        }),
                      },
                    ],
                  }}
                >
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedHabit(h);
                      setColorFilter(null);
                    }}
                    style={[
                      s.habitCard,
                      { backgroundColor: T.surface, borderColor: T.borderSoft },
                    ]}
                    activeOpacity={0.7}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        backgroundColor: c + "18",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon
                        name={resolveHabitIcon(h.emoji)}
                        size={20}
                        color={c}
                      />
                    </View>

                    <View style={s.habitInfo}>
                      <Text style={[s.habitName, { color: T.textPrimary }]}>
                        {h.name}
                      </Text>
                      <Text
                        style={[s.habitStreak, { color: T.textTertiary }]}
                      >
                        {streak} / 90 days
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleToggleDay(h.id, today())}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      style={[
                        s.checkCircle,
                        {
                          borderColor: checked ? c : T.border,
                          backgroundColor: checked ? c : "transparent",
                        },
                      ]}
                    >
                      {checked && (
                        <Icon name={LUCIDE_ICONS.check} size={13} color="#fff" />
                      )}
                    </TouchableOpacity>

                    <Icon
                      name={LUCIDE_ICONS.chevronRight}
                      size={18}
                      color={T.textMuted}
                    />
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </>
        )}
      </ScrollView>

      {/* Fixed FAB — bottom left */}
      <TouchableOpacity
        onPress={() => setShowAddModal(true)}
        style={[s.fab, { backgroundColor: accentColor }]}
        activeOpacity={0.8}
      >
        <Icon name={LUCIDE_ICONS.plus} size={24} color="#fff" />
      </TouchableOpacity>

      {/* Add Habit Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => setShowAddModal(false)}
          />
          <View style={[s.modalSheet, { backgroundColor: T.surface }]}>
            <Text
              style={[
                TYPOGRAPHY.h3,
                { color: T.textPrimary, marginBottom: 16 },
              ]}
            >
              New Habit
            </Text>

            <Text style={s.label}>Icon</Text>
            <View style={s.emojiGrid}>
              {HABIT_ICONS.map((iconName) => {
                const isSelected = newIcon === iconName;
                return (
                  <TouchableOpacity
                    key={iconName}
                    onPress={() => setNewIcon(iconName)}
                    style={[
                      s.emojiBtn,
                      {
                        backgroundColor: isSelected
                          ? accentColor + "18"
                          : "transparent",
                        borderColor: isSelected ? accentColor : T.border,
                      },
                    ]}
                  >
                    <Icon
                      name={iconName}
                      size={20}
                      color={isSelected ? accentColor : T.textSecondary}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={s.label}>Name</Text>
            <TextInput
              style={[
                s.modalInput,
                {
                  backgroundColor: T.surfaceAlt,
                  borderColor: T.border,
                  color: T.textPrimary,
                },
              ]}
              value={newName}
              onChangeText={setNewName}
              placeholder="e.g. Morning run"
              placeholderTextColor={T.placeholder}
              autoFocus
            />

            <Text style={s.label}>Color</Text>
            <View style={s.colorGrid}>
              {HABIT_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setNewColor(c)}
                  style={[
                    s.colorDot,
                    {
                      backgroundColor: c,
                      borderWidth: newColor === c ? 3 : 1,
                      borderColor: newColor === c ? T.textPrimary : T.border,
                    },
                  ]}
                />
              ))}
            </View>

            <View style={s.modalBtnRow}>
              <TouchableOpacity
                style={[s.modalCancelBtn, { backgroundColor: T.surfaceAlt }]}
                onPress={() => {
                  setShowAddModal(false);
                  setNewName("");
                }}
              >
                <Text style={{ color: T.textSecondary, fontWeight: "600" }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalSaveBtn, { backgroundColor: accentColor }]}
                onPress={handleAddHabit}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}