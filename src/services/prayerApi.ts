/**
 * Prayer Timings & Islamic Calendar API Service
 * Uses aladhan.com API with Shia Ithna-Ashari (Jafari) method
 */

const API_BASE = 'https://api.aladhan.com/v1';
// Method 0 = Shia Ithna-Ashari (Jafari)
const SHIA_METHOD = 0;
// Default location (can be made configurable later)
const DEFAULT_CITY = 'Mumbai';
const DEFAULT_COUNTRY = 'India';

export interface PrayerApiResponse {
  timings: {
    Fajr: string;
    Sunrise: string;
    Dhuhr: string;
    Asr: string;
    Maghrib: string;
    Isha: string;
    [key: string]: string;
  };
  date: {
    readable: string;
    timestamp: string;
    gregorian: {
      date: string;
      format: string;
      day: string;
      weekday: { en: string };
      month: { number: number; en: string };
      year: string;
      designation: { abbreviated: string; expanded: string };
    };
    hijri: {
      date: string;
      format: string;
      day: string;
      weekday: { en: string; ar: string };
      month: { number: number; en: string; ar: string };
      year: string;
      designation: { abbreviated: string; expanded: string };
      holidays: string[];
    };
  };
  meta: {
    latitude: number;
    longitude: number;
    timezone: string;
    method: { id: number; name: string };
    latitudeAdjustmentMethod: string;
    midnightMode: string;
    school: string;
    offset: Record<string, number>;
  };
}

/**
 * Fetch prayer timings for a given date, city, and country
 * Uses Shia Ithna-Ashari method
 */
export async function fetchPrayerTimings(
  date: string = new Date().toISOString().split('T')[0],
  city: string = DEFAULT_CITY,
  country: string = DEFAULT_COUNTRY
): Promise<PrayerApiResponse | null> {
  try {
    const url = `${API_BASE}/timingsByCity/${date}?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=${SHIA_METHOD}`;
    const response = await fetch(url, { method: 'GET' });
    if (!response.ok) {
      console.warn(`Prayer API returned ${response.status}`);
      return null;
    }
    const json = await response.json();
    if (json.code !== 200 || !json.data) {
      console.warn('Prayer API returned unexpected response', json.code);
      return null;
    }
    return json.data as PrayerApiResponse;
  } catch (error) {
    console.warn('Failed to fetch prayer timings:', error);
    return null;
  }
}

/**
 * Extract prayer timings from API response into a flat object
 */
export function extractTimings(data: PrayerApiResponse): {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  hijri_date: string;
  hijri_month: string;
  hijri_year: string;
  gregorian_date: string;
  day_of_week: string;
} {
  // API returns times in 12h format (hh:mm AM/PM), convert to 24h
  const to24h = (timeStr: string): string => {
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return timeStr; // already 24h
    let h = parseInt(match[1], 10);
    const m = match[2];
    const ampm = match[3].toUpperCase();
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return `${h.toString().padStart(2, '0')}:${m}`;
  };

  return {
    fajr: to24h(data.timings.Fajr),
    sunrise: to24h(data.timings.Sunrise),
    dhuhr: to24h(data.timings.Dhuhr),
    asr: to24h(data.timings.Asr),
    maghrib: to24h(data.timings.Maghrib),
    isha: to24h(data.timings.Isha),
    hijri_date: data.date.hijri.day,
    hijri_month: data.date.hijri.month.en,
    hijri_year: data.date.hijri.year,
    gregorian_date: data.date.gregorian.date,
    day_of_week: data.date.gregorian.weekday.en,
  };
}

/**
 * Get Islamic greeting based on time of day
 */
export function getIslamicGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Assalamu Alaykum';
  if (h < 18) return 'Assalamu Alaykum';
  return 'Assalamu Alaykum';
}

/**
 * Get today's Islamic date info
 */
export function getIslamicDateInfo(data: PrayerApiResponse): {
  hijriDate: string;
  hijriMonth: string;
  hijriYear: string;
  gregorianDate: string;
  dayOfWeek: string;
} {
  return {
    hijriDate: data.date.hijri.day,
    hijriMonth: data.date.hijri.month.en,
    hijriYear: data.date.hijri.year,
    gregorianDate: data.date.gregorian.date,
    dayOfWeek: data.date.gregorian.weekday.en,
  };
}

export const ARABIC_MONTHS = [
  'Muharram',
  'Safar',
  'Rabi\' al-Awwal',
  'Rabi\' al-Thani',
  'Jumada al-Awwal',
  'Jumada al-Thani',
  'Rajab',
  'Sha\'ban',
  'Ramadan',
  'Shawwal',
  'Dhu al-Qi\'dah',
  'Dhu al-Hijjah',
];

export const ARABIC_DAY_NAMES = [
  'Al-Ahad',
  'Al-Ithnayn',
  'Ath-Thulatha',
  'Al-Arba\'a',
  'Al-Khamis',
  'Al-Jumu\'ah',
  'As-Sabt',
];
