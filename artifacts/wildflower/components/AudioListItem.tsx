import React from 'react';
import {
  ActivityIndicator, Animated, Image, Pressable, StyleSheet, Text, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PanResponder } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useAudio } from '@/contexts/AudioContext';
import type { AudioTrack } from '@/constants/data';
import type { AudioSlot } from '@/contexts/AudioContext';
import { THEME_IMAGES } from '@/constants/data';
import { FONT_BODY_MEDIUM, FONT_BODY_REGULAR } from '@/constants/fonts';
import { createStyles, androidIconSize } from '@/utils/responsiveStyles';

interface AudioListItemProps {
  track: AudioTrack;
  onDelete: () => void;
  // Present only in reorderable lists (My Collection). Long-pressing the
  // drag handle starts the draggable-flatlist reorder gesture.
  onDragStart?: () => void;
  isDragging?: boolean;
  /** When true, shows a "Previously played" badge on this row. */
  isPreviouslyPlayed?: boolean;
  /** Called when the user starts playing a *different* track, to clear the badge. */
  onClearPreviouslyPlayed?: () => void;
  /** The slot this list belongs to (e.g. 'meditation-collection'). Passed to
   *  playTrack so activeSlot is set correctly, keeping Channel and My Collection
   *  fully independent. Also used to make the play indicator slot-aware. */
  slot?: AudioSlot;
}

export default function AudioListItem({ track, onDelete, onDragStart, isDragging, isPreviouslyPlayed, onClearPreviouslyPlayed, slot }: AudioListItemProps) {
  const colors = useColors();
  const { currentTrack, isPlaying, isLoadingTrack, activeSlot, playTrack, pauseTrack, resumeTrack } = useAudio();
  const translateX = React.useRef(new Animated.Value(0)).current;
  const themeImage = THEME_IMAGES[track.theme];

  // Slot-aware: only treat this as the active track when both the track ID
  // and the active slot match, so a collection track playing won't light up
  // a Channel row with the same track, and vice versa.
  const isThisTrack = currentTrack?.id === track.id && (slot == null || activeSlot === slot);
  const isThisPlaying = isThisTrack && isPlaying;
  const isThisLoading = isThisTrack && isLoadingTrack;

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10 && Math.abs(g.dy) < 20,
      onPanResponderMove: (_, g) => {
        if (g.dx < 0) translateX.setValue(g.dx);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx < -80) onDelete();
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
      },
    })
  ).current;

  const handlePlayPause = async () => {
    if (isThisPlaying) await pauseTrack();
    else if (isThisTrack) await resumeTrack();
    else {
      // A different track is being played — clear the "Previously played" marker.
      onClearPreviouslyPlayed?.();
      // Pass slot so activeSlot is updated correctly in AudioContext.
      await playTrack(track, slot);
    }
  };

  return (
    <View style={styles.wrapper}>
      <View
        style={[styles.swipeHint, { backgroundColor: colors.destructive + '22' }]}
        pointerEvents="none"
      >
        <Ionicons name="trash-outline" size={androidIconSize(16)} color={colors.destructive} />
        <Text style={[styles.swipeHintText, { color: colors.destructive }]}>Delete</Text>
      </View>
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.container,
          { backgroundColor: colors.card, borderColor: colors.border, transform: [{ translateX }] },
          isDragging && { opacity: 0.85, borderColor: colors.gold },
        ]}
      >
        {onDragStart && (
          <Pressable
            onLongPress={onDragStart}
            delayLongPress={150}
            hitSlop={10}
            style={({ pressed }) => [styles.dragHandle, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Ionicons name="reorder-three-outline" size={androidIconSize(22 * 0.6)} color={colors.mutedForeground} />
          </Pressable>
        )}
        <View style={styles.themeIcon}>
          {themeImage ? (
            <Image source={themeImage} style={styles.themeIconImage} />
          ) : (
            <View style={[styles.themeIconImage, { backgroundColor: colors.cardElevated }]} />
          )}
        </View>
        <View style={styles.info}>
          <Text style={[styles.title, { color: colors.foreground }]}>{track.title}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[styles.theme, { color: colors.gold }]}>{track.theme}</Text>
            {isPreviouslyPlayed && (
              <View style={[styles.prevPlayedBadge, { backgroundColor: colors.gold + '22', borderColor: colors.gold + '55' }]}>
                <Text style={[styles.prevPlayedText, { color: colors.gold }]}>Previously played</Text>
              </View>
            )}
          </View>
        </View>
        <Pressable
          onPress={handlePlayPause}
          disabled={isThisLoading}
          hitSlop={10}
          style={({ pressed }) => [styles.playBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          {isThisLoading ? (
            <ActivityIndicator size="small" color={colors.gold} style={{ width: androidIconSize(36 * 0.7), height: androidIconSize(36 * 0.7) }} />
          ) : (
            <Ionicons
              name={isThisPlaying ? 'pause-circle' : 'play-circle'}
              size={androidIconSize(36 * 0.7)}
              color={isThisPlaying ? colors.gold : colors.mutedForeground}
            />
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = createStyles({
  wrapper: {
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  swipeHint: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    paddingRight: 16,
  },
  swipeHintText: {
    fontSize: 11,
    fontFamily: FONT_BODY_MEDIUM,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  themeIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    overflow: 'hidden',
  },
  themeIconImage: {
    width: 44,
    height: 44,
  },
  info: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 12,
    fontFamily: FONT_BODY_MEDIUM,
  },
  theme: {
    fontSize: 10,
    fontFamily: FONT_BODY_REGULAR,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  playBtn: {
    padding: 4,
  },
  dragHandle: {
    padding: 4,
  },
  prevPlayedBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  prevPlayedText: {
    fontSize: 8,
    fontFamily: FONT_BODY_MEDIUM,
    letterSpacing: 0.4,
  },
});
