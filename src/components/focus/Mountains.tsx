import React from "react";
import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";

import { Dimensions } from "react-native";

const { width } = Dimensions.get("window");

export default function Mountains() {
  return (
    <Svg
      width={width}
      height={260}
      style={{
        position: "absolute",
        bottom: 170,
      }}
    >
      <Defs>
        <LinearGradient id="mountain" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#23374A" />

          <Stop offset="100%" stopColor="#102130" />
        </LinearGradient>
      </Defs>

      <Path
        fill="url(#mountain)"
        d={`
        M0 220
        L90 110
        L170 210
        L260 80
        L360 210
        L430 140
        L520 220
        L520 260
        L0 260
        Z
      `}
      />

      <Path
        fill="#132A3C"
        opacity={0.8}
        d={`
        M0 230
        L70 150
        L160 220
        L260 120
        L340 220
        L450 160
        L520 230
        L520 260
        L0 260
        Z
      `}
      />
    </Svg>
  );
}
