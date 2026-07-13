import React from "react";
import Svg, { Ellipse, Defs, LinearGradient, Stop } from "react-native-svg";

import { Dimensions } from "react-native";

const { width } = Dimensions.get("window");

export default function Ground() {
  return (
    <Svg
      width={width}
      height={240}
      style={{
        position: "absolute",
        bottom: 0,
      }}
    >
      <Defs>
        <LinearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#274B34" />
          <Stop offset="100%" stopColor="#13261B" />
        </LinearGradient>
      </Defs>

      <Ellipse
        cx={width / 2}
        cy={180}
        rx={width}
        ry={120}
        fill="url(#ground)"
      />

      <Ellipse
        cx={width / 2}
        cy={170}
        rx={width}
        ry={55}
        fill="#315D3E"
        opacity={0.28}
      />
    </Svg>
  );
}
