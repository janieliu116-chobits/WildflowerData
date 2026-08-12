import Constants, { ExecutionEnvironment } from 'expo-constants';

// react-native-google-mobile-ads requires native code that Expo Go doesn't
// ship with. Replit's live-preview workflow (`pnpm dev`) runs inside Expo
// Go, so any real ad SDK call there throws instead of loading -- this flag
// lets ad-related code skip straight to its fallback behavior in that case,
// and only exercise the real SDK in EAS development/preview/production
// builds, which do include the native module.
export const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Interstitial shown before an Ask reading unlocks. Google's official test
// ID is used automatically in dev builds. NOTE: __DEV__ is only true when
// the JS is running against a connected Metro dev server -- EAS `preview`
// and `production` builds bundle in release mode, so __DEV__ is FALSE there
// too. That means installing a preview/production build normally requests
// REAL ads. To test safely on a real device without risking your AdMob
// account being flagged for invalid traffic, register the device as a test
// device below instead of relying on __DEV__ alone.
// Real interstitial ad unit, created in the AdMob console for this app.
const PRODUCTION_INTERSTITIAL_AD_UNIT_ID = 'ca-app-pub-6480013765291060/5652033492';

// Add your device's test ID here after checking `adb logcat` (or Play
// Console) for a line like:
//   "Use RequestConfiguration.Builder.setTestDeviceIds(Arrays.asList(...))
//    to get test ads on this device."
// This makes AdMob serve guaranteed test ads to these specific devices even
// in preview/production builds, without touching the real ad unit's traffic.
const TEST_DEVICE_IDS: string[] = [
  // 'PASTE_YOUR_DEVICE_TEST_ID_HERE',
];

export function getInterstitialAdUnitId(): string {
  if (__DEV__) {
    // Lazy require so this file can be imported even in Expo Go without
    // touching the native module at all.
    const { TestIds } = require('react-native-google-mobile-ads');
    return TestIds.INTERSTITIAL;
  }
  return PRODUCTION_INTERSTITIAL_AD_UNIT_ID;
}

// Call once at app startup (outside Expo Go) to initialize the Google
// Mobile Ads SDK before any ad is requested.
export async function initializeAdsSdk(): Promise<void> {
  if (isExpoGo) return;
  try {
    const mobileAds = require('react-native-google-mobile-ads').default;
    if (TEST_DEVICE_IDS.length > 0) {
      await mobileAds().setRequestConfiguration({ testDeviceIdentifiers: TEST_DEVICE_IDS });
    }
    await mobileAds().initialize();
  } catch (err) {
    console.warn('AdMob SDK failed to initialize', err);
  }
}
