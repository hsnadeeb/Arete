import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Theme {
  name: "light" | "dark";
  colors: {
    // ── Backgrounds ──
    bg: string;
    bgSecondary: string;
    bgTertiary: string;
    surface: string;
    surfaceElevated: string;
    card: string;

    // ── Text ──
    text: string;
    textSecondary: string;
    textTertiary: string;
    textInverse: string;
    heading: string;

    // ── Accent / Brand ──
    accent: string;
    accentLight: string;
    accentBg: string;

    // ── Borders ──
    border: string;
    borderLight: string;
    divider: string;

    // ── Status ──
    success: string;
    successBg: string;
    warning: string;
    warningBg: string;
    error: string;
    errorBg: string;
    info: string;
    infoBg: string;

    // ── Misc ──
    muted: string;
    placeholder: string;
    disabled: string;
    overlay: string;
    shadow: string;

    // ── Navigation ──
    tabBar: string;
    tabBarInactive: string;
    headerBg: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    "2xl": number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
  typography: {
    fontFamily?: string;
    fontFamilyMono?: string;
    sizes: {
      xs: number;
      sm: number;
      base: number;
      lg: number;
      xl: number;
      "2xl": number;
      "3xl": number;
    };
  };
}

const SHARED_SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
};

const SHARED_BORDER_RADIUS = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

const SHARED_TYPOGRAPHY = {
  fontFamily: undefined as string | undefined,
  fontFamilyMono: undefined as string | undefined,
  sizes: {
    xs: 11,
    sm: 13,
    base: 15,
    lg: 17,
    xl: 20,
    "2xl": 24,
    "3xl": 30,
  },
};

const LIGHT_THEME: Theme = {
  name: "light",
  colors: {
    bg: "#f8fafc",
    bgSecondary: "#f1f5f9",
    bgTertiary: "#e2e8f0",
    surface: "#ffffff",
    surfaceElevated: "#ffffff",
    card: "#ffffff",
    text: "#1e293b",
    textSecondary: "#475569",
    textTertiary: "#64748b",
    textInverse: "#ffffff",
    heading: "#0f172a",
    accent: "#6366f1",
    accentLight: "#eef2ff",
    accentBg: "#eef2ff",
    border: "#e2e8f0",
    borderLight: "#f1f5f9",
    divider: "#f1f5f9",
    success: "#10b981",
    successBg: "#d1fae5",
    warning: "#f59e0b",
    warningBg: "#fef3c7",
    error: "#ef4444",
    errorBg: "#fef2f2",
    info: "#0ea5e9",
    infoBg: "#e0f2fe",
    muted: "#94a3b8",
    placeholder: "#cbd5e1",
    disabled: "#94a3b8",
    overlay: "rgba(0,0,0,0.4)",
    shadow: "#e2e8f0",
    tabBar: "#ffffff",
    tabBarInactive: "#94a3b8",
    headerBg: "#ffffff",
  },
  spacing: SHARED_SPACING,
  borderRadius: SHARED_BORDER_RADIUS,
  typography: SHARED_TYPOGRAPHY,
};

// const DARK_THEME: Theme = {
//   name: "dark",
//   colors: {
//     bg: "#0f172a",
//     bgSecondary: "#1e293b",
//     bgTertiary: "#334155",
//     surface: "#1e293b",
//     surfaceElevated: "#1e293b",
//     card: "#1e293b",
//     text: "#f1f5f9",
//     textSecondary: "#cbd5e1",
//     textTertiary: "#94a3b8",
//     textInverse: "#0f172a",
//     heading: "#f8fafc",
//     accent: "#818cf8",
//     accentLight: "#312e81",
//     accentBg: "#312e81",
//     border: "#334155",
//     borderLight: "#1e293b",
//     divider: "#1e293b",
//     success: "#34d399",
//     successBg: "#064e3b",
//     warning: "#fbbf24",
//     warningBg: "#78350f",
//     error: "#f87171",
//     errorBg: "#7f1d1d",
//     info: "#38bdf8",
//     infoBg: "#0c4a6e",
//     muted: "#64748b",
//     placeholder: "#475569",
//     disabled: "#475569",
//     overlay: "rgba(0,0,0,0.6)",
//     shadow: "#000",
//     tabBar: "#1e293b",
//     tabBarInactive: "#64748b",
//     headerBg: "#1e293b",
//   },
//   spacing: SHARED_SPACING,
//   borderRadius: SHARED_BORDER_RADIUS,
//   typography: SHARED_TYPOGRAPHY,
// };

const DARK_THEME: Theme = {
  name: "dark",
  colors: {
    // AMOLED backgrounds
    bg: "#050505",
    bgSecondary: "#0B0B0B",
    bgTertiary: "#121212",

    // Surfaces
    surface: "#111111",
    surfaceElevated: "#181818",
    card: "#151515",

    // Typography
    text: "#F5F5F5",
    textSecondary: "#C9C9C9",
    textTertiary: "#8C8C8C",
    textInverse: "#0A0A0A",
    heading: "#FFFFFF",

    // Brand Accent (slightly softer than default Indigo)
    // accent: "#7C8CFF",
    accent: "#7C8CFF",
    accentLight: "#262B4E",
    accentBg: "#1D2240",

    // Borders
    border: "#262626",
    borderLight: "#1B1B1B",
    divider: "#1A1A1A",

    // Semantic colors
    success: "#32D583",
    successBg: "#0D2B1F",

    warning: "#F5B942",
    warningBg: "#3A2A0B",

    error: "#F97066",
    errorBg: "#3A1111",

    info: "#5BB6FF",
    infoBg: "#0F2B45",

    // Misc
    muted: "#6B6B6B",
    placeholder: "#555555",
    disabled: "#3F3F3F",

    overlay: "rgba(0,0,0,0.72)",

    shadow: "#000000",

    tabBar: "#090909",
    tabBarInactive: "#707070",

    headerBg: "#090909",
  },

  spacing: SHARED_SPACING,
  borderRadius: SHARED_BORDER_RADIUS,
  typography: SHARED_TYPOGRAPHY,
};

interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  toggle: () => void;
  setTheme: (name: "light" | "dark") => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: LIGHT_THEME,
  isDark: false,
  toggle: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [themeName, setThemeName] = useState<"light" | "dark">(
    systemScheme === "dark" ? "dark" : "light",
  );

  useEffect(() => {
    AsyncStorage.getItem("theme").then((stored) => {
      if (stored === "light" || stored === "dark") {
        setThemeName(stored);
      }
    });
  }, []);

  const toggle = useCallback(() => {
    setThemeName((prev) => {
      const next = prev === "light" ? "dark" : "light";
      AsyncStorage.setItem("theme", next);
      return next;
    });
  }, []);

  const setTheme = useCallback((name: "light" | "dark") => {
    setThemeName(name);
    AsyncStorage.setItem("theme", name);
  }, []);

  const theme = themeName === "dark" ? DARK_THEME : LIGHT_THEME;

  return (
    <ThemeContext.Provider
      value={{ theme, isDark: themeName === "dark", toggle, setTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

export { LIGHT_THEME, DARK_THEME };
