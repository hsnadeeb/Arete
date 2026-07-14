import React, { useEffect, useRef, useMemo } from "react";
import { View, Text, Animated, Easing, StyleSheet } from "react-native";
import { TYPOGRAPHY } from "../../constants/typography";
import {
  CANOPY_BLOBS,
  BLOSSOM_SPOTS,
  GREEN,
  BRN,
  BRN_L,
  FLW,
  SPARK,
  smoothstep,
  skyColorAt,
  hash,
} from "./constants";
import { Firefly } from "./Firefly";

interface GrowingTreeProps {
  pct: number;
  isDark: boolean;
  running: boolean;
}

export function GrowingTree({ pct, isDark, running }: GrowingTreeProps) {
  const t = Math.min(pct / 100, 1);

  // ---------- Tree Geometry ----------
  const cx = 130;

  // Trunk
  const trunkBot = 42;
  const trunkH = 42 + t * 58;
  const trunkW = 18 + t * 12;

  // Top of trunk (used to attach canopy)
  const trunkTop = trunkBot + trunkH;

  // Canopy
  const canopyR = 36 + t * 46;

  // Attach canopy directly to trunk.
  // Increase this number to move the canopy DOWN.
  // Decrease it to move the canopy UP.
  const canopyCenterY = trunkTop;

  const maturity = Math.min(4, Math.floor(t * 5));

  const canopy = useMemo(() => {
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
        by: canopyCenterY - b.dy * canopyR,
        r: b.r * canopyR * 0.62 * (0.4 + 0.6 * local),
        color: GREEN[colorIdx],
        opacity: 0.55 + local * 0.35,
      };
    }).filter((c) => c.r > 1);
  }, [t, canopyR, maturity, canopyCenterY]);

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

  const animScale = useRef(new Animated.Value(0.01)).current;
  useEffect(() => {
    Animated.spring(animScale, {
      toValue: 1,
      friction: 6,
      tension: 60,
      useNativeDriver: true,
    }).start();
  }, []);

  // ── Trunk entrance: slide up from below ──
  const trunkEntry = useRef(new Animated.Value(24)).current;
  useEffect(() => {
    Animated.spring(trunkEntry, {
      toValue: 0,
      friction: 6,
      tension: 60,
      useNativeDriver: true,
    }).start();
  }, []);

  // ── Continuous gentle breathing ──
  const breath = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          toValue: 1,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breath, {
          toValue: -1,
          duration: 2800,
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
    outputRange: [0.975, 1, 1.025],
  });

  // ── Growth spurt pulse (on progress change) ──
  const growPulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.spring(growPulse, {
        toValue: 1.04,
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

  // ── Wind sway ──
  const sway = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, {
          toValue: 1,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(sway, {
          toValue: -1,
          duration: 2400,
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
    outputRange: ["-2deg", "2deg"],
  });

  const trunkSway = sway.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-0.4deg", "0.4deg"],
  });

  // ── Warm glow pulse ──
  const glow = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    if (running) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(glow, {
            toValue: 1,
            duration: 1800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glow, {
            toValue: 0.35,
            duration: 1800,
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

  const trunkColor = isDark ? BRN_L : BRN;

  return (
    <View style={s.treeArea}>
      <View pointerEvents="none" style={s.fireflyLayer}>
        {Array.from({ length: running ? 6 : 0 }, (_, i) => (
          <Firefly
            key={i}
            seed={i}
            active={running}
            originX={cx}
            originY={canopyCenterY}
            spread={canopyR}
          />
        ))}
      </View>
      <Animated.View style={[s.treeWrap, { transform: [{ scale: 1.25 }] }]}>
        <View
          style={[
            s.groundShadow,
            {
              left: cx - (24 + trunkW),
              width: (24 + trunkW) * 2,
              opacity: isDark ? 0.28 : 0.16,
            },
          ]}
        />

        <View
          style={[
            s.pot,
            {
              backgroundColor: trunkColor,
              borderColor: trunkColor,
              left: cx - 28,
            },
          ]}
        >
          <Text style={s.potText}>{Math.floor(pct)}%</Text>
        </View>

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
          <View
            style={[
              s.trunkShade,
              { backgroundColor: isDark ? "#00000030" : "#00000022" },
            ]}
          />
        </Animated.View>
        <View
          style={[
            s.rootFlare,
            {
              width: trunkW * 2.1,
              left: cx - trunkW * 1.05,
              bottom: trunkBot - 3,
              backgroundColor: trunkColor,
            },
          ]}
        />

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
  leaf: { position: "absolute", zIndex: 4 },
  flower: { position: "absolute", zIndex: 6 },
});
