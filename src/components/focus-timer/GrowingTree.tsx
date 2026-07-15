import React, { useEffect, useRef, useMemo } from "react";
import { View, Text, Animated, Easing, StyleSheet } from "react-native";
import { TYPOGRAPHY } from "../../constants/typography";
import {
  CANOPY_BLOBS,
  BLOSSOM_SPOTS,
  SIDE_TUFTS,
  ROOTS,
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

interface GrowingTreeProps {
  pct: number;
  isDark: boolean;
  running: boolean;
}

export function GrowingTree({ pct, isDark, running }: GrowingTreeProps) {
  const t = Math.min(pct / 100, 1);

  const cx = 130;

  // Trunk dimensions
  const trunkBot = 42;
  const trunkH = 42 + t * 58;
  const trunkW = 18 + t * 12;
  const trunkTop = trunkBot + trunkH;

  // Canopy
  const canopyR = 36 + t * 46;
  const canopyCenterY = trunkTop;
  const maturity = Math.min(4, Math.floor(t * 5));

  const trunkColor = isDark ? BRN_L : BRN;

  // ── Canopy blobs ──
  const canopy = useMemo(() => {
    return CANOPY_BLOBS.map((b, i) => {
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
        r: b.r * canopyR * 0.62 * (0.4 + 0.6 * local),
        color,
        opacity: 0.55 + local * 0.35,
      };
    }).filter((c) => c.r > 1);
  }, [t, canopyR, maturity, canopyCenterY]);

  // ── Blossom decorations ──
  const decorations = useMemo(() => {
    return BLOSSOM_SPOTS.map((d, i) => {
      const local = smoothstep((t - d.growAt) / Math.max(0.001, 1 - d.growAt));
      return {
        key: i,
        lx: cx + d.dx * canopyR,
        by: canopyCenterY - d.dy * canopyR,
        size: (3.5 + hash(i, 0.2) * 2.5) * local,
        color: FLW[i % FLW.length],
        opacity: local,
      };
    }).filter((d) => d.size > 0.6);
  }, [t, canopyR, canopyCenterY]);

  // ── Side tufts (leaf clusters on trunk) ──
  const sideTufts = useMemo(() => {
    return SIDE_TUFTS.map((tuft, i) => {
      const local = smoothstep(
        (t - tuft.growAt) / Math.max(0.001, 1 - tuft.growAt),
      );
      const currentSize = tuft.size * local;
      if (currentSize < 1) return null;
      return {
        key: i,
        left: cx + tuft.side * (trunkW / 2 + 1),
        bottom: trunkBot + trunkH * tuft.yRatio,
        size: currentSize,
        color: tuft.leafColor,
        opacity: 0.3 + local * 0.5,
      };
    }).filter(Boolean) as {
      key: number;
      left: number;
      bottom: number;
      size: number;
      color: string;
      opacity: number;
    }[];
  }, [t, trunkW, trunkH, cx, trunkBot]);

  // ── Roots ──
  const roots = useMemo(() => {
    return ROOTS.map((root, i) => {
      const local = smoothstep(
        (t - root.growAt) / Math.max(0.001, 1 - root.growAt),
      );
      const currentLen = root.length * local;
      if (currentLen < 2) return null;
      return {
        key: i,
        left: cx + root.side * (trunkW * 0.5 + 1),
        bottom: trunkBot - 2,
        width: currentLen,
        angle: root.angle,
        thickness: root.thickness,
        opacity: 0.3 + local * 0.5,
      };
    }).filter(Boolean) as {
      key: number;
      left: number;
      bottom: number;
      width: number;
      angle: number;
      thickness: number;
      opacity: number;
    }[];
  }, [t, trunkW, cx, trunkBot]);

  // ── Animations ──

  // Entry
  const animScale = useRef(new Animated.Value(0.01)).current;
  useEffect(() => {
    Animated.spring(animScale, {
      toValue: 1,
      friction: 6,
      tension: 60,
      useNativeDriver: true,
    }).start();
  }, []);

  const trunkEntry = useRef(new Animated.Value(24)).current;
  useEffect(() => {
    Animated.spring(trunkEntry, {
      toValue: 0,
      friction: 6,
      tension: 60,
      useNativeDriver: true,
    }).start();
  }, []);

  // Breathing
  const breath = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          toValue: 1,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breath, {
          toValue: -1,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const breathScale = breath.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [0.97, 1, 1.03],
  });

  // Growth pulse
  const growPulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.spring(growPulse, {
        toValue: 1.045,
        friction: 4,
        tension: 140,
        useNativeDriver: true,
      }),
      Animated.spring(growPulse, {
        toValue: 1,
        friction: 5,
        tension: 90,
        useNativeDriver: true,
      }),
    ]).start();
  }, [Math.floor(t * 25)]);

  // Wind sway
  const sway = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(sway, {
          toValue: -1,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const canopySway = sway.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-2.5deg", "2.5deg"],
  });

  const trunkSway = sway.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-0.5deg", "0.5deg"],
  });

  // Warm glow pulse
  const glow = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    if (running) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(glow, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glow, {
            toValue: 0.35,
            duration: 2000,
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
    outputRange: [0.9, 1],
  });

  // Halo opacity
  const haloOpacity = glow.interpolate({
    inputRange: [0.35, 1],
    outputRange: [0.15, 0.35],
  });

  // Pot glow intensity based on progress
  const potGlow = glow.interpolate({
    inputRange: [0.35, 1],
    outputRange: [0.15, 0.5],
  });

  const ffCount = Math.max(4, Math.min(12, Math.floor(4 + t * 8)));

  return (
    <View style={s.treeArea}>
      {/* Glow halo behind tree */}
      <Animated.View
        pointerEvents="none"
        style={[
          s.haloRing,
          {
            width: canopyR * 2.8,
            height: canopyR * 2.8,
            borderRadius: canopyR * 1.4,
            bottom: canopyCenterY - canopyR * 1.4,
            left: cx - canopyR * 1.4,
            backgroundColor: glowColor,
            opacity: haloOpacity,
            shadowColor: glowColor,
            shadowOpacity: 0.3,
            shadowRadius: 40,
          },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          s.haloRing2,
          {
            width: canopyR * 2,
            height: canopyR * 2,
            borderRadius: canopyR,
            bottom: canopyCenterY - canopyR,
            left: cx - canopyR,
            backgroundColor: glowColor,
            opacity: Animated.multiply(haloOpacity, 0.6),
          },
        ]}
      />

      {/* Firefly layer */}
      <View pointerEvents="none" style={s.fireflyLayer}>
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

      {/* Floating leaves */}
      <View pointerEvents="none" style={s.particleLayer}>
        {Array.from({ length: 8 }, (_, i) => (
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

      {/* Rising sparkles */}
      <View pointerEvents="none" style={s.particleLayer}>
        <SparkleField
          active={running}
          originX={cx}
          originY={canopyCenterY}
          spread={canopyR}
          maturity={t}
          count={10}
        />
      </View>

      <Animated.View style={[s.treeWrap, { transform: [{ scale: 1.25 }] }]}>
        {/* Ground shadow */}
        <View
          style={[
            s.groundShadow,
            {
              left: cx - Math.max(40, 24 + trunkW),
              width: Math.max(80, (24 + trunkW) * 2),
              opacity: isDark ? 0.3 : 0.18,
            },
          ]}
        />

        {/* Roots */}
        {roots.map((root) => (
          <View
            key={`root-${root.key}`}
            style={[
              s.root,
              {
                left: root.left,
                bottom: root.bottom,
                width: root.width,
                height: root.thickness,
                opacity: root.opacity,
                backgroundColor: trunkColor,
                transform: [{ rotate: `${root.angle}deg` }],
              },
            ]}
          />
        ))}

        {/* Pot */}
        <Animated.View
          style={[
            s.pot,
            {
              backgroundColor: trunkColor,
              borderColor: trunkColor,
              left: cx - 28,
              shadowColor: glowColor,
              shadowOpacity: potGlow,
              shadowRadius: running ? 8 : 2,
              shadowOffset: { width: 0, height: 0 },
            },
          ]}
        >
          <Text style={s.potText}>{Math.floor(pct)}%</Text>
        </Animated.View>

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
              borderTopLeftRadius: trunkW * 0.35,
              borderTopRightRadius: trunkW * 0.35,
              transform: [{ translateY: trunkEntry }, { rotate: trunkSway }],
            },
          ]}
        >
          {/* Bark texture lines */}
          <View
            style={[
              s.barkLine,
              {
                left: "25%",
                height: "70%",
                bottom: 0,
                backgroundColor: isDark ? "#00000025" : "#00000018",
              },
            ]}
          />
          <View
            style={[
              s.barkLine,
              {
                left: "48%",
                height: "55%",
                bottom: 0,
                backgroundColor: isDark ? "#00000020" : "#00000014",
              },
            ]}
          />
          <View
            style={[
              s.barkLine,
              {
                left: "68%",
                height: "65%",
                bottom: 0,
                backgroundColor: isDark ? "#00000022" : "#00000016",
              },
            ]}
          />
          <View
            style={[
              s.barkLine,
              {
                left: "85%",
                height: "40%",
                bottom: "10%",
                backgroundColor: isDark ? "#00000018" : "#00000010",
              },
            ]}
          />

          {/* Trunk shade */}
          <View
            style={[
              s.trunkShade,
              { backgroundColor: isDark ? "#00000030" : "#00000022" },
            ]}
          />
        </Animated.View>

        {/* Root flare at base */}
        <View
          style={[
            s.rootFlare,
            {
              width: trunkW * 2.2,
              left: cx - trunkW * 1.1,
              bottom: trunkBot - 3,
              backgroundColor: trunkColor,
            },
          ]}
        />

        {/* Side tufts (leaf clusters on trunk) */}
        {sideTufts.map((tuft) => (
          <View
            key={`tuft-${tuft.key}`}
            style={[
              s.tuftLeaf,
              {
                left: tuft.left - tuft.size / 2,
                bottom: tuft.bottom - tuft.size / 2,
                width: tuft.size,
                height: tuft.size,
                borderRadius: tuft.size / 2,
                backgroundColor: tuft.color,
                opacity: tuft.opacity,
              },
            ]}
          />
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
            shadowRadius: running ? 14 : 8,
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
  fireflyLayer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 260,
    height: 300,
    zIndex: 10,
  },
  particleLayer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 260,
    height: 300,
    zIndex: 8,
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
  root: {
    position: "absolute",
    zIndex: 2,
    borderRadius: 2,
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
  tuftLeaf: { position: "absolute", zIndex: 4 },
  leaf: { position: "absolute", zIndex: 4 },
  flower: { position: "absolute", zIndex: 6 },
});
