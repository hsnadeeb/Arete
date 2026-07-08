/**
 * Typography constants for consistent styling across the app.
 * Replaces inline font/emoji overuse with a structured system.
 */

export const TYPOGRAPHY = {
  /** Title / heading sizes */
  h1: { fontSize: 24, fontWeight: '700' as const, color: '#1c1917', letterSpacing: -0.3 },
  h2: { fontSize: 20, fontWeight: '700' as const, color: '#1c1917', letterSpacing: -0.2 },
  h3: { fontSize: 18, fontWeight: '600' as const, color: '#1c1917' },
  h4: { fontSize: 16, fontWeight: '600' as const, color: '#1c1917' },

  /** Body text */
  body: { fontSize: 14, fontWeight: '400' as const, color: '#292524', lineHeight: 20 },
  bodySm: { fontSize: 13, fontWeight: '400' as const, color: '#292524', lineHeight: 18 },
  caption: { fontSize: 12, color: '#a8a29e', lineHeight: 16 },
  captionSm: { fontSize: 11, color: '#a8a29e', lineHeight: 15 },
  label: { fontSize: 10, color: '#a8a29e', lineHeight: 14 },

  /** Meta / subtle */
  meta: { fontSize: 11, color: '#a8a29e', fontWeight: '500' as const },
  metaBold: { fontSize: 11, color: '#a8a29e', fontWeight: '600' as const },

  /** Numeric / monospaced variant */
  mono: { fontSize: 14, fontWeight: '600' as const, color: '#1c1917', fontVariant: ['tabular-nums'] as const },
  monoLg: { fontSize: 18, fontWeight: '700' as const, color: '#1c1917', fontVariant: ['tabular-nums'] as const },

  /** Accent text */
  accent: { fontSize: 13, fontWeight: '600' as const, color: '#6366f1' },
  accentSm: { fontSize: 11, fontWeight: '600' as const, color: '#6366f1' },

  /** Button text */
  btn: { fontSize: 14, fontWeight: '600' as const, color: '#ffffff' },
  btnSm: { fontSize: 12, fontWeight: '600' as const, color: '#ffffff' },
} as const;

/** Icon / emoji replacement system — uses Unicode symbols instead of emoji */
export const ICONS = {
  prayer: {
    fajr: '\u2600',      // ☀ (sunrise)
    sunrise: '\u2600',    // ☀
    dhuhr: '\u2600',      // ☀
    asr: '\u26C5',        // ⛅
    maghrib: '\u26C5',    // ⛅
    isha: '\u263E',       // ☾
  },
  nav: {
    menu: '\u2630',       // ☰
    arrowUp: '\u25B2',    // ▲
    arrowDown: '\u25BC', // ▼
    arrowRight: '\u25B6', // ▶
    close: '\u2715',       // ✕
    check: '\u2713',       // ✓
    edit: '\u270E',        // ✎
  },
  status: {
    done: '\u2713',       // ✓
    qada: '\u23F3',       // ⏳
    pending: '\u25FB',    // ◻
    loading: '\u25C6',    // ◆
  },
  mood: ['\u25CF', '\u25D0', '\u25D1', '\u25D2', '\u25D3'], // solid → empty circles
  health: {
    weight: '\u2696',    // ⚖
    water: '\u26F0',     // ⛰ (alternative for water drop)
    steps: '\u26F4',     // ⛴
    sleep: '\u2722',     // ✢
  },
  common: {
    star: '\u2605',
    heart: '\u2661',
    plus: '\u002B',
    minus: '\u2212',
    hash: '\u0023',
    at: '\u0040',
  },
} as const;

/** Map emoji strings used in DB/PRAYER_EMOJIS to ICONS */
export const EMOJI_TO_ICON: Record<string, string> = {
  '\uD83C\uDF06': ICONS.prayer.fajr,   // 🌅 → ☀
  '\u2600\uFE0F': ICONS.prayer.dhuhr, // ☀️ → ☀
  '\uD83C\uDF1E': ICONS.prayer.dhuhr, // 🌞 → ☀
  '\uD83C\uDF24\uFE0F': ICONS.prayer.asr, // 🌤️ → ⛅
  '\uD83C\uDF07': ICONS.prayer.maghrib, // 🌇 → ⛅
  '\uD83C\uDF19': ICONS.prayer.isha, // 🌙 → ☾
  '\uD83D\uDD25': ICONS.common.star, // 🔥
  '\uD83D\uDD04': '\u21BB', // 🔄
  '\uD83D\uDCB0': '\u0024', // 💰 → $
  '\uD83D\uDCB8': '\u0024', // 💸 → $
  '\uD83D\uDCB6': '\u0024', // 💶 → $
  '\uD83D\uDCCB': '\u2202', // 📋
  '\uD83D\uDCCA': '\u2206', // 📊
  '\uD83D\uDCA7': '\u2601', // 💧
  '\uD83D\uDEB6': '\u221E', // 🚶
  '\uD83D\uDCA1': '\u2600', // 💡 → ☀
  '\uD83E\uDDD8': '\u2728', // 🧘
  '\uD83D\uDED1': '\u2205', // 🚫
  '\uD83D\uDCDC': '\u2202', // 📖
  '\uD83C\uDF1F': '\u2605', // 🌟
  '\u26A1': '\u26A1', // ⚡
  '\uD83D\uDCAA': '\u272A', // 💪
  '\uD83C\uDF89': '\u2728', // 🎉
  '\uD83C\uDFAF': '\u2728', // 🎯
  '\uD83D\uDE42': '\u263A', // 🙂 → ☺
  '\uD83D\uDE0A': '\u263A', // 😊 → ☺
  '\uD83D\uDE2D': '\u2639', // 😢 → ☹
  '\uD83D\uDE1F': '\u2639', // 😟 → ☹
  '\uD83D\uDE10': '\u2639', // 😑 → ☹
  '\uD83D\uDE22': '\u2639', // 😢 → ☹
  '\uD83D\uDC4D': '\u2713', // 👍 → ✓
  '\uD83D\uDC4E': '\u2717', // 👎 → ✗
  '\u2705': '\u2713', // ✅ → ✓
  '\u2716': '\u2715', // ✖ → ✕
  '\u2795': '\u002B', // ➕ → +
  '\u2796': '\u2212', // ➖ → −
  '\u2797': '\u002B', // ➗ → +
  '\u2B50': '\u2605', // ⭐ → ★
  '\u26A0\uFE0F': '\u26A0', // ⚠️ → ⚠
  '\u2714\uFE0F': '\u2713', // ✔️ → ✓
  '\u274C': '\u2715', // ❌ → ✕
  '\uD83D\uDD14': '\u21BB', // 🔔
  '\u23F0': '\u23F0', // ⏰
  '\uD83D\uDCC5': '\u25C6', // 📅
  '\uD83C\uDF7D\uFE0F': '\u2722', // 🍽️
  '\uD83C\uDF4E': '\u2728', // 🍎
  '\uD83D\uDE82': '\u26A1', // 🚇
  '\uD83D\uDED2': '\u2711', // 🛍️
  '\uD83D\uDC8A': '\u2695', // 💊
  '\uD83D\uDCDA': '\u25C6', // 📚
  '\uD83C\uDFAC': '\u2665', // 🎬
  '\uD83C\uDF92': '\u2728', // 🏋️
  '\uD83C\uDFC3': '\u272A', // 🏃
};

/** Accessibility: Label for each icon */
export const ICON_LABELS: Record<string, string> = {
  '\u2630': 'Menu',
  '\u25B2': 'Up',
  '\u25BC': 'Down',
  '\u2713': 'Done',
  '\u2715': 'Close',
  '\u270E': 'Edit',
  '\u2600': 'Sun',
  '\u26C5': 'Clouds',
  '\u263E': 'Moon',
  '\u2728': 'Star',
  '\u26A0': 'Warning',
  '\u23F0': 'Alarm',
  '\u2696': 'Weight scale',
  '\u26F0': 'Mountain',
  '\u26F4': 'Ship',
  '\u2722': 'Star',
  '\u221E': 'Infinity',
  '\u2205': 'Empty set',
  '\u2206': 'Delta',
  '\u2202': 'Partial derivative',
};