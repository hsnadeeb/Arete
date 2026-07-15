import React, { useEffect, useRef } from "react";
import { Text, Animated, StyleSheet } from "react-native";
import { TYPOGRAPHY } from "../../constants/typography";

interface StageUnlockBannerProps {
  visible: boolean;
  stageEmoji: string;
  stageName: string;
}

export function StageUnlockBanner({
  visible,
  stageEmoji,
  stageName,
}: StageUnlockBannerProps) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.spring(anim, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.delay(1400),
        Animated.timing(anim, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      anim.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[s.wrap, { opacity: anim, transform: [{ scale }] }]}
    >
      <Animated.View style={s.card}>
        <Text style={s.emoji}>{stageEmoji}</Text>
        <Text style={s.title}>Stage Unlocked!</Text>
        <Text style={s.sub}>{stageName}</Text>
      </Animated.View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: 130,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 110,
  },
  card: {
    backgroundColor: "rgba(20,20,20,0.9)",
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 14,
    alignItems: "center",
    gap: 2,
    borderWidth: 1,
    borderColor: "rgba(255,213,79,0.4)",
  },
  emoji: { fontSize: 28 },
  title: {
    color: "#ffd54f",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  sub: { color: "#fff", fontWeight: "600", fontSize: 13, opacity: 0.9 },
});
