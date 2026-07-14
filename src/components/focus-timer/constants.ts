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
