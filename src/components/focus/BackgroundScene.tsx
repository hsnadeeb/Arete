import React from "react";
import { View, StyleSheet } from "react-native";

import Sky from "./Sky";
import Stars from "./Stars";
import Moon from "./Moon";
import Mountains from "./Mountains";

import Ground from "./Ground";
import AnimatedGrass from "./AnimatedGrass";
import Fog from "./Fog";
import Fireflies from "./Fireflies";

export default function BackgroundScene() {
  return (
    <View style={StyleSheet.absoluteFill}>
      <Sky />
      <Stars />
      <Moon />
      <Mountains />

      <Fog />

      <Ground />

      <AnimatedGrass />

      <Fireflies />
    </View>
  );
}
