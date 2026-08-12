import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import type { PlaybackMode } from '@/contexts/AudioContext';
import { FONT_BODY_MEDIUM } from '@/constants/fonts';
import { createStyles, androidIconSize } from '@/utils/responsiveStyles';

const MODES: { id: PlaybackMode; label: string }[] = [
  { id: 'in_order', label: 'In order' },
  { id: 'shuffle',  label: 'Shuffle'  },
  { id: 'repeat',   label: 'Repeat'   },
];

interface PlayModeRowProps {
  onTimerPress: () => void;
  // Current play mode for this page (meditation or sleep — kept independent).
  mode: PlaybackMode;
  // When provided, called instead of a direct context setter so the parent
  // screen can handle any auto-start logic that should accompany a mode change.
  onModeChange?: (mode: PlaybackMode) => void;
  // Whether the timer button should appear highlighted. The caller passes
  // the active slot's timer state so each context highlights independently.
  timerActive?: boolean;
}

export default function PlayModeRow({ onTimerPress, mode, onModeChange, timerActive = false }: PlayModeRowProps) {
  const colors = useColors();

  return (
    <View style={styles.row}>
      <View style={[styles.pillGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {MODES.map(item => {
          const isActive = mode === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => onModeChange ? onModeChange(item.id) : undefined}
              style={[
                styles.pill,
                { backgroundColor: isActive ? colors.gold + '2A' : 'transparent', borderColor: isActive ? colors.gold : 'transparent' },
              ]}
            >
              <Text style={[styles.pillText, { color: isActive ? colors.gold : colors.mutedForeground }]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable
        onPress={onTimerPress}
        style={({ pressed }) => [
          styles.timerBtn,
          { backgroundColor: colors.card, borderColor: timerActive ? colors.gold : colors.border, opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <Ionicons name="timer-outline" size={androidIconSize(16)} color={timerActive ? colors.gold : colors.mutedForeground} />
      </Pressable>
    </View>
  );
}

const styles = createStyles({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 14,
  },
  pillGroup: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
  },
  pill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
  },
  pillText: {
    fontSize: 11,
    fontFamily: FONT_BODY_MEDIUM,
  },
  timerBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
