import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface IconProps {
  /** Feather icon name */
  name: keyof typeof Feather.glyphMap;
  /** Size (default: 16) */
  size?: number;
  /** Color (default: '#6b7280') */
  color?: string;
  /** Accessibility label */
  label?: string;
  /** Container style */
  style?: ViewStyle;
}

/** Shared Icon component — replaces emoji-as-Text patterns with clean Feather icons */
export function Icon({ name, size = 16, color = '#6b7280', label, style }: IconProps) {
  return (
    <View style={[styles.wrapper, style]} accessible accessibilityLabel={label ?? name}>
      <Feather name={name as any} size={size} color={color} />
    </View>
  );
}

/** IconMap — maps common app emoji/icons to Feather names */
export const ICON_MAP: Record<string, string> = {
  // Navigation
  '\u2630': 'menu',
  '\u25B2': 'chevron-up',
  '\u25BC': 'chevron-down',
  '\u25B6': 'chevron-right',
  '\u2715': 'x',
  '\u2713': 'check',

  // Status
  '\u25FB': 'square',
  '\u23F3': 'clock',
  '\u2705': 'check',

  // Actions
  '\u21BB': 'refresh-cw',
  '\uD83D\uDD04': 'refresh-cw',
  '\uD83D\uDCB0': 'dollar-sign',
  '\uD83D\uDCCB': 'file-text',
  '\uD83D\uDCCA': 'bar-chart-2',
  '\uD83D\uDCA7': 'droplet',
  '\uD83D\uDEB6': 'activity',
  '\uD83D\uDCA1': 'lightbulb',

  // Health
  '\u2696': 'weight',
  '\uD83D\uDCAA': 'zap',
  '\uD83C\uDF1F': 'star',

  // Mood
  '\u2639': 'frown',
  '\u263A': 'smile',
  '\uD83D\uDE10': 'meh',

  // Prayer
  '\uD83C\uDF06': 'sunrise',
  '\u2600\uFE0F': 'sun',
  '\uD83C\uDF1E': 'sun',
  '\uD83C\uDF07': 'sunset',
  '\uD83C\uDF19': 'moon',
  '\uD83C\uDF24\uFE0F': 'cloud',

  // Misc
  '\uD83D\uDD25': 'zap',
  '\u26A1': 'zap',
  '\uD83C\uDF89': 'award',
  '\uD83C\uDFAF': 'target',
  '\uD83D\uDCDC': 'book',
  '\uD83C\uDFF7': 'image',
  '\uD83D\uDCDA': 'book',
  '\uD83C\uDFAC': 'film',
  '\uD83C\uDF92': 'trophy',
  '\uD83C\uDFC3': 'run',
  '\uD83C\uDF4E': 'apple',
  '\uD83D\uDE82': 'train',
  '\uD83D\uDED2': 'shopping-bag',
  '\uD83D\uDC8A': 'medical-cross',
  '\uD83D\uDED1': 'no-entry',
  '\uD83D\uDEE0': 'tool',
  '\uD83E\uDDD8': 'yoga',
  '\uD83D\uDC76': 'baby',
  '\uD83D\uDCB8': 'dollar-sign',
  '\uD83C\uDFB1': 'dice',
  '\uD83C\uDFB0': 'slot-machine',
  '\uD83C\uDF7D\uFE0F': 'coffee',
  '\uD83D\uDCC5': 'calendar',
  '\uD83D\uDCB6': 'dollar-sign',
  '\uD83D\uDD14': 'bell',
  '\u23F0': 'clock',
  '\uD83D\uDCBC': 'briefcase',
  '\uD83D\uDEAA': 'door',
  '\uD83C\uDFE6': 'bank',
  '\uD83C\uDFEB': 'school',
  '\uD83C\uDFE0': 'home',
  '\uD83D\uDE80': 'rocket',
  '\uD83C\uDFC6': 'award',
  '\uD83C\uDFE1': 'home',
  '\uD83C\uDFE2': 'building',
  '\uD83C\uDFE4': 'building',
  '\uD83C\uDFE5': 'hospital',
  '\uD83C\uDFE7': 'gift',
  '\uD83C\uDFE8': 'gift',
  '\uD83C\uDFE9': 'gift',
  '\uD83C\uDFEA': 'gift',
};

/** Convenience: Get Feather name for an emoji character */
export function getIconName(emoji: string): string {
  return ICON_MAP[emoji] ?? 'circle';
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});