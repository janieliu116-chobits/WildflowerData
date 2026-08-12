import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAudio } from '@/contexts/AudioContext';
import { THEME_IMAGES } from '@/constants/data';
import { useColors } from '@/hooks/useColors';
import type { AudioSlot } from '@/contexts/AudioContext';

interface Props {
  hideSlot?: AudioSlot | null;
}

export default function FloatingAudioPlayer({ hideSlot }: Props) {
  const {
    currentTrack, isPlaying, activeSlot,
    pauseTrack, resumeTrack, stopTrack,
    keepFloatingVisible, setKeepFloatingVisible,
    setRequestedTab,
  } = useAudio();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Visibility rules:
  //  • Show when audio is actively playing on a different page/tab.
  //  • Keep showing when the user paused via this float (keepFloatingVisible=true).
  //  • Never show when the user paused on the source page and then navigated away
  //    (isPlaying=false + keepFloatingVisible=false → hidden).
  //  • Never show when already on the source page/tab (hideSlot matches activeSlot).
  const shouldShow = (isPlaying || keepFloatingVisible) && !!currentTrack && !!activeSlot;
  if (!shouldShow) return null;
  if (hideSlot != null && activeSlot === hideSlot) return null;

  const image = THEME_IMAGES[currentTrack.theme];

  const handleBodyPress = () => {
    // Clear the keep-flag so that if the user arrives at the source page,
    // pauses (or audio is already paused), and then navigates away again,
    // the float does not reappear.
    setKeepFloatingVisible(false);
    const tab: 'audio' | 'collection' = activeSlot.includes('collection') ? 'collection' : 'audio';
    setRequestedTab({ slot: activeSlot, tab });
    if (activeSlot.startsWith('meditation')) {
      router.push('/meditation' as any);
    } else {
      router.push('/sleep' as any);
    }
  };

  const handlePlayPause = (e: any) => {
    e.stopPropagation?.();
    if (isPlaying) {
      pauseTrack();
      // Paused via the float — keep it visible so the user can resume here.
      setKeepFloatingVisible(true);
    } else {
      resumeTrack();
      // Resuming resets the flag; isPlaying will drive visibility from here.
      setKeepFloatingVisible(false);
    }
  };

  const handleClose = (e: any) => {
    e.stopPropagation?.();
    setKeepFloatingVisible(false);
    stopTrack();
  };

  // Vertically centre the card with the About ("?") button in AppHeader.
  // Button centre = insets.top + 10 + 18 = insets.top + 28.
  // Card height = thumb = 52 px → top = insets.top + 28 − 26 = insets.top + 2.
  const top = insets.top + 2;

  return (
    <View style={[styles.wrapper, { top }]} pointerEvents="box-none">
      <Pressable
        onPress={handleBodyPress}
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: colors.cardElevated, borderColor: colors.border },
          pressed && { opacity: 0.85 },
        ]}
      >
        {image ? (
          <Image source={image} style={styles.thumb} resizeMode="cover" />
        ) : (
          <View style={[styles.thumb, styles.thumbFallback, { backgroundColor: colors.card }]} />
        )}

        <View style={styles.info}>
          <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
            {currentTrack.title}
          </Text>
          <Text style={[styles.theme, { color: colors.gold }]} numberOfLines={1}>
            {currentTrack.theme.toUpperCase()}
          </Text>
        </View>

        <Pressable
          onPress={handlePlayPause}
          hitSlop={6}
          style={[styles.playBtn, { backgroundColor: colors.gold }]}
        >
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={13}
            color="#1A1020"
          />
        </Pressable>

        <Pressable
          onPress={handleClose}
          hitSlop={8}
          style={styles.closeBtn}
        >
          <Ionicons
            name="close"
            size={16}
            color={colors.mutedForeground}
          />
        </Pressable>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    right: 14,
    zIndex: 200,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingRight: 12,
    overflow: 'hidden',
    minWidth: 182,
    maxWidth: 242,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  thumb: {
    width: 52,
    height: 52,
  },
  thumbFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  title: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.1,
  },
  theme: {
    fontSize: 8,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  playBtn: {
    width: 29,
    height: 29,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  closeBtn: {
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
