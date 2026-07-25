import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { Icon } from "../../components/Icons";
import { LUCIDE_ICONS, TYPOGRAPHY } from "../../constants/typography";
import type { Theme } from "../../context/ThemeContext";

interface SSOButtonsProps {
  theme: Theme;
  onGooglePress: () => void;
  onApplePress?: () => void;
  loading?: boolean;
}

export function SSOButtons({
  theme,
  onGooglePress,
  onApplePress,
  loading,
}: SSOButtonsProps) {
  const colors = theme.colors;

  return (
    <View style={styles.container}>
      <View style={styles.dividerRow}>
        <View style={[styles.divider, { backgroundColor: colors.divider }]} />
        <Text style={[styles.dividerText, { color: colors.textTertiary }]}>
          or continue with
        </Text>
        <View style={[styles.divider, { backgroundColor: colors.divider }]} />
      </View>

      <TouchableOpacity
        style={[
          styles.ssoBtn,
          { borderColor: colors.border, backgroundColor: colors.card },
        ]}
        onPress={onGooglePress}
        disabled={loading}
        activeOpacity={0.7}
      >
        <Icon name={LUCIDE_ICONS.globe} size={20} color={colors.text} />
        <Text style={[styles.ssoBtnText, { color: colors.text }]}>
          Continue with Google
        </Text>
      </TouchableOpacity>

      {Platform.OS === "ios" && onApplePress && (
        <TouchableOpacity
          style={[
            styles.ssoBtn,
            { borderColor: colors.border, backgroundColor: "#000" },
          ]}
          onPress={onApplePress}
          disabled={loading}
          activeOpacity={0.7}
        >
          <Text style={[styles.appleIcon, { color: "#fff" }]}></Text>
          <Text style={[styles.ssoBtnText, { color: "#fff" }]}>
            Continue with Apple
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    ...TYPOGRAPHY.caption,
  },
  ssoBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  ssoBtnText: {
    ...TYPOGRAPHY.btn,
  },
  appleIcon: {
    fontSize: 22,
    fontWeight: "400",
  },
});
