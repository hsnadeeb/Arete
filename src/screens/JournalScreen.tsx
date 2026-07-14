import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "../store";
import { useTheme } from "../context/ThemeContext";
import { Icon } from "../components/Icons";
import { LUCIDE_ICONS, TYPOGRAPHY } from "../constants/typography";
import * as db from "../db/service";
import { Card } from "../components/Card";
import { generateAiProgram } from "../services/ai";

type TabType = "gym" | "food" | "note";
type ProgramType = "gym" | "food";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"];

// "Today" / "Yesterday" reads far lighter than a raw ISO date in a list
// someone scans every day — small thing, but it's the difference between
// a log and a diary.
function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays > 1 && diffDays < 7) return DAY_NAMES[date.getDay()];
  return dateStr;
}

export default function JournalScreen() {
  const { theme } = useTheme();
  const setSidebarOpen = useStore((s) => s.setSidebarOpen);
  const colors = theme.colors;
  const [tab, setTab] = useState<TabType>("note");
  const [gym, setGym] = useState({
    name: "",
    exercises: "",
    duration: "",
    notes: "",
  });
  const [food, setFood] = useState({
    meal: "Breakfast",
    foods: "",
    calories: "",
    protein: "",
    notes: "",
  });
  const [note, setNote] = useState({ title: "", content: "", type: "general" });
  const [recent, setRecent] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  // Manual logging is the fallback, not the default — the AI program is
  // meant to carry most of the load, so keep the raw entry forms tucked
  // away a tap behind a toggle instead of always taking up screen space.
  const [showGymForm, setShowGymForm] = useState(false);
  const [showFoodForm, setShowFoodForm] = useState(false);

  const [gymProgram, setGymProgram] = useState<any>(null);
  const [foodProgram, setFoodProgram] = useState<any>(null);
  const [generatingType, setGeneratingType] = useState<ProgramType | null>(
    null,
  );

  const loadRecent = useCallback(async () => {
    const entries = await db.getAllJournalEntries();
    setRecent(entries.slice(0, 10));
  }, []);

  const loadPrograms = useCallback(async () => {
    const gp = await db.getActiveAiProgram("gym");
    setGymProgram(gp ? await db.getAiProgramWithItems(gp.id) : null);
    const fp = await db.getActiveAiProgram("food");
    setFoodProgram(fp ? await db.getAiProgramWithItems(fp.id) : null);
  }, []);

  useEffect(() => {
    loadRecent();
    loadPrograms();
  }, [loadRecent, loadPrograms]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      if (tab === "gym") {
        if (!gym.name) return;
        await db.addGymLog({
          date: today,
          workout_name: gym.name,
          exercises: gym.exercises,
          duration_minutes: parseInt(gym.duration) || 0,
          notes: gym.notes,
        });
        setGym({ name: "", exercises: "", duration: "", notes: "" });
        setShowGymForm(false);
      } else if (tab === "food") {
        if (!food.foods) return;
        await db.addNutritionLog({
          date: today,
          meal_type: food.meal,
          foods: food.foods,
          calories: parseInt(food.calories) || 0,
          protein_g: parseFloat(food.protein) || 0,
          carbs_g: 0,
          fat_g: 0,
          notes: food.notes,
        });
        setFood({
          meal: "Breakfast",
          foods: "",
          calories: "",
          protein: "",
          notes: "",
        });
        setShowFoodForm(false);
      } else {
        if (!note.content) return;
        await db.addJournalEntry({
          date: today,
          title: note.title,
          content: note.content,
          type: note.type,
        });
        setNote({ title: "", content: "", type: "general" });
      }
      await loadRecent();
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateProgram = async (type: ProgramType) => {
    setGeneratingType(type);
    try {
      await generateAiProgram(type);
      if (type === "gym") {
        const gp = await db.getActiveAiProgram("gym");
        setGymProgram(gp ? await db.getAiProgramWithItems(gp.id) : null);
      } else {
        const fp = await db.getActiveAiProgram("food");
        setFoodProgram(fp ? await db.getAiProgramWithItems(fp.id) : null);
      }
    } catch (e: any) {
      Alert.alert("Generation Failed", e.message);
    } finally {
      setGeneratingType(null);
    }
  };

  const handleToggleItem = async (itemId: number, currentStatus: number) => {
    await db.toggleAiProgramItem(itemId, currentStatus ? 0 : 1);
    if (gymProgram) {
      const updated = await db.getAiProgramWithItems(gymProgram.id);
      setGymProgram(updated);
    }
    if (foodProgram) {
      const updated = await db.getAiProgramWithItems(foodProgram.id);
      setFoodProgram(updated);
    }
  };

  const handleRegenerate = (type: ProgramType) => {
    Alert.alert(
      "Regenerate plan?",
      `This replaces your current weekly ${type === "gym" ? "workout" : "meal"} plan. Completed days won't carry over.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Regenerate",
          style: "destructive",
          onPress: () => handleGenerateProgram(type),
        },
      ],
    );
  };

  const todayIdx = new Date().getDay();

  // One card per plan type: empty state (with a clear CTA) when nothing's
  // generated yet, or progress + today's task + a tap-to-toggle week strip
  // once it exists. Keeping both states in the same component means there's
  // exactly one card in this position, not two stacked cards fighting for
  // attention like before.
  const renderPlanCard = (type: ProgramType) => {
    const program = type === "gym" ? gymProgram : foodProgram;
    const label = type === "gym" ? "Workout" : "Meal";
    const icon = type === "gym" ? LUCIDE_ICONS.run : LUCIDE_ICONS.coffee;
    const isGenerating = generatingType === type;

    if (!program) {
      return (
        <Card style={{ backgroundColor: colors.surface }}>
          <View style={{ alignItems: "center", paddingVertical: 16 }}>
            <View
              style={[
                styles.emptyIconCircle,
                { backgroundColor: colors.accentBg },
              ]}
            >
              <Icon name={icon} size={22} color={colors.accent} />
            </View>
            <Text
              style={{
                color: colors.text,
                fontWeight: "700",
                fontSize: 16,
                marginTop: 12,
              }}
            >
              No {label.toLowerCase()} plan yet
            </Text>
            <Text
              style={{
                color: colors.textTertiary,
                fontSize: 13,
                textAlign: "center",
                marginTop: 4,
                lineHeight: 19,
                maxWidth: 260,
              }}
            >
              Generate a personalized 7-day {label.toLowerCase()} plan from your
              history — then just check days off as you go.
            </Text>
            <TouchableOpacity
              style={[
                styles.primaryBtn,
                {
                  backgroundColor: colors.accent,
                  marginTop: 16,
                  alignSelf: "stretch",
                },
                isGenerating && { opacity: 0.6 },
              ]}
              onPress={() => handleGenerateProgram(type)}
              disabled={isGenerating}
              activeOpacity={0.85}
            >
              {isGenerating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Icon name={LUCIDE_ICONS.zap} size={15} color="#fff" />
                  <Text
                    style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}
                  >
                    Generate my week
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Card>
      );
    }

    const completedCount = program.items.filter(
      (i: any) => i.is_completed,
    ).length;
    const total = program.items.length || 7;
    const progressPct = Math.round((completedCount / total) * 100);
    const todayItem = program.items.find((i: any) => i.day_index === todayIdx);

    return (
      <Card style={{ backgroundColor: colors.surface }}>
        {/* Header row: progress summary + a quiet icon-only regenerate action,
            so the primary CTA doesn't have to compete once a plan exists. */}
        <View
          style={[
            styles.row,
            {
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            },
          ]}
        >
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 13,
              fontWeight: "600",
            }}
          >
            {completedCount}/{total} done this week
          </Text>
          <TouchableOpacity
            onPress={() => handleRegenerate(type)}
            disabled={isGenerating}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={[
              styles.iconGhostBtn,
              { backgroundColor: colors.bgSecondary },
            ]}
          >
            {isGenerating ? (
              <ActivityIndicator size="small" color={colors.textTertiary} />
            ) : (
              <Icon
                name={LUCIDE_ICONS.refreshCw}
                size={13}
                color={colors.textTertiary}
              />
            )}
          </TouchableOpacity>
        </View>

        <View
          style={[styles.progressTrack, { backgroundColor: colors.bgTertiary }]}
        >
          <View
            style={[
              styles.progressFill,
              { backgroundColor: colors.success, width: `${progressPct}%` },
            ]}
          />
        </View>

        {/* Week strip — a tap-to-toggle overview of all 7 days without
            forcing a scroll through a long vertical list. */}
        <View
          style={[
            styles.row,
            { justifyContent: "space-between", marginTop: 14, marginBottom: 4 },
          ]}
        >
          {DAY_INITIALS.map((initial, idx) => {
            const item = program.items.find((i: any) => i.day_index === idx);
            const isToday = idx === todayIdx;
            const done = !!item?.is_completed;
            return (
              <TouchableOpacity
                key={idx}
                disabled={!item}
                onPress={() =>
                  item && handleToggleItem(item.id, item.is_completed)
                }
                style={[
                  styles.dayDot,
                  {
                    backgroundColor: done ? colors.success : colors.bgSecondary,
                    borderColor: colors.border,
                  },
                  isToday && { borderColor: colors.accent, borderWidth: 2 },
                ]}
                activeOpacity={0.7}
              >
                {done ? (
                  <Icon name={LUCIDE_ICONS.check} size={12} color="#fff" />
                ) : (
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "700",
                      color: isToday ? colors.accent : colors.textTertiary,
                    }}
                  >
                    {initial}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Today, front and center — this is the one thing someone actually
            needs to look at when they open the app. */}
        {todayItem ? (
          <TouchableOpacity
            style={[
              styles.todayCard,
              { backgroundColor: colors.accentBg, borderColor: colors.accent },
              todayItem.is_completed && {
                backgroundColor: colors.bgSecondary,
                borderColor: colors.border,
              },
            ]}
            onPress={() =>
              handleToggleItem(todayItem.id, todayItem.is_completed)
            }
            activeOpacity={0.8}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: colors.textTertiary,
                  fontSize: 11,
                  fontWeight: "700",
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                }}
              >
                Today
              </Text>
              <Text
                style={[
                  {
                    color: colors.text,
                    fontWeight: "700",
                    fontSize: 15,
                    marginTop: 2,
                  },
                  todayItem.is_completed && {
                    textDecorationLine: "line-through",
                    color: colors.muted,
                  },
                ]}
              >
                {todayItem.title}
              </Text>
              {todayItem.description ? (
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 12.5,
                    marginTop: 4,
                    lineHeight: 18,
                  }}
                  numberOfLines={4}
                >
                  {todayItem.description}
                </Text>
              ) : null}
            </View>
            <View
              style={[
                styles.checkboxLg,
                todayItem.is_completed
                  ? {
                      backgroundColor: colors.success,
                      borderColor: colors.success,
                    }
                  : { borderColor: colors.accent },
              ]}
            >
              {todayItem.is_completed ? (
                <Icon name={LUCIDE_ICONS.check} size={16} color="#fff" />
              ) : null}
            </View>
          </TouchableOpacity>
        ) : (
          <Text
            style={{
              color: colors.muted,
              fontSize: 12,
              textAlign: "center",
              paddingVertical: 10,
            }}
          >
            Nothing scheduled for today.
          </Text>
        )}
      </Card>
    );
  };

  const renderManualToggle = (
    type: "gym" | "food",
    shown: boolean,
    setShown: (v: boolean) => void,
  ) => (
    <TouchableOpacity
      style={[styles.manualToggle, { borderColor: colors.border }]}
      onPress={() => setShown(!shown)}
      activeOpacity={0.7}
    >
      <Icon
        name={shown ? LUCIDE_ICONS.check : LUCIDE_ICONS.edit}
        size={13}
        color={colors.textTertiary}
      />
      <Text
        style={{
          color: colors.textTertiary,
          fontSize: 12.5,
          fontWeight: "600",
        }}
      >
        {shown
          ? "Hide manual entry"
          : `Log a ${type === "gym" ? "workout" : "meal"} manually`}
      </Text>
    </TouchableOpacity>
  );

  const recentIconFor = (e: any) => {
    if (e.workout_name) return { icon: LUCIDE_ICONS.run, tint: colors.accent };
    if (e.foods) return { icon: LUCIDE_ICONS.coffee, tint: colors.success };
    return { icon: LUCIDE_ICONS.edit, tint: colors.textTertiary };
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.bg }}
      edges={["top"]}
    >
      <View
        style={[
          styles.header,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity
          onPress={() => setSidebarOpen(true)}
          style={styles.menuBtn}
        >
          <Icon name={LUCIDE_ICONS.menu} size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Journal</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 12, gap: 12, paddingBottom: 60 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Segmented control reads as one cohesive switch rather than three
              loose pills with gaps between them. */}
          <View
            style={[
              styles.segment,
              {
                backgroundColor: colors.bgSecondary,
                borderColor: colors.border,
              },
            ]}
          >
            {[
              { key: "note" as const, label: "Note", icon: LUCIDE_ICONS.edit },
              { key: "gym" as const, label: "Gym", icon: LUCIDE_ICONS.run },
              {
                key: "food" as const,
                label: "Food",
                icon: LUCIDE_ICONS.coffee,
              },
            ].map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[
                  styles.segmentItem,
                  tab === t.key && {
                    backgroundColor: colors.surface,
                    ...styles.segmentActiveShadow,
                  },
                ]}
                onPress={() => setTab(t.key)}
                activeOpacity={0.8}
              >
                <Icon
                  name={t.icon}
                  size={14}
                  color={tab === t.key ? colors.accent : colors.textTertiary}
                />
                <Text
                  style={{
                    color: tab === t.key ? colors.accent : colors.textTertiary,
                    fontWeight: tab === t.key ? "700" : "600",
                    fontSize: 13,
                  }}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {tab === "note" && (
            <Card title="New Entry" style={{ backgroundColor: colors.surface }}>
              <TextInput
                style={[
                  styles.inp,
                  {
                    backgroundColor: colors.bg,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="Title (optional)"
                placeholderTextColor={colors.placeholder}
                value={note.title}
                onChangeText={(v) => setNote({ ...note, title: v })}
              />
              <TextInput
                style={[
                  styles.inp,
                  styles.textarea,
                  {
                    backgroundColor: colors.bg,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="What's on your mind?"
                placeholderTextColor={colors.placeholder}
                multiline
                value={note.content}
                onChangeText={(v) => setNote({ ...note, content: v })}
              />
              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  { backgroundColor: colors.accent },
                  (saving || !note.content.trim()) && { opacity: 0.5 },
                ]}
                onPress={handleSave}
                disabled={saving || !note.content.trim()}
                activeOpacity={0.85}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text
                    style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}
                  >
                    Save entry
                  </Text>
                )}
              </TouchableOpacity>
            </Card>
          )}

          {tab === "gym" && (
            <>
              {renderPlanCard("gym")}
              {renderManualToggle("gym", showGymForm, setShowGymForm)}
              {showGymForm && (
                <Card
                  title="Log Workout"
                  style={{ backgroundColor: colors.surface }}
                >
                  <TextInput
                    style={[
                      styles.inp,
                      {
                        backgroundColor: colors.bg,
                        borderColor: colors.border,
                        color: colors.text,
                      },
                    ]}
                    placeholder="Workout name (e.g. Push A)"
                    placeholderTextColor={colors.placeholder}
                    value={gym.name}
                    onChangeText={(v) => setGym({ ...gym, name: v })}
                  />
                  <TextInput
                    style={[
                      styles.inp,
                      styles.textarea,
                      {
                        backgroundColor: colors.bg,
                        borderColor: colors.border,
                        color: colors.text,
                      },
                    ]}
                    placeholder="Exercises"
                    placeholderTextColor={colors.placeholder}
                    multiline
                    value={gym.exercises}
                    onChangeText={(v) => setGym({ ...gym, exercises: v })}
                  />
                  <TextInput
                    style={[
                      styles.inp,
                      {
                        backgroundColor: colors.bg,
                        borderColor: colors.border,
                        color: colors.text,
                      },
                    ]}
                    placeholder="Duration (min)"
                    placeholderTextColor={colors.placeholder}
                    keyboardType="numeric"
                    value={gym.duration}
                    onChangeText={(v) => setGym({ ...gym, duration: v })}
                  />
                  <TouchableOpacity
                    style={[
                      styles.primaryBtn,
                      { backgroundColor: colors.accent },
                      (saving || !gym.name.trim()) && { opacity: 0.5 },
                    ]}
                    onPress={handleSave}
                    disabled={saving || !gym.name.trim()}
                    activeOpacity={0.85}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text
                        style={{
                          color: "#fff",
                          fontWeight: "700",
                          fontSize: 14,
                        }}
                      >
                        Save workout
                      </Text>
                    )}
                  </TouchableOpacity>
                </Card>
              )}
            </>
          )}

          {tab === "food" && (
            <>
              {renderPlanCard("food")}
              {renderManualToggle("food", showFoodForm, setShowFoodForm)}
              {showFoodForm && (
                <Card
                  title="Log Meal"
                  style={{ backgroundColor: colors.surface }}
                >
                  <View style={[styles.row, { gap: 6 }]}>
                    {["Breakfast", "Lunch", "Dinner", "Snack"].map((m) => (
                      <TouchableOpacity
                        key={m}
                        style={[
                          styles.pill,
                          {
                            backgroundColor: colors.bgSecondary,
                            borderColor: colors.border,
                          },
                          food.meal === m && {
                            backgroundColor: colors.successBg,
                            borderColor: colors.success,
                          },
                        ]}
                        onPress={() => setFood({ ...food, meal: m })}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            color:
                              food.meal === m ? colors.success : colors.text,
                          }}
                        >
                          {m}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TextInput
                    style={[
                      styles.inp,
                      {
                        backgroundColor: colors.bg,
                        borderColor: colors.border,
                        color: colors.text,
                      },
                    ]}
                    placeholder="Foods"
                    placeholderTextColor={colors.placeholder}
                    value={food.foods}
                    onChangeText={(v) => setFood({ ...food, foods: v })}
                  />
                  <View style={[styles.row, { gap: 6 }]}>
                    <TextInput
                      style={[
                        styles.inp,
                        {
                          flex: 1,
                          backgroundColor: colors.bg,
                          borderColor: colors.border,
                          color: colors.text,
                        },
                      ]}
                      placeholder="Calories"
                      placeholderTextColor={colors.placeholder}
                      keyboardType="numeric"
                      value={food.calories}
                      onChangeText={(v) => setFood({ ...food, calories: v })}
                    />
                    <TextInput
                      style={[
                        styles.inp,
                        {
                          flex: 1,
                          backgroundColor: colors.bg,
                          borderColor: colors.border,
                          color: colors.text,
                        },
                      ]}
                      placeholder="Protein (g)"
                      placeholderTextColor={colors.placeholder}
                      keyboardType="numeric"
                      value={food.protein}
                      onChangeText={(v) => setFood({ ...food, protein: v })}
                    />
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.primaryBtn,
                      { backgroundColor: colors.accent },
                      (saving || !food.foods.trim()) && { opacity: 0.5 },
                    ]}
                    onPress={handleSave}
                    disabled={saving || !food.foods.trim()}
                    activeOpacity={0.85}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text
                        style={{
                          color: "#fff",
                          fontWeight: "700",
                          fontSize: 14,
                        }}
                      >
                        Save meal
                      </Text>
                    )}
                  </TouchableOpacity>
                </Card>
              )}
            </>
          )}

          <Card title="Recent" style={{ backgroundColor: colors.surface }}>
            {recent.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 16 }}>
                <Icon name={LUCIDE_ICONS.edit} size={20} color={colors.muted} />
                <Text
                  style={{
                    color: colors.muted,
                    fontSize: 13,
                    textAlign: "center",
                    marginTop: 8,
                  }}
                >
                  Nothing logged yet — your entries will show up here.
                </Text>
              </View>
            ) : (
              recent.map((e) => {
                const { icon, tint } = recentIconFor(e);
                return (
                  <View
                    key={e.id}
                    style={[
                      styles.recentRow,
                      { borderBottomColor: colors.divider },
                    ]}
                  >
                    <View
                      style={[
                        styles.recentIcon,
                        { backgroundColor: colors.bgSecondary },
                      ]}
                    >
                      <Icon name={icon} size={13} color={tint} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: colors.text,
                          fontWeight: "600",
                          fontSize: 13.5,
                        }}
                        numberOfLines={1}
                      >
                        {e.title || e.workout_name || e.foods || "Untitled"}
                      </Text>
                    </View>
                    <Text
                      style={{
                        color: colors.textTertiary,
                        fontSize: 11.5,
                        fontWeight: "600",
                      }}
                    >
                      {formatRelativeDate(e.date)}
                    </Text>
                  </View>
                );
              })
            )}
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
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
  title: { ...TYPOGRAPHY.h4, marginLeft: 4 },

  segment: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
    gap: 3,
  },
  segmentItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: 9,
  },
  segmentActiveShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },

  row: { flexDirection: "row" },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },

  inp: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...TYPOGRAPHY.input,
    marginBottom: 8,
  },
  textarea: { minHeight: 80, textAlignVertical: "top" },
  primaryBtn: {
    flexDirection: "row",
    gap: 6,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },

  emptyIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },

  iconGhostBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  progressTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },

  dayDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  todayCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    marginTop: 14,
  },
  checkboxLg: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },

  manualToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "dashed",
  },

  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 9,
    borderBottomWidth: 1,
  },
  recentIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
