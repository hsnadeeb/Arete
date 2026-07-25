import React, { useEffect, useRef } from "react";
import { Text, Animated, Easing, StyleSheet } from "react-native";
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
  const sparkle1 = useRef(new Animated.Value(0)).current;
  const sparkle2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      anim.setValue(0);
      Animated.sequence([
        Animated.parallel([
          Animated.spring(anim, {
            toValue: 1,
            friction: 4,
            tension: 120,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.delay(200),
            Animated.loop(
              Animated.sequence([
                Animated.timing(sparkle1, {
                  toValue: 1, duration: 600, easing: Easing.inOut(Easing.sin), useNativeDriver: true,
                }),
                Animated.timing(sparkle1, {
                  toValue: 0, duration: 600, easing: Easing.inOut(Easing.sin), useNativeDriver: true,
                }),
              ]),
              { iterations: 2 },
            ),
          ]),
          Animated.sequence([
            Animated.delay(500),
            Animated.loop(
              Animated.sequence([
                Animated.timing(sparkle2, {
                  toValue: 1, duration: 500, easing: Easing.inOut(Easing.sin), useNativeDriver: true,
                }),
                Animated.timing(sparkle2, {
                  toValue: 0, duration: 500, easing: Easing.inOut(Easing.sin), useNativeDriver: true,
                }),
              ]),
              { iterations: 2 },
            ),
          ]),
        ]),
        Animated.delay(1200),
        Animated.timing(anim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      anim.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[s.wrap, { opacity: anim, transform: [{ scale }] }]}
    >
      {/* Sparkle accents */}
      <Animated.Text
        style={[
          s.sparkleLeft,
          { opacity: sparkle1, transform: [{ scale: sparkle1.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.3] }) }] },
        ]}
      >
        ✦
      </Animated.Text>
      <Animated.Text
        style={[
          s.sparkleRight,
          { opacity: sparkle2, transform: [{ scale: sparkle2.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.3] }) }] },
        ]}
      >
        ✦
      </Animated.Text>
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
  sparkleLeft: {
    position: "absolute",
    left: "20%",
    top: -8,
    fontSize: 18,
    color: "#ffd54f",
    zIndex: 111,
  },
  sparkleRight: {
    position: "absolute",
    right: "20%",
    top: -4,
    fontSize: 14,
    color: "#ffd54f",
    zIndex: 111,
  },
});
