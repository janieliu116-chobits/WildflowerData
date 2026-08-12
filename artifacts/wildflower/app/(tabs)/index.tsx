import React, { useMemo } from 'react';
import {
  Dimensions, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useProfiles } from '@/contexts/ProfileContext';
import { DAILY_QUOTES } from '@/constants/data';
import { FONT_HEADING_SEMIBOLD, FONT_BODY_MEDIUM, FONT_BODY_REGULAR, FONT_BODY_SEMIBOLD } from '@/constants/fonts';
import AboutModal from '@/components/AboutModal';
import AppBackground from '@/components/AppBackground';
import FloatingAudioPlayer from '@/components/FloatingAudioPlayer';
import { createStyles, androidIconSize } from '@/utils/responsiveStyles';

const { width: SCREEN_W } = Dimensions.get('window');

// Nav bar renders icons at size (24) * 0.7 for Ionicons, and
// (24) * 1.5 * 0.7 * 0.9 for the image-based icons — mirror those exact
// factors here so the home cards use the same icon assets at the same size.
const NAV_ICON_BASE = 24;
const NAV_ION_SIZE = androidIconSize(NAV_ICON_BASE * 0.7 * 0.8);
const NAV_IMAGE_SIZE = androidIconSize(NAV_ICON_BASE * 1.5 * 0.7 * 0.9 * 0.8);

const FEATURES = [
  { image: require('@/assets/images/icon-astrology.png'), label: 'Explore your chart', sublabel: 'Astrology, signs, houses, aspects & compatibility', tab: '/astrology', gradient: ['#2D3060', '#1E1E2E'] },
  { icon: 'chatbubble-outline', label: 'Ask a question', sublabel: 'Love, career & growth with tarot, astrology & Lenormand', tab: '/ask', gradient: ['#3D2060', '#1E1E2E'] },
  { image: require('@/assets/images/icon-lotus.png'), label: 'Meditation', sublabel: 'Calm your mind with guided sessions', tab: '/meditation', gradient: ['#1A3D2B', '#1E1E2E'] },
  { icon: 'moon-outline', label: 'ASMR sounds', sublabel: 'Drift into a deep night sleep', tab: '/sleep', gradient: ['#1A1A3D', '#1E1E2E'] },
] as const;

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isFirstTime } = useProfiles();
  const [showAbout, setShowAbout] = React.useState(false);

  // Daily quote — pick deterministically based on day
  const quote = useMemo(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    return DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length];
  }, []);

  const today = useMemo(() => new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }), []);

  // Match AppHeader's top offset so this screen's header sits at the same
  // vertical level as the header on every other tab.
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const handleFeaturePress = async (tab: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(tab as any);
  };

  return (
    <LinearGradient
      colors={[colors.background, '#1A1420', colors.background]}
      style={StyleSheet.absoluteFill}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <AppBackground />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 16, paddingBottom: insets.bottom + 100 }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoCircle}>
              <Image
                source={require('@/assets/images/icon.png')}
                style={styles.logoImage}
                resizeMode="cover"
              />
            </View>
            <Text style={[styles.wordmark, { color: colors.foreground }]}>Wildflower</Text>
          </View>
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

        {/* Daily Quote */}
        <View style={[styles.quoteCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.quoteDate, { color: colors.gold }]}>{today}</Text>
          <Text style={[styles.quoteText, { color: colors.foreground }]}>{quote}</Text>
        </View>

        {/* Feature grid */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>BEGIN SOMEWHERE</Text>
        <View style={styles.grid}>
          {FEATURES.map((feature) => (
            <Pressable
              key={feature.tab}
              onPress={() => handleFeaturePress(feature.tab)}
              style={({ pressed }) => [styles.featureCard, { opacity: pressed ? 0.85 : 1 }]}
            >
              <LinearGradient
                colors={feature.gradient as [string, string]}
                style={[styles.featureGradient, { borderColor: colors.border }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={[styles.featureIconBg, { backgroundColor: colors.gold + '22', borderColor: colors.gold + '44' }]}>
                  {'image' in feature ? (
                    <Image
                      source={feature.image}
                      style={{ width: NAV_IMAGE_SIZE, height: NAV_IMAGE_SIZE, tintColor: colors.gold }}
                      resizeMode="contain"
                    />
                  ) : (
                    <Ionicons name={feature.icon as any} size={NAV_ION_SIZE} color={colors.gold} />
                  )}
                </View>
                <Text style={[styles.featureLabel, { color: colors.foreground }]}>{feature.label}</Text>
                <Text style={[styles.featureSub, { color: colors.mutedForeground }]}>{feature.sublabel}</Text>
              </LinearGradient>
            </Pressable>
          ))}
        </View>

        {/* First time prompt */}
        {isFirstTime && (
          <Pressable
            onPress={() => router.push('/astrology')}
            style={({ pressed }) => [styles.setupBanner, { backgroundColor: colors.gold + '22', borderColor: colors.gold, opacity: pressed ? 0.7 : 1 }]}
          >
            <Ionicons name="person-add-outline" size={androidIconSize(20)} color={colors.gold} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.setupTitle, { color: colors.gold }]}>Set up your birth chart</Text>
              <Text style={[styles.setupSub, { color: colors.foreground }]}>Add your profile to unlock your natal chart and compatibility readings.</Text>
            </View>
            <Ionicons name="chevron-forward" size={androidIconSize(18)} color={colors.gold} />
          </Pressable>
        )}
      </ScrollView>

      <AboutModal visible={showAbout} onClose={() => setShowAbout(false)} />
      <FloatingAudioPlayer />
    </LinearGradient>
  );
}

const styles = createStyles({
  scroll: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoCircle: {
    width: 33,
    height: 33,
    borderRadius: 16.5,
    overflow: 'hidden',
  },
  logoImage: {
    width: 33,
    height: 33,
  },
  wordmark: {
    fontSize: 17,
    fontFamily: FONT_HEADING_SEMIBOLD,
    letterSpacing: 0.3,
  },
  helpBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 11,
    fontFamily: FONT_BODY_REGULAR,
    textAlign: 'center',
    marginBottom: 12,
  },
  quoteCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 6,
    marginBottom: 22,
  },
  quoteDate: {
    fontSize: 10,
    fontFamily: FONT_BODY_SEMIBOLD,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  quoteText: {
    fontSize: 12,
    fontFamily: FONT_BODY_REGULAR,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  sectionLabel: {
    fontSize: 9.5,
    fontFamily: FONT_BODY_MEDIUM,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  featureCard: {
    width: (SCREEN_W - 50) / 2,
    minHeight: 132,
  },
  featureGradient: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 6,
    justifyContent: 'space-between',
  },
  featureIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: {
    fontSize: 11,
    fontFamily: FONT_BODY_SEMIBOLD,
    marginTop: 2,
  },
  featureSub: {
    fontSize: 9.5,
    fontFamily: FONT_BODY_REGULAR,
    lineHeight: 14,
  },
  setupBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  setupTitle: {
    fontSize: 11,
    fontFamily: FONT_BODY_SEMIBOLD,
  },
  setupSub: {
    fontSize: 9.5,
    fontFamily: FONT_BODY_REGULAR,
    lineHeight: 15,
    marginTop: 2,
  },
});
