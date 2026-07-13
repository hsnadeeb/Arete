import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing } from "react-native";
import { FLW, hash } from "./constants";

interface BurstParticleProps {
  seed: number;
  colorSet: string[];
  onDone: () => void;
  trigger: number;
  originX: number;
  originY: number;
}

function BurstParticle({
  seed,
  colorSet,
  onDone,
  trigger,
  originX,
  originY,
}: BurstParticleProps) {
  const anim = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const angle = hash(seed, 0.21) * Math.PI * 2;
  const dist = 55 + hash(seed, 0.63) * 70;
  const size = 4 + hash(seed, 0.44) * 5;
  const color = colorSet[Math.floor(hash(seed, 0.88) * colorSet.length)];
  const isFlower = colorSet === FLW;

  useEffect(() => {
    anim.setValue(0);
    spin.setValue(0);
    Animated.parallel([
      Animated.timing(anim, {
        toValue: 1,
        duration: 950 + hash(seed, 0.15) * 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(spin, {
        toValue: 1,
        duration: 950,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => finished && onDone());
  }, [trigger, seed, colorSet, onDone]);

  const tx = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.cos(angle) * dist],
  });
  const ty = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.sin(angle) * dist - 30],
  });
  const opacity = anim.interpolate({
    inputRange: [0, 0.15, 0.75, 1],
    outputRange: [0, 1, 1, 0],
  });
  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", `${360 * (hash(seed, 0.9) > 0.5 ? 1 : -1)}deg`],
  });

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: originX - size / 2,
        top: originY,
        width: size,
        height: size * (isFlower ? 1.6 : 1),
        borderRadius: size,
        backgroundColor: color,
        opacity,
        transform: [{ translateX: tx }, { translateY: ty }, { rotate }],
      }}
    />
  );
}

interface CelebrationBurstProps {
  trigger: number;
  colorSet: string[];
  count?: number;
  originX: number;
  originY: number;
}

export function CelebrationBurst({
  trigger,
  colorSet,
  count = 14,
  originX,
  originY,
}: CelebrationBurstProps) {
  const [active, setActive] = useState(false);
  const doneCount = useRef(0);

  useEffect(() => {
    if (trigger > 0) {
      doneCount.current = 0;
      setActive(true);
    }
  }, [trigger]);

  if (!active) return null;

  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <BurstParticle
          key={`${trigger}-${i}`}
          seed={i + trigger * 100}
          colorSet={colorSet}
          trigger={trigger}
          originX={originX}
          originY={originY}
          onDone={() => {
            doneCount.current += 1;
            if (doneCount.current >= count) setActive(false);
          }}
        />
      ))}
    </>
  );
}
