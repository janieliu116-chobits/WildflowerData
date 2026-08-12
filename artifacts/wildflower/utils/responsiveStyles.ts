import { StyleSheet, Platform } from 'react-native';

// Android renders the same numeric fontSize visually differently than
// iOS/web in this app (no system font-scale compensation), so text sizing
// is tuned separately for Android only, applied at StyleSheet-creation time
// so every screen gets it "for free" from a one-line import swap instead of
// littering scale factors through every inline style.
const ANDROID_FONT_SCALE = 1.6;

// Ionicons/Feather render noticeably smaller on Android than the same
// numeric `size` prop renders on iOS/web, so icons need their own
// Android-only multiplier (icon `size` is a component prop, not a style
// object, so it can't be scaled by createStyles).
const ANDROID_ICON_SCALE = 2;

export function androidIconSize(size: number): number {
  return Platform.OS === 'android' ? Math.round(size * ANDROID_ICON_SCALE) : size;
}

export function createStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(styles: T): T {
  if (Platform.OS !== 'android') return StyleSheet.create(styles);
  const scaled: any = {};
  for (const key in styles) {
    const value: any = (styles as any)[key];
    const next = { ...value };
    if (typeof next.fontSize === 'number') next.fontSize = Math.round(next.fontSize * ANDROID_FONT_SCALE * 10) / 10;
    if (typeof next.lineHeight === 'number') next.lineHeight = Math.round(next.lineHeight * ANDROID_FONT_SCALE * 10) / 10;
    scaled[key] = next;
  }
  return StyleSheet.create(scaled);
}
