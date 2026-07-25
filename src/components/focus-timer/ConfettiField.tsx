import React, { useEffect, useRef } from "react";
import { View, Animated, Easing, StyleSheet } from "react-native";
import { CONFETTI, hash } from "./constants";

function ConfettiPiece({ seed, trigger }: { seed: number; trigger: number }) {
  const fall = useRef(new Animated.Value(0)).current;
  const startX = hash(seed, 0.12) * 180 + 10;
  const size = 4 + hash(seed, 0.51) * 6;
  const color = CONFETTI[seed % CONFETTI.length];
  const duration = 1600 + hash(seed, 0.66) * 1200;
  const delay = hash(seed, 0.34) * 200;
  const isDot = seed % 3 === 0;
  const drift = (hash(seed, 0.7) - 0.5) * 60;

  useEffect(() => {
    fall.setValue(0);
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(fall, {
          toValue: 1,
          duration,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [trigger, fall, duration, delay]);

  const translateY = fall.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 280],
  });
  const translateX = fall.interpolate({
    inputRange: [0, 0.4, 0.7, 1],
    outputRange: [0, drift * 0.3, drift * 0.7, drift],
  });
  const rotate = fall.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", `${(hash(seed, 0.4) > 0.5 ? 1 : -1) * (540 + hash(seed, 0.8) * 360)}deg`],
  });
  const opacity = fall.interpolate({
    inputRange: [0, 0.82, 1],
    outputRange: [1, 1, 0],
  });
  const scale = fall.interpolate({
    inputRange: [0, 0.1, 1],
    outputRange: [0.3, 1, 0.8],
  });

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: startX,
        top: 0,
        width: isDot ? size : size,
        height: isDot ? size : size * 0.4,
        borderRadius: isDot ? size / 2 : 1,
        backgroundColor: color,
        opacity,
        transform: [{ translateY }, { translateX }, { rotate }, { scale }],
      }}
    />
  );
}

export function ConfettiField({ trigger }: { trigger: number }) {
  if (trigger === 0) return null;
  return (
    <View pointerEvents="none" style={s.confettiField}>
      {Array.from({ length: 48 }, (_, i) => (
        <ConfettiPiece key={`${trigger}-${i}`} seed={i} trigger={trigger} />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  confettiField: {
    position: "absolute",
    top: -20,
    width: 200,
    alignSelf: "center",
    bottom: 0,
  },
});
