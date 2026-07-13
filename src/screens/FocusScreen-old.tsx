import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Easing,
  Vibration,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "../components/Icons";
import { LUCIDE_ICONS, TYPOGRAPHY } from "../constants/typography";
import { useStore } from "../store";
import { useTheme } from "../context/ThemeContext";
import * as db from "../db/service";

// ─────────────────────────────────────────────────────────────────────────────
// PROFESSIONAL POMODORO TREE — Fixed-coordinate scene with geometry reveal.
// Nothing is independently resized. The tree grows by revealing predesigned
// segments, branches, leaf clusters, canopy layers, roots, flowers and wildlife.
// ─────────────────────────────────────────────────────────────────────────────

const DURATIONS = [
  { label: "40m", value: 40 * 60 },
  { label: "25m", value: 25 * 60 },
  { label: "15m", value: 15 * 60 },
  { label: "5m", value: 5 * 60 },
];

// ─── Fixed coordinate system ───
const CANVAS = { W: 1000, H: 1400 };
const CENTER_X = CANVAS.W / 2;
const TREE_BOTTOM = CANVAS.H * 0.9; // tree stays planted at 90% of canvas
const TRUNK_HEIGHT = 820; // total trunk height from TREE_BOTTOM up to the crown (top segment topY)
// FIX: "bottom"-style absolute positioning is an offset from the container's
// BOTTOM edge, while TREE_BOTTOM is a top-down Y coordinate. Using TREE_BOTTOM
// directly as a "bottom" value pushed the mountains almost entirely off the
// top of the canvas. Convert once here and reuse.
const GROUND_OFFSET = CANVAS.H - TREE_BOTTOM;

// ─── Color palette (dark AMOLED + natural tree tones) ───
const PALETTE = {
  bg: "#05070A",
  ground: "#111827",
  mountain: "#0B1220",
  fog: "rgba(10, 20, 35, 0.45)",
  trunk: "#5B4636",
  trunkDark: "#4A382B",
  trunkLight: "#6D5442",
  leaf: "#4ADE80",
  leafHighlight: "#86EFAC",
  glow: "#A7F3D0",
  flower: "#F9A8D4",
  flower2: "#FCD34D",
  flower3: "#C4B5FD",
  fruit: "#FB7185",
  bird: "#E2E8F0",
  butterfly: "#FCD34D",
  firefly: "#FDE047",
  particle: "#A7F3D0",
};

// ─── Growth stages (completed Pomodoros / total trees) ───
const STAGES = [
  { minTrees: 0, key: "seed", label: "Seed" },
  { minTrees: 5, key: "sprout", label: "Sprout" },
  { minTrees: 15, key: "plant", label: "Plant" },
  { minTrees: 30, key: "sapling", label: "Sapling" },
  { minTrees: 60, key: "young", label: "Young Tree" },
  { minTrees: 120, key: "mature", label: "Mature" },
  { minTrees: 250, key: "ancient", label: "Ancient" },
  { minTrees: 500, key: "legendary", label: "Legendary" },
];

const LEVELS = [
  { minTrees: 0, title: "Seedling", iconKey: "Sprout" as const },
  { minTrees: 5, title: "Sprout", iconKey: "TreePine" as const },
  { minTrees: 15, title: "Sapling", iconKey: "TreePine" as const },
  { minTrees: 30, title: "Forest Keeper", iconKey: "TreeDeciduous" as const },
  { minTrees: 50, title: "Forest Guardian", iconKey: "Mountain" as const },
  { minTrees: 100, title: "Ancient Forest", iconKey: "TreePine" as const },
];

const XP_PER_TREE = 100; // arbitrary XP unit per completed tree

// ─── Trunk geometry: each segment is artist-designed, revealed progressively ───
// Coordinates are in fixed canvas space. The trunk rises from TREE_BOTTOM upward.
const TRUNK_SEGMENTS: {
  id: string;
  bottomY: number;
  topY: number;
  bottomW: number;
  topW: number;
  revealAt: number; // 0-1 progress threshold
  shade?: string;
}[] = [
  {
    id: "rootBase",
    bottomY: TREE_BOTTOM,
    topY: TREE_BOTTOM - 70,
    bottomW: 180,
    topW: 140,
    revealAt: 0,
    shade: "#00000022",
  },
  {
    id: "base",
    bottomY: TREE_BOTTOM - 70,
    topY: TREE_BOTTOM - 200,
    bottomW: 120,
    topW: 92,
    revealAt: 0.04,
    shade: "#00000028",
  },
  {
    id: "segment1",
    bottomY: TREE_BOTTOM - 200,
    topY: TREE_BOTTOM - 380,
    bottomW: 92,
    topW: 70,
    revealAt: 0.12,
    shade: "#00000020",
  },
  {
    id: "segment2",
    bottomY: TREE_BOTTOM - 380,
    topY: TREE_BOTTOM - 560,
    bottomW: 70,
    topW: 54,
    revealAt: 0.28,
    shade: "#0000001a",
  },
  {
    id: "segment3",
    bottomY: TREE_BOTTOM - 560,
    topY: TREE_BOTTOM - 720,
    bottomW: 54,
    topW: 40,
    revealAt: 0.45,
    shade: "#00000016",
  },
  {
    id: "top",
    bottomY: TREE_BOTTOM - 720,
    topY: TREE_BOTTOM - 820,
    bottomW: 40,
    topW: 24,
    revealAt: 0.62,
    shade: "#00000014",
  },
];

// ─── Branch definitions ───
// Each branch has a fixed anchor on the trunk. Growth increases length or reveals
// children. Angles are in degrees, 0 = pointing up, positive = clockwise.
type BranchDef = {
  id: string;
  anchorSegment: number; // index in TRUNK_SEGMENTS
  anchorT: number; // 0..1 position along that segment
  angle: number;
  maxLength: number;
  thickness: number;
  revealAt: number;
  children?: BranchDef[];
};

const BRANCHES: BranchDef[] = [
  // Lower primary branches
  {
    id: "bL1",
    anchorSegment: 2,
    anchorT: 0.55,
    angle: -55,
    maxLength: 170,
    thickness: 18,
    revealAt: 0.18,
    children: [
      {
        id: "bL1a",
        anchorSegment: 99,
        anchorT: 0.75,
        angle: -35,
        maxLength: 90,
        thickness: 11,
        revealAt: 0.28,
      },
    ],
  },
  {
    id: "bR1",
    anchorSegment: 2,
    anchorT: 0.55,
    angle: 55,
    maxLength: 170,
    thickness: 18,
    revealAt: 0.2,
    children: [
      {
        id: "bR1a",
        anchorSegment: 99,
        anchorT: 0.75,
        angle: 35,
        maxLength: 90,
        thickness: 11,
        revealAt: 0.3,
      },
    ],
  },
  // Mid primary branches
  {
    id: "bL2",
    anchorSegment: 3,
    anchorT: 0.5,
    angle: -48,
    maxLength: 220,
    thickness: 15,
    revealAt: 0.32,
    children: [
      {
        id: "bL2a",
        anchorSegment: 99,
        anchorT: 0.8,
        angle: -25,
        maxLength: 110,
        thickness: 9,
        revealAt: 0.44,
      },
    ],
  },
  {
    id: "bR2",
    anchorSegment: 3,
    anchorT: 0.5,
    angle: 48,
    maxLength: 220,
    thickness: 15,
    revealAt: 0.34,
    children: [
      {
        id: "bR2a",
        anchorSegment: 99,
        anchorT: 0.8,
        angle: 25,
        maxLength: 110,
        thickness: 9,
        revealAt: 0.46,
      },
    ],
  },
  // Upper primary branches
  {
    id: "bL3",
    anchorSegment: 4,
    anchorT: 0.45,
    angle: -42,
    maxLength: 180,
    thickness: 12,
    revealAt: 0.5,
    children: [
      {
        id: "bL3a",
        anchorSegment: 99,
        anchorT: 0.75,
        angle: -22,
        maxLength: 90,
        thickness: 7,
        revealAt: 0.6,
      },
    ],
  },
  {
    id: "bR3",
    anchorSegment: 4,
    anchorT: 0.45,
    angle: 42,
    maxLength: 180,
    thickness: 12,
    revealAt: 0.52,
    children: [
      {
        id: "bR3a",
        anchorSegment: 99,
        anchorT: 0.75,
        angle: 22,
        maxLength: 90,
        thickness: 7,
        revealAt: 0.62,
      },
    ],
  },
  // Crown branches
  {
    id: "bC1",
    anchorSegment: 5,
    anchorT: 0.35,
    angle: -28,
    maxLength: 150,
    thickness: 9,
    revealAt: 0.65,
  },
  {
    id: "bC2",
    anchorSegment: 5,
    anchorT: 0.35,
    angle: 28,
    maxLength: 150,
    thickness: 9,
    revealAt: 0.67,
  },
  {
    id: "bC3",
    anchorSegment: 5,
    anchorT: 0.25,
    angle: 0,
    maxLength: 130,
    thickness: 8,
    revealAt: 0.7,
  },
];

// ─── Leaf clusters ───
// Each cluster is a predesigned silhouette. We do not generate 40-120 individual
// leaves; instead a cluster is a reusable multi-lobe shape rendered as one View.
type ClusterDef = {
  id: string;
  attachBranch: string | "trunk" | "root";
  attachT: number;
  size: number;
  layer: "back" | "front";
  revealAt: number;
  swayDelay: number;
  colorMix: number; // 0 = leaf, 1 = leafHighlight
};

const LEAF_CLUSTERS: ClusterDef[] = [
  // Back layer (darker)
  {
    id: "cB1",
    attachBranch: "bL2",
    attachT: 0.8,
    size: 130,
    layer: "back",
    revealAt: 0.34,
    swayDelay: 0,
    colorMix: 0.2,
  },
  {
    id: "cB2",
    attachBranch: "bR2",
    attachT: 0.8,
    size: 130,
    layer: "back",
    revealAt: 0.36,
    swayDelay: 0.3,
    colorMix: 0.2,
  },
  {
    id: "cB3",
    attachBranch: "bL3",
    attachT: 0.8,
    size: 110,
    layer: "back",
    revealAt: 0.52,
    swayDelay: 0.5,
    colorMix: 0.25,
  },
  {
    id: "cB4",
    attachBranch: "bR3",
    attachT: 0.8,
    size: 110,
    layer: "back",
    revealAt: 0.54,
    swayDelay: 0.7,
    colorMix: 0.25,
  },
  {
    id: "cB5",
    attachBranch: "bC1",
    attachT: 0.85,
    size: 90,
    layer: "back",
    revealAt: 0.68,
    swayDelay: 0.2,
    colorMix: 0.3,
  },
  {
    id: "cB6",
    attachBranch: "bC2",
    attachT: 0.85,
    size: 90,
    layer: "back",
    revealAt: 0.69,
    swayDelay: 0.9,
    colorMix: 0.3,
  },

  // Front layer (lighter)
  {
    id: "cF1",
    attachBranch: "bL1",
    attachT: 0.8,
    size: 110,
    layer: "front",
    revealAt: 0.22,
    swayDelay: 0.1,
    colorMix: 0.55,
  },
  {
    id: "cF2",
    attachBranch: "bR1",
    attachT: 0.8,
    size: 110,
    layer: "front",
    revealAt: 0.24,
    swayDelay: 0.4,
    colorMix: 0.55,
  },
  {
    id: "cF3",
    attachBranch: "bL2a",
    attachT: 0.8,
    size: 100,
    layer: "front",
    revealAt: 0.46,
    swayDelay: 0.6,
    colorMix: 0.65,
  },
  {
    id: "cF4",
    attachBranch: "bR2a",
    attachT: 0.8,
    size: 100,
    layer: "front",
    revealAt: 0.48,
    swayDelay: 0.25,
    colorMix: 0.65,
  },
  {
    id: "cF5",
    attachBranch: "bL3a",
    attachT: 0.8,
    size: 85,
    layer: "front",
    revealAt: 0.62,
    swayDelay: 0.75,
    colorMix: 0.7,
  },
  {
    id: "cF6",
    attachBranch: "bR3a",
    attachT: 0.8,
    size: 85,
    layer: "front",
    revealAt: 0.64,
    swayDelay: 0.15,
    colorMix: 0.7,
  },
  {
    id: "cF7",
    attachBranch: "bC3",
    attachT: 0.85,
    size: 80,
    layer: "front",
    revealAt: 0.72,
    swayDelay: 0.5,
    colorMix: 0.75,
  },
  {
    id: "cF8",
    attachBranch: "trunk",
    attachT: 0,
    size: 60,
    layer: "front",
    revealAt: 0.08,
    swayDelay: 0.35,
    colorMix: 0.5,
  }, // tiny sprout
];

// ─── Canopy layers ───
// Fade in layer by layer; each layer is a soft silhouette blob behind the tree.
const CANOPY_LAYERS = [
  {
    id: "l1",
    cx: CENTER_X - 80,
    cy: TREE_BOTTOM - 850,
    rx: 240,
    ry: 160,
    revealAt: 0.24,
    opacity: 0.28,
  },
  {
    id: "l2",
    cx: CENTER_X + 70,
    cy: TREE_BOTTOM - 890,
    rx: 260,
    ry: 170,
    revealAt: 0.36,
    opacity: 0.25,
  },
  {
    id: "l3",
    cx: CENTER_X,
    cy: TREE_BOTTOM - 940,
    rx: 230,
    ry: 150,
    revealAt: 0.5,
    opacity: 0.22,
  },
  {
    id: "l4",
    cx: CENTER_X - 50,
    cy: TREE_BOTTOM - 980,
    rx: 180,
    ry: 120,
    revealAt: 0.64,
    opacity: 0.2,
  },
  {
    id: "l5",
    cx: CENTER_X + 40,
    cy: TREE_BOTTOM - 1000,
    rx: 150,
    ry: 100,
    revealAt: 0.76,
    opacity: 0.18,
  },
];

// ─── Root system ───
// Roots grow downward in stages by revealing more segments, never by scaling.
type RootDef = {
  id: string;
  xOffset: number; // from center
  yStart: number;
  angle: number; // degrees, 90 = straight down, positive = right
  length: number;
  thickness: number;
  stages: { revealAt: number; length: number }[];
};

const ROOTS: RootDef[] = [
  {
    id: "rL1",
    xOffset: -50,
    yStart: TREE_BOTTOM - 20,
    angle: 105,
    length: 180,
    thickness: 18,
    stages: [
      { revealAt: 0, length: 30 },
      { revealAt: 0.06, length: 80 },
      { revealAt: 0.14, length: 130 },
      { revealAt: 0.25, length: 180 },
    ],
  },
  {
    id: "rL2",
    xOffset: -90,
    yStart: TREE_BOTTOM - 40,
    angle: 115,
    length: 140,
    thickness: 13,
    stages: [
      { revealAt: 0.04, length: 25 },
      { revealAt: 0.12, length: 70 },
      { revealAt: 0.22, length: 110 },
      { revealAt: 0.35, length: 140 },
    ],
  },
  {
    id: "rR1",
    xOffset: 50,
    yStart: TREE_BOTTOM - 20,
    angle: 75,
    length: 180,
    thickness: 18,
    stages: [
      { revealAt: 0, length: 30 },
      { revealAt: 0.06, length: 80 },
      { revealAt: 0.14, length: 130 },
      { revealAt: 0.25, length: 180 },
    ],
  },
  {
    id: "rR2",
    xOffset: 90,
    yStart: TREE_BOTTOM - 40,
    angle: 65,
    length: 140,
    thickness: 13,
    stages: [
      { revealAt: 0.04, length: 25 },
      { revealAt: 0.12, length: 70 },
      { revealAt: 0.22, length: 110 },
      { revealAt: 0.35, length: 140 },
    ],
  },
  {
    id: "rC",
    xOffset: 0,
    yStart: TREE_BOTTOM - 10,
    angle: 90,
    length: 120,
    thickness: 16,
    stages: [
      { revealAt: 0.02, length: 20 },
      { revealAt: 0.1, length: 60 },
      { revealAt: 0.2, length: 100 },
      { revealAt: 0.3, length: 120 },
    ],
  },
];

// ─── Flowers & fruit spots ───
type FlowerDef = {
  id: string;
  clusterId: string;
  dx: number;
  dy: number;
  color: string;
  revealAt: number;
};
const FLOWERS: FlowerDef[] = [
  {
    id: "f1",
    clusterId: "cF3",
    dx: -20,
    dy: 10,
    color: PALETTE.flower,
    revealAt: 0.55,
  },
  {
    id: "f2",
    clusterId: "cF4",
    dx: 20,
    dy: -5,
    color: PALETTE.flower2,
    revealAt: 0.58,
  },
  {
    id: "f3",
    clusterId: "cF5",
    dx: 0,
    dy: 15,
    color: PALETTE.flower3,
    revealAt: 0.68,
  },
  {
    id: "f4",
    clusterId: "cF1",
    dx: 15,
    dy: 15,
    color: PALETTE.flower,
    revealAt: 0.72,
  },
  {
    id: "f5",
    clusterId: "cF7",
    dx: -10,
    dy: 0,
    color: PALETTE.flower2,
    revealAt: 0.78,
  },
];

type FruitDef = {
  id: string;
  clusterId: string;
  dx: number;
  dy: number;
  revealAt: number;
};
const FRUITS: FruitDef[] = [
  { id: "fr1", clusterId: "cF1", dx: -10, dy: 25, revealAt: 0.85 },
  { id: "fr2", clusterId: "cF3", dx: 25, dy: -10, revealAt: 0.88 },
  { id: "fr3", clusterId: "cF5", dx: 10, dy: -20, revealAt: 0.92 },
  { id: "fr4", clusterId: "cF7", dx: -20, dy: 10, revealAt: 0.95 },
];

// ─── Wildlife definitions ───
type BirdDef = {
  id: string;
  revealAt: number;
  x: number;
  y: number;
  scale: number;
};
const BIRDS: BirdDef[] = [
  {
    id: "bird1",
    revealAt: 0.48,
    x: CENTER_X + 220,
    y: TREE_BOTTOM - 820,
    scale: 1,
  },
  {
    id: "bird2",
    revealAt: 0.7,
    x: CENTER_X - 250,
    y: TREE_BOTTOM - 760,
    scale: 0.8,
  },
  {
    id: "bird3",
    revealAt: 0.88,
    x: CENTER_X + 180,
    y: TREE_BOTTOM - 920,
    scale: 0.7,
  },
];

// ─── Helper math ───
function clamp(n: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, n));
}

function smoothstep(x: number): number {
  const c = clamp(x);
  return c * c * (3 - 2 * c);
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

function lerpColor(a: string, b: string, t: number) {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const r = Math.round(lerp(ca.r, cb.r, t));
  const g = Math.round(lerp(ca.g, cb.g, t));
  const bl = Math.round(lerp(ca.b, cb.b, t));
  return `rgb(${r},${g},${bl})`;
}

function getStage(totalTrees: number) {
  let stage = STAGES[0];
  for (const s of STAGES) if (totalTrees >= s.minTrees) stage = s;
  return stage;
}

function getLevel(trees: number) {
  let lvl = LEVELS[0];
  for (const l of LEVELS) if (trees >= l.minTrees) lvl = l;
  return lvl;
}

function nextLevelTrees(trees: number): number {
  for (const l of LEVELS) if (trees < l.minTrees) return l.minTrees - trees;
  return 0;
}

function hash(i: number, t: number): number {
  return ((i * 16807 + t * 100) % 2147483647) / 2147483647;
}

// ─── Coordinate projection ───
function segmentAnchorPoint(segmentIdx: number, t: number) {
  const seg = TRUNK_SEGMENTS[segmentIdx];
  if (!seg) return { x: CENTER_X, y: TREE_BOTTOM };
  const y = lerp(seg.bottomY, seg.topY, t);
  const w = lerp(seg.bottomW, seg.topW, t);
  return { x: CENTER_X, y, w };
}

function computeBranchEnd(
  branch: BranchDef,
  progress: number,
  parentEnd?: { x: number; y: number },
): { x: number; y: number } {
  let ax = CENTER_X;
  let ay = TREE_BOTTOM;
  if (parentEnd) {
    ax = parentEnd.x;
    ay = parentEnd.y;
  } else if (branch.anchorSegment !== 99) {
    const pt = segmentAnchorPoint(branch.anchorSegment, branch.anchorT);
    ax = pt.x;
    ay = pt.y;
  }
  const revealed = smoothstep(
    (progress - branch.revealAt) / Math.max(0.001, 1 - branch.revealAt),
  );
  const len = branch.maxLength * revealed;
  const rad = toRad(branch.angle - 90);
  return { x: ax + Math.cos(rad) * len, y: ay + Math.sin(rad) * len };
}

function collectBranchPositions(
  branches: BranchDef[],
  progress: number,
  parentEnd?: { x: number; y: number },
): Record<
  string,
  {
    start: { x: number; y: number };
    end: { x: number; y: number };
    angle: number;
  }
> {
  const map: Record<
    string,
    {
      start: { x: number; y: number };
      end: { x: number; y: number };
      angle: number;
    }
  > = {};
  for (const b of branches) {
    let start = { x: CENTER_X, y: TREE_BOTTOM };
    if (parentEnd) start = parentEnd;
    else if (b.anchorSegment !== 99) {
      const pt = segmentAnchorPoint(b.anchorSegment, b.anchorT);
      start = { x: pt.x, y: pt.y };
    }
    const end = computeBranchEnd(b, progress, parentEnd);
    map[b.id] = { start, end, angle: b.angle };
    if (b.children) {
      const childMap = collectBranchPositions(b.children, progress, end);
      Object.assign(map, childMap);
    }
  }
  return map;
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENE COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function SceneContainer({ children }: { children: React.ReactNode }) {
  const [size, setSize] = useState({
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  });
  const scale = Math.min(size.width / CANVAS.W, size.height / CANVAS.H);
  return (
    <View
      style={[s.sceneWrap, { width: size.width, height: size.height }]}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setSize({ width, height });
      }}
    >
      <View
        style={[
          s.scene,
          { width: CANVAS.W, height: CANVAS.H, transform: [{ scale }] },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

function Background({ progress }: { progress: number }) {
  // Sky dark AMOLED, subtle gradient via overlays.
  const glowOpacity = useMemo(
    () => clamp(progress / 100) * 0.35 + 0.1,
    [progress],
  );
  return (
    <View style={s.background}>
      <View style={[s.skyBase, { backgroundColor: PALETTE.bg }]} />
      <View
        style={[
          s.skyGlow,
          {
            opacity: glowOpacity,
            backgroundColor: PALETTE.glow,
          },
        ]}
      />
      {/* Mountains */}
      <View style={[s.mountainLeft, { borderBottomColor: PALETTE.mountain }]} />
      <View
        style={[s.mountainRight, { borderBottomColor: PALETTE.mountain }]}
      />
      {/* Fog */}
      <View style={[s.fog, { backgroundColor: PALETTE.fog }]} />
      {/* Ground */}
      <View
        style={[
          s.ground,
          { backgroundColor: PALETTE.ground, top: TREE_BOTTOM - 40 },
        ]}
      />
    </View>
  );
}

function TrunkSegment({
  seg,
  progress,
}: {
  seg: (typeof TRUNK_SEGMENTS)[0];
  progress: number;
}) {
  const revealed = smoothstep(
    (progress - seg.revealAt) / Math.max(0.001, 1 - seg.revealAt),
  );
  if (revealed <= 0.001) return null;

  const h = seg.bottomY - seg.topY;
  const topW = seg.topW * revealed;
  const bottomW = seg.bottomW * revealed;
  const side = (bottomW - topW) / 2;
  // Tapered trapezoid via CSS border trick: width forms the top edge,
  // side borders form the slant, bottom border forms the base.
  return (
    <>
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: CENTER_X - topW / 2,
          top: seg.topY,
          width: topW,
          height: 0,
          borderLeftWidth: side,
          borderRightWidth: side,
          borderBottomWidth: h,
          borderBottomColor: PALETTE.trunk,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          opacity: revealed,
        }}
      />
      {seg.shade && (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: CENTER_X,
            top: seg.topY,
            width: bottomW / 2,
            height: h,
            backgroundColor: seg.shade,
            opacity: revealed,
          }}
        />
      )}
    </>
  );
}

function BranchShape({
  branch,
  progress,
  sway,
  parentEnd,
}: {
  branch: BranchDef;
  progress: number;
  sway: Animated.Value;
  parentEnd?: { x: number; y: number };
}) {
  let anchorX = CENTER_X;
  let anchorY = TREE_BOTTOM;
  if (parentEnd) {
    anchorX = parentEnd.x;
    anchorY = parentEnd.y;
  } else if (branch.anchorSegment !== 99) {
    const pt = segmentAnchorPoint(branch.anchorSegment, branch.anchorT);
    anchorX = pt.x;
    anchorY = pt.y;
  }

  const revealed = smoothstep(
    (progress - branch.revealAt) / Math.max(0.001, 1 - branch.revealAt),
  );
  const len = branch.maxLength * revealed;
  if (len < 1) return null;

  const rad = toRad(branch.angle - 90);
  const endX = anchorX + Math.cos(rad) * len;
  const endY = anchorY + Math.sin(rad) * len;

  // Rotate around the anchor (left edge). Transform array is applied right-to-left,
  // so we move the center to the anchor, rotate, then move back.
  return (
    <>
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: anchorX,
          top: anchorY - branch.thickness / 2,
          width: len,
          height: branch.thickness,
          borderRadius: branch.thickness / 2,
          backgroundColor: PALETTE.trunk,
          transform: [
            { translateX: len / 2 },
            { rotate: `${branch.angle - 90}deg` },
            { translateX: -len / 2 },
          ],
          opacity: revealed,
        }}
      />
      {branch.children?.map((child) => (
        <BranchShape
          key={child.id}
          branch={child}
          progress={progress}
          sway={sway}
          parentEnd={{ x: endX, y: endY }}
        />
      ))}
    </>
  );
}

function LeafClusterShape({
  cluster,
  progress,
  sway,
}: {
  cluster: ClusterDef;
  progress: number;
  sway: Animated.Value;
}) {
  const revealed = smoothstep(
    (progress - cluster.revealAt) / Math.max(0.001, 1 - cluster.revealAt),
  );
  if (revealed <= 0.01) return null;

  let x = CENTER_X;
  let y = TREE_BOTTOM;
  if (cluster.attachBranch === "trunk") {
    // Calculate position along trunk using attachT (0 = bottom, 1 = top)
    const yPosition = TREE_BOTTOM - TRUNK_HEIGHT * cluster.attachT;
    x = CENTER_X;
    y = yPosition;
  } else {
    const branchPos = collectBranchPositions(BRANCHES, progress);
    const pos = branchPos[cluster.attachBranch];
    if (pos) {
      const len = pos.end
        ? Math.hypot(pos.end.x - pos.start.x, pos.end.y - pos.start.y) *
          cluster.attachT
        : 0;
      const rad = toRad(pos.angle - 90);
      x = pos.start.x + Math.cos(rad) * len;
      y = pos.start.y + Math.sin(rad) * len;
    }
  }

  const color = lerpColor(
    PALETTE.leaf,
    PALETTE.leafHighlight,
    cluster.colorMix,
  );
  const z = cluster.layer === "back" ? 3 : 5;

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: x - cluster.size / 2,
        top: y - cluster.size / 2,
        width: cluster.size,
        height: cluster.size,
        zIndex: z,
        opacity: 0.85 * revealed,
        transform: [
          {
            rotate: sway.interpolate({
              inputRange: [-1, 1],
              outputRange: [
                `${-0.8 + cluster.swayDelay * 0.3}deg`,
                `${0.8 + cluster.swayDelay * 0.3}deg`,
              ],
            }),
          },
        ],
      }}
    >
      {/* Cluster built from overlapping ovals to suggest 40-120 leaves without drawing each one */}
      <View
        style={[
          s.lobe,
          {
            width: cluster.size * 0.9,
            height: cluster.size * 0.6,
            backgroundColor: color,
            left: cluster.size * 0.05,
            top: cluster.size * 0.1,
          },
        ]}
      />
      <View
        style={[
          s.lobe,
          {
            width: cluster.size * 0.7,
            height: cluster.size * 0.5,
            backgroundColor: color,
            left: 0,
            top: cluster.size * 0.25,
          },
        ]}
      />
      <View
        style={[
          s.lobe,
          {
            width: cluster.size * 0.7,
            height: cluster.size * 0.5,
            backgroundColor: color,
            left: cluster.size * 0.3,
            top: cluster.size * 0.22,
          },
        ]}
      />
      <View
        style={[
          s.lobe,
          {
            width: cluster.size * 0.55,
            height: cluster.size * 0.45,
            backgroundColor: lerpColor(color, PALETTE.leafHighlight, 0.4),
            left: cluster.size * 0.22,
            top: 0,
          },
        ]}
      />
      <View
        style={[
          s.lobe,
          {
            width: cluster.size * 0.45,
            height: cluster.size * 0.4,
            backgroundColor: lerpColor(color, PALETTE.glow, 0.25),
            left: cluster.size * 0.27,
            top: cluster.size * 0.35,
          },
        ]}
      />
    </Animated.View>
  );
}

function findBranch(list: BranchDef[], id: string): BranchDef | null {
  for (const b of list) {
    if (b.id === id) return b;
    if (b.children) {
      const found = findBranch(b.children, id);
      if (found) return found;
    }
  }
  return null;
}

function CanopyLayer({
  layer,
  progress,
  sway,
}: {
  layer: (typeof CANOPY_LAYERS)[0];
  progress: number;
  sway: Animated.Value;
}) {
  const revealed = smoothstep(
    (progress - layer.revealAt) / Math.max(0.001, 1 - layer.revealAt),
  );
  if (revealed <= 0.01) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: layer.cx - layer.rx,
        top: layer.cy - layer.ry,
        width: layer.rx * 2,
        height: layer.ry * 2,
        borderRadius: Math.max(layer.rx, layer.ry),
        backgroundColor: PALETTE.leaf,
        opacity: layer.opacity * revealed,
        zIndex: 2,
        transform: [
          {
            rotate: sway.interpolate({
              inputRange: [-1, 1],
              outputRange: ["-0.5deg", "0.5deg"],
            }),
          },
        ],
      }}
    />
  );
}

function RootShape({ root, progress }: { root: RootDef; progress: number }) {
  let currentLength = 0;
  for (const stage of root.stages) {
    if (progress >= stage.revealAt) currentLength = stage.length;
  }
  if (currentLength < 2) return null;

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: CENTER_X + root.xOffset,
        top: root.yStart,
        width: currentLength,
        height: root.thickness,
        borderRadius: root.thickness / 2,
        backgroundColor: PALETTE.trunkDark,
        transform: [
          { translateX: currentLength / 2 },
          { rotate: `${root.angle}deg` },
          { translateX: -currentLength / 2 },
        ],
        opacity: 0.95,
      }}
    />
  );
}

// FIX: Flower previously had no reveal gating at all — it rendered at full
// opacity the moment its cluster existed in `clusterPositions`, regardless of
// progress. That's why flowers appeared floating on screen even at 0% growth.
// Now it fades in using its own `revealAt`, exactly like every other element.
function Flower({
  flower,
  clusterPositions,
  progress,
}: {
  flower: FlowerDef;
  clusterPositions: Record<string, { x: number; y: number }>;
  progress: number;
}) {
  const pos = clusterPositions[flower.clusterId];
  if (!pos) return null;
  const revealed = smoothstep(
    (progress - flower.revealAt) / Math.max(0.001, 1 - flower.revealAt),
  );
  if (revealed <= 0.01) return null;
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: pos.x + flower.dx - 6,
        top: pos.y + flower.dy - 6,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: flower.color,
        zIndex: 6,
        opacity: revealed,
      }}
    />
  );
}

// FIX: same missing reveal gating as Flower — Fruit now respects its own
// `revealAt` instead of always rendering at full opacity.
function Fruit({
  fruit,
  clusterPositions,
  progress,
}: {
  fruit: FruitDef;
  clusterPositions: Record<string, { x: number; y: number }>;
  progress: number;
}) {
  const pos = clusterPositions[fruit.clusterId];
  if (!pos) return null;
  const revealed = smoothstep(
    (progress - fruit.revealAt) / Math.max(0.001, 1 - fruit.revealAt),
  );
  if (revealed <= 0.01) return null;
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: pos.x + fruit.dx - 7,
        top: pos.y + fruit.dy - 7,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: PALETTE.fruit,
        zIndex: 7,
        opacity: revealed,
      }}
    />
  );
}

function Bird({ bird, progress }: { bird: BirdDef; progress: number }) {
  const revealed = smoothstep(
    (progress - bird.revealAt) / Math.max(0.001, 1 - bird.revealAt),
  );
  if (revealed <= 0.01) return null;
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: bird.x,
        top: bird.y,
        zIndex: 8,
        opacity: revealed,
        transform: [{ scale: bird.scale }],
      }}
    >
      <View style={[s.birdBody, { backgroundColor: PALETTE.bird }]} />
      <View style={[s.birdWingL, { borderBottomColor: PALETTE.bird }]} />
      <View style={[s.birdWingR, { borderBottomColor: PALETTE.bird }]} />
    </View>
  );
}

function FireflyParticle({
  seed,
  active,
  originX,
  originY,
  spread,
}: {
  seed: number;
  active: boolean;
  originX: number;
  originY: number;
  spread: number;
}) {
  const rise = useRef(new Animated.Value(0)).current;
  const drift = useRef(new Animated.Value(0)).current;
  const twinkle = useRef(new Animated.Value(0)).current;
  const startX = originX + (hash(seed, 0.11) * 2 - 1) * spread;
  const startY = originY + (hash(seed, 0.6) * 2 - 1) * (spread * 0.5);
  const size = 3 + hash(seed, 0.77) * 3;
  const duration = 4000 + hash(seed, 0.33) * 3000;
  const delay = hash(seed, 0.55) * 2500;

  useEffect(() => {
    if (!active) return;
    rise.setValue(0);
    drift.setValue(0);
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(rise, {
            toValue: 1,
            duration,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(delay),
          Animated.loop(
            Animated.sequence([
              Animated.timing(drift, {
                toValue: 1,
                duration: duration / 3,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
              }),
              Animated.timing(drift, {
                toValue: -1,
                duration: duration / 3,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
              }),
            ]),
            { iterations: 3 },
          ),
        ]),
        Animated.loop(
          Animated.sequence([
            Animated.timing(twinkle, {
              toValue: 1,
              duration: 700,
              useNativeDriver: true,
            }),
            Animated.timing(twinkle, {
              toValue: 0.2,
              duration: 700,
              useNativeDriver: true,
            }),
          ]),
        ),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active]);

  if (!active) return null;
  const travel = spread * 0.6;
  const translateY = rise.interpolate({
    inputRange: [0, 1],
    outputRange: [travel, -travel],
  });
  const translateX = drift.interpolate({
    inputRange: [-1, 1],
    outputRange: [-spread * 0.25, spread * 0.25],
  });
  const opacity = rise.interpolate({
    inputRange: [0, 0.15, 0.85, 1],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: startX,
        top: startY,
        width: size,
        height: size,
        borderRadius: size,
        backgroundColor: PALETTE.firefly,
        opacity: Animated.multiply(opacity, twinkle),
        zIndex: 9,
        transform: [{ translateY }, { translateX }],
        shadowColor: PALETTE.firefly,
        shadowOpacity: 0.9,
        shadowRadius: 5,
      }}
    />
  );
}

function AmbientParticles({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <>
      {Array.from({ length: 6 }, (_, i) => (
        <FireflyParticle
          key={i}
          seed={i + 200}
          active={active}
          originX={CENTER_X}
          originY={TREE_BOTTOM - 750}
          spread={280}
        />
      ))}
    </>
  );
}

// ─── Main tree scene ───
function GrowingTree({ pct, running }: { pct: number; running: boolean }) {
  const progress = clamp(pct / 100);

  // Idle wind sway: 0.8° left/right, trunk barely moves, leaves independently.
  const sway = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(sway, {
          toValue: -1,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // Cluster positions memoized for flower/fruit attachment
  const clusterPositions = useMemo(() => {
    const branchPos = collectBranchPositions(BRANCHES, progress);
    const map: Record<string, { x: number; y: number }> = {};
    for (const c of LEAF_CLUSTERS) {
      let x = CENTER_X;
      let y = TREE_BOTTOM;
      if (c.attachBranch === "trunk") {
        // Calculate position along trunk using attachT (0 = bottom, 1 = top)
        y = TREE_BOTTOM - TRUNK_HEIGHT * c.attachT;
        x = CENTER_X;
      } else {
        const pos = branchPos[c.attachBranch];
        const b = findBranch(BRANCHES, c.attachBranch);
        if (pos && b) {
          const revealedBranch = smoothstep(
            (progress - b.revealAt) / Math.max(0.001, 1 - b.revealAt),
          );
          const len = b.maxLength * revealedBranch * c.attachT;
          const rad = toRad(pos.angle - 90);
          x = pos.start.x + Math.cos(rad) * len;
          y = pos.start.y + Math.sin(rad) * len;
        }
      }
      map[c.id] = { x, y };
    }
    return map;
  }, [progress]);

  const swayRotate = sway.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-0.6deg", "0.6deg"],
  });

  return (
    <SceneContainer>
      <View style={StyleSheet.absoluteFill}>
        <Background progress={pct} />

        {/* Layer ordering: Sky → Mountains → Fog → Back Leaves → Branches → Front Leaves → Flowers → Fruit → Birds → Particles → Glow */}

        {/* Back leaves / canopy */}
        {CANOPY_LAYERS.map((l) => (
          <CanopyLayer key={l.id} layer={l} progress={progress} sway={sway} />
        ))}
        {LEAF_CLUSTERS.filter((c) => c.layer === "back").map((c) => (
          <LeafClusterShape
            key={c.id}
            cluster={c}
            progress={progress}
            sway={sway}
          />
        ))}

        {/* Roots (never move) */}
        {ROOTS.map((r) => (
          <RootShape key={r.id} root={r} progress={progress} />
        ))}

        {/* Trunk (barely sways) */}
        <Animated.View
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: CANVAS.W,
            height: CANVAS.H,
            zIndex: 3,
            transform: [
              { translateX: -CENTER_X },
              { translateY: -TREE_BOTTOM },
              { rotate: swayRotate },
              { translateX: CENTER_X },
              { translateY: TREE_BOTTOM },
            ],
          }}
        >
          {TRUNK_SEGMENTS.map((seg) => (
            <TrunkSegment key={seg.id} seg={seg} progress={progress} />
          ))}
          {BRANCHES.map((b) => (
            <BranchShape
              key={b.id}
              branch={b}
              progress={progress}
              sway={sway}
            />
          ))}
        </Animated.View>

        {/* Front leaves */}
        {LEAF_CLUSTERS.filter((c) => c.layer === "front").map((c) => (
          <LeafClusterShape
            key={c.id}
            cluster={c}
            progress={progress}
            sway={sway}
          />
        ))}

        {/* Flowers */}
        {FLOWERS.map((f) => (
          <Flower
            key={f.id}
            flower={f}
            clusterPositions={clusterPositions}
            progress={progress}
          />
        ))}

        {/* Fruit */}
        {FRUITS.map((f) => (
          <Fruit
            key={f.id}
            fruit={f}
            clusterPositions={clusterPositions}
            progress={progress}
          />
        ))}

        {/* Birds */}
        {BIRDS.map((b) => (
          <Bird key={b.id} bird={b} progress={progress} />
        ))}

        {/* Fireflies & ambient particles */}
        <AmbientParticles active={running} />

        {/* Soft glow overlay at canopy */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: CENTER_X - 250,
            top: TREE_BOTTOM - 1050,
            width: 500,
            height: 500,
            borderRadius: 250,
            backgroundColor: PALETTE.glow,
            opacity: running ? 0.08 : 0.04,
            zIndex: 10,
          }}
        />
      </View>
    </SceneContainer>
  );
}

// ─── Celebration effects ───
const SPARK = ["#ffd54f", "#fff176", "#ffecb3", "#a5d6a7", "#A7F3D0"];
const CONFETTI = [
  "#43a047",
  "#ffd54f",
  "#f48fb1",
  "#4fc3f7",
  "#ce93d8",
  "#ff8a65",
];

function BurstParticle({
  seed,
  colorSet,
  onDone,
  trigger,
}: {
  seed: number;
  colorSet: string[];
  onDone: () => void;
  trigger: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const angle = hash(seed, 0.21) * Math.PI * 2;
  const dist = 60 + hash(seed, 0.63) * 90;
  const size = 5 + hash(seed, 0.44) * 5;
  const color = colorSet[Math.floor(hash(seed, 0.88) * colorSet.length)];

  useEffect(() => {
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 1000 + hash(seed, 0.15) * 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => finished && onDone());
  }, [trigger]);

  const tx = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.cos(angle) * dist],
  });
  const ty = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.sin(angle) * dist - 40],
  });
  const opacity = anim.interpolate({
    inputRange: [0, 0.15, 0.75, 1],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: 100 - size / 2,
        top: 150,
        width: size,
        height: size,
        borderRadius: size,
        backgroundColor: color,
        opacity,
        transform: [{ translateX: tx }, { translateY: ty }],
      }}
    />
  );
}

function CelebrationBurst({
  trigger,
  colorSet,
  count = 14,
}: {
  trigger: number;
  colorSet: string[];
  count?: number;
}) {
  const [active, setActive] = useState(false);
  const doneCount = useRef(0);
  useEffect(() => {
    if (trigger > 0) {
      doneCount.current = 0;
      setActive(true);
    }
  }, [trigger]);
  if (!active) return null;
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <BurstParticle
          key={`${trigger}-${i}`}
          seed={i + trigger * 100}
          colorSet={colorSet}
          trigger={trigger}
          onDone={() => {
            doneCount.current += 1;
            if (doneCount.current >= count) setActive(false);
          }}
        />
      ))}
    </>
  );
}

function ConfettiPiece({ seed, trigger }: { seed: number; trigger: number }) {
  const fall = useRef(new Animated.Value(0)).current;
  const startX = hash(seed, 0.12) * 180 + 10;
  const size = 5 + hash(seed, 0.51) * 5;
  const color = CONFETTI[seed % CONFETTI.length];
  const duration = 1600 + hash(seed, 0.66) * 900;
  const delay = hash(seed, 0.34) * 300;

  useEffect(() => {
    fall.setValue(0);
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(fall, {
        toValue: 1,
        duration,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [trigger]);

  const translateY = fall.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 260],
  });
  const translateX = fall.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, hash(seed, 0.9) * 30 - 15, hash(seed, 0.2) * 40 - 20],
  });
  const rotate = fall.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", `${(hash(seed, 0.4) > 0.5 ? 1 : -1) * 540}deg`],
  });
  const opacity = fall.interpolate({
    inputRange: [0, 0.85, 1],
    outputRange: [1, 1, 0],
  });

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: startX,
        top: 0,
        width: size,
        height: size * 0.4,
        backgroundColor: color,
        opacity,
        transform: [{ translateY }, { translateX }, { rotate }],
      }}
    />
  );
}

function ConfettiField({ trigger }: { trigger: number }) {
  if (trigger === 0) return null;
  return (
    <View pointerEvents="none" style={s.confettiField}>
      {Array.from({ length: 36 }, (_, i) => (
        <ConfettiPiece key={`${trigger}-${i}`} seed={i} trigger={trigger} />
      ))}
    </View>
  );
}

function LevelUpBanner({
  visible,
  title,
  iconKey,
}: {
  visible: boolean;
  title: string;
  iconKey: string;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.spring(anim, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.delay(1400),
        Animated.timing(anim, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[s.levelUpWrap, { opacity: anim, transform: [{ scale }] }]}
    >
      <View style={s.levelUpCard}>
        <Icon name={iconKey as any} size={22} color="#ffd54f" />
        <Text style={s.levelUpTitle}>Level Up!</Text>
        <Text style={s.levelUpSub}>{title}</Text>
      </View>
    </Animated.View>
  );
}

// ─── Main screen ───
export default function FocusScreen() {
  const { theme } = useTheme();
  const tc = theme.colors;
  const setCurrentRoute = useStore((s) => s.setCurrentRoute);

  const [duration, setDuration] = useState(25 * 60);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [stats, setStats] = useState({
    totalTrees: 0,
    totalSessions: 0,
    streak: 0,
    todaySessions: 0,
  });
  const [milestone, setMilestone] = useState<number | null>(null);
  const [screensaver, setScreensaver] = useState(false);
  const [burstTrigger, setBurstTrigger] = useState(0);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [levelUpVisible, setLevelUpVisible] = useState(false);
  const [xpPop, setXpPop] = useState<{ amount: number; visible: boolean }>({
    amount: 0,
    visible: false,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animMilestone = useRef(new Animated.Value(0)).current;
  const lastActivityRef = useRef(Date.now());
  const lastTapRef = useRef(0);
  const prevLevelTitleRef = useRef<string | null>(null);
  const streakPulse = useRef(new Animated.Value(1)).current;
  const doneGlow = useRef(new Animated.Value(0)).current;
  const completedRef = useRef(false);

  const progress = duration > 0 ? (elapsed / duration) * 100 : 0;
  const remaining = duration - elapsed;
  const min = Math.floor(remaining / 60);
  const sec = remaining % 60;
  const treesThisSession = Math.floor(elapsed / 300);
  const level = useMemo(() => getLevel(stats.totalTrees), [stats.totalTrees]);
  const toNext = useMemo(
    () => nextLevelTrees(stats.totalTrees),
    [stats.totalTrees],
  );

  useEffect(() => {
    db.getFocusStats().then(setStats);
  }, []);

  useEffect(() => {
    if (done) db.getFocusStats().then(setStats);
  }, [done]);

  // Level-up detection
  useEffect(() => {
    if (prevLevelTitleRef.current === null) {
      prevLevelTitleRef.current = level.title;
      return;
    }
    if (level.title !== prevLevelTitleRef.current) {
      prevLevelTitleRef.current = level.title;
      setLevelUpVisible(true);
      setBurstTrigger((v) => v + 1);
      Vibration.vibrate([0, 60, 60, 120]);
      const timer = setTimeout(() => setLevelUpVisible(false), 1800);
      return () => clearTimeout(timer);
    }
  }, [level.title]);

  // Streak pulse
  useEffect(() => {
    if (stats.streak > 0) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(streakPulse, {
            toValue: 1.18,
            duration: 650,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(streakPulse, {
            toValue: 1,
            duration: 650,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
  }, [stats.streak > 0]);

  // Tick
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => {
          const next = prev + 1;
          return Math.min(next, duration);
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, duration]);

  // Handle completion
  useEffect(() => {
    if (elapsed >= duration && running && !completedRef.current) {
      completedRef.current = true;
      setRunning(false);
      setDone(true);
      Vibration.vibrate([0, 200, 100, 200]);
      db.saveFocusSession(duration, duration);
      setMilestone(100);
      setConfettiTrigger((v) => v + 1);
      setBurstTrigger((v) => v + 1);
      setXpPop({ amount: XP_PER_TREE, visible: true });
      Animated.sequence([
        Animated.timing(doneGlow, {
          toValue: 1,
          duration: 500,
          useNativeDriver: false,
        }),
        Animated.timing(doneGlow, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [elapsed, running]);

  // Handle XP popup timeout
  useEffect(() => {
    if (xpPop.visible) {
      const timer = setTimeout(() => setXpPop((p) => ({ ...p, visible: false })), 2000);
      return () => clearTimeout(timer);
    }
  }, [xpPop.visible]);

  // Handle milestones
  useEffect(() => {
    if (running && elapsed > 0) {
      const prevMilestone = Math.floor((elapsed - 1) / (duration / 4));
      const currMilestone = Math.floor(elapsed / (duration / 4));
      if (currMilestone > prevMilestone && currMilestone > 0 && currMilestone < 4) {
        setMilestone(currMilestone * 25);
        Vibration.vibrate(100);
      }
    }
  }, [elapsed, running, duration]);

  // Handle 5-minute interval bursts
  useEffect(() => {
    if (running && elapsed > 0) {
      const prevIntervals = Math.floor((elapsed - 1) / 300);
      const currIntervals = Math.floor(elapsed / 300);
      if (currIntervals > prevIntervals && elapsed % 300 === 0) {
        Vibration.vibrate(80);
        setBurstTrigger((v) => v + 1);
      }
    }
  }, [elapsed, running]);

  // Milestone toast animation
  useEffect(() => {
    if (milestone !== null) {
      animMilestone.setValue(0);
      Animated.sequence([
        Animated.spring(animMilestone, {
          toValue: 1,
          friction: 5,
          tension: 90,
          useNativeDriver: true,
        }),
        Animated.delay(1200),
        Animated.timing(animMilestone, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => setMilestone(null));
    }
  }, [milestone]);

  const handleStart = useCallback(() => {
    if (done) {
      setElapsed(0);
      setDone(false);
      completedRef.current = false;
    }
    setRunning(true);
    lastActivityRef.current = Date.now();
  }, [done]);

  const handlePause = useCallback(() => {
    setRunning(false);
    lastActivityRef.current = Date.now();
  }, []);
  const handleReset = useCallback(() => {
    setRunning(false);
    setElapsed(0);
    setDone(false);
    completedRef.current = false;
    lastActivityRef.current = Date.now();
  }, []);
  const handleDuration = useCallback((d: number) => {
    setDuration(d);
    setElapsed(0);
    setRunning(false);
    setDone(false);
    lastActivityRef.current = Date.now();
  }, []);

  // Screensaver
  useEffect(() => {
    const id = setInterval(() => {
      if (!screensaver && Date.now() - lastActivityRef.current > 10000)
        setScreensaver(true);
    }, 1000);
    return () => clearInterval(id);
  }, [screensaver]);

  const handleScreenTap = useCallback(() => {
    const now = Date.now();
    if (screensaver) {
      if (now - lastTapRef.current < 350) {
        setScreensaver(false);
        lastActivityRef.current = now;
      }
      lastTapRef.current = now;
    } else {
      lastActivityRef.current = now;
    }
  }, [screensaver]);

  const mainBtnGlow = doneGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.9],
  });
  const stage = useMemo(
    () => getStage(stats.totalTrees + treesThisSession),
    [stats.totalTrees, treesThisSession],
  );

  if (screensaver) {
    return (
      <TouchableWithoutFeedback onPress={handleScreenTap}>
        <SafeAreaView
          style={[s.screenSaver, { backgroundColor: PALETTE.bg }]}
          edges={["top", "bottom"]}
        >
          <View style={s.saverBody}>
            <Text
              style={[s.saverTimer, { color: done ? tc.success : "#ffffff" }]}
            >
              {String(min).padStart(2, "0")}:{String(sec).padStart(2, "0")}
            </Text>
            <View style={s.saverTree}>
              <GrowingTree pct={progress} running={running} />
            </View>
            <Text style={s.saverHint}>Double-tap to exit</Text>
          </View>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    );
  }

  return (
    <SafeAreaView
      style={[s.screen, { backgroundColor: PALETTE.bg }]}
      edges={["top", "bottom"]}
      onTouchStart={() => (lastActivityRef.current = Date.now())}
    >
      {/* Header */}
      <View style={[s.header, { borderBottomColor: "#1A1A1A" }]}>
        <TouchableOpacity
          onPress={() => setCurrentRoute("Greeting")}
          style={s.backBtn}
        >
          <Icon
            name={LUCIDE_ICONS.arrowLeft}
            size={20}
            color={tc.textSecondary}
          />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          {DURATIONS.map((d) => (
            <TouchableOpacity
              key={d.value}
              onPress={() => handleDuration(d.value)}
              style={[
                s.durChip,
                {
                  backgroundColor:
                    duration === d.value ? tc.accentBg : tc.bgSecondary,
                  borderColor:
                    duration === d.value ? tc.accent : tc.borderLight,
                },
              ]}
            >
              <Text
                style={[
                  s.durChipText,
                  {
                    color: duration === d.value ? tc.accent : tc.textTertiary,
                    fontWeight: duration === d.value ? "700" : "500",
                  },
                ]}
              >
                {d.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Milestone toast */}
      {milestone !== null && (
        <Animated.View
          style={[
            s.mToast,
            {
              opacity: animMilestone,
              transform: [
                {
                  translateY: animMilestone.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
                {
                  scale: animMilestone.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.85, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={s.mToastText}>
            {milestone === 100
              ? "🌳 Session Complete!"
              : `${milestone}% — Keep going!`}
          </Text>
        </Animated.View>
      )}

      {/* Level up celebration */}
      <LevelUpBanner
        visible={levelUpVisible}
        title={level.title}
        iconKey={level.iconKey}
      />

      {/* XP popup */}
      {xpPop.visible && (
        <View style={s.xpWrap}>
          <Text style={s.xpText}>+{xpPop.amount} XP</Text>
        </View>
      )}

      {/* Body */}
      <View style={s.body}>
        {/* Level badge */}
        <View
          style={[
            s.levelBadge,
            { backgroundColor: tc.bgSecondary, borderColor: tc.borderLight },
          ]}
        >
          <Icon name={level.iconKey as any} size={18} color={tc.text} />
          <Text
            style={[TYPOGRAPHY.bodySm, { fontWeight: "700", color: tc.text }]}
          >
            {level.title}
          </Text>
          <Text style={[TYPOGRAPHY.captionSm, { color: tc.textTertiary }]}>
            {stats.totalTrees + treesThisSession} trees ·{" "}
            {toNext > 0 ? `${toNext} to next` : "Max level"}
          </Text>
          <Text
            style={[
              TYPOGRAPHY.captionSm,
              { color: PALETTE.leaf, marginLeft: 8 },
            ]}
          >
            {stage.label}
          </Text>
        </View>

        {/* Tree stage */}
        <View style={s.treeStage}>
          <GrowingTree pct={progress} running={running} />
          <CelebrationBurst
            trigger={burstTrigger}
            colorSet={SPARK}
            count={12}
          />
          <ConfettiField trigger={confettiTrigger} />
        </View>

        {/* Timer */}
        <View style={s.timerSection}>
          <Text
            style={[s.timerText, { color: done ? tc.success : tc.heading }]}
          >
            {String(min).padStart(2, "0")}:{String(sec).padStart(2, "0")}
          </Text>
          <Text style={[s.timerLabel, { color: tc.textTertiary }]}>
            {done ? "Well done!" : running ? "Stay focused" : "Press start"}
          </Text>
        </View>

        {/* Stats row */}
        <View style={[s.forestStats, { borderColor: tc.borderLight }]}>
          <View style={s.statItem}>
            <Animated.Text
              style={[
                s.statVal,
                { color: tc.warning, transform: [{ scale: streakPulse }] },
              ]}
            >
              {stats.streak}
            </Animated.Text>
            <Text style={[s.statLbl, { color: tc.textTertiary }]}>Streak</Text>
          </View>
          <View style={[s.statDiv, { backgroundColor: tc.borderLight }]} />
          <View style={s.statItem}>
            <Text style={[s.statVal, { color: tc.accent }]}>
              {stats.totalTrees + treesThisSession}
            </Text>
            <Text style={[s.statLbl, { color: tc.textTertiary }]}>Trees</Text>
          </View>
          <View style={[s.statDiv, { backgroundColor: tc.borderLight }]} />
          <View style={s.statItem}>
            <Text style={[s.statVal, { color: PALETTE.leaf }]}>
              {Math.floor(progress)}%
            </Text>
            <Text style={[s.statLbl, { color: tc.textTertiary }]}>Growth</Text>
          </View>
        </View>

        {/* Controls */}
        <View style={s.controls}>
          <TouchableOpacity
            onPress={handleReset}
            style={[s.ctrlBtn, { backgroundColor: tc.bgSecondary }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon
              name={LUCIDE_ICONS.refreshCw}
              size={18}
              color={tc.textTertiary}
            />
          </TouchableOpacity>
          {running ? (
            <TouchableOpacity
              onPress={handlePause}
              style={[s.mainBtn, { backgroundColor: tc.warningBg }]}
            >
              <Icon name={LUCIDE_ICONS.pause} size={22} color={tc.warning} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleStart} activeOpacity={0.85}>
              <Animated.View
                style={[
                  s.mainBtn,
                  {
                    backgroundColor: done ? tc.successBg : tc.accentBg,
                    shadowOpacity: mainBtnGlow,
                    shadowColor: tc.success,
                    shadowRadius: 16,
                  },
                ]}
              >
                <Icon
                  name={done ? LUCIDE_ICONS.check : LUCIDE_ICONS.play}
                  size={22}
                  color={done ? tc.success : tc.accent}
                />
              </Animated.View>
            </TouchableOpacity>
          )}
          <View style={[s.ctrlBtn, { opacity: 0 }]}>
            <Icon name={LUCIDE_ICONS.refreshCw} size={18} color="transparent" />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 52,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  durChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  durChipText: { ...TYPOGRAPHY.bodySm },
  mToast: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 100,
  },
  mToastText: {
    backgroundColor: "rgba(0,0,0,0.75)",
    color: "#fff",
    ...TYPOGRAPHY.body,
    fontWeight: "700",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    overflow: "hidden",
  },
  levelUpWrap: {
    position: "absolute",
    top: 100,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 110,
  },
  levelUpCard: {
    backgroundColor: "rgba(20,20,20,0.9)",
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 14,
    alignItems: "center",
    gap: 2,
    borderWidth: 1,
    borderColor: "rgba(255,213,79,0.4)",
  },
  levelUpTitle: {
    color: "#ffd54f",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  levelUpSub: { color: "#fff", fontWeight: "600", fontSize: 13, opacity: 0.9 },
  xpWrap: {
    position: "absolute",
    top: 150,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 105,
  },
  xpText: {
    color: PALETTE.glow,
    fontWeight: "800",
    fontSize: 18,
    textShadowColor: "rgba(167,243,208,0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  body: {
    flex: 1,
    paddingHorizontal: 28,
    paddingBottom: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 8,
  },
  treeStage: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    position: "relative",
  },
  sceneWrap: {
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  scene: { position: "relative" },
  background: { ...StyleSheet.absoluteFillObject, zIndex: 0 },
  skyBase: { ...StyleSheet.absoluteFillObject },
  skyGlow: {
    position: "absolute",
    left: CENTER_X - 300,
    top: TREE_BOTTOM - 1200,
    width: 600,
    height: 600,
    borderRadius: 300,
  },
  // FIX: was `bottom: TREE_BOTTOM - 80` — TREE_BOTTOM is a top-down Y
  // coordinate, but `bottom` positions from the container's bottom edge.
  // That mismatch shot the mountains almost entirely off the top of the
  // canvas, which is why they showed up as big crossing triangles instead
  // of a horizon line. GROUND_OFFSET does the correct conversion.
  mountainLeft: {
    position: "absolute",
    left: 0,
    bottom: GROUND_OFFSET - 80,
    width: 0,
    height: 0,
    borderLeftWidth: 0,
    borderRightWidth: 450,
    borderBottomWidth: 320,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  mountainRight: {
    position: "absolute",
    right: 0,
    bottom: GROUND_OFFSET - 60,
    width: 0,
    height: 0,
    borderLeftWidth: 420,
    borderRightWidth: 0,
    borderBottomWidth: 280,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  fog: {
    position: "absolute",
    left: 0,
    right: 0,
    top: TREE_BOTTOM - 220,
    height: 180,
  },
  ground: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 200,
    borderTopLeftRadius: 400,
    borderTopRightRadius: 400,
  },
  lobe: { position: "absolute", borderRadius: 999 },
  birdBody: { width: 14, height: 8, borderRadius: 4 },
  birdWingL: {
    position: "absolute",
    left: -4,
    top: 2,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  birdWingR: {
    position: "absolute",
    right: -4,
    top: 2,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  confettiField: {
    position: "absolute",
    top: -20,
    width: 200,
    alignSelf: "center",
    bottom: 0,
  },
  timerSection: { alignItems: "center", marginBottom: 16 },
  timerText: { ...TYPOGRAPHY.monoLg, fontSize: 32 },
  timerLabel: { ...TYPOGRAPHY.label, marginTop: 4 },
  forestStats: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statItem: { flex: 1, alignItems: "center", gap: 2 },
  statVal: { ...TYPOGRAPHY.mono },
  statLbl: { ...TYPOGRAPHY.label },
  statDiv: { width: 1, height: 28 },
  controls: { flexDirection: "row", alignItems: "center", gap: 24 },
  ctrlBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  mainBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  screenSaver: { flex: 1, justifyContent: "center", alignItems: "center" },
  saverBody: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
  },
  saverTimer: { ...TYPOGRAPHY.monoLg, fontSize: 56, letterSpacing: 2 },
  saverTree: { transform: [{ scale: 1.1 }] },
  saverHint: {
    ...TYPOGRAPHY.captionSm,
    color: "rgba(255,255,255,0.35)",
    marginTop: 24,
  },
});
