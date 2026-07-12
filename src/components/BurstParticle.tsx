// components/BurstParticle.tsx
import React, { useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";

const FLW = ["#f48fb1", "#ce93d8", "#ffcc02"];

type BurstParticleProps = {
  seed: number;
  colorSet: string[];
  onDone: () => void;
  trigger: number;
};

export const BurstParticle: React.FC<BurstParticleProps> = ({
  seed,
  colorSet,
  onDone,
  trigger,
}) => {
  const anim = useSharedValue(0);
  const spin = useSharedValue(0);

  const angle = (((seed * 16807 + 21) % 2147483647) / 2147483647) * Math.PI * 2;
  const dist = 55 + (((seed * 16807 + 63) % 2147483647) / 2147483647) * 70;
  const size = 4 + (((seed * 16807 + 44) % 2147483647) / 2147483647) * 5;
  const color =
    colorSet[
      Math.floor(
        (((seed * 16807 + 88) % 2147483647) / 2147483647) * colorSet.length,
      )
    ];

  useEffect(() => {
    anim.value = 0;
    spin.value = 0;

    const animDuration =
      950 + (((seed * 16807 + 15) % 2147483647) / 2147483647) * 400;

    anim.value = withTiming(1, {
      duration: animDuration,
      easing: Easing.out(Easing.cubic),
    });

    spin.value = withTiming(1, {
      duration: 950,
      easing: Easing.linear,
    });

    const timeout = setTimeout(onDone, animDuration + 100);
    return () => clearTimeout(timeout);
  }, [trigger, onDone]);

  const isFlower = colorSet.every((color, index) => color === FLW[index]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: anim.value * Math.cos(angle) * dist },
      { translateY: anim.value * Math.sin(angle) * dist - 30 },
      {
        rotate: `${spin.value * (360 * ((seed * 16807 + 90) % 2147483647 > 1073741823 ? 1 : -1))}deg`,
      },
    ],
    opacity:
      anim.value < 0.15
        ? anim.value * 6.66
        : anim.value > 0.75
          ? (1 - anim.value) * 4
          : 1,
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: 100 - size / 2,
          top: 130,
          width: size,
          height: size * (isFlower ? 1.6 : 1),
          borderRadius: size,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
};
