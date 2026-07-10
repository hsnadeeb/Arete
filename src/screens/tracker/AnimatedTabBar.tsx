import React, { useRef, useEffect, useCallback } from "react";
import { ScrollView, TouchableOpacity, Text, Animated, View } from "react-native";
import { Icon } from "../../components/Icons";
import type { LucideIconName } from "../../constants/typography";
import { trackerStyles as s } from "./styles";

interface TabDef {
  key: string;
  label: string;
  icon: LucideIconName;
  color: string;
}

interface Props {
  tabs: TabDef[];
  active: string;
  onSelect: (idx: number) => void;
  surfaceColor: string;
  dividerColor: string;
  mutedColor: string;
}

export function AnimatedTabBar({
  tabs,
  active,
  onSelect,
  surfaceColor,
  dividerColor,
  mutedColor,
}: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const indicatorX = useRef(new Animated.Value(0)).current;
  const indicatorW = useRef(new Animated.Value(60)).current;

  const activeIdx = tabs.findIndex((t) => t.key === active);
  const tabWidths = useRef<number[]>(tabs.map(() => 70));

  const measureTab = useCallback((idx: number, w: number) => {
    tabWidths.current[idx] = w;
  }, []);

  useEffect(() => {
    if (activeIdx < 0) return;
    let x = 12;
    for (let i = 0; i < activeIdx; i++) x += tabWidths.current[i] + 4;
    const w = tabWidths.current[activeIdx];
    Animated.parallel([
      Animated.spring(indicatorX, {
        toValue: x,
        useNativeDriver: false,
        tension: 200,
        friction: 26,
      }),
      Animated.spring(indicatorW, {
        toValue: w,
        useNativeDriver: false,
        tension: 200,
        friction: 26,
      }),
    ]).start();

    scrollRef.current?.scrollTo({ x: Math.max(0, x - 60), animated: true });
  }, [activeIdx, indicatorX, indicatorW]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[s.tabBar, { backgroundColor: surfaceColor, borderBottomColor: dividerColor }]}
    >
      <View style={s.tabBarInner}>
        {tabs.map((t, i) => {
          const isActive = t.key === active;
          return (
            <TouchableOpacity
              key={t.key}
              style={[
                s.tabItem,
                { backgroundColor: isActive ? t.color + "18" : "transparent" },
              ]}
              onPress={() => onSelect(i)}
              onLayout={(e) => measureTab(i, e.nativeEvent.layout.width)}
              activeOpacity={0.7}
            >
              <Icon
                name={t.icon}
                size={16}
                color={isActive ? t.color : mutedColor}
              />
              <Text
                style={[
                  s.tabLabel,
                  {
                    color: isActive ? t.color : mutedColor,
                    fontWeight: isActive ? "700" : "500",
                  },
                ]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
        <Animated.View
          style={[
            s.tabIndicator,
            {
              left: indicatorX,
              width: indicatorW,
              backgroundColor: tabs[activeIdx]?.color ?? "#6366f1",
            },
          ]}
        />
      </View>
    </ScrollView>
  );
}
