import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions, Image, Linking, Modal, Platform, Pressable, ScrollView, Switch, Text, View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { FONT_HEADING_SEMIBOLD, FONT_BODY_REGULAR, FONT_BODY_MEDIUM, FONT_BODY_SEMIBOLD } from '@/constants/fonts';
import { createStyles, androidIconSize } from '@/utils/responsiveStyles';
import {
  requestNotificationPermission,
  scheduleDailyNotification,
  cancelDailyNotification,
  saveNotificationSettings,
  getNotificationSettings,
  NOTIF_SETTINGS_KEY,
} from '@/utils/notifications';

interface AboutModalProps {
  visible: boolean;
  onClose: () => void;
}

const EMAIL = 'wildflower07042026@gmail.com';
const PRIVACY_URL = 'https://wildflower2026.github.io/privacy.html';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function pad(n: number) { return n < 10 ? `0${n}` : `${n}`; }

function formatHour12(h: number) {
  const suffix = h < 12 ? 'am' : 'pm';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `daily around ${h12}${suffix}`;
}

export default function AboutModal({ visible, onClose }: AboutModalProps) {
  const colors = useColors();
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [notifHour, setNotifHour] = useState(18);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerRect, setPickerRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const timeRowRef = useRef<View>(null);
  const initialized = useRef(false);

  // Load persisted settings when modal first becomes visible
  useEffect(() => {
    if (!visible) return;
    getNotificationSettings().then(({ enabled, hour }) => {
      setNotifEnabled(enabled);
      setNotifHour(hour);
    }).catch(console.error);
    initialized.current = true;
  }, [visible]);

  const saveSettings = saveNotificationSettings;

  const handleToggle = async (val: boolean) => {
    setNotifEnabled(val);
    if (val) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        setNotifEnabled(false);
        return;
      }
      await scheduleDailyNotification(notifHour, 0);
    } else {
      await cancelDailyNotification();
    }
    await saveSettings(val, notifHour);
  };

  const handleTimeChange = async (hour: number) => {
    setNotifHour(hour);
    if (notifEnabled) {
      await scheduleDailyNotification(hour, 0);
    }
    await saveSettings(notifEnabled, hour);
  };

  const handleEmail = () => {
    Linking.openURL(`mailto:${EMAIL}?subject=Wildflower%20Feedback`);
  };

  const handlePrivacy = () => {
    Linking.openURL(PRIVACY_URL);
  };

  return (
    <>
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, {
            backgroundColor: colors.card,
            borderColor: colors.border,
            marginHorizontal: 20,
          }]}
          onPress={() => {}}
        >
          {/* ── SINGLE SCROLL: about + email + privacy + daily reminder + close ── */}
          <ScrollView style={{ flexShrink: 1 }} showsVerticalScrollIndicator={false} nestedScrollEnabled>

            {/* Header — app icon + name */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.logoCircle}>
                  <Image
                    source={require('@/assets/images/icon.png')}
                    style={styles.logoImg}
                    resizeMode="cover"
                  />
                </View>
                <Text style={[styles.headerTitle, { color: colors.foreground }]}>About Wildflower</Text>
              </View>
            </View>

            {/* Body */}
            <Text style={[styles.body, { color: colors.foreground }]}>
              Wildflower brings astrology, tarot, Lenormand, guided meditation, and ASMR sleep sounds into one quiet space — a place to check in with yourself daily.
            </Text>
            <Text style={[styles.body, { color: colors.foreground, marginTop: 12 }]}>
              Have a question, feedback, or found a bug? Wildflower would love to hear from you.
            </Text>

            <Pressable
              onPress={handleEmail}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={[styles.link, { color: colors.gold }]}>{EMAIL}</Text>
            </Pressable>

            {/* ── Daily reminder — below About section, above Close ── */}
            {Platform.OS !== 'web' && (
              <View style={{ marginTop: 4 }}>
                <Pressable
                  onPress={handlePrivacy}
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                >
                  <Text style={[styles.privacyLink, { color: colors.gold }]}>Check data protection & privacy</Text>
                </Pressable>
                <View style={[styles.divider, { backgroundColor: colors.border, marginTop: 12, marginBottom: 16 }]} />

                {/* Toggle row — label + switch */}
                <View style={styles.notifRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.notifLabel, { color: colors.foreground }]}>Daily reminder</Text>
                    <Text style={[styles.notifSub, { color: colors.mutedForeground }]}>
                      A gentle nudge to check in with yourself
                    </Text>
                  </View>
                  <Switch
                    value={notifEnabled}
                    onValueChange={handleToggle}
                    trackColor={{ false: colors.border, true: colors.gold + '88' }}
                    thumbColor={notifEnabled ? colors.gold : colors.mutedForeground}
                  />
                </View>

                {/* Time trigger row — only visible when the daily reminder is enabled */}
                {notifEnabled && (
                  <Pressable
                    ref={timeRowRef}
                    onPress={() => {
                      if (showTimePicker) {
                        setShowTimePicker(false);
                        return;
                      }
                      timeRowRef.current?.measure((_fx, _fy, width, height, px, py) => {
                        setPickerRect({ x: px, y: py, width, height });
                        setShowTimePicker(true);
                      });
                    }}
                    style={({ pressed }) => [
                      styles.timeRow,
                      { backgroundColor: colors.cardElevated ?? colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1, marginTop: 10 },
                    ]}
                  >
                    <Ionicons name="time-outline" size={androidIconSize(14)} color={colors.gold} />
                    <Text style={[styles.timeLabel, { color: colors.foreground }]}>
                      {formatHour12(notifHour)}
                    </Text>
                    <Ionicons
                      name={showTimePicker ? 'chevron-up' : 'chevron-down'}
                      size={androidIconSize(13)}
                      color={colors.mutedForeground}
                    />
                  </Pressable>
                )}
              </View>
            )}

            {/* Close button */}
            <View style={[styles.divider, { backgroundColor: colors.border, marginTop: 20 }]} />
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.closeBtn, { backgroundColor: colors.gold, opacity: pressed ? 0.8 : 1 }]}
            >
              <Text style={[styles.closeBtnText, { color: colors.background }]}>Close</Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>

    {/* ── Time picker — separate full-screen transparent Modal, anchored to trigger row ── */}
    <Modal
      visible={showTimePicker}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => setShowTimePicker(false)}
    >
      <Pressable style={{ flex: 1 }} onPress={() => setShowTimePicker(false)}>
        {pickerRect && (
          <View style={{
            position: 'absolute',
            bottom: Dimensions.get('screen').height - pickerRect.y + 4,
            left: pickerRect.x,
            width: pickerRect.width,
            backgroundColor: colors.card,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: '#000',
            shadowOpacity: 0.22,
            shadowRadius: 8,
            elevation: 10,
            overflow: 'hidden',
          }}>
            <ScrollView showsVerticalScrollIndicator style={{ maxHeight: 252 }}>
              {HOURS.map(h => (
                <Pressable
                  key={h}
                  onPress={() => { handleTimeChange(h); setShowTimePicker(false); }}
                  style={{
                    height: 42,
                    paddingHorizontal: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: h === notifHour ? colors.gold + '22' : 'transparent',
                  }}
                >
                  <Text style={{ fontSize: 13, fontFamily: FONT_BODY_MEDIUM, color: h === notifHour ? colors.gold : colors.foreground }}>
                    {formatHour12(h)}
                  </Text>
                  {h === notifHour && (
                    <Ionicons name="checkmark" size={androidIconSize(14)} color={colors.gold} style={{ marginLeft: 8 }} />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </Pressable>
    </Modal>
    </>
  );
}

const styles = createStyles({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
  },
  sheet: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    maxHeight: '85%',
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
  logoImg: {
    width: 33,
    height: 33,
  },
  headerTitle: {
    fontSize: 13,
    fontFamily: FONT_HEADING_SEMIBOLD,
  },
  closeBtn: {
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 4,
  },
  closeBtnText: {
    fontSize: 12,
    fontFamily: FONT_BODY_SEMIBOLD,
  },
  body: {
    fontSize: 11,
    fontFamily: FONT_BODY_REGULAR,
    lineHeight: 19,
  },
  link: {
    fontSize: 11,
    fontFamily: FONT_BODY_MEDIUM,
    marginTop: 16,
    textDecorationLine: 'underline',
  },
  privacyLink: {
    fontSize: 11,
    fontFamily: FONT_BODY_MEDIUM,
    marginTop: 8,
    marginBottom: 5,
    textDecorationLine: 'underline',
  },
  divider: {
    height: 1,
    marginVertical: 20,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  notifLabel: {
    fontSize: 12,
    fontFamily: FONT_BODY_SEMIBOLD,
  },
  notifSub: {
    fontSize: 10,
    fontFamily: FONT_BODY_REGULAR,
    marginTop: 2,
    lineHeight: 14,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  timeLabel: {
    flex: 1,
    fontSize: 12,
    fontFamily: FONT_BODY_MEDIUM,
  },
  pickerContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    height: 180,
  },
  pickerCol: {
    position: 'absolute',
    top: 8,
    fontSize: 9,
    fontFamily: FONT_BODY_MEDIUM,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    zIndex: 1,
  },
  pickerScroll: {
    flex: 1,
    paddingTop: 28,
  },
  pickerItem: {
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerItemText: {
    fontSize: 16,
    fontFamily: FONT_BODY_MEDIUM,
  },
});
