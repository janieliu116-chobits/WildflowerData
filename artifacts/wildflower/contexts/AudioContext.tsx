import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import type { AudioTrack } from '@/constants/data';
import { getDriveStreamUrl } from '@/constants/data';

export type PlaybackMode = 'in_order' | 'shuffle' | 'repeat';

export type AudioSlot =
  | 'meditation-channel'
  | 'meditation-collection'
  | 'sleep-channel'
  | 'sleep-collection';

export type FinishBehavior =
  | { kind: 'channel'; tracks: AudioTrack[] }
  | { kind: 'collection'; tracks: AudioTrack[] }
  | null;

const ALL_SLOTS: AudioSlot[] = [
  'meditation-channel', 'meditation-collection',
  'sleep-channel', 'sleep-collection',
];

const INITIAL_SLOT_TIMERS: Record<AudioSlot, number | null> = {
  'meditation-channel': null,
  'meditation-collection': null,
  'sleep-channel': null,
  'sleep-collection': null,
};
const INITIAL_SLOT_STOP: Record<AudioSlot, boolean> = {
  'meditation-channel': false,
  'meditation-collection': false,
  'sleep-channel': false,
  'sleep-collection': false,
};

interface AudioContextType {
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  category: 'meditation' | 'sleep';
  // Passing a slot marks this as a user-initiated play: other slots' timers
  // and stop-after-track are cleared, and this slot's stored timer countdown
  // starts. Omitting slot (auto-advance) preserves running countdowns.
  playTrack: (track: AudioTrack, slot?: AudioSlot) => Promise<void>;
  pauseTrack: () => Promise<void>;
  resumeTrack: () => Promise<void>;
  // Stops playback, unloads the sound, clears currentTrack + activeSlot, and
  // resets the active slot's timer and stop-after-track flag to "no timer".
  stopTrack: () => Promise<void>;
  playNext: (tracks: AudioTrack[]) => Promise<void>;
  restartTrack: () => Promise<void>;
  meditationPlaybackMode: PlaybackMode;
  setMeditationPlaybackMode: (mode: PlaybackMode) => void;
  sleepPlaybackMode: PlaybackMode;
  setSleepPlaybackMode: (mode: PlaybackMode) => void;
  // Stored timer values per slot. null = no timer set.
  // Setting a value does NOT start the countdown — playTrack does.
  slotTimers: Record<AudioSlot, number | null>;
  setSlotTimer: (slot: AudioSlot, seconds: number | null) => void;
  // "Until track ends" flags — one per slot, independent of slotTimers.
  slotStopAfterTrack: Record<AudioSlot, boolean>;
  setSlotStopAfterTrack: (slot: AudioSlot, value: boolean) => void;
  activeSlot: AudioSlot | null;
  setSlotFinishBehavior: (slot: AudioSlot, behavior: FinishBehavior) => void;
  playbackError: string | null;
  isLoadingTrack: boolean;
  meditationCollection: string[];
  sleepCollection: string[];
  addToCollection: (track: AudioTrack) => Promise<void>;
  removeFromCollection: (trackId: string, category: 'meditation' | 'sleep') => Promise<void>;
  reorderCollection: (category: 'meditation' | 'sleep', orderedIds: string[]) => Promise<void>;
  isInCollection: (trackId: string) => boolean;
  isLoaded: boolean;
  // When the floating mini-player is tapped, it sets this so the destination
  // page knows which sub-tab to switch to on focus.
  requestedTab: { slot: AudioSlot; tab: 'audio' | 'collection' } | null;
  setRequestedTab: (val: { slot: AudioSlot; tab: 'audio' | 'collection' } | null) => void;
  // Keeps the floating player visible after the user pauses via the float
  // itself (as opposed to pausing on the source page before navigating away).
  keepFloatingVisible: boolean;
  setKeepFloatingVisible: (v: boolean) => void;
}

const AudioContext = createContext<AudioContextType | null>(null);
const MED_COLLECTION_KEY = 'wildflower_meditation_collection';
const SLEEP_COLLECTION_KEY = 'wildflower_sleep_collection';

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const playGenRef = useRef(0);
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  // Ref mirror so callbacks (setSlotTimer, etc.) can read the current playing
  // state synchronously without capturing it in their closure dep arrays.
  const isPlayingRef = useRef(false);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  const [category, setCategory] = useState<'meditation' | 'sleep'>('meditation');
  const [meditationPlaybackMode, setMeditationPlaybackMode] = useState<PlaybackMode>('in_order');
  const [sleepPlaybackMode, setSleepPlaybackMode] = useState<PlaybackMode>('in_order');
  const meditationPlaybackModeRef = useRef<PlaybackMode>('in_order');
  const sleepPlaybackModeRef = useRef<PlaybackMode>('in_order');
  // Keep refs in sync inline — React Compiler-safe (avoids TDZ from useEffect hoisting).
  meditationPlaybackModeRef.current = meditationPlaybackMode;
  sleepPlaybackModeRef.current = sleepPlaybackMode;

  // ── Per-slot timer values (stored; countdown starts on playTrack) ────
  const [slotTimers, setSlotTimers] = useState<Record<AudioSlot, number | null>>(INITIAL_SLOT_TIMERS);
  const slotTimerSecondsRef = useRef<Record<AudioSlot, number | null>>({ ...INITIAL_SLOT_TIMERS });
  // Running setTimeout handles — separate from the stored value.
  const slotTimeoutRefs = useRef<Partial<Record<AudioSlot, ReturnType<typeof setTimeout>>>>({});
  // True when the active slot currently has a live countdown running.
  const timerActiveRef = useRef(false);

  // ── Per-slot "until track ends" ──────────────────────────────────────
  const [slotStopAfterTrack, setSlotStopAfterTrackState] = useState<Record<AudioSlot, boolean>>(INITIAL_SLOT_STOP);
  const slotStopAfterTrackRef = useRef<Record<AudioSlot, boolean>>({ ...INITIAL_SLOT_STOP });
  // Internal ref — always reflects the active slot's stop setting.
  const stopAfterCurrentTrackRef = useRef(false);

  const [activeSlot, setActiveSlotState] = useState<AudioSlot | null>(null);
  const activeSlotRef = useRef<AudioSlot | null>(null);

  const finishBehaviorBySlot = useRef<Partial<Record<AudioSlot, FinishBehavior>>>({});
  const handleTrackFinishedRef = useRef<() => void | Promise<void>>(() => {});
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [isLoadingTrack, setIsLoadingTrack] = useState(false);
  const [meditationCollection, setMeditationCollection] = useState<string[]>([]);
  const [sleepCollection, setSleepCollection] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    }).catch(() => {});
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      const [med, sleep] = await Promise.all([
        AsyncStorage.getItem(MED_COLLECTION_KEY),
        AsyncStorage.getItem(SLEEP_COLLECTION_KEY),
      ]);
      if (med) setMeditationCollection(JSON.parse(med));
      if (sleep) setSleepCollection(JSON.parse(sleep));
    } catch (e) {
      console.error('Error loading collections:', e);
    } finally {
      setIsLoaded(true);
    }
  };

  const unloadSound = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch {}
      soundRef.current = null;
    }
    setIsPlaying(false);
  };

  const pauseTrack = useCallback(async () => {
    if (soundRef.current) {
      try { await soundRef.current.pauseAsync(); } catch {}
    }
    setIsPlaying(false);
  }, []);

  // Stops playback, unloads the sound, clears currentTrack + activeSlot, and
  // resets the slot's timer / stop-after-track to "no timer".
  const stopTrack = useCallback(async () => {
    const slot = activeSlotRef.current;
    if (slot) {
      cancelSlotCountdown(slot);
      slotTimerSecondsRef.current = { ...slotTimerSecondsRef.current, [slot]: null };
      setSlotTimers(prev => ({ ...prev, [slot]: null }));
      slotStopAfterTrackRef.current = { ...slotStopAfterTrackRef.current, [slot]: false };
      setSlotStopAfterTrackState(prev => ({ ...prev, [slot]: false }));
    }
    await unloadSound();
    setCurrentTrack(null);
    activeSlotRef.current = null;
    setActiveSlotState(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Helpers to cancel a slot's running countdown ─────────────────────

  const cancelSlotCountdown = (slot: AudioSlot) => {
    const h = slotTimeoutRefs.current[slot];
    if (h) {
      clearTimeout(h);
      delete slotTimeoutRefs.current[slot];
    }
  };

  // Start the countdown for a slot from its stored seconds value.
  // Only called from user-initiated playTrack (slot provided).
  const startSlotCountdown = useCallback((slot: AudioSlot) => {
    cancelSlotCountdown(slot);
    const seconds = slotTimerSecondsRef.current[slot];
    if (seconds == null || seconds <= 0) return;
    slotTimeoutRefs.current[slot] = setTimeout(() => {
      delete slotTimeoutRefs.current[slot];
      slotTimerSecondsRef.current = { ...slotTimerSecondsRef.current, [slot]: null };
      setSlotTimers(prev => ({ ...prev, [slot]: null }));
      if (activeSlotRef.current === slot) {
        timerActiveRef.current = false;
        pauseTrack();
      }
    }, seconds * 1000);
    if (activeSlotRef.current === slot) {
      timerActiveRef.current = true;
    }
  }, [pauseTrack]);

  // ── Public slot-timer API ────────────────────────────────────────────

  const setSlotTimer = useCallback((slot: AudioSlot, seconds: number | null) => {
    cancelSlotCountdown(slot);
    slotTimerSecondsRef.current = { ...slotTimerSecondsRef.current, [slot]: seconds };
    setSlotTimers(prev => ({ ...prev, [slot]: seconds }));
    if (activeSlotRef.current === slot) {
      if (seconds !== null && isPlayingRef.current) {
        // Audio is live on this slot — apply the new timer immediately by
        // starting a fresh countdown from the new duration.
        startSlotCountdown(slot);
      } else {
        // Timer cleared, or audio is paused/stopped — countdown will (re)start
        // on the next user-initiated play.
        timerActiveRef.current = false;
      }
    }
  }, [startSlotCountdown]);

  const setSlotStopAfterTrack = useCallback((slot: AudioSlot, value: boolean) => {
    slotStopAfterTrackRef.current = { ...slotStopAfterTrackRef.current, [slot]: value };
    setSlotStopAfterTrackState(prev => ({ ...prev, [slot]: value }));
    if (activeSlotRef.current === slot) {
      stopAfterCurrentTrackRef.current = value;
    }
  }, []);

  const setSlotFinishBehavior = useCallback((slot: AudioSlot, behavior: FinishBehavior) => {
    finishBehaviorBySlot.current[slot] = behavior;
  }, []);

  // ── Core playback ────────────────────────────────────────────────────

  const playTrack = useCallback(async (track: AudioTrack, slot?: AudioSlot) => {
    const gen = ++playGenRef.current;

    // User-initiated play (slot provided): clear ALL other slots' timers,
    // stop-after-track flags, and running countdowns so icons reset across
    // pages. The new slot keeps its stored values; the countdown starts below.
    if (slot && slot !== activeSlotRef.current) {
      for (const s of ALL_SLOTS) {
        if (s !== slot) cancelSlotCountdown(s);
      }
      const newTimers: Record<AudioSlot, number | null> = {
        ...INITIAL_SLOT_TIMERS,
        [slot]: slotTimerSecondsRef.current[slot],
      };
      const newStop: Record<AudioSlot, boolean> = {
        ...INITIAL_SLOT_STOP,
        [slot]: slotStopAfterTrackRef.current[slot],
      };
      slotTimerSecondsRef.current = newTimers;
      setSlotTimers(newTimers);
      slotStopAfterTrackRef.current = newStop;
      setSlotStopAfterTrackState(newStop);
      activeSlotRef.current = slot;
      setActiveSlotState(slot);
      stopAfterCurrentTrackRef.current = newStop[slot];
      timerActiveRef.current = false; // will be set by startSlotCountdown below
    }

    await unloadSound();
    if (gen !== playGenRef.current) return;

    setCurrentTrack(track);
    setCategory(track.category);
    if (!track.driveFileId) {
      setPlaybackError('This session isn\u2019t available to play yet.');
      setIsPlaying(false);
      return;
    }
    setPlaybackError(null);
    setIsLoadingTrack(true);
    try {
      const url = getDriveStreamUrl(track.driveFileId);
      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true },
      );
      if (gen !== playGenRef.current) {
        // A newer playTrack call is now in charge; leave isLoadingTrack for it.
        try { await sound.unloadAsync(); } catch {}
        return;
      }
      soundRef.current = sound;
      setIsLoadingTrack(false);
      setIsPlaying(true);
      // A fresh play always resets the float-keep flag; visibility is now
      // driven by isPlaying itself.
      setKeepFloatingVisible(false);

      // Start the countdown only for user-initiated plays (slot provided).
      // Auto-advance calls (no slot) let the existing countdown keep running.
      if (slot) {
        startSlotCountdown(slot);
      }

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          handleTrackFinishedRef.current();
        }
      });
    } catch (e) {
      if (gen !== playGenRef.current) return;
      setIsLoadingTrack(false);
      setPlaybackError('Could not play this session. Check your connection and try again.');
      setIsPlaying(false);
      console.error('Error playing audio:', e);
    }
  }, [startSlotCountdown]);

  const resumeTrack = useCallback(async () => {
    if (soundRef.current) {
      try {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded && status.durationMillis != null && status.positionMillis >= status.durationMillis) {
          await soundRef.current.setPositionAsync(0);
        }
        await soundRef.current.playAsync();
      } catch {}
      setIsPlaying(true);
    }
  }, []);

  const restartTrack = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.setPositionAsync(0);
        await soundRef.current.playAsync();
        setIsPlaying(true);
      } catch {}
    } else if (currentTrack) {
      await playTrack(currentTrack);
    }
  }, [currentTrack, playTrack]);

  const playNext = useCallback(async (tracks: AudioTrack[]) => {
    if (!tracks.length) return;
    const mode = activeSlotRef.current?.startsWith('sleep')
      ? sleepPlaybackModeRef.current
      : meditationPlaybackModeRef.current;
    if (mode === 'repeat' && currentTrack) {
      await restartTrack();
      return;
    }
    let nextTrack: AudioTrack;
    if (mode === 'shuffle') {
      const pool = tracks.length > 1 ? tracks.filter(t => t.id !== currentTrack?.id) : tracks;
      nextTrack = pool[Math.floor(Math.random() * pool.length)];
    } else {
      const idx = tracks.findIndex(t => t.id === currentTrack?.id);
      nextTrack = tracks[(idx + 1) % tracks.length];
    }
    await playTrack(nextTrack);
  }, [currentTrack, playTrack, restartTrack]);

  useEffect(() => {
    handleTrackFinishedRef.current = async () => {
      const slot = activeSlotRef.current;
      const behavior = slot ? (finishBehaviorBySlot.current[slot] ?? null) : null;

      if (stopAfterCurrentTrackRef.current) {
        // Explicitly pause then seek to 0 — calling setPositionAsync alone can
        // restart the sound on some platforms because the sound object's
        // internal shouldPlay flag is still true after a natural finish.
        if (soundRef.current) {
          try {
            await soundRef.current.pauseAsync();
            await soundRef.current.setPositionAsync(0);
          } catch {}
        }
        // Reset the "until track ends" flag so the timer indicator goes back
        // to "no timer" and won't fire again on a subsequent manual play.
        stopAfterCurrentTrackRef.current = false;
        if (slot) {
          slotStopAfterTrackRef.current = { ...slotStopAfterTrackRef.current, [slot]: false };
          setSlotStopAfterTrackState(prev => ({ ...prev, [slot]: false }));
        }
        setIsPlaying(false);
        return;
      }

      if (behavior?.kind === 'channel') {
        if (timerActiveRef.current) {
          await restartTrack();
          return;
        }
        if (behavior.tracks.length > 0) {
          const others = behavior.tracks.filter(t => t.id !== currentTrack?.id);
          const pool = others.length > 0 ? others : behavior.tracks;
          await playTrack(pool[Math.floor(Math.random() * pool.length)]);
          return;
        }
        if (soundRef.current) try { await soundRef.current.setPositionAsync(0); } catch {}
        setIsPlaying(false);
        return;
      }

      if (behavior?.kind === 'collection' && behavior.tracks.length > 0) {
        const collMode = slot?.startsWith('sleep')
          ? sleepPlaybackModeRef.current
          : meditationPlaybackModeRef.current;
        if (collMode === 'repeat') {
          await restartTrack();
          return;
        }
        if (collMode === 'shuffle') {
          // Exclude the just-finished track so the same one is never played
          // back-to-back (fall back to full list if only one track exists).
          const pool = behavior.tracks.length > 1
            ? behavior.tracks.filter(t => t.id !== currentTrack?.id)
            : behavior.tracks;
          await playTrack(pool[Math.floor(Math.random() * pool.length)]);
          return;
        }
        const idx = behavior.tracks.findIndex(t => t.id === currentTrack?.id);
        const startIdx = idx === -1 ? 0 : idx + 1;
        // Always wrap around — "in order" loops continuously regardless of
        // whether a timer is active, matching the "no timer → loop" requirement.
        await playTrack(behavior.tracks[startIdx % behavior.tracks.length]);
        return;
      }

      if (soundRef.current) {
        try { await soundRef.current.setPositionAsync(0); } catch {}
      }
      setIsPlaying(false);
    };
  });

  const addToCollection = useCallback(async (track: AudioTrack) => {
    if (track.category === 'meditation') {
      const updated = [...meditationCollection.filter(id => id !== track.id), track.id];
      setMeditationCollection(updated);
      await AsyncStorage.setItem(MED_COLLECTION_KEY, JSON.stringify(updated));
    } else {
      const updated = [...sleepCollection.filter(id => id !== track.id), track.id];
      setSleepCollection(updated);
      await AsyncStorage.setItem(SLEEP_COLLECTION_KEY, JSON.stringify(updated));
    }
  }, [meditationCollection, sleepCollection]);

  const removeFromCollection = useCallback(async (trackId: string, cat: 'meditation' | 'sleep') => {
    if (cat === 'meditation') {
      const updated = meditationCollection.filter(id => id !== trackId);
      setMeditationCollection(updated);
      await AsyncStorage.setItem(MED_COLLECTION_KEY, JSON.stringify(updated));
    } else {
      const updated = sleepCollection.filter(id => id !== trackId);
      setSleepCollection(updated);
      await AsyncStorage.setItem(SLEEP_COLLECTION_KEY, JSON.stringify(updated));
    }
  }, [meditationCollection, sleepCollection]);

  const reorderCollection = useCallback(async (cat: 'meditation' | 'sleep', orderedIds: string[]) => {
    if (cat === 'meditation') {
      setMeditationCollection(orderedIds);
      await AsyncStorage.setItem(MED_COLLECTION_KEY, JSON.stringify(orderedIds));
    } else {
      setSleepCollection(orderedIds);
      await AsyncStorage.setItem(SLEEP_COLLECTION_KEY, JSON.stringify(orderedIds));
    }
  }, []);

  const isInCollection = useCallback((trackId: string) => {
    return meditationCollection.includes(trackId) || sleepCollection.includes(trackId);
  }, [meditationCollection, sleepCollection]);

  const [requestedTab, setRequestedTab] = useState<{ slot: AudioSlot; tab: 'audio' | 'collection' } | null>(null);
  const [keepFloatingVisible, setKeepFloatingVisible] = useState(false);

  return (
    <AudioContext.Provider value={{
      currentTrack, isPlaying, isLoadingTrack, category,
      playTrack, pauseTrack, resumeTrack, stopTrack, playNext, restartTrack,
      meditationPlaybackMode, setMeditationPlaybackMode,
      sleepPlaybackMode, setSleepPlaybackMode,
      slotTimers, setSlotTimer,
      slotStopAfterTrack, setSlotStopAfterTrack,
      activeSlot,
      setSlotFinishBehavior,
      playbackError,
      meditationCollection, sleepCollection,
      addToCollection, removeFromCollection, reorderCollection, isInCollection,
      isLoaded,
      requestedTab, setRequestedTab,
      keepFloatingVisible, setKeepFloatingVisible,
    }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error('useAudio must be used within AudioProvider');
  return ctx;
}
