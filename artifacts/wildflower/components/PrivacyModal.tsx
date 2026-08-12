import React from 'react';
import {
  Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { FONT_HEADING_SEMIBOLD, FONT_BODY_REGULAR, FONT_BODY_MEDIUM, FONT_BODY_SEMIBOLD } from '@/constants/fonts';
import { createStyles, androidIconSize } from '@/utils/responsiveStyles';

interface PrivacyModalProps {
  visible: boolean;
  onClose: () => void;
}

const EMAIL = 'Wildflower07042026@gmail.com';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={{ marginTop: 16 }}>
      <Text style={[styles.sectionTitle, { color: colors.gold }]}>{title}</Text>
      {children}
    </View>
  );
}

function Body({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  return (
    <Text style={[styles.body, { color: colors.foreground }]}>{children}</Text>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.bulletRow}>
      <Text style={[styles.bulletDot, { color: colors.mutedForeground }]}>•</Text>
      <Text style={[styles.bulletText, { color: colors.foreground }]}>{children}</Text>
    </View>
  );
}

export default function PrivacyModal({ visible, onClose }: PrivacyModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, {
            backgroundColor: colors.card,
            borderColor: colors.border,
            paddingBottom: Math.max(insets.bottom, 24),
          }]}
          onPress={() => {}}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Data Protection & Privacy</Text>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={({ pressed }) => [styles.closeBtn, { opacity: pressed ? 0.6 : 1, borderColor: colors.border }]}
            >
              <Ionicons name="close" size={androidIconSize(18)} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            <Body>Wildflower respects your privacy. Here's how your information is handled.</Body>

            <Section title="What we collect">
              <Bullet>Birth information (date, time, place) you enter to generate astrology charts and readings</Bullet>
              <Bullet>AI-generated tarot, astrology, AstroDice, and Lenormand readings created from your questions and astrology chart data</Bullet>
              <Bullet>Saved meditation and ASMR preferences</Bullet>
            </Section>

            <Section title="Where it's stored">
              <Body>Your birth information and reading history are stored locally on your device. We do not upload or store this data on our own servers.</Body>
            </Section>

            <Section title="AI-generated content (powered by Google Gemini)">
              <Body>To generate your readings, your birth information and questions are sent to Google's Gemini API for processing. Per Google's Gemini API policies, this data is not used to train Google's models by default on paid API usage, but prompts and responses may be temporarily logged (currently for a limited period) solely for abuse and safety monitoring. This data is not shared with advertisers or used to build a marketing profile.</Body>
            </Section>

            <Section title="What we don't do">
              <Bullet>We don't sell your personal information</Bullet>
              <Bullet>We don't share your birth data or reading history with advertisers</Bullet>
              <Bullet>We don't use your data to build a profile for marketing purposes</Bullet>
            </Section>

            <Section title="Your control">
              <Body>You can delete your profile, birth information, and reading history at any time from within the app. Uninstalling the app removes all locally stored data. Note that this does not retroactively delete any data already logged by Google's abuse-monitoring systems, which follows Google's own retention schedule.</Body>
            </Section>

            <Section title="Changes to this policy">
              <Body>We'll update this policy if how we handle your data changes, and note the date of the most recent update.</Body>
            </Section>

            <Section title="Contact">
              <Body>Questions about your data? Reach us at</Body>
              <Pressable
                onPress={() => Linking.openURL(`mailto:${EMAIL}?subject=Privacy%20Inquiry`)}
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={[styles.email, { color: colors.gold }]}>{EMAIL}</Text>
              </Pressable>
            </Section>

            <Text style={[styles.lastUpdated, { color: colors.mutedForeground }]}>
              Last updated: July 18, 2026
            </Text>

            <View style={{ height: 24 }} />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = createStyles({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingTop: 24,
    paddingHorizontal: 24,
    // paddingBottom is set inline to account for safe-area insets
    maxHeight: '88%',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 14,
    fontFamily: FONT_HEADING_SEMIBOLD,
    flex: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  sectionTitle: {
    fontSize: 11.5,
    fontFamily: FONT_BODY_SEMIBOLD,
    marginBottom: 7,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  body: {
    fontSize: 11,
    fontFamily: FONT_BODY_REGULAR,
    lineHeight: 18,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 5,
  },
  bulletDot: {
    fontSize: 11,
    fontFamily: FONT_BODY_REGULAR,
    lineHeight: 18,
  },
  bulletText: {
    fontSize: 11,
    fontFamily: FONT_BODY_REGULAR,
    lineHeight: 18,
    flex: 1,
  },
  email: {
    fontSize: 11,
    fontFamily: FONT_BODY_MEDIUM,
    marginTop: 4,
    textDecorationLine: 'underline',
  },
  lastUpdated: {
    fontSize: 10,
    fontFamily: FONT_BODY_REGULAR,
    marginTop: 20,
    fontStyle: 'italic',
  },
});
