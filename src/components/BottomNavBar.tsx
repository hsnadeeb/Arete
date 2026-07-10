import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store';
import { useTheme } from '../context/ThemeContext';
import { Icon } from './Icons';
import { LUCIDE_ICONS, TYPOGRAPHY } from '../constants/typography';

const BOTTOM_NAV_TABS = [
  { name: 'Dashboard', label: 'Dashboard', icon: LUCIDE_ICONS.grid },
  { name: 'Planner', label: 'Schedule', icon: LUCIDE_ICONS.calendar },
  { name: 'Trackers', label: 'Trackers', icon: LUCIDE_ICONS.barChart2 },
  { name: 'Journal', label: 'Journal', icon: LUCIDE_ICONS.fileText },
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
            <Icon
              name={tab.icon}
              size={20}
              color={isActive ? tc.accent : tc.textTertiary}
              label={tab.label}
            />
            <Text
              style={[
                TYPOGRAPHY.label,
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
  label: {},

});