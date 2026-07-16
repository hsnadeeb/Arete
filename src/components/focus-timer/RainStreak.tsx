import React, { useRef, useEffect, useMemo } from "react";
import { Animated, Easing } from "react-native";
import { hash } from "./constants";

interface RainStreakProps {
  intensity: number; // 0-1
  running: boolean;
  width: number;
  height: number;
}

interface Drop {
  x: Animated.Value;
  y: Animated.Value;
  opacity: number;
  length: number;
  speed: number;
  delay: number;
  windOffset: number;
}

function useDrops(count: number, width: number, height: number, intensity: number): Drop[] {
  return useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      x: new Animated.Value(hash(i, 0.1) * width),
      y: new Animated.Value(-height * 0.1 - hash(i, 0.2) * height * 0.3),
      opacity: 0.2 + hash(i, 0.3) * 0.4 * intensity,
      length: 12 + hash(i, 0.4) * 18,
      speed: 400 + hash(i, 0.6) * 600,
      delay: hash(i, 0.8) * 2000,
      windOffset: -5 + hash(i, 0.9) * 10,
    }));
  }, [count, width, height, intensity]);
}

export function RainStreak({ intensity, running, width, height }: RainStreakProps) {
  const count = useMemo(() => Math.floor(30 + intensity * 80), [intensity]);
  const drops = useDrops(count, width, height, intensity);

  useEffect(() => {
    if (!running || intensity <= 0) return;
    const anims = drops.map((d) => {
      d.y.setValue(-height * 0.1 - hash(d.delay, 0.2) * height * 0.3);
      const loop = Animated.loop(
        Animated.sequence([
          Animated.delay(d.delay),
          Animated.timing(d.y, {
            toValue: height * 1.2,
            duration: d.speed * (0.8 + intensity * 0.4),
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return loop;
    });
    return () => anims.forEach((a) => a.stop());
  }, [running, intensity, drops, height]);

  if (intensity <= 0 || count === 0) return null;

  return (
    <>
      {drops.map((d, i) => (
        <Animated.View
          key={i}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 1.5,
            height: d.length,
            backgroundColor: `rgba(180, 200, 230, ${d.opacity * intensity})`,
            borderRadius: 1,
            opacity: intensity,
            transform: [
              { translateX: d.x },
              { translateY: d.y },
              { rotate: `${8 + d.windOffset * 0.3}deg` },
            ],
          }}
        />
      ))}
    </>
  );
}
