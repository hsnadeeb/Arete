import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { TYPOGRAPHY } from "../../constants/typography";
import type { TimeOfDay, WeatherType, SceneConditions } from "../../services/weather";
import { getFallback } from "../../services/weather";

const TIMES: TimeOfDay[] = ["night", "dawn", "morning", "afternoon", "evening"];
const WEATHERS: WeatherType[] = ["sunny", "cloudy", "rainy", "foggy", "stormy", "snowy"];

const TIME_LABELS: Record<TimeOfDay, string> = {
  night: "🌙 Night",
  dawn: "🌅 Dawn",
  morning: "☀️ Morning",
  afternoon: "⛅ Afternoon",
  evening: "🌇 Evening",
};

const WEATHER_LABELS: Record<WeatherType, string> = {
  sunny: "☀️ Sunny",
  cloudy: "☁️ Cloudy",
  rainy: "🌧️ Rainy",
  foggy: "🌫️ Foggy",
  stormy: "⛈️ Stormy",
  snowy: "❄️ Snowy",
};

const WEATHER_CLOUD_COVER: Record<WeatherType, number> = {
  sunny: 0,
  cloudy: 0.6,
  rainy: 0.85,
  foggy: 0.9,
  stormy: 1,
  snowy: 0.9,
};

const WEATHER_RAIN_INTENSITY: Record<WeatherType, number> = {
  sunny: 0,
  cloudy: 0,
  rainy: 0.6,
  foggy: 0,
  stormy: 1,
  snowy: 0,
};

interface SceneDebugPanelProps {
  visible: boolean;
  onToggle: () => void;
  selectedTime: TimeOfDay | null;
  selectedWeather: WeatherType | null;
  onSelectTime: (time: TimeOfDay | null) => void;
  onSelectWeather: (weather: WeatherType | null) => void;
}

export function SceneDebugPanel({
  visible,
  onToggle,
  selectedTime,
  selectedWeather,
  onSelectTime,
  onSelectWeather,
}: SceneDebugPanelProps) {
  return (
    <>
      {/* Toggle button */}
      <TouchableOpacity style={s.toggleBtn} onPress={onToggle} activeOpacity={0.7}>
        <Text style={s.toggleIcon}>{visible ? "✕" : "🎨"}</Text>
      </TouchableOpacity>

      {visible && (
        <View style={s.panel}>
          <Text style={s.title}>Scene Preview</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={s.sectionLabel}>Time of Day</Text>
            <View style={s.row}>
              {TIMES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    s.chip,
                    selectedTime === t && s.chipActive,
                  ]}
                  onPress={() => onSelectTime(selectedTime === t ? null : t)}
                >
                  <Text style={[s.chipText, selectedTime === t && s.chipTextActive]}>
                    {TIME_LABELS[t]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.sectionLabel}>Weather</Text>
            <View style={s.row}>
              {WEATHERS.map((w) => (
                <TouchableOpacity
                  key={w}
                  style={[
                    s.chip,
                    selectedWeather === w && s.chipActive,
                  ]}
                  onPress={() => onSelectWeather(selectedWeather === w ? null : w)}
                >
                  <Text style={[s.chipText, selectedWeather === w && s.chipTextActive]}>
                    {WEATHER_LABELS[w]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={s.resetBtn}
              onPress={() => {
                onSelectTime(null);
                onSelectWeather(null);
              }}
            >
              <Text style={s.resetText}>↺ Auto (real-time)</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}
    </>
  );
}

/** Build a SceneConditions override from manually selected time/weather */
export function buildOverrideConditions(
  time: TimeOfDay | null,
  weather: WeatherType | null,
): SceneConditions | null {
  if (!time && !weather) return null;
  const fallback = getFallback();
  return {
    timeOfDay: time ?? fallback.timeOfDay,
    weather: weather ?? fallback.weather,
    weatherCode: weather ? 2 : fallback.weatherCode,
    temperature: fallback.temperature,
    isDay: time ? !["night", "dawn", "evening"].includes(time) : fallback.isDay,
    hour: time
      ? ({ night: 2, dawn: 6, morning: 9, afternoon: 14, evening: 18 } as const)[time]
      : fallback.hour,
    cloudCover: weather ? WEATHER_CLOUD_COVER[weather] : fallback.cloudCover,
    rainIntensity: weather ? WEATHER_RAIN_INTENSITY[weather] : fallback.rainIntensity,
  };
}

const s = StyleSheet.create({
  toggleBtn: {
    position: "absolute",
    bottom: 20,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1e293b",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  toggleIcon: {
    fontSize: 20,
  },
  panel: {
    position: "absolute",
    bottom: 72,
    right: 16,
    width: 220,
    maxHeight: 340,
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 14,
    zIndex: 99,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    ...TYPOGRAPHY.label,
    color: "#f1f5f9",
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
  },
  sectionLabel: {
    ...TYPOGRAPHY.captionSm,
    color: "#94a3b8",
    marginBottom: 6,
    marginTop: 4,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: "#334155",
  },
  chipActive: {
    backgroundColor: "#3b82f6",
  },
  chipText: {
    ...TYPOGRAPHY.captionSm,
    color: "#cbd5e1",
  },
  chipTextActive: {
    color: "#ffffff",
    fontWeight: "600",
  },
  resetBtn: {
    alignSelf: "center",
    marginTop: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#475569",
  },
  resetText: {
    ...TYPOGRAPHY.captionSm,
    color: "#e2e8f0",
    fontWeight: "600",
  },
});
