import React, { useRef, useEffect, useMemo } from "react";
import { Animated, Easing } from "react-native";
import { hash } from "./constants";

interface WindStreakProps {
  t: number;
  running: boolean;
  width: number;
  height: number;
}

interface Streak {
  x: Animated.Value;
  y: number;
  length: number;
  opacity: number;
  speed: number;
  delay: number;
}

function useStreaks(count: number, width: number, height: number): Streak[] {
  return useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      x: new Animated.Value(-width * 0.3),
      y: 0.15 + hash(i, 0.2) * 0.4,
      length: 30 + hash(i, 0.3) * 80,
      opacity: 0.08 + hash(i, 0.4) * 0.15,
      speed: 6000 + hash(i, 0.6) * 10000,
      delay: hash(i, 0.8) * 15000,
    }));
  }, [count, width, height]);
}

export function WindStreak({ t, running, width, height }: WindStreakProps) {
  const count = useMemo(() => {
    if (t < 0.2) return 0;
    if (t < 0.4) return 2;
    if (t < 0.6) return 4;
    return 6;
  }, [t]);

  const streaks = useStreaks(count, width, height);

  useEffect(() => {
    if (!running || count === 0) return;
    const anims = streaks.map((s) => {
      s.x.setValue(-width * 0.3);
      const loop = Animated.loop(
        Animated.sequence([
          Animated.delay(s.delay),
          Animated.timing(s.x, {
            toValue: width * 1.3,
            duration: s.speed * (1 + (1 - t) * 0.5),
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return loop;
    });
    return () => anims.forEach((a) => a.stop());
  }, [running, count, streaks, width, t]);

  if (count === 0) return null;

  return (
    <>
      {streaks.map((s, i) => (
        <Animated.View
          key={i}
          style={{
            position: "absolute",
            top: `${s.y * 100}%`,
            left: 0,
            width: s.length,
            height: 1,
            backgroundColor: "#cbd5e1",
            borderRadius: 1,
            opacity: s.opacity,
            transform: [{ translateX: s.x }],
          }}
        />
      ))}
    </>
  );
}
