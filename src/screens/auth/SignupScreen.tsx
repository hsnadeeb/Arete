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
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { Icon } from "../../components/Icons";
import { LUCIDE_ICONS, TYPOGRAPHY } from "../../constants/typography";
import { useStore } from "../../store";
import {
  signUpWithEmail,
  signInWithGoogle,
  signInWithApple,
} from "../../services/auth";
import { SSOButtons } from "./SSOButtons";

interface SignupScreenProps {
  onSwitchToLogin: () => void;
}

export default function SignupScreen({ onSwitchToLogin }: SignupScreenProps) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const setAuth = useStore((s) => s.setAuth);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = useCallback(async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Validation", "Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Validation", "Passwords do not match");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Validation", "Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const user = await signUpWithEmail(name.trim(), email.trim(), password);
      if (user) {
        setAuth(user);
      } else {
        Alert.alert("Error", "Email sign-up needs a backend. Use Google or Apple SSO for now.");
      }
    } catch {
      Alert.alert("Error", "Something went wrong. Please try again.");
    }
    setLoading(false);
  }, [name, email, password, confirmPassword, setAuth]);

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
    if (Platform.OS !== "ios") return;
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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.heading }]}>
              Create account
            </Text>
            <Text style={[styles.subtitle, { color: colors.textTertiary }]}>
              Start living with intention
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
                name={LUCIDE_ICONS.user}
                size={16}
                color={colors.textTertiary}
              />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Full name"
                placeholderTextColor={colors.placeholder}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
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
                placeholder="Confirm password"
                placeholderTextColor={colors.placeholder}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.signupBtn,
                { backgroundColor: colors.accent, opacity: loading ? 0.7 : 1 },
              ]}
              onPress={handleSignup}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.signupBtnText}>Create Account</Text>
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
              Already have an account?{" "}
            </Text>
            <TouchableOpacity onPress={onSwitchToLogin} disabled={loading}>
              <Text style={[styles.footerLink, { color: colors.accent }]}>
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
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
  signupBtn: {
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  signupBtnText: {
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
