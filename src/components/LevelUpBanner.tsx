// components/LevelUpBanner.tsx
import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Icon } from "../components/Icons";

type LevelUpBannerProps = {
  visible: boolean;
  title: string;
  iconKey: string;
};

export const LevelUpBanner: React.FC<LevelUpBannerProps> = ({
  visible,
  title,
  iconKey,
}) => {
  const anim = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      anim.value = withSpring(1, { damping: 5, stiffness: 80 });
      const timer = setTimeout(() => {
        anim.value = withTiming(0, { duration: 280 });
      }, 1400);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: anim.value,
    transform: [{ scale: 0.6 + anim.value * 0.4 }],
  }));

  if (!visible) return null;

  return (
    <Animated.View pointerEvents="none" style={[s.levelUpWrap, animatedStyle]}>
      <View style={s.levelUpCard}>
        <Icon name={iconKey as any} size={22} color="#ffd54f" />
        <Text style={s.levelUpTitle}>Level Up!</Text>
        <Text style={s.levelUpSub}>{title}</Text>
      </View>
    </Animated.View>
  );
};

const s = StyleSheet.create({
  levelUpWrap: {
    position: "absolute",
    top: 100,
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
  levelUpTitle: { color: "#ffd54f", fontWeight: "800", fontSize: 16 },
  levelUpSub: { color: "#fff", fontWeight: "600", fontSize: 13, opacity: 0.9 },
});
