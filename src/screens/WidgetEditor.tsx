import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "../store";
import { useTheme } from "../context/ThemeContext";
import { Icon } from "../components/Icons";
import { LUCIDE_ICONS, TYPOGRAPHY } from "../constants/typography";
import { WIDGET_DEFINITIONS } from "../types";
import { getWidgetRepo } from "../db/repositories/widget";

interface WidgetEditorItem {
  widget_key: string;
  title: string;
  icon: string;
  accentColor: string;
  visible: boolean;
  sort_order: number;
}

export default function WidgetEditor() {
  const { theme } = useTheme();
  const widgetLayouts = useStore((s) => s.widgetLayouts);
  const setWidgetLayouts = useStore((s) => s.setWidgetLayouts);
  const saveWidgetLayouts = useStore((s) => s.saveWidgetLayouts);
  const setSidebarOpen = useStore((s) => s.setSidebarOpen);
  const setCurrentRoute = useStore((s) => s.setCurrentRoute);
  const refresh = useStore((s) => s.refresh);
  const [widgets, setWidgets] = useState<WidgetEditorItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWidgets();
  }, []);

  const loadWidgets = async () => {
    setLoading(true);
    try {
      const repo = getWidgetRepo();
      const rows = await repo.getAll();
      const mapped = WIDGET_DEFINITIONS.map((def) => {
        const dbRow = rows.find((r) => r.widget_key === def.key);
        return {
          widget_key: def.key,
          title: def.title,
          icon: def.icon,
          accentColor: def.accentColor,
          visible: dbRow ? !!dbRow.visible : true,
          sort_order: dbRow ? dbRow.sort_order : 99,
        };
      });
      setWidgets(mapped.sort((a, b) => a.sort_order - b.sort_order));
    } catch (e) {
      console.warn("Failed to load widgets:", e);
    }
    setLoading(false);
  };

  const moveWidget = (index: number, dir: -1 | 1) => {
    const newWidgets = [...widgets];
    const target = index + dir;
    if (target < 0 || target >= newWidgets.length) return;
    [newWidgets[index], newWidgets[target]] = [newWidgets[target], newWidgets[index]];
    newWidgets.forEach((w, i) => (w.sort_order = i));
    setWidgets(newWidgets);
    persistOrder(newWidgets);
  };

  const toggleWidget = (index: number) => {
    const newWidgets = [...widgets];
    newWidgets[index].visible = !newWidgets[index].visible;
    setWidgets(newWidgets);
    persistOrder(newWidgets);
  };

  const persistOrder = async (newWidgets: WidgetEditorItem[]) => {
    try {
      const repo = getWidgetRepo();
      for (const w of newWidgets) {
        await repo.updateSortOrder(w.widget_key, w.sort_order);
        await repo.toggleVisibility(w.widget_key, w.visible);
      }
      const refreshed = await repo.getAll();
      setWidgetLayouts(refreshed);
      if (refresh) await refresh();
    } catch (e) {
      console.warn("Failed to persist:", e);
    }
  };

  const handleBack = () => {
    setCurrentRoute("Dashboard");
    setSidebarOpen(false);
  };

  const colors = theme.colors;

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: colors.muted }}>Loading widgets...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Icon name={LUCIDE_ICONS.arrowLeft} size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[TYPOGRAPHY.h4, { color: colors.text, flex: 1 }]}>
          Customize Widgets
        </Text>
        <TouchableOpacity onPress={loadWidgets} style={styles.iconBtn}>
          <Icon name={LUCIDE_ICONS.refreshCw} size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 12, gap: 12, paddingBottom: 60 }}
      >
        <Text style={[TYPOGRAPHY.bodySm, { color: colors.textTertiary, marginBottom: 4 }]}>
          Toggle visibility and reorder. Changes save automatically.
        </Text>
        {widgets.map((w, i) => (
          <WidgetCard
            key={w.widget_key}
            widget={w}
            index={i}
            onMoveUp={() => moveWidget(i, -1)}
            onMoveDown={() => moveWidget(i, 1)}
            onToggle={() => toggleWidget(i)}
            colors={colors}
            total={widgets.length}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function WidgetCard({
  widget,
  index,
  onMoveUp,
  onMoveDown,
  onToggle,
  colors,
  total,
}: {
  widget: WidgetEditorItem;
  index: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggle: () => void;
  colors: any;
  total: number;
}) {
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: widget.visible ? 1 : 0.5,
        },
      ]}
    >
      <View style={styles.cardRow}>
        <View style={[styles.cardIcon, { backgroundColor: widget.accentColor + "20" }]}>
          <Icon name={widget.icon as any} size={20} color={widget.accentColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{widget.title}</Text>
          <Text style={[styles.cardKey, { color: colors.textTertiary }]}>{widget.widget_key}</Text>
        </View>
        <Switch
          value={widget.visible}
          onValueChange={onToggle}
          trackColor={{ false: colors.border, true: colors.success }}
          thumbColor={widget.visible ? colors.success : colors.muted}
        />
      </View>
      <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
        <TouchableOpacity
          style={[styles.moveBtn, { backgroundColor: colors.bgSecondary }]}
          onPress={onMoveUp}
          disabled={index === 0}
        >
          <Icon name={LUCIDE_ICONS.chevronUp} size={16} color={index === 0 ? colors.disabled : colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.moveBtn, { backgroundColor: colors.bgSecondary }]}
          onPress={onMoveDown}
          disabled={index === total - 1}
        >
          <Icon name={LUCIDE_ICONS.chevronDown} size={16} color={index === total - 1 ? colors.disabled : colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <Text style={[TYPOGRAPHY.meta, { color: colors.textTertiary, alignSelf: "center" }]}>
          Position {index + 1} of {total}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 8, marginRight: 4 },
  iconBtn: { padding: 8 },
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  cardKey: {
    fontSize: 11,
    marginTop: 2,
  },
  moveBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});