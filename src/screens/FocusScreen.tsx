import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Easing,
  Vibration,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "../components/Icons";
import { LUCIDE_ICONS, TYPOGRAPHY } from "../constants/typography";
import { useStore } from "../store";
import { useTheme } from "../context/ThemeContext";
import * as db from "../db/service";

const DURATIONS = [
  { label: "40m", value: 40 * 60 },
  { label: "25m", value: 25 * 60 },
  { label: "15m", value: 15 * 60 },
  { label: "5m", value: 5 * 60 },
];

const GREEN = ["#e8f5e9", "#a5d6a7", "#66bb6a", "#43a047", "#2e7d32"];
const BRN = "#5d4037";
const BRN_L = "#8d6e63";
const FLW = ["#f48fb1", "#ce93d8", "#ffcc02"];
const SPARK = ["#ffd54f", "#fff176", "#ffecb3", "#a5d6a7"];
const CONFETTI = [
  "#43a047",
  "#ffd54f",
  "#f48fb1",
  "#4fc3f7",
  "#ce93d8",
  "#ff8a65",
];

// Ambient sky palette keyed by progress: dawn -> noon -> golden dusk
const SKY_STOPS = [
  { at: 0, glow: "#bcd9c9", halo: "#e8f5e9" },
  { at: 50, glow: "#9fd8b0", halo: "#d7f0dc" },
  { at: 85, glow: "#ffd98a", halo: "#fff1cf" },
  { at: 100, glow: "#ffb997", halo: "#ffe0c2" },
];

const LEVELS = [
  { minTrees: 0, title: "Seedling", iconKey: "Sprout" as const },
  { minTrees: 5, title: "Sprout", iconKey: "TreePine" as const },
  { minTrees: 15, title: "Sapling", iconKey: "TreePine" as const },
  { minTrees: 30, title: "Forest Keeper", iconKey: "TreeDeciduous" as const },
  { minTrees: 50, title: "Forest Guardian", iconKey: "Mountain" as const },
  { minTrees: 100, title: "Ancient Forest", iconKey: "TreePine" as const },
];

function hash(i: number, t: number): number {
  return ((i * 16807 + t * 100) % 2147483647) / 2147483647;
}

function lerpColor(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ar = (pa >> 16) & 255,
    ag = (pa >> 8) & 255,
    ab = pa & 255;
  const br = (pb >> 16) & 255,
    bg = (pb >> 8) & 255,
    bb = pb & 255;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `#${((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1)}`;
}

function skyColorAt(progress: number, key: "glow" | "halo"): string {
  const p = Math.max(0, Math.min(100, progress));
  for (let i = 0; i < SKY_STOPS.length - 1; i++) {
    const a = SKY_STOPS[i],
      b = SKY_STOPS[i + 1];
    if (p >= a.at && p <= b.at) {
      const t = b.at === a.at ? 0 : (p - a.at) / (b.at - a.at);
      return lerpColor(a[key], b[key], t);
    }
  }
  return SKY_STOPS[SKY_STOPS.length - 1][key];
}

function getLevel(trees: number) {
  let lvl = LEVELS[0];
  for (const l of LEVELS) {
    if (trees >= l.minTrees) lvl = l;
  }
  return lvl;
}

function nextLevelTrees(trees: number): number {
  for (const l of LEVELS) {
    if (trees < l.minTrees) return l.minTrees - trees;
  }
  return 0;
}

// ─── Ambient firefly particle ───

function Firefly({
  seed,
  active,
  originX,
  originY,
  spread,
}: {
  seed: number;
  active: boolean;
  originX: number;
  originY: number;
  spread: number;
}) {
  const rise = useRef(new Animated.Value(0)).current;
  const drift = useRef(new Animated.Value(0)).current;
  const twinkle = useRef(new Animated.Value(0)).current;
  const startX = originX + (hash(seed, 0.11) * 2 - 1) * (spread * 0.9);
  const baseBottom = originY + (hash(seed, 0.6) * 2 - 1) * (spread * 0.6);
  const size = 2.5 + hash(seed, 0.77) * 2.5;
  const duration = 4200 + hash(seed, 0.33) * 3200;
  const delay = hash(seed, 0.55) * 3000;

  useEffect(() => {
    if (!active) return;
    rise.setValue(0);
    drift.setValue(0);
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(rise, {
            toValue: 1,
            duration,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(delay),
          Animated.loop(
            Animated.sequence([
              Animated.timing(drift, {
                toValue: 1,
                duration: duration / 3,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
              }),
              Animated.timing(drift, {
                toValue: -1,
                duration: duration / 3,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
              }),
            ]),
            { iterations: 3 },
          ),
        ]),
        Animated.loop(
          Animated.sequence([
            Animated.timing(twinkle, {
              toValue: 1,
              duration: 700,
              useNativeDriver: true,
            }),
            Animated.timing(twinkle, {
              toValue: 0.2,
              duration: 700,
              useNativeDriver: true,
            }),
          ]),
        ),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active]);

  if (!active) return null;

  const travel = 26 + spread * 0.5;
  const translateY = rise.interpolate({
    inputRange: [0, 1],
    outputRange: [travel, -travel],
  });
  const translateX = drift.interpolate({
    inputRange: [-1, 1],
    outputRange: [-spread * 0.35, spread * 0.35],
  });
  const opacity = rise.interpolate({
    inputRange: [0, 0.15, 0.85, 1],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: startX,
        bottom: baseBottom,
        width: size,
        height: size,
        borderRadius: size,
        backgroundColor: SPARK[seed % SPARK.length],
        opacity: Animated.multiply(opacity, twinkle),
        transform: [{ translateY }, { translateX }],
        shadowColor: SPARK[seed % SPARK.length],
        shadowOpacity: 0.9,
        shadowRadius: 4,
      }}
    />
  );
}

// ─── Burst particle (petals / sparkles fired outward on milestones) ───

function BurstParticle({
  seed,
  colorSet,
  onDone,
  trigger,
}: {
  seed: number;
  colorSet: string[];
  onDone: () => void;
  trigger: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const angle = hash(seed, 0.21) * Math.PI * 2;
  const dist = 55 + hash(seed, 0.63) * 70;
  const size = 4 + hash(seed, 0.44) * 5;
  const color = colorSet[Math.floor(hash(seed, 0.88) * colorSet.length)];
  const spin = useRef(new Animated.Value(0)).current;

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
  }, [trigger]);

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
        left: 100 - size / 2,
        top: 130,
        width: size,
        height: size * (colorSet === FLW ? 1.6 : 1),
        borderRadius: size,
        backgroundColor: color,
        opacity,
        transform: [{ translateX: tx }, { translateY: ty }, { rotate }],
      }}
    />
  );
}

function CelebrationBurst({
  trigger,
  colorSet,
  count = 14,
}: {
  trigger: number;
  colorSet: string[];
  count?: number;
}) {
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
          onDone={() => {
            doneCount.current += 1;
            if (doneCount.current >= count) setActive(false);
          }}
        />
      ))}
    </>
  );
}

// ─── Confetti for full session completion ───

function ConfettiPiece({ seed, trigger }: { seed: number; trigger: number }) {
  const fall = useRef(new Animated.Value(0)).current;
  const startX = hash(seed, 0.12) * 180 + 10;
  const size = 5 + hash(seed, 0.51) * 5;
  const color = CONFETTI[seed % CONFETTI.length];
  const duration = 1600 + hash(seed, 0.66) * 900;
  const delay = hash(seed, 0.34) * 300;

  useEffect(() => {
    fall.setValue(0);
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(fall, {
        toValue: 1,
        duration,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [trigger]);

  const translateY = fall.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 260],
  });
  const translateX = fall.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, hash(seed, 0.9) * 30 - 15, hash(seed, 0.2) * 40 - 20],
  });
  const rotate = fall.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", `${(hash(seed, 0.4) > 0.5 ? 1 : -1) * 540}deg`],
  });
  const opacity = fall.interpolate({
    inputRange: [0, 0.85, 1],
    outputRange: [1, 1, 0],
  });

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: startX,
        top: 0,
        width: size,
        height: size * 0.4,
        backgroundColor: color,
        opacity,
        transform: [{ translateY }, { translateX }, { rotate }],
      }}
    />
  );
}

function ConfettiField({ trigger }: { trigger: number }) {
  if (trigger === 0) return null;
  return (
    <View pointerEvents="none" style={s.confettiField}>
      {Array.from({ length: 36 }, (_, i) => (
        <ConfettiPiece key={`${trigger}-${i}`} seed={i} trigger={trigger} />
      ))}
    </View>
  );
}

// ─── Growing tree component ───

// Fixed, hand-composed canopy cluster — a deliberate silhouette rather than
// scattered random circles. Each blob has a growth threshold so the tree
// sprouts lobe by lobe as t increases, and a depth "layer" so back blobs sit
// darker/behind and front blobs sit lighter/on top, giving it real volume.
const CANOPY_BLOBS = [
  { dx: -0.58, dy: -0.28, r: 0.74, layer: 0, growAt: 0.16 },
  { dx: 0.58, dy: -0.28, r: 0.74, layer: 0, growAt: 0.2 },
  { dx: 0, dy: -0.62, r: 0.7, layer: 0, growAt: 0.3 },
  { dx: 0, dy: 0.05, r: 1.0, layer: 1, growAt: 0.02 },
  { dx: -0.82, dy: 0.14, r: 0.58, layer: 1, growAt: 0.42 },
  { dx: 0.82, dy: 0.14, r: 0.58, layer: 1, growAt: 0.46 },
  { dx: -0.32, dy: -0.5, r: 0.46, layer: 2, growAt: 0.6 },
  { dx: 0.22, dy: -0.78, r: 0.36, layer: 2, growAt: 0.72 },
];

const BLOSSOM_SPOTS = [
  { dx: -0.7, dy: -0.1, growAt: 0.62 },
  { dx: 0.6, dy: -0.35, growAt: 0.72 },
  { dx: 0.1, dy: -0.85, growAt: 0.82 },
  { dx: -0.35, dy: -0.7, growAt: 0.9 },
  { dx: 0.75, dy: 0.05, growAt: 0.95 },
];

function smoothstep(x: number): number {
  const c = Math.max(0, Math.min(1, x));
  return c * c * (3 - 2 * c);
}

function GrowingTree({
  pct,
  isDark,
  running,
}: {
  pct: number;
  isDark: boolean;
  running: boolean;
}) {
  const t = Math.min(pct / 100, 1);
  const trunkH = 16 + t * 66;
  const trunkW = 10 + t * 9;
  const trunkBot = 24;
  const cx = 100; // center x of treeWrap (200w)
  const canopyR = 15 + t * 27; // overall canopy scale, drives every blob below

  // Maturity color index: young trees read as bright spring-green, mature
  // trees deepen toward forest green.
  const maturity = Math.min(4, Math.floor(t * 5));

  const canopy = useMemo(() => {
    const centerBY = trunkBot + trunkH * 0.94; // canopy sits just over the trunk tip
    return CANOPY_BLOBS.map((b, i) => {
      const local = smoothstep((t - b.growAt) / Math.max(0.001, 1 - b.growAt));
      const colorIdx =
        b.layer === 0
          ? Math.min(4, maturity + 1)
          : b.layer === 1
            ? maturity
            : Math.max(0, maturity - 1);
      return {
        key: i,
        lx: cx + b.dx * canopyR,
        by: centerBY + b.dy * canopyR,
        r: b.r * canopyR * 0.62 * (0.4 + 0.6 * local),
        color: GREEN[colorIdx],
        opacity: 0.55 + local * 0.35,
      };
    }).filter((c) => c.r > 1);
  }, [t, canopyR, maturity]);

  const decorations = useMemo(() => {
    const centerBY = trunkBot + trunkH * 0.94;
    return BLOSSOM_SPOTS.map((d, i) => {
      const local = smoothstep((t - d.growAt) / Math.max(0.001, 1 - d.growAt));
      return {
        key: i,
        lx: cx + d.dx * canopyR,
        by: centerBY + d.dy * canopyR,
        size: (3.5 + hash(i, 0.2) * 2.5) * local,
        color: FLW[i % FLW.length],
        opacity: local,
      };
    }).filter((d) => d.size > 0.6);
  }, [t, canopyR]);

  // Entrance pop
  const animScale = useRef(new Animated.Value(0.01)).current;
  useEffect(() => {
    Animated.spring(animScale, {
      toValue: 1,
      friction: 6,
      tension: 60,
      useNativeDriver: true,
    }).start();
  }, [t]);

  // Gentle breathing/growth spring on canopy scale so each tick feels alive, not just linear
  const breath = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.spring(breath, {
        toValue: 1.045,
        friction: 4,
        tension: 140,
        useNativeDriver: true,
      }),
      Animated.spring(breath, {
        toValue: 1,
        friction: 5,
        tension: 90,
        useNativeDriver: true,
      }),
    ]).start();
  }, [Math.floor(t * 40)]);

  // Wind sway on the canopy only
  const sway = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, {
          toValue: 1,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(sway, {
          toValue: -1,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);
  const swayRotate = sway.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-2deg", "2deg"],
  });

  // Warm glow pulse while a session is running
  const glow = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    if (running) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(glow, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glow, {
            toValue: 0.35,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
    Animated.timing(glow, {
      toValue: 0.35,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [running]);

  const glowColor = skyColorAt(pct, "glow");
  const centerBY = trunkBot + trunkH * 0.94;
  const canopyOpacity = glow.interpolate({
    inputRange: [0.35, 1],
    outputRange: [0.92, 1],
  });

  return (
    <View style={s.treeArea}>
      {/* Fireflies drifting up around the canopy while focused */}
      <View pointerEvents="none" style={s.fireflyLayer}>
        {Array.from({ length: running ? 6 : 0 }, (_, i) => (
          <Firefly
            key={i}
            seed={i}
            active={running}
            originX={cx}
            originY={centerBY}
            spread={canopyR}
          />
        ))}
      </View>

      <Animated.View
        style={[s.treeWrap, { transform: [{ scale: animScale }] }]}
      >
        {/* Soft ground shadow for grounding */}
        <View
          style={[
            s.groundShadow,
            {
              left: cx - (24 + trunkW),
              width: (24 + trunkW) * 2,
              opacity: isDark ? 0.28 : 0.16,
            },
          ]}
        />

        <View
          style={[
            s.pot,
            {
              backgroundColor: isDark ? BRN_L : BRN,
              borderColor: isDark ? BRN_L : BRN,
            },
          ]}
        >
          <Text style={s.potText}>{Math.floor(pct)}%</Text>
        </View>

        {/* Tapered trunk: wider root flare, narrower tip, subtle bark line */}
        <View
          style={[
            s.trunk,
            {
              width: trunkW,
              height: trunkH,
              backgroundColor: isDark ? BRN_L : BRN,
              bottom: trunkBot,
              left: cx - trunkW / 2,
              borderTopLeftRadius: trunkW * 0.35,
              borderTopRightRadius: trunkW * 0.35,
            },
          ]}
        >
          <View
            style={[
              s.trunkShade,
              { backgroundColor: isDark ? "#00000030" : "#00000022" },
            ]}
          />
        </View>
        <View
          style={[
            s.rootFlare,
            {
              width: trunkW * 2.1,
              left: cx - trunkW * 1.05,
              bottom: trunkBot - 3,
              backgroundColor: isDark ? BRN_L : BRN,
            },
          ]}
        />

        <Animated.View
          style={{
            transform: [{ scale: breath }, { rotate: swayRotate }],
            opacity: canopyOpacity,
            shadowColor: glowColor,
            shadowOpacity: running ? 0.55 : 0.2,
            shadowRadius: running ? 14 : 8,
            shadowOffset: { width: 0, height: 0 },
          }}
        >
          {canopy.map((c) => (
            <View
              key={c.key}
              style={[
                s.leaf,
                {
                  left: c.lx - c.r,
                  bottom: c.by - c.r,
                  width: c.r * 2,
                  height: c.r * 2,
                  borderRadius: c.r,
                  backgroundColor: c.color,
                  opacity: c.opacity,
                },
              ]}
            />
          ))}
          {decorations.map((d) => (
            <View
              key={d.key}
              style={[
                s.flower,
                {
                  left: d.lx - d.size / 2,
                  bottom: d.by - d.size / 2,
                  width: d.size,
                  height: d.size,
                  borderRadius: d.size / 2,
                  backgroundColor: d.color,
                  opacity: d.opacity,
                },
              ]}
            />
          ))}
        </Animated.View>
      </Animated.View>
    </View>
  );
}

// ─── Level-up banner ───

function LevelUpBanner({
  visible,
  title,
  iconKey,
}: {
  visible: boolean;
  title: string;
  iconKey: string;
}) {
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
    }
  }, [visible]);

  if (!visible) return null;
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[s.levelUpWrap, { opacity: anim, transform: [{ scale }] }]}
    >
      <View style={s.levelUpCard}>
        <Icon name={iconKey as any} size={22} color="#ffd54f" />
        <Text style={s.levelUpTitle}>Level Up!</Text>
        <Text style={s.levelUpSub}>{title}</Text>
      </View>
    </Animated.View>
  );
}

// ─── Main screen ───

export default function FocusScreen() {
  const { theme, isDark } = useTheme();
  const tc = theme.colors;
  const setCurrentRoute = useStore((s) => s.setCurrentRoute);

  const [duration, setDuration] = useState(25 * 60);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [stats, setStats] = useState({
    totalTrees: 0,
    totalSessions: 0,
    streak: 0,
    todaySessions: 0,
  });
  const [milestone, setMilestone] = useState<number | null>(null);
  const [screensaver, setScreensaver] = useState(false);
  const [burstTrigger, setBurstTrigger] = useState(0);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [levelUpVisible, setLevelUpVisible] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animMilestone = useRef(new Animated.Value(0)).current;
  const lastActivityRef = useRef(Date.now());
  const lastTapRef = useRef(0);
  const prevLevelTitleRef = useRef<string | null>(null);
  const streakPulse = useRef(new Animated.Value(1)).current;
  const doneGlow = useRef(new Animated.Value(0)).current;

  const progress = duration > 0 ? (elapsed / duration) * 100 : 0;
  const remaining = duration - elapsed;
  const min = Math.floor(remaining / 60);
  const sec = remaining % 60;
  const treesThisSession = Math.floor(elapsed / 300);
  const level = useMemo(() => getLevel(stats.totalTrees), [stats.totalTrees]);
  const toNext = useMemo(
    () => nextLevelTrees(stats.totalTrees),
    [stats.totalTrees],
  );

  useEffect(() => {
    db.getFocusStats().then(setStats);
  }, []);

  // Reload stats after session completes
  useEffect(() => {
    if (done) {
      db.getFocusStats().then(setStats);
    }
  }, [done]);

  // Detect level-up whenever totalTrees crosses a threshold
  useEffect(() => {
    if (prevLevelTitleRef.current === null) {
      prevLevelTitleRef.current = level.title;
      return;
    }
    if (level.title !== prevLevelTitleRef.current) {
      prevLevelTitleRef.current = level.title;
      setLevelUpVisible(true);
      setBurstTrigger((v) => v + 1);
      Vibration.vibrate([0, 60, 60, 120]);
      const timer = setTimeout(() => setLevelUpVisible(false), 1800);
      return () => clearTimeout(timer);
    }
  }, [level.title]);

  // Streak pulse — a small satisfying heartbeat on the streak number
  useEffect(() => {
    if (stats.streak > 0) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(streakPulse, {
            toValue: 1.18,
            duration: 650,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(streakPulse, {
            toValue: 1,
            duration: 650,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
  }, [stats.streak > 0]);

  // Tick
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => {
          const next = prev + 1;
          if (next >= duration) {
            setRunning(false);
            setDone(true);
            Vibration.vibrate([0, 200, 100, 200]);
            db.saveFocusSession(duration, duration);
            setMilestone(100);
            setConfettiTrigger((v) => v + 1);
            setBurstTrigger((v) => v + 1);
            Animated.sequence([
              Animated.timing(doneGlow, {
                toValue: 1,
                duration: 500,
                useNativeDriver: false,
              }),
              Animated.timing(doneGlow, {
                toValue: 0,
                duration: 1200,
                useNativeDriver: false,
              }),
            ]).start();
            return duration;
          }
          // Milestone checks (every 25%)
          const prevMilestone = Math.floor(prev / (duration / 4));
          const currMilestone = Math.floor(next / (duration / 4));
          if (currMilestone > prevMilestone && currMilestone < 4) {
            setMilestone(currMilestone * 25);
            Vibration.vibrate(100);
          }
          // Tree milestone (every 5 min = 300s) — small celebration burst
          if (
            Math.floor(prev / 300) < Math.floor(next / 300) &&
            next % 300 === 0
          ) {
            Vibration.vibrate(80);
            setBurstTrigger((v) => v + 1);
          }
          return next;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, duration]);

  // Milestone animation
  useEffect(() => {
    if (milestone !== null) {
      animMilestone.setValue(0);
      Animated.sequence([
        Animated.spring(animMilestone, {
          toValue: 1,
          friction: 5,
          tension: 90,
          useNativeDriver: true,
        }),
        Animated.delay(1200),
        Animated.timing(animMilestone, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => setMilestone(null));
    }
  }, [milestone]);

  const handleStart = useCallback(() => {
    if (done) {
      setElapsed(0);
      setDone(false);
    }
    setRunning(true);
    lastActivityRef.current = Date.now();
  }, [done]);

  const handlePause = useCallback(() => {
    setRunning(false);
    lastActivityRef.current = Date.now();
  }, []);
  const handleReset = useCallback(() => {
    setRunning(false);
    setElapsed(0);
    setDone(false);
    lastActivityRef.current = Date.now();
  }, []);
  const handleDuration = useCallback((d: number) => {
    setDuration(d);
    setElapsed(0);
    setRunning(false);
    setDone(false);
    lastActivityRef.current = Date.now();
  }, []);

  // Screensaver: activate after 10s of inactivity, exit on double-tap
  useEffect(() => {
    const id = setInterval(() => {
      if (!screensaver && Date.now() - lastActivityRef.current > 10000) {
        setScreensaver(true);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [screensaver]);

  const handleScreenTap = useCallback(() => {
    const now = Date.now();
    if (screensaver) {
      if (now - lastTapRef.current < 350) {
        setScreensaver(false);
        lastActivityRef.current = now;
      }
      lastTapRef.current = now;
    } else {
      lastActivityRef.current = now;
    }
  }, [screensaver]);

  const mainBtnGlow = doneGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.9],
  });

  if (screensaver) {
    return (
      <TouchableWithoutFeedback onPress={handleScreenTap}>
        <SafeAreaView
          style={[s.screenSaver, { backgroundColor: "#000000" }]}
          edges={["top", "bottom"]}
        >
          <View style={s.saverBody}>
            <Text
              style={[s.saverTimer, { color: done ? tc.success : "#ffffff" }]}
            >
              {String(min).padStart(2, "0")}:{String(sec).padStart(2, "0")}
            </Text>
            <View style={s.saverTree}>
              <GrowingTree pct={progress} isDark={true} running={running} />
            </View>
            <Text style={s.saverHint}>Double-tap to exit</Text>
          </View>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    );
  }

  return (
    <SafeAreaView
      style={[s.screen, { backgroundColor: tc.bg }]}
      edges={["top", "bottom"]}
      onTouchStart={() => {
        lastActivityRef.current = Date.now();
      }}
    >
      {/* Header */}
      <View style={[s.header, { borderBottomColor: tc.divider }]}>
        <TouchableOpacity
          onPress={() => setCurrentRoute("Greeting")}
          style={s.backBtn}
        >
          <Icon
            name={LUCIDE_ICONS.arrowLeft}
            size={20}
            color={tc.textSecondary}
          />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          {DURATIONS.map((d) => (
            <TouchableOpacity
              key={d.value}
              onPress={() => handleDuration(d.value)}
              style={[
                s.durChip,
                {
                  backgroundColor:
                    duration === d.value ? tc.accentBg : tc.bgSecondary,
                  borderColor:
                    duration === d.value ? tc.accent : tc.borderLight,
                },
              ]}
            >
              <Text
                style={[
                  s.durChipText,
                  {
                    color: duration === d.value ? tc.accent : tc.textTertiary,
                    fontWeight: duration === d.value ? "700" : "500",
                  },
                ]}
              >
                {d.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Milestone toast */}
      {milestone !== null && (
        <Animated.View
          style={[
            s.mToast,
            {
              opacity: animMilestone,
              transform: [
                {
                  translateY: animMilestone.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
                {
                  scale: animMilestone.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.85, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={s.mToastText}>
            {milestone === 100
              ? "🌳 Session Complete!"
              : `${milestone}% — Keep going!`}
          </Text>
        </Animated.View>
      )}

      {/* Level up celebration */}
      <LevelUpBanner
        visible={levelUpVisible}
        title={level.title}
        iconKey={level.iconKey}
      />

      {/* Body */}
      <View style={s.body}>
        {/* Level badge */}
        <View
          style={[
            s.levelBadge,
            { backgroundColor: tc.bgSecondary, borderColor: tc.borderLight },
          ]}
        >
          <Icon name={level.iconKey as any} size={18} color={tc.text} />
          <Text
            style={[TYPOGRAPHY.bodySm, { fontWeight: "700", color: tc.text }]}
          >
            {level.title}
          </Text>
          <Text style={[TYPOGRAPHY.captionSm, { color: tc.textTertiary }]}>
            {stats.totalTrees} trees ·{" "}
            {toNext > 0 ? `${toNext} to next` : "Max level"}
          </Text>
        </View>

        {/* Tree — the centerpiece, now alive with light, wind and celebration bursts */}
        <View style={s.treeStage}>
          <GrowingTree pct={progress} isDark={isDark} running={running} />
          <CelebrationBurst
            trigger={burstTrigger}
            colorSet={SPARK}
            count={10}
          />
          <ConfettiField trigger={confettiTrigger} />
        </View>

        {/* Timer */}
        <View style={s.timerSection}>
          <Text
            style={[s.timerText, { color: done ? tc.success : tc.heading }]}
          >
            {String(min).padStart(2, "0")}:{String(sec).padStart(2, "0")}
          </Text>
          <Text style={[s.timerLabel, { color: tc.textTertiary }]}>
            {done ? "Well done!" : running ? "Stay focused" : "Press start"}
          </Text>
        </View>

        {/* Stats row */}
        <View style={[s.forestStats, { borderColor: tc.borderLight }]}>
          <View style={s.statItem}>
            <Animated.Text
              style={[
                s.statVal,
                { color: tc.warning, transform: [{ scale: streakPulse }] },
              ]}
            >
              {stats.streak}
            </Animated.Text>
            <Text style={[s.statLbl, { color: tc.textTertiary }]}>Streak</Text>
          </View>
          <View style={[s.statDiv, { backgroundColor: tc.borderLight }]} />
          <View style={s.statItem}>
            <Text style={[s.statVal, { color: tc.accent }]}>
              {stats.totalTrees + treesThisSession}
            </Text>
            <Text style={[s.statLbl, { color: tc.textTertiary }]}>Trees</Text>
          </View>
          <View style={[s.statDiv, { backgroundColor: tc.borderLight }]} />
          <View style={s.statItem}>
            <Text style={[s.statVal, { color: GREEN[3] }]}>
              {Math.floor(progress)}%
            </Text>
            <Text style={[s.statLbl, { color: tc.textTertiary }]}>Growth</Text>
          </View>
        </View>

        {/* Controls */}
        <View style={s.controls}>
          <TouchableOpacity
            onPress={handleReset}
            style={[s.ctrlBtn, { backgroundColor: tc.bgSecondary }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon
              name={LUCIDE_ICONS.refreshCw}
              size={18}
              color={tc.textTertiary}
            />
          </TouchableOpacity>
          {running ? (
            <TouchableOpacity
              onPress={handlePause}
              style={[s.mainBtn, { backgroundColor: tc.warningBg }]}
            >
              <Icon name={LUCIDE_ICONS.pause} size={22} color={tc.warning} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleStart} activeOpacity={0.85}>
              <Animated.View
                style={[
                  s.mainBtn,
                  {
                    backgroundColor: done ? tc.successBg : tc.accentBg,
                    shadowOpacity: mainBtnGlow,
                    shadowColor: tc.success,
                    shadowRadius: 16,
                  },
                ]}
              >
                <Icon
                  name={done ? LUCIDE_ICONS.check : LUCIDE_ICONS.play}
                  size={22}
                  color={done ? tc.success : tc.accent}
                />
              </Animated.View>
            </TouchableOpacity>
          )}
          <View style={[s.ctrlBtn, { opacity: 0 }]}>
            <Icon name={LUCIDE_ICONS.refreshCw} size={18} color="transparent" />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 52,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  durChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  durChipText: { ...TYPOGRAPHY.bodySm },
  mToast: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 100,
  },
  mToastText: {
    backgroundColor: "rgba(0,0,0,0.75)",
    color: "#fff",
    ...TYPOGRAPHY.body,
    fontWeight: "700",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    overflow: "hidden",
  },
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
  levelUpTitle: {
    color: "#ffd54f",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  levelUpSub: { color: "#fff", fontWeight: "600", fontSize: 13, opacity: 0.9 },
  body: {
    flex: 1,
    paddingHorizontal: 28,
    paddingBottom: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 8,
  },
  treeStage: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    position: "relative",
  },
  treeArea: {
    justifyContent: "center",
    alignItems: "center",
    width: 200,
    height: 220,
    position: "relative",
  },
  fireflyLayer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 200,
    height: 220,
  },
  groundShadow: {
    position: "absolute",
    bottom: -2,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#000000",
    zIndex: 1,
  },
  rootFlare: {
    position: "absolute",
    height: 8,
    borderRadius: 6,
    zIndex: 2,
  },
  confettiField: {
    position: "absolute",
    top: -20,
    width: 200,
    alignSelf: "center",
    bottom: 0,
  },
  treeWrap: { width: 200, height: 220, position: "relative" },
  pot: {
    position: "absolute",
    bottom: 0,
    left: 72,
    width: 56,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },
  potText: { ...TYPOGRAPHY.captionSm, fontWeight: "700", color: "#fff" },
  trunk: {
    position: "absolute",
    borderRadius: 4,
    zIndex: 3,
    overflow: "hidden",
  },
  trunkShade: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: "45%",
  },
  leaf: { position: "absolute", zIndex: 4 },
  flower: { position: "absolute", zIndex: 6 },
  timerSection: { alignItems: "center", marginBottom: 16 },
  timerText: { ...TYPOGRAPHY.monoLg, fontSize: 32 },
  timerLabel: { ...TYPOGRAPHY.label, marginTop: 4 },
  forestStats: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statItem: { flex: 1, alignItems: "center", gap: 2 },
  statVal: { ...TYPOGRAPHY.mono },
  statLbl: { ...TYPOGRAPHY.label },
  statDiv: { width: 1, height: 28 },
  controls: { flexDirection: "row", alignItems: "center", gap: 24 },
  ctrlBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  mainBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  screenSaver: { flex: 1, justifyContent: "center", alignItems: "center" },
  saverBody: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
  },
  saverTimer: { ...TYPOGRAPHY.monoLg, fontSize: 56, letterSpacing: 2 },
  saverTree: { transform: [{ scale: 1.2 }] },
  saverHint: {
    ...TYPOGRAPHY.captionSm,
    color: "rgba(255,255,255,0.35)",
    marginTop: 24,
  },
});
