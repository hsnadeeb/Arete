import React, { useState, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../../context/AppContext";
import { useTheme } from "../../context/ThemeContext";
import { Icon } from "../../components/Icons";
import { LUCIDE_ICONS } from "../../constants/typography";
import { TABS } from "./types";
import type { ThemeColors } from "./types";
import { AnimatedTabBar } from "./AnimatedTabBar";
import { TrackerOverview } from "./TrackerOverview";
import { TrackerWeight } from "./TrackerWeight";
import { TrackerWater } from "./TrackerWater";
import { TrackerSteps } from "./TrackerSteps";
import { TrackerSleep } from "./TrackerSleep";
import { TrackerMood } from "./TrackerMood";
import { TrackerHabits } from "./TrackerHabits";
import { useTrackerData } from "./useTrackerData";
import { trackerStyles as s } from "./styles";

const screenWidth = Dimensions.get("window").width;

function buildTheme(isDark: boolean, tc: any): ThemeColors {
  return {
    bg: isDark ? tc.bg : "#f8f9fa",
    surface: isDark ? tc.surface : "#ffffff",
    surfaceAlt: isDark ? tc.bgSecondary : "#f8fafc",
    border: isDark ? tc.border : "#e2e8f0",
    borderSoft: isDark ? tc.borderLight : "#f1f5f9",
    borderMuted: isDark ? tc.divider : "#f0f0f0",
    textPrimary: isDark ? tc.heading : "#1e293b",
    textSecondary: isDark ? tc.textSecondary : "#475569",
    textTertiary: isDark ? tc.textTertiary : "#64748b",
    textMuted: isDark ? tc.textTertiary : "#94a3b8",
    accent: isDark ? tc.accent : "#6366f1",
    accentBg: isDark ? tc.accentBg : "#f0fdf4",
    successBorder: isDark ? tc.success : "#22c55e",
    pillBg: isDark ? tc.bgSecondary : "#f1f5f9",
    placeholder: isDark ? tc.placeholder : "#94a3b8",
    sleepBg: isDark ? tc.bgSecondary : "#e8d9ff",
    waterBg: isDark ? tc.infoBg : "#e0f2fe",
    moodBg: isDark ? tc.warningBg : "#fef3c7",
    moodBorder: isDark ? tc.warning : "#f97316",
  };
}

export default function TrackerScreen() {
  const { setSidebarOpen, dailyLog } = useApp();
  const { theme, isDark } = useTheme();
  const tc = theme.colors;
  const T = buildTheme(isDark, tc);

  const [activeIdx, setActiveIdx] = useState(0);
  const [active, setActive] = useState(TABS[0].key);
  const pagerRef = useRef<ScrollView>(null);

  const {
    loaded,
    habits,
    habitLogs,
    weekData,
    habitGrid,
    refreshHabits,
    refreshHabitLogs,
  } = useTrackerData();

  const goToPage = (idx: number) => {
    setActiveIdx(idx);
    setActive(TABS[idx].key);
    pagerRef.current?.scrollTo({ x: idx * screenWidth, animated: true });
  };

  const onMomentumScrollEnd = (e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
    if (idx !== activeIdx && idx >= 0 && idx < TABS.length) {
      setActiveIdx(idx);
      setActive(TABS[idx].key);
    }
  };

  if (!loaded) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={["top"]}>
        <View
          style={[
            s.header,
            { backgroundColor: T.surface, borderBottomColor: T.borderSoft },
          ]}
        >
          <Icon name={LUCIDE_ICONS.menu} size={20} color={T.textPrimary} />
          <Text style={[s.headerTitle, { color: T.textPrimary, marginLeft: 8 }]}>
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={["top"]}>
      {/* Header */}
      <View
        style={[
          s.header,
          { backgroundColor: T.surface, borderBottomColor: T.borderSoft },
        ]}
      >
        <TouchableOpacity onPress={() => setSidebarOpen(true)} style={s.hamburger}>
          <Icon name={LUCIDE_ICONS.menu} size={20} color={T.textPrimary} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: T.textPrimary }]}>{todayStr}</Text>
      </View>

      {/* Animated Tab Bar */}
      <AnimatedTabBar
        tabs={TABS}
        active={active}
        onSelect={goToPage}
        surfaceColor={T.surface}
        dividerColor={T.borderMuted}
        mutedColor={T.textMuted}
      />

      {/* Swipeable Pager */}
      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={s.tabContent}
        contentContainerStyle={{ flexGrow: 1 }}
        onMomentumScrollEnd={onMomentumScrollEnd}
      >
        <View style={{ width: screenWidth, flex: 1 }}>
          <TrackerOverview week={weekData} T={T} />
        </View>
        <View style={{ width: screenWidth, flex: 1 }}>
          <TrackerWeight week={weekData} T={T} />
        </View>
        <View style={{ width: screenWidth, flex: 1 }}>
          <TrackerWater week={weekData} T={T} />
        </View>
        <View style={{ width: screenWidth, flex: 1 }}>
          <TrackerSteps week={weekData} T={T} />
        </View>
        <View style={{ width: screenWidth, flex: 1 }}>
          <TrackerSleep week={weekData} T={T} />
        </View>
        <View style={{ width: screenWidth, flex: 1 }}>
          <TrackerMood week={weekData} T={T} />
        </View>
        <View style={{ width: screenWidth, flex: 1 }}>
          <TrackerHabits
            habits={habits}
            habitLogs={habitLogs}
            habitGrid={habitGrid}
            onRefresh={refreshHabits}
            onRefreshLogs={refreshHabitLogs}
            T={T}
            accentColor={tc.accent}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
