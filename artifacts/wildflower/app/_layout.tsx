import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Font from 'expo-font';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  SourceSerif4_400Regular,
  SourceSerif4_600SemiBold,
  SourceSerif4_700Bold,
} from '@expo-google-fonts/source-serif-4';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { ProfileProvider } from '@/contexts/ProfileContext';
import { AudioProvider } from '@/contexts/AudioContext';
import { ReadingCountProvider } from '@/contexts/ReadingCountContext';
import { initializeAdsSdk } from '@/utils/ads';
import { getNotificationSettings, scheduleDailyNotification } from '@/utils/notifications';

SplashScreen.preventAutoHideAsync();

// Fire-and-forget: initializes the Google Mobile Ads SDK once at startup
// (no-ops in Expo Go, see utils/ads.ts) so it's ready before the Ask tab's
// first interstitial is requested.
initializeAdsSdk();

const queryClient = new QueryClient();

const FONT_MAP = {
  ...Ionicons.font,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  SourceSerif4_400Regular,
  SourceSerif4_600SemiBold,
  SourceSerif4_700Bold,
};

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: 'Back' }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Font.loadAsync (and the Ionicons glyph font specifically) can fail to
    // download over Expo Go's tunneled dev connection — a known SDK 54 flake
    // — which otherwise silently leaves icons as tofu boxes for the rest of
    // the session. Retry with backoff instead of accepting the first failure.
    async function loadFontsWithRetry(maxAttempts = 4) {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          await Font.loadAsync(FONT_MAP);
          if (!cancelled) setFontsReady(true);
          return;
        } catch (err) {
          console.warn(`[fonts] load attempt ${attempt}/${maxAttempts} failed:`, err);
          if (attempt < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, attempt * 800));
          }
        }
      }
      // Give up after exhausting retries — proceed without blocking the app
      // forever, even though some glyphs may still render as tofu.
      if (!cancelled) setFontsReady(true);
    }

    loadFontsWithRetry();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (fontsReady) {
      SplashScreen.hideAsync();
      // Re-schedule the daily notification on every app launch.
      // Android clears scheduled notifications when the app is killed,
      // so we must re-register each time the app starts.
      getNotificationSettings().then(({ enabled, hour }) => {
        if (enabled) {
          scheduleDailyNotification(hour, 0);
        }
      }).catch(() => {});
    }
  }, [fontsReady]);

  if (!fontsReady) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <ProfileProvider>
                <ReadingCountProvider>
                  <AudioProvider>
                    <RootLayoutNav />
                  </AudioProvider>
                </ReadingCountProvider>
              </ProfileProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
