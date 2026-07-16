import React, { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";
import { LEAF_FALL_COLORS, hash } from "./constants";

interface FloatingLeafProps {
  seed: number;
  active: boolean;
  originX: number;
  originY: number;
  spread: number;
  maturity: number;
}

export function FloatingLeaf({
  seed,
  active,
  originX,
  originY,
  spread,
  maturity,
}: FloatingLeafProps) {
  const fall = useRef(new Animated.Value(0)).current;
  const sway = useRef(new Animated.Value(0)).current;
  const flutter = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;

  const startX = originX + (hash(seed, 0.31) * 2 - 1) * spread * 0.8;
  const startY = originY + hash(seed, 0.72) * spread * 0.3;
  const size = 5 + hash(seed, 0.18) * 5;
  const color = LEAF_FALL_COLORS[seed % LEAF_FALL_COLORS.length];
  const colorDark = hash(seed, 0.9) > 0.5 ? "#00000022" : "#ffffff18";
  const duration = 11000 + hash(seed, 0.44) * 9000;
  const delay = hash(seed, 0.55) * 7000;
  const driftAmount = 24 + hash(seed, 0.66) * 30;
  const depth = 0.7 + hash(seed, 0.42) * 0.3;
  const spinTurns = 1 + Math.floor(hash(seed, 0.77) * 2);
  const visible = maturity > 0.25 && active;

  useEffect(() => {
    if (!visible) return;
    fall.setValue(0);
    sway.setValue(0);
    flutter.setValue(0);
    spin.setValue(0);

    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(fall, {
            toValue: 1,
            duration,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.loop(
            Animated.sequence([
              Animated.timing(sway, { toValue: 1, duration: 2600 + hash(seed, 0.5) * 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
              Animated.timing(sway, { toValue: -1, duration: 2600 + hash(seed, 0.5) * 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            ]),
          ),
          Animated.loop(
            Animated.sequence([
              Animated.timing(flutter, { toValue: 1, duration: 700 + hash(seed, 0.61) * 500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
              Animated.timing(flutter, { toValue: 0, duration: 700 + hash(seed, 0.61) * 500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            ]),
          ),
          Animated.timing(spin, {
            toValue: spinTurns,
            duration,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [visible, fall, sway, flutter, spin, duration, delay, spinTurns]);

  if (!visible) return null;

  const translateY = fall.interpolate({
    inputRange: [0, 1],
    outputRange: [-10, 70 + spread * 0.5],
  });
  const translateX = sway.interpolate({
    inputRange: [-1, 1],
    outputRange: [-driftAmount, driftAmount],
  });
  const opacity = fall.interpolate({
    inputRange: [0, 0.06, 0.85, 1],
    outputRange: [0, 0.9 * depth, 0.9 * depth, 0],
  });
  const rotate = spin.interpolate({
    inputRange: [0, spinTurns],
    outputRange: ["0deg", `${spinTurns * 360}deg`],
  });
  const scaleX = flutter.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.35],
  });

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: startX,
        bottom: startY,
        width: size,
        height: size * 1.5,
        opacity,
        transform: [
          { translateY },
          { translateX },
          { rotate },
          { scaleX },
        ],
        shadowColor: color,
        shadowOpacity: 0.25,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 0 },
      }}
    >
      {/* Leaf body */}
      <Animated.View
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: size,
          height: size * 1.5,
          borderRadius: size * 0.5,
          backgroundColor: color,
          opacity: 0.92,
        }}
      />
      {/* Central vein for detail */}
      <Animated.View
        style={{
          position: "absolute",
          left: size * 0.46,
          top: size * 0.1,
          width: size * 0.08,
          height: size * 1.3,
          borderRadius: size * 0.04,
          backgroundColor: colorDark,
          opacity: 0.5,
        }}
      />
    </Animated.View>
  );
}
