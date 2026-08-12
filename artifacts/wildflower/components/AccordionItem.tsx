import React, { useCallback, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import TruncatableText from '@/components/TruncatableText';
import { createStyles, androidIconSize } from '@/utils/responsiveStyles';

interface AccordionItemProps {
  title: string;
  content: string;
  defaultOpen?: boolean;
  subtitle?: string;
  truncate?: boolean;
  borderColor?: string;
  titleColor?: string;
  subtitleColor?: string;
}

export default function AccordionItem({
  title, content, defaultOpen = false, subtitle, truncate = false,
  borderColor, titleColor, subtitleColor,
}: AccordionItemProps) {
  const [open, setOpen] = useState(defaultOpen);
  const colors = useColors();
  const rotateAnim = useRef(new Animated.Value(defaultOpen ? 1 : 0)).current;

  const toggle = useCallback(() => {
    Animated.timing(rotateAnim, {
      toValue: open ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    setOpen(o => !o);
  }, [open, rotateAnim]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: borderColor ?? colors.border }]}>
      <Pressable
        onPress={toggle}
        style={({ pressed }) => [styles.header, { opacity: pressed ? 0.8 : 1 }]}
      >
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: titleColor ?? colors.foreground }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: subtitleColor ?? colors.gold }]}>{subtitle}</Text>
          )}
        </View>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons name="chevron-down" size={androidIconSize(18)} color={colors.mutedForeground} />
        </Animated.View>
      </Pressable>
      {open && (
        <View style={[styles.body, { borderTopColor: borderColor ?? colors.border }]}>
          {truncate ? (
            <TruncatableText
              text={content}
              textStyle={[styles.content, { color: colors.mutedForeground }]}
              moreLinkStyle={[styles.moreLink, { color: colors.gold }]}
            />
          ) : (
            <Text style={[styles.content, { color: colors.mutedForeground }]}>{content}</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = createStyles({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  subtitle: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  body: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  content: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    lineHeight: 17,
    marginTop: 10,
  },
  moreLink: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    marginTop: 6,
  },
});
