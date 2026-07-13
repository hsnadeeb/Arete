import React, { useEffect, useRef } from "react";

import { Animated, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

export default function Fog() {
  const x = useRef(new Animated.Value(-60)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(x, {
          toValue: 60,
          duration: 18000,
          useNativeDriver: true,
        }),

        Animated.timing(x, {
          toValue: -60,
          duration: 18000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: "absolute",
        bottom: 140,
        width: width + 120,
        height: 120,
        backgroundColor: "white",
        opacity: 0.05,
        borderRadius: 100,
        transform: [
          {
            translateX: x,
          },
        ],
      }}
    />
  );
}
