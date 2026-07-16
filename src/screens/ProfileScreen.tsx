import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useStore } from "../store";
import { useTheme } from "../context/ThemeContext";
import { Icon } from "../components/Icons";
import { Avatar } from "../components/Avatar";
import { LUCIDE_ICONS } from "../constants/typography";
import type { UserProfileRow } from "../db/db-types";
import * as db from "../db/service";

// ─── Profile Groups ───

interface ProfileField {
  key: keyof UserProfileRow;
  label: string;
  icon: string;
  type: "text" | "number" | "select" | "multiSelect";
  options?: { label: string; value: string }[];
  placeholder?: string;
}

interface ProfileGroup {
  key: string;
  label: string;
  icon: string;
  color: string;
  fields: ProfileField[];
}

const GROUPS: ProfileGroup[] = [
  {
    key: "personal",
    label: "Personal Info",
    icon: "user",
    color: "#6366f1",
    fields: [
      { key: "name", label: "Name", icon: "user", type: "text" },
      {
        key: "gender",
        label: "Gender",
        icon: "user",
        type: "select",
        options: [
          { label: "Male", value: "male" },
          { label: "Female", value: "female" },
          { label: "Other", value: "other" },
        ],
      },
      {
        key: "date_of_birth",
        label: "Date of Birth",
        icon: "calendar",
        type: "text",
        placeholder: "YYYY-MM-DD",
      },
      {
        key: "phone",
        label: "Phone",
        icon: "smartphone",
        type: "text",
        placeholder: "+1 555 123 4567",
      },
      {
        key: "occupation",
        label: "Occupation",
        icon: "briefcase",
        type: "text",
        placeholder: "Software Engineer",
      },
      {
        key: "country",
        label: "Country",
        icon: "globe",
        type: "text",
        placeholder: "United States",
      },
      {
        key: "city",
        label: "City",
        icon: "building",
        type: "text",
        placeholder: "New York",
      },
    ],
  },
  {
    key: "body",
    label: "Body & Fitness",
    icon: "personStanding",
    color: "#e03e3e",
    fields: [
      {
        key: "height_cm",
        label: "Height (cm)",
        icon: "ruler",
        type: "number",
        placeholder: "175",
      },
      {
        key: "weight_kg",
        label: "Weight (kg)",
        icon: "weight",
        type: "number",
        placeholder: "78.5",
      },
      {
        key: "target_weight_kg",
        label: "Target Weight (kg)",
        icon: "target",
        type: "number",
        placeholder: "75",
      },
      {
        key: "body_fat_percentage",
        label: "Body Fat %",
        icon: "percent",
        type: "number",
        placeholder: "15",
      },
      {
        key: "waist_cm",
        label: "Waist (cm)",
        icon: "ruler",
        type: "number",
        placeholder: "85",
      },
      {
        key: "body_goal_type",
        label: "Body Goal",
        icon: "target",
        type: "select",
        options: [
          { label: "Lose Weight", value: "lose_weight" },
          { label: "Gain Muscle", value: "gain_muscle" },
          { label: "Maintain", value: "maintain" },
          { label: "Improve Fitness", value: "improve_fitness" },
          { label: "Build Strength", value: "build_strength" },
        ],
      },
      {
        key: "target_date",
        label: "Goal Target Date",
        icon: "calendar",
        type: "text",
        placeholder: "2026-12-31",
      },
    ],
  },
  {
    key: "lifestyle",
    label: "Lifestyle",
    icon: "heart",
    color: "#0ea5e9",
    fields: [
      {
        key: "activity_level",
        label: "Activity Level",
        icon: "activity",
        type: "select",
        options: [
          { label: "Sedentary", value: "sedentary" },
          { label: "Light", value: "light" },
          { label: "Moderate", value: "moderate" },
          { label: "Active", value: "active" },
          { label: "Very Active", value: "very_active" },
        ],
      },
      {
        key: "bedtime",
        label: "Bedtime",
        icon: "moon",
        type: "text",
        placeholder: "22:00",
      },
      {
        key: "wake_time",
        label: "Wake Up",
        icon: "sunrise",
        type: "text",
        placeholder: "06:00",
      },
      {
        key: "smoking_status",
        label: "Smoking",
        icon: "ban",
        type: "select",
        options: [
          { label: "Non-Smoker", value: "non_smoker" },
          { label: "Smoker", value: "smoker" },
          { label: "Trying to Quit", value: "trying_to_quit" },
          { label: "Quit", value: "quit" },
        ],
      },
      {
        key: "caffeine_intake",
        label: "Caffeine (cups/day)",
        icon: "coffee",
        type: "number",
        placeholder: "2",
      },
      {
        key: "dietary_preference",
        label: "Diet",
        icon: "apple",
        type: "select",
        options: [
          { label: "No Restriction", value: "no_restriction" },
          { label: "Vegetarian", value: "vegetarian" },
          { label: "Vegan", value: "vegan" },
          { label: "Keto", value: "keto" },
          { label: "Paleo", value: "paleo" },
          { label: "Mediterranean", value: "mediterranean" },
          { label: "Other", value: "other" },
        ],
      },
    ],
  },
  {
    key: "goals",
    label: "Goals & Preferences",
    icon: "star",
    color: "#f59e0b",
    fields: [
      {
        key: "goals",
        label: "Goals",
        icon: "target",
        type: "multiSelect",
        options: [
          { label: "Fitness", value: "fitness" },
          { label: "Productivity", value: "productivity" },
          { label: "Mindfulness", value: "mindfulness" },
          { label: "Learning", value: "learning" },
          { label: "Finance", value: "finance" },
          { label: "Social", value: "social" },
        ],
      },
      {
        key: "preferences",
        label: "Preferences",
        icon: "settings",
        type: "multiSelect",
        options: [
          { label: "Daily Reminders", value: "daily_reminders" },
          { label: "Weekly Reports", value: "weekly_reports" },
          { label: "Morning Motivation", value: "morning_motivation" },
          { label: "Evening Reflection", value: "evening_reflection" },
        ],
      },
    ],
  },
];

// ─── Helpers ───

function formatValue(profile: UserProfileRow | null, field: ProfileField): string {
  if (!profile) return "\u2014";
  const val = profile[field.key];
  if (val === null || val === undefined || val === "" || val === 0 || val === "0") return "\u2014";
  if (field.key === "gender" && typeof val === "string") {
    return val.charAt(0).toUpperCase() + val.slice(1);
  }
  if (field.key === "activity_level" && typeof val === "string") {
    return val.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
  if (field.key === "body_goal_type" && typeof val === "string") {
    return val.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
  if (field.key === "smoking_status" && typeof val === "string") {
    return val.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
  if (field.key === "dietary_preference" && typeof val === "string") {
    return val.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
  if (field.key === "goals" && typeof val === "string") {
    try {
      const arr = JSON.parse(val);
      return Array.isArray(arr) && arr.length > 0
        ? arr.map((g: string) => g.charAt(0).toUpperCase() + g.slice(1)).join(", ")
        : "\u2014";
    } catch { return "\u2014"; }
  }
  if (field.key === "preferences" && typeof val === "string") {
    try {
      const arr = JSON.parse(val);
      return Array.isArray(arr) && arr.length > 0
        ? arr.map((p: string) => p.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())).join(", ")
        : "\u2014";
    } catch { return "\u2014"; }
  }
  if (field.type === "number") {
    const n = Number(val);
    return isNaN(n) ? "\u2014" : String(n);
  }
  return String(val);
}

function getAge(dob: string): number | null {
  if (!dob) return null;
  const m = dob.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const birth = new Date(+m[1], +m[2] - 1, +m[3]);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// ─── Data Browser Sections (from old ProfileScreen) ───

interface DataSection {
  key: string;
  label: string;
  icon: string;
  color: string;
  fetch: () => Promise<any[]>;
  deleteFn: (id: number) => Promise<void>;
  renderItem: (item: any) => string;
  renderDetail: (item: any) => string[];
}

const DATA_SECTIONS: DataSection[] = [
  { key: "daily", label: "Daily Logs", icon: "fileText", color: "#0b6bcf", fetch: db.getAllDailyLogs, deleteFn: db.deleteDailyLogById,
    renderItem: (i) => i.date, renderDetail: (i) => [i.weight ? `Weight: ${i.weight} kg` : "", i.water_ml ? `Water: ${i.water_ml}ml` : "", i.steps ? `Steps: ${i.steps}` : "", i.mood ? `Mood: ${i.mood}/5` : "", i.sleep_hours ? `Sleep: ${i.sleep_hours}h` : ""].filter(Boolean) },
  { key: "prayers", label: "Prayer Logs", icon: "landmark", color: "#8b5cf6", fetch: db.getAllPrayers, deleteFn: db.deletePrayerById,
    renderItem: (i) => `${i.date} \u00B7 ${i.prayer_name}`, renderDetail: (i) => [i.on_time ? "On time" : i.qada ? "Qada" : "Missed"] },
  { key: "gym", label: "Gym Logs", icon: "personStanding", color: "#e03e3e", fetch: db.getAllGymLogs, deleteFn: db.deleteGymLogById,
    renderItem: (i) => `${i.date} \u00B7 ${i.workout_name}`, renderDetail: (i) => [i.duration_minutes ? `${i.duration_minutes} min` : "", i.exercises || ""].filter(Boolean) },
  { key: "nutrition", label: "Nutrition Logs", icon: "coffee", color: "#0a8c2e", fetch: db.getAllNutritionLogs, deleteFn: db.deleteNutritionLogById,
    renderItem: (i) => `${i.date} \u00B7 ${i.meal_type}`, renderDetail: (i) => [i.calories ? `${i.calories} kcal` : "", i.protein_g ? `${i.protein_g}g protein` : ""].filter(Boolean) },
  { key: "transactions", label: "Transactions", icon: "dollarSign", color: "#d9730d", fetch: db.getAllTransactions, deleteFn: db.deleteTransactionById,
    renderItem: (i) => `${i.date} \u00B7 ${i.category}`, renderDetail: (i) => [`${i.type === "income" ? "+" : "-"}$${Math.abs(i.amount).toFixed(2)}`, i.description || ""].filter(Boolean) },
  { key: "habits", label: "Habits", icon: "checkCircle", color: "#0891b2", fetch: db.getHabits, deleteFn: db.deleteHabitById,
    renderItem: (i) => i.name, renderDetail: (i) => [i.emoji || "", i.target_per_day ? `${i.target_per_day}${i.unit ? " " + i.unit : ""}/day` : ""].filter(Boolean) },
  { key: "journal", label: "Journal Entries", icon: "bookOpen", color: "#d9730d", fetch: db.getAllJournalEntries, deleteFn: db.deleteJournalEntryById,
    renderItem: (i) => `${i.date} \u00B7 ${i.title || "Untitled"}`, renderDetail: (i) => [i.type || "general", i.content ? i.content.substring(0, 60) + (i.content.length > 60 ? "..." : "") : ""].filter(Boolean) },
];

// ─── Edit Modal ───

function EditFieldModal({
  visible,
  field,
  currentValue,
  onSave,
  onClose,
}: {
  visible: boolean;
  field: ProfileField | null;
  currentValue: string;
  onSave: (value: string) => void;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const tc = theme.colors;
  const [input, setInput] = useState(currentValue);
  const [selected, setSelected] = useState<string[]>(
    field?.type === "multiSelect" ? (() => {
      try { return JSON.parse(currentValue || "[]"); } catch { return []; }
    })() : [currentValue],
  );

  React.useEffect(() => {
    setInput(currentValue);
    if (field?.type === "multiSelect") {
      try { setSelected(JSON.parse(currentValue || "[]")); } catch { setSelected([]); }
    } else {
      setSelected([currentValue]);
    }
  }, [currentValue, field]);

  if (!field) return null;

  const handleSave = () => {
    if (field.type === "multiSelect") {
      onSave(JSON.stringify(selected));
    } else {
      onSave(input);
    }
  };

  const toggleOption = (value: string) => {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: tc.overlay }}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[emodal.modal, { backgroundColor: tc.surface }]}>
          <View style={[emodal.handle, { backgroundColor: tc.muted }]} />
          <View style={emodal.header}>
            <View style={[emodal.headerIcon, { backgroundColor: field.type === "select" || field.type === "multiSelect" ? tc.accentBg : tc.bgSecondary }]}>
              <Icon name={LUCIDE_ICONS[field.icon]} size={18} color={tc.accent} />
            </View>
            <Text style={[emodal.title, { color: tc.heading }]}>
              Edit {field.label}
            </Text>
          </View>

          {field.type === "select" || field.type === "multiSelect" ? (
            <View style={emodal.optionsWrap}>
              {(field.options || []).map((opt) => {
                const isSelected = field.type === "multiSelect"
                  ? selected.includes(opt.value)
                  : input === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      emodal.option,
                      { backgroundColor: tc.bgSecondary, borderColor: tc.borderLight },
                      isSelected && { backgroundColor: tc.accentBg, borderColor: tc.accent },
                    ]}
                    onPress={() => {
                      if (field.type === "multiSelect") {
                        toggleOption(opt.value);
                      } else {
                        setInput(opt.value);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        emodal.optionText,
                        { color: tc.text },
                        isSelected && { color: tc.accent, fontWeight: "600" },
                      ]}
                    >
                      {opt.label}
                    </Text>
                    {isSelected && (
                      <Icon name={LUCIDE_ICONS.check} size={16} color={tc.accent} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <TextInput
              style={[
                emodal.input,
                {
                  backgroundColor: tc.bgSecondary,
                  borderColor: tc.borderLight,
                  color: tc.text,
                },
              ]}
              value={input}
              onChangeText={setInput}
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              placeholderTextColor={tc.placeholder}
              keyboardType={field.type === "number" ? "decimal-pad" : "default"}
              autoFocus
            />
          )}

          <View style={emodal.actions}>
            <TouchableOpacity
              style={[emodal.cancelBtn, { backgroundColor: tc.bgSecondary }]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={[emodal.cancelText, { color: tc.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[emodal.saveBtn, { backgroundColor: tc.accent }]}
              onPress={handleSave}
              activeOpacity={0.85}
            >
              <Text style={emodal.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main Screen ───

export default function ProfileScreen() {
  const { theme } = useTheme();
  const tc = theme.colors;
  const userProfile = useStore((s) => s.userProfile);
  const updateProfile = useStore((s) => s.updateProfile);
  const setSidebarOpen = useStore((s) => s.setSidebarOpen);
  const refresh = useStore((s) => s.refresh);

  const [editingField, setEditingField] = useState<ProfileField | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);

  // Data browser state
  const [expandedData, setExpandedData] = useState<string | null>(null);
  const [dataItems, setDataItems] = useState<Record<string, any[]>>({});
  const [dataLoading, setDataLoading] = useState<Record<string, boolean>>({});

  const handleFieldPress = useCallback((field: ProfileField) => {
    const val = userProfile ? String(userProfile[field.key] ?? "") : "";
    setEditValue(val);
    setEditingField(field);
  }, [userProfile]);

  const handleFieldSave = useCallback(async (value: string) => {
    if (!editingField || !userProfile) return;
    setSaving(editingField.key);
    setEditingField(null);
    try {
      let parsedValue: any = value.trim();
      if (editingField.type === "number") {
        parsedValue = value.trim() ? parseFloat(value) : 0;
      }
      await updateProfile({ [editingField.key]: parsedValue } as any);
    } catch (e) {
      Alert.alert("Error", "Failed to save field");
    } finally {
      setSaving(null);
    }
  }, [editingField, userProfile, updateProfile]);

  // Data browser handlers
  const toggleDataSection = useCallback(async (key: string) => {
    if (expandedData === key) { setExpandedData(null); return; }
    setExpandedData(key);
    if (!dataItems[key]) {
      setDataLoading((p) => ({ ...p, [key]: true }));
      const section = DATA_SECTIONS.find((s) => s.key === key);
      if (section) {
        const items = await section.fetch();
        setDataItems((p) => ({ ...p, [key]: items }));
      }
      setDataLoading((p) => ({ ...p, [key]: false }));
    }
  }, [expandedData, dataItems]);

  const removeDataItem = useCallback(async (sectionKey: string, id: number) => {
    const section = DATA_SECTIONS.find((s) => s.key === sectionKey);
    if (!section) return;
    await section.deleteFn(id);
    setDataItems((p) => ({ ...p, [sectionKey]: (p[sectionKey] || []).filter((item: any) => item.id !== id) }));
  }, []);

  const handleChangePhoto = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow access to your photo library to change your avatar.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    setPhotoLoading(true);
    try {
      await updateProfile({ avatar_uri: result.assets[0].uri });
    } catch (e) {
      Alert.alert("Error", "Failed to update photo");
    } finally {
      setPhotoLoading(false);
    }
  }, [updateProfile]);

  const handleRemovePhoto = useCallback(async () => {
    setPhotoLoading(true);
    try {
      await updateProfile({ avatar_uri: "" });
    } catch (e) {
      Alert.alert("Error", "Failed to remove photo");
    } finally {
      setPhotoLoading(false);
    }
  }, [updateProfile]);

  const age = userProfile ? getAge(userProfile.date_of_birth) : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tc.bg }} edges={["top"]}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: tc.surface, borderBottomColor: tc.divider }]}>
        <TouchableOpacity onPress={() => setSidebarOpen(true)} style={s.headerBtn}>
          <Icon name={LUCIDE_ICONS.menu} size={20} color={tc.heading} label="menu" />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: tc.heading }]}>Profile</Text>
        <TouchableOpacity onPress={refresh} style={s.headerBtn}>
          <Icon name={LUCIDE_ICONS.refreshCw} size={16} color={tc.heading} label="refresh" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Avatar Card */}
        <View style={[s.avatarCard, { backgroundColor: tc.surface }]}>
          <TouchableOpacity
            onPress={handleChangePhoto}
            disabled={photoLoading}
            activeOpacity={0.8}
          >
            <View style={{ position: "relative" }}>
              <Avatar
                uri={userProfile?.avatar_uri}
                name={userProfile?.name}
                gender={userProfile?.gender}
                size={72}
                iconSize={28}
                textSize={22}
              />
              {photoLoading ? (
                <View style={[s.photoOverlay, { backgroundColor: tc.overlay }]}>
                  <ActivityIndicator size="small" color="#fff" />
                </View>
              ) : (
                <View style={[s.cameraBadge, { backgroundColor: tc.accent }]}>
                  <Icon name={LUCIDE_ICONS.camera} size={12} color="#fff" label="change photo" />
                </View>
              )}
            </View>
          </TouchableOpacity>
          <Text style={[s.avatarName, { color: tc.heading }]}>
            {userProfile?.name || "Your Name"}
          </Text>
          <Text style={[s.avatarMeta, { color: tc.textSecondary }]}>
            {[
              age ? `${age} yrs` : null,
              userProfile?.gender ? userProfile.gender.charAt(0).toUpperCase() + userProfile.gender.slice(1) : null,
              userProfile?.country || null,
            ].filter(Boolean).join(" \u00B7 ") || "Complete your profile"}
          </Text>
          {userProfile?.avatar_uri ? (
            <TouchableOpacity
              onPress={handleRemovePhoto}
              style={[s.removePhotoBtn, { backgroundColor: tc.errorBg }]}
              activeOpacity={0.7}
            >
              <Text style={[s.removePhotoText, { color: tc.error }]}>Remove Photo</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Profile Groups */}
        {GROUPS.map((group) => (
          <View key={group.key} style={[s.groupCard, { backgroundColor: tc.surface, borderColor: tc.border }]}>
            <View style={s.groupHeader}>
              <View style={[s.groupIcon, { backgroundColor: group.color + "18" }]}>
                <Icon name={LUCIDE_ICONS[group.icon]} size={16} color={group.color} label={group.label} />
              </View>
              <Text style={[s.groupLabel, { color: tc.heading }]}>{group.label}</Text>
            </View>
            <View style={s.groupBody}>
              {group.fields.map((field) => {
                const isSaving = saving === field.key;
                return (
                  <TouchableOpacity
                    key={field.key}
                    style={[s.fieldRow, { borderBottomColor: tc.divider }]}
                    onPress={() => handleFieldPress(field)}
                    activeOpacity={0.6}
                    disabled={isSaving}
                  >
                    <View style={s.fieldLeft}>
                      <Icon name={LUCIDE_ICONS[field.icon]} size={14} color={tc.textTertiary} label={field.label} />
                      <Text style={[s.fieldLabel, { color: tc.textTertiary }]}>
                        {field.label}
                      </Text>
                    </View>
                    <View style={s.fieldRight}>
                      {isSaving ? (
                        <ActivityIndicator size="small" color={tc.accent} />
                      ) : (
                        <>
                          <Text
                            style={[
                              s.fieldValue,
                              { color: tc.text },
                              !userProfile?.[field.key] ||
                                (typeof userProfile[field.key] === "string" && !userProfile[field.key]) ||
                                userProfile[field.key] === 0 ||
                                userProfile[field.key] === "0"
                                ? { color: tc.placeholder }
                                : {},
                            ]}
                            numberOfLines={1}
                          >
                            {formatValue(userProfile, field)}
                          </Text>
                          <Icon name={LUCIDE_ICONS.chevronRight} size={14} color={tc.border} />
                        </>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {/* My Data Section */}
        <Text style={[s.dataSectionTitle, { color: tc.textTertiary }]}>MY DATA</Text>

        <View style={[s.groupCard, { backgroundColor: tc.surface, borderColor: tc.border, marginBottom: 32 }]}>
          {DATA_SECTIONS.map((section) => {
            const count = dataItems[section.key]?.length;
            return (
              <View key={section.key}>
                <TouchableOpacity
                  style={[s.dataHeader, { borderBottomColor: tc.divider }]}
                  onPress={() => toggleDataSection(section.key)}
                  activeOpacity={0.7}
                >
                  <View style={[s.dataIcon, { backgroundColor: section.color + "18" }]}>
                    <Icon name={LUCIDE_ICONS[section.icon]} size={14} color={section.color} label={section.label} />
                  </View>
                  <Text style={[s.dataLabel, { color: tc.text }]}>{section.label}</Text>
                  {count !== undefined && (
                    <View style={[s.dataBadge, { backgroundColor: section.color }]}>
                      <Text style={s.dataBadgeText}>{count}</Text>
                    </View>
                  )}
                  <Icon
                    name={expandedData === section.key ? LUCIDE_ICONS.chevronDown : LUCIDE_ICONS.chevronRight}
                    size={14}
                    color={tc.border}
                  />
                </TouchableOpacity>
                {expandedData === section.key && (
                  <View style={[s.dataBody, { borderBottomColor: tc.divider }]}>
                    {dataLoading[section.key] ? (
                      <ActivityIndicator size="small" color={tc.muted} style={{ margin: 16 }} />
                    ) : !dataItems[section.key] || dataItems[section.key].length === 0 ? (
                      <Text style={[s.dataEmpty, { color: tc.muted }]}>No entries</Text>
                    ) : (
                      dataItems[section.key].map((item: any) => (
                        <View key={item.id} style={[s.dataItem, { borderBottomColor: tc.divider }]}>
                          <View style={s.dataItemInfo}>
                            <Text style={[s.dataItemTitle, { color: tc.text }]} numberOfLines={1}>
                              {section.renderItem(item)}
                            </Text>
                            {section.renderDetail(item).map((line, i) => (
                              <Text key={i} style={[s.dataItemDetail, { color: tc.textTertiary }]} numberOfLines={2}>
                                {line}
                              </Text>
                            ))}
                          </View>
                          <TouchableOpacity
                            style={[s.dataDeleteBtn, { backgroundColor: tc.errorBg }]}
                            onPress={() => removeDataItem(section.key, item.id)}
                          >
                            <Icon name={LUCIDE_ICONS.x} size={12} color={tc.error} label="delete" />
                          </TouchableOpacity>
                        </View>
                      ))
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <EditFieldModal
        visible={!!editingField}
        field={editingField}
        currentValue={editValue}
        onSave={handleFieldSave}
        onClose={() => setEditingField(null)}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───

const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 48,
    borderBottomWidth: 1,
  },
  headerBtn: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: "600", marginLeft: 4 },

  avatarCard: {
    alignItems: "center",
    paddingVertical: 24,
    marginBottom: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: { fontSize: 24, fontWeight: "700" },
  avatarName: { fontSize: 18, fontWeight: "700", marginBottom: 4, marginTop: 8 },
  avatarMeta: { fontSize: 13, fontWeight: "500" },
  photoOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  removePhotoBtn: {
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  removePhotoText: { fontSize: 12, fontWeight: "600" },

  groupCard: {
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 14,
    gap: 10,
  },
  groupIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  groupLabel: { fontSize: 15, fontWeight: "700" },
  groupBody: {},

  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  fieldLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  fieldLabel: { fontSize: 13, fontWeight: "500" },
  fieldRight: { flexDirection: "row", alignItems: "center", gap: 6, maxWidth: "55%" },
  fieldValue: { fontSize: 13, fontWeight: "600" },

  dataSectionTitle: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginTop: 20,
    marginBottom: 2,
    marginHorizontal: 20,
  },
  dataHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 14,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dataIcon: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  dataLabel: { fontSize: 14, fontWeight: "600", flex: 1 },
  dataBadge: { paddingHorizontal: 8, paddingVertical: 1, borderRadius: 10 },
  dataBadgeText: { fontSize: 11, fontWeight: "700", color: "#fff" },
  dataBody: { borderBottomWidth: StyleSheet.hairlineWidth },
  dataEmpty: { textAlign: "center", paddingVertical: 20, fontSize: 13, fontWeight: "500" },
  dataItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dataItemInfo: { flex: 1, marginRight: 8 },
  dataItemTitle: { fontSize: 13, fontWeight: "600" },
  dataItemDetail: { fontSize: 11, marginTop: 1 },
  dataDeleteBtn: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
});

const emodal = StyleSheet.create({
  modal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 18, fontWeight: "700" },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
  },
  optionsWrap: { gap: 8 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  optionText: { fontSize: 15, fontWeight: "500" },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelText: { fontSize: 15, fontWeight: "600" },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  saveText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});
