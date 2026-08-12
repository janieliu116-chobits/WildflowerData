import React, { useEffect, useRef, useState } from 'react';
import {
  Animated, Dimensions, Keyboard, Modal, Platform, Pressable, StyleSheet, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { createStyles } from '@/utils/responsiveStyles';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  height?: number | 'auto';
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function BottomSheet({ visible, onClose, children, height = 'auto' }: BottomSheetProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  // ── Slide-in animation (native driver — cannot carry layout props) ───────────
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  // ── Keyboard lifting (non-native driver — controls layout `bottom`) ──────────
  // Tracked as plain state so maxHeight can shrink synchronously to keep the
  // sheet from overflowing the top of the screen as the keyboard rises.
  const [kbHeight, setKbHeight] = useState(0);
  const kbAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // iOS fires "Will" events with accurate duration; Android fires "Did" events.
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      const h = e.endCoordinates.height;
      setKbHeight(h);
      Animated.timing(kbAnim, {
        toValue: h,
        duration: Platform.OS === 'ios' ? (e.duration ?? 250) : 200,
        useNativeDriver: false, // layout prop — must be false
      }).start();
    });

    const hideSub = Keyboard.addListener(hideEvent, (e) => {
      setKbHeight(0);
      Animated.timing(kbAnim, {
        toValue: 0,
        duration: Platform.OS === 'ios' ? (e.duration ?? 200) : 200,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [kbAnim]);

  // ── Slide-in / slide-out ─────────────────────────────────────────────────────
  useEffect(() => {
    if (visible) {
      Keyboard.dismiss();
      Animated.parallel([
        Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, translateY, opacity]);

  if (!visible) return null;

  // Sheet height: shrinks as the keyboard rises so it never overflows the top.
  // Leave at least 16 px gap from the safe-area top.
  const maxSheetHeight = height !== 'auto'
    ? (height as number)
    : Math.max(200, SCREEN_HEIGHT * 0.88 - kbHeight - insets.top - 16);

  const sheetSizeStyle = height !== 'auto'
    ? { height: height as number }
    : { maxHeight: maxSheetHeight };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Dim overlay */}
      <Animated.View style={[styles.overlay, { opacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/*
        Two-layer Animated.View trick:
          Outer  — non-native driver, controls `bottom` (keyboard lift).
                   Cannot use `useNativeDriver: true` here because `bottom` is a layout prop.
          Inner  — native driver, controls `transform: translateY` (slide-in animation).
                   Must be a separate node so it can use `useNativeDriver: true`.
      */}
      <Animated.View
        style={[
          styles.sheetPositioner,
          { bottom: kbAnim },
        ]}
      >
        <Animated.View
          style={[
            styles.sheet,
            sheetSizeStyle,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              paddingBottom: Math.max(insets.bottom, Platform.OS === 'web' ? 34 : 0) + 16,
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Grabber */}
          <View style={[styles.grabber, { backgroundColor: colors.border }]} />
          {children}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = createStyles({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  // Outer positioner: sits at bottom:0 normally, lifts with keyboard.
  sheetPositioner: {
    position: 'absolute',
    left: 0,
    right: 0,
    // `bottom` is driven by kbAnim at runtime
  },
  sheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingTop: 8,
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
});
