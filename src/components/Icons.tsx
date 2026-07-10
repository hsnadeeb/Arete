import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import * as icons from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import type { LucideIconName } from '../constants/typography';

interface IconProps {
  /** lucide-react-native icon name */
  name: LucideIconName;
  /** Size (default: 16) */
  size?: number;
  /** Color (default: '#6b7280') */
  color?: string;
  /** Accessibility label */
  label?: string;
  /** Container style */
  style?: ViewStyle;
}

/** Shared Icon component — thin wrapper over lucide-react-native */
export function Icon({ name, size = 16, color = '#6b7280', label, style }: IconProps) {
  const LucideIcon = name ? (icons[name] as LucideIcon | undefined) : undefined;
  return (
    <View style={[styles.wrapper, style]} accessible accessibilityLabel={label ?? (name as string)}>
      {LucideIcon ? <LucideIcon size={size} color={color} /> : null}
    </View>
  );
}

/**
 * Map of legacy emoji / unicode strings used in stored data to lucide icon names.
 * Keys remain unicode strings so existing data (PRAYER_EMOJIS, habit `emoji` field,
 * and any persisted strings) continue to map to icons after the migration.
 */
export const ICON_MAP: Record<string, LucideIconName> = {
  // Navigation
  '\u2630': 'Menu',
  '\u25B2': 'ChevronUp',
  '\u25BC': 'ChevronDown',
  '\u25B6': 'ChevronRight',
  '\u2715': 'X',
  '\u2713': 'Check',

  // Status
  '\u25FB': 'Square',
  '\u23F3': 'Clock',
  '\u2705': 'Check',

  // Actions
  '\u21BB': 'RefreshCw',
  '\uD83D\uDD04': 'RefreshCw',
  '\uD83D\uDCB0': 'DollarSign',
  '\uD83D\uDCCB': 'FileText',
  '\uD83D\uDCCA': 'ChartColumn',
  '\uD83D\uDCA7': 'Droplet',
  '\uD83D\uDEB6': 'Activity',
  '\uD83D\uDCA1': 'Lightbulb',

  // Health
  '\u2696': 'Weight',
  '\uD83D\uDCAA': 'Zap',
  '\uD83C\uDF1F': 'Star',

  // Mood
  '\u2639': 'Frown',
  '\u263A': 'Smile',
  '\uD83D\uDE10': 'Meh',

  // Prayer
  '\uD83C\uDF06': 'Sunrise',
  '\u2600\uFE0F': 'Sun',
  '\uD83C\uDF1E': 'Sun',
  '\uD83C\uDF07': 'Sunset',
  '\uD83C\uDF19': 'Moon',
  '\uD83C\uDF24\uFE0F': 'Cloud',

  // Misc
  '\uD83D\uDD25': 'Zap',
  '\u26A1': 'Zap',
  '\uD83C\uDF89': 'Award',
  '\uD83C\uDFAF': 'Target',
  '\uD83D\uDCDC': 'Book',
  '\uD83C\uDFF7': 'Image',
  '\uD83D\uDCDA': 'Book',
  '\uD83C\uDFAC': 'Film',
  '\uD83C\uDF92': 'Trophy',
  '\uD83C\uDFC3': 'PersonStanding',
  '\uD83C\uDF4E': 'Apple',
  '\uD83D\uDE82': 'TrainFront',
  '\uD83D\uDED2': 'ShoppingBag',
  '\uD83D\uDC8A': 'Cross',
  '\uD83D\uDED1': 'Ban',
  '\uD83D\uDEE0': 'Wrench',
  '\uD83E\uDDD8': 'PersonStanding',
  '\uD83D\uDC76': 'Baby',
  '\uD83D\uDCB8': 'DollarSign',
  '\uD83C\uDFB1': 'Dices',
  '\uD83C\uDFB0': 'Dices',
  '\uD83C\uDF7D\uFE0F': 'Coffee',
  '\uD83D\uDCC5': 'Calendar',
  '\uD83D\uDCB6': 'DollarSign',
  '\uD83D\uDD14': 'Bell',
  '\u23F0': 'Clock',
  '\uD83D\uDCBC': 'Briefcase',
  '\uD83D\uDEAA': 'DoorClosed',
  '\uD83C\uDFE6': 'Landmark',
  '\uD83C\uDFEB': 'School',
  '\uD83C\uDFE0': 'House',
  '\uD83D\uDE80': 'Rocket',
  '\uD83C\uDFC6': 'Award',
  '\uD83C\uDFE1': 'House',
  '\uD83C\uDFE2': 'Building',
  '\uD83C\uDFE4': 'Building',
  '\uD83C\uDFE5': 'Hospital',
  '\uD83C\uDFE7': 'Gift',
  '\uD83C\uDFE8': 'Gift',
  '\uD83C\uDFE9': 'Gift',
  '\uD83C\uDFEA': 'Gift',
};

/** Convenience: Get lucide icon name for a legacy emoji / unicode character. */
export function getIconName(emoji: string): LucideIconName {
  return ICON_MAP[emoji] ?? 'Circle';
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
