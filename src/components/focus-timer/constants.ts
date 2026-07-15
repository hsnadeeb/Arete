import type { LucideIconName } from "../../constants/typography";

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

export interface LevelInfo {
  minTrees: number;
  title: string;
  iconKey: LucideIconName;
}

export const LEVELS: LevelInfo[] = [
  { minTrees: 0, title: "Seedling", iconKey: "Sprout" },
  { minTrees: 15, title: "Sprout", iconKey: "TreePine" },
  { minTrees: 45, title: "Sapling", iconKey: "TreePine" },
  { minTrees: 90, title: "Forest Keeper", iconKey: "TreeDeciduous" },
  { minTrees: 150, title: "Forest Guardian", iconKey: "Mountain" },
  { minTrees: 300, title: "Ancient Forest", iconKey: "TreePine" },
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
  return ((i * 16807 + t * 100) % 2147483647) / 2147483647;
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

export function getLevel(trees: number): LevelInfo {
  let lvl = LEVELS[0];
  for (const l of LEVELS) {
    if (trees >= l.minTrees) lvl = l;
  }
  return lvl;
}

export function nextLevelTrees(trees: number): number {
  for (const l of LEVELS) {
    if (trees < l.minTrees) return l.minTrees - trees;
  }
  return 0;
}

export function smoothstep(x: number): number {
  const c = Math.max(0, Math.min(1, x));
  return c * c * (3 - 2 * c);
}

// ── Banyan Life Cycle Stages ──

export interface BanyanStage {
  at: number;
  name: string;
  emoji: string;
}

export const BANYAN_STAGES: BanyanStage[] = [
  { at: 0, name: "Germination", emoji: "\u{1F331}" },
  { at: 0.08, name: "Seedling", emoji: "\u{1F33F}" },
  { at: 0.20, name: "Sapling", emoji: "\uD83C\uDF33" },
  { at: 0.40, name: "Young Banyan", emoji: "\uD83C\uDF34" },
  { at: 0.60, name: "Maturing", emoji: "\u{1F333}" },
  { at: 0.80, name: "Mature Banyan", emoji: "\u{1F3DB}" },
  { at: 0.92, name: "Ancient Banyan", emoji: "\u{1F451}" },
];

export function getBanyanStage(pct: number): {
  name: string;
  emoji: string;
  index: number;
  at: number;
} {
  const t = Math.min(1, Math.max(0, pct / 100));
  let stage = BANYAN_STAGES[0];
  let idx = 0;
  for (let i = BANYAN_STAGES.length - 1; i >= 0; i--) {
    if (t >= BANYAN_STAGES[i].at) {
      stage = BANYAN_STAGES[i];
      idx = i;
      break;
    }
  }
  return { name: stage.name, emoji: stage.emoji, index: idx, at: stage.at };
}

export const BANYAN_CANOPY = [
  // Core mass (layer 0)
  { dx: 0, dy: -0.15, r: 1.0, layer: 0, growAt: 0.1 },
  { dx: -0.45, dy: -0.18, r: 0.88, layer: 0, growAt: 0.14 },
  { dx: 0.45, dy: -0.18, r: 0.88, layer: 0, growAt: 0.17 },
  { dx: -0.15, dy: -0.35, r: 0.6, layer: 0, growAt: 0.21 },
  { dx: 0.15, dy: -0.35, r: 0.6, layer: 0, growAt: 0.23 },
  // Mid canopy (layer 1)
  { dx: -0.75, dy: -0.32, r: 0.72, layer: 1, growAt: 0.25 },
  { dx: 0.75, dy: -0.32, r: 0.72, layer: 1, growAt: 0.28 },
  { dx: -0.3, dy: -0.52, r: 0.68, layer: 1, growAt: 0.34 },
  { dx: 0.3, dy: -0.52, r: 0.68, layer: 1, growAt: 0.37 },
  { dx: -0.6, dy: -0.4, r: 0.5, layer: 1, growAt: 0.3 },
  { dx: 0.6, dy: -0.4, r: 0.5, layer: 1, growAt: 0.32 },
  { dx: -0.25, dy: -0.65, r: 0.42, layer: 1, growAt: 0.42 },
  { dx: 0.25, dy: -0.65, r: 0.42, layer: 1, growAt: 0.44 },
  // Upper canopy (layer 2)
  { dx: -1.05, dy: -0.22, r: 0.58, layer: 2, growAt: 0.44 },
  { dx: 1.05, dy: -0.22, r: 0.58, layer: 2, growAt: 0.47 },
  { dx: -0.85, dy: -0.55, r: 0.52, layer: 2, growAt: 0.54 },
  { dx: 0.85, dy: -0.55, r: 0.52, layer: 2, growAt: 0.57 },
  { dx: -0.7, dy: -0.5, r: 0.4, layer: 2, growAt: 0.5 },
  { dx: 0.7, dy: -0.5, r: 0.4, layer: 2, growAt: 0.52 },
  { dx: -0.5, dy: -0.78, r: 0.42, layer: 2, growAt: 0.5 },
  { dx: 0.5, dy: -0.78, r: 0.42, layer: 2, growAt: 0.52 },
  // Far canopy (layer 3)
  { dx: -1.25, dy: -0.12, r: 0.42, layer: 3, growAt: 0.64 },
  { dx: 1.25, dy: -0.12, r: 0.42, layer: 3, growAt: 0.67 },
  { dx: -0.95, dy: -0.65, r: 0.4, layer: 3, growAt: 0.71 },
  { dx: 0.95, dy: -0.65, r: 0.4, layer: 3, growAt: 0.74 },
  { dx: -1.15, dy: -0.42, r: 0.36, layer: 3, growAt: 0.78 },
  { dx: 1.15, dy: -0.42, r: 0.36, layer: 3, growAt: 0.8 },
  { dx: -0.3, dy: -0.85, r: 0.3, layer: 3, growAt: 0.65 },
  { dx: 0.3, dy: -0.85, r: 0.3, layer: 3, growAt: 0.67 },
  // Top (layer 1, grows early for a rounded apex)
  { dx: 0, dy: -0.82, r: 0.55, layer: 1, growAt: 0.4 },
  { dx: -0.2, dy: -0.88, r: 0.38, layer: 1, growAt: 0.5 },
  { dx: 0.2, dy: -0.88, r: 0.38, layer: 1, growAt: 0.52 },
  { dx: -0.35, dy: -0.82, r: 0.28, layer: 2, growAt: 0.55 },
  { dx: 0.35, dy: -0.82, r: 0.28, layer: 2, growAt: 0.57 },
  { dx: 0, dy: -0.95, r: 0.32, layer: 1, growAt: 0.6 },
  { dx: -0.12, dy: -0.92, r: 0.22, layer: 2, growAt: 0.62 },
  { dx: 0.12, dy: -0.92, r: 0.22, layer: 2, growAt: 0.64 },
];

export const BANYAN_AERIAL_ROOTS = [
  { dx: -0.75, dy: -0.2, maxLen: 0.55, thickness: 2, growAt: 0.22 },
  { dx: 0.75, dy: -0.2, maxLen: 0.55, thickness: 2, growAt: 0.24 },
  { dx: -0.45, dy: -0.12, maxLen: 0.75, thickness: 2.5, growAt: 0.32 },
  { dx: 0.45, dy: -0.12, maxLen: 0.75, thickness: 2.5, growAt: 0.34 },
  { dx: -0.95, dy: -0.16, maxLen: 0.45, thickness: 2, growAt: 0.42 },
  { dx: 0.95, dy: -0.16, maxLen: 0.45, thickness: 2, growAt: 0.44 },
  { dx: -0.65, dy: -0.32, maxLen: 0.65, thickness: 2.5, growAt: 0.52 },
  { dx: 0.65, dy: -0.32, maxLen: 0.65, thickness: 2.5, growAt: 0.54 },
  { dx: -0.25, dy: -0.42, maxLen: 0.85, thickness: 3, growAt: 0.62 },
  { dx: 0.25, dy: -0.42, maxLen: 0.85, thickness: 3, growAt: 0.64 },
  { dx: -1.05, dy: -0.06, maxLen: 0.35, thickness: 2, growAt: 0.7 },
  { dx: 1.05, dy: -0.06, maxLen: 0.35, thickness: 2, growAt: 0.72 },
  { dx: -0.85, dy: -0.42, maxLen: 0.55, thickness: 2.5, growAt: 0.78 },
  { dx: 0.85, dy: -0.42, maxLen: 0.55, thickness: 2.5, growAt: 0.8 },
  { dx: -0.55, dy: -0.52, maxLen: 0.7, thickness: 2, growAt: 0.84 },
  { dx: 0.55, dy: -0.52, maxLen: 0.7, thickness: 2, growAt: 0.86 },
];

export const BANYAN_PROP_ROOTS = [
  { dx: -0.35, dy: -0.15, spread: 0.55, thickness: 5, growAt: 0.48 },
  { dx: 0.35, dy: -0.15, spread: 0.55, thickness: 5, growAt: 0.5 },
  { dx: -0.55, dy: -0.25, spread: 0.75, thickness: 4, growAt: 0.62 },
  { dx: 0.55, dy: -0.25, spread: 0.75, thickness: 4, growAt: 0.64 },
  { dx: -0.15, dy: -0.1, spread: 0.35, thickness: 6, growAt: 0.72 },
  { dx: 0.15, dy: -0.1, spread: 0.35, thickness: 6, growAt: 0.74 },
  { dx: -0.7, dy: -0.35, spread: 0.9, thickness: 3.5, growAt: 0.82 },
  { dx: 0.7, dy: -0.35, spread: 0.9, thickness: 3.5, growAt: 0.84 },
];

export const BANYAN_FIGS = [
  { dx: -0.25, dy: -0.22, size: 3.5, growAt: 0.42 },
  { dx: 0.55, dy: -0.26, size: 3, growAt: 0.46 },
  { dx: -0.65, dy: -0.12, size: 4, growAt: 0.5 },
  { dx: 0.28, dy: -0.38, size: 3, growAt: 0.55 },
  { dx: -0.48, dy: -0.42, size: 3.5, growAt: 0.6 },
  { dx: 0.78, dy: -0.16, size: 3, growAt: 0.65 },
  { dx: -0.08, dy: -0.55, size: 4, growAt: 0.7 },
  { dx: 0.88, dy: -0.38, size: 3.5, growAt: 0.74 },
  { dx: -0.82, dy: -0.52, size: 3, growAt: 0.78 },
  { dx: 0.12, dy: -0.18, size: 4, growAt: 0.46 },
  { dx: -0.88, dy: -0.38, size: 3, growAt: 0.82 },
  { dx: 0.48, dy: -0.52, size: 3.5, growAt: 0.85 },
  { dx: -0.38, dy: -0.62, size: 3, growAt: 0.88 },
  { dx: 0.38, dy: -0.62, size: 3, growAt: 0.9 },
];

export const FIG_COLORS = ["#8d6e63", "#6d4c41", "#5d4037", "#4e342e", "#7b1fa2", "#6a1b9a"];
