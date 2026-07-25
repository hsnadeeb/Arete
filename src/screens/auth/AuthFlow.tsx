import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import { useStore } from "../../store";
import { restoreAuth } from "../../services/auth";
import LoginScreen from "./LoginScreen";
import SignupScreen from "./SignupScreen";

interface AuthFlowProps {
  onAuthenticated: () => void;
}

export default function AuthFlow({ onAuthenticated }: AuthFlowProps) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [checking, setChecking] = useState(true);
  const authOpacity = useSharedValue(1);
  const setAuth = useStore((s) => s.setAuth);

  useEffect(() => {
    (async () => {
      const { user } = await restoreAuth();
      if (user) {
        setAuth(user);
        onAuthenticated();
      } else {
        setChecking(false);
      }
    })();
  }, []);

  const switchMode = useCallback(
    (next: "login" | "signup") => {
      if (next === mode) return;
      authOpacity.value = withTiming(0, { duration: 150, easing: Easing.out(Easing.ease) }, () => {
        runOnJS(setMode)(next);
        authOpacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.ease) });
      });
    },
    [mode],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: authOpacity.value,
  }));

  if (checking) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <Animated.View style={[{ flex: 1, backgroundColor: colors.bg }, animatedStyle]}>
      {mode === "login" ? (
        <LoginScreen onSwitchToSignup={() => switchMode("signup")} />
      ) : (
        <SignupScreen onSwitchToLogin={() => switchMode("login")} />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
