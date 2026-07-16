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
  const spin = useRef(new Animated.Value(0)).current;

  const startX = originX + (hash(seed, 0.31) * 2 - 1) * spread * 0.8;
  const startY = originY + hash(seed, 0.72) * spread * 0.3;
  const size = 3 + hash(seed, 0.18) * 3;
  const color = LEAF_FALL_COLORS[seed % LEAF_FALL_COLORS.length];
  const duration = 10000 + hash(seed, 0.44) * 8000;
  const delay = hash(seed, 0.55) * 6000;
  const driftAmount = 20 + hash(seed, 0.66) * 25;
  const visible = maturity > 0.25 && active;

  useEffect(() => {
    if (!visible) return;
    fall.setValue(0);
    sway.setValue(0);
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
              Animated.timing(sway, {
                toValue: 1,
                duration: 2800,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
              }),
              Animated.timing(sway, {
                toValue: -1,
                duration: 2800,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
              }),
            ]),
          ),
          Animated.loop(
            Animated.sequence([
              Animated.timing(spin, {
                toValue: 1,
                duration: 5000,
                useNativeDriver: true,
              }),
              Animated.timing(spin, {
                toValue: 0,
                duration: 5000,
                useNativeDriver: true,
              }),
            ]),
          ),
        ]),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [visible, fall, sway, spin, duration, delay]);

  if (!visible) return null;

  const translateY = fall.interpolate({
    inputRange: [0, 1],
    outputRange: [-10, 60 + spread * 0.5],
  });
  const translateX = sway.interpolate({
    inputRange: [-1, 1],
    outputRange: [-driftAmount, driftAmount],
  });
  const opacity = fall.interpolate({
    inputRange: [0, 0.05, 0.85, 1],
    outputRange: [0, 0.8, 0.8, 0],
  });
  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: startX,
        bottom: startY,
        width: size,
        height: size * 1.4,
        borderRadius: size * 0.2,
        backgroundColor: color,
        opacity,
        transform: [
          { translateY },
          { translateX },
          { rotate },
        ],
      }}
    />
  );
}
