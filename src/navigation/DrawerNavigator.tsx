import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';

import DashboardScreen from '../screens/DashboardScreen';
import TrackerScreen from '../screens/TrackerScreen';
import JournalScreen from '../screens/JournalScreen';
import BudgetScreen from '../screens/BudgetScreen';
import PlannerScreen from '../screens/PlannerScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProfileScreen from '../screens/ProfileScreen';

type RouteName = 'Dashboard' | 'Trackers' | 'Journal' | 'Budget' | 'Planner' | 'Settings' | 'Profile';

const SCREENS: { name: RouteName; component: React.FC }[] = [
  { name: 'Dashboard', component: DashboardScreen },
  { name: 'Trackers', component: TrackerScreen },
  { name: 'Journal', component: JournalScreen },
  { name: 'Budget', component: BudgetScreen },
  { name: 'Planner', component: PlannerScreen },
  { name: 'Settings', component: SettingsScreen },
  { name: 'Profile', component: ProfileScreen },
];

const NAV_ITEMS: { name: RouteName; label: string; icon: string }[] = [
  { name: 'Dashboard', label: 'Dashboard', icon: 'home' },
  { name: 'Trackers', label: 'Trackers', icon: 'bar-chart-2' },
  { name: 'Journal', label: 'Journal', icon: 'file-text' },
  { name: 'Budget', label: 'Budget', icon: 'dollar-sign' },
  { name: 'Planner', label: 'Schedule', icon: 'calendar' },
  { name: 'Settings', label: 'Settings', icon: 'settings' },
];

export default function DrawerNavigator() {
  const [currentRoute, setCurrentRoute] = useState<RouteName>('Dashboard');
  const { sidebarOpen, setSidebarOpen } = useApp();
  const slideAnim = useRef(new Animated.Value(-260)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: sidebarOpen ? 0 : -260, duration: 200, useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: sidebarOpen ? 1 : 0, duration: 200, useNativeDriver: true,
      }),
    ]).start();
  }, [sidebarOpen]);

  const ActiveScreen = SCREENS.find(s => s.name === currentRoute)?.component || DashboardScreen;

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <View style={{ flex: 1 }}>
        <ActiveScreen />
      </View>

      <Animated.View
        style={[StyleSheet.absoluteFill, { zIndex: 1000, opacity: overlayAnim }]}
        pointerEvents={sidebarOpen ? 'auto' : 'none'}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' }}
          activeOpacity={1}
          onPress={() => setSidebarOpen(false)}
        />
      </Animated.View>

      <Animated.View
        style={[styles.sidebar, { paddingTop: insets.top, transform: [{ translateX: slideAnim }], zIndex: 1001 }]}
        pointerEvents={sidebarOpen ? 'auto' : 'none'}
      >
        <View style={[styles.sidebarHeader, { paddingTop: 16 + insets.top }]}>
          <View style={styles.brandRow}>
            <View style={styles.brandIcon}><Text style={styles.brandIconText}>H</Text></View>
            <Text style={styles.brandText}>Hasan OS</Text>
          </View>
          <Text style={styles.brandSub}>second brain</Text>
        </View>

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {NAV_ITEMS.map((item) => {
            const focused = currentRoute === item.name;
            return (
              <TouchableOpacity
                key={item.name}
                style={[styles.navItem, focused && styles.navItemActive]}
                onPress={() => { setCurrentRoute(item.name); setSidebarOpen(false); }}
                activeOpacity={0.7}
              >
                <Feather name={item.icon as any} size={18} color="#6b7280" />
                <Text style={[styles.navItemLabel, focused && styles.navItemLabelActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TouchableOpacity
          style={styles.sidebarFooter}
          onPress={() => { setCurrentRoute('Profile'); setSidebarOpen(false); }}
          activeOpacity={0.7}
        >
          <View style={styles.avatar}><Text style={styles.avatarText}>H</Text></View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const SIDEBAR_WIDTH = 260;
const styles = StyleSheet.create({
  sidebar: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: SIDEBAR_WIDTH,
    backgroundColor: '#ffffff', borderRightWidth: 1, borderRightColor: '#efefef',
    elevation: 16, shadowColor: '#000', shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.2, shadowRadius: 12,
  },
  sidebarHeader: { paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandIcon: { width: 28, height: 28, backgroundColor: '#37352f', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  brandIconText: { color: 'white', fontWeight: '700', fontSize: 14 },
  brandText: { fontSize: 17, fontWeight: '600', color: '#37352f' },
  brandSub: { fontSize: 12, color: '#b3b3af', marginTop: 2, marginLeft: 36, letterSpacing: 0.3 },
  navItem: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
    paddingVertical: 12, marginHorizontal: 8, marginVertical: 1, borderRadius: 8,
  },
  navItemActive: { backgroundColor: '#f5f5f5' },
  navItemIcon: { fontSize: 18, width: 28, textAlign: 'center' },
  navItemLabel: { fontSize: 15, color: '#37352f', flex: 1, fontWeight: '500' },
  navItemLabelActive: { fontWeight: '600', color: '#0b6bcf' },
  sidebarFooter: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 12, paddingHorizontal: 20, borderTopWidth: 1, borderTopColor: '#f5f5f5',
  },
  avatar: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#0b6bcf', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: 'white', fontWeight: '600', fontSize: 14 },
});
