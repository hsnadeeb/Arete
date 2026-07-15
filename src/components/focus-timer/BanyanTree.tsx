import React, { useEffect, useRef, useMemo } from "react";
import { View, Text, Animated, Easing, StyleSheet } from "react-native";
import { TYPOGRAPHY } from "../../constants/typography";
import {
  BANYAN_CANOPY,
  BANYAN_AERIAL_ROOTS,
  BANYAN_PROP_ROOTS,
  BANYAN_FIGS,
  FIG_COLORS,
  GREEN,
  BRN,
  BRN_L,
  FLW,
  smoothstep,
  skyColorAt,
  hash,
} from "./constants";
import { Firefly } from "./Firefly";
import { FloatingLeaf } from "./FloatingLeaf";
import { SparkleField } from "./SparkleField";

interface BanyanTreeProps {
  pct: number;
  isDark: boolean;
  running: boolean;
}

export function BanyanTree({ pct, isDark, running }: BanyanTreeProps) {
  const t = Math.min(pct / 100, 1);

  const cx = 130;
  const trunkColor = isDark ? BRN_L : BRN;

  // Scale the tree from tiny to full size
  const treeScale = 0.15 + t * 0.85;

  // Trunk dimensions
  const trunkBot = 42;
  const trunkH = (28 + t * 72) * treeScale;
  const trunkW = (8 + t * 24) * treeScale;
  const trunkTop = trunkBot + trunkH;

  // Canopy
  const canopyR = (28 + t * 78) * treeScale;
  const canopyCenterY = trunkTop;
  const maturity = Math.min(4, Math.floor(t * 5));

  // ── Canopy blobs ──
  const canopy = useMemo(() => {
    return BANYAN_CANOPY.map((b, i) => {
      const local = smoothstep((t - b.growAt) / Math.max(0.001, 1 - b.growAt));
      const colorIdx =
        b.layer === 0
          ? Math.min(4, maturity + 1)
          : b.layer === 1
            ? maturity
            : Math.max(0, maturity - 1);
      const hueShift = i % 2 === 0 ? 0 : -1;
      const color = GREEN[Math.max(0, Math.min(4, colorIdx + hueShift))];
      return {
        key: i,
        lx: cx + b.dx * canopyR,
        by: canopyCenterY - b.dy * canopyR,
        r: b.r * canopyR * 0.55 * (0.35 + 0.65 * local),
        color,
        opacity: 0.5 + local * 0.4,
      };
    }).filter((c) => c.r > 2);
  }, [t, canopyR, maturity, canopyCenterY]);

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
          color: FLW[i % FLW.length],
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

  const animScale = useRef(new Animated.Value(0.01)).current;
  useEffect(() => {
    Animated.spring(animScale, {
      toValue: 1,
      friction: 6,
      tension: 60,
      useNativeDriver: true,
    }).start();
  }, []);

  const trunkEntry = useRef(new Animated.Value(20)).current;
  useEffect(() => {
    Animated.spring(trunkEntry, {
      toValue: 0,
      friction: 6,
      tension: 60,
      useNativeDriver: true,
    }).start();
  }, []);

  // ── Continuous smooth animations (no loop-reset jerks) ──

  const breath = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(breath, {
        toValue: 1,
        duration: 7000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const breathScale = breath.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.025, 1],
  });

  const growPulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.spring(growPulse, {
          toValue: 1.03,
          friction: 4,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.spring(growPulse, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const sway = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(sway, {
        toValue: 1,
        duration: 5600,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const SIN_SWAY = [
    { i: 0, o: "0deg" },
    { i: 0.125, o: "2.12deg" },
    { i: 0.25, o: "3deg" },
    { i: 0.375, o: "2.12deg" },
    { i: 0.5, o: "0deg" },
    { i: 0.625, o: "-2.12deg" },
    { i: 0.75, o: "-3deg" },
    { i: 0.875, o: "-2.12deg" },
    { i: 1, o: "0deg" },
  ] as const;

  const canopySway = sway.interpolate({
    inputRange: SIN_SWAY.map((s) => s.i),
    outputRange: SIN_SWAY.map((s) => s.o),
  });

  const trunkSway = sway.interpolate({
    inputRange: SIN_SWAY.map((s) => s.i),
    outputRange: SIN_SWAY.map((s) => {
      const deg = parseFloat(s.o);
      return `${deg * 0.2}deg`;
    }),
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
  const haloOpacity = glow.interpolate({
    inputRange: [0.35, 1],
    outputRange: [0.12, 0.35],
  });
  const haloOpacity2 = glow.interpolate({
    inputRange: [0.35, 1],
    outputRange: [0.06, 0.18],
  });
  const potGlow = glow.interpolate({
    inputRange: [0.35, 1],
    outputRange: [0.15, 0.5],
  });

  const ffCount = Math.max(4, Math.min(14, Math.floor(3 + t * 11)));

  return (
    <View style={s.treeArea}>
      {/* Glow halo */}
      <Animated.View
        pointerEvents="none"
        style={[
          s.haloRing,
          {
            width: canopyR * 2.6,
            height: canopyR * 2.6,
            borderRadius: canopyR * 1.3,
            bottom: canopyCenterY - canopyR * 1.3,
            left: cx - canopyR * 1.3,
            backgroundColor: glowColor,
            opacity: haloOpacity,
            shadowColor: glowColor,
            shadowOpacity: 0.35,
            shadowRadius: 50,
          },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          s.haloRing2,
          {
            width: canopyR * 1.8,
            height: canopyR * 1.8,
            borderRadius: canopyR * 0.9,
            bottom: canopyCenterY - canopyR * 0.9,
            left: cx - canopyR * 0.9,
            backgroundColor: glowColor,
            opacity: haloOpacity2,
          },
        ]}
      />

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
        {Array.from({ length: 10 }, (_, i) => (
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
          count={12}
        />
      </View>

      <Animated.View
        style={[s.treeWrap, { top: -15, transform: [{ scale: 1.2 }] }]}
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

        {/* Pot */}
        <Animated.View
          style={[
            s.pot,
            {
              backgroundColor: trunkColor,
              borderColor: trunkColor,
              left: cx - 28,
              bottom: trunkBot - 32,
              shadowColor: glowColor,
              shadowOpacity: potGlow,
              shadowRadius: running ? 8 : 2,
              shadowOffset: { width: 0, height: 0 },
            },
          ]}
        >
          <Text style={s.potText}>{Math.floor(pct)}%</Text>
        </Animated.View>

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
          <View
            style={[
              s.trunkShade,
              { backgroundColor: isDark ? "#00000035" : "#00000022" },
            ]}
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
              { scale: Animated.multiply(breathScale, growPulse) },
              { rotate: canopySway },
            ],
            opacity: canopyOpacity,
            shadowColor: glowColor,
            shadowOpacity: running ? 0.55 : 0.2,
            shadowRadius: running ? 16 : 8,
            shadowOffset: { width: 0, height: 0 },
          }}
        >
          {canopy.map((c) => (
            <View
              key={c.key}
              style={[
                s.leaf,
                {
                  left: c.lx - c.r,
                  bottom: c.by - c.r,
                  width: c.r * 2,
                  height: c.r * 2,
                  borderRadius: c.r,
                  backgroundColor: c.color,
                  opacity: c.opacity,
                },
              ]}
            />
          ))}

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
  haloRing: {
    position: "absolute",
    zIndex: 0,
  },
  haloRing2: {
    position: "absolute",
    zIndex: 0,
  },
  treeWrap: { width: 260, height: 300, position: "relative" },
  groundShadow: {
    position: "absolute",
    bottom: -2,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#000000",
    zIndex: 1,
  },
  pot: {
    position: "absolute",
    bottom: 0,
    width: 56,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },
  potText: {
    ...TYPOGRAPHY.captionSm,
    fontWeight: "700",
    color: "#fff",
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
