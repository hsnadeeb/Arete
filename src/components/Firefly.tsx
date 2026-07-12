// components/Firefly.tsx
import React, { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';

type FireflyProps = {
  seed: number;
  active: boolean;
  originX: number;
  originY: number;
  spread: number;
};

export const Firefly: React.FC<FireflyProps> = ({ seed, active, originX, originY, spread }) => {
  const rise = useSharedValue(0);
  const drift = useSharedValue(0);
  const twinkle = useSharedValue(0);

  const startX = originX + (((seed * 16807 + 11) % 2147483647) / 2147483647 * 2 - 1) * (spread * 0.9);
  const baseBottom = originY + (((seed * 16807 + 60) % 2147483647) / 2147483647 * 2 - 1) * (spread * 0.6);
  const size = 2.5 + (((seed * 16807 + 77) % 2147483647) / 2147483647 * 2.5);
  const duration = 4200 + (((seed * 16807 + 33) % 2147483647) / 2147483647 * 3200);
  const delay = ((seed * 16807 + 55) % 2147483647) / 2147483647 * 3000;

  useEffect(() => {
    if (!active) return;

    rise.value = 0;
    drift.value = 0;

    const riseAnim = withSequence(
      withTiming(0, { duration: delay }),
      withTiming(1, { duration, easing: Easing.linear })
    );

    const driftAnim = withRepeat(
      withSequence(
        withTiming(1, { duration: duration / 3, easing: Easing.inOut(Easing.sin) }),
        withTiming(-1, { duration: duration / 3, easing: Easing.inOut(Easing.sin) })
      ),
      -1
    );

    const twinkleAnim = withRepeat(
      withSequence(
        withTiming(1, { duration: 700 }),
        withTiming(0.2, { duration: 700 })
      ),
      -1
    );

    rise.value = riseAnim;
    drift.value = driftAnim;
    twinkle.value = twinkleAnim;

    return () => {
      cancelAnimation(rise);
      cancelAnimation(drift);
      cancelAnimation(twinkle);
    };
  }, [active, duration, delay]);

  const animatedStyle = useAnimatedStyle(() => {
    const travel = 26 + spread * 0.5;
    return {
      transform: [
        { translateY: rise.value * (travel * -2) + travel },
        { translateX: drift.value * spread * 0.35 },
      ],
      opacity: (1 - rise.value * 0.15) * twinkle.value,
    };
  });

  if (!active) return null;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: startX,
          bottom: baseBottom,
          width: size,
          height: size,
          borderRadius: size,
          backgroundColor: ['#ffd54f', '#fff176', '#ffecb3', '#a5d6a7'][seed % 4],
          shadowColor: '#ffd54f',
          shadowOpacity: 0.9,
          shadowRadius: 4,
        },
        animatedStyle,
      ]}
    />
  );
};
