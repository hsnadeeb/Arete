import React from "react";
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  G,
  Path,
  Ellipse,
  Circle,
} from "react-native-svg";

type Props = {
  width?: number;
  height?: number;
  growth?: number; // 0-1
};

export default function Tree({ width = 260, height = 340, growth = 1 }: Props) {
  const trunkScale = Math.max(0.15, growth);
  const leafOpacity = Math.max(0, (growth - 0.2) / 0.8);

  return (
    <Svg width={width} height={height} viewBox="0 0 260 340">
      <Defs>
        <LinearGradient id="trunk" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#8C5B35" />
          <Stop offset="100%" stopColor="#4E2D17" />
        </LinearGradient>

        <LinearGradient id="leaf" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#66E084" />
          <Stop offset="100%" stopColor="#1F8A47" />
        </LinearGradient>
      </Defs>

      <G origin="130,300" scale={trunkScale}>
        <Path
          fill="url(#trunk)"
          d="
            M118 300
            C118 240 120 170 124 120
            C126 70 128 55 130 30
            C132 55 134 70 136 120
            C140 170 142 240 142 300
            Z
          "
        />

        <Path
          fill="url(#trunk)"
          d="
            M130 145
            C104 126 92 104 86 72
            C105 89 122 109 130 126
            Z
          "
        />

        <Path
          fill="url(#trunk)"
          d="
            M130 170
            C158 146 173 118 182 80
            C165 104 149 138 130 150
            Z
          "
        />

        <Path
          fill="url(#trunk)"
          d="
            M130 105
            C110 85 100 55 100 28
            C117 50 127 70 130 90
            Z
          "
        />

        <Path
          fill="url(#trunk)"
          d="
            M130 95
            C150 72 164 46 174 20
            C162 49 149 73 130 89
            Z
          "
        />
      </G>

      <G opacity={leafOpacity}>
        <Ellipse cx="130" cy="72" rx="52" ry="42" fill="url(#leaf)" />

        <Ellipse cx="88" cy="96" rx="40" ry="34" fill="url(#leaf)" />

        <Ellipse cx="172" cy="95" rx="41" ry="35" fill="url(#leaf)" />

        <Ellipse cx="105" cy="50" rx="32" ry="26" fill="url(#leaf)" />

        <Ellipse cx="156" cy="45" rx="32" ry="26" fill="url(#leaf)" />

        <Circle cx="129" cy="92" r="18" fill="#84F5A2" opacity={0.4} />
      </G>
    </Svg>
  );
}
