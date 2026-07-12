// components/GrowingTree.tsx
import React, { useEffect, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native"; // ← Added StyleSheet + Text
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  cancelAnimation,
} from "react-native-reanimated";

import { Firefly } from "./Firefly";
import { skyColorAt } from "./utils/skyColors";

const CANOPY_BLOBS = [
  { dx: -0.58, dy: -0.28, r: 0.74, layer: 0, growAt: 0.16 },
  { dx: 0.58, dy: -0.28, r: 0.74, layer: 0, growAt: 0.2 },
  { dx: 0, dy: -0.62, r: 0.7, layer: 0, growAt: 0.3 },
  { dx: 0, dy: 0.05, r: 1.0, layer: 1, growAt: 0.02 },
  { dx: -0.82, dy: 0.14, r: 0.58, layer: 1, growAt: 0.42 },
  { dx: 0.82, dy: 0.14, r: 0.58, layer: 1, growAt: 0.46 },
  { dx: -0.32, dy: -0.5, r: 0.46, layer: 2, growAt: 0.6 },
  { dx: 0.22, dy: -0.78, r: 0.36, layer: 2, growAt: 0.72 },
];

const BLOSSOM_SPOTS = [
  { dx: -0.7, dy: -0.1, growAt: 0.62 },
  { dx: 0.6, dy: -0.35, growAt: 0.72 },
  { dx: 0.1, dy: -0.85, growAt: 0.82 },
  { dx: -0.35, dy: -0.7, growAt: 0.9 },
  { dx: 0.75, dy: 0.05, growAt: 0.95 },
];

const GREEN = ["#e8f5e9", "#a5d6a7", "#66bb6a", "#43a047", "#2e7d32"];
const BRN = "#5d4037";
const BRN_L = "#8d6e63";
const FLW = ["#f48fb1", "#ce93d8", "#ffcc02"];

function smoothstep(x: number): number {
  const c = Math.max(0, Math.min(1, x));
  return c * c * (3 - 2 * c);
}

function hash(i: number, t: number): number {
  return ((i * 16807 + t * 100) % 2147483647) / 2147483647;
}

type GrowingTreeProps = {
  pct: number;
  isDark: boolean;
  running: boolean;
  size?: number;
};

export const GrowingTree: React.FC<GrowingTreeProps> = ({
  pct,
  isDark,
  running,
  size = 200,
}) => {
  const scale = size / 200;
  const t = Math.min(pct / 100, 1);
  const trunkH = (16 + t * 66) * scale;
  const trunkW = (10 + t * 9) * scale;
  const trunkBot = 24 * scale;
  const cx = size / 2;
  const canopyR = (15 + t * 27) * scale;
  const potW = 56 * scale;
  const potH = 22 * scale;
  const frameHeight = Math.round(size * 0.9 + potH + 8);
  const shadowW = (24 + trunkW) * 2;

  const maturity = Math.min(4, Math.floor(t * 5));

  // Shared animation values
  const animScale = useSharedValue(0.01);
  const breath = useSharedValue(1);
  const sway = useSharedValue(0);
  const glow = useSharedValue(0.35);

  // Entrance animation
  useEffect(() => {
    animScale.value = withSpring(1, { damping: 6, stiffness: 60 });
  }, []);

  // Breathing effect
  useEffect(() => {
    breath.value = withSequence(
      withSpring(1.045, { damping: 4, stiffness: 140 }),
      withSpring(1, { damping: 5, stiffness: 90 }),
    );
  }, [Math.floor(t * 40)]);

  // Gentle wind sway
  useEffect(() => {
    sway.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
        withTiming(-1, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
    return () => cancelAnimation(sway);
  }, []);

  // Glow pulse when running
  useEffect(() => {
    if (running) {
      glow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.35, {
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
          }),
        ),
        -1,
      );
    } else {
      glow.value = withTiming(0.35, { duration: 400 });
    }
  }, [running]);

  // Canopy calculation
  const canopy = useMemo(() => {
    const centerBY = trunkBot + trunkH * 0.94;
    return CANOPY_BLOBS.map((b, i) => {
      const local = smoothstep((t - b.growAt) / Math.max(0.001, 1 - b.growAt));
      const colorIdx =
        b.layer === 0
          ? Math.min(4, maturity + 1)
          : b.layer === 1
            ? maturity
            : Math.max(0, maturity - 1);

      return {
        key: i,
        lx: cx + b.dx * canopyR,
        by: centerBY + b.dy * canopyR,
        r: b.r * canopyR * 0.62 * (0.4 + 0.6 * local),
        color: GREEN[colorIdx],
        opacity: 0.55 + local * 0.35,
      };
    }).filter((c) => c.r > 1);
  }, [t, canopyR, maturity]);

  // Blossom decorations
  const decorations = useMemo(() => {
    const centerBY = trunkBot + trunkH * 0.94;
    return BLOSSOM_SPOTS.map((d, i) => {
      const local = smoothstep((t - d.growAt) / Math.max(0.001, 1 - d.growAt));
      return {
        key: i,
        lx: cx + d.dx * canopyR,
        by: centerBY + d.dy * canopyR,
        size: (3.5 + hash(i, 0.2) * 2.5) * local,
        color: FLW[i % FLW.length],
        opacity: local,
      };
    }).filter((d) => d.size > 0.6);
  }, [t, canopyR]);

  // Animated styles
  const swayStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breath.value }, { rotate: `${sway.value * 2}deg` }],
    opacity: glow.value,
    shadowOpacity: running ? 0.55 : 0.2,
    shadowRadius: running ? 14 : 8,
  }));

  const glowColor = skyColorAt(pct, "glow");
  // glowColor used for glow/halo styling

  return (
    <View style={[s.treeArea, { width: size, height: frameHeight }]}>
      {/* Fireflies */}
      <View
        pointerEvents="none"
        style={[s.fireflyLayer, { width: size, height: frameHeight }]}
      >
        {Array.from({ length: running ? 6 : 0 }, (_, i) => (
          <Firefly
            key={i}
            seed={i}
            active={running}
            originX={cx}
            originY={trunkBot + trunkH * 0.94}
            spread={canopyR}
          />
        ))}
      </View>

      <Animated.View
        style={[
          s.treeWrap,
          { width: size, height: frameHeight },
          { transform: [{ scale: animScale }] },
        ]}
      >
        {/* Ground shadow */}
        <View
          style={[
            s.groundShadow,
            {
              left: cx - shadowW / 2,
              width: shadowW,
              opacity: isDark ? 0.28 : 0.16,
            },
          ]}
        />

        {/* Pot */}
        <View
          style={[
            s.pot,
            {
              left: cx - potW / 2,
              width: potW,
              height: potH,
              backgroundColor: isDark ? BRN_L : BRN,
              borderColor: isDark ? BRN_L : BRN,
            },
          ]}
        >
          <Text style={[s.potText, { fontSize: Math.max(9, 10 * scale) }]}>
            {Math.floor(pct)}%
          </Text>
        </View>

        {/* Trunk */}
        <View
          style={[
            s.trunk,
            {
              width: trunkW,
              height: trunkH,
              backgroundColor: isDark ? BRN_L : BRN,
              bottom: trunkBot,
              left: cx - trunkW / 2,
              borderTopLeftRadius: trunkW * 0.35,
              borderTopRightRadius: trunkW * 0.35,
            },
          ]}
        >
          <View
            style={[
              s.trunkShade,
              { backgroundColor: isDark ? "#00000030" : "#00000022" },
            ]}
          />
        </View>

        {/* Root flare */}
        <View
          style={[
            s.rootFlare,
            {
              width: trunkW * 2.1,
              left: cx - trunkW * 1.05,
              bottom: trunkBot - 3 * scale,
              backgroundColor: isDark ? BRN_L : BRN,
            },
          ]}
        />

        {/* Canopy */}
        <Animated.View style={[s.canopyContainer, swayStyle]}>
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
};

const s = StyleSheet.create({
  treeArea: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "visible",
  },
  fireflyLayer: {
    position: "absolute",
    bottom: 0,
    left: 0,
  },
  treeWrap: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
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
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },
  potText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
  },
  trunk: {
    position: "absolute",
    borderRadius: 4,
    zIndex: 3,
    overflow: "hidden",
  },
  trunkShade: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: "45%",
  },
  rootFlare: {
    position: "absolute",
    height: 8,
    borderRadius: 6,
    zIndex: 2,
  },
  canopyContainer: {
    position: "absolute",
    shadowColor: "#ffd54f",
    shadowOffset: { width: 0, height: 0 },
  },
  leaf: { position: "absolute", zIndex: 4 },
  flower: { position: "absolute", zIndex: 6 },
});
