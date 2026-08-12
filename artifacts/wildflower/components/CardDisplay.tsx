import React, { useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { TAROT_IMAGE_IDS, LENORMAND_IMAGE_IDS, getDriveImageUrl } from '@/constants/data';
import { createStyles } from '@/utils/responsiveStyles';

export interface CardData {
  id: string;
  name: string;
  symbol: string;
  color: string;
  meaning?: string;
  upright?: string;
  reversed?: string;      // card's reversed meaning text (Major Arcana)
  drawnReversed?: boolean; // true when this card was drawn reversed this session
}

interface CardDisplayProps {
  card: CardData;
  label?: string;
  size?: 'small' | 'medium' | 'large';
  deckKind?: 'tarot' | 'lenormand';
  onPress?: () => void;
}

export function getCardImageUrl(name: string, deckKind?: 'tarot' | 'lenormand'): string | null {
  if (!deckKind) return null;
  const ids = deckKind === 'tarot' ? TAROT_IMAGE_IDS : LENORMAND_IMAGE_IDS;
  const fileId = ids[name];
  return fileId ? getDriveImageUrl(fileId) : null;
}

// These Tarot/Lenormand cards read as too small on Android (they're only
// ever rendered at size="small", in the Ask page's chat history and its
// interpretation modal), so every dimension gets a 1.5x bump there.
const ANDROID_CARD_SCALE = Platform.OS === 'android' ? 1.5 : 1;

export default function CardDisplay({ card, label, size = 'medium', deckKind, onPress }: CardDisplayProps) {
  const colors = useColors();
  const dim = (size === 'small' ? 56 : size === 'medium' ? 110 : 150) * ANDROID_CARD_SCALE;
  const symbolSize = (size === 'small' ? 26 : size === 'medium' ? 38 : 52) * ANDROID_CARD_SCALE;
  const nameSize = (size === 'small' ? 9 : size === 'medium' ? 11 : 14) * ANDROID_CARD_SCALE;
  const cornerSize = (size === 'small' ? 9 : 11) * ANDROID_CARD_SCALE;
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = getCardImageUrl(card.name, deckKind);
  const showImage = !!imageUrl && !imageFailed;

  const cardInner = (
    <View style={[styles.container, { width: dim }]}>
      {label && (
        <Text style={[styles.label, { color: colors.gold, fontSize: nameSize - 1 }]}>{label}</Text>
      )}
      <LinearGradient
        colors={[card.color + '77', colors.cardElevated, colors.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, {
          width: dim,
          height: dim * 1.6,
          borderColor: card.drawnReversed ? (colors.mutedForeground + '88') : (colors.gold + '88'),
          borderRadius: 12,
          // No rotation here — only the image/symbol rotates, keeping text upright.
        }]}
      >
        {showImage ? (
          <>
            {/* Rotate only the image, not the text overlay */}
            <ExpoImage
              source={{ uri: imageUrl! }}
              style={[StyleSheet.absoluteFill, card.drawnReversed ? { transform: [{ rotate: '180deg' }] } : undefined]}
              contentFit="cover"
              cachePolicy="memory-disk"
              onError={() => setImageFailed(true)}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.75)']}
              style={StyleSheet.absoluteFill}
            />
            {card.drawnReversed && (
              <Text style={[styles.reversedTopLabel, { fontSize: (nameSize - 1) * 0.8 }]}>Reversed</Text>
            )}
            <Text style={[styles.cardNameOverlay, { fontSize: nameSize, color: '#fff' }]} numberOfLines={2}>
              {card.name}
            </Text>
          </>
        ) : (
          <>
            {/* Corner pips — mimics a real playing/tarot card's rank markers */}
            <Text style={[styles.cornerPip, styles.cornerTL, { color: colors.gold, fontSize: cornerSize }]}>{card.symbol}</Text>
            <Text style={[styles.cornerPip, styles.cornerBR, { color: colors.gold, fontSize: cornerSize }]}>{card.symbol}</Text>

            {/* Rotate only the inner symbol, not the name label */}
            <View style={[styles.innerBorder, { borderColor: card.color + '99', transform: card.drawnReversed ? [{ rotate: '180deg' }] : [] }]}>
              <LinearGradient
                colors={[card.color + '33', 'transparent']}
                style={styles.innerGlow}
              />
              <Text style={[styles.symbol, { fontSize: symbolSize, color: card.color }]}>{card.symbol}</Text>
            </View>
            {card.drawnReversed && (
              <Text style={[styles.reversedTopLabel, { fontSize: (nameSize - 1) * 0.8 }]}>Reversed</Text>
            )}
            <Text style={[styles.cardName, { fontSize: nameSize, color: colors.foreground }]} numberOfLines={2}>
              {card.name}
            </Text>
            {card.meaning && size === 'large' && (
              <Text style={[styles.meaning, { fontSize: nameSize - 1, color: colors.mutedForeground }]} numberOfLines={2}>
                {card.meaning}
              </Text>
            )}
          </>
        )}
      </LinearGradient>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
        {cardInner}
      </Pressable>
    );
  }
  return cardInner;
}

interface CardRowProps {
  cards: CardData[];
  labels?: string[];
  size?: 'small' | 'medium' | 'large';
  deckKind?: 'tarot' | 'lenormand';
  onCardPress?: (card: CardData, index: number) => void;
}

export function CardRow({ cards, labels, size = 'medium', deckKind, onCardPress }: CardRowProps) {
  return (
    <View style={styles.row}>
      {cards.map((card, i) => (
        <CardDisplay
          key={card.id}
          card={card}
          label={labels?.[i]}
          size={size}
          deckKind={deckKind}
          onPress={onCardPress ? () => onCardPress(card, i) : undefined}
        />
      ))}
    </View>
  );
}

// ─── 5-Card Cross Spread ───────────────────────────────────────────────────────
interface FiveCardSpreadProps {
  cards: CardData[]; // [Potential, Past, Present, Future, Reason]
  size?: 'small' | 'medium' | 'large';
  deckKind?: 'tarot' | 'lenormand';
  onCardPress?: (card: CardData, index: number) => void;
}

const FIVE_CARD_LABELS = ['Potential', 'Past', 'Present', 'Future', 'Reason'];

export function FiveCardSpread({ cards, size = 'small', deckKind, onCardPress }: FiveCardSpreadProps) {
  const colors = useColors();
  if (!cards || cards.length < 5) return null;

  const dim = (size === 'small' ? 56 : size === 'medium' ? 110 : 150) * ANDROID_CARD_SCALE;
  const gap = 6;

  // Cross layout: Potential (top center), Past (left), Present (center), Future (right), Reason (bottom center)
  // indices: 0=Potential, 1=Past, 2=Present, 3=Future, 4=Reason
  return (
    <View style={{ alignItems: 'center', gap }}>
      {/* Top: Potential */}
      <CardDisplay card={cards[0]} label={FIVE_CARD_LABELS[0]} size={size} deckKind={deckKind} onPress={onCardPress ? () => onCardPress(cards[0], 0) : undefined} />
      {/* Middle row: Past, Present, Future */}
      <View style={{ flexDirection: 'row', gap, alignItems: 'center' }}>
        <CardDisplay card={cards[1]} label={FIVE_CARD_LABELS[1]} size={size} deckKind={deckKind} onPress={onCardPress ? () => onCardPress(cards[1], 1) : undefined} />
        <CardDisplay card={cards[2]} label={FIVE_CARD_LABELS[2]} size={size} deckKind={deckKind} onPress={onCardPress ? () => onCardPress(cards[2], 2) : undefined} />
        <CardDisplay card={cards[3]} label={FIVE_CARD_LABELS[3]} size={size} deckKind={deckKind} onPress={onCardPress ? () => onCardPress(cards[3], 3) : undefined} />
      </View>
      {/* Bottom: Reason */}
      <CardDisplay card={cards[4]} label={FIVE_CARD_LABELS[4]} size={size} deckKind={deckKind} onPress={onCardPress ? () => onCardPress(cards[4], 4) : undefined} />
    </View>
  );
}

interface DiceDisplayProps {
  planet: { name: string; symbol: string; color: string; description?: string };
  sign: { name: string; symbol: string; color: string; description?: string };
  house: { name: string; number: number; meaning: string };
  size?: number;
  onPlanetPress?: () => void;
  onSignPress?: () => void;
  onHousePress?: () => void;
}

export function DiceDisplay({ planet, sign, house, size = 80, onPlanetPress, onSignPress, onHousePress }: DiceDisplayProps) {
  const colors = useColors();
  return (
    <View style={styles.diceRow}>
      {/* Planet die */}
      <Pressable
        onPress={onPlanetPress}
        style={({ pressed }) => ({ opacity: pressed && onPlanetPress ? 0.8 : 1 })}
      >
        <View style={[styles.die, { width: size, height: size, borderColor: planet.color + '88', backgroundColor: planet.color + '22' }]}>
          <Text style={{ fontSize: size * 0.4, color: planet.color }}>{planet.symbol}</Text>
          <Text style={[styles.dieLabel, { color: colors.mutedForeground, fontSize: size * 0.13 }]}>{planet.name}</Text>
        </View>
      </Pressable>
      <Text style={[styles.inText, { color: colors.mutedForeground }]}>in</Text>
      {/* Sign die */}
      <Pressable
        onPress={onSignPress}
        style={({ pressed }) => ({ opacity: pressed && onSignPress ? 0.8 : 1 })}
      >
        <View style={[styles.die, { width: size, height: size, borderColor: sign.color + '88', backgroundColor: sign.color + '22' }]}>
          <Text style={{ fontSize: size * 0.4, color: sign.color }}>{sign.symbol}</Text>
          <Text style={[styles.dieLabel, { color: colors.mutedForeground, fontSize: size * 0.13 }]}>{sign.name}</Text>
        </View>
      </Pressable>
      <Text style={[styles.inText, { color: colors.mutedForeground }]}>in</Text>
      {/* House die */}
      <Pressable
        onPress={onHousePress}
        style={({ pressed }) => ({ opacity: pressed && onHousePress ? 0.8 : 1 })}
      >
        <View style={[styles.die, { width: size, height: size, borderColor: colors.gold + '88', backgroundColor: colors.gold + '22' }]}>
          <Text style={[styles.houseNum, { fontSize: size * 0.35, color: colors.gold }]}>{house.number}</Text>
          <Text style={[styles.dieLabel, { color: colors.mutedForeground, fontSize: size * 0.11 }]}>House</Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = createStyles({
  container: {
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
    marginBottom: 2,
  },
  reversedBadge: {
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginBottom: 1,
    opacity: 0.6,
  },
  reversedTopLabel: {
    position: 'absolute',
    top: 4,
    alignSelf: 'center',
    zIndex: 10,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(255,255,255,0.92)',
    backgroundColor: 'rgba(0,0,0,0.40)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderWidth: 1.5,
    gap: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  cornerPip: {
    position: 'absolute',
    fontFamily: 'Inter_700Bold',
  },
  cornerTL: {
    top: 6,
    left: 7,
  },
  cornerBR: {
    bottom: 6,
    right: 7,
    transform: [{ rotate: '180deg' }],
  },
  innerBorder: {
    width: '80%',
    aspectRatio: 1,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  innerGlow: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  symbol: {
    textAlign: 'center',
  },
  cardName: {
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  cardNameOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 6,
    right: 6,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  meaning: {
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    opacity: 0.8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  diceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    justifyContent: 'center',
  },
  die: {
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    gap: 2,
  },
  dieLabel: {
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  houseNum: {
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  inText: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
  },
});
