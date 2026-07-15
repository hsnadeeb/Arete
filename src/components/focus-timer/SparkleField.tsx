import React, { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";
import { SPARKLE_COLORS, hash } from "./constants";

interface SparkleProps {
  seed: number;
  active: boolean;
  originX: number;
  originY: number;
  spread: number;
  maturity: number;
}

function Sparkle({
  seed,
  active,
  originX,
  originY,
  spread,
  maturity,
}: SparkleProps) {
  const rise = useRef(new Animated.Value(0)).current;
  const twinkle = useRef(new Animated.Value(0)).current;

  const startX = originX + (hash(seed, 0.41) * 2 - 1) * spread * 0.65;
  const startY = originY - hash(seed, 0.82) * spread * 0.35;
  const size = 2 + hash(seed, 0.23) * 3;
  const color = SPARKLE_COLORS[seed % SPARKLE_COLORS.length];
  const duration = 4000 + hash(seed, 0.55) * 4000;
  const delay = hash(seed, 0.66) * 5000;
  const visible = maturity > 0.3 && active;

  useEffect(() => {
    if (!visible) return;
    rise.setValue(0);
    twinkle.setValue(0);

    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(rise, {
            toValue: 1,
            duration,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.loop(
            Animated.sequence([
              Animated.timing(twinkle, {
                toValue: 1,
                duration: 500 + hash(seed, 0.34) * 400,
                useNativeDriver: true,
              }),
              Animated.timing(twinkle, {
                toValue: 0.1,
                duration: 500 + hash(seed, 0.34) * 400,
                useNativeDriver: true,
              }),
            ]),
          ),
        ]),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [visible, rise, twinkle, duration, delay]);

  if (!visible) return null;

  const translateY = rise.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -(40 + spread * 0.4)],
  });
  const riseOpacity = rise.interpolate({
    inputRange: [0, 0.1, 0.6, 1],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: startX,
        bottom: startY,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity: Animated.multiply(riseOpacity, twinkle),
        transform: [{ translateY }],
        shadowColor: color,
        shadowOpacity: 0.8,
        shadowRadius: size * 1.5,
      }}
    />
  );
}

interface SparkleFieldProps {
  active: boolean;
  originX: number;
  originY: number;
  spread: number;
  maturity: number;
  count?: number;
}

export function SparkleField({
  active,
  originX,
  originY,
  spread,
  maturity,
  count = 10,
}: SparkleFieldProps) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <Sparkle
          key={i}
          seed={i + 100}
          active={active}
          originX={originX}
          originY={originY}
          spread={spread}
          maturity={maturity}
        />
      ))}
    </>
  );
}
