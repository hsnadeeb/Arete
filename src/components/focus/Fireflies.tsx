import React, { useEffect, useRef } from "react";

import { Animated, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

const FIREFLIES = Array.from({
  length: 16,
}).map(() => ({
  x: Math.random() * width,
  y: 330 + Math.random() * 220,
  delay: Math.random() * 5000,
}));

function Fly({ x, y, delay }: any) {
  const opacity = useRef(new Animated.Value(0.1)).current;

  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.delay(delay),

          Animated.timing(opacity, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),

          Animated.timing(opacity, {
            toValue: 0.15,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),

        Animated.sequence([
          Animated.timing(float, {
            toValue: -8,
            duration: 2000,
            useNativeDriver: true,
          }),

          Animated.timing(float, {
            toValue: 8,
            duration: 2000,
            useNativeDriver: true,
          }),

          Animated.timing(float, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 6,
        height: 6,
        borderRadius: 6,
        backgroundColor: "#FFD94A",
        shadowColor: "#FFD94A",
        shadowRadius: 12,
        shadowOpacity: 1,
        opacity,
        transform: [
          {
            translateY: float,
          },
        ],
      }}
    />
  );
}

export default function Fireflies() {
  return (
    <>
      {FIREFLIES.map((f, i) => (
        <Fly key={i} {...f} />
      ))}
    </>
  );
}
