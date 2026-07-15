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
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "../store";
import { useTheme } from "../context/ThemeContext";
import { Icon } from "../components/Icons";
import { LUCIDE_ICONS, TYPOGRAPHY } from "../constants/typography";
import * as db from "../db/service";
import { AiPlanCard } from "../components/AiPlanCard";
import { generateAiProgram } from "../services/ai";

type TabType = "note" | "gym" | "food";
type ProgramType = "gym" | "food";

const NOTE_COLORS: [string, string][] = [
  ["", ""],
  ["#f28b82", "#8c1a18"],
  ["#fbbc04", "#7c5a00"],
  ["#fff475", "#7c6a00"],
  ["#ccff90", "#3a7a00"],
  ["#a7ffeb", "#007a5e"],
  ["#cbf0f8", "#005a7a"],
  ["#aecbfa", "#1a3a7a"],
  ["#d7aefb", "#4a1a7a"],
  ["#fdcfe8", "#7a1a4a"],
  ["#e6c9a8", "#5a3a1a"],
  ["#e8eaed", "#3c4043"],
];

const CARD_GAP = 10;
const SCREEN_PAD = 12;
const CARD_WIDTH = (Dimensions.get("window").width - SCREEN_PAD * 2 - CARD_GAP) / 2;

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"];

export default function JournalScreen() {
  const { theme } = useTheme();
  const setSidebarOpen = useStore((s) => s.setSidebarOpen);
  const colors = theme.colors;
  const isDark = theme.name === "dark";

  const [tab, setTab] = useState<TabType>("note");
  const [selectedDayIndex, setSelectedDayIndex] = useState(new Date().getDay());

  // Note state
  const [notes, setNotes] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [noteColor, setNoteColor] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [expandedNoteId, setExpandedNoteId] = useState<number | null>(null);
  const [expandedTitle, setExpandedTitle] = useState("");
  const [expandedContent, setExpandedContent] = useState("");

  // Gym/food state
  const [gymProgram, setGymProgram] = useState<any>(null);
  const [foodProgram, setFoodProgram] = useState<any>(null);
  const [generatingType, setGeneratingType] = useState<ProgramType | null>(null);
  const [gymInstructions, setGymInstructions] = useState("");
  const [foodInstructions, setFoodInstructions] = useState("");
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const loadNotes = useCallback(async () => {
    const entries = await db.getAllJournalEntries();
    setNotes(entries);
  }, []);

  const loadPrograms = useCallback(async () => {
    const gp = await db.getActiveAiProgram("gym");
    setGymProgram(gp ? await db.getAiProgramWithItems(gp.id) : null);
    const fp = await db.getActiveAiProgram("food");
    setFoodProgram(fp ? await db.getAiProgramWithItems(fp.id) : null);
  }, []);

  useEffect(() => {
    loadNotes();
    loadPrograms();
  }, [loadNotes, loadPrograms]);

  const refreshPrograms = async () => {
    await loadPrograms();
  };

  // ── Note handlers ──

  const handleSaveNote = async () => {
    const title = newTitle.trim();
    const content = newContent.trim();
    if (!title && !content) return;
    await db.addJournalEntry({
      date: new Date().toISOString().split("T")[0],
      title,
      content,
      type: "general",
      is_pinned: isPinned ? 1 : 0,
      color: noteColor,
    });
    setNewTitle("");
    setNewContent("");
    setNoteColor("");
    setIsPinned(false);
    setIsComposing(false);
    await loadNotes();
  };

  const handleDeleteNote = async (id: number) => {
    await db.deleteJournalEntryById(id);
    if (expandedNoteId === id) setExpandedNoteId(null);
    await loadNotes();
  };

  const handleTogglePin = async (id: number, current: number) => {
    await db.updateJournalEntry(id, { is_pinned: current ? 0 : 1 });
    await loadNotes();
  };

  const handleSetColor = async (id: number, color: string) => {
    await db.updateJournalEntry(id, { color });
    await loadNotes();
  };

  const handleExpandNote = (note: any) => {
    if (expandedNoteId === note.id) {
      setExpandedNoteId(null);
    } else {
      setExpandedNoteId(note.id);
      setExpandedTitle(note.title || "");
      setExpandedContent(note.content || "");
    }
  };

  const handleSaveExpanded = async (id: number) => {
    await db.updateJournalEntry(id, {
      title: expandedTitle.trim(),
      content: expandedContent.trim(),
    });
    setExpandedNoteId(null);
    await loadNotes();
  };

  // ── Program handlers ──

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

  // ── Filter & sort notes ──

  const filteredNotes = notes.filter((n: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (n.title || "").toLowerCase().includes(q) ||
      (n.content || "").toLowerCase().includes(q)
    );
  });

  const pinnedNotes = filteredNotes.filter((n: any) => n.is_pinned);
  const unpinnedNotes = filteredNotes.filter((n: any) => !n.is_pinned);
  const sortedNotes = [...pinnedNotes, ...unpinnedNotes];

  const getNoteBg = (color: string) => {
    if (!color) return colors.surface;
    return isDark ? color + "40" : color;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  // ── Note Card component ──

  function NoteCard({ note }: { note: any }) {
    const isExpanded = expandedNoteId === note.id;
    const bg = getNoteBg(note.color || "");
    const textColor = note.color && !isDark ? "#202124" : colors.text;
    const metaColor = note.color && !isDark ? "rgba(0,0,0,0.5)" : colors.textTertiary;

    return (
      <View
        style={[
          styles.noteCard,
          {
            width: CARD_WIDTH,
            backgroundColor: bg,
            borderColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleExpandNote(note)}
          style={styles.noteCardTouch}
        >
          {note.title ? (
            <Text
              style={[styles.noteTitle, { color: textColor }]}
              numberOfLines={isExpanded ? undefined : 2}
            >
              {note.title}
            </Text>
          ) : null}
          {note.content ? (
            <Text
              style={[styles.noteContent, { color: textColor }]}
              numberOfLines={isExpanded ? undefined : 4}
            >
              {note.content}
            </Text>
          ) : null}
          <Text style={[styles.noteDate, { color: metaColor }]}>
            {formatDate(note.created_at || note.date)}
          </Text>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.expandedArea}>
            <TextInput
              style={[styles.expandedInput, { color: textColor, borderBottomColor: metaColor + "40" }]}
              value={expandedTitle}
              onChangeText={setExpandedTitle}
              placeholder="Title"
              placeholderTextColor={metaColor}
            />
            <TextInput
              style={[styles.expandedInput, styles.expandedContentInput, { color: textColor, borderBottomColor: metaColor + "40" }]}
              value={expandedContent}
              onChangeText={setExpandedContent}
              placeholder="Note"
              placeholderTextColor={metaColor}
              multiline
            />
            <View style={styles.expandedActions}>
              <TouchableOpacity
                onPress={() => handleSaveExpanded(note.id)}
                style={[styles.expandedActionBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)" }]}
              >
                <Icon name={LUCIDE_ICONS.check} size={16} color={textColor} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleTogglePin(note.id, note.is_pinned)}
                style={[styles.expandedActionBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)" }]}
              >
                <Icon
                  name={LUCIDE_ICONS.pin}
                  size={16}
                  color={note.is_pinned ? colors.accent : metaColor}
                />
              </TouchableOpacity>
              <ColorPicker onSelect={(c) => handleSetColor(note.id, c)} current={note.color || ""} />
              <TouchableOpacity
                onPress={() => handleDeleteNote(note.id)}
                style={[styles.expandedActionBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)" }]}
              >
                <Icon name={LUCIDE_ICONS.trash2} size={16} color={metaColor} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {!isExpanded && (
          <View style={styles.noteActions}>
            <TouchableOpacity
              onPress={() => handleTogglePin(note.id, note.is_pinned)}
              style={styles.noteActionBtn}
            >
              <Icon
                name={LUCIDE_ICONS.pin}
                size={14}
                color={note.is_pinned ? colors.accent : "transparent"}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  // ── Color Picker ──

  function ColorPicker({ onSelect, current }: { onSelect: (c: string) => void; current: string }) {
    return (
      <View style={styles.colorPickerRow}>
        {NOTE_COLORS.map(([light]) => (
          <TouchableOpacity
            key={light}
            onPress={() => onSelect(light)}
            style={[
              styles.colorDot,
              {
                backgroundColor: light || (isDark ? "#333" : "#fff"),
                borderColor: current === light ? colors.accent : "transparent",
                borderWidth: current === light ? 2 : 1,
                borderStyle: current === light ? "solid" : "solid",
              },
            ]}
          />
        ))}
      </View>
    );
  }

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
            <View style={{ paddingHorizontal: SCREEN_PAD }}>
              {/* Search bar */}
              <View style={[styles.searchBar, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
                <Icon name={LUCIDE_ICONS.search} size={16} color={colors.textTertiary} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search notes..."
                  placeholderTextColor={colors.placeholder}
                />
                {searchQuery ? (
                  <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <Icon name={LUCIDE_ICONS.close} size={16} color={colors.textTertiary} />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Note composer */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => !isComposing && setIsComposing(true)}
                style={[styles.composer, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}
              >
                {!isComposing ? (
                  <Text style={{ color: colors.placeholder, fontSize: 14 }}>
                    Take a note...
                  </Text>
                ) : (
                  <View>
                    <TextInput
                      style={[styles.composerInput, { color: colors.text, borderBottomColor: colors.border }]}
                      value={newTitle}
                      onChangeText={setNewTitle}
                      placeholder="Title"
                      placeholderTextColor={colors.placeholder}
                      autoFocus
                    />
                    <TextInput
                      style={[styles.composerInput, styles.composerContentInput, { color: colors.text }]}
                      value={newContent}
                      onChangeText={setNewContent}
                      placeholder="Take a note..."
                      placeholderTextColor={colors.placeholder}
                      multiline
                    />
                    <View style={styles.composerActions}>
                      <ColorPicker onSelect={setNoteColor} current={noteColor} />
                      <View style={styles.composerRight}>
                        <TouchableOpacity
                          onPress={() => setIsPinned(!isPinned)}
                          style={[styles.composerToolBtn, isPinned && { backgroundColor: colors.accentBg }]}
                        >
                          <Icon name={LUCIDE_ICONS.pin} size={16} color={isPinned ? colors.accent : colors.textTertiary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={handleSaveNote}
                          style={[styles.composerSaveBtn, { backgroundColor: colors.accent }]}
                        >
                          <Text style={{ color: "#fff", fontWeight: "600", fontSize: 13 }}>Done</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}
              </TouchableOpacity>

              {/* Notes grid */}
              {sortedNotes.length === 0 ? (
                <View style={styles.emptyState}>
                  <Icon name={LUCIDE_ICONS.edit} size={40} color={colors.textTertiary} />
                  <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                    {searchQuery ? "No matching notes" : "Notes you write appear here"}
                  </Text>
                </View>
              ) : (
                <View style={styles.notesGrid}>
                  {sortedNotes.map((note: any) => (
                    <NoteCard key={note.id} note={note} />
                  ))}
                </View>
              )}
            </View>
          )}

          {(tab === "gym" || tab === "food") && (
            <>
              <View style={{ paddingHorizontal: 12 }}>
                <View style={[styles.programCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <TextInput
                    style={[
                      styles.programInput,
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
                </View>
              </View>

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
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 12,
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
  primaryBtn: {
    flexDirection: "row",
    gap: 6,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },

  // ── Search bar ──
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },

  // ── Note composer ──
  composer: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    minHeight: 44,
  },
  composerInput: {
    fontSize: 14,
    paddingVertical: 8,
  },
  composerContentInput: {
    minHeight: 60,
    textAlignVertical: "top",
  },
  composerActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    flexWrap: "wrap",
    gap: 8,
  },
  composerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  composerToolBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  composerSaveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
  },

  // ── Notes grid ──
  notesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: CARD_GAP,
  },
  noteCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 0,
  },
  noteCardTouch: {
    padding: 12,
  },
  noteTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
    lineHeight: 20,
  },
  noteContent: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  noteDate: {
    fontSize: 11,
    lineHeight: 15,
  },
  noteActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 6,
    paddingBottom: 6,
  },
  noteActionBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Expanded note ──
  expandedArea: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 4,
  },
  expandedInput: {
    fontSize: 14,
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  expandedContentInput: {
    minHeight: 60,
    textAlignVertical: "top",
  },
  expandedActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
    flexWrap: "wrap",
  },
  expandedActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Color picker ──
  colorPickerRow: {
    flexDirection: "row",
    gap: 4,
    flexWrap: "wrap",
  },
  colorDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },

  // ── Empty state ──
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },

  // ── Program card (replaces old Card wrapper) ──
  programCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  programInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...TYPOGRAPHY.input,
    marginBottom: 8,
  },
});
