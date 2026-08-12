import React, { useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { FONT_HEADING_SEMIBOLD, FONT_BODY_MEDIUM } from '@/constants/fonts';
import AboutModal from './AboutModal';
import { createStyles, androidIconSize } from '@/utils/responsiveStyles';

interface AppHeaderProps {
  title?: string;
  icon?: React.ReactNode;
  showLogo?: boolean;
  /** Optional node rendered to the left of the help button. */
  rightElement?: React.ReactNode;
}

export default function AppHeader({ title, icon, showLogo = false, rightElement }: AppHeaderProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [showAbout, setShowAbout] = useState(false);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <>
      <View style={[styles.container, { paddingTop: topPad + 10, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.left}>
          {showLogo ? (
            <>
              <View style={[styles.logoCircle, { borderColor: colors.gold, backgroundColor: colors.card }]}>
                <Image
                  source={require('@/assets/images/icon.png')}
                  style={styles.logoImage}
                  resizeMode="cover"
                />
              </View>
              <Text style={[styles.logoText, { color: colors.foreground }]}>Wildflower</Text>
            </>
          ) : (
            <View style={styles.iconRow}>
              {icon && <View style={styles.iconWrap}>{icon}</View>}
              {title && (
                <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
              )}
            </View>
          )}
        </View>
        <View style={styles.rightGroup}>
          {rightElement}
          <Pressable
            onPress={() => setShowAbout(true)}
            hitSlop={12}
            style={({ pressed }) => [styles.helpBtn, {
              opacity: pressed ? 0.7 : 1,
              borderColor: colors.border,
              backgroundColor: colors.card,
            }]}
          >
            <Ionicons name="settings-outline" size={androidIconSize(14)} color={colors.gold} />
          </Pressable>
        </View>
      </View>
      <AboutModal visible={showAbout} onClose={() => setShowAbout(false)} />
    </>
  );
}

const styles = createStyles({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 38,
    height: 38,
  },
  logoText: {
    fontSize: 18,
    fontFamily: FONT_HEADING_SEMIBOLD,
    letterSpacing: 0.3,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontFamily: FONT_HEADING_SEMIBOLD,
    letterSpacing: 0.3,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  helpBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
