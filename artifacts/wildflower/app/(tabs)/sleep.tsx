import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  Alert, Platform, Pressable, ScrollView, Text, View,
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
import { AUDIO_TRACKS, SLEEP_THEMES, type AudioTrack } from '@/constants/data';
import FloatingAudioPlayer from '@/components/FloatingAudioPlayer';
import { FONT_BODY_MEDIUM, FONT_BODY_REGULAR, FONT_BODY_SEMIBOLD } from '@/constants/fonts';
import { createStyles, androidIconSize } from '@/utils/responsiveStyles';
import type { PlaybackMode } from '@/contexts/AudioContext';

const sleepTracks = AUDIO_TRACKS.filter(t => t.category === 'sleep');
const LOCKED_SLEEP_THEMES = ['Ear massage', 'Mouth sounds'];
const SLEEP_UNLOCK_COUNT = 50;

function pickRandom(tracks: AudioTrack[], excludeId?: string): AudioTrack | null {
  if (tracks.length === 0) return null;
  const pool = tracks.length > 1 ? tracks.filter(t => t.id !== excludeId) : tracks;
  return pool[Math.floor(Math.random() * pool.length)];
}

export default function SleepScreen() {
  const colors = useColors();
  const { readingCount } = useReadingCount();
  const [activeTab, setActiveTab] = useState<'audio' | 'collection'>('audio');
  const [tabThemes, setTabThemes] = useState<Record<'audio' | 'collection', string | null>>({ audio: null, collection: null });
  const [showTimer, setShowTimer] = useState(false);
  const [lockedHint, setLockedHint] = useState<string | null>(null);
  const [hintTailPageX, setHintTailPageX] = useState(0);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [filterRowTop, setFilterRowTop] = useState(0);

  const themeUnlocked = readingCount >= SLEEP_UNLOCK_COUNT;

  const [channelCardId, setChannelCardId] = useState<string | null>(
    () => pickRandom(sleepTracks)?.id ?? null
  );

  const {
    currentTrack, isPlaying, playTrack, pauseTrack, restartTrack,
    sleepCollection, removeFromCollection, reorderCollection,
    sleepPlaybackMode, setSleepPlaybackMode, setSlotFinishBehavior, setSlotTimer,
    slotTimers, setSlotStopAfterTrack, slotStopAfterTrack, activeSlot,
    requestedTab, setRequestedTab,
  } = useAudio();

  const requestedTabRef = useRef(requestedTab);
  requestedTabRef.current = requestedTab;
  useFocusEffect(
    React.useCallback(() => {
      const req = requestedTabRef.current;
      if (req?.slot.startsWith('sleep')) {
        setActiveTab(req.tab);
        setRequestedTab(null);
      }
    }, [setRequestedTab])
  );

  useEffect(() => {
    if (requestedTab?.slot.startsWith('sleep')) {
      setActiveTab(requestedTab.tab);
      setRequestedTab(null);
    }
  }, [requestedTab, setRequestedTab]);

  const channelTimerSeconds = slotTimers['sleep-channel'];
  const collectionTimerSeconds = slotTimers['sleep-collection'];
  const channelStopAfterTrack = slotStopAfterTrack['sleep-channel'];
  const collectionStopAfterTrack = slotStopAfterTrack['sleep-collection'];

  const selectedTheme = tabThemes[activeTab];

  const prevChannelTrackId = useRef<string | null>(null);
  useEffect(() => {
    if (
      activeSlot === 'sleep-channel' &&
      currentTrack?.category === 'sleep' &&
      currentTrack.id !== prevChannelTrackId.current
    ) {
      prevChannelTrackId.current = currentTrack.id;
      setChannelCardId(currentTrack.id);
    }
  }, [activeSlot, currentTrack]);

  // Unlocked tracks for "All" pool
  const unlockedSleepTracks = useMemo(() =>
    themeUnlocked ? sleepTracks : sleepTracks.filter(t => !LOCKED_SLEEP_THEMES.includes(t.theme)),
    [themeUnlocked]
  );

  const channelFilteredTracks = useMemo(() => {
    if (tabThemes.audio) return sleepTracks.filter(t => t.theme === tabThemes.audio);
    return unlockedSleepTracks;
  }, [tabThemes.audio, unlockedSleepTracks]);

  const filteredTracks = useMemo(() => {
    if (selectedTheme) return sleepTracks.filter(t => t.theme === selectedTheme);
    return unlockedSleepTracks;
  }, [selectedTheme, unlockedSleepTracks]);

  const cardTrack = useMemo(() => {
    const found = channelCardId ? channelFilteredTracks.find(t => t.id === channelCardId) : null;
    return found ?? channelFilteredTracks[0] ?? null;
  }, [channelCardId, channelFilteredTracks]);

  const handleThemeSelect = (theme: string | null) => {
    setTabThemes(prev => ({ ...prev, [activeTab]: theme }));
    if (activeTab === 'audio') {
      const pool = theme ? sleepTracks.filter(t => t.theme === theme) : unlockedSleepTracks;
      const next = pickRandom(pool);
      setChannelCardId(next?.id ?? null);
      if (activeSlot === 'sleep-channel') pauseTrack();
      setSlotTimer('sleep-channel', null);
      setSlotStopAfterTrack('sleep-channel', false);
    }
  };

  const handleLockedThemeTap = (theme: string, pageX: number) => {
    setLockedHint(`Unlocks after ${SLEEP_UNLOCK_COUNT} readings (${readingCount}/${SLEEP_UNLOCK_COUNT}) in Ask`);
    setHintTailPageX(pageX);
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setLockedHint(null), 2500);
  };

  const handleTabChange = (id: string) => {
    setActiveTab(id as 'audio' | 'collection');
  };

  const allCollectionTracks = useMemo(() =>
    sleepCollection.map(id => sleepTracks.find(t => t.id === id)).filter(Boolean) as AudioTrack[],
    [sleepCollection]
  );
  const collectionTracks = useMemo(() =>
    selectedTheme ? allCollectionTracks.filter(t => t.theme === selectedTheme) : allCollectionTracks,
    [allCollectionTracks, selectedTheme]
  );

  const handleNext = async () => {
    const track = pickRandom(channelFilteredTracks, cardTrack?.id);
    if (track) {
      setChannelCardId(track.id);
      await playTrack(track, 'sleep-channel');
    }
  };

  useEffect(() => {
    setSlotFinishBehavior('sleep-channel', { kind: 'channel', tracks: channelFilteredTracks });
  }, [channelFilteredTracks, setSlotFinishBehavior]);

  useEffect(() => {
    setSlotFinishBehavior(
      'sleep-collection',
      collectionTracks.length ? { kind: 'collection', tracks: collectionTracks } : null,
    );
  }, [collectionTracks, setSlotFinishBehavior]);

  const handleModeChange = async (mode: PlaybackMode) => {
    setSleepPlaybackMode(mode);
    if (activeTab !== 'collection' || !collectionTracks.length) return;
    if (mode === 'in_order') {
      await playTrack(collectionTracks[0], 'sleep-collection');
    } else if (mode === 'shuffle') {
      await playTrack(
        collectionTracks[Math.floor(Math.random() * collectionTracks.length)],
        'sleep-collection',
      );
    }
  };

  const handleReorder = (newFilteredOrder: AudioTrack[]) => {
    const filteredIdSet = new Set(collectionTracks.map(t => t.id));
    const queue = newFilteredOrder.map(t => t.id);
    let qi = 0;
    const newFull = allCollectionTracks.map(t => (filteredIdSet.has(t.id) ? queue[qi++] : t.id));
    reorderCollection('sleep', newFull);
  };

  const handleDeleteTrack = (track: AudioTrack) => {
    const message = `Remove "${track.title}" from your collection?`;
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(message)) {
        removeFromCollection(track.id, 'sleep');
      }
      return;
    }
    Alert.alert(
      'Remove from collection',
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeFromCollection(track.id, 'sleep') },
      ]
    );
  };

  const activeSlotKey = activeTab === 'audio'
    ? 'sleep-channel' as const
    : 'sleep-collection' as const;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppBackground />
      <AppHeader
        title="Sleep"
        icon={<Ionicons name="moon-outline" size={androidIconSize(20 * 0.8)} color={colors.gold} />}
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
          mode={sleepPlaybackMode}
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
          {SLEEP_THEMES.map(theme => {
            const isLocked = !themeUnlocked && LOCKED_SLEEP_THEMES.includes(theme);
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
          {SLEEP_THEMES.map(theme => {
            const isLocked = !themeUnlocked && LOCKED_SLEEP_THEMES.includes(theme);
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
            slot="sleep-channel"
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
          slot="sleep-collection"
        />
      )}

      <TimerSheet
        visible={showTimer}
        onClose={() => setShowTimer(false)}
        currentSeconds={slotTimers[activeSlotKey]}
        onSetTimer={(s) => {
          setSlotTimer(activeSlotKey, s);
          const other = activeSlotKey === 'sleep-channel'
            ? 'sleep-collection' as const
            : 'sleep-channel' as const;
          setSlotTimer(other, null);
          setSlotStopAfterTrack(other, false);
        }}
        stopAfterTrack={slotStopAfterTrack[activeSlotKey]}
        onSetStopAfterTrack={(v) => {
          setSlotStopAfterTrack(activeSlotKey, v);
          if (v) {
            const other = activeSlotKey === 'sleep-channel'
              ? 'sleep-collection' as const
              : 'sleep-channel' as const;
            setSlotTimer(other, null);
            setSlotStopAfterTrack(other, false);
          }
        }}
      />

      <FloatingAudioPlayer
        hideSlot={activeTab === 'audio' ? 'sleep-channel' : 'sleep-collection'}
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
          <Ionicons name="moon-outline" size={androidIconSize(44)} color={colors.mutedForeground} />
          <Text style={[styles.emptyCollectionTitle, { color: colors.foreground }]}>Sleep collection empty</Text>
          <Text style={[styles.emptyCollectionSub, { color: colors.mutedForeground }]}>
            Save your favourite sleep sounds here to find them easily at bedtime.
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyCollection}>
        <Ionicons name="filter-outline" size={androidIconSize(44)} color={colors.mutedForeground} />
        <Text style={[styles.emptyCollectionTitle, { color: colors.foreground }]}>No saved sounds in this theme</Text>
        <Text style={[styles.emptyCollectionSub, { color: colors.mutedForeground }]}>
          Try a different theme, or save a sound from this one.
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
  scroll: { paddingTop: 18 },
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
  themeChipText: { fontSize: 10, fontFamily: FONT_BODY_MEDIUM, lineHeight: 13, textAlign: 'center', includeFontPadding: false },
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
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingHorizontal: 40,
  },
  emptyCollectionTitle: { fontSize: 13.5, fontFamily: FONT_BODY_SEMIBOLD, textAlign: 'center' },
  emptyCollectionSub: { fontSize: 11, fontFamily: FONT_BODY_REGULAR, textAlign: 'center', lineHeight: 18 },
  collectionList: { padding: 20, paddingBottom: 100 },
});
