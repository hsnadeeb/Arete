import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  TextInput,
  useWindowDimensions,
} from "react-native";
import { Icon } from "../../components/Icons";
import { LUCIDE_ICONS, TYPOGRAPHY } from "../../constants/typography";
import { useTheme } from "../../context/ThemeContext";

/* ==================== OnboardingProgress ==================== */
export function OnboardingProgress({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  const { theme } = useTheme();
  const tc = theme.colors;

  const progress = (currentStep + 1) / totalSteps;

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressBarContainer}>
        <Animated.View
          style={[
            styles.progressBar,
            { backgroundColor: tc.accent },
            { width: `${progress * 100}%` },
          ]}
        />
      </View>
      <View style={styles.stepIndicators}>
        {Array.from({ length: totalSteps }, (_, i) => (
          <View
            key={i}
            style={[
              styles.stepDot,
              i <= currentStep
                ? { backgroundColor: tc.accent, width: 10, height: 10 }
                : { backgroundColor: tc.border, width: 8, height: 8 },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

/* ==================== OnboardingButton ==================== */
export interface OnboardingButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline";
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  children?: React.ReactNode;
}

export function OnboardingButton({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  icon,
  iconPosition = "right",
}: OnboardingButtonProps) {
  const { theme } = useTheme();
  const tc = theme.colors;

  const isPrimary = variant === "primary";
  const isSecondary = variant === "secondary";
  const isOutline = variant === "outline";

  const bgColor = isPrimary
    ? disabled
      ? tc.accent + "80"
      : tc.accent
    : isSecondary
    ? disabled
      ? tc.surface + "80"
      : tc.surface
    : "transparent";

  const borderColor = isOutline ? tc.border : "transparent";
  const textColor = isPrimary
    ? "#fff"
    : isSecondary
    ? tc.text
    : isOutline
    ? tc.accent
    : tc.textSecondary;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: bgColor,
          borderColor,
          opacity: disabled || loading ? 0.7 : 1,
        },
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <View style={styles.loaderContainer}>
          <View style={styles.loader} />
        </View>
      ) : (
        <View style={styles.buttonContent}>
          {icon && iconPosition === "left" && <View style={styles.iconLeft}>{icon}</View>}
          <Text style={[styles.buttonText, { color: textColor }]}>{title}</Text>
          {icon && iconPosition === "right" && <View style={styles.iconRight}>{icon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
}

/* ==================== OnboardingLayout ==================== */
export interface OnboardingLayoutProps {
  children: React.ReactNode;
  step: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  nextLabel?: string;
  onNext: () => void;
  onBack: () => void;
  nextDisabled?: boolean;
  backLabel?: string;
  showProgress?: boolean;
  scrollable?: boolean;
}

export function OnboardingLayout({
  children,
  step,
  totalSteps,
  title,
  subtitle,
  nextLabel = "Continue",
  onNext,
  onBack,
  nextDisabled = false,
  backLabel = "Back",
  showProgress = true,
  scrollable = false,
}: OnboardingLayoutProps) {
  const { theme } = useTheme();
  const tc = theme.colors;
  const { height } = useWindowDimensions();

  // Build form content
  const formContent = (
    <View style={styles.formContent}>
      {showProgress && (
        <OnboardingProgress currentStep={step} totalSteps={totalSteps} />
      )}
      <View style={styles.header}>
        <Text style={[styles.title, { color: tc.text }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: tc.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );

  // Buttons - always fixed at bottom
  const buttons = (
    <View style={styles.buttonsContainer}>
      <View style={styles.buttonRow}>
        <OnboardingButton
          title={backLabel}
          onPress={onBack}
          variant="outline"
          icon={
            <Icon name={LUCIDE_ICONS.chevronLeft} size={20} color={tc.accent} />
          }
          iconPosition="left"
        />
        <OnboardingButton
          title={nextLabel}
          onPress={onNext}
          variant="primary"
          disabled={nextDisabled}
          icon={
            <Icon name={LUCIDE_ICONS.chevronRight} size={20} color="#fff" />
          }
          iconPosition="right"
        />
      </View>
    </View>
  );

  // Fixed layout - content flexes, buttons at bottom
  if (!scrollable) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]}>
        <View style={styles.fixedContainer}>
          <View style={styles.flexContent}>{formContent}</View>
          {buttons}
        </View>
      </SafeAreaView>
    );
  }

  // Scrollable layout - content scrolls, buttons fixed at bottom (outside scroll)
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardContainer}
        keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
      >
        <View style={styles.fixedContainer}>
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContent,
              { minHeight: height * 0.6 },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            {formContent}
          </ScrollView>
          {buttons}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ==================== OnboardingIcon ==================== */
export interface OnboardingIconProps {
  name: keyof typeof LUCIDE_ICONS;
  size?: number;
  variant?: "primary" | "secondary" | "outline" | "accent";
  backgroundColor?: string;
  color?: string;
  containerStyle?: any;
}

export function OnboardingIcon({
  name,
  size = 24,
  variant = "primary",
  backgroundColor,
  color,
  containerStyle,
}: OnboardingIconProps) {
  const { theme } = useTheme();
  const tc = theme.colors;

  const variantStyles: Record<string, { bg: string; color: string }> = {
    primary: { bg: tc.accentBg, color: tc.accent },
    secondary: { bg: tc.surface, color: tc.textSecondary },
    outline: { bg: "transparent", color: tc.accent },
    accent: { bg: tc.accent, color: "#fff" },
  };

  const { bg, color: variantColor } = variantStyles[variant];

  return (
    <View
      style={[
        styles.iconContainer,
        { backgroundColor: backgroundColor || bg },
        containerStyle,
      ]}
    >
      <Icon name={LUCIDE_ICONS[name]} size={size} color={color || variantColor} />
    </View>
  );
}

/* ==================== AnimatedSelectionCard ==================== */
export interface AnimatedSelectionCardProps {
  selected: boolean;
  onPress: () => void;
  anim: Animated.Value;
  index: number;
  variant?: "primary" | "accent";
  children: React.ReactNode;
}

export function AnimatedSelectionCard({
  selected,
  onPress,
  anim,
  index,
  variant = "primary",
  children,
}: AnimatedSelectionCardProps) {
  const { theme } = useTheme();
  const tc = theme.colors;

  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
  });
  const opacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [30, 0],
  });

  const accentColor = tc.accent;

  return (
    <Animated.View
      style={{
        transform: [{ scale }, { translateY }],
        opacity,
      }}
    >
      <TouchableOpacity
        style={[
          styles.selectionCard,
          {
            backgroundColor: selected ? accentColor + "10" : tc.surface,
            borderColor: selected ? accentColor : tc.border,
            borderWidth: selected ? 2 : 1,
          },
        ]}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <View style={styles.selectionCardContent}>{children}</View>
        {selected && (
          <View style={[styles.selectionBadge, { backgroundColor: accentColor }]}>
            <Icon name={LUCIDE_ICONS.check} size={14} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

/* ==================== OnboardingInput ==================== */
export interface OnboardingInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onSubmitEditing?: () => void;
  keyboardType?: "default" | "number-pad" | "decimal-pad" | "email-address";
  maxLength?: number;
  autoFocus?: boolean;
  error?: string;
  helperText?: string;
  secureTextEntry?: boolean;
  textAlign?: "left" | "center" | "right";
  fontSize?: number;
  ref?: React.RefObject<TextInput | null>;
}

export function OnboardingInput({
  value,
  onChangeText,
  placeholder,
  onSubmitEditing,
  keyboardType = "default",
  maxLength,
  autoFocus = false,
  error,
  helperText,
  secureTextEntry = false,
  textAlign = "center",
  fontSize = 24,
  ref: forwardedRef,
}: OnboardingInputProps) {
  const { theme } = useTheme();
  const tc = theme.colors;
  const [focused, setFocused] = useState(false);
  const localRef = useRef<TextInput>(null);
  const ref = forwardedRef || localRef;

  const hasError = Boolean(error);

  return (
    <View style={styles.inputWrapper}>
      <TextInput
        ref={ref}
        style={[
          styles.input,
          {
            backgroundColor: tc.surface,
            borderColor: hasError ? tc.error : focused ? tc.accent : tc.border,
            color: tc.text,
            borderWidth: focused ? 2 : 1,
            textAlign,
            fontSize,
          },
        ]}
        placeholder={placeholder}
        placeholderTextColor={tc.placeholder}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onSubmitEditing={onSubmitEditing}
        keyboardType={keyboardType}
        maxLength={maxLength}
        autoFocus={autoFocus}
        secureTextEntry={secureTextEntry}
        returnKeyType="next"
        autoCapitalize="words"
        autoCorrect={false}
      />

      {helperText && (
        <View style={styles.helperWrapper}>
          <Text
            style={[
              styles.helperText,
              { color: hasError ? tc.error : tc.textTertiary },
            ]}
          >
            {error || helperText}
          </Text>
        </View>
      )}
    </View>
  );
}

/* ==================== STYLES ==================== */
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fixedContainer: {
    flex: 1,
    justifyContent: "space-between",
  },
  flexContent: {
    flex: 1,
    minHeight: 0,
  },
  keyboardContainer: {
    flex: 1,
  },

  // Form Content
  formContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 0,
  },

  // Progress
  progressContainer: {
    marginBottom: 28,
    gap: 12,
  },
  progressBarContainer: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 3,
  },
  stepIndicators: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },

  // Header
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.4,
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    paddingHorizontal: 12,
  },

  // Body
  body: {
    flex: 1,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },

  // Buttons - fixed at bottom
  buttonsContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: "#F8FAFC",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
  },
  button: {
    flex: 1,
    minHeight: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    ...TYPOGRAPHY.h4,
    fontWeight: "600",
  },
  iconLeft: {
    marginRight: 6,
  },
  iconRight: {
    marginLeft: 6,
  },
  loaderContainer: {
    width: 24,
    height: 24,
  },
  loader: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2.5,
    borderColor: "#fff",
    borderTopColor: "transparent",
  },

  // Icon
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },

  // Selection Card
  selectionCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  selectionCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  selectionBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  // Input
  inputWrapper: {
    width: "100%",
  },
  input: {
    fontSize: 24,
    fontWeight: "500",
    padding: 20,
    borderRadius: 16,
    textAlign: "center",
    letterSpacing: 0.2,
    width: "100%",
    minWidth: 280,
  },
  helperWrapper: {
    marginTop: 8,
    alignItems: "center",
  },
  helperText: {
    ...TYPOGRAPHY.captionSm,
  },
});