import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store';
import { useTheme } from '../context/ThemeContext';

const BOTTOM_NAV_TABS = [
  { name: 'Dashboard', label: 'Dashboard', icon: 'grid' as const },
  { name: 'Planner', label: 'Schedule', icon: 'calendar' as const },
  { name: 'Trackers', label: 'Trackers', icon: 'bar-chart-2' as const },
  { name: 'Journal', label: 'Journal', icon: 'file-text' as const },
];

export default function BottomNavBar() {
  const currentRoute = useStore((s) => s.currentRoute);
  const setCurrentRoute = useStore((s) => s.setCurrentRoute);
  const { theme } = useTheme();
  const tc = theme.colors;
  const insets = useSafeAreaInsets();

  const mainTabs = ['Dashboard', 'Planner', 'Trackers', 'Journal'];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: tc.surface,
          borderTopColor: tc.divider,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      {BOTTOM_NAV_TABS.map((tab) => {
        const isActive = mainTabs.includes(currentRoute) && currentRoute === tab.name;

        return (
          <TouchableOpacity
            key={tab.name}
            style={[
              styles.tab,
              isActive && { backgroundColor: tc.accentBg },
            ]}
            onPress={() => setCurrentRoute(tab.name)}
            activeOpacity={0.7}
          >
            <Feather
              name={tab.icon}
              size={20}
              color={isActive ? tc.accent : tc.textTertiary}
            />
            <Text
              style={[
                styles.label,
                {
                  color: isActive ? tc.accent : tc.textTertiary,
                },
                isActive && { fontWeight: '600' },
              ]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingHorizontal: 8,
    paddingTop: 6,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 10,
    gap: 2,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
  },
});