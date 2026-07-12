// components/ConfettiPiece.tsx
import React, { useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";

const CONFETTI = [
  "#43a047",
  "#ffd54f",
  "#f48fb1",
  "#4fc3f7",
  "#ce93d8",
  "#ff8a65",
];

type ConfettiPieceProps = {
  seed: number;
  trigger: number;
};

export const ConfettiPiece: React.FC<ConfettiPieceProps> = ({
  seed,
  trigger,
}) => {
  const fall = useSharedValue(0);

  const startX = (((seed * 16807 + 12) % 2147483647) / 2147483647) * 180 + 10;
  const size = 5 + (((seed * 16807 + 51) % 2147483647) / 2147483647) * 5;
  const color = CONFETTI[seed % CONFETTI.length];
  const duration =
    1600 + (((seed * 16807 + 66) % 2147483647) / 2147483647) * 900;
  const delay = (((seed * 16807 + 34) % 2147483647) / 2147483647) * 300;

  useEffect(() => {
    fall.value = withSequence(
      withTiming(0, { duration: delay }),
      withTiming(1, { duration, easing: Easing.in(Easing.quad) }),
    );
  }, [trigger]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: fall.value * 280 - 20 },
      {
        translateX:
          ((fall.value * ((seed * 16807 + 9) % 2147483647)) / 2147483647) * 40 -
          20,
      },
      {
        rotate: `${fall.value * ((seed * 16807 + 4) % 2147483647 > 1073741823 ? 540 : -540)}deg`,
      },
    ],
    opacity: fall.value > 0.85 ? (1 - fall.value) * 6.66 : 1,
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: startX,
          top: 0,
          width: size,
          height: size * 0.4,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
};
