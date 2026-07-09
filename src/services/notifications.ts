import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface ScheduledNotification {
  id: string;
  type: "prayer" | "habit" | "daily";
  title: string;
  body: string;
  hour: number;
  minute: number;
  days?: number[]; // 0=Sun..6=Sat
  enabled: boolean;
}

const DEFAULT_NOTIFICATIONS: ScheduledNotification[] = [
  {
    id: "fajr",
    type: "prayer",
    title: "🕌 Fajr Time",
    body: "It's time for Fajr prayer. Rise and shine!",
    hour: 5, minute: 0,
    days: [0, 1, 2, 3, 4, 5, 6],
    enabled: true,
  },
  {
    id: "dhuhr",
    type: "prayer",
    title: "🕌 Dhuhr Time",
    body: "Time for Dhuhr prayer. Take a break.",
    hour: 12, minute: 30,
    days: [0, 1, 2, 3, 4, 5, 6],
    enabled: true,
  },
  {
    id: "asr",
    type: "prayer",
    title: "🕌 Asr Time",
    body: "Asr prayer time. Stay on track!",
    hour: 15, minute: 30,
    days: [0, 1, 2, 3, 4, 5, 6],
    enabled: true,
  },
  {
    id: "maghrib",
    type: "prayer",
    title: "🕌 Maghrib Time",
    body: "Maghrib prayer. Sunset reminder.",
    hour: 18, minute: 15,
    days: [0, 1, 2, 3, 4, 5, 6],
    enabled: true,
  },
  {
    id: "isha",
    type: "prayer",
    title: "🕌 Isha Time",
    body: "Isha prayer. End the day with devotion.",
    hour: 19, minute: 45,
    days: [0, 1, 2, 3, 4, 5, 6],
    enabled: true,
  },
  {
    id: "habit_reminder",
    type: "habit",
    title: "✅ Habit Check",
    body: "Have you logged your habits today? Don't break the streak!",
    hour: 20, minute: 0,
    days: [0, 1, 2, 3, 4, 5, 6],
    enabled: true,
  },
  {
    id: "daily_prompt",
    type: "daily",
    title: "📝 Daily Reflection",
    body: "Take 5 minutes to journal your thoughts and review your day.",
    hour: 21, minute: 0,
    days: [0, 1, 2, 3, 4, 5, 6],
    enabled: true,
  },
];

// ─── Request permissions ───

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

// ─── Configure handler ───

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── Schedule / Cancel ───

export async function scheduleNotification(
  notif: ScheduledNotification
): Promise<void> {
  const days = notif.days ?? [0, 1, 2, 3, 4, 5, 6];
  for (const d of days) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notif.title,
          body: notif.body,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: { type: notif.type, id: notif.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          hour: notif.hour,
          minute: notif.minute,
          weekday: d + 1, // expo uses 1=Sun..7=Sat
        },
      });
    } catch (e) {
      console.warn("Failed to schedule:", notif.id, "day", d, e);
    }
  }
}

export async function cancelNotification(id: string) {
  await Notifications.cancelScheduledNotificationAsync(id);
}

export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function getAllScheduled(): Promise<ScheduledNotification[]> {
  try {
    const raw = await AsyncStorage.getItem("scheduled_notifications");
    return raw ? JSON.parse(raw) : DEFAULT_NOTIFICATIONS;
  } catch {
    return DEFAULT_NOTIFICATIONS;
  }
}

export async function saveSchedule(
  notifs: ScheduledNotification[]
): Promise<void> {
  await AsyncStorage.setItem(
    "scheduled_notifications",
    JSON.stringify(notifs)
  );
}

// ─── Apply schedule (cancel all + reschedule enabled) ───

export async function applySchedule(
  notifs?: ScheduledNotification[]
): Promise<void> {
  const granted = await requestNotificationPermissions();
  if (!granted) return;

  await cancelAllNotifications();

  const list = notifs ?? (await getAllScheduled());
  const enabled = list.filter((n) => n.enabled);
  for (const n of enabled) {
    await scheduleNotification(n);
  }
}

// ─── Initialize on startup ───

export async function initNotifications(): Promise<void> {
  const saved = await getAllScheduled();
  await applySchedule(saved);
}

// ─── Group helpers for UI ───

export interface NotifGroup {
  type: "prayer" | "habit" | "daily";
  label: string;
  icon: string;
  notifications: ScheduledNotification[];
  enabled: boolean;
}

export function getNotificationGroups(
  notifs: ScheduledNotification[]
): NotifGroup[] {
  const prayer = notifs.filter((n) => n.type === "prayer");
  const habit = notifs.filter((n) => n.type === "habit");
  const daily = notifs.filter((n) => n.type === "daily");
  return [
    {
      type: "prayer",
      label: "Prayer Times",
      icon: "🕌",
      notifications: prayer,
      enabled: prayer.some((n) => n.enabled),
    },
    {
      type: "habit",
      label: "Habit Reminders",
      icon: "✅",
      notifications: habit,
      enabled: habit.some((n) => n.enabled),
    },
    {
      type: "daily",
      label: "Daily Reflection",
      icon: "📝",
      notifications: daily,
      enabled: daily.some((n) => n.enabled),
    },
  ];
}
