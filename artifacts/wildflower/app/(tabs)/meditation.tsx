import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  Alert, Image, Platform, Pressable, ScrollView, Text, View,
} from 'react-native';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import AppHeader from '@/components/AppHeader';
import SliderTabs from '@/components/SliderTabs';
import AudioCard from '@/components/AudioCard';
import AudioListItem from '@/components/AudioListItem';
import PlayModeRow from '@/components/PlayModeRow';
import TimerSheet from '@/components/TimerSheet';
import AppBackground from '@/components/AppBackground';
import { useAudio } from '@/contexts/AudioContext';
import { useReadingCount } from '@/contexts/ReadingCountContext';
import { AUDIO_TRACKS, MEDITATION_THEMES, type AudioTrack } from '@/constants/data';
import FloatingAudioPlayer from '@/components/FloatingAudioPlayer';
import { FONT_BODY_MEDIUM, FONT_BODY_REGULAR, FONT_BODY_SEMIBOLD } from '@/constants/fonts';
import { createStyles, androidIconSize } from '@/utils/responsiveStyles';
import type { PlaybackMode } from '@/contexts/AudioContext';

const meditationTracks = AUDIO_TRACKS.filter(t => t.category === 'meditation');
const LOCKED_MEDITATION_THEMES = ['Compassion', 'Connection'];
const MEDITATION_UNLOCK_COUNT = 50;

function pickRandom(tracks: AudioTrack[], excludeId?: string): AudioTrack | null {
  if (tracks.length === 0) return null;
  const pool = tracks.length > 1 ? tracks.filter(t => t.id !== excludeId) : tracks;
  return pool[Math.floor(Math.random() * pool.length)];
}

export default function MeditationScreen() {
  const colors = useColors();
  const { readingCount } = useReadingCount();
  const [activeTab, setActiveTab] = useState<'audio' | 'collection'>('audio');
  // Per-tab theme memory so switching tabs restores the last filter.
  const [tabThemes, setTabThemes] = useState<Record<'audio' | 'collection', string | null>>({ audio: null, collection: null });
  const [showTimer, setShowTimer] = useState(false);
  const [lockedHint, setLockedHint] = useState<string | null>(null);
  const [hintTailPageX, setHintTailPageX] = useState(0);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [filterRowTop, setFilterRowTop] = useState(0);

  const themeUnlocked = readingCount >= MEDITATION_UNLOCK_COUNT;

  // Stable channel card track — only changes on explicit user actions (theme
  // switch, Next button). Never changes just because activeSlot changed on
  // another page, preventing the card from jumping to a different track.
  const [channelCardId, setChannelCardId] = useState<string | null>(
    () => pickRandom(meditationTracks)?.id ?? null
  );

  const {
    currentTrack, isPlaying, playTrack, pauseTrack, restartTrack,
    meditationCollection, removeFromCollection, reorderCollection,
    meditationPlaybackMode, setMeditationPlaybackMode, setSlotFinishBehavior, setSlotTimer,
    slotTimers, setSlotStopAfterTrack, slotStopAfterTrack, activeSlot,
    requestedTab, setRequestedTab,
  } = useAudio();

  // When the floating player navigates here from another screen, apply the
  // requested tab once on focus (useFocusEffect fires when this screen mounts
  // or regains focus after navigation).
  const requestedTabRef = useRef(requestedTab);
  requestedTabRef.current = requestedTab;
  useFocusEffect(
    React.useCallback(() => {
      const req = requestedTabRef.current;
      if (req?.slot.startsWith('meditation')) {
        setActiveTab(req.tab);
        setRequestedTab(null);
      }
    }, [setRequestedTab])
  );

  // Also handle requestedTab changes while already on this screen (floating
  // player tapped when the user is already viewing Meditation — router.push
  // is a no-op so useFocusEffect won't re-fire).
  useEffect(() => {
    if (requestedTab?.slot.startsWith('meditation')) {
      setActiveTab(requestedTab.tab);
      setRequestedTab(null);
    }
  }, [requestedTab, setRequestedTab]);

  const channelTimerSeconds = slotTimers['meditation-channel'];
  const collectionTimerSeconds = slotTimers['meditation-collection'];
  const channelStopAfterTrack = slotStopAfterTrack['meditation-channel'];
  const collectionStopAfterTrack = slotStopAfterTrack['meditation-collection'];

  const selectedTheme = tabThemes[activeTab];

  // Keep the channel card in sync when audio starts from the channel slot.
  const prevChannelTrackId = useRef<string | null>(null);
  useEffect(() => {
    if (
      activeSlot === 'meditation-channel' &&
      currentTrack?.category === 'meditation' &&
      currentTrack.id !== prevChannelTrackId.current
    ) {
      prevChannelTrackId.current = currentTrack.id;
      setChannelCardId(currentTrack.id);
    }
  }, [activeSlot, currentTrack]);

  // Unlocked tracks for "All" pool when themes are still locked
  const unlockedMeditationTracks = useMemo(() =>
    themeUnlocked ? meditationTracks : meditationTracks.filter(t => !LOCKED_MEDITATION_THEMES.includes(t.theme)),
    [themeUnlocked]
  );

  const channelFilteredTracks = useMemo(() => {
    if (tabThemes.audio) return meditationTracks.filter(t => t.theme === tabThemes.audio);
    return unlockedMeditationTracks;
  }, [tabThemes.audio, unlockedMeditationTracks]);

  const filteredTracks = useMemo(() => {
    if (selectedTheme) return meditationTracks.filter(t => t.theme === selectedTheme);
    return unlockedMeditationTracks;
  }, [selectedTheme, unlockedMeditationTracks]);

  // Resolve the stable card track from the stored id.
  const cardTrack = useMemo(() => {
    const found = channelCardId ? channelFilteredTracks.find(t => t.id === channelCardId) : null;
    return found ?? channelFilteredTracks[0] ?? null;
  }, [channelCardId, channelFilteredTracks]);

  // Switching the theme filter: pick a new card, clear channel timer.
  const handleThemeSelect = (theme: string | null) => {
    setTabThemes(prev => ({ ...prev, [activeTab]: theme }));
    if (activeTab === 'audio') {
      const pool = theme ? meditationTracks.filter(t => t.theme === theme) : unlockedMeditationTracks;
      const next = pickRandom(pool);
      setChannelCardId(next?.id ?? null);
      if (activeSlot === 'meditation-channel') pauseTrack();
      setSlotTimer('meditation-channel', null);
      setSlotStopAfterTrack('meditation-channel', false);
    }
  };

  const handleLockedThemeTap = (theme: string, pageX: number) => {
    setLockedHint(`Unlocks after ${MEDITATION_UNLOCK_COUNT} readings (${readingCount}/${MEDITATION_UNLOCK_COUNT}) in Ask`);
    setHintTailPageX(pageX);
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setLockedHint(null), 2500);
  };

  // Tab switching — audio keeps playing through tab changes.
  const handleTabChange = (id: string) => {
    setActiveTab(id as 'audio' | 'collection');
  };

  const allCollectionTracks = useMemo(() =>
    meditationCollection.map(id => meditationTracks.find(t => t.id === id)).filter(Boolean) as AudioTrack[],
    [meditationCollection]
  );
  const collectionTracks = useMemo(() =>
    selectedTheme ? allCollectionTracks.filter(t => t.theme === selectedTheme) : allCollectionTracks,
    [allCollectionTracks, selectedTheme]
  );

  const handleNext = async () => {
    const track = pickRandom(channelFilteredTracks, cardTrack?.id);
    if (track) {
      setChannelCardId(track.id);
      await playTrack(track, 'meditation-channel');
    }
  };

  // Register per-slot finish behaviors so they stay correct regardless of
  // which tab/page the user is viewing.
  useEffect(() => {
    setSlotFinishBehavior('meditation-channel', { kind: 'channel', tracks: channelFilteredTracks });
  }, [channelFilteredTracks, setSlotFinishBehavior]);

  useEffect(() => {
    setSlotFinishBehavior(
      'meditation-collection',
      collectionTracks.length ? { kind: 'collection', tracks: collectionTracks } : null,
    );
  }, [collectionTracks, setSlotFinishBehavior]);

  // Play mode selection:
  const handleModeChange = async (mode: PlaybackMode) => {
    setMeditationPlaybackMode(mode);
    if (activeTab !== 'collection' || !collectionTracks.length) return;
    const alreadyPlaying = isPlaying && collectionTracks.some(t => t.id === currentTrack?.id);
    if (alreadyPlaying) return;
    if (mode === 'in_order') {
      await playTrack(collectionTracks[0], 'meditation-collection');
    } else if (mode === 'shuffle') {
      await playTrack(
        collectionTracks[Math.floor(Math.random() * collectionTracks.length)],
        'meditation-collection',
      );
    }
  };

  // Reordering respects the active theme filter.
  const handleReorder = (newFilteredOrder: AudioTrack[]) => {
    const filteredIdSet = new Set(collectionTracks.map(t => t.id));
    const queue = newFilteredOrder.map(t => t.id);
    let qi = 0;
    const newFull = allCollectionTracks.map(t => (filteredIdSet.has(t.id) ? queue[qi++] : t.id));
    reorderCollection('meditation', newFull);
  };

  const handleDeleteTrack = (track: AudioTrack) => {
    const message = `Remove "${track.title}" from your collection?`;
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(message)) {
        removeFromCollection(track.id, 'meditation');
      }
      return;
    }
    Alert.alert(
      'Remove from collection',
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeFromCollection(track.id, 'meditation') },
      ]
    );
  };

  const activeSlotKey = activeTab === 'audio'
    ? 'meditation-channel' as const
    : 'meditation-collection' as const;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppBackground />
      <AppHeader
        title="Meditation"
        icon={
          <Image
            source={require('@/assets/images/icon-lotus.png')}
            style={{ width: 36 * 1.2, height: 36 * 1.2, tintColor: colors.gold }}
            resizeMode="contain"
          />
        }
      />

      <SliderTabs
        tabs={[
          { id: 'audio', label: 'Channel' },
          { id: 'collection', label: 'My Collection' },
        ]}
        activeId={activeTab}
        onChange={handleTabChange}
      />

      {activeTab === 'collection' && (
        <PlayModeRow
          onTimerPress={() => setShowTimer(true)}
          mode={meditationPlaybackMode}
          onModeChange={handleModeChange}
          timerActive={collectionTimerSeconds !== null || collectionStopAfterTrack}
        />
      )}

      {/* Theme filter — one ScrollView per tab so scroll positions are independent */}
      <View style={{ zIndex: 10 }} onLayout={(e) => setFilterRowTop(e.nativeEvent.layout.y)}>
        {/* Channel filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.themeScroll, { alignItems: 'center' }]}
          style={[{ marginTop: 12, height: 54, flexGrow: 0, flexShrink: 0 }, activeTab !== 'audio' && { display: 'none' }]}
        >
          <ThemeChip
            label="All"
            isActive={tabThemes.audio === null}
            onPress={() => handleThemeSelect(null)}
            colors={colors}
          />
          {MEDITATION_THEMES.map(theme => {
            const isLocked = !themeUnlocked && LOCKED_MEDITATION_THEMES.includes(theme);
            return (
              <ThemeChip
                key={theme}
                label={theme}
                isActive={tabThemes.audio === theme}
                locked={isLocked}
                onPress={() => handleThemeSelect(theme === tabThemes.audio ? null : theme)}
                onLockedPress={(pageX) => handleLockedThemeTap(theme, pageX)}
                colors={colors}
              />
            );
          })}
        </ScrollView>
        {/* Collection filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.themeScroll, { alignItems: 'center' }]}
          style={[{ marginTop: 12, height: 54, flexGrow: 0, flexShrink: 0 }, activeTab !== 'collection' && { display: 'none' }]}
        >
          <ThemeChip
            label="All"
            isActive={tabThemes.collection === null}
            onPress={() => handleThemeSelect(null)}
            colors={colors}
          />
          {MEDITATION_THEMES.map(theme => {
            const isLocked = !themeUnlocked && LOCKED_MEDITATION_THEMES.includes(theme);
            return (
              <ThemeChip
                key={theme}
                label={theme}
                isActive={tabThemes.collection === theme}
                locked={isLocked}
                onPress={() => handleThemeSelect(theme === tabThemes.collection ? null : theme)}
                onLockedPress={(pageX) => handleLockedThemeTap(theme, pageX)}
                colors={colors}
              />
            );
          })}
        </ScrollView>
      </View>

      {/* Lock hint overlay — at root level so it covers the full screen on any tap */}
      {lockedHint && (
        <>
          <Pressable
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}
            onPress={() => { if (hintTimer.current) clearTimeout(hintTimer.current); setLockedHint(null); }}
          />
          <View style={[styles.lockHintBubbleWrap, { top: filterRowTop + 68, zIndex: 10000 }]}>
            <View style={[styles.lockHintBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="lock-closed-outline" size={16} color="#9ca3af" />
              <Text style={[styles.lockHintText, { color: '#9ca3af' }]}>{lockedHint}</Text>
            </View>
          </View>
        </>
      )}

      {activeTab === 'audio' ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <AudioCard
            track={cardTrack}
            allTracks={channelFilteredTracks}
            onNext={handleNext}
            onRestart={restartTrack}
            onTimerPress={() => setShowTimer(true)}
            timerActive={channelTimerSeconds !== null || channelStopAfterTrack}
            slot="meditation-channel"
          />
          <View style={{ height: 100 }} />
        </ScrollView>
      ) : (
        <CollectionView
          tracks={collectionTracks}
          hasAny={allCollectionTracks.length > 0}
          onDelete={handleDeleteTrack}
          onReorder={handleReorder}
          colors={colors}
          slot="meditation-collection"
        />
      )}

      <TimerSheet
        visible={showTimer}
        onClose={() => setShowTimer(false)}
        currentSeconds={slotTimers[activeSlotKey]}
        onSetTimer={(s) => {
          setSlotTimer(activeSlotKey, s);
          const other = activeSlotKey === 'meditation-channel'
            ? 'meditation-collection' as const
            : 'meditation-channel' as const;
          setSlotTimer(other, null);
          setSlotStopAfterTrack(other, false);
        }}
        stopAfterTrack={slotStopAfterTrack[activeSlotKey]}
        onSetStopAfterTrack={(v) => {
          setSlotStopAfterTrack(activeSlotKey, v);
          if (v) {
            const other = activeSlotKey === 'meditation-channel'
              ? 'meditation-collection' as const
              : 'meditation-channel' as const;
            setSlotTimer(other, null);
            setSlotStopAfterTrack(other, false);
          }
        }}
      />

      <FloatingAudioPlayer
        hideSlot={activeTab === 'audio' ? 'meditation-channel' : 'meditation-collection'}
      />
    </View>
  );
}

function ThemeChip({ label, isActive, onPress, onLockedPress, colors, locked }: { label: string; isActive: boolean; onPress: () => void; onLockedPress?: (pageX: number) => void; colors: any; locked?: boolean }) {
  return (
    <Pressable
      onPress={(ev) => {
        if (locked && onLockedPress) onLockedPress(ev.nativeEvent.pageX);
        else onPress();
      }}
      style={[
        styles.themeChip,
        { backgroundColor: isActive ? colors.gold + '33' : colors.card, borderColor: isActive ? colors.gold : colors.border, opacity: locked ? 0.5 : 1, paddingHorizontal: locked ? 10 : 12 },
      ]}
    >
      {locked && <Ionicons name="lock-closed" size={10} color={isActive ? colors.gold : colors.foreground} style={{ marginRight: 4 }} />}
      <Text style={[styles.themeChipText, { color: isActive ? colors.gold : colors.foreground }]}>{label}</Text>
    </Pressable>
  );
}

function CollectionView({ tracks, hasAny, onDelete, onReorder, colors, slot }: {
  tracks: AudioTrack[];
  hasAny: boolean;
  onDelete: (track: AudioTrack) => void;
  onReorder: (tracks: AudioTrack[]) => void;
  colors: any;
  slot?: import('@/contexts/AudioContext').AudioSlot;
}) {
  if (tracks.length === 0) {
    if (!hasAny) {
      return (
        <View style={styles.emptyCollection}>
          <Ionicons name="heart-outline" size={androidIconSize(44)} color={colors.mutedForeground} />
          <Text style={[styles.emptyCollectionTitle, { color: colors.foreground }]}>Your collection is empty</Text>
          <Text style={[styles.emptyCollectionSub, { color: colors.mutedForeground }]}>
            Tap the ♡ on any session to save it here.
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyCollection}>
        <Ionicons name="filter-outline" size={androidIconSize(44)} color={colors.mutedForeground} />
        <Text style={[styles.emptyCollectionTitle, { color: colors.foreground }]}>No saved sessions in this theme</Text>
        <Text style={[styles.emptyCollectionSub, { color: colors.mutedForeground }]}>
          Try a different theme, or save a session from this one.
        </Text>
      </View>
    );
  }
  return (
    <DraggableFlatList
      data={tracks}
      keyExtractor={t => t.id}
      contentContainerStyle={styles.collectionList}
      onDragEnd={({ data }) => onReorder(data)}
      activationDistance={20}
      renderItem={({ item, drag, isActive }) => (
        <AudioListItem
          track={item}
          slot={slot}
          onDelete={() => onDelete(item)}
          onDragStart={drag}
          isDragging={isActive}
        />
      )}
    />
  );
}

const styles = createStyles({
  container: { flex: 1 },
  scroll: { paddingTop: 18, paddingHorizontal: 0 },
  themeScroll: { paddingHorizontal: 20, gap: 8 },
  themeChip: {
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  themeChipText: {
    fontSize: 10,
    fontFamily: FONT_BODY_MEDIUM,
    lineHeight: 13,
    textAlign: 'center',
    includeFontPadding: false,
  },
  lockHintBubbleWrap: {
    position: 'absolute',
    top: 68,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  lockHintBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  lockHintText: {
    fontSize: 11,
    fontFamily: FONT_BODY_MEDIUM,
  },
  emptyCollection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 40,
  },
  emptyCollectionTitle: {
    fontSize: 13.5,
    fontFamily: FONT_BODY_SEMIBOLD,
    textAlign: 'center',
  },
  emptyCollectionSub: {
    fontSize: 11,
    fontFamily: FONT_BODY_REGULAR,
    textAlign: 'center',
    lineHeight: 18,
  },
  collectionList: {
    padding: 20,
    paddingBottom: 100,
  },
});
