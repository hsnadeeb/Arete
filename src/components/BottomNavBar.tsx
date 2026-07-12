import React, { useCallback, useMemo, memo } from 'react';
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

function BottomNavBar() {
  const currentRoute = useStore((s) => s.currentRoute);
  const setCurrentRoute = useStore((s) => s.setCurrentRoute);
  const { theme } = useTheme();
  const tc = theme.colors;
  const insets = useSafeAreaInsets();

  const mainTabs = useMemo(() => ['Dashboard', 'Planner', 'Trackers', 'Journal'], []);
  const containerStyle = useMemo(
    () => ({
      backgroundColor: tc.surface,
      borderTopColor: tc.divider,
      paddingBottom: insets.bottom,
    }),
    [tc.surface, tc.divider, insets.bottom],
  );

  const renderTab = useCallback((tab: typeof BOTTOM_NAV_TABS[0]) => {
    const isActive = mainTabs.includes(currentRoute) && currentRoute === tab.name;
    return (
      <NavTab
        key={tab.name}
        tab={tab}
        isActive={isActive}
        activeBg={tc.accentBg}
        activeColor={tc.accent}
        inactiveColor={tc.textTertiary}
        onPress={setCurrentRoute}
      />
    );
  }, [currentRoute, mainTabs, tc.accentBg, tc.accent, tc.textTertiary, setCurrentRoute]);

  return (
    <View style={[styles.container, containerStyle]}>
      {BOTTOM_NAV_TABS.map(renderTab)}
    </View>
  );
}

const NavTab = memo(function NavTab({
  tab,
  isActive,
  activeBg,
  activeColor,
  inactiveColor,
  onPress,
}: {
  tab: typeof BOTTOM_NAV_TABS[0];
  isActive: boolean;
  activeBg: string;
  activeColor: string;
  inactiveColor: string;
  onPress: (route: string) => void;
}) {
  const handlePress = useCallback(() => onPress(tab.name), [onPress, tab.name]);
  const iconColor = isActive ? activeColor : inactiveColor;
  const textStyle = useMemo(
    () => [TYPOGRAPHY.label, { color: iconColor }, isActive && { fontWeight: '600' as const }],
    [iconColor, isActive],
  );

  return (
    <TouchableOpacity
      style={[styles.tab, isActive && { backgroundColor: activeBg }]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Icon name={tab.icon} size={20} color={iconColor} label={tab.label} />
      <Text style={textStyle} numberOfLines={1}>
        {tab.label}
      </Text>
    </TouchableOpacity>
  );
});

export default memo(BottomNavBar);

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