export const DURATIONS = [
  { label: "40m", value: 40 * 60 },
  { label: "25m", value: 25 * 60 },
  { label: "15m", value: 15 * 60 },
  { label: "5m", value: 5 * 60 },
] as const;

export const GREEN = ["#e8f5e9", "#a5d6a7", "#66bb6a", "#43a047", "#2e7d32"];
export const BRN = "#5d4037";
export const BRN_L = "#8d6e63";
export const FLW = ["#f48fb1", "#ce93d8", "#ffcc02"];
export const SPARK = ["#ffd54f", "#fff176", "#ffecb3", "#a5d6a7"];
export const CONFETTI = [
  "#43a047",
  "#ffd54f",
  "#f48fb1",
  "#4fc3f7",
  "#ce93d8",
  "#ff8a65",
];

export const SKY_STOPS = [
  { at: 0, glow: "#bcd9c9", halo: "#e8f5e9" },
  { at: 50, glow: "#9fd8b0", halo: "#d7f0dc" },
  { at: 85, glow: "#ffd98a", halo: "#fff1cf" },
  { at: 100, glow: "#ffb997", halo: "#ffe0c2" },
];

export const CANOPY_BLOBS = [
  { dx: -0.58, dy: -0.28, r: 0.74, layer: 0, growAt: 0.16 },
  { dx: 0.58, dy: -0.28, r: 0.74, layer: 0, growAt: 0.2 },
  { dx: 0, dy: -0.62, r: 0.7, layer: 0, growAt: 0.3 },
  { dx: 0, dy: 0.05, r: 1.0, layer: 1, growAt: 0.02 },
  { dx: -0.82, dy: 0.14, r: 0.58, layer: 1, growAt: 0.42 },
  { dx: 0.82, dy: 0.14, r: 0.58, layer: 1, growAt: 0.46 },
  { dx: -0.32, dy: -0.5, r: 0.46, layer: 2, growAt: 0.6 },
  { dx: 0.22, dy: -0.78, r: 0.36, layer: 2, growAt: 0.72 },
];

export const BLOSSOM_SPOTS = [
  { dx: -0.7, dy: -0.1, growAt: 0.62 },
  { dx: 0.6, dy: -0.35, growAt: 0.72 },
  { dx: 0.1, dy: -0.85, growAt: 0.82 },
  { dx: -0.35, dy: -0.7, growAt: 0.9 },
  { dx: 0.75, dy: 0.05, growAt: 0.95 },
];

export const SIDE_TUFTS = [
  { side: -1, yRatio: 0.22, size: 9, leafColor: GREEN[3], growAt: 0.12 },
  { side: 1, yRatio: 0.22, size: 9, leafColor: GREEN[3], growAt: 0.15 },
  { side: -1, yRatio: 0.4, size: 8, leafColor: GREEN[4], growAt: 0.28 },
  { side: 1, yRatio: 0.4, size: 8, leafColor: GREEN[4], growAt: 0.31 },
  { side: -1, yRatio: 0.56, size: 7, leafColor: GREEN[2], growAt: 0.42 },
  { side: 1, yRatio: 0.56, size: 7, leafColor: GREEN[2], growAt: 0.45 },
  { side: -1, yRatio: 0.72, size: 6, leafColor: GREEN[3], growAt: 0.58 },
  { side: 1, yRatio: 0.72, size: 6, leafColor: GREEN[3], growAt: 0.6 },
  { side: -1, yRatio: 0.86, size: 5, leafColor: GREEN[1], growAt: 0.72 },
  { side: 1, yRatio: 0.86, size: 5, leafColor: GREEN[1], growAt: 0.74 },
];

export const ROOTS = [
  { side: -1, angle: -42, length: 22, thickness: 3, growAt: 0.05 },
  { side: 1, angle: 42, length: 22, thickness: 3, growAt: 0.07 },
  { side: -1, angle: -62, length: 16, thickness: 2.5, growAt: 0.15 },
  { side: 1, angle: 62, length: 16, thickness: 2.5, growAt: 0.17 },
  { side: -1, angle: -24, length: 14, thickness: 2, growAt: 0.25 },
  { side: 1, angle: 24, length: 14, thickness: 2, growAt: 0.27 },
  { side: -1, angle: -78, length: 11, thickness: 2, growAt: 0.35 },
  { side: 1, angle: 78, length: 11, thickness: 2, growAt: 0.37 },
];

export const LEAF_FALL_COLORS = ["#66bb6a", "#81c784", "#a5d6a7", "#4caf50", "#ffcc02", "#ffd54f"];
export const SPARKLE_COLORS = ["#ffd54f", "#fff176", "#ffecb3", "#a5d6a7", "#ffffff"];

export function hash(i: number, t: number): number {
  const x = Math.sin(i * 12.9898 + t * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function lerpColor(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ar = (pa >> 16) & 255,
    ag = (pa >> 8) & 255,
    ab = pa & 255;
  const br = (pb >> 16) & 255,
    bg = (pb >> 8) & 255,
    bb = pb & 255;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `#${((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1)}`;
}

export function skyColorAt(progress: number, key: "glow" | "halo"): string {
  const p = Math.max(0, Math.min(100, progress));
  for (let i = 0; i < SKY_STOPS.length - 1; i++) {
    const a = SKY_STOPS[i],
      b = SKY_STOPS[i + 1];
    if (p >= a.at && p <= b.at) {
      const t = b.at === a.at ? 0 : (p - a.at) / (b.at - a.at);
      return lerpColor(a[key], b[key], t);
    }
  }
  return SKY_STOPS[SKY_STOPS.length - 1][key];
}

export function smoothstep(x: number): number {
  const c = Math.max(0, Math.min(1, x));
  return c * c * (3 - 2 * c);
}

// ── Banyan Tree Game Constants ──

export const MAX_POMODOROS = 512;
export const MAX_AGE = 400;

/** 1 pomodoro = 400/512 = 0.78125 years */
export const YEARS_PER_POMODORO = MAX_AGE / MAX_POMODOROS;

export function treeAge(pomodoros: number): number {
  return pomodoros * YEARS_PER_POMODORO;
}

export interface TreeStage {
  minPomodoros: number;
  name: string;
  emoji: string;
  ageAtStart: number;
  unlocks: string[];
}

export const TREE_STAGES: TreeStage[] = [
  {
    minPomodoros: 0, name: "Germination", emoji: "\u{1F331}",
    ageAtStart: 0, unlocks: ["Seed", "Tiny roots", "First leaves", "Small grass"],
  },
  {
    minPomodoros: 32, name: "Sapling", emoji: "\u{1F33F}",
    ageAtStart: 25, unlocks: ["Taller trunk", "More leaves", "Bark texture", "Small branches"],
  },
  {
    minPomodoros: 64, name: "Young Tree", emoji: "\uD83C\uDF33",
    ageAtStart: 50, unlocks: ["Multiple branches", "Larger canopy", "More grass", "Flowers"],
  },
  {
    minPomodoros: 128, name: "Growing Banyan", emoji: "\uD83C\uDF34",
    ageAtStart: 100, unlocks: ["Thick trunk", "Dense leaves", "Birds appear"],
  },
  {
    minPomodoros: 192, name: "Mature Banyan", emoji: "\u{1F333}",
    ageAtStart: 150, unlocks: ["First aerial roots", "Wider canopy", "Moss starts growing"],
  },
  {
    minPomodoros: 256, name: "Expanding Giant", emoji: "\uD83C\uDF32",
    ageAtStart: 200, unlocks: ["More aerial roots", "Hanging vines", "Rocks", "Bushes"],
  },
  {
    minPomodoros: 320, name: "Ancient Tree", emoji: "\u{1F3DB}",
    ageAtStart: 250, unlocks: ["Roots reach ground", "Secondary trunks", "Large canopy", "Birds nest"],
  },
  {
    minPomodoros: 384, name: "Sacred Banyan", emoji: "\u{1F4AB}",
    ageAtStart: 300, unlocks: ["Fireflies", "Butterflies", "Flowers", "Moss everywhere"],
  },
  {
    minPomodoros: 448, name: "Legendary Banyan", emoji: "\u{1F451}",
    ageAtStart: 350, unlocks: ["Huge trunk network", "Massive canopy", "Light rays", "Rich ecosystem"],
  },
];

export function getTreeStage(pomodoros: number): { stage: TreeStage; index: number } {
  for (let i = TREE_STAGES.length - 1; i >= 0; i--) {
    if (pomodoros >= TREE_STAGES[i].minPomodoros) {
      return { stage: TREE_STAGES[i], index: i };
    }
  }
  return { stage: TREE_STAGES[0], index: 0 };
}

// ── Feature growAt values mapped to 512-pomodoro timeline ──
// t = (completedPomodoros + sessionProgress) / 512
// Stage boundaries: 0.0625, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875

export const BANYAN_CANOPY = [
  // Stage 1 — Germination (t ≤ 0.0625): tiny first leaves
  { dx: 0, dy: -0.15, r: 1.0, layer: 0, growAt: 0.01 },
  { dx: -0.25, dy: -0.1, r: 0.5, layer: 0, growAt: 0.03 },
  { dx: 0.25, dy: -0.1, r: 0.5, layer: 0, growAt: 0.05 },
  // Stage 2 — Sapling (t ≤ 0.125): more leaves
  { dx: -0.45, dy: -0.18, r: 0.88, layer: 0, growAt: 0.08 },
  { dx: 0.45, dy: -0.18, r: 0.88, layer: 0, growAt: 0.1 },
  { dx: -0.15, dy: -0.35, r: 0.6, layer: 0, growAt: 0.11 },
  { dx: 0.15, dy: -0.35, r: 0.6, layer: 0, growAt: 0.12 },
  // Stage 3 — Young Tree (t ≤ 0.25): larger canopy, mid blobs
  { dx: -0.75, dy: -0.32, r: 0.72, layer: 1, growAt: 0.14 },
  { dx: 0.75, dy: -0.32, r: 0.72, layer: 1, growAt: 0.16 },
  { dx: -0.3, dy: -0.52, r: 0.68, layer: 1, growAt: 0.18 },
  { dx: 0.3, dy: -0.52, r: 0.68, layer: 1, growAt: 0.2 },
  { dx: -0.6, dy: -0.4, r: 0.5, layer: 1, growAt: 0.22 },
  { dx: 0.6, dy: -0.4, r: 0.5, layer: 1, growAt: 0.24 },
  // Stage 4 — Growing Banyan (t ≤ 0.375): dense canopy
  { dx: -0.25, dy: -0.65, r: 0.42, layer: 1, growAt: 0.26 },
  { dx: 0.25, dy: -0.65, r: 0.42, layer: 1, growAt: 0.28 },
  { dx: -1.05, dy: -0.22, r: 0.58, layer: 2, growAt: 0.3 },
  { dx: 1.05, dy: -0.22, r: 0.58, layer: 2, growAt: 0.32 },
  { dx: -0.7, dy: -0.5, r: 0.4, layer: 2, growAt: 0.34 },
  { dx: 0.7, dy: -0.5, r: 0.4, layer: 2, growAt: 0.36 },
  // Stage 5 — Mature Banyan (t ≤ 0.5): wider canopy
  { dx: -0.85, dy: -0.55, r: 0.52, layer: 2, growAt: 0.39 },
  { dx: 0.85, dy: -0.55, r: 0.52, layer: 2, growAt: 0.41 },
  { dx: -0.5, dy: -0.78, r: 0.42, layer: 2, growAt: 0.43 },
  { dx: 0.5, dy: -0.78, r: 0.42, layer: 2, growAt: 0.45 },
  { dx: 0, dy: -0.82, r: 0.55, layer: 1, growAt: 0.47 },
  // Stage 6 — Expanding Giant (t ≤ 0.625): far canopy starts
  { dx: -1.25, dy: -0.12, r: 0.42, layer: 3, growAt: 0.51 },
  { dx: 1.25, dy: -0.12, r: 0.42, layer: 3, growAt: 0.53 },
  { dx: -0.3, dy: -0.85, r: 0.3, layer: 3, growAt: 0.55 },
  { dx: 0.3, dy: -0.85, r: 0.3, layer: 3, growAt: 0.57 },
  { dx: -0.2, dy: -0.88, r: 0.38, layer: 1, growAt: 0.59 },
  { dx: 0.2, dy: -0.88, r: 0.38, layer: 1, growAt: 0.61 },
  // Stage 7 — Ancient Tree (t ≤ 0.75): full canopy
  { dx: -0.95, dy: -0.65, r: 0.4, layer: 3, growAt: 0.64 },
  { dx: 0.95, dy: -0.65, r: 0.4, layer: 3, growAt: 0.66 },
  { dx: -0.35, dy: -0.82, r: 0.28, layer: 2, growAt: 0.68 },
  { dx: 0.35, dy: -0.82, r: 0.28, layer: 2, growAt: 0.7 },
  { dx: 0, dy: -0.95, r: 0.32, layer: 1, growAt: 0.72 },
  // Stage 8 — Sacred Banyan (t ≤ 0.875): apex detail
  { dx: -1.15, dy: -0.42, r: 0.36, layer: 3, growAt: 0.76 },
  { dx: 1.15, dy: -0.42, r: 0.36, layer: 3, growAt: 0.78 },
  { dx: -0.12, dy: -0.92, r: 0.22, layer: 2, growAt: 0.8 },
  { dx: 0.12, dy: -0.92, r: 0.22, layer: 2, growAt: 0.82 },
  // Stage 9 — Legendary (t > 0.875): final touches
  { dx: -0.95, dy: -0.35, r: 0.28, layer: 3, growAt: 0.88 },
  { dx: 0.95, dy: -0.35, r: 0.28, layer: 3, growAt: 0.9 },
  { dx: 0, dy: -0.7, r: 0.2, layer: 1, growAt: 0.92 },
];

export const BANYAN_AERIAL_ROOTS = [
  // Stage 5 — Mature Banyan (t ~0.4): first aerial roots
  { dx: -0.45, dy: -0.12, maxLen: 0.75, thickness: 2.5, growAt: 0.39 },
  { dx: 0.45, dy: -0.12, maxLen: 0.75, thickness: 2.5, growAt: 0.41 },
  { dx: -0.75, dy: -0.2, maxLen: 0.55, thickness: 2, growAt: 0.43 },
  { dx: 0.75, dy: -0.2, maxLen: 0.55, thickness: 2, growAt: 0.45 },
  // Stage 6 — Expanding Giant (t ~0.55): more roots
  { dx: -0.95, dy: -0.16, maxLen: 0.45, thickness: 2, growAt: 0.51 },
  { dx: 0.95, dy: -0.16, maxLen: 0.45, thickness: 2, growAt: 0.53 },
  { dx: -0.65, dy: -0.32, maxLen: 0.65, thickness: 2.5, growAt: 0.55 },
  { dx: 0.65, dy: -0.32, maxLen: 0.65, thickness: 2.5, growAt: 0.57 },
  // Stage 7 — Ancient Tree (t ~0.65): roots lengthen
  { dx: -0.25, dy: -0.42, maxLen: 0.85, thickness: 3, growAt: 0.64 },
  { dx: 0.25, dy: -0.42, maxLen: 0.85, thickness: 3, growAt: 0.66 },
  { dx: -1.05, dy: -0.06, maxLen: 0.35, thickness: 2, growAt: 0.68 },
  { dx: 1.05, dy: -0.06, maxLen: 0.35, thickness: 2, growAt: 0.7 },
  // Stage 8 — Sacred Banyan (t ~0.8): dense aerial roots
  { dx: -0.85, dy: -0.42, maxLen: 0.55, thickness: 2.5, growAt: 0.76 },
  { dx: 0.85, dy: -0.42, maxLen: 0.55, thickness: 2.5, growAt: 0.78 },
  { dx: -0.55, dy: -0.52, maxLen: 0.7, thickness: 2, growAt: 0.82 },
  { dx: 0.55, dy: -0.52, maxLen: 0.7, thickness: 2, growAt: 0.84 },
];

export const BANYAN_PROP_ROOTS = [
  // Stage 7 — Ancient Tree (t ~0.65): first prop roots
  { dx: -0.35, dy: -0.15, spread: 0.55, thickness: 5, growAt: 0.65 },
  { dx: 0.35, dy: -0.15, spread: 0.55, thickness: 5, growAt: 0.67 },
  { dx: -0.55, dy: -0.25, spread: 0.75, thickness: 4, growAt: 0.69 },
  { dx: 0.55, dy: -0.25, spread: 0.75, thickness: 4, growAt: 0.71 },
  // Stage 8 — Sacred Banyan (t ~0.8): more prop roots
  { dx: -0.15, dy: -0.1, spread: 0.35, thickness: 6, growAt: 0.77 },
  { dx: 0.15, dy: -0.1, spread: 0.35, thickness: 6, growAt: 0.79 },
  // Stage 9 — Legendary (t > 0.88): full prop root network
  { dx: -0.7, dy: -0.35, spread: 0.9, thickness: 3.5, growAt: 0.88 },
  { dx: 0.7, dy: -0.35, spread: 0.9, thickness: 3.5, growAt: 0.9 },
];

export const BANYAN_FIGS = [
  // Stage 4 — Growing Banyan (t ~0.3): first figs
  { dx: -0.25, dy: -0.22, size: 3.5, growAt: 0.28 },
  { dx: 0.55, dy: -0.26, size: 3, growAt: 0.3 },
  // Stage 5 — Mature Banyan (t ~0.42): more figs
  { dx: -0.65, dy: -0.12, size: 4, growAt: 0.4 },
  { dx: 0.28, dy: -0.38, size: 3, growAt: 0.42 },
  { dx: 0.12, dy: -0.18, size: 4, growAt: 0.44 },
  // Stage 6 — Expanding Giant (t ~0.55): figs spread
  { dx: -0.48, dy: -0.42, size: 3.5, growAt: 0.52 },
  { dx: 0.78, dy: -0.16, size: 3, growAt: 0.54 },
  { dx: -0.08, dy: -0.55, size: 4, growAt: 0.56 },
  // Stage 7 — Ancient Tree (t ~0.68): full fig set
  { dx: 0.88, dy: -0.38, size: 3.5, growAt: 0.65 },
  { dx: -0.82, dy: -0.52, size: 3, growAt: 0.67 },
  // Stage 8 — Sacred Banyan (t ~0.8): figs everywhere
  { dx: -0.88, dy: -0.38, size: 3, growAt: 0.78 },
  { dx: 0.48, dy: -0.52, size: 3.5, growAt: 0.8 },
  // Stage 9 — Legendary (t > 0.9): final figs
  { dx: -0.38, dy: -0.62, size: 3, growAt: 0.88 },
  { dx: 0.38, dy: -0.62, size: 3, growAt: 0.9 },
];

export const FIG_COLORS = ["#8d6e63", "#6d4c41", "#5d4037", "#4e342e", "#7b1fa2", "#6a1b9a"];

// ── Seasons ──

export type Season = "spring" | "summer" | "autumn" | "winter";

export function getSeason(t: number): Season {
  if (t < 0.25) return "spring";
  if (t < 0.50) return "summer";
  if (t < 0.75) return "autumn";
  return "winter";
}

export function getSeasonProgress(t: number): number {
  return ((t % 0.25) / 0.25) || 0;
}

export const SEASON_CANOPY: Record<Season, string[]> = {
  spring: ["#c8e6c9", "#a5d6a7", "#81c784", "#66bb6a", "#4caf50", "#f8bbd0", "#f48fb1"],
  summer: ["#a5d6a7", "#81c784", "#66bb6a", "#43a047", "#2e7d32", "#388e3c", "#1b5e20"],
  autumn: ["#ffe0b2", "#ffcc80", "#ffb74d", "#ff8a65", "#a1887f", "#ef5350", "#e53935"],
  winter: ["#cfd8dc", "#b0bec5", "#90a4ae", "#78909c", "#607d8b", "#546e7a", "#455a64"],
};

export const SEASON_ACCENT: Record<Season, string> = {
  spring: "#f8bbd0",
  summer: "#ffd54f",
  autumn: "#ff8a65",
  winter: "#b0bec5",
};

export const SEASON_CANOPY_MOD: Record<Season, {
  scale: number;
  peripheralShrink: number;
  swayDuration: number;
  swayAmp: number;
  snowCaps: boolean;
  blossom: boolean;
}> = {
  spring:  { scale: 0.92, peripheralShrink: 1.0, swayDuration: 8000,  swayAmp: 1.0, snowCaps: false, blossom: true },
  summer:  { scale: 1.15, peripheralShrink: 1.0, swayDuration: 11000, swayAmp: 0.6, snowCaps: false, blossom: false },
  autumn:  { scale: 0.80, peripheralShrink: 0.25, swayDuration: 7000, swayAmp: 1.3, snowCaps: false, blossom: false },
  winter:  { scale: 0.45, peripheralShrink: 0.08, swayDuration: 14000, swayAmp: 0.4, snowCaps: true,  blossom: false },
};

export const SEASON_GROUND: Record<Season, {
  ground: string;
  groundFar: string;
  mountain: string;
  mountainFar: string;
}> = {
  spring: { ground: "#2d5a2d", groundFar: "#1a3a1a", mountain: "#2a4a3a", mountainFar: "#3a5a4a" },
  summer: { ground: "#1a4a1a", groundFar: "#0d2d0d", mountain: "#1a3a2a", mountainFar: "#2a4a3a" },
  autumn: { ground: "#5a4a2a", groundFar: "#3a2a1a", mountain: "#3a2a1a", mountainFar: "#4a3a2a" },
  winter: { ground: "#4a5a6a", groundFar: "#3a4a5a", mountain: "#4a5a6a", mountainFar: "#606e7c" },
};
