import React, { useEffect, useRef, useMemo } from "react";
import { View, Animated, Easing, StyleSheet } from "react-native";
import {
  MAX_POMODOROS,
  BANYAN_CANOPY,
  BANYAN_AERIAL_ROOTS,
  BANYAN_PROP_ROOTS,
  BANYAN_FIGS,
  FIG_COLORS,
  BRN,
  BRN_L,
  FLW,
  smoothstep,
  skyColorAt,
  hash,
  getSeason,
  SEASON_CANOPY,
  SEASON_ACCENT,
  SEASON_CANOPY_MOD,
} from "./constants";
import type { Season } from "./constants";
import { Firefly } from "./Firefly";
import { FloatingLeaf } from "./FloatingLeaf";
import { SparkleField } from "./SparkleField";

function hash2(a: number, b: number): number {
  return hash(a * 12.9898 + b * 78.233, 0);
}

function hash3(a: number, b: number, c: number): number {
  return hash(a * 12.9898 + b * 78.233 + c * 43.758, 0);
}

// Generate organic canopy blob data for natural, non-circular shapes
function generateCanopyShape(c: any, season: Season, t: number, isDark: boolean) {
  const baseR = c.r;
  const numVertices = 8;
  const vertices = [];
  const seasonColors = SEASON_CANOPY[season];
  const baseColor = c.color;
  
  // Determine color palette for this blob
  const isOuter = c.layer <= 1;
  const colorVariation = isOuter ? 0.15 : 0.25;
  
  for (let i = 0; i < numVertices; i++) {
    const angle = (i / numVertices) * Math.PI * 2;
    // Add organic variation to radius
    const seed = c.key * 100 + i * 7;
    const radiusVar = 0.7 + hash2(seed, 0.1) * 0.5; // 0.7-1.2
    const radius = baseR * radiusVar;
    
    // Slight angle jitter for asymmetry
    const angleJitter = (hash2(seed, 0.2) - 0.5) * 0.3;
    const finalAngle = angle + angleJitter;
    
    vertices.push({
      x: Math.cos(finalAngle) * radius,
      y: Math.sin(finalAngle) * radius,
    });
  }
  
  // Generate color layers for depth
  const layers = [];
  const numLayers = isOuter ? 4 : 3;
  
  for (let l = 0; l < numLayers; l++) {
    const layerSeed = c.key * 10 + l;
    const scale = 1 - l * 0.18; // Each layer slightly smaller
    const opacity = (isOuter ? 0.35 : 0.25) - l * 0.06;
    
    // Color shifts per layer for depth
    let layerColor = baseColor;
    if (l === 0) {
      // Back layer - darker
      const darken = isDark ? 0.3 : 0.2;
      const r = parseInt(layerColor.slice(1, 3), 16);
      const g = parseInt(layerColor.slice(3, 5), 16);
      const b = parseInt(layerColor.slice(5, 7), 16);
      layerColor = `rgb(${Math.round(r * (1 - darken))}, ${Math.round(g * (1 - darken))}, ${Math.round(b * (1 - darken))})`;
    } else if (l === numLayers - 1) {
      // Front layer - lighter/highlight
      const lighten = 0.15;
      const r = parseInt(layerColor.slice(1, 3), 16);
      const g = parseInt(layerColor.slice(3, 5), 16);
      const b = parseInt(layerColor.slice(5, 7), 16);
      layerColor = `rgb(${Math.min(255, Math.round(r + (255 - r) * lighten))}, ${Math.min(255, Math.round(g + (255 - g) * lighten))}, ${Math.min(255, Math.round(b + (255 - b) * lighten))})`;
    }
    
    layers.push({ scale, opacity, color: layerColor, seed: layerSeed });
  }
  
  // Add seasonal accent speckles
  const speckles = [];
  if (season === "spring" && t > 0.1) {
    const numSpeckles = Math.floor(baseR / 3);
    for (let s = 0; s < numSpeckles; s++) {
      const ss = c.key * 1000 + s * 13;
      speckles.push({
        x: (hash2(ss, 0.1) - 0.5) * baseR * 1.4,
        y: (hash2(ss, 0.2) - 0.5) * baseR * 1.4,
        size: 2 + hash2(ss, 0.3) * 3,
        color: FLW[s % FLW.length],
        opacity: 0.5 + hash2(ss, 0.4) * 0.3,
      });
    }
  } else if (season === "autumn") {
    const numSpeckles = Math.floor(baseR / 4);
    const autumnColors = ["#ff8a65", "#ffcc02", "#ef5350", "#a1887f"];
    for (let s = 0; s < numSpeckles; s++) {
      const ss = c.key * 1000 + s * 13;
      speckles.push({
        x: (hash2(ss, 0.1) - 0.5) * baseR * 1.3,
        y: (hash2(ss, 0.2) - 0.5) * baseR * 1.3,
        size: 2 + hash2(ss, 0.3) * 2.5,
        color: autumnColors[s % autumnColors.length],
        opacity: 0.4 + hash2(ss, 0.4) * 0.3,
      });
    }
  }
  
  return { vertices, layers, speckles, baseR };
}

interface BanyanTreeProps {
  pct: number;
  isDark: boolean;
  running: boolean;
  completedPomodoros?: number;
  sessionProgress?: number;
  season?: Season;
}

export function BanyanTree({ pct, isDark, running, completedPomodoros = 0, sessionProgress = 0, season }: BanyanTreeProps) {
  const t = Math.min((completedPomodoros + sessionProgress) / MAX_POMODOROS, 1);
  const curSeason = season ?? getSeason(t);

  const cx = 130;
  const trunkColor = isDark ? BRN_L : BRN;

  // ── Camera "follow" zoom: tree starts small & zoomed-in so it's clearly
  // visible from frame 1, then zooms out as the tree matures to stay framed.
  const viewScale = 1.6 - Math.min(0.6, t * 0.7);

  // Scale the tree from a clear sapling to full size
  const treeScale = 0.5 + Math.pow(t, 0.5) * 0.5;

  // Trunk dimensions
  const trunkBot = 42;
  const trunkH = (40 + t * 65) * treeScale;
  const trunkW = (9 + t * 23) * treeScale;
  const trunkTop = trunkBot + trunkH;

  // Canopy
  const canopyR = (40 + t * 70) * treeScale;
  const canopyCenterY = trunkTop - trunkW * 0.35;
  const maturity = Math.min(4, Math.floor(t * 5));

  const seasonMod = SEASON_CANOPY_MOD[curSeason];

  // ── Canopy blobs ──
  const canopy = useMemo(() => {
    return BANYAN_CANOPY.map((b, i) => {
      const local = smoothstep((t - b.growAt) / Math.max(0.001, 1 - b.growAt));
      // Guarantee the first canopy blob (seedling core) is always visible
      const effLocal = i === 0 ? Math.max(local, 0.4) : local;
      const colorIdx =
        b.layer === 0
          ? Math.min(4, maturity + 1)
          : b.layer === 1
            ? maturity
            : Math.max(0, maturity - 1);
      const hueShift = i % 2 === 0 ? 0 : -1;
      const seasonColors = SEASON_CANOPY[curSeason];
      const color = seasonColors[Math.max(0, Math.min(seasonColors.length - 1, colorIdx + hueShift))];

      // Distance from canopy center (0–1) for peripheral effects
      const dist = Math.sqrt(b.dx * b.dx + b.dy * b.dy) / 1.3;
      const peripheralScale = 1 - (1 - seasonMod.peripheralShrink) * Math.pow(dist, 1.5);

      const r = b.r * canopyR * 0.55 * (0.35 + 0.65 * effLocal) * seasonMod.scale * peripheralScale;
      const op = 0.5 + local * 0.4;
      return {
        key: i,
        lx: cx + b.dx * canopyR,
        by: canopyCenterY - b.dy * canopyR,
        r,
        color,
        opacity: curSeason === "winter" ? Math.min(op, 0.6) : op,
        layer: b.layer,
        dist,
      };
    }).filter((c) => c.r > 2);
  }, [t, canopyR, maturity, canopyCenterY, curSeason, seasonMod]);

  // ── Spring blossom dots (scattered across canopy) ──
  const blossomDots = useMemo(() => {
    if (curSeason !== "spring") return [];
    return canopy
      .filter((c) => c.r > 6 && c.opacity > 0.6)
      .flatMap((c) =>
        Array.from({ length: Math.max(2, Math.floor(c.r / 5)) }, (_, i) => ({
          key: `blossom-${c.key}-${i}`,
          x: c.lx + (hash(c.key * 7 + i, 0.1) - 0.5) * c.r * 1.4,
          y: c.by + (hash(c.key * 13 + i, 0.2) - 0.5) * c.r * 1.4,
          r: 1.5 + hash(c.key * 17 + i, 0.3) * 1.5,
          color: FLW[i % FLW.length],
          opacity: 0.5 + hash(c.key * 23 + i, 0.4) * 0.4,
        })),
      );
  }, [canopy, curSeason]);

  // ── Winter snow caps on canopy blobs ──
  const snowCaps = useMemo(() => {
    if (curSeason !== "winter") return [];
    return canopy
      .filter((c) => c.r > 4)
      .map((c) => ({
        key: `snow-${c.key}`,
        x: c.lx,
        y: c.by - c.r * 0.55,
        r: c.r * (0.25 + hash(c.key, 0.5) * 0.15),
        opacity: 0.6 + hash(c.key, 0.3) * 0.3,
      }));
  }, [canopy, curSeason]);

  // ── Blossom decorations (for Banyan, these are small accent flowers) ──
  const decorations = useMemo(() => {
    return BANYAN_FIGS.slice(0, 4)
      .map((f, i) => {
        const local = smoothstep(
          (t - f.growAt) / Math.max(0.001, 1 - f.growAt),
        );
        return {
          key: i,
          lx: cx + f.dx * canopyR,
          by: canopyCenterY - f.dy * canopyR,
          size: (3.5 + hash(i, 0.2) * 2) * local,
          color: curSeason === "spring" ? FLW[i % FLW.length] : SEASON_ACCENT[curSeason],
          opacity: local,
        };
      })
      .filter((d) => d.size > 0.6);
  }, [t, canopyR, canopyCenterY]);

  // ── Figs ──
  const figs = useMemo(() => {
    return BANYAN_FIGS.map((f, i) => {
      const local = smoothstep((t - f.growAt) / Math.max(0.001, 1 - f.growAt));
      const size = f.size * local * treeScale;
      if (size < 1) return null;
      return {
        key: i,
        lx: cx + f.dx * canopyR,
        by: canopyCenterY - f.dy * canopyR,
        size,
        color: FIG_COLORS[i % FIG_COLORS.length],
        opacity: 0.4 + local * 0.5,
        highlight: i % 3 === 0,
      };
    }).filter(Boolean) as {
      key: number;
      lx: number;
      by: number;
      size: number;
      color: string;
      opacity: number;
      highlight: boolean;
    }[];
  }, [t, canopyR, canopyCenterY, treeScale]);

  // ── Aerial roots ──
  const aerialRoots = useMemo(() => {
    return BANYAN_AERIAL_ROOTS.map((r, i) => {
      const local = smoothstep((t - r.growAt) / Math.max(0.001, 1 - r.growAt));
      if (local < 0.01) return null;
      const startX = cx + r.dx * canopyR;
      const startY = canopyCenterY - r.dy * canopyR;
      const maxDrop = (startY - trunkBot - 10) * r.maxLen;
      const currentLen = maxDrop * local;
      if (currentLen < 3) return null;
      const rootThick = Math.max(1.5, r.thickness * treeScale);
      return {
        key: i,
        left: startX - rootThick / 2,
        bottom: startY - currentLen,
        width: rootThick * local,
        height: currentLen,
        color: isDark ? BRN_L : BRN,
        opacity: 0.2 + local * 0.6,
        tipSize: Math.max(1, rootThick * local * 0.5),
      };
    }).filter(Boolean) as {
      key: number;
      left: number;
      bottom: number;
      width: number;
      height: number;
      color: string;
      opacity: number;
      tipSize: number;
    }[];
  }, [t, canopyR, canopyCenterY, trunkBot, isDark, treeScale]);

  // ── Prop roots (become secondary trunks) ──
  const propRoots = useMemo(() => {
    return BANYAN_PROP_ROOTS.map((pr, i) => {
      const local = smoothstep(
        (t - pr.growAt) / Math.max(0.001, 1 - pr.growAt),
      );
      if (local < 0.01) return null;
      const startX = cx + pr.dx * canopyR;
      const startY = canopyCenterY - pr.dy * canopyR;
      const groundX = cx + pr.dx * pr.spread * canopyR;
      const dx = groundX - startX;
      const dy = trunkBot - startY;
      const angleDeg =
        (Math.atan2(startY - trunkBot, groundX - startX) * 180) / Math.PI;
      const len = Math.sqrt(dx * dx + dy * dy) * local;
      if (len < 5) return null;
      const thick = Math.max(2, pr.thickness * local * treeScale);
      const midX = (startX + groundX) / 2;
      const midY = (startY + trunkBot) / 2;
      return {
        key: i,
        left: midX - len / 2,
        bottom: midY - thick / 2,
        width: len,
        height: thick,
        angle: angleDeg,
        color: isDark ? BRN_L : BRN,
        opacity: 0.15 + local * 0.55,
      };
    }).filter(Boolean) as {
      key: number;
      left: number;
      bottom: number;
      width: number;
      height: number;
      angle: number;
      color: string;
      opacity: number;
    }[];
  }, [t, canopyR, canopyCenterY, trunkBot, cx, isDark, treeScale]);

  // ── Branches along trunk ──
  const branches = useMemo(() => {
    const BRANCH_CONFIG = [
      { side: -1, yRatio: 0.3, angle: -28, length: 14, growAt: 0.18 },
      { side: 1, yRatio: 0.3, angle: 28, length: 14, growAt: 0.2 },
      { side: -1, yRatio: 0.5, angle: -22, length: 12, growAt: 0.32 },
      { side: 1, yRatio: 0.5, angle: 22, length: 12, growAt: 0.34 },
      { side: -1, yRatio: 0.68, angle: -16, length: 10, growAt: 0.46 },
      { side: 1, yRatio: 0.68, angle: 16, length: 10, growAt: 0.48 },
      { side: -1, yRatio: 0.82, angle: -10, length: 8, growAt: 0.6 },
      { side: 1, yRatio: 0.82, angle: 10, length: 8, growAt: 0.62 },
    ];
    return BRANCH_CONFIG.map((b, i) => {
      const local = smoothstep((t - b.growAt) / Math.max(0.001, 1 - b.growAt));
      const currentLen = b.length * local * treeScale;
      if (currentLen < 3) return null;
      const junctionY = trunkBot + trunkH * b.yRatio;
      const startX = cx + b.side * (trunkW / 2);
      const startY = junctionY;
      const tiltRad = (Math.abs(b.angle) * Math.PI) / 180;
      const endX = startX + b.side * currentLen * Math.cos(tiltRad);
      const endY = startY + currentLen * Math.sin(tiltRad);
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;
      const thick = 3 * local;
      return {
        key: i,
        left: midX - currentLen / 2,
        bottom: midY - thick / 2,
        width: currentLen,
        height: thick,
        angle:
          (Math.atan2(-(endY - startY), endX - startX) * 180) / Math.PI,
        color: isDark ? BRN_L : BRN,
        opacity: 0.3 + local * 0.6,
      };
    }).filter(Boolean) as {
      key: number;
      left: number;
      bottom: number;
      width: number;
      height: number;
      angle: number;
      color: string;
      opacity: number;
    }[];
  }, [t, trunkW, trunkH, trunkBot, cx, isDark, treeScale]);

  // ── Animations ──

  // ── Animations ──

  // Trunk entry - delayed slight bounce
  const trunkEntry = useRef(new Animated.Value(20)).current;
  useEffect(() => {
    Animated.spring(trunkEntry, {
      toValue: 0,
      friction: 8,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, []);

  // Tree growth animation - drives overall scale from seedling to mature
  const treeGrowth = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(treeGrowth, {
      toValue: 1,
      duration: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  // Canopy entry - delayed fade + scale for natural emergence
  const canopyEntry = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(canopyEntry, {
      toValue: 1,
      duration: 1000,
      delay: 300,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, []);

  // Continuous sway (0→1→0 oscillation, no instant reset jerk)
  const sway = useRef(new Animated.Value(0)).current;
  const swayDuration = seasonMod.swayDuration;
  const swayAmp = seasonMod.swayAmp;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, {
          toValue: 1,
          duration: swayDuration / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(sway, {
          toValue: 0,
          duration: swayDuration / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [swayDuration]);

  const baseAmp = 2.5 * swayAmp;

  const canopySway = sway.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [`${-baseAmp}deg`, `${baseAmp}deg`, `${-baseAmp}deg`],
  });

  const trunkSway = sway.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [`${-baseAmp * 0.2}deg`, `${baseAmp * 0.2}deg`, `${-baseAmp * 0.2}deg`],
  });

  const glow = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    if (running) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(glow, {
            toValue: 1,
            duration: 2200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glow, {
            toValue: 0.35,
            duration: 2200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
    Animated.timing(glow, {
      toValue: 0.35,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [running]);

  const glowColor = skyColorAt(pct, "glow");
  const canopyOpacity = glow.interpolate({
    inputRange: [0.35, 1],
    outputRange: [0.88, 1],
  });
  const ffCount = curSeason === "winter" ? 0 : Math.max(2, Math.min(12, Math.floor({
    spring: 2, summer: 4, autumn: 1,
  }[curSeason]! + t * 8)));

  return (
    <View style={s.treeArea}>
      <Animated.View
        style={[
          s.treeScaled,
          {
            transform: [
              { scale: viewScale },
              { scale: treeGrowth.interpolate({ inputRange: [0, 1], outputRange: [0.01, 1] }) },
            ],
            transformOrigin: "50% 86%",
          },
        ]}
      >
      {/* Particle layers */}
      <View pointerEvents="none" style={s.particleLayer}>
        {Array.from({ length: ffCount }, (_, i) => (
          <Firefly
            key={i}
            seed={i}
            active={running && t > 0.05}
            originX={cx}
            originY={canopyCenterY}
            spread={canopyR}
          />
        ))}
      </View>

      <View pointerEvents="none" style={s.particleLayer}>
        {Array.from({ length: { spring: 4, summer: 2, autumn: 12, winter: 0 }[curSeason] ?? 4 }, (_, i) => (
          <FloatingLeaf
            key={i}
            seed={i}
            active={running}
            originX={cx}
            originY={canopyCenterY}
            spread={canopyR}
            maturity={t}
          />
        ))}
      </View>

      <View pointerEvents="none" style={s.particleLayer}>
        <SparkleField
          active={running}
          originX={cx}
          originY={canopyCenterY}
          spread={canopyR}
          maturity={t}
          count={{ spring: 8, summer: 14, autumn: 6, winter: 0 }[curSeason] ?? 8}
        />
      </View>

      <Animated.View
        style={[s.treeWrap, { top: -15 }]}
      >
        {/* Ground shadow */}
        <View
          style={[
            s.groundShadow,
            {
              left: cx - Math.max(35, 18 + trunkW * 1.5),
              bottom: trunkBot - 4,
              width: Math.max(70, (18 + trunkW * 1.5) * 2),
              opacity: isDark ? 0.35 : 0.2,
            },
          ]}
        />

        {/* Soft ground glow halo */}
        <View
          style={{
            position: 'absolute',
            left: cx - trunkW * 3,
            bottom: trunkBot - 10,
            width: trunkW * 6,
            height: trunkW * 1.4,
            borderRadius: trunkW * 3,
            backgroundColor: {
              spring: '#7ec97e',
              summer: '#3fae5a',
              autumn: '#caa15a',
              winter: '#aebfce',
            }[curSeason],
            opacity: 0.12,
          }}
        />

        {/* Ground mound */}
        <View
          style={{
            position: 'absolute',
            left: cx - trunkW * 1.6,
            bottom: trunkBot - 6,
            width: trunkW * 3.2,
            height: trunkW * 0.6,
            borderRadius: trunkW * 0.3,
            backgroundColor: {
              spring: isDark ? '#1a3a1a' : '#3a6a3a',
              summer: isDark ? '#0d2d0d' : '#2a5a2a',
              autumn: isDark ? '#2a1a0d' : '#5a3a1a',
              winter: isDark ? '#2a3038' : '#4a5560',
            }[curSeason],
            opacity: 0.55,
          }}
        />

        {/* Root flare */}
        <View
          style={[
            s.rootFlare,
            {
              width: trunkW * 2.4 + 8,
              left: cx - trunkW * 1.2 - 4,
              bottom: trunkBot - 3,
              backgroundColor: trunkColor,
            },
          ]}
        />

        {/* Prop roots (behind trunk) */}
        {propRoots.map((pr) => (
          <View
            key={`prop-${pr.key}`}
            style={[
              s.propRoot,
              {
                left: pr.left,
                bottom: pr.bottom,
                width: pr.width,
                height: pr.height,
                opacity: pr.opacity,
                backgroundColor: pr.color,
                transform: [{ rotate: `${pr.angle}deg` }],
              },
            ]}
          />
        ))}

        {/* Trunk */}
        <Animated.View
          style={[
            s.trunk,
            {
              width: trunkW,
              height: trunkH,
              backgroundColor: trunkColor,
              bottom: trunkBot,
              left: cx - trunkW / 2,
              borderTopLeftRadius: trunkW * 0.3,
              borderTopRightRadius: trunkW * 0.3,
              transform: [{ translateY: trunkEntry }, { rotate: trunkSway }],
            },
          ]}
        >
          {/* Bark texture */}
          <View
            style={[
              s.barkLine,
              {
                left: "22%",
                height: "75%",
                bottom: 0,
                backgroundColor: isDark ? "#00000028" : "#0000001a",
              },
            ]}
          />
          <View
            style={[
              s.barkLine,
              {
                left: "44%",
                height: "60%",
                bottom: 0,
                backgroundColor: isDark ? "#00000022" : "#00000014",
              },
            ]}
          />
          <View
            style={[
              s.barkLine,
              {
                left: "63%",
                height: "68%",
                bottom: 0,
                backgroundColor: isDark ? "#00000024" : "#00000016",
              },
            ]}
          />
          <View
            style={[
              s.barkLine,
              {
                left: "80%",
                height: "45%",
                bottom: "8%",
                backgroundColor: isDark ? "#00000020" : "#00000012",
              },
            ]}
          />
          <View
            style={[
              s.barkLine,
              {
                left: "92%",
                height: "30%",
                bottom: "15%",
                backgroundColor: isDark ? "#00000018" : "#0000000c",
              },
            ]}
          />
          {/* Bark knot */}
          <View
            style={[
              s.barkKnot,
              {
                left: "55%",
                top: "30%",
                backgroundColor: isDark ? "#00000030" : "#0000001e",
              },
            ]}
          />
          <View
            style={[
              s.barkKnot,
              {
                left: "30%",
                top: "55%",
                backgroundColor: isDark ? "#00000028" : "#00000018",
              },
            ]}
          />
          {/* Left-edge shade for cylindrical volume */}
          <View
            style={[
              s.trunkShade,
              { backgroundColor: isDark ? "#00000045" : "#00000030" },
            ]}
          />
          {/* Right-edge rim light */}
          <View
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              bottom: 0,
              width: "22%",
              borderTopRightRadius: trunkW * 0.3,
              borderBottomRightRadius: 0,
              backgroundColor: isDark ? "#ffffff12" : "#ffffff28",
            }}
          />
        </Animated.View>

        {/* Branches */}
        {branches.map((b) => (
          <View
            key={`branch-${b.key}`}
            style={[
              s.branch,
              {
                left: b.left,
                bottom: b.bottom,
                width: b.width,
                height: b.height,
                opacity: b.opacity,
                backgroundColor: b.color,
                transform: [{ rotate: `${b.angle}deg` }],
              },
            ]}
          />
        ))}

        {/* Aerial roots (in front of trunk and canopy) */}
        {aerialRoots.map((ar) => (
          <React.Fragment key={`aerial-${ar.key}`}>
            <View
              style={[
                s.aerialRoot,
                {
                  left: ar.left,
                  bottom: ar.bottom,
                  width: ar.width,
                  height: ar.height,
                  opacity: ar.opacity,
                  backgroundColor: ar.color,
                },
              ]}
            />
            {ar.tipSize > 1.5 && (
              <View
                style={[
                  s.aerialRootTip,
                  {
                    left: ar.left + ar.width / 2 - ar.tipSize / 2,
                    bottom: ar.bottom - 1,
                    width: ar.tipSize,
                    height: ar.tipSize,
                    borderRadius: ar.tipSize / 2,
                    opacity: ar.opacity * 0.8,
                    backgroundColor: ar.color,
                  },
                ]}
              />
            )}
          </React.Fragment>
        ))}

        {/* Canopy layer */}
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 5,
            transform: [
              { rotate: canopySway },
              { scale: canopyEntry.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) },
            ],
            opacity: canopyOpacity,
            shadowColor: glowColor,
            shadowOpacity: running ? 0.55 : 0.2,
            shadowRadius: running ? 16 : 8,
            shadowOffset: { width: 0, height: 0 },
          }}
        >
          {canopy.map((c) => {
            const shape = generateCanopyShape(c, curSeason, t, isDark);
            return (
              <View
                key={c.key}
                style={[
                  s.leaf,
                  {
                    left: c.lx - c.r * 1.2,
                    bottom: c.by - c.r * 1.2,
                    width: c.r * 2.4,
                    height: c.r * 2.4,
                  },
                ]}
              >
                {/* Organic shape layers - back to front */}
                {shape.layers.map((layer, li) => (
                  <View
                    key={`layer-${c.key}-${li}`}
                    style={{
                      position: "absolute",
                      left: shape.baseR * (1.2 - layer.scale * 1.2),
                      bottom: shape.baseR * (1.2 - layer.scale * 1.2),
                      width: shape.baseR * 2 * layer.scale,
                      height: shape.baseR * 2 * layer.scale,
                    }}
                  >
                    {/* Draw organic polygon using nested views */}
                    {shape.vertices.map((v, vi) => (
                      <View
                        key={`vert-${c.key}-${li}-${vi}`}
                        style={{
                          position: "absolute",
                          left: shape.baseR * layer.scale + v.x * layer.scale,
                          bottom: shape.baseR * layer.scale + v.y * layer.scale,
                          width: shape.baseR * 0.6 * layer.scale,
                          height: shape.baseR * 0.6 * layer.scale,
                          borderRadius: shape.baseR * 0.3 * layer.scale,
                          backgroundColor: layer.color,
                          opacity: layer.opacity * c.opacity,
                          transform: [{ rotate: `${(vi / shape.vertices.length) * 360}deg` }],
                        }}
                      />
                    ))}
                    {/* Center fill to connect vertices */}
                    <View
                      style={{
                        position: "absolute",
                        left: shape.baseR * layer.scale * 0.2,
                        bottom: shape.baseR * layer.scale * 0.2,
                        width: shape.baseR * 1.6 * layer.scale,
                        height: shape.baseR * 1.6 * layer.scale,
                        borderRadius: shape.baseR * 0.8 * layer.scale,
                        backgroundColor: layer.color,
                        opacity: layer.opacity * c.opacity * 0.8,
                      }}
                    />
                  </View>
                ))}

                {/* Seasonal accent speckles */}
                {shape.speckles.map((sp, si) => (
                  <View
                    key={`speckle-${c.key}-${si}`}
                    style={{
                      position: "absolute",
                      left: shape.baseR + sp.x - sp.size / 2,
                      bottom: shape.baseR + sp.y - sp.size / 2,
                      width: sp.size,
                      height: sp.size,
                      borderRadius: sp.size / 2,
                      backgroundColor: sp.color,
                      opacity: sp.opacity * c.opacity,
                    }}
                  />
                ))}

                {/* Soft inner glow highlight */}
                <View
                  style={{
                    position: "absolute",
                    left: shape.baseR * 0.25,
                    top: shape.baseR * 0.25,
                    width: shape.baseR * 0.9,
                    height: shape.baseR * 0.9,
                    borderRadius: shape.baseR * 0.45,
                    backgroundColor: "#ffffff",
                    opacity: 0.06 * c.opacity,
                  }}
                />
              </View>
            );
          })}

          {/* Figs within canopy */}
          {figs.map((f) => (
            <View
              key={`fig-${f.key}`}
              style={[
                s.fig,
                {
                  left: f.lx - f.size / 2,
                  bottom: f.by - f.size / 2,
                  width: f.size,
                  height: f.size,
                  borderRadius: f.size / 2,
                  backgroundColor: f.color,
                  opacity: f.opacity,
                },
              ]}
            />
          ))}
          {figs
            .filter((f) => f.highlight)
            .map((f) => (
              <View
                key={`fig-hl-${f.key}`}
                style={[
                  s.figHighlight,
                  {
                    left: f.lx - f.size * 0.15,
                    bottom: f.by + f.size * 0.15,
                    width: f.size * 0.3,
                    height: f.size * 0.3,
                    borderRadius: f.size * 0.15,
                    opacity: f.opacity * 0.6,
                  },
                ]}
              />
            ))}

          {/* Accent flowers (early stage small blossoms) */}
          {decorations.map((d) => (
            <View
              key={d.key}
              style={[
                s.flower,
                {
                  left: d.lx - d.size / 2,
                  bottom: d.by - d.size / 2,
                  width: d.size,
                  height: d.size,
                  borderRadius: d.size / 2,
                  backgroundColor: d.color,
                  opacity: d.opacity,
                },
              ]}
            />
          ))}

          {/* Spring blossom dots */}
          {blossomDots.map((b) => (
            <View
              key={b.key}
              style={{
                position: 'absolute',
                left: b.x - b.r,
                bottom: b.y - b.r,
                width: b.r * 2,
                height: b.r * 2,
                borderRadius: b.r,
                backgroundColor: b.color,
                opacity: b.opacity,
                zIndex: 8,
              }}
            />
          ))}

          {/* Winter snow caps */}
          {snowCaps.map((s) => (
            <View
              key={s.key}
              style={{
                position: 'absolute',
                left: s.x - s.r,
                bottom: s.y - s.r,
                width: s.r * 2,
                height: s.r * 2,
                borderRadius: s.r,
                backgroundColor: '#e8f0f8',
                opacity: s.opacity,
                shadowColor: '#ffffff',
                shadowOpacity: 0.3,
                shadowRadius: s.r * 0.5,
                shadowOffset: { width: 0, height: 0 },
                zIndex: 9,
              }}
            />
          ))}
        </Animated.View>
      </Animated.View>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  treeArea: {
    justifyContent: "center",
    alignItems: "center",
    width: 260,
    height: 300,
    position: "relative",
  },
  particleLayer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 260,
    height: 300,
    zIndex: 10,
    pointerEvents: "none",
  },
  treeWrap: { width: 260, height: 300, position: "relative" },
  treeScaled: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 260,
    height: 300,
  },
  groundShadow: {
    position: "absolute",
    bottom: -2,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#000000",
    zIndex: 1,
  },
  rootFlare: {
    position: "absolute",
    height: 9,
    borderRadius: 6,
    zIndex: 2,
  },
  trunk: {
    position: "absolute",
    borderRadius: 4,
    zIndex: 3,
    overflow: "hidden",
  },
  barkLine: {
    position: "absolute",
    width: 1.5,
    borderRadius: 1,
  },
  barkKnot: {
    position: "absolute",
    width: 3,
    height: 2,
    borderRadius: 1,
  },
  trunkShade: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: "45%",
  },
  branch: {
    position: "absolute",
    zIndex: 4,
    borderRadius: 1.5,
  },
  propRoot: {
    position: "absolute",
    zIndex: 2,
    borderRadius: 2,
  },
  aerialRoot: {
    position: "absolute",
    zIndex: 6,
    borderRadius: 1,
  },
  aerialRootTip: {
    position: "absolute",
    zIndex: 7,
  },
  leaf: { position: "absolute", zIndex: 4 },
  fig: { position: "absolute", zIndex: 6 },
  figHighlight: { position: "absolute", zIndex: 7, backgroundColor: "#fff" },
  flower: { position: "absolute", zIndex: 6 },
});
