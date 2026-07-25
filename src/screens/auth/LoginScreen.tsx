import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { Icon } from "../../components/Icons";
import { LUCIDE_ICONS, TYPOGRAPHY } from "../../constants/typography";
import { useStore } from "../../store";
import {
  signInWithEmail,
  signInWithGoogle,
  signInWithApple,
} from "../../services/auth";
import { SSOButtons } from "./SSOButtons";

interface LoginScreenProps {
  onSwitchToSignup: () => void;
}

export default function LoginScreen({ onSwitchToSignup }: LoginScreenProps) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const setAuth = useStore((s) => s.setAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = useCallback(async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Validation", "Please enter email and password");
      return;
    }
    setLoading(true);
    try {
      const user = await signInWithEmail(email.trim(), password);
      if (user) {
        setAuth(user);
      } else {
        Alert.alert("Notice", "Email sign-in needs a backend. Use Google or Apple SSO for now.");
      }
    } catch {
      Alert.alert("Error", "Something went wrong. Please try again.");
    }
    setLoading(false);
  }, [email, password, setAuth]);

  const handleGoogle = useCallback(async () => {
    setLoading(true);
    try {
      const { user, error } = await signInWithGoogle();
      if (user) {
        setAuth(user);
      } else if (error) {
        Alert.alert("Google Sign-In Error", error);
      }
    } catch {}
    setLoading(false);
  }, [setAuth]);

  const handleApple = useCallback(async () => {
    if (Platform.OS !== "ios") {
      Alert.alert("Unavailable", "Apple Sign-In is only available on iOS devices.");
      return;
    }
    setLoading(true);
    try {
      const { user, error } = await signInWithApple();
      if (user) {
        setAuth(user);
      } else if (error) {
        Alert.alert("Apple Sign-In Error", error);
      }
    } catch {}
    setLoading(false);
  }, [setAuth]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.heading }]}>
              Welcome back
            </Text>
            <Text style={[styles.subtitle, { color: colors.textTertiary }]}>
              Sign in to continue your journey
            </Text>
          </View>

          <View style={styles.form}>
            <View
              style={[
                styles.inputWrap,
                { borderColor: colors.border, backgroundColor: colors.card },
              ]}
            >
              <Icon
                name={LUCIDE_ICONS.mail}
                size={16}
                color={colors.textTertiary}
              />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Email"
                placeholderTextColor={colors.placeholder}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            <View
              style={[
                styles.inputWrap,
                { borderColor: colors.border, backgroundColor: colors.card },
              ]}
            >
              <Icon
                name={LUCIDE_ICONS.lock}
                size={16}
                color={colors.textTertiary}
              />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Password"
                placeholderTextColor={colors.placeholder}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Icon
                  name={showPassword ? LUCIDE_ICONS.eye : LUCIDE_ICONS.eyeOff}
                  size={16}
                  color={colors.textTertiary}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.loginBtn,
                { backgroundColor: colors.accent, opacity: loading ? 0.7 : 1 },
              ]}
              onPress={handleEmailLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.loginBtnText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>

          <SSOButtons
            theme={theme}
            onGooglePress={handleGoogle}
            onApplePress={Platform.OS === "ios" ? handleApple : undefined}
            loading={loading}
          />

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textTertiary }]}>
              Don't have an account?{" "}
            </Text>
            <TouchableOpacity onPress={onSwitchToSignup} disabled={loading}>
              <Text style={[styles.footerLink, { color: colors.accent }]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    ...TYPOGRAPHY.h1,
    fontSize: 28,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    marginTop: 6,
  },
  form: {
    gap: 14,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 50,
  },
  input: {
    flex: 1,
    ...TYPOGRAPHY.input,
  },
  loginBtn: {
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  loginBtnText: {
    ...TYPOGRAPHY.btn,
    color: "#fff",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  footerText: {
    ...TYPOGRAPHY.body,
  },
  footerLink: {
    ...TYPOGRAPHY.btn,
  },
});
