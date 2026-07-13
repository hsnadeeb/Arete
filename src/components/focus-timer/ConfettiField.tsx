import React, { useEffect, useRef } from "react";
import { View, Animated, Easing, StyleSheet } from "react-native";
import { CONFETTI, hash } from "./constants";

interface ConfettiPieceProps {
  seed: number;
  trigger: number;
}

function ConfettiPiece({ seed, trigger }: ConfettiPieceProps) {
  const fall = useRef(new Animated.Value(0)).current;
  const startX = hash(seed, 0.12) * 180 + 10;
  const size = 5 + hash(seed, 0.51) * 5;
  const color = CONFETTI[seed % CONFETTI.length];
  const duration = 1600 + hash(seed, 0.66) * 900;
  const delay = hash(seed, 0.34) * 300;

  useEffect(() => {
    fall.setValue(0);
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(fall, {
        toValue: 1,
        duration,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [trigger, fall, duration, delay]);

  const translateY = fall.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 260],
  });
  const translateX = fall.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, hash(seed, 0.9) * 30 - 15, hash(seed, 0.2) * 40 - 20],
  });
  const rotate = fall.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", `${(hash(seed, 0.4) > 0.5 ? 1 : -1) * 540}deg`],
  });
  const opacity = fall.interpolate({
    inputRange: [0, 0.85, 1],
    outputRange: [1, 1, 0],
  });

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: startX,
        top: 0,
        width: size,
        height: size * 0.4,
        backgroundColor: color,
        opacity,
        transform: [{ translateY }, { translateX }, { rotate }],
      }}
    />
  );
}

interface ConfettiFieldProps {
  trigger: number;
}

export function ConfettiField({ trigger }: ConfettiFieldProps) {
  if (trigger === 0) return null;
  return (
    <View pointerEvents="none" style={s.confettiField}>
      {Array.from({ length: 36 }, (_, i) => (
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
