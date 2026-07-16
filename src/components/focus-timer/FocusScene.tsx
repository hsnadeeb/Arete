import React, { useMemo, useRef, useEffect, useState } from "react";
import { View, Animated, Easing, StyleSheet } from "react-native";
import Svg, {
  Path,
  Circle,
  Rect,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  G,
  Ellipse,
  Polygon,
} from "react-native-svg";
import AnimatedSvg from "./AnimatedSvgElements";
import { hash } from "./constants";
import type { SceneConditions } from "../../services/weather";

// ─── Color ───

export function lerpColor(ca: string, cb: string, f: number): string {
  const ha = ca.match(/#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i);
  const hb = cb.match(/#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i);
  if (!ha || !hb) return ca;
  const r = Math.round(parseInt(ha[1], 16) + (parseInt(hb[1], 16) - parseInt(ha[1], 16)) * f);
  const g = Math.round(parseInt(ha[2], 16) + (parseInt(hb[2], 16) - parseInt(ha[2], 16)) * f);
  const b = Math.round(parseInt(ha[3], 16) + (parseInt(hb[3], 16) - parseInt(ha[3], 16)) * f);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

// ─── Palettes ───

interface SkyColors {
  top: string; bottom: string; horizon: string;
  mountain: string; mountainFar: string;
  ground: string; groundFar: string; fog: string;
}

const TREE_SKY: SkyColors[] = [
  { top:"#02030A", bottom:"#0a1628", horizon:"#0f1a2e", mountain:"#0d1b2a", mountainFar:"#0f1f30", ground:"#0a1a0a", groundFar:"#071407", fog:"#1a2744" },
  { top:"#050816", bottom:"#111d35", horizon:"#14223a", mountain:"#0f1f30", mountainFar:"#112238", ground:"#0e1f0e", groundFar:"#0b180b", fog:"#1f3050" },
  { top:"#0a0f2a", bottom:"#1a2d4a", horizon:"#1e3350", mountain:"#1a2d3d", mountainFar:"#1d3045", ground:"#152815", groundFar:"#0f1f0f", fog:"#2a3d5a" },
  { top:"#1a1f4a", bottom:"#2a3d5a", horizon:"#304460", mountain:"#2a3d4a", mountainFar:"#2d4050", ground:"#1a301a", groundFar:"#142514", fog:"#3a4d6a" },
  { top:"#2a2a5a", bottom:"#4a3a4a", horizon:"#55445a", mountain:"#3a3a3a", mountainFar:"#4a4a4a", ground:"#2a3a2a", groundFar:"#1a2a1a", fog:"#5a4a5a" },
  { top:"#3a3a6a", bottom:"#6a5a4a", horizon:"#7a6a5a", mountain:"#4a4a3a", mountainFar:"#5a5a4a", ground:"#3a4a2a", groundFar:"#2a3a1a", fog:"#6a5a5a" },
  { top:"#4a4a6a", bottom:"#8a7a5a", horizon:"#9a8a6a", mountain:"#5a5a4a", mountainFar:"#6a6a5a", ground:"#4a5a3a", groundFar:"#3a4a2a", fog:"#7a6a5a44" },
  { top:"#5a5a7a", bottom:"#9a8a6a", horizon:"#aa9a7a", mountain:"#6a6a5a", mountainFar:"#7a7a6a", ground:"#5a6a4a", groundFar:"#4a5a3a", fog:"#8a7a6a33" },
  { top:"#6a6a8a", bottom:"#aa9a7a", horizon:"#baaa8a", mountain:"#7a7a6a", mountainFar:"#8a8a7a", ground:"#6a7a5a", groundFar:"#5a6a4a", fog:"#9a8a7a22" },
];

const TIME_SKY: Record<string, { top: string; bottom: string; horizon: string }> = {
  night:     { top:"#02030A", bottom:"#0a1222", horizon:"#0f1830" },
  dawn:      { top:"#1a0f2a", bottom:"#e85d3a", horizon:"#e07a5a" },
  morning:   { top:"#1e3a5f", bottom:"#7ab8d4", horizon:"#93c8e0" },
  afternoon: { top:"#1a4a8a", bottom:"#87c8e8", horizon:"#a0d4ea" },
  evening:   { top:"#2a1a3a", bottom:"#e85d3a", horizon:"#d4754a" },
};

const WEATHER_DIM: Record<string, { f: number; tint: string }> = {
  cloudy:  { f: 0.25, tint: "#94a3b8" },
  rainy:   { f: 0.35, tint: "#64748b" },
  foggy:   { f: 0.30, tint: "#cbd5e1" },
  stormy:  { f: 0.50, tint: "#1e293b" },
  snowy:   { f: 0.15, tint: "#e2e8f0" },
  sunny:   { f: 0, tint: "transparent" },
};

function resolveSky(t: number, conditions?: SceneConditions) {
  const sc = TREE_SKY.length;
  const raw = t * (sc - 1);
  const idx = Math.min(Math.floor(raw), sc - 2);
  const f = raw - idx;
  const a = TREE_SKY[idx], b = TREE_SKY[Math.min(idx + 1, sc - 1)];

  let top: string, bottom: string, horizon: string;
  let sunColor = "transparent";
  let starOpacity = 0;
  let moonOpacity = 0;

  if (conditions) {
    const tc = TIME_SKY[conditions.timeOfDay] ?? TIME_SKY.night;
    top = tc.top; bottom = tc.bottom; horizon = tc.horizon;
    const wm = WEATHER_DIM[conditions.weather] ?? WEATHER_DIM.sunny;
    if (wm.f > 0) {
      top = lerpColor(top, wm.tint, wm.f * 0.5);
      bottom = lerpColor(bottom, wm.tint, wm.f * 0.35);
      horizon = lerpColor(horizon, wm.tint, wm.f * 0.3);
    }
    if (conditions.isDay && conditions.weather !== "stormy" && conditions.weather !== "rainy") {
      sunColor = (conditions.timeOfDay === "dawn" || conditions.timeOfDay === "evening") ? "#fbbf24" : "#fde047";
    }
    if (!conditions.isDay) {
      starOpacity = Math.max(0, 0.85 - conditions.cloudCover * 0.6);
      moonOpacity = conditions.cloudCover < 0.6 ? 0.9 - conditions.cloudCover * 0.5 : 0;
    }
  } else {
    top = lerpColor(a.top, b.top, f);
    bottom = lerpColor(a.bottom, b.bottom, f);
    horizon = lerpColor(a.horizon, b.horizon, f);
    if (t < 0.15) { starOpacity = 0.7; moonOpacity = 0.6; }
    else if (t < 0.4) { starOpacity = 0.4; moonOpacity = 0.3; }
    else { starOpacity = 0; moonOpacity = 0; }
    if (t > 0.25) sunColor = "#fde047";
  }

  const colors: SkyColors = {
    top, bottom, horizon,
    mountain: lerpColor(a.mountain, b.mountain, f),
    mountainFar: lerpColor(a.mountainFar, b.mountainFar, f),
    ground: lerpColor(a.ground, b.ground, f),
    groundFar: lerpColor(a.groundFar, b.groundFar, f),
    fog: lerpColor(a.fog, b.fog, f),
  };

  return { colors, sunColor, starOpacity, moonOpacity };
}

// ─── Mountains ───

function MountainRange({ w, h, colors }: { w: number; h: number; colors: SkyColors }) {
  const fw = w * 1.2;
  const ox = -w * 0.1;
  const mtnH = h * 0.18;
  const bh = h * 0.68;
  const farPts = [
    { x:0, y:0.72 },{ x:0.12, y:0.50 },{ x:0.22, y:0.42 },
    { x:0.32, y:0.48 },{ x:0.42, y:0.38 },{ x:0.52, y:0.45 },
    { x:0.62, y:0.35 },{ x:0.72, y:0.42 },{ x:0.82, y:0.48 },
    { x:0.92, y:0.40 },{ x:1.0, y:0.52 },
  ];
  const nearPts = [
    { x:0, y:0.82 },{ x:0.10, y:0.45 },{ x:0.20, y:0.58 },
    { x:0.28, y:0.32 },{ x:0.38, y:0.52 },{ x:0.45, y:0.28 },
    { x:0.55, y:0.48 },{ x:0.62, y:0.22 },{ x:0.72, y:0.42 },
    { x:0.80, y:0.30 },{ x:0.90, y:0.48 },{ x:1.0, y:0.62 },
  ];
  const toPath = (pts: { x: number; y: number }[], oy: number) => {
    let d = `M ${ox} ${bh} `;
    for (let i = 0; i < pts.length; i++) {
      const px = ox + pts[i].x * fw;
      const py = bh - mtnH * pts[i].y + oy;
      if (i === 0) d += `L ${px} ${py} `;
      else {
        const px0 = ox + pts[i - 1].x * fw;
        const py0 = bh - mtnH * pts[i - 1].y + oy;
        const cpx = (px0 + px) / 2;
        const cpy = (py0 + py) / 2 - mtnH * 0.06;
        d += `Q ${cpx} ${cpy} ${px} ${py} `;
      }
    }
    d += `L ${ox + fw} ${bh} Z`;
    return d;
  };
  return (
    <G>
      <Path d={toPath(farPts, -mtnH * 0.15)} fill={colors.mountainFar} />
      <Path d={toPath(nearPts, 0)} fill={colors.mountain} />
    </G>
  );
}

// ─── Horizon haze ───

function HorizonHaze({ w, h, colors }: { w: number; h: number; colors: SkyColors }) {
  const y = h * 0.64;
  return (
    <G>
      <Defs>
        <SvgLinearGradient id="hazeG" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={lerpColor(colors.horizon, "#ffffff", 0.15)} stopOpacity={0.4} />
          <Stop offset="0.5" stopColor={colors.horizon} stopOpacity={0.15} />
          <Stop offset="1" stopColor={colors.horizon} stopOpacity={0} />
        </SvgLinearGradient>
      </Defs>
      <Rect x={0} y={y - h * 0.04} width={w} height={h * 0.08} fill="url(#hazeG)" />
    </G>
  );
}

// ─── Ground ───

function GroundSVG({ w, h, colors }: { w: number; h: number; colors: SkyColors }) {
  const gt = h * 0.66;
  const gh = h * 0.34;
  const grassBlades = useMemo(() =>
    Array.from({ length: 28 }, (_, i) => ({
      x: (i / 28) * w * 1.1 - w * 0.05,
      h: 6 + hash(i, 0.2) * 16,
      c: 1 + hash(i, 0.3) * 0.5,
    })),
  [w]);
  return (
    <G>
      <Defs>
        <SvgLinearGradient id="gg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.ground} />
          <Stop offset="1" stopColor={colors.groundFar} />
        </SvgLinearGradient>
      </Defs>
      <Rect x={0} y={gt} width={w} height={gh + 4} fill="url(#gg)" />
      <Rect x={0} y={gt} width={w} height={4} fill={colors.ground} rx={2} />
      {grassBlades.map((b, i) => (
        <Path
          key={i}
          d={`M ${b.x} ${gt + 2} Q ${b.x + b.c} ${gt - b.h * 0.5} ${b.x + b.c * 2} ${gt - b.h}`}
          stroke={"#4ade80"} strokeWidth={1.2} fill="none"
          opacity={0.3 + hash(i, 0.5) * 0.3}
        />
      ))}
    </G>
  );
}

// ─── Stars (inside SVG — opacity-only animation, safe) ───

function Stars({ count, opacity, active, w, h }: { count: number; opacity: number; active: boolean; w: number; h: number }) {
  const data = useMemo(() =>
    Array.from({ length: 60 }, (_, i) => ({
      x: hash(i, 0.1) * w,
      y: hash(i, 0.2) * h * 0.6,
      r: 1 + hash(i, 0.3) * 2,
    })),
  [w, h]);
  if (count === 0 || opacity <= 0) return null;
  return (
    <G opacity={opacity}>
      {data.slice(0, count).map((s, i) => (
        <TwinkleStar key={i} {...s} active={active} />
      ))}
    </G>
  );
}

function TwinkleStar({ x, y, r, active }: { x: number; y: number; r: number; active: boolean }) {
  const op = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    if (!active) return;
    const delay = hash(x + y, 0.5) * 4000 + 200;
    const speed = 2000 + hash(x, 0.7) * 3000;
    op.setValue(0.4);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(op, { toValue: 1, duration: speed * 0.35, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(op, { toValue: 0.3, duration: speed * 0.65, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active]);
  return <AnimatedSvg.Circle cx={x} cy={y} r={r} fill="#fff" opacity={op} />;
}

// ─── Sun ───

function SunSVG({ x, y, color, visible }: { x: number; y: number; color: string; visible: boolean }) {
  const [show, setShow] = useState(visible);
  const op = useRef(new Animated.Value(visible ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(op, { toValue: visible ? 1 : 0, duration: 800, useNativeDriver: false }).start(() => {
      if (!visible) setShow(false);
    });
    if (visible) setShow(true);
  }, [visible]);
  if (!show && !visible) return null;
  return (
    <G>
      <AnimatedSvg.Circle cx={x} cy={y} r={35} fill={color} opacity={op.interpolate({ inputRange: [0, 1], outputRange: [0, 0.3] })} />
      <AnimatedSvg.Circle cx={x} cy={y} r={20} fill={color} opacity={op.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] })} />
      <AnimatedSvg.Circle cx={x} cy={y} r={12} fill={color} opacity={op} />
    </G>
  );
}

// ─── Moon (Animated glow + float via opacity, static crescent + craters) ───

function MoonSVG({ x, y, opacity }: { x: number; y: number; opacity: number }) {
  const glow = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.7, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  if (opacity <= 0.01) return null;

  const fade = opacity;
  const cx = x;
  const cy = y;
  const moonColor = '#f0ead6';
  const glowColor = '#f5e6b8';

  return (
    <G opacity={fade}>
      {/* Outer glow ring */}
      <AnimatedSvg.Circle cx={cx} cy={cy} r={22} fill={glowColor} opacity={glow.interpolate({ inputRange: [0.7, 1], outputRange: [0.12, 0.25] })} />
      {/* Mid glow */}
      <AnimatedSvg.Circle cx={cx} cy={cy} r={16} fill={glowColor} opacity={glow.interpolate({ inputRange: [0.7, 1], outputRange: [0.2, 0.35] })} />
      {/* Moon body */}
      <Circle cx={cx} cy={cy} r={12} fill={moonColor} />
      {/* Crescent shadow (cutout) */}
      <Circle cx={cx + 3.5} cy={cy - 2.5} r={9.5} fill="#02030A" />
      {/* Subtle craters */}
      <Circle cx={cx - 3} cy={cy - 1} r={1.8} fill="#d4ceb8" opacity={0.4} />
      <Circle cx={cx + 1} cy={cy + 3} r={1.2} fill="#d4ceb8" opacity={0.35} />
      <Circle cx={cx - 5} cy={cy + 2} r={1} fill="#d4ceb8" opacity={0.3} />
      <Circle cx={cx + 4} cy={cy - 4} r={0.7} fill="#d4ceb8" opacity={0.25} />
    </G>
  );
}

// ─── Static clouds (SVG) ───

function CloudsSVG({ w, h, cloudCover }: { w: number; h: number; cloudCover: number }) {
  const count = Math.min(4, Math.max(0, Math.ceil(cloudCover * 5)));
  if (count === 0 || cloudCover <= 0.02) return null;
  const baseY = h * 0.08;
  const baseOp = Math.min(0.5, cloudCover * 0.5);
  const data = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      cx: w * (0.15 + hash(i, 0.1) * 0.7),
      cy: baseY + hash(i, 0.2) * h * 0.15,
      s: 0.5 + hash(i, 0.3) * 0.8,
    })),
  [count, w, baseY, h]);
  return (
    <G opacity={baseOp}>
      {data.map((c, i) => (
        <G key={i}>
          <Circle cx={c.cx} cy={c.cy} r={25 * c.s} fill="#94a3b8" />
          <Circle cx={c.cx + 18 * c.s} cy={c.cy - 5} r={20 * c.s} fill="#94a3b8" />
          <Circle cx={c.cx - 15 * c.s} cy={c.cy - 3} r={18 * c.s} fill="#94a3b8" />
        </G>
      ))}
    </G>
  );
}

// ─── Light rays (inside SVG — opacity-only, safe) ───

function LightRays({ w, h, sunColor, sunY, visible }: { w: number; h: number; sunColor: string; sunY: number; visible: boolean }) {
  const op = useRef(new Animated.Value(0)).current;
  const rays = useMemo(() =>
    Array.from({ length: 5 }, (_, i) => ({
      x1: w * 0.2 + i * w * 0.15,
      x2: w * 0.1 + i * w * 0.2,
    })),
  [w]);
  useEffect(() => {
    Animated.timing(op, { toValue: visible ? 0.08 : 0, duration: 1000, useNativeDriver: false }).start();
  }, [visible]);
  if (!visible) return null;
  return (
    <AnimatedSvg.G opacity={op}>
      {rays.map((r, i) => (
        <Polygon
          key={i}
          points={`${r.x1},${sunY + 20} ${r.x2},${sunY + 60} ${r.x2 + 30},${h * 0.75} ${r.x1 + 10},${sunY + 20}`}
          fill={sunColor}
          opacity={0.06 + hash(i, 0.3) * 0.04}
        />
      ))}
    </AnimatedSvg.G>
  );
}

// ═══════════════════════════════════════════════════════════
// WEATHER PARTICLES — rendered as Animated.View OVERLAYS
// All use useNativeDriver: true via transform for 60fps
// All pre-initialize Animated.Values to start positions
// ═══════════════════════════════════════════════════════════

// ─── RAIN (3 depth layers, 80 drops) ───

function RainOverlay({ w, h, intensity, active }: { w: number; h: number; intensity: number; active: boolean }) {
  const drops = useMemo(() => {
    const total = 90;
    return Array.from({ length: total }, (_, i) => {
      const layer = i < 25 ? 0 : i < 60 ? 1 : 2;
      const layerSpeeds = [450, 300, 200];
      const layerLengths = [12, 18, 24];
      const layerWidths = [1.2, 1.8, 2.5];
      const layerOps = [0.35, 0.55, 0.75];
      const layerColors = ['#8899cc', '#a0bce0', '#c8ddf5'];
      return {
        x: hash(i, 0.1) * w,
        startY: -(hash(i, 0.2) * h * 0.7 + 20),
        length: layerLengths[layer],
        width: layerWidths[layer],
        delay: hash(i, 0.8) * 2000,
        speed: layerSpeeds[layer] + hash(i, 0.7) * 80,
        opacity: layerOps[layer],
        color: layerColors[layer],
      };
    });
  }, [w, h]);

  const transY = useRef(drops.map(d => new Animated.Value(d.startY))).current;

  useEffect(() => {
    if (!active || intensity <= 0) return;
    const anims = drops.map((d, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(d.delay),
          Animated.timing(transY[i], {
            toValue: h + 20,
            duration: d.speed,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(transY[i], {
            toValue: d.startY,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ),
    );
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, [active, intensity, h]);

  if (intensity <= 0) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {drops.map((d, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: d.x,
            top: 0,
            width: d.width,
            height: d.length,
            borderRadius: d.width * 0.5,
            backgroundColor: d.color,
            opacity: intensity * d.opacity,
            shadowColor: '#a0c0e8',
            shadowOpacity: 0.6,
            shadowRadius: d.width * 2,
            shadowOffset: { width: 0, height: 0 },
            transform: [{ translateY: transY[i] }],
          }}
        />
      ))}
    </View>
  );
}

// ─── SNOW (50 flakes, gentle drift) ───

function SnowOverlay({ w, h, active }: { w: number; h: number; active: boolean }) {
  const flakes = useMemo(() => {
    return Array.from({ length: 55 }, (_, i) => {
      const layer = i < 15 ? 0 : i < 35 ? 1 : 2;
      const layerSizes = [2, 3.5, 5];
      const layerSpeeds = [6000, 4500, 3000];
      const layerOps = [0.5, 0.7, 0.9];
      const driftMag = 20 + hash(i, 0.4) * 40;
      return {
        x: hash(i, 0.1) * w,
        startY: -(hash(i, 0.2) * h * 0.6 + 20),
        r: layerSizes[layer] + hash(i, 0.3) * 1,
        delay: hash(i, 0.8) * 6000,
        speed: layerSpeeds[layer] + hash(i, 0.7) * 1000,
        drift: driftMag,
        dir: hash(i, 0.5) > 0.5 ? 1 : -1,
        opacity: layerOps[layer],
      };
    });
  }, [w, h]);

  const transY = useRef(flakes.map(f => new Animated.Value(f.startY))).current;
  const transX = useRef(flakes.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (!active) return;
    const anims = flakes.map((f, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(f.delay),
          Animated.parallel([
            Animated.timing(transY[i], {
              toValue: h + 20,
              duration: f.speed,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
            Animated.timing(transX[i], {
              toValue: f.drift * f.dir,
              duration: f.speed,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(transY[i], { toValue: f.startY, duration: 0, useNativeDriver: true }),
            Animated.timing(transX[i], { toValue: 0, duration: 0, useNativeDriver: true }),
          ]),
        ]),
      ),
    );
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, [active, h]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {flakes.map((f, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: f.x,
            top: 0,
            width: f.r * 2,
            height: f.r * 2,
            borderRadius: f.r,
            backgroundColor: '#ffffff',
            opacity: f.opacity,
            shadowColor: '#ffffff',
            shadowOpacity: 0.5,
            shadowRadius: f.r * 1.5,
            shadowOffset: { width: 0, height: 0 },
            transform: [
              { translateY: transY[i] },
              { translateX: transX[i] },
            ],
          }}
        />
      ))}
    </View>
  );
}

// ─── WIND (12 streaks, native transform) ───

function WindOverlay({ w, h, t, active }: { w: number; h: number; t: number; active: boolean }) {
  const count = t < 0.2 ? 0 : Math.min(12, Math.floor((t - 0.2) * 15));
  const streaks = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      y: 0.06 + hash(i, 0.2) * 0.75,
      l: 100 + hash(i, 0.3) * 120,
      delay: hash(i, 0.5) * 10000,
      speed: 2500 + hash(i, 0.6) * 4000,
      op: 0.15 + hash(i, 0.4) * 0.2,
      thickness: 1.5 + hash(i, 0.9) * 2,
    })),
  [count]);
  const MAX_STREAKS = 12;
  const transX = useRef(Array.from({ length: MAX_STREAKS }, (_, i) => {
    const l = 100 + hash(i, 0.3) * 120;
    return new Animated.Value(-l - 40);
  })).current;

  useEffect(() => {
    if (!active || count === 0) return;
    const anims = streaks.map((s, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(s.delay),
          Animated.timing(transX[i], {
            toValue: w + 40,
            duration: s.speed,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(transX[i], {
            toValue: -s.l - 40,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ),
    );
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, [active, count, w]);

  if (count === 0) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {streaks.map((s, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: 0,
            top: s.y * h,
            width: s.l,
            height: s.thickness,
            borderRadius: s.thickness * 0.5,
            backgroundColor: '#e2e8f0',
            opacity: s.op,
            transform: [{ translateX: transX[i] }],
          }}
        />
      ))}
    </View>
  );
}

// ─── FOG (patchy mist patches, independent drift) ───

function FogOverlay({ w, h, opacity: fogOp, active }: { w: number; h: number; opacity: number; active: boolean }) {
  const patches = useMemo(() => {
    const count = 30;
    return Array.from({ length: count }, (_, i) => {
      const yBase = 0.48 + hash(i, 0.1) * 0.36;
      const heightPct = 0.04 + hash(i, 0.2) * 0.10;
      const widthPct = 0.20 + hash(i, 0.3) * 0.40;
      return {
        x: hash(i, 0.4) * w * 1.3 - w * 0.15,
        y: yBase * h,
        patchW: w * widthPct,
        patchH: h * heightPct,
        speed: 30000 + hash(i, 0.5) * 40000,
        driftDir: hash(i, 0.6) > 0.5 ? 1 : -1,
        driftMag: 20 + hash(i, 0.7) * 40,
        opacity: 0.06 + hash(i, 0.8) * 0.10,
      };
    });
  }, [w, h]);

  const dxVals = useRef(patches.map(p => new Animated.Value(0))).current;
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    if (!active) return;
    const anims = patches.map((p, i) => {
      dxVals[i].setValue(0);
      return Animated.loop(
        Animated.sequence([
          Animated.delay(hash(i, 0.9) * p.speed),
          Animated.timing(dxVals[i], {
            toValue: 1,
            duration: p.speed,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(dxVals[i], {
            toValue: 0,
            duration: p.speed,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      );
    });
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, [active]);

  if (!active) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {patches.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: p.x,
            top: p.y,
            width: p.patchW,
            height: p.patchH,
            borderRadius: p.patchW * 0.5,
            backgroundColor: '#d0dce8',
            opacity: fogOp * p.opacity,
            transform: [{
              translateX: dxVals[i].interpolate({
                inputRange: [0, 1],
                outputRange: [0, p.driftMag * p.driftDir],
              }),
            }],
          }}
        />
      ))}
    </View>
  );
}

// ─── LIGHTNING ───

function LightningOverlay({ w, h, active }: { w: number; h: number; active: boolean }) {
  const flash = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) return;
    const timerRef: { current: ReturnType<typeof setTimeout> | null } = { current: null };
    const strike = () => {
      Animated.sequence([
        Animated.timing(flash, { toValue: 1, duration: 60, useNativeDriver: true }),
        Animated.timing(flash, { toValue: 0.3, duration: 40, useNativeDriver: true }),
        Animated.timing(flash, { toValue: 0, duration: 120, useNativeDriver: true }),
        Animated.delay(200 + hash(Date.now(), 0.1) * 300),
        Animated.timing(flash, { toValue: 0.7, duration: 30, useNativeDriver: true }),
        Animated.timing(flash, { toValue: 0, duration: 100, useNativeDriver: true }),
      ]).start(() => {
        const next = 4000 + hash(Date.now(), 0.3) * 8000;
        timerRef.current = setTimeout(strike, next);
      });
    };
    timerRef.current = setTimeout(strike, 1000 + hash(Date.now(), 0.5) * 3000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [active]);

  if (!active) return null;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: 0, right: 0, top: 0, bottom: 0,
        backgroundColor: '#ffffff',
        opacity: flash.interpolate({ inputRange: [0, 1], outputRange: [0, 0.35] }),
      }}
      pointerEvents="none"
    />
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN SCENE
// ═══════════════════════════════════════════════════════════

interface FocusSceneProps {
  t: number;
  running: boolean;
  width: number;
  height: number;
  conditions?: SceneConditions;
  particlesActive?: boolean;
}

export function FocusScene({ t, running, width, height, conditions, particlesActive = true }: FocusSceneProps) {
  const { colors, sunColor, starOpacity, moonOpacity } = useMemo(() => resolveSky(t, conditions), [t, conditions]);

  const starCount = useMemo(() => Math.floor(starOpacity * 55), [starOpacity]);
  const isMorning = conditions ? conditions.hour >= 5 && conditions.hour < 12 : t > 0.25;
  const sunX = isMorning ? width * 0.22 : width * 0.78;
  const sunYval = height * 0.08;
  const showSun = sunColor !== "transparent";
  const moonX = width * 0.82;
  const moonYval = height * 0.08;
  const showMoon = moonOpacity > 0.01;
  const cc = conditions?.cloudCover ?? 0;
  const ri = conditions?.rainIntensity ?? 0;
  const showFog = !!(conditions && ["foggy", "rainy", "stormy"].includes(conditions.weather));
  const fogOp = conditions
    ? conditions.weather === "foggy" ? 0.5 : conditions.weather === "stormy" ? 0.35 : conditions.weather === "rainy" ? 0.25 : 0.15
    : t < 0.5 ? 0.2 : 0.1;
  const showLightning = conditions?.weather === "stormy";
  const showSnow = conditions?.weather === "snowy";

  return (
    <View style={[s.container, { width, height }]}>
      {/* SVG BACKGROUND — static scene only */}
      <Svg width={width} height={height} style={s.svg}>
        <Defs>
          <SvgLinearGradient id="skyG" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.top} />
            <Stop offset="0.4" stopColor={lerpColor(colors.top, colors.horizon, 0.5)} />
            <Stop offset="0.75" stopColor={colors.horizon} />
            <Stop offset="1" stopColor={colors.bottom} />
          </SvgLinearGradient>
        </Defs>
        <Rect x={0} y={0} width={width} height={height} fill="url(#skyG)" />
        <Stars count={starCount} opacity={starOpacity} active={particlesActive} w={width} h={height} />
        <MoonSVG x={moonX} y={moonYval} opacity={moonOpacity} />
        <SunSVG x={sunX} y={sunYval} color={sunColor} visible={showSun} />
        <LightRays w={width} h={height} sunColor={sunColor} sunY={sunYval} visible={showSun} />
        <CloudsSVG w={width} h={height} cloudCover={cc} />
        <HorizonHaze w={width} h={height} colors={colors} />
        <MountainRange w={width} h={height} colors={colors} />
        <GroundSVG w={width} h={height} colors={colors} />
      </Svg>

      {/* WEATHER OVERLAYS — Animated.View outside SVG */}
      <FogOverlay w={width} h={height} opacity={fogOp} active={showFog && particlesActive} />
      <RainOverlay w={width} h={height} intensity={ri} active={particlesActive} />
      <SnowOverlay w={width} h={height} active={showSnow && particlesActive} />
      <WindOverlay w={width} h={height} t={t} active={particlesActive} />
      <LightningOverlay w={width} h={height} active={showLightning && particlesActive} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { position: "absolute", top: 0, left: 0, overflow: "hidden" },
  svg: { position: "absolute", top: 0, left: 0 },
});
