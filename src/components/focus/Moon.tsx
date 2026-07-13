import React from "react";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import { View } from "react-native";

export default function Moon() {
  return (
    <View
      style={{
        position: "absolute",
        top: 80,
        right: 35,
      }}
    >
      <Svg width={90} height={90}>
        <Defs>
          <RadialGradient id="moonGlow">
            <Stop offset="0%" stopColor="#FFFDF5" stopOpacity="1" />
            <Stop offset="70%" stopColor="#FFF7CC" stopOpacity="0.9" />
            <Stop offset="100%" stopColor="#FFF7CC" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        <Circle cx="45" cy="45" r="36" fill="url(#moonGlow)" />

        <Circle cx="45" cy="45" r="24" fill="#FFF9E7" />

        <Circle cx="38" cy="38" r="3" fill="#F0E7C2" />

        <Circle cx="52" cy="50" r="2.5" fill="#F0E7C2" />

        <Circle cx="42" cy="56" r="2" fill="#F0E7C2" />
      </Svg>
    </View>
  );
}
