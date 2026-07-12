// components/ConfettiField.tsx
import React from "react";
import { View, StyleSheet } from "react-native"; // ← Fix here
import { ConfettiPiece } from "./ConfettiPiece";

type ConfettiFieldProps = {
  trigger: number;
};

export const ConfettiField: React.FC<ConfettiFieldProps> = ({ trigger }) => {
  if (trigger === 0) return null;

  return (
    <View pointerEvents="none" style={s.confettiField}>
      {Array.from({ length: 36 }, (_, i) => (
        <ConfettiPiece key={`${trigger}-${i}`} seed={i} trigger={trigger} />
      ))}
    </View>
  );
};

const s = StyleSheet.create({
  confettiField: {
    position: "absolute",
    top: -20,
    width: "100%",
    maxWidth: 260,
    alignSelf: "center",
    bottom: 0,
  },
});
