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
  const driftX = useRef(new Animated.Value(0)).current;
  const driftY = useRef(new Animated.Value(0)).current;
  const twinkle = useRef(new Animated.Value(0)).current;

  const startX = originX + (hash(seed, 0.11) * 2 - 1) * spread * 0.9;
  const baseBottom = originY + (hash(seed, 0.6) * 2 - 1) * spread * 0.6;
  const size = 3 + hash(seed, 0.77) * 3.5;
  const duration = 14000 + hash(seed, 0.33) * 12000;
  const delay = hash(seed, 0.55) * 6000;
  const wanderX = (hash(seed, 0.91) * 2 - 1) * spread * 0.5;
  const wanderY = (hash(seed, 0.13) * 2 - 1) * spread * 0.4;

  useEffect(() => {
    if (!active) return;
    rise.setValue(0);
    driftX.setValue(0);
    driftY.setValue(0);
    twinkle.setValue(0);

    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(rise, {
            toValue: 1,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.loop(
            Animated.sequence([
              Animated.timing(driftX, {
                toValue: wanderX,
                duration: duration * 0.55,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
              }),
              Animated.timing(driftX, {
                toValue: -wanderX * 0.6,
                duration: duration * 0.45,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
              }),
            ]),
          ),
          Animated.loop(
            Animated.sequence([
              Animated.timing(driftY, {
                toValue: wanderY,
                duration: duration * 0.4,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
              }),
              Animated.timing(driftY, {
                toValue: -wanderY * 0.7,
                duration: duration * 0.6,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
              }),
            ]),
          ),
          Animated.loop(
            Animated.sequence([
              Animated.timing(twinkle, { toValue: 1, duration: 900 + hash(seed, 0.21) * 1100, useNativeDriver: true }),
              Animated.timing(twinkle, { toValue: 0.15, duration: 900 + hash(seed, 0.21) * 1100, useNativeDriver: true }),
            ]),
          ),
        ]),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, rise, driftX, driftY, twinkle, duration, delay, wanderX, wanderY]);

  if (!active) return null;

  const travel = 22 + spread * 0.5;
  const translateY = rise.interpolate({
    inputRange: [0, 1],
    outputRange: [travel, -travel],
  });
  const opacity = rise.interpolate({
    inputRange: [0, 0.12, 0.85, 1],
    outputRange: [0, 1, 1, 0],
  });
  const coreOpacity = twinkle.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1],
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
        opacity: Animated.multiply(opacity, twinkle),
        transform: [
          { translateY },
          { translateX: driftX },
          { translateY: driftY },
        ],
      }}
    >
      {/* Outer halo glow */}
      <Animated.View
        style={{
          position: "absolute",
          left: -size * 2.2,
          top: -size * 2.2,
          width: size * 5.4,
          height: size * 5.4,
          borderRadius: size * 2.7,
          backgroundColor: color,
          opacity: Animated.multiply(opacity, twinkle.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.32] })),
        }}
      />
      {/* Bright core */}
      <Animated.View
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: size,
          height: size,
          borderRadius: size,
          backgroundColor: "#fff7d6",
          opacity: coreOpacity,
        }}
      />
    </Animated.View>
  );
}
