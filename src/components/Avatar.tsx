import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { Icon } from "./Icons";
import { LUCIDE_ICONS } from "../constants/typography";

interface AvatarProps {
  uri?: string | null;
  name?: string | null;
  gender?: string | null;
  size?: number;
  iconSize?: number;
  textSize?: number;
}

function getInitials(name?: string | null): string {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

function getAvatarColors(gender?: string | null) {
  switch (gender) {
    case "male":
      return { bg: "#dbeafe", text: "#2563eb", icon: "#3b82f6" };
    case "female":
      return { bg: "#fce7f3", text: "#db2777", icon: "#ec4899" };
    default:
      return { bg: "#e0e7ff", text: "#4338ca", icon: "#6366f1" };
  }
}

export function Avatar({
  uri,
  name,
  gender,
  size = 40,
  iconSize = 18,
  textSize = 14,
}: AvatarProps) {
  const colors = getAvatarColors(gender);

  if (uri) {
    return (
      <View
        style={[
          styles.wrapper,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            overflow: "hidden",
          },
        ]}
      >
        <Image
          source={{ uri }}
          style={{ width: size, height: size }}
          resizeMode="cover"
        />
      </View>
    );
  }

  const initials = getInitials(name);
  if (initials && initials !== "?") {
    return (
      <View
        style={[
          styles.wrapper,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors.bg,
          },
        ]}
      >
        <Text
          style={[
            styles.initials,
            { color: colors.text, fontSize: textSize },
          ]}
        >
          {initials}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.wrapper,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.bg,
        },
      ]}
    >
      <Icon name={LUCIDE_ICONS.user} size={iconSize} color={colors.icon} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    fontWeight: "700",
  },
});
