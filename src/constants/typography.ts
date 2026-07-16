/**
 * Typography constants for consistent styling across the app.
 * Single source of truth for text styling and icon naming.
 */

import * as icons from 'lucide-react-native';

/**
 * Union of all lucide-react-native icon names. Derived from the package's
 * own named exports, so the type stays in sync if lucide adds/removes icons.
 */
export type LucideIconName = keyof typeof icons;

/**
 * Text-style presets. Colors are intentionally omitted so consumers can apply
 * theme colors at the call site (e.g. `style={[TYPOGRAPHY.body, { color: tc.text }]}`).
 * The accent preset is the only exception and uses the brand accent color.
 */
export const TYPOGRAPHY = {
  /** Title / heading sizes */
  h1: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.3 },
  h2: { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.2 },
  h3: { fontSize: 18, fontWeight: '600' as const },
  h4: { fontSize: 16, fontWeight: '600' as const },

  /** Body text */
  body: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  bodySm: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  captionSm: { fontSize: 11, fontWeight: '400' as const, lineHeight: 15 },
  label: { fontSize: 10, fontWeight: '500' as const, lineHeight: 14, textTransform: 'uppercase' as const, letterSpacing: 0.5 },

  /** Meta / subtle */
  meta: { fontSize: 11, fontWeight: '500' as const },
  metaBold: { fontSize: 11, fontWeight: '600' as const },

  /** Numeric / monospaced variant */
  mono: { fontSize: 14, fontWeight: '600' as const, fontVariant: ['tabular-nums'] as any },
  monoLg: { fontSize: 18, fontWeight: '700' as const, fontVariant: ['tabular-nums'] as any },

  /** Accent text — uses the brand accent color */
  accent: { fontSize: 13, fontWeight: '600' as const, color: '#6366f1' },
  accentSm: { fontSize: 11, fontWeight: '600' as const, color: '#6366f1' },

  /** Button text */
  btn: { fontSize: 14, fontWeight: '600' as const },
  btnSm: { fontSize: 12, fontWeight: '600' as const },

  /** Card / section title (uppercase eyebrow text) */
  title: {
    fontSize: 13,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.4,
  },

  /** Stat blocks: big numeric value + small uppercase label */
  statValue: { fontSize: 18, fontWeight: '700' as const },
  statLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.3,
  },

  /** Empty-state text */
  emptyTitle: { fontSize: 18, fontWeight: '700' as const, textAlign: 'center' as const },
  emptySubtitle: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20, textAlign: 'center' as const },

  /** Modal header */
  modalTitle: { fontSize: 20, fontWeight: '700' as const },

  /** TextInput */
  input: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
} as const;

/**
 * Semantic name → lucide-react-native icon name mapping.
 * Components reference these by semantic key (e.g. `LUCIDE_ICONS.menu`),
 * keeping the rest of the codebase free of direct lucide references.
 *
 * Where lucide doesn't ship a direct equivalent (e.g. yoga, slot-machine)
 * we map to the closest visual match available in lucide-react-native.
 */
export const LUCIDE_ICONS: Record<string, LucideIconName> = {
  // Navigation
  menu: 'Menu',
  arrowUp: 'ArrowUp',
  arrowDown: 'ArrowDown',
  arrowRight: 'ArrowRight',
  arrowLeft: 'ArrowLeft',
  close: 'X',
  x: 'X',
  check: 'Check',
  checkCircle: 'CheckCircle',
  edit: 'Pencil',
  plus: 'Plus',
  cpu: 'Cpu',
  download: 'Download',
  share2: 'Share2',
  database: 'Database',
  list: 'List',
  pause: 'Pause',
  play: 'Play',

  // Chevrons
  chevronRight: 'ChevronRight',
  chevronLeft: 'ChevronLeft',
  chevronUp: 'ChevronUp',
  chevronDown: 'ChevronDown',

  // Weather / time
  sun: 'Sun',
  moon: 'Moon',
  cloud: 'Cloud',
  sunrise: 'Sunrise',
  sunset: 'Sunset',

  // Health / activity
  droplet: 'Droplet',
  activity: 'Activity',
  weight: 'Weight',
  run: 'PersonStanding',

  // Charts / data
  trendingUp: 'TrendingUp',
  trendingDown: 'TrendingDown',
  barChart: 'ChartBar',
  barChart2: 'ChartColumn',

  // Documents / calendar
  fileText: 'FileText',
  calendar: 'Calendar',
  image: 'Image',
  search: 'Search',

  // Mood
  smile: 'Smile',
  frown: 'Frown',
  meh: 'Meh',

  // Money / shopping
  dollarSign: 'DollarSign',
  shoppingBag: 'ShoppingBag',

  // Reading / media
  book: 'Book',
  film: 'Film',
  pill: 'Pill',
  coffee: 'Coffee',

  // Places / work
  briefcase: 'Briefcase',
  home: 'House',
  school: 'School',
  bank: 'Landmark',
  building: 'Building',
  hospital: 'Hospital',
  rocket: 'Rocket',
  gift: 'Gift',

  // Achievements / status
  award: 'Award',
  target: 'Target',
  zap: 'Zap',
  star: 'Star',
  bell: 'Bell',
  clock: 'Clock',
  compass: 'Compass',

  // Settings / user
  settings: 'Settings',
  user: 'User',
  users: 'Users',
  sliders: 'SlidersHorizontal',
  layout: 'LayoutGrid',
  trash2: 'Trash2',
  refreshCw: 'RefreshCw',

  // Misc
  grid: 'LayoutGrid',
  noEntry: 'Ban',
  ban: 'Ban',
  tool: 'Wrench',
  yoga: 'PersonStanding',
  baby: 'Baby',
  dice: 'Dices',
  slotMachine: 'Dices',
  train: 'TrainFront',
  door: 'DoorClosed',
  medicalCross: 'Cross',
  apple: 'Apple',
  pin: 'Pin',
  hand: 'Hand',
  heart: 'Heart',
  globe: 'Globe',
  smartphone: 'Smartphone',
  ruler: 'Ruler',
  percent: 'Percent',
  landmark: 'Landmark',
  bookOpen: 'BookOpen',
  camera: 'Camera',
};
