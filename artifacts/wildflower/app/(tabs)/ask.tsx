import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Animated, FlatList, Image, Keyboard, KeyboardAvoidingView,
  Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, Modal,
  useWindowDimensions,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useProfiles, type Profile } from '@/contexts/ProfileContext';
import { useReadingCount } from '@/contexts/ReadingCountContext';
import AppHeader from '@/components/AppHeader';
import AppBackground from '@/components/AppBackground';
import FloatingAudioPlayer from '@/components/FloatingAudioPlayer';
import BottomSheet from '@/components/BottomSheet';
import CardDisplay, { CardRow, DiceDisplay, FiveCardSpread, getCardImageUrl, type CardData } from '@/components/CardDisplay';
import { ChooseProfileSheet } from '@/components/ProfileSheet';
import AdPlaceholder from '@/components/AdPlaceholder';
import NatalChartSVG from '@/components/NatalChartSVG';
import {
  ALL_TAROT_CARDS, LENORMAND_CARDS, ASTRODICE_PLANETS,
  ASTRODICE_SIGNS, ASTRODICE_HOUSES, PLAY_MODES, type PlayModeId,
} from '@/constants/data';
import { FONT_BODY_MEDIUM, FONT_BODY_REGULAR, FONT_BODY_SEMIBOLD, FONT_HEADING_SEMIBOLD } from '@/constants/fonts';
import { getAIInterpretation } from '@/utils/gemini';
import { computeNatalChartForProfile, type NatalChart } from '@/utils/astrology';
import { createStyles, androidIconSize } from '@/utils/responsiveStyles';
import {
  requestNotificationPermission,
  scheduleDailyNotification,
  cancelDailyNotification,
  saveNotificationSettings,
  getNotificationSettings,
  NOTIF_PROMPTED_KEY,
} from '@/utils/notifications';

// ─── Typing indicator (animated dots) ─────────────────────────────────────────
function TypingDots({ color }: { color: string }) {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  useEffect(() => {
    const anims = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 180),
          Animated.timing(dot, { toValue: 1, duration: 280, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 280, useNativeDriver: true }),
          Animated.delay(900 - i * 180),
        ])
      )
    );
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, []);
  return (
    <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center', paddingHorizontal: 2, paddingVertical: 2 }}>
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: color, opacity: dot }}
        />
      ))}
    </View>
  );
}

// ─── Minor Arcana meaning helpers ─────────────────────────────────────────────
const SUIT_UPRIGHT: Record<string, string> = {
  Wands: 'inspiration, ambition, creativity, and passionate action.',
  Cups: 'emotions, relationships, intuition, and the heart.',
  Swords: 'intellect, conflict, truth, and mental clarity.',
  Pentacles: 'material matters, work, resources, and physical reality.',
};
const SUIT_REVERSED: Record<string, string> = {
  Wands: 'blocked creativity, burnout, or scattered energy.',
  Cups: 'emotional imbalance, withdrawal, or repressed feelings.',
  Swords: 'confusion, dishonesty, mental conflict, or avoidance.',
  Pentacles: 'financial worry, materialism, or neglect of practical needs.',
};
const PIP_UPRIGHT: Record<string, string> = {
  Ace: 'A pure seed of',
  Two: 'A balance point in',
  Three: 'Initial growth in',
  Four: 'Stability within',
  Five: 'Challenge and conflict in',
  Six: 'Harmony and generosity in',
  Seven: 'Strategy and assessment in',
  Eight: 'Movement and momentum in',
  Nine: 'Nearing completion in',
  Ten: 'Culmination and fullness of',
  Page: 'Curious, eager apprentice energy in',
  Knight: 'Bold, action-oriented force in',
  Queen: 'Mature, nurturing mastery of',
  King: 'Authoritative, commanding command of',
};
function getMinorMeaning(card: CardData, reversed: boolean): string {
  const parts = card.name.split(' of ');
  if (parts.length < 2) return '';
  const pip = parts[0];
  const suit = parts[1];
  if (reversed) return `${PIP_UPRIGHT[pip] ?? pip} ${SUIT_REVERSED[suit] ?? suit}`;
  return `${PIP_UPRIGHT[pip] ?? pip} ${SUIT_UPRIGHT[suit] ?? suit}`;
}
function getCardMeaning(card: CardData, isReversed: boolean): string {
  if (isReversed) {
    // card.reversed is the reversed meaning string (Major Arcana)
    if (card.reversed && typeof card.reversed === 'string') return card.reversed;
    return getMinorMeaning(card, true);
  }
  if (card.upright) return card.upright;
  if (card.meaning) return card.meaning;
  return getMinorMeaning(card, false);
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  question?: string;
  cards?: any[];
  deckKind?: 'tarot' | 'lenormand';
  cardLabels?: string[];
  dice?: { planet: any; sign: any; house: any };
  loading?: boolean;
  typing?: boolean; // true while the 2-second typing indicator is shown
  timestamp: number;
  mode?: PlayModeId;
  contextProfiles?: { profile1: Profile | null; profile2: Profile | null };
  // Whether the user has already watched the unlock ad for this reading.
  // Once true, reopening "Check Interpretation" (including from chat
  // history after an app restart) skips the ad and just reads the
  // interpretation text already stored below — no re-fetch from Gemini.
  unlocked?: boolean;
  // The Gemini request is deferred until the user first taps "Check
  // Interpretation" and watches the unlock ad — these two fields are the
  // prompt + context captured at send time so that later fetch uses
  // exactly what was true when the question was asked, regardless of any
  // profile/mode changes made afterward.
  interpretPrompt?: string;
  interpretContext?: string;
  modeLabel?: string;
}

const MESSAGES_STORAGE_KEY = 'wildflower_ask_messages';

function formatMessageTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

const ASTRO_MODES: PlayModeId[] = ['astro_individual', 'astro_compatibility'];


export default function AskScreen() {
  const colors = useColors();
  const { selfProfile, profiles } = useProfiles();
  const { readingCount, incrementReadingCount } = useReadingCount();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [playMode, setPlayMode] = useState<PlayModeId>('tarot_spread');
  const [showModeSheet, setShowModeSheet] = useState(false);
  const [showProfilePicker, setShowProfilePicker] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'p1' | 'p2'>('p1');
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(selfProfile);
  const [selectedProfile2, setSelectedProfile2] = useState<Profile | null>(null);
  const [interpretationModal, setInterpretationModal] = useState<Message | null>(null);
  const [pendingAdMessage, setPendingAdMessage] = useState<Message | null>(null);
  const [fetchingInterpretation, setFetchingInterpretation] = useState(false);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const [detailItem, setDetailItem] = useState<{
    name: string;
    label?: string;
    isReversed?: boolean;
    isTarot?: boolean;
    imageUrl?: string;
    symbol?: string;
    color?: string;
    uprightMeaning?: string;
    reversedMeaning?: string;
    meaning?: string; // non-tarot cards / dice
  } | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const { width: windowWidth } = useWindowDimensions();
  const viewShotRef = useRef<any>(null);
  const listRef = useRef<FlatList>(null);
  // Capture readingCount in a ref so the async close handler always reads the
  // latest value without needing to be recreated on every count change.
  const readingCountRef = useRef(readingCount);
  useEffect(() => { readingCountRef.current = readingCount; }, [readingCount]);

  // Called whenever the "Your Reading" modal is dismissed. On the very first
  // reading (count just became 1) and only once ever, it shows a system
  // notification-permission prompt before closing.
  const handleCloseInterpretationModal = async () => {
    setInterpretationModal(null);
    if (Platform.OS === 'web') return;
    try {
      const alreadyPrompted = await AsyncStorage.getItem(NOTIF_PROMPTED_KEY);
      if (alreadyPrompted || readingCountRef.current !== 1) return;
      // Mark as prompted immediately so a rapid double-tap can't show it twice.
      await AsyncStorage.setItem(NOTIF_PROMPTED_KEY, '1');
      Alert.alert(
        'Daily reminder',
        'Would you like Wildflower to send you a daily reminder to check in with yourself?',
        [
          {
            text: 'Yes',
            onPress: async () => {
              const granted = await requestNotificationPermission();
              const { hour } = await getNotificationSettings();
              if (granted) {
                await scheduleDailyNotification(hour, 0);
                await saveNotificationSettings(true, hour);
              } else {
                await saveNotificationSettings(false, hour);
              }
            },
          },
          {
            text: 'No',
            style: 'cancel',
            onPress: async () => {
              await cancelDailyNotification();
              const { hour } = await getNotificationSettings();
              await saveNotificationSettings(false, hour);
            },
          },
        ],
      );
    } catch (_) {}
  };

  const handleClearHistory = () => {
    const doClear = () => {
      setMessages([]);
      AsyncStorage.removeItem(MESSAGES_STORAGE_KEY).catch(e =>
        console.error('Error clearing chat history:', e)
      );
    };
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Clear all reading history? This cannot be undone.')) {
        doClear();
      }
      return;
    }
    Alert.alert(
      'Clear history',
      'Remove all past readings? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: doClear },
      ]
    );
  };

  const currentMode = PLAY_MODES.find(m => m.id === playMode) ?? PLAY_MODES[0];
  const isAstroMode = ASTRO_MODES.includes(playMode);
  const isCompatMode = playMode === 'astro_compatibility';

  // Restore chat history (including already-fetched interpretation text and
  // unlock state) so re-opening an old reading never re-hits Gemini or
  // re-shows the ad.
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(MESSAGES_STORAGE_KEY);
        if (raw) {
          setMessages(JSON.parse(raw));
        }
      } catch (e) {
        console.error('Error loading chat history:', e);
      } finally {
        setMessagesLoaded(true);
      }
    })();
  }, []);

  // Persist chat history whenever it changes. Skip messages still mid-flight
  // (loading) so a killed app doesn't resurrect a permanently spinning bubble.
  useEffect(() => {
    if (!messagesLoaded) return;
    const toPersist = messages.filter(m => !m.loading);
    AsyncStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(toPersist)).catch(e => {
      console.error('Error saving chat history:', e);
    });
  }, [messages, messagesLoaded]);

  const randomCards = (deck: any[], count: number) =>
    [...deck].sort(() => Math.random() - 0.5).slice(0, count);

  const buildContext = () => {
    if (isCompatMode) {
      const p1 = selectedProfile ?? selfProfile;
      const p2 = selectedProfile2;
      if (!p1 || !p2) return 'Missing one or both profiles for compatibility reading.';
      const d1 = new Date(p1.birthDate);
      const d2 = new Date(p2.birthDate);
      return `Person 1: ${p1.name}, born ${d1.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}, ${p1.birthCity || 'unknown location'}. Person 2: ${p2.name}, born ${d2.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}, ${p2.birthCity || 'unknown location'}.`;
    }
    if (playMode === 'astro_individual') {
      const profile = selectedProfile ?? selfProfile;
      if (!profile) return 'No birth data available.';
      const d = new Date(profile.birthDate);
      return `Person: ${profile.name}, born ${d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}, ${profile.birthCity || 'unknown location'}.`;
    }
    // Tarot, Lenormand, and AstroDice readings are self-contained — they
    // don't need a birth-data profile to produce a meaningful reading, so
    // no profile context is required (and none is mentioned, to avoid
    // steering Gemini toward talking about "missing birth data" instead of
    // actually interpreting the cards/dice drawn below).
    return '';
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (isCompatMode && (!selectedProfile2 || (selectedProfile ?? selfProfile)?.id === selectedProfile2?.id)) {
      return;
    }
    if (!text) {
      return;
    }
    Keyboard.dismiss();
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    let cards: any[] | undefined;
    let deckKind: 'tarot' | 'lenormand' | undefined;
    let cardLabels: string[] | undefined;
    let dice: any | undefined;
    let context = buildContext();

    if (playMode === 'tarot_spread') {
      cards = randomCards(ALL_TAROT_CARDS, 3).map(c => ({ ...c, drawnReversed: Math.random() < 0.5 }));
      deckKind = 'tarot';
      cardLabels = ['Past', 'Present', 'Future'];
      context += ` Cards drawn: Past="${cards[0].name}"${cards[0].drawnReversed ? ' (reversed)' : ''}, Present="${cards[1].name}"${cards[1].drawnReversed ? ' (reversed)' : ''}, Future="${cards[2].name}"${cards[2].drawnReversed ? ' (reversed)' : ''}.`;
    } else if (playMode === 'tarot_5card') {
      cards = randomCards(ALL_TAROT_CARDS, 5).map(c => ({ ...c, drawnReversed: Math.random() < 0.5 }));
      deckKind = 'tarot';
      cardLabels = ['Potential', 'Past', 'Present', 'Future', 'Reason'];
      context += ` Five-card spread: Potential="${cards[0].name}"${cards[0].drawnReversed ? ' (reversed)' : ''}, Past="${cards[1].name}"${cards[1].drawnReversed ? ' (reversed)' : ''}, Present="${cards[2].name}"${cards[2].drawnReversed ? ' (reversed)' : ''}, Future="${cards[3].name}"${cards[3].drawnReversed ? ' (reversed)' : ''}, Reason="${cards[4].name}"${cards[4].drawnReversed ? ' (reversed)' : ''}.`;
    } else if (playMode === 'lenormand') {
      cards = randomCards(LENORMAND_CARDS, 3);
      deckKind = 'lenormand';
      context += ` Lenormand cards: "${cards[0].name}", "${cards[1].name}", "${cards[2].name}".`;
    } else if (playMode === 'astrodice') {
      const planet = ASTRODICE_PLANETS[Math.floor(Math.random() * ASTRODICE_PLANETS.length)];
      const sign = ASTRODICE_SIGNS[Math.floor(Math.random() * ASTRODICE_SIGNS.length)];
      const house = ASTRODICE_HOUSES[Math.floor(Math.random() * ASTRODICE_HOUSES.length)];
      dice = { planet, sign, house };
      context += ` AstroDice: ${planet.name} in ${sign.name} in ${house.name}.`;
    }

    const now = Date.now();
    const userMsg: Message | null = text ? {
      id: now.toString(),
      role: 'user',
      text,
      timestamp: now,
    } : null;
    // The response bubble appears immediately in its "ready to unlock"
    // state — no Gemini request goes out yet. The prompt/context/mode are
    // captured now so the actual API call (deferred until the user watches
    // the unlock ad from "Check Interpretation") uses exactly what was true
    // at send time.
    const assistantMsg: Message = {
      id: `${now}_assistant`,
      role: 'assistant',
      text: '',
      question: text || undefined,
      cards,
      deckKind,
      cardLabels,
      dice,
      loading: false,
      timestamp: now,
      mode: playMode,
      contextProfiles: isAstroMode ? {
        profile1: selectedProfile ?? selfProfile ?? null,
        profile2: isCompatMode ? selectedProfile2 : null,
      } : undefined,
      interpretPrompt: text || `Give me a ${currentMode.label} reading.`,
      interpretContext: context,
      modeLabel: currentMode.label,
    };

    // Show the user message immediately, add a typing bubble, then after 2 s
    // replace it with the cards + response bubble.
    const typingId = `${now}_typing`;
    const typingMsg: Message = { id: typingId, role: 'assistant', text: '', timestamp: now, typing: true };
    const withUser = userMsg ? [...messages, userMsg, typingMsg] : [...messages, typingMsg];
    setMessages(withUser);
    setInputText('');
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);

    setTimeout(() => {
      setMessages(prev => [...prev.filter(m => m.id !== typingId), assistantMsg]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }, 1500);
  };

  const openPicker = (target: 'p1' | 'p2') => {
    setPickerTarget(target);
    setShowProfilePicker(true);
  };

  const handleCheckInterpretation = (item: Message) => {
    if (item.unlocked) {
      // Already unlocked (previously watched the ad) — read straight from
      // the stored text, no ad and no Gemini call.
      setInterpretationModal(item);
    } else {
      setPendingAdMessage(item);
    }
  };

  const handleProfileSelect = (profile: Profile) => {
    if (pickerTarget === 'p1') {
      if (profile.id === selectedProfile2?.id) return;
      setSelectedProfile(profile);
    } else {
      if (profile.id === (selectedProfile ?? selfProfile)?.id) return;
      setSelectedProfile2(profile);
    }
  };

  const openCardDetail = (card: CardData, label?: string, deckKind?: 'tarot' | 'lenormand') => {
    const isReversed = !!card.drawnReversed;
    const isTarot = deckKind === 'tarot' || !!card.upright;
    // Build upright + reversed sections so the popup always shows both sides.
    const uprightMeaning = card.upright || getMinorMeaning(card, false) || (card as any).meaning || card.name;
    const reversedMeaning = (card.reversed && typeof card.reversed === 'string')
      ? card.reversed
      : getMinorMeaning(card, true);
    const nonTarotMeaning = (card as any).meaning || (card as any).description || card.name;
    const imageUrl = getCardImageUrl(card.name, deckKind) ?? undefined;
    setDetailItem({
      name: card.name,
      label,
      isReversed,
      isTarot,
      imageUrl,
      symbol: (card as any).symbol,
      color: (card as any).color,
      uprightMeaning: isTarot ? uprightMeaning : undefined,
      reversedMeaning: isTarot ? reversedMeaning : undefined,
      meaning: !isTarot ? nonTarotMeaning : undefined,
    });
  };

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyQuestion = async (item: Message) => {
    await Clipboard.setStringAsync(item.text);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(id => (id === item.id ? null : id)), 1500);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    if (item.role === 'user') {
      const copied = copiedId === item.id;
      return (
        <View style={styles.userMsgContainer}>
          <Pressable
            onLongPress={() => handleCopyQuestion(item)}
            delayLongPress={350}
            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
          >
            <View style={[styles.userBubble, { backgroundColor: colors.gold + '33', borderColor: colors.gold + '66' }]}>
              <Text style={[styles.userText, { color: colors.foreground }]}>{item.text}</Text>
            </View>
          </Pressable>
          <View style={styles.userMsgMeta}>
            {copied && (
              <Text style={[styles.copiedHint, { color: colors.gold }]}>Copied</Text>
            )}
            <Text style={[styles.msgTimestamp, { color: colors.mutedForeground }]}>{formatMessageTime(item.timestamp)}</Text>
          </View>
        </View>
      );
    }

    // Typing indicator bubble
    if (item.typing) {
      return (
        <View style={styles.aiBubbleContainer}>
          <View style={[styles.aiBubble, styles.typingBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TypingDots color={colors.gold} />
          </View>
        </View>
      );
    }

    const is5Card = item.mode === 'tarot_5card';

    if (item.loading) {
      return (
        <View style={styles.aiBubbleContainer}>
          {item.cards && (
            <View style={styles.cardsRow}>
              {is5Card
                ? <FiveCardSpread cards={item.cards} deckKind={item.deckKind} size="small" />
                : <CardRow cards={item.cards} labels={item.cardLabels} deckKind={item.deckKind} size="small" />}
            </View>
          )}
          {item.dice && (
            <View style={styles.diceContainer}>
              <DiceDisplay planet={item.dice.planet} sign={item.dice.sign} house={item.dice.house} size={56 * 1.3} />
            </View>
          )}
          <View style={[styles.aiBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ActivityIndicator size="small" color={colors.gold} />
          </View>
        </View>
      );
    }

    return (
      <View style={styles.aiBubbleContainer}>
        {item.cards && (
          <View style={styles.cardsRow}>
            {is5Card
              ? <FiveCardSpread cards={item.cards} deckKind={item.deckKind} size="small" onCardPress={(card, i) => openCardDetail(card, item.cardLabels?.[i], item.deckKind)} />
              : <CardRow cards={item.cards} labels={item.cardLabels} deckKind={item.deckKind} size="small" onCardPress={(card, i) => openCardDetail(card, item.cardLabels?.[i], item.deckKind)} />}
          </View>
        )}
        {item.dice && (
          <View style={styles.diceContainer}>
            <DiceDisplay
              planet={item.dice.planet} sign={item.dice.sign} house={item.dice.house} size={56 * 1.3}
              onPlanetPress={() => setDetailItem({ name: item.dice!.planet.name, symbol: item.dice!.planet.symbol, color: item.dice!.planet.color, meaning: item.dice!.planet.description ?? `${item.dice!.planet.name} governs themes of ${item.dice!.planet.name.toLowerCase()} in your life.` })}
              onSignPress={() => setDetailItem({ name: item.dice!.sign.name, symbol: item.dice!.sign.symbol, color: item.dice!.sign.color, meaning: item.dice!.sign.description ?? `${item.dice!.sign.name} brings its qualities to the reading.` })}
              onHousePress={() => setDetailItem({ name: item.dice!.house.name, symbol: String(item.dice!.house.number), color: '#C9A84C', meaning: item.dice!.house.meaning })}
            />
          </View>
        )}
        <Text style={[styles.aiDecor, { color: colors.gold }]}>✦</Text>
        <Pressable
          onPress={() => handleCheckInterpretation(item)}
          style={({ pressed }) => [styles.aiBubble, { backgroundColor: colors.card, borderColor: colors.gold + '55', opacity: pressed ? 0.85 : 1 }]}
        >
          <Ionicons name="sparkles" size={androidIconSize(16)} color={colors.gold} style={{ marginBottom: 6 }} />
          <Text style={[styles.aiHiddenText, { color: colors.mutedForeground }]}>{item.unlocked ? 'Your reading is ready' : 'Your reading is almost ready'}</Text>
          <View style={[styles.checkBtn, { borderColor: colors.gold }]}>
            <Text style={[styles.checkBtnText, { color: colors.gold }]}>{item.unlocked ? 'Check Reading' : 'Watch Ad to Unlock Reading'}</Text>
          </View>
        </Pressable>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <AppBackground />
      <AppHeader
        title="Ask"
        icon={<Ionicons name="chatbubble-outline" size={androidIconSize(20 * 0.8)} color={colors.gold} />}
      />

      <View style={[styles.disclaimerBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.disclaimerText, { color: colors.mutedForeground }]}>
          {'For reflection and entertainment only — not a substitute for professional advice.'}
          {messages.length > 0 && (
            <Text
              onPress={handleClearHistory}
              style={[styles.disclaimerClear, { color: colors.gold }]}
            >{' Clear history'}</Text>
          )}
        </Text>
      </View>

      {/* Messages */}
      {messages.length === 0 ? (
        <EmptyAskState colors={colors} mode={currentMode} isCompatMode={isCompatMode} onPrompt={(text: string) => { setInputText(text); }} />
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => listRef.current?.scrollToEnd()}
        />
      )}

      {/* Mode + Profile selectors — sits directly above the question input */}
      <View style={[styles.controlsRow, { borderTopColor: colors.border }]}>
        <Pressable
          onPress={() => setShowModeSheet(true)}
          style={({ pressed }) => [styles.modeBtn, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
        >
          <Ionicons name="shuffle-outline" size={androidIconSize(15)} color={colors.gold} />
          <Text style={[styles.modeBtnText, { color: colors.gold }]} numberOfLines={1}>{currentMode.label}</Text>
          {!isCompatMode && <Ionicons name="chevron-down" size={androidIconSize(13)} color={colors.gold} />}
        </Pressable>
        {isAstroMode && (
          <Pressable
            onPress={() => openPicker('p1')}
            style={({ pressed }) => [styles.profileBtn, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
          >
            <View style={[styles.miniAvatar, { backgroundColor: colors.gold + '33', borderColor: colors.gold + '55' }]}>
              <Text style={[styles.miniAvatarText, { color: colors.gold }]}>
                {(selectedProfile ?? selfProfile)?.name?.charAt(0) ?? '?'}
              </Text>
            </View>
            <Text style={[styles.profileBtnText, { color: colors.foreground }]} numberOfLines={1}>
              {(selectedProfile ?? selfProfile)?.name ?? 'Select'}
            </Text>
            <Ionicons name="chevron-down" size={androidIconSize(13)} color={colors.mutedForeground} />
          </Pressable>
        )}
        {isCompatMode && (
          <Pressable
            onPress={() => openPicker('p2')}
            style={({ pressed }) => [styles.profileBtn, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
          >
            <View style={[styles.miniAvatar, { backgroundColor: '#6495ED33', borderColor: '#6495ED66' }]}>
              <Text style={[styles.miniAvatarText, { color: '#6495ED' }]}>
                {selectedProfile2?.name?.charAt(0) ?? '?'}
              </Text>
            </View>
            <Text style={[styles.profileBtnText, { color: colors.foreground }]} numberOfLines={1}>
              {selectedProfile2?.name ?? 'Choose 2nd'}
            </Text>
            <Ionicons name="chevron-down" size={androidIconSize(13)} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>

      {/* Input bar */}
      <View style={[styles.inputBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder={
            playMode === 'astrodice' ? 'Ask a question to roll the dice...' :
            isCompatMode ? 'Ask about the relationship...' :
            'Ask a question...'
          }
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
          multiline
          returnKeyType="send"
          blurOnSubmit
          onSubmitEditing={handleSend}
        />
        <Pressable
          onPress={handleSend}
          disabled={
            (isCompatMode && (!selectedProfile2 || (selectedProfile ?? selfProfile)?.id === selectedProfile2?.id)) ||
            !inputText.trim()
          }
          style={({ pressed }) => [
            styles.sendBtn,
            {
              backgroundColor: colors.gold,
              opacity: (pressed || (isCompatMode && !selectedProfile2) || !inputText.trim()) ? 0.5 : 1,
            },
          ]}
        >
          <Ionicons
            name={playMode === 'astrodice' ? 'dice' : 'arrow-up'}
            size={androidIconSize(20 * 0.5 * 1.3)}
            color={colors.background}
            style={{ textAlign: 'center', includeFontPadding: false }}
          />
        </Pressable>
      </View>

      {/* Play mode sheet */}
      <BottomSheet visible={showModeSheet} onClose={() => setShowModeSheet(false)}>
        <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
          <View style={{ paddingHorizontal: 20 }}>
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Choose Reading Mode</Text>
            {PLAY_MODES.map(mode => (
              <Pressable
                key={mode.id}
                onPress={() => { setPlayMode(mode.id); setShowModeSheet(false); }}
                style={({ pressed }) => [
                  styles.modeOption,
                  { backgroundColor: playMode === mode.id ? colors.gold + '22' : colors.cardElevated, borderColor: playMode === mode.id ? colors.gold : colors.border, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Text style={[styles.modeOptionTitle, { color: playMode === mode.id ? colors.gold : colors.foreground }]}>{mode.label}</Text>
                <Text style={[styles.modeOptionDesc, { color: colors.mutedForeground }]}>{mode.description}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </BottomSheet>

      <ChooseProfileSheet
        visible={showProfilePicker}
        onClose={() => setShowProfilePicker(false)}
        onSelect={handleProfileSelect}
        selected={pickerTarget === 'p1' ? (selectedProfile?.id ?? selfProfile?.id) : selectedProfile2?.id}
        excludeId={pickerTarget === 'p1' ? selectedProfile2?.id : (selectedProfile ?? selfProfile)?.id}
        forceSelfOnCreate={!selfProfile && pickerTarget === 'p1'}
      />

      {/* Full interpretation modal */}
      <Modal
        visible={!!interpretationModal}
        animationType="fade"
        transparent
        onRequestClose={handleCloseInterpretationModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.gold + '55' }]}>
            {/* Header row: centered title + share icon */}
            <View style={styles.modalHeaderRow}>
              <View style={{ width: 28.6 }} />
              <Text style={[styles.modalTitle, { flex: 1, marginBottom: 0 }, { color: colors.gold }]}>Your Reading</Text>
              {Platform.OS !== 'web' ? (
                <Pressable
                  onPress={async () => {
                    if (isSharing) return;
                    try {
                      setIsSharing(true);
                      await new Promise(r => setTimeout(r, 80));
                      const uri = await viewShotRef.current?.capture?.();
                      if (uri) await Sharing.shareAsync(uri, { mimeType: 'image/jpeg' });
                    } catch (e) {
                      console.error('Share failed:', e);
                    } finally {
                      setIsSharing(false);
                    }
                  }}
                  style={({ pressed }) => [styles.modalShareCircle, { borderColor: colors.gold + '88', backgroundColor: colors.card, opacity: pressed || isSharing ? 0.7 : 1 }]}
                >
                  <Ionicons name="share-outline" size={androidIconSize(11 * 0.8)} color={colors.gold} />
                </Pressable>
              ) : (
                <View style={{ width: 28.6 }} />
              )}
            </View>
            {/* Scrollable reading content */}
            <ScrollView style={{ flex: 1, minHeight: 0 }} showsVerticalScrollIndicator={false}>
              {interpretationModal?.question && (
                <View style={[styles.modalQuestionBox, { backgroundColor: colors.gold + '1a', borderColor: colors.gold + '44' }]}>
                  <Text style={[styles.modalQuestionText, { color: colors.foreground }]}>{interpretationModal.question}</Text>
                </View>
              )}
              {interpretationModal?.cards && (
                <View style={[styles.cardsRow, { marginBottom: 14 }]}>
                  {interpretationModal.mode === 'tarot_5card'
                    ? <FiveCardSpread cards={interpretationModal.cards} deckKind={interpretationModal.deckKind} size="small" onCardPress={(card, i) => openCardDetail(card, interpretationModal.cardLabels?.[i], interpretationModal.deckKind)} />
                    : <CardRow cards={interpretationModal.cards} labels={interpretationModal.cardLabels} deckKind={interpretationModal.deckKind} size="small" onCardPress={(card, i) => openCardDetail(card, interpretationModal.cardLabels?.[i], interpretationModal.deckKind)} />}
                </View>
              )}
              {interpretationModal?.dice && (
                <View style={[styles.diceContainer, { marginBottom: 14 }]}>
                  <DiceDisplay
                    planet={interpretationModal.dice.planet} sign={interpretationModal.dice.sign} house={interpretationModal.dice.house} size={56 * 1.3}
                    onPlanetPress={() => setDetailItem({ name: interpretationModal.dice!.planet.name, symbol: interpretationModal.dice!.planet.symbol, color: interpretationModal.dice!.planet.color, meaning: interpretationModal.dice!.planet.description ?? `${interpretationModal.dice!.planet.name} governs themes of ${interpretationModal.dice!.planet.name.toLowerCase()} in your life.` })}
                    onSignPress={() => setDetailItem({ name: interpretationModal.dice!.sign.name, symbol: interpretationModal.dice!.sign.symbol, color: interpretationModal.dice!.sign.color, meaning: interpretationModal.dice!.sign.description ?? `${interpretationModal.dice!.sign.name} brings its qualities to the reading.` })}
                    onHousePress={() => setDetailItem({ name: interpretationModal.dice!.house.name, symbol: String(interpretationModal.dice!.house.number), color: '#C9A84C', meaning: interpretationModal.dice!.house.meaning })}
                  />
                </View>
              )}
              {interpretationModal?.mode === 'astro_individual' && (
                <View style={{ marginBottom: 14 }}>
                  {(() => {
                    const p1 = interpretationModal.contextProfiles?.profile1;
                    const chart1 = p1 ? computeNatalChartForProfile(p1) : null;
                    return chart1 ? (
                      <View style={{ alignItems: 'center' }}>
                        <Text style={[styles.chartLabel, { color: colors.mutedForeground }]}>{p1?.name}'s Natal Chart</Text>
                        <NatalChartSVG chart={chart1} size={260} />
                      </View>
                    ) : null;
                  })()}
                </View>
              )}
              {interpretationModal?.mode === 'astro_compatibility' && (
                <View style={{ marginBottom: 14 }}>
                  {(() => {
                    const p1 = interpretationModal.contextProfiles?.profile1;
                    const p2 = interpretationModal.contextProfiles?.profile2;
                    const chart1 = p1 ? computeNatalChartForProfile(p1) : null;
                    const chart2 = p2 ? computeNatalChartForProfile(p2) : null;
                    if (!chart1 && !chart2) return null;
                    return (
                      <View style={{ gap: 16 }}>
                        {chart1 && p1 && (
                          <View style={{ alignItems: 'center' }}>
                            <Text style={[styles.chartLabel, { color: colors.mutedForeground, marginBottom: 4 }]}>{p1.name}</Text>
                            <NatalChartSVG chart={chart1} size={220} />
                          </View>
                        )}
                        {chart2 && p2 && (
                          <View style={{ alignItems: 'center' }}>
                            <Text style={[styles.chartLabel, { color: colors.mutedForeground, marginBottom: 4 }]}>{p2.name}</Text>
                            <NatalChartSVG chart={chart2} size={220} />
                          </View>
                        )}
                      </View>
                    );
                  })()}
                </View>
              )}
              <Text style={[styles.modalText, { color: colors.foreground }]}>{interpretationModal?.text}</Text>
            </ScrollView>
            <Pressable
              onPress={handleCloseInterpretationModal}
              style={({ pressed }) => [styles.modalCloseBtn, { backgroundColor: colors.gold, opacity: pressed ? 0.8 : 1 }]}
            >
              <Text style={[styles.modalCloseBtnText, { color: colors.background }]}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Card / die detail pop-up */}
      <Modal
        visible={!!detailItem}
        animationType="slide"
        transparent
        onRequestClose={() => setDetailItem(null)}
      >
        <Pressable style={styles.detailOverlay} onPress={() => setDetailItem(null)}>
          <Pressable style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.gold + '55' }]} onPress={() => {}}>
            <ScrollView style={{ flexShrink: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14, alignItems: 'center', paddingBottom: 4 }}>
              {/* Position label */}
              {detailItem?.label && (
                <Text style={[styles.detailPosition, { color: colors.mutedForeground }]}>{detailItem.label.toUpperCase()}</Text>
              )}

              {/* Enlarged card image or symbol */}
              {detailItem?.imageUrl ? (
                <View style={[styles.detailImageWrap, { borderColor: (detailItem.color ?? colors.gold) + '66' }]}>
                  <ExpoImage
                    source={{ uri: detailItem.imageUrl }}
                    style={[styles.detailImage, detailItem.isReversed ? { transform: [{ rotate: '180deg' }] } : undefined]}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                  />
                </View>
              ) : detailItem?.symbol ? (
                <View style={[styles.detailSymbolWrap, { borderColor: (detailItem.color ?? colors.gold) + '66', backgroundColor: (detailItem.color ?? colors.gold) + '22' }]}>
                  <Text style={{ fontSize: 52, color: detailItem.color ?? colors.gold }}>{detailItem.symbol}</Text>
                </View>
              ) : null}

              {/* Card name */}
              <Text style={[styles.detailName, { color: colors.gold }]}>{detailItem?.name}</Text>

              {/* Tarot: show only the orientation that was drawn */}
              {detailItem?.isTarot ? (
                <View style={{ width: '100%' }}>
                  {detailItem.isReversed ? (
                    <View style={[styles.detailMeaningBox, { backgroundColor: colors.gold + '18', borderColor: colors.gold + '44' }]}>
                      <Text style={[styles.detailMeaningLabel, { color: colors.gold }]}>↓ Reversed</Text>
                      <Text style={[styles.detailMeaning, { color: colors.foreground }]}>{detailItem.reversedMeaning}</Text>
                    </View>
                  ) : (
                    <View style={[styles.detailMeaningBox, { backgroundColor: colors.gold + '18', borderColor: colors.gold + '44' }]}>
                      <Text style={[styles.detailMeaningLabel, { color: colors.gold }]}>↑ Upright</Text>
                      <Text style={[styles.detailMeaning, { color: colors.foreground }]}>{detailItem.uprightMeaning}</Text>
                    </View>
                  )}
                </View>
              ) : (
                /* Non-tarot (Lenormand / dice) */
                <View style={[styles.detailMeaningBox, { backgroundColor: colors.gold + '18', borderColor: colors.gold + '44', width: '100%' }]}>
                  <Text style={[styles.detailMeaning, { color: colors.foreground }]}>{detailItem?.meaning}</Text>
                </View>
              )}
            </ScrollView>

            <Pressable
              onPress={() => setDetailItem(null)}
              style={({ pressed }) => [styles.detailClose, { backgroundColor: colors.gold, opacity: pressed ? 0.8 : 1, marginTop: 10 }]}
            >
              <Text style={[styles.detailCloseText, { color: colors.background }]}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Ad placeholder — see AdPlaceholder.tsx for why this is a stub.
          The Gemini request only fires here, after the user has watched the
          full unlock ad — not when the question was originally sent. */}
      <FloatingAudioPlayer />

      {/* Off-screen share capture ViewShot — outside Modal so height is unconstrained and modal never flickers */}
      {Platform.OS !== 'web' && !!interpretationModal && (
        <ViewShot
          ref={viewShotRef}
          options={{ format: 'jpg', quality: 0.92 }}
          style={{
            position: 'absolute',
            left: -10000,
            top: 0,
            width: windowWidth - 48,
            backgroundColor: colors.card,
            paddingTop: 20,
            paddingHorizontal: 20,
            paddingBottom: 56,
          }}
        >
          <View style={{ alignItems: 'center', gap: 6, paddingBottom: 14, paddingTop: 6 }}>
            <Image source={require('@/assets/images/icon.png')} style={{ width: 38, height: 38, borderRadius: 10 }} />
            <Text style={{ fontFamily: FONT_HEADING_SEMIBOLD, color: colors.gold, fontSize: 16, textAlign: 'center' }}>Wildflower</Text>
          </View>
          <Text style={[styles.modalTitle, { color: colors.gold }]}>Your Reading</Text>
          {interpretationModal.question && (
            <View style={[styles.modalQuestionBox, { backgroundColor: colors.gold + '1a', borderColor: colors.gold + '44' }]}>
              <Text style={[styles.modalQuestionText, { color: colors.foreground }]}>{interpretationModal.question}</Text>
            </View>
          )}
          {interpretationModal.cards && (
            <View style={[styles.cardsRow, { marginBottom: 14 }]}>
              {interpretationModal.mode === 'tarot_5card'
                ? <FiveCardSpread cards={interpretationModal.cards} deckKind={interpretationModal.deckKind} size="small" />
                : <CardRow cards={interpretationModal.cards} labels={interpretationModal.cardLabels} deckKind={interpretationModal.deckKind} size="small" />}
            </View>
          )}
          {interpretationModal.dice && (
            <View style={[styles.diceContainer, { marginBottom: 14 }]}>
              <DiceDisplay
                planet={interpretationModal.dice.planet}
                sign={interpretationModal.dice.sign}
                house={interpretationModal.dice.house}
                size={56 * 1.3}
              />
            </View>
          )}
          {interpretationModal.mode === 'astro_individual' && (
            <View style={{ marginBottom: 14 }}>
              {(() => {
                const p1 = interpretationModal.contextProfiles?.profile1;
                const chart1 = p1 ? computeNatalChartForProfile(p1) : null;
                return chart1 ? (
                  <View style={{ alignItems: 'center' }}>
                    <Text style={[styles.chartLabel, { color: colors.mutedForeground }]}>{p1?.name}'s Natal Chart</Text>
                    <NatalChartSVG chart={chart1} size={260} />
                  </View>
                ) : null;
              })()}
            </View>
          )}
          {interpretationModal.mode === 'astro_compatibility' && (
            <View style={{ marginBottom: 14 }}>
              {(() => {
                const p1 = interpretationModal.contextProfiles?.profile1;
                const p2 = interpretationModal.contextProfiles?.profile2;
                const chart1 = p1 ? computeNatalChartForProfile(p1) : null;
                const chart2 = p2 ? computeNatalChartForProfile(p2) : null;
                if (!chart1 && !chart2) return null;
                return (
                  <View style={{ gap: 16 }}>
                    {chart1 && p1 && (
                      <View style={{ alignItems: 'center' }}>
                        <Text style={[styles.chartLabel, { color: colors.mutedForeground, marginBottom: 4 }]}>{p1.name}</Text>
                        <NatalChartSVG chart={chart1} size={220} />
                      </View>
                    )}
                    {chart2 && p2 && (
                      <View style={{ alignItems: 'center' }}>
                        <Text style={[styles.chartLabel, { color: colors.mutedForeground, marginBottom: 4 }]}>{p2.name}</Text>
                        <NatalChartSVG chart={chart2} size={220} />
                      </View>
                    )}
                  </View>
                );
              })()}
            </View>
          )}
          {(() => {
            // Match the "Reversed" badge font on small cards: (nameSize - 1) × 0.8
            // where nameSize = 9 × ANDROID_CARD_SCALE (1.5 on Android, 1 elsewhere).
            const cardScale = Platform.OS === 'android' ? 1.5 : 1;
            const captureFontSize = (9 * cardScale - 1) * 1.2;
            return (
              <Text style={[styles.modalText, { color: colors.foreground, fontSize: captureFontSize, lineHeight: captureFontSize * 1.7 }]}>
                {interpretationModal.text}
              </Text>
            );
          })()}
        </ViewShot>
      )}

      <AdPlaceholder
        visible={!!pendingAdMessage}
        fetching={fetchingInterpretation}
        onDone={async () => {
          const msg = pendingAdMessage;
          if (!msg) {
            setPendingAdMessage(null);
            return;
          }
          setFetchingInterpretation(true);
          let text: string;
          try {
            text = await getAIInterpretation(
              msg.interpretPrompt ?? `Give me a ${msg.modeLabel ?? 'reading'}.`,
              msg.modeLabel ?? 'Reading',
              msg.interpretContext ?? ''
            );
          } catch (err: any) {
            text = '✦ The stars are quiet right now. Please check your connection and try again.';
          }
          // Increment reading count — persists even after history clears.
          incrementReadingCount();
          // Mark this reading unlocked so future views (including after an
          // app restart, from stored chat history) skip the ad and Gemini
          // call entirely, and just reread the text stored here.
          const unlockedMessage: Message = { ...msg, text, unlocked: true };
          setMessages(prev => prev.map(m => (m.id === unlockedMessage.id ? unlockedMessage : m)));
          setFetchingInterpretation(false);
          setPendingAdMessage(null);
          setInterpretationModal(unlockedMessage);
        }}
      />
    </KeyboardAvoidingView>
  );
}

function EmptyAskState({ colors, mode, isCompatMode, onPrompt }: any) {
  const PROMPTS = isCompatMode ? [
    'What is the energy between us right now?',
    'What strengths do we bring to this relationship?',
    'What challenges might we face together?',
    'What do we need to understand about each other?',
    'What is the highest potential of our connection?',
  ] : [
    'What should I focus on today?',
    'What is blocking my growth?',
    'What does love have in store for me?',
    'What energy am I holding that I can release?',
    'What do I need to hear right now?',
  ];

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.emptyContainer} showsVerticalScrollIndicator={false}>
      <Text style={[styles.emptyOrb, { color: colors.gold }]}>✦</Text>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Ask anything</Text>
      <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
        Using {mode.label}. Type a question or choose a prompt below.
      </Text>
      <View style={styles.promptsGrid}>
        {PROMPTS.map((p, i) => (
          <Pressable
            key={i}
            onPress={() => onPrompt(p)}
            style={({ pressed }) => [styles.promptChip, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={[styles.promptText, { color: colors.foreground }]}>{p}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = createStyles({
  container: { flex: 1 },
  disclaimerBar: {
    marginHorizontal: 20,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  disclaimerText: {
    fontSize: 9.5,
    fontFamily: FONT_BODY_REGULAR,
    textAlign: 'center',
    lineHeight: 14,
  },
  disclaimerClear: {
    fontSize: 9.5,
    fontFamily: FONT_BODY_REGULAR,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    gap: 8,
    paddingHorizontal: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  modeBtnText: {
    flex: 1,
    fontSize: 10,
    fontFamily: FONT_BODY_MEDIUM,
  },
  profileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    padding: 9,
    borderRadius: 10,
    borderWidth: 1,
    maxWidth: 140,
  },
  miniAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniAvatarText: {
    fontSize: 9.5,
    fontFamily: FONT_BODY_SEMIBOLD,
  },
  profileBtnText: {
    fontSize: 10,
    fontFamily: FONT_BODY_REGULAR,
    flex: 1,
  },
  messageList: {
    padding: 20,
    gap: 12,
    paddingBottom: 20,
  },
  userMsgContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  msgTimestamp: {
    fontSize: 9.5,
    fontFamily: FONT_BODY_REGULAR,
    marginRight: 4,
  },
  chartLabel: {
    fontSize: 11,
    fontFamily: FONT_BODY_MEDIUM,
    marginBottom: 4,
  },
  cardsRow: {
    alignSelf: 'center',
    marginVertical: 4,
  },
  diceContainer: {
    alignSelf: 'center',
    marginVertical: 8,
  },
  userBubble: {
    maxWidth: '75%',
    borderRadius: 16,
    borderTopRightRadius: 4,
    borderWidth: 1,
    padding: 12,
  },
  userText: {
    fontSize: 10,
    fontFamily: FONT_BODY_REGULAR,
    lineHeight: 17,
  },
  aiBubbleContainer: {
    alignItems: 'flex-start',
    gap: 4,
  },
  aiDecor: {
    fontSize: 12,
    marginLeft: 4,
  },
  aiBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  aiHiddenText: {
    fontSize: 11,
    fontFamily: FONT_BODY_REGULAR,
    fontStyle: 'italic',
  },
  checkBtn: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginTop: 2,
  },
  checkBtnText: {
    fontSize: 10,
    fontFamily: FONT_BODY_SEMIBOLD,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 12,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 12,
    fontFamily: FONT_BODY_REGULAR,
    maxHeight: 100,
  },
  sendBtn: {
    width: 24 * 1.3,
    height: 24 * 1.3,
    borderRadius: (24 * 1.3) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diceBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 14,
    alignItems: 'center',
  },
  diceBtnText: {
    fontSize: 13,
    fontFamily: FONT_BODY_SEMIBOLD,
  },
  sheetTitle: {
    fontSize: 15.5,
    fontFamily: FONT_HEADING_SEMIBOLD,
    marginBottom: 14,
    textAlign: 'center',
  },
  modeOption: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
  },
  modeOptionTitle: {
    fontSize: 12,
    fontFamily: FONT_BODY_SEMIBOLD,
    marginBottom: 3,
  },
  modeOptionDesc: {
    fontSize: 10,
    fontFamily: FONT_BODY_REGULAR,
  },
  emptyContainer: {
    // flexGrow (not flex) so the ScrollView expands to fill space when
    // content is shorter than the viewport, but still scrolls when it isn't.
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
    gap: 8,
  },
  clearBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyOrb: {
    fontSize: 37.5,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: FONT_HEADING_SEMIBOLD,
  },
  emptySub: {
    fontSize: 11,
    fontFamily: FONT_BODY_REGULAR,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
  },
  promptsGrid: {
    width: '100%',
    gap: 8,
  },
  promptChip: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 13,
  },
  promptText: {
    fontSize: 11,
    fontFamily: FONT_BODY_REGULAR,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
    paddingBottom: 32,
    gap: 12,
    maxHeight: '88%',
    flex: 1,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalTitle: {
    fontSize: 14.5,
    fontFamily: FONT_HEADING_SEMIBOLD,
    textAlign: 'center',
    marginBottom: 12,
  },
  modalQuestionBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginBottom: 14,
  },
  modalQuestionText: {
    fontSize: 11,
    fontFamily: FONT_BODY_MEDIUM,
    fontStyle: 'italic',
  },
  modalText: {
    fontSize: 10,
    fontFamily: FONT_BODY_REGULAR,
    lineHeight: 17,
  },
  modalShareCircle: {
    width: 28.6,
    height: 28.6,
    borderRadius: 14.3,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userMsgMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  copiedHint: {
    fontSize: 9,
    fontFamily: FONT_BODY_MEDIUM,
  },
  modalCloseBtn: {
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    fontSize: 12,
    fontFamily: FONT_BODY_SEMIBOLD,
  },
  typingBubble: {
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  detailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
    padding: 16,
    paddingBottom: 32,
  },
  detailCard: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
    maxHeight: '85%',
  },
  detailImageWrap: {
    width: 130,
    height: 210,
    borderRadius: 14,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  detailImage: {
    width: '100%',
    height: '100%',
  },
  detailSymbolWrap: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailPosition: {
    fontSize: 10,
    fontFamily: FONT_BODY_MEDIUM,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  detailName: {
    fontSize: 18,
    fontFamily: FONT_HEADING_SEMIBOLD,
    textAlign: 'center',
  },
  detailReversedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  detailReversedText: {
    fontSize: 10,
    fontFamily: FONT_BODY_MEDIUM,
  },
  detailMeaningBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 5,
  },
  detailMeaningLabel: {
    fontSize: 10,
    fontFamily: FONT_BODY_SEMIBOLD,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  detailMeaning: {
    fontSize: 10,
    fontFamily: FONT_BODY_REGULAR,
    lineHeight: 17,
  },
  detailClose: {
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  detailCloseText: {
    fontSize: 12,
    fontFamily: FONT_BODY_SEMIBOLD,
  },
});
