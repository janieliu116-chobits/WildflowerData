import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useProfiles, type Profile } from '@/contexts/ProfileContext';
import { useReadingCount } from '@/contexts/ReadingCountContext';
import AppHeader from '@/components/AppHeader';
import SliderTabs from '@/components/SliderTabs';
import NatalChartSVG from '@/components/NatalChartSVG';
import AccordionItem from '@/components/AccordionItem';
import AppBackground from '@/components/AppBackground';
import FloatingAudioPlayer from '@/components/FloatingAudioPlayer';
import { ChooseProfileSheet, CreateProfileSheet } from '@/components/ProfileSheet';
import {
  computeNatalChart, formatDegreeMinute, getOrdinalSuffix,
  getPlanetHouseInterpretation, getPlanetSignInterpretation,
  computeCompatibilityAspects,
  type NatalChart,
} from '@/utils/astrology';
import { createStyles, androidIconSize } from '@/utils/responsiveStyles';

type AstroTab = 'individual' | 'compatibility';
type DetailTab = 'signs' | 'houses' | 'aspects';

export default function AstrologyScreen() {
  const colors = useColors();
  const { profiles, selfProfile, isLoaded, addProfile } = useProfiles();
  const { readingCount } = useReadingCount();
  const [activeTab, setActiveTab] = useState<AstroTab>('individual');
  const [activeDetail, setActiveDetail] = useState<DetailTab>('signs');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [compProfile1Id, setCompProfile1Id] = useState<string | null>(null);
  const [compProfile2Id, setCompProfile2Id] = useState<string | null>(null);
  const [showProfilePicker, setShowProfilePicker] = useState(false);
  const [showCreateProfile, setShowCreateProfile] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'main' | 'comp1' | 'comp2'>('main');
  const [compatHint, setCompatHint] = useState(false);
  const compatHintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [tabRowTop, setTabRowTop] = useState(0);

  const compatLocked = readingCount < 10;

  // Get the currently selected profile (defaults to self). Falls back to
  // self/first profile if the previously-selected one was deleted, instead
  // of going blank — otherwise deleting whichever profile is on screen
  // leaves the tab stuck with no chart even though other profiles exist.
  const currentProfile = useMemo(() => {
    if (selectedProfileId) {
      const found = profiles.find(p => p.id === selectedProfileId);
      if (found) return found;
    }
    return selfProfile ?? profiles[0] ?? null;
  }, [selectedProfileId, profiles, selfProfile]);

  // Compute natal chart for selected profile (guarded against invalid birth time)
  const chart = useMemo((): NatalChart | null => {
    if (!currentProfile) return null;
    const birthDate = new Date(currentProfile.birthDate);
    if (isNaN(birthDate.getTime())) return null;
    const timeParts = (currentProfile.birthTime ?? '12:00').match(/^(\d{1,2}):(\d{2})$/);
    const hours = timeParts ? Math.min(23, parseInt(timeParts[1], 10)) : 12;
    const mins = timeParts ? Math.min(59, parseInt(timeParts[2], 10)) : 0;
    const lat = typeof currentProfile.latitude === 'number' && isFinite(currentProfile.latitude) ? currentProfile.latitude : 39.9;
    const lon = typeof currentProfile.longitude === 'number' && isFinite(currentProfile.longitude) ? currentProfile.longitude : 116.4;
    return computeNatalChart(birthDate, hours, mins, lat, lon);
  }, [currentProfile]);

  // Compatibility
  const comp1 = useMemo(() => {
    if (compProfile1Id) {
      const found = profiles.find(p => p.id === compProfile1Id);
      if (found) return found;
    }
    return selfProfile ?? profiles[0] ?? null;
  }, [compProfile1Id, profiles, selfProfile]);
  const comp2 = useMemo(() => {
    if (compProfile2Id) {
      const found = profiles.find(p => p.id === compProfile2Id);
      if (found) return found;
    }
    return profiles.find(p => p.id !== comp1?.id) ?? null;
  }, [compProfile2Id, profiles, comp1]);

  const chart1 = useMemo(() => {
    if (!comp1) return null;
    const d = new Date(comp1.birthDate);
    if (isNaN(d.getTime())) return null;
    const tp = (comp1.birthTime ?? '12:00').match(/^(\d{1,2}):(\d{2})$/);
    const lon1 = comp1.longitude ?? 116.4;
    const hours1 = tp ? Math.min(23, parseInt(tp[1], 10)) : 12;
    const mins1 = tp ? Math.min(59, parseInt(tp[2], 10)) : 0;
    return computeNatalChart(d, hours1, mins1, comp1.latitude ?? 39.9, lon1);
  }, [comp1]);

  const chart2 = useMemo(() => {
    if (!comp2) return null;
    const d = new Date(comp2.birthDate);
    if (isNaN(d.getTime())) return null;
    const tp = (comp2.birthTime ?? '12:00').match(/^(\d{1,2}):(\d{2})$/);
    const lon2 = comp2.longitude ?? 116.4;
    const hours2 = tp ? Math.min(23, parseInt(tp[1], 10)) : 12;
    const mins2 = tp ? Math.min(59, parseInt(tp[2], 10)) : 0;
    return computeNatalChart(d, hours2, mins2, comp2.latitude ?? 39.9, lon2);
  }, [comp2]);

  const compatibility = useMemo(() => {
    if (!chart1 || !chart2 || !comp1 || !comp2) return null;
    return computeCompatibilityAspects(chart1, comp1.name.split(' ')[0], chart2, comp2.name.split(' ')[0]);
  }, [chart1, chart2, comp1, comp2]);

  const openPicker = (target: typeof pickerTarget) => {
    setPickerTarget(target);
    setShowProfilePicker(true);
  };

  const handleProfileSelect = useCallback((profile: Profile) => {
    if (pickerTarget === 'main') {
      setSelectedProfileId(profile.id);
    } else if (pickerTarget === 'comp1') {
      if (profile.id === comp2?.id) return; // guard: can't match comp2
      setCompProfile1Id(profile.id);
    } else {
      if (profile.id === comp1?.id) return; // guard: can't match comp1
      setCompProfile2Id(profile.id);
    }
  }, [pickerTarget, comp1, comp2]);

  const noProfiles = isLoaded && profiles.length === 0;
  const scrollRef = React.useRef<ScrollView>(null);

  const handleTabChange = (id: string) => {
    if (id === 'compatibility' && compatLocked) {
      setCompatHint(true);
      if (compatHintTimer.current) clearTimeout(compatHintTimer.current);
      compatHintTimer.current = setTimeout(() => setCompatHint(false), 2500);
      return;
    }
    setCompatHint(false);
    setActiveTab(id as AstroTab);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppBackground />
      <AppHeader
        title="Astrology"
        icon={
          <Image
            source={require('@/assets/images/icon-astrology.png')}
            style={{ width: 36 * 1.2, height: 36 * 1.2, tintColor: colors.gold }}
            resizeMode="contain"
          />
        }
      />

      {/* Tabs + floating hint — hint is absolute so it doesn't push ScrollView down */}
      <View style={{ zIndex: 10 }} onLayout={(e) => setTabRowTop(e.nativeEvent.layout.y)}>
        <SliderTabs
          tabs={[
            { id: 'individual', label: 'Individual' },
            { id: 'compatibility', label: 'Compatibility', lockIcon: compatLocked },
          ]}
          activeId={activeTab}
          onChange={handleTabChange}
        />

      </View>

      {/* Compat hint overlay — at root level so it covers the full screen on any tap */}
      {compatHint && (
        <>
          <Pressable
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}
            onPress={() => { if (compatHintTimer.current) clearTimeout(compatHintTimer.current); setCompatHint(false); }}
          />
          <View style={[styles.hintBubbleWrap, { top: tabRowTop + (Platform.OS === 'android' ? 86 : 65), zIndex: 10000 }]}>
            <View style={[styles.hintBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="lock-closed-outline" size={16} color="#9ca3af" />
              <Text style={[styles.hintText, { color: '#9ca3af' }]} numberOfLines={1}>
                {`Unlocks after 10 readings (${readingCount}/10) in Ask`}
              </Text>
            </View>
          </View>
        </>
      )}

      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {activeTab === 'individual' ? (
          noProfiles ? (
            <NoProfilesPrompt onAdd={() => setShowCreateProfile(true)} colors={colors} />
          ) : (
            <IndividualTab
              profile={currentProfile}
              chart={chart}
              activeDetail={activeDetail}
              setActiveDetail={setActiveDetail}
              onPickProfile={() => openPicker('main')}
              colors={colors}
            />
          )
        ) : (
          noProfiles ? (
            <NoProfilesPrompt onAdd={() => setShowCreateProfile(true)} colors={colors} />
          ) : (
            <CompatibilityTab
              comp1={comp1}
              comp2={comp2}
              chart1={chart1}
              chart2={chart2}
              compatibility={compatibility}
              onPickComp1={() => openPicker('comp1')}
              onPickComp2={() => openPicker('comp2')}
              colors={colors}
            />
          )
        )}
      </ScrollView>

      <ChooseProfileSheet
        visible={showProfilePicker}
        onClose={() => setShowProfilePicker(false)}
        onSelect={handleProfileSelect}
        selected={pickerTarget === 'main' ? currentProfile?.id : pickerTarget === 'comp1' ? comp1?.id : comp2?.id}
        excludeId={pickerTarget === 'comp1' ? comp2?.id : pickerTarget === 'comp2' ? comp1?.id : undefined}
      />
      <CreateProfileSheet
        visible={showCreateProfile}
        onClose={() => setShowCreateProfile(false)}
        forceSelf={profiles.length === 0}
      />

      <FloatingAudioPlayer />
    </View>
  );
}

// ─── Individual Tab ────────────────────────────────────────────────────────────
function IndividualTab({ profile, chart, activeDetail, setActiveDetail, onPickProfile, colors }: any) {
  return (
    <View style={{ gap: 16 }}>
      {/* Profile selector */}
      <Pressable
        onPress={onPickProfile}
        style={({ pressed }) => [styles.profileSelector, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}
      >
        <View style={[styles.profileAvatar, { backgroundColor: colors.gold + '33', borderColor: colors.gold + '66' }]}>
          <Text style={[styles.avatarText, { color: colors.gold }]}>
            {profile?.name?.charAt(0).toUpperCase() ?? '?'}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.profileName, { color: colors.foreground }]}>{profile?.name ?? 'Select Profile'}</Text>
          <Text style={[styles.profileSub, { color: colors.mutedForeground }]}>
            {profile ? `${profile.birthCity || 'Unknown city'} · ${new Date(profile.birthDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : 'Tap to choose'}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={androidIconSize(18)} color={colors.mutedForeground} />
      </Pressable>

      {/* Natal chart */}
      {chart ? (
        <>
          <View style={styles.chartContainer}>
            <NatalChartSVG chart={chart} size={280} />
            <Text style={[styles.chartLabel, { color: colors.gold }]}>
              AC: {chart.ascendantSign}  ✦  MC: {(() => {
                const s = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
                return s[Math.floor(chart.mc / 30) % 12];
              })()}
            </Text>
          </View>

          {/* Detail tabs */}
          <View style={[styles.detailTabRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {(['signs', 'houses', 'aspects'] as DetailTab[]).map(dt => (
              <Pressable
                key={dt}
                onPress={() => setActiveDetail(dt)}
                style={[
                  styles.detailTab,
                  activeDetail === dt && [styles.detailTabActive, { borderColor: colors.gold, backgroundColor: colors.cardElevated }],
                ]}
              >
                <Text style={[styles.detailTabText, { color: activeDetail === dt ? colors.gold : colors.mutedForeground }]}>
                  {dt.charAt(0).toUpperCase() + dt.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Detail content */}
          {activeDetail === 'signs' && (
            <View style={{ gap: 8 }}>
              {chart.positions.map((p: NatalChart['positions'][number]) => (
                <AccordionItem
                  key={p.planet}
                  title={`${p.symbol !== 'AC' ? p.symbol : 'AC'} ${p.planet}`}
                  subtitle={`in ${p.signSymbol} ${p.sign} (${formatDegreeMinute(p.longitude)})`}
                  content={getPlanetSignInterpretation(p.planet, p.sign)}
                  defaultOpen={p.planet === 'Sun'}
                  truncate
                />
              ))}
            </View>
          )}

          {activeDetail === 'houses' && (
            <View style={{ gap: 8 }}>
              {chart.positions.filter((p: NatalChart['positions'][number]) => p.planet !== 'Ascendant').slice(0, 10).map((p: NatalChart['positions'][number]) => (
                <AccordionItem
                  key={p.planet}
                  title={`${p.symbol} ${p.planet}`}
                  subtitle={`in ${p.house}${getOrdinalSuffix(p.house)} House`}
                  content={getPlanetHouseInterpretation(p.planet, p.house)}
                  defaultOpen={p.planet === 'Sun'}
                  truncate
                />
              ))}
            </View>
          )}

          {activeDetail === 'aspects' && (
            <View style={{ gap: 8 }}>
              {chart.aspects.length === 0 && (
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No major aspects found.</Text>
              )}
              {[...chart.aspects].sort((a, b) => a.orb - b.orb).slice(0, 15).map((aspect, i) => (
                <AccordionItem
                  key={i}
                  title={aspect.aspectType}
                  subtitle={`${aspect.planet1} — ${aspect.planet2} · ${aspect.orb.toFixed(1)}°`}
                  content={aspect.description}
                  defaultOpen={i === 0}
                  truncate
                  borderColor={aspect.isHarmonious ? colors.gold + '44' : colors.destructive + '44'}
                  titleColor={aspect.isHarmonious ? colors.gold : colors.destructive}
                  subtitleColor={colors.foreground}
                />
              ))}
            </View>
          )}
        </>
      ) : (
        <View style={styles.noChart}>
          <Text style={[styles.noChartText, { color: colors.mutedForeground }]}>Select a profile to view natal chart</Text>
        </View>
      )}
    </View>
  );
}

// ─── Compatibility Tab ─────────────────────────────────────────────────────────
function CompatibilityTab({ comp1, comp2, chart1, chart2, compatibility, onPickComp1, onPickComp2, colors }: any) {
  const positiveCount = compatibility?.positive?.length ?? 0;
  const negativeCount = compatibility?.negative?.length ?? 0;
  const totalAspects = positiveCount + negativeCount;
  const score = totalAspects > 0 ? Math.round((positiveCount / totalAspects) * 100) : 0;
  const [aspectView, setAspectView] = useState<'positive' | 'negative'>('positive');

  return (
    <View style={{ gap: 16 }}>
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Compare two charts</Text>

      {/* Profile selectors */}
      <View style={styles.compRow}>
        <Pressable
          onPress={onPickComp1}
          style={({ pressed }) => [styles.compSelector, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}
        >
          <View style={[styles.profileAvatar, { backgroundColor: colors.gold + '33', borderColor: colors.gold + '66' }]}>
            <Text style={[styles.avatarText, { color: colors.gold }]}>{comp1?.name?.charAt(0) ?? '?'}</Text>
          </View>
          <Text style={[styles.compName, { color: colors.foreground }]} numberOfLines={1}>{comp1?.name ?? 'Choose'}</Text>
          <Ionicons name="chevron-down" size={androidIconSize(14)} color={colors.mutedForeground} />
        </Pressable>
        <View style={styles.compHeart}>
          <Text style={{ fontSize: 17, color: colors.gold }}>♡</Text>
        </View>
        <Pressable
          onPress={onPickComp2}
          style={({ pressed }) => [styles.compSelector, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}
        >
          <View style={[styles.profileAvatar, { backgroundColor: '#6495ED33', borderColor: '#6495ED66' }]}>
            <Text style={[styles.avatarText, { color: '#6495ED' }]}>{comp2?.name?.charAt(0) ?? '?'}</Text>
          </View>
          <Text style={[styles.compName, { color: colors.foreground }]} numberOfLines={1}>{comp2?.name ?? 'Choose'}</Text>
          <Ionicons name="chevron-down" size={androidIconSize(14)} color={colors.mutedForeground} />
        </Pressable>
      </View>

      {/* Score */}
      {compatibility && (
        <View style={[styles.scoreCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>Compatibility Score</Text>
          <Text style={[styles.score, { color: score >= 60 ? colors.gold : colors.foreground }]}>{score}%</Text>
          <Text style={[styles.scoreSub, { color: colors.mutedForeground }]}>
            {positiveCount} harmonious · {negativeCount} challenging aspects
          </Text>
        </View>
      )}

      {/* Aspect toggle */}
      {(positiveCount > 0 || negativeCount > 0) && (
        <View style={{ gap: 10 }}>
          <View style={styles.aspectToggleRow}>
            <Pressable
              onPress={() => setAspectView('positive')}
              style={[
                styles.aspectToggleBtn,
                {
                  backgroundColor: aspectView === 'positive' ? colors.gold + '22' : colors.card,
                  borderColor: aspectView === 'positive' ? colors.gold : colors.border,
                },
              ]}
            >
              <Text style={[styles.aspectToggleText, { color: aspectView === 'positive' ? colors.gold : colors.mutedForeground }]}>
                Harmonious
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setAspectView('negative')}
              style={[
                styles.aspectToggleBtn,
                {
                  backgroundColor: aspectView === 'negative' ? colors.destructive + '22' : colors.card,
                  borderColor: aspectView === 'negative' ? colors.destructive : colors.border,
                },
              ]}
            >
              <Text style={[styles.aspectToggleText, { color: aspectView === 'negative' ? colors.destructive : colors.mutedForeground }]}>
                Growth Areas
              </Text>
            </Pressable>
          </View>

          {[...(aspectView === 'positive' ? compatibility?.positive ?? [] : compatibility?.negative ?? [])].sort((a: any, b: any) => a.orb - b.orb).slice(0, 8).map((a: any, i: number) => {
            const tone = aspectView === 'positive' ? colors.gold : colors.destructive;
            return (
              <AccordionItem
                key={`${aspectView}-${i}`}
                title={`${a.aspectType} (${a.orb.toFixed(1)}°)`}
                subtitle={`${a.planet1} — ${a.planet2}`}
                content={a.description}
                defaultOpen={i === 0}
                truncate
                borderColor={tone + '33'}
                titleColor={tone}
                subtitleColor={colors.foreground}
              />
            );
          })}
        </View>
      )}

      {!comp1 && !comp2 && (
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          Select two profiles to see their compatibility.
        </Text>
      )}
    </View>
  );
}

function NoProfilesPrompt({ onAdd, colors }: { onAdd: () => void; colors: any }) {
  return (
    <View style={styles.noProfile}>
      <Text style={{ fontSize: 41, marginBottom: 16, color: colors.foreground }}>✦</Text>
      <Text style={[styles.noProfileTitle, { color: colors.foreground }]}>No profiles yet</Text>
      <Text style={[styles.noProfileSub, { color: colors.mutedForeground }]}>
        Add your birth details to see your natal chart, planet positions, and compatibility readings.
      </Text>
      <Pressable
        onPress={onAdd}
        style={({ pressed }) => [styles.addBtn, { backgroundColor: colors.gold, opacity: pressed ? 0.8 : 1 }]}
      >
        <Text style={[styles.addBtnText, { color: colors.background }]}>Create Your Profile</Text>
      </Pressable>
    </View>
  );
}

const styles = createStyles({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 20,
    paddingBottom: 120,
    gap: 0,
  },
  hintBubbleWrap: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 86 : 65,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  hintBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  hintText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
  profileSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15.5,
    fontFamily: 'Inter_600SemiBold',
  },
  profileName: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  profileSub: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 8,
    gap: 8,
  },
  chartLabel: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  detailTabRow: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  detailTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  detailTabActive: {
    borderWidth: 1,
  },
  detailTabText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
  noChart: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noChartText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  emptyText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    paddingVertical: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  compRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  compHeart: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
  },
  compName: {
    flex: 1,
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
  scoreCard: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  scoreLabel: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  score: {
    fontSize: 42,
    fontFamily: 'Inter_700Bold',
  },
  scoreSub: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  aspectToggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  aspectToggleBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  aspectToggleText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
  noProfile: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  noProfileTitle: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 10,
  },
  noProfileSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  addBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 22,
  },
  addBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
});
