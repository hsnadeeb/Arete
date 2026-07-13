import React, { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";
import { SPARK, hash } from "./constants";

interface FireflyProps {
  seed: number;
  active: boolean;
  originX: number;
  originY: number;
  spread: number;
}

export function Firefly({
  seed,
  active,
  originX,
  originY,
  spread,
}: FireflyProps) {
  const rise = useRef(new Animated.Value(0)).current;
  const drift = useRef(new Animated.Value(0)).current;
  const twinkle = useRef(new Animated.Value(0)).current;
  const startX = originX + (hash(seed, 0.11) * 2 - 1) * (spread * 0.9);
  const baseBottom = originY + (hash(seed, 0.6) * 2 - 1) * (spread * 0.6);
  const size = 5.0 + hash(seed, 0.77) * 5.0;
  const duration = 8000 + hash(seed, 0.33) * 6000;
  const delay = hash(seed, 0.55) * 3000;

  useEffect(() => {
    if (!active) return;
    rise.setValue(0);
    drift.setValue(0);
    twinkle.setValue(0);
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
  }, [active, rise, drift, twinkle, duration, delay]);

  if (!active) return null;

  const travel = 26 + spread * 0.5;
  const translateY = rise.interpolate({
    inputRange: [0, 1],
    outputRange: [travel, -travel],
  });
  const translateX = drift.interpolate({
    inputRange: [-1, 1],
    outputRange: [-spread * 0.35, spread * 0.35],
  });
  const opacity = rise.interpolate({
    inputRange: [0, 0.15, 0.85, 1],
    outputRange: [0, 1, 1, 0],
  });

  const color = SPARK[seed % SPARK.length];

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: startX,
        bottom: baseBottom,
        width: size,
        height: size,
        borderRadius: size,
        backgroundColor: color,
        opacity: Animated.multiply(opacity, twinkle),
        transform: [{ translateY }, { translateX }],
        shadowColor: color,
        shadowOpacity: 0.9,
        shadowRadius: 4,
      }}
    />
  );
}
