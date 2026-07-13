import React from "react";
import { StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function Sky() {
  return (
    <LinearGradient
      colors={["#02030A", "#07111D", "#0D1E2E", "#102A3E"]}
      style={StyleSheet.absoluteFill}
    />
  );
}
