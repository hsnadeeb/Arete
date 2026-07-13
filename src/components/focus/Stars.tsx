import React, { useEffect, useRef } from "react";
import { Animated, Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

const STAR_COUNT = 70;

const stars = Array.from({ length: STAR_COUNT }).map(() => ({
  x: Math.random() * width,
  y: Math.random() * (height * 0.45),
  size: Math.random() * 3 + 1,
  delay: Math.random() * 3000,
}));

function Star({ x, y, size, delay }: any) {
  const opacity = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),

        Animated.timing(opacity, {
          toValue: 1,
          duration: 1600,
          useNativeDriver: true,
        }),

        Animated.timing(opacity, {
          toValue: 0.15,
          duration: 1600,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: size,
        backgroundColor: "white",
        opacity,
      }}
    />
  );
}

export default function Stars() {
  return (
    <>
      {stars.map((star, i) => (
        <Star key={i} {...star} />
      ))}
    </>
  );
}
