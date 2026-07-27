import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { Icon } from "./Icons";
import { LUCIDE_ICONS } from "../constants/typography";
import { useTheme } from "../context/ThemeContext";
import { useStore } from "../store";

export default function BackButton() {
  const { theme } = useTheme();
  const goBack = useStore((s) => s.goBack);

  return (
    <TouchableOpacity onPress={goBack} style={styles.btn} activeOpacity={0.7}>
      <Icon name={LUCIDE_ICONS.arrowLeft} size={20} color={theme.colors.textSecondary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
});
