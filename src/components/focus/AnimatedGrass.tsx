import React, { useEffect, useRef } from "react";
import { Animated, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

const GRASS = Array.from({ length: 90 }).map(() => ({
  x: Math.random() * width,
  h: 18 + Math.random() * 18,
  d: Math.random() * 4000,
}));

function Blade({ x, h, d }: any) {
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(d),

        Animated.timing(rotate, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true,
        }),

        Animated.timing(rotate, {
          toValue: -1,
          duration: 2200,
          useNativeDriver: true,
        }),

        Animated.timing(rotate, {
          toValue: 0,
          duration: 2200,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const rotation = rotate.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-6deg", "6deg"],
  });

  return (
    <Animated.View
      style={{
        position: "absolute",
        bottom: 118,
        left: x,
        width: 2,
        height: h,
        backgroundColor: "#6BB66A",
        borderRadius: 2,
        transform: [{ rotate: rotation }],
      }}
    />
  );
}

export default function AnimatedGrass() {
  return (
    <>
      {GRASS.map((g, i) => (
        <Blade key={i} {...g} />
      ))}
    </>
  );
}
