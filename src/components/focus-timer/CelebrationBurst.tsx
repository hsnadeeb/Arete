import React, { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";
import { FLW, hash } from "./constants";

function BurstParticle({
  seed,
  colorSet,
  onDone,
  trigger,
  originX,
  originY,
  isSecondary,
}: {
  seed: number;
  colorSet: string[];
  onDone: () => void;
  trigger: number;
  originX: number;
  originY: number;
  isSecondary?: boolean;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const angle = hash(seed, 0.21) * Math.PI * 2;
  const dist = (isSecondary ? 25 : 50) + hash(seed, 0.63) * (isSecondary ? 40 : 80);
  const size = (isSecondary ? 2 : 3) + hash(seed, 0.44) * (isSecondary ? 3 : 6);
  const color = colorSet[Math.floor(hash(seed, 0.88) * colorSet.length)];
  const isFlower = colorSet === FLW;
  const delay = hash(seed, 0.5) * (isSecondary ? 200 : 100);

  useEffect(() => {
    anim.setValue(0);
    spin.setValue(0);
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(anim, {
          toValue: 1,
          duration: (isSecondary ? 700 : 900) + hash(seed, 0.15) * 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(spin, {
          toValue: 1,
          duration: isSecondary ? 600 : 900,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]),
    ]).start(({ finished }) => finished && onDone());
  }, [trigger, seed, colorSet, onDone]);

  const tx = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.cos(angle) * dist],
  });
  const ty = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.sin(angle) * dist - (isSecondary ? 15 : 30)],
  });
  const opacity = anim.interpolate({
    inputRange: [0, 0.1, 0.7, 1],
    outputRange: [0, 1, 1, 0],
  });
  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", `${720 * (hash(seed, 0.9) > 0.5 ? 1 : -1)}deg`],
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
  count = 18,
  originX,
  originY,
}: CelebrationBurstProps) {
  const doneCount = useRef(0);
  const [active, setActive] = React.useState(false);

  useEffect(() => {
    if (trigger > 0) {
      doneCount.current = 0;
      setActive(true);
    }
  }, [trigger]);

  if (!active) return null;

  const totalExpected = count + Math.floor(count * 0.6);
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <BurstParticle
          key={`burst-${trigger}-${i}`}
          seed={i + trigger * 100}
          colorSet={colorSet}
          trigger={trigger}
          originX={originX}
          originY={originY}
          onDone={() => {
            doneCount.current += 1;
            if (doneCount.current >= totalExpected) setActive(false);
          }}
        />
      ))}
      {Array.from({ length: Math.floor(count * 0.6) }, (_, i) => (
        <BurstParticle
          key={`sec-${trigger}-${i}`}
          seed={i + trigger * 100 + 999}
          colorSet={colorSet}
          trigger={trigger}
          originX={originX}
          originY={originY}
          isSecondary
          onDone={() => {
            doneCount.current += 1;
            if (doneCount.current >= totalExpected) setActive(false);
          }}
        />
      ))}
    </>
  );
}
