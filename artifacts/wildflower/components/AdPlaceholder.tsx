import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Modal, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { FONT_BODY_REGULAR } from '@/constants/fonts';
import { createStyles, androidIconSize } from '@/utils/responsiveStyles';
import { isExpoGo, getInterstitialAdUnitId } from '@/utils/ads';

// Real AdMob interstitial, shown before an Ask reading unlocks.
//
// Google's own full-screen ad UI takes over the screen while the interstitial
// is loading/showing, so this component renders nothing during that phase --
// it only renders the "Preparing your reading…" loading view for the brief
// window after the ad closes, while the parent (ask.tsx) is awaiting the
// Gemini interpretation (signaled via `fetching`). That's why `visible`
// alone doesn't draw a modal here the way the old placeholder did.
//
// Falls back to completing the flow without an ad (rather than blocking the
// reading) if: the SDK can't load an ad in time, an ad fails to load, or
// we're running in Expo Go (Replit's live-preview dev workflow, which has
// no native ad module -- see utils/ads.ts).
const FALLBACK_TIMEOUT_MS = 4000;

interface AdPlaceholderProps {
  visible: boolean;
  onDone: () => void;
  // True once the user has watched the full ad and the Gemini request for
  // their interpretation is in flight -- shows the hourglass loading state
  // instead of dismissing immediately.
  fetching?: boolean;
}

export default function AdPlaceholder({ visible, onDone, fetching }: AdPlaceholderProps) {
  const colors = useColors();
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const interstitialRef = useRef<any>(null);
  const loadedRef = useRef(false);
  const shownForThisCycleRef = useRef(false);
  const unsubscribersRef = useRef<Array<() => void>>([]);

  const loadNextInterstitial = () => {
    if (isExpoGo) return;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { InterstitialAd, AdEventType } = require('react-native-google-mobile-ads');

    unsubscribersRef.current.forEach(unsub => unsub());
    unsubscribersRef.current = [];

    const ad = InterstitialAd.createForAdRequest(getInterstitialAdUnitId(), {
      requestNonPersonalizedAdsOnly: false,
    });
    interstitialRef.current = ad;
    loadedRef.current = false;

    unsubscribersRef.current.push(
      ad.addAdEventListener(AdEventType.LOADED, () => {
        loadedRef.current = true;
      }),
      ad.addAdEventListener(AdEventType.CLOSED, () => {
        onDoneRef.current();
        loadNextInterstitial(); // preload for the next unlock
      }),
      ad.addAdEventListener(AdEventType.ERROR, (err: unknown) => {
        console.warn('Interstitial ad failed to load/show', err);
        if (!shownForThisCycleRef.current) {
          // Never watched -- don't block the reading, just proceed.
          shownForThisCycleRef.current = true;
          onDoneRef.current();
        }
        // Without this, one failed load (no fill, network blip, invalid-
        // traffic throttling) left this instance permanently unloaded --
        // every later unlock would just hit the 4s fallback timeout instead
        // of ever getting a fresh ad. Retry with a new instance instead.
        loadNextInterstitial();
      }),
    );

    ad.load();
  };

  // Preload the first ad on mount.
  useEffect(() => {
    loadNextInterstitial();
    return () => unsubscribersRef.current.forEach(unsub => unsub());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!visible) {
      shownForThisCycleRef.current = false;
      return;
    }
    if (fetching || shownForThisCycleRef.current) return;

    if (isExpoGo) {
      // No native ad module available in Replit's live-preview workflow --
      // proceed straight through so local dev/testing isn't blocked.
      shownForThisCycleRef.current = true;
      onDoneRef.current();
      return;
    }

    shownForThisCycleRef.current = true;

    if (loadedRef.current && interstitialRef.current) {
      interstitialRef.current.show();
      return;
    }

    // Ad not loaded yet (slow network, no fill) -- give it a moment rather
    // than making the user wait indefinitely on a reading they already
    // asked for.
    const timeout = setTimeout(() => {
      if (loadedRef.current && interstitialRef.current) {
        interstitialRef.current.show();
      } else {
        onDoneRef.current();
      }
    }, FALLBACK_TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, [visible, fetching]);

  // Hourglass flip animation -- rotates 180° every cycle so it looks like
  // sand falling, then the glass flipping over, matching the gold app palette.
  const flipAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!fetching) {
      flipAnim.setValue(0);
      return;
    }
    let cancelled = false;
    const loop = () => {
      if (cancelled) return;
      Animated.sequence([
        Animated.delay(700),
        Animated.timing(flipAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.delay(700),
        Animated.timing(flipAnim, { toValue: 0, duration: 450, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished && !cancelled) loop();
      });
    };
    loop();
    return () => {
      cancelled = true;
    };
  }, [fetching]);
  const hourglassRotation = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  if (!fetching) return null;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <View style={[styles.overlay, { backgroundColor: colors.background }]}>
        <Animated.View style={{ transform: [{ rotate: hourglassRotation }], marginBottom: -4 }}>
          <Ionicons name="hourglass-outline" size={androidIconSize(34)} color={colors.gold} />
        </Animated.View>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Preparing your reading…</Text>
        <ActivityIndicator size="small" color={colors.gold} style={{ marginTop: 4 }} />
      </View>
    </Modal>
  );
}

const styles = createStyles({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 14,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: FONT_BODY_REGULAR,
    textAlign: 'center',
    lineHeight: 19,
  },
});
