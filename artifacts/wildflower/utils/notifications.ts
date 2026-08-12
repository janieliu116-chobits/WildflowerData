import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const NOTIF_SETTINGS_KEY = '@wildflower_notification_settings';
export const NOTIF_PROMPTED_KEY = '@wildflower_notification_prompted';

const DEFAULT_NOTIF_SETTINGS = { enabled: true, hour: 18 };

// Persists the daily-reminder toggle + hour together as one JSON string.
// AsyncStorage requires a non-null string value -- passing null/undefined
// throws a native "bind value is null" crash, so this always serializes a
// well-formed object, never the raw `enabled`/`hour` args directly.
export async function saveNotificationSettings(enabled: boolean, hour: number): Promise<void> {
  try {
    const safeHour = Number.isFinite(hour) ? hour : DEFAULT_NOTIF_SETTINGS.hour;
    await AsyncStorage.setItem(
      NOTIF_SETTINGS_KEY,
      JSON.stringify({ enabled: !!enabled, hour: safeHour }),
    );
  } catch (_) {}
}

export async function getNotificationSettings(): Promise<{ enabled: boolean; hour: number }> {
  try {
    const raw = await AsyncStorage.getItem(NOTIF_SETTINGS_KEY);
    if (!raw) return DEFAULT_NOTIF_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      enabled: typeof parsed?.enabled === 'boolean' ? parsed.enabled : DEFAULT_NOTIF_SETTINGS.enabled,
      hour: typeof parsed?.hour === 'number' && Number.isFinite(parsed.hour) ? parsed.hour : DEFAULT_NOTIF_SETTINGS.hour,
    };
  } catch (_) {
    return DEFAULT_NOTIF_SETTINGS;
  }
}

/**
 * expo-notifications throws at import time in Expo Go on Android (SDK 53+)
 * because remote push notifications were removed from the sandbox. We safely
 * require it at runtime and no-op every function when the module is absent,
 * so the rest of the app continues to load.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Notifications: any = null;
try {
  // Dynamic require avoids the module-level crash in Expo Go on Android.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Notifications = require('expo-notifications');
} catch (_) {
  // Silently unavailable — all exported helpers below will be no-ops.
}

export const NOTIFICATION_MESSAGES = [
  'The stars have something to say. Come listen.',
  'Your daily reading is waiting for you.',
  'A moment of stillness can change everything.',
  'The universe is speaking \u2014 are you ready to hear it?',
  'Something is blooming. Look closer.',
  'Your intuition has been trying to reach you.',
  'The cards are ready whenever you are.',
  'A quiet moment with yourself is never wasted.',
  'The cosmos moves. So do you.',
  'You are the sky. Everything else is just weather.',
  'There is wisdom waiting in the silence.',
  'Trust the path even when you cannot see it fully.',
  'Your higher self is calling. Wildflower is here.',
  'Even the moon takes time to be full. So can you.',
  'Begin again. The present moment is always the right moment.',
];

const NOTIFICATIONS_ENABLED = true;

// Configure handler once if the module is available.
if (Notifications) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  } catch (_) {}
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!NOTIFICATIONS_ENABLED || Platform.OS === 'web' || !Notifications) return false;
  try {
    const existing = await Notifications.getPermissionsAsync();
    const granted = existing?.granted ?? existing?.status === 'granted';
    if (granted) return true;
    const result = await Notifications.requestPermissionsAsync();
    return result?.granted ?? result?.status === 'granted';
  } catch (_) {
    return false;
  }
}

export async function scheduleDailyNotification(hour: number, minute: number): Promise<void> {
  if (!NOTIFICATIONS_ENABLED || Platform.OS === 'web' || !Notifications) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Android 8.0+ silently drops notifications that aren't assigned to a
    // channel with sufficient importance -- no error is thrown, it just
    // never appears. This channel must exist before scheduling.
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('daily-reminder', {
        name: 'Daily reading reminder',
        importance: Notifications.AndroidImportance?.HIGH ?? 6,
      });
    }

    const body = NOTIFICATION_MESSAGES[Math.floor(Math.random() * NOTIFICATION_MESSAGES.length)];
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Wildflower \u2736', body },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes?.DAILY ?? 'daily',
        hour,
        minute,
        ...(Platform.OS === 'android' ? { channelId: 'daily-reminder' } : {}),
      },
    });
  } catch (_) {}
}

export async function cancelDailyNotification(): Promise<void> {
  if (!NOTIFICATIONS_ENABLED || Platform.OS === 'web' || !Notifications) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (_) {}
}