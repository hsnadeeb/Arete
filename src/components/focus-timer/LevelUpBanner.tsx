import React, { useEffect, useRef } from "react";
import { Text, Animated, StyleSheet } from "react-native";
import { Icon } from "../Icons";
import { TYPOGRAPHY } from "../../constants/typography";

interface LevelUpBannerProps {
  visible: boolean;
  title: string;
  iconKey: string;
}

export function LevelUpBanner({ visible, title, iconKey }: LevelUpBannerProps) {
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
      style={[s.levelUpWrap, { opacity: anim, transform: [{ scale }] }]}
    >
      <Animated.View style={s.levelUpCard}>
        <Icon name={iconKey as any} size={22} color="#ffd54f" />
        <Text style={s.levelUpTitle}>Level Up!</Text>
        <Text style={s.levelUpSub}>{title}</Text>
      </Animated.View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  levelUpWrap: {
    position: "absolute",
    top: 130,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 110,
  },
  levelUpCard: {
    backgroundColor: "rgba(20,20,20,0.9)",
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 14,
    alignItems: "center",
    gap: 2,
    borderWidth: 1,
    borderColor: "rgba(255,213,79,0.4)",
  },
  levelUpTitle: {
    color: "#ffd54f",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  levelUpSub: { color: "#fff", fontWeight: "600", fontSize: 13, opacity: 0.9 },
});
