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
import { AiPlanCard } from "../components/AiPlanCard";
import { generateAiProgram } from "../services/ai";

type TabType = "note" | "gym" | "food";
type ProgramType = "gym" | "food";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"];

function formatRelativeDate(dateStr: string): string {
  if (!dateStr) return "";
  return dateStr;
}

export default function JournalScreen() {
  const { theme } = useTheme();
  const setSidebarOpen = useStore((s) => s.setSidebarOpen);
  const colors = theme.colors;

  const [tab, setTab] = useState<TabType>("note");
  const [selectedDayIndex, setSelectedDayIndex] = useState(new Date().getDay());

  // Forms (unchanged)
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
  const [showGymForm, setShowGymForm] = useState(false);
  const [showFoodForm, setShowFoodForm] = useState(false);

  const [gymProgram, setGymProgram] = useState<any>(null);
  const [foodProgram, setFoodProgram] = useState<any>(null);
  const [generatingType, setGeneratingType] = useState<ProgramType | null>(
    null,
  );
  const [gymInstructions, setGymInstructions] = useState("");
  const [foodInstructions, setFoodInstructions] = useState("");

  // Editing state
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");

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

  const refreshPrograms = async () => {
    await loadPrograms();
  };

  const handleGenerateProgram = async (type: ProgramType) => {
    setGeneratingType(type);
    try {
      const prefs = type === "gym" ? gymInstructions : foodInstructions;
      await generateAiProgram(type, prefs.trim() || undefined);
      await refreshPrograms();
    } catch (e: any) {
      Alert.alert("Generation Failed", e.message);
    } finally {
      setGeneratingType(null);
    }
  };

  const handleToggleItem = async (itemId: number, current: number) => {
    await db.toggleAiProgramItem(itemId, current ? 0 : 1);
    await refreshPrograms();
  };

  const startEditing = (item: any) => {
    setEditingItemId(item.id);
    setEditTitle(item.title || "");
    setEditDesc(item.description || "");
  };

  const saveEditing = async () => {
    if (editingItemId === null) return;
    await db.updateAiProgramItem(editingItemId, {
      title: editTitle.trim(),
      description: editDesc.trim(),
    });
    setEditingItemId(null);
    await refreshPrograms();
  };

  const cancelEditing = () => {
    setEditingItemId(null);
  };

  const currentProgram = tab === "gym" ? gymProgram : foodProgram;
  const selectedDayItems =
    currentProgram?.items?.filter(
      (i: any) => i.day_index === selectedDayIndex,
    ) || [];

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
          contentContainerStyle={{ paddingBottom: 80 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Tab Switcher */}
          <View
            style={[
              styles.segment,
              {
                backgroundColor: colors.bgSecondary,
                borderColor: colors.border,
                margin: 12,
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
                onPress={() => {
                  setTab(t.key);
                  setSelectedDayIndex(new Date().getDay());
                }}
              >
                <Icon
                  name={t.icon}
                  size={14}
                  color={tab === t.key ? colors.accent : colors.textTertiary}
                />
                <Text
                  style={{
                    color: tab === t.key ? colors.accent : colors.textTertiary,
                    fontWeight: "600",
                    fontSize: 13,
                  }}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Main Content */}
          {tab === "note" && (
            /* Note form unchanged - keep your existing note card */
            <Card
              title="New Entry"
              style={{ backgroundColor: colors.surface, margin: 12 }}
            >
              {/* ... your note inputs ... */}
            </Card>
          )}

          {(tab === "gym" || tab === "food") && (
            <>
              {/* Generate / Regenerate + Custom Instructions */}
              <Card style={{ backgroundColor: colors.surface, margin: 12 }}>
                <TextInput
                  style={[
                    styles.inp,
                    {
                      color: colors.text,
                      borderColor: colors.border,
                      backgroundColor: colors.bg,
                      marginBottom: 10,
                    },
                  ]}
                  value={tab === "gym" ? gymInstructions : foodInstructions}
                  onChangeText={
                    tab === "gym" ? setGymInstructions : setFoodInstructions
                  }
                  placeholder={`Add custom instructions for ${tab === "gym" ? "workout" : "meal"} plan...`}
                  placeholderTextColor={colors.placeholder}
                  multiline
                  numberOfLines={2}
                  textAlignVertical="top"
                />
                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    { backgroundColor: colors.accent },
                  ]}
                  onPress={() => handleGenerateProgram(tab as ProgramType)}
                  disabled={generatingType !== null}
                >
                  {generatingType === tab ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={{ color: "#fff", fontWeight: "700" }}>
                      {currentProgram
                        ? `Regenerate ${tab === "gym" ? "Workout" : "Meal"} Plan`
                        : `Generate ${tab === "gym" ? "Workout" : "Meal"} Plan`}
                    </Text>
                  )}
                </TouchableOpacity>
              </Card>

              {/* Selected Day Tasks */}
              {currentProgram && (
                <View style={{ paddingHorizontal: 12 }}>
                  <AiPlanCard
                    program={currentProgram}
                    onRefresh={refreshPrograms}
                  />
                </View>
              )}
            </>
          )}

          {/* Recent Section (unchanged) */}
          <Card
            title="Recent"
            style={{ backgroundColor: colors.surface, margin: 12 }}
          >
            {/* ... your existing recent list ... */}
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Existing styles (unchanged - abbreviated for brevity)
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
  row: { flexDirection: "row", alignItems: "center" },
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
  textarea: { minHeight: 100, textAlignVertical: "top" },
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

  // New styles for improved AI plan view
  planDayCard: {
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 10,
    overflow: "hidden",
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  dayDotSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  smallBtn: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    borderRadius: 16,
    padding: 20,
  },
  dayTab: {
    width: 68,
    alignItems: "center",
    paddingVertical: 10,
    marginRight: 8,
    borderRadius: 10,
    borderWidth: 1,
  },

  taskBlock: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  taskCheckbox: {
    marginRight: 12,
    marginTop: 2,
  },
  checkboxInner: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#999",
    alignItems: "center",
    justifyContent: "center",
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
  },
  taskTitleInput: {
    fontSize: 16,
    fontWeight: "600",
    paddingVertical: 2,
  },
  taskDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  // primaryBtn: {
  //   padding: 14,
  //   borderRadius: 10,
  //   alignItems: "center",
  //   justifyContent: "center",
  // },
});
