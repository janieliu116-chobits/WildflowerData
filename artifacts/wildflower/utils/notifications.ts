/**
 * expo-notifications throws at import time in Expo Go on Android (SDK 53+)
 * because remote push notifications were removed from the sandbox. We safely
 * require it at runtime and no-op every function when the module is absent,
 * so the rest of the app continues to load.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

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

/** AsyncStorage key for persisted notification settings. */
export const NOTIF_SETTINGS_KEY = 'wildflower_notif_settings';

/** AsyncStorage key tracking whether we have shown the first-reading prompt. */
export const NOTIF_PROMPTED_KEY = 'wildflower_notif_prompted';

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

/** Persist notification on/off + hour to AsyncStorage. */
export async function saveNotificationSettings(enabled: boolean, hour: number): Promise<void> {
  try {
    await AsyncStorage.setItem(NOTIF_SETTINGS_KEY, JSON.stringify({ enabled, hour, minute: 0 }));
  } catch (_) {}
}

/** Load persisted settings, defaulting to enabled at 18:00. */
export async function getNotificationSettings(): Promise<{ enabled: boolean; hour: number }> {
  try {
    const raw = await AsyncStorage.getItem(NOTIF_SETTINGS_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      return { enabled: s.enabled ?? true, hour: s.hour ?? 18 };
    }
  } catch (_) {}
  return { enabled: true, hour: 18 };
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
        // CALENDAR trigger fires at the exact clock time each day (HH:MM:00),
        // unlike DAILY which schedules relative intervals and can drift by minutes.
        type: Notifications.SchedulableTriggerInputTypes?.CALENDAR ?? 'calendar',
        repeats: true,
        hour,
        minute,
        second: 0,
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
