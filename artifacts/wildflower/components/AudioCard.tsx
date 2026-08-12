import React from 'react';
import {
  ActivityIndicator, Image, Pressable, StyleSheet, Text, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { useAudio } from '@/contexts/AudioContext';
import type { AudioSlot } from '@/contexts/AudioContext';
import type { AudioTrack } from '@/constants/data';
import { THEME_IMAGES, THEME_COLORS } from '@/constants/data';
import { FONT_BODY_REGULAR, FONT_BODY_SEMIBOLD } from '@/constants/fonts';
import { createStyles, androidIconSize } from '@/utils/responsiveStyles';

interface AudioCardProps {
  track: AudioTrack | null;
  allTracks: AudioTrack[];
  onNext: () => void;
  onRestart: () => void;
  onTimerPress?: () => void;
  timerActive?: boolean;
  // Slot this card belongs to — passed to playTrack so activeSlot is set
  // correctly and the card doesn't jump to a new random track on re-render.
  slot?: AudioSlot;
}

export default function AudioCard({ track, allTracks, onNext, onRestart, onTimerPress, timerActive, slot }: AudioCardProps) {
  const colors = useColors();
  const { isPlaying, isLoadingTrack, currentTrack, activeSlot, playTrack, pauseTrack, resumeTrack, addToCollection, removeFromCollection, isInCollection, playbackError } = useAudio();

  // isThisTrack is only true when both the track ID and the active slot match.
  // This keeps Channel and My Collection fully independent: a collection track
  // playing won't make the Channel card show a "pause" button, and vice versa.
  const isThisTrack = currentTrack?.id === track?.id && (slot == null || activeSlot === slot);
  const isThisPlaying = isThisTrack && isPlaying;
  const isThisLoading = isThisTrack && isLoadingTrack;
  const inCollection = track ? isInCollection(track.id) : false;

  const themeImage = track ? THEME_IMAGES[track.theme] : null;
  const isUnavailable = !!track && !track.driveFileId;

  const handlePlayPause = async () => {
    if (!track || isUnavailable) return;
    if (isThisPlaying) {
      await pauseTrack();
    } else if (isThisTrack) {
      await resumeTrack();
    } else {
      await playTrack(track, slot);
    }
  };

  const handleCollection = async () => {
    if (!track) return;
    if (inCollection) {
      await removeFromCollection(track.id, track.category);
    } else {
      await addToCollection(track);
    }
  };

  const CardBody = (
    <>
      <LinearGradient
        colors={['transparent', 'rgba(19,19,30,0.55)', colors.background]}
        style={StyleSheet.absoluteFill}
      />
      {/* Theme display */}
      <View style={[styles.themeRow, { alignItems: 'flex-start' }]}>
        <View style={styles.trackInfo}>
          <Text style={[styles.trackName, { color: colors.foreground }]}>
            {track?.title ?? 'No session playing'}
          </Text>
          <Text style={[styles.themeName, { color: colors.gold }]}>
            {track?.theme ?? '—'}{isUnavailable ? ' · Coming soon' : ''}
          </Text>
        </View>
        <View style={[styles.sideButtons, { marginTop: 2 }]}>
          <Pressable onPress={onRestart} style={styles.sideBtn} hitSlop={10}>
            <Ionicons name="play-skip-back-outline" size={androidIconSize(20 * 0.8)} color={colors.foreground} />
          </Pressable>
          <Pressable onPress={onNext} style={styles.sideBtn} hitSlop={10}>
            <Ionicons name="play-skip-forward-outline" size={androidIconSize(20 * 0.8)} color={colors.foreground} />
          </Pressable>
        </View>
      </View>

      {isThisTrack && playbackError && (
        <Text style={[styles.errorText, { color: colors.destructive }]}>{playbackError}</Text>
      )}

      {/* Bottom controls */}
      <View style={styles.controls}>
        <Pressable
          onPress={handleCollection}
          hitSlop={10}
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
        >
          <Ionicons
            name={inCollection ? 'heart' : 'heart-outline'}
            size={androidIconSize(24 * 0.8)}
            color={inCollection ? colors.gold : colors.foreground}
          />
        </Pressable>

        <Pressable
          onPress={handlePlayPause}
          disabled={!track || isUnavailable || isThisLoading}
          style={[styles.playBtn, { backgroundColor: colors.gold, borderColor: colors.goldLight, opacity: track && !isUnavailable ? 1 : 0.5 }]}
        >
          {isThisLoading ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <Ionicons
              name={isThisPlaying ? 'pause' : 'play'}
              size={androidIconSize(26 * 0.7)}
              color={colors.background}
              style={!isThisPlaying ? { marginLeft: 2 } : undefined}
            />
          )}
        </Pressable>

        {onTimerPress ? (
          <Pressable
            onPress={onTimerPress}
            hitSlop={10}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          >
            <Ionicons
              name="timer-outline"
              size={androidIconSize(24 * 0.8)}
              color={timerActive ? colors.gold : colors.foreground}
            />
          </Pressable>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>
    </>
  );

  return (
    <>
      {themeImage ? (
        <View style={[styles.card, { borderColor: colors.border, backgroundColor: track ? THEME_COLORS[track.theme] : colors.card }]}>
          <Image
            source={themeImage}
            style={StyleSheet.absoluteFill}
            resizeMode="contain"
          />
          {CardBody}
        </View>
      ) : (
        <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}>
          {CardBody}
        </View>
      )}
    </>
  );
}

const styles = createStyles({
  card: {
    marginHorizontal: 20,
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    paddingTop: 90,
    gap: 16,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  cardImage: {
    resizeMode: 'cover',
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 10,
  },
  trackInfo: {
    flex: 1,
    gap: 4,
  },
  trackName: {
    fontSize: 13,
    fontFamily: FONT_BODY_SEMIBOLD,
  },
  themeName: {
    fontSize: 10,
    fontFamily: FONT_BODY_REGULAR,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sideButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  sideBtn: {
    padding: 4,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  playBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 10.5,
    fontFamily: FONT_BODY_REGULAR,
    marginTop: -4,
  },
});
