import * as Location from "expo-location";
import { Platform } from "react-native";

// ─── Types ───

export type TimeOfDay = "night" | "dawn" | "morning" | "afternoon" | "evening";
export type WeatherType = "sunny" | "cloudy" | "rainy" | "foggy" | "stormy" | "snowy";

export interface SceneConditions {
  timeOfDay: TimeOfDay;
  weather: WeatherType;
  weatherCode: number;
  temperature: number;
  isDay: boolean;
  hour: number;
  cloudCover: number; // 0-1 based on weather code
  rainIntensity: number; // 0-1
}

// ─── WMO Weather Code → our types ───

function weatherCodeToType(code: number): { weather: WeatherType; cloudCover: number; rainIntensity: number } {
  if (code === 0) return { weather: "sunny", cloudCover: 0, rainIntensity: 0 };
  if (code <= 1) return { weather: "sunny", cloudCover: 0.1, rainIntensity: 0 };
  if (code === 2) return { weather: "cloudy", cloudCover: 0.4, rainIntensity: 0 };
  if (code === 3) return { weather: "cloudy", cloudCover: 0.8, rainIntensity: 0 };
  if (code >= 45 && code <= 48) return { weather: "foggy", cloudCover: 0.9, rainIntensity: 0 };
  if ((code >= 51 && code <= 55) || (code >= 80 && code <= 82))
    return { weather: "rainy", cloudCover: 0.7, rainIntensity: 0.3 + (code % 10) * 0.1 };
  if ((code >= 61 && code <= 65) || (code >= 56 && code <= 57))
    return { weather: "rainy", cloudCover: 0.85, rainIntensity: 0.5 + (code % 10) * 0.1 };
  if (code >= 71 && code <= 77) return { weather: "snowy", cloudCover: 0.9, rainIntensity: 0 };
  if (code >= 95 && code <= 99) return { weather: "stormy", cloudCover: 1, rainIntensity: 1 };
  return { weather: "cloudy", cloudCover: 0.5, rainIntensity: 0 };
}

function hourToTimeOfDay(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 7) return "dawn";
  if (hour >= 7 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 20) return "evening";
  return "night";
}

// ─── Caching ───

let cached: { data: SceneConditions; at: number } | null = null;
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

// ─── Open-Meteo fetch ───

async function fetchFromOpenMeteo(lat: number, lng: number): Promise<SceneConditions> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=weather_code,temperature_2m,is_day&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo returned ${res.status}`);
  const json = await res.json();
  const current = json.current;
  const code = current.weather_code;
  const { weather, cloudCover, rainIntensity } = weatherCodeToType(code);
  const now = new Date();
  const hour = now.getHours();
  return {
    timeOfDay: hourToTimeOfDay(hour),
    weather,
    weatherCode: code,
    temperature: current.temperature_2m,
    isDay: current.is_day === 1,
    hour,
    cloudCover,
    rainIntensity,
  };
}

// ─── Public API ───

export async function getCurrentConditions(): Promise<SceneConditions> {
  if (cached && Date.now() - cached.at < CACHE_TTL) {
    return cached.data;
  }

  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      return getFallback();
    }
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
    const conditions = await fetchFromOpenMeteo(loc.coords.latitude, loc.coords.longitude);
    cached = { data: conditions, at: Date.now() };
    return conditions;
  } catch {
    const fallback = getFallback();
    cached = { data: fallback, at: Date.now() };
    return fallback;
  }
}

export function getFallback(): SceneConditions {
  const now = new Date();
  const hour = now.getHours();
  return {
    timeOfDay: hourToTimeOfDay(hour),
    weather: "cloudy",
    weatherCode: 2,
    temperature: 20,
    isDay: hour >= 6 && hour < 20,
    hour,
    cloudCover: 0.4,
    rainIntensity: 0,
  };
}

export function clearWeatherCache(): void {
  cached = null;
}
