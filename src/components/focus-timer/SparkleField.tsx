import React, { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";
import { SPARKLE_COLORS, hash } from "./constants";

function Sparkle({
  seed,
  active,
  originX,
  originY,
  spread,
  maturity,
}: {
  seed: number;
  active: boolean;
  originX: number;
  originY: number;
  spread: number;
  maturity: number;
}) {
  const rise = useRef(new Animated.Value(0)).current;
  const twinkle = useRef(new Animated.Value(0)).current;
  const driftX = useRef(new Animated.Value(0)).current;

  const startX = originX + (hash(seed, 0.41) * 2 - 1) * spread * 0.7;
  const startY = originY - hash(seed, 0.82) * spread * 0.35;
  const size = 2 + hash(seed, 0.23) * 3;
  const color = SPARKLE_COLORS[seed % SPARKLE_COLORS.length];
  const duration = 8000 + hash(seed, 0.55) * 10000;
  const delay = hash(seed, 0.66) * 5000;
  const driftMag = (hash(seed, 0.9) - 0.5) * spread * 0.2;
  const visible = maturity > 0.3 && active;

  useEffect(() => {
    if (!visible) return;
    rise.setValue(0);
    twinkle.setValue(0);
    driftX.setValue(0);

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
          Animated.timing(driftX, {
            toValue: driftMag,
            duration: duration * 0.6,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.loop(
            Animated.sequence([
              Animated.timing(twinkle, {
                toValue: 1,
                duration: 800 + hash(seed, 0.34) * 1000,
                easing: Easing.out(Easing.sin),
                useNativeDriver: true,
              }),
              Animated.timing(twinkle, {
                toValue: 0.08,
                duration: 800 + hash(seed, 0.34) * 1000,
                easing: Easing.in(Easing.sin),
                useNativeDriver: true,
              }),
            ]),
          ),
        ]),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [visible, rise, twinkle, driftX, duration, delay, driftMag]);

  if (!visible) return null;

  const translateY = rise.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -(40 + spread * 0.5)],
  });
  const riseOpacity = rise.interpolate({
    inputRange: [0, 0.08, 0.6, 1],
    outputRange: [0, 1, 1, 0],
  });
  const totalOpacity = Animated.multiply(riseOpacity, twinkle);

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: startX,
        bottom: startY,
        width: size * 3,
        height: size * 3,
        opacity: totalOpacity,
        transform: [{ translateY }, { translateX: driftX }],
      }}
    >
      <Animated.View
        style={{
          position: "absolute",
          left: size * 0.5,
          top: size * 0.5,
          width: size * 2,
          height: size * 2,
          borderRadius: size,
          backgroundColor: color,
          opacity: 0.35,
        }}
      />
      <Animated.View
        style={{
          position: "absolute",
          left: size * 1.25,
          top: size * 1.25,
          width: size * 0.5,
          height: size * 0.5,
          borderRadius: size * 0.25,
          backgroundColor: "#ffffff",
        }}
      />
    </Animated.View>
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
