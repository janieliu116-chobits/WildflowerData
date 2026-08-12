import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { TIMER_OPTIONS } from '@/constants/data';
import BottomSheet from './BottomSheet';
import { createStyles } from '@/utils/responsiveStyles';

interface TimerSheetProps {
  visible: boolean;
  onClose: () => void;
  // The current slot's duration timer value (seconds). null = no timer.
  currentSeconds: number | null;
  // Called when the user picks a duration timer (or clears it).
  onSetTimer: (seconds: number | null) => void;
  // Whether "Until track ends" is active for this slot.
  stopAfterTrack: boolean;
  // Called when the user toggles "Until track ends".
  onSetStopAfterTrack: (value: boolean) => void;
  // Called after the selection is applied with the chosen option id.
  onSelect?: (optionId: string) => void;
}

export default function TimerSheet({
  visible,
  onClose,
  currentSeconds,
  onSetTimer,
  stopAfterTrack,
  onSetStopAfterTrack,
  onSelect,
}: TimerSheetProps) {
  const colors = useColors();

  const activeId = (): string => {
    if (currentSeconds !== null) {
      return TIMER_OPTIONS.find(o => o.seconds === currentSeconds)?.id ?? 'none';
    }
    return stopAfterTrack ? 'end' : 'none';
  };

  const handleSelect = (opt: typeof TIMER_OPTIONS[0]) => {
    if (opt.id === 'none') {
      onSetTimer(null);
      onSetStopAfterTrack(false);
    } else if (opt.id === 'end') {
      onSetTimer(null);
      onSetStopAfterTrack(true);
    } else {
      onSetTimer(opt.seconds!);
      onSetStopAfterTrack(false);
    }
    onSelect?.(opt.id);
    onClose();
  };

  const current = activeId();

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.foreground }]}>Choose Timer</Text>
        {TIMER_OPTIONS.map(opt => {
          const isActive = current === opt.id;
          return (
            <Pressable
              key={opt.id}
              onPress={() => handleSelect(opt)}
              style={({ pressed }) => [
                styles.option,
                {
                  backgroundColor: isActive ? colors.gold + '22' : colors.cardElevated,
                  borderColor: isActive ? colors.gold : colors.border,
                },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={[styles.optionText, { color: isActive ? colors.gold : colors.foreground }]}>
                {opt.label}
              </Text>
              {isActive && <Text style={[styles.check, { color: colors.gold }]}>✓</Text>}
            </Pressable>
          );
        })}
      </View>
    </BottomSheet>
  );
}

const styles = createStyles({
  container: {
    paddingHorizontal: 20,
    gap: 10,
  },
  title: {
    fontSize: 15.5,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 6,
    textAlign: 'center',
  },
  option: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  check: {
    fontSize: 13.5,
    fontFamily: 'Inter_600SemiBold',
  },
});
