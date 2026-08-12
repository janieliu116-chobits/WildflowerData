import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Animated, PanResponder, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useProfiles, type Profile } from '@/contexts/ProfileContext';
import BottomSheet from './BottomSheet';
import { GENDERS, RELATIONSHIPS } from '@/constants/data';
import { createStyles, androidIconSize } from '@/utils/responsiveStyles';

// ─── City Autocomplete ────────────────────────────────────────────────────────
interface CitySuggestion {
  displayName: string;
  latitude: number;
  longitude: number;
}

function apiBaseUrl(): string {
  const domain = process.env['EXPO_PUBLIC_DOMAIN'];
  return domain ? `https://${domain}` : '';
}

async function searchCities(query: string): Promise<CitySuggestion[]> {
  const res = await fetch(`${apiBaseUrl()}/api/geocode?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Geocode request failed');
  const data = (await res.json()) as { results: CitySuggestion[] };
  return data.results ?? [];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function getMaxDay(month: number, year: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  if ([4, 6, 9, 11].includes(month)) return 30;
  return 31;
}

function parseDateInput(value: string): Date | null {
  // Accept YYYY-MM-DD or MM/DD/YYYY
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const d = new Date(value + 'T12:00:00Z');
    return isNaN(d.getTime()) ? null : d;
  }
  const mdy = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy) {
    const d = new Date(`${mdy[3]}-${mdy[1].padStart(2,'0')}-${mdy[2].padStart(2,'0')}T12:00:00Z`);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function sanitizeBirthTime(raw: string): string {
  const match = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return '12:00';
  const h = Math.min(23, parseInt(match[1], 10));
  const m = Math.min(59, parseInt(match[2], 10));
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// Returns an error message if `value` is non-empty but not a recognized date
// format (YYYY-MM-DD, or the MM/DD/YYYY fallback parseDateInput also
// accepts), or null if the value is empty or valid. Also validates that the
// year, month and day fall within their allowed ranges (including leap-year
// awareness for February). Empty is left to the "required" check at submit
// time so the field never errors before the user has started typing.
function validateDateFormat(value: string): string | null {
  if (!value.trim()) return null;

  // Extract raw numeric parts so we can give precise range errors even when
  // JS Date would silently roll over an out-of-range value.
  let year: number, month: number, day: number;
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const mdy = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (iso) {
    year  = parseInt(iso[1], 10);
    month = parseInt(iso[2], 10);
    day   = parseInt(iso[3], 10);
  } else if (mdy) {
    year  = parseInt(mdy[3], 10);
    month = parseInt(mdy[1], 10);
    day   = parseInt(mdy[2], 10);
  } else {
    return 'Enter the date as YYYY-MM-DD (e.g. 1990-05-23).';
  }

  if (year  < 1000 || year  > 9999) return 'Year must be between 1000 and 9999.';
  if (month < 1    || month > 12)   return 'Month must be between 1 and 12.';
  const maxDay = getMaxDay(month, year);
  if (day < 1 || day > maxDay) {
    if (month === 2) {
      return `Day must be 1–${maxDay} for February ${year} (${isLeapYear(year) ? 'leap year' : 'not a leap year'}).`;
    }
    return `Day must be 1–${maxDay} for this month.`;
  }
  return null;
}

// Returns an error message if `value` is non-empty but not strict HH:MM
// 24-hour format, or null if empty (birth time is optional -- it defaults
// to 12:00) or valid.
function validateTimeFormat(value: string): string | null {
  if (!value.trim()) return null;
  const match = value.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  return match ? null : 'Enter the time as HH:MM in 24-hour format (e.g. 14:30).';
}

// ─── Choose Profile Sheet ─────────────────────────────────────────────────────
interface ChooseProfileSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (profile: Profile) => void;
  selected?: string;
  excludeId?: string;
  /** When true, the inline Create sheet forces isSelf=true (no Relationship field). */
  forceSelfOnCreate?: boolean;
}

export function ChooseProfileSheet({ visible, onClose, onSelect, selected, excludeId, forceSelfOnCreate }: ChooseProfileSheetProps) {
  const colors = useColors();
  const { profiles, deleteProfile } = useProfiles();
  const [showCreate, setShowCreate] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | undefined>(undefined);

  // Auto-close only when the last profile is *deleted* while the sheet is
  // open — not when the sheet is opened with zero profiles (in that case the
  // user should see the sheet so they can hit "Add New Profile").
  const prevProfilesLength = useRef(profiles.length);
  useEffect(() => {
    const wasNonEmpty = prevProfilesLength.current > 0;
    prevProfilesLength.current = profiles.length;
    if (visible && profiles.length === 0 && wasNonEmpty) {
      onClose();
    }
  }, [profiles.length, visible]);

  // Alert.alert has no visible UI on web (Expo web has no native alert
  // dialog to fall back to), so confirming via Alert silently did nothing
  // there and made deletion look broken. window.confirm works everywhere
  // Alert.alert doesn't, so route through it on web and keep the native
  // Alert on iOS/Android.
  const handleDelete = (profile: Profile) => {
    const message = `Are you sure you want to delete ${profile.name}? This cannot be undone.`;
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(message)) {
        deleteProfile(profile.id);
      }
      return;
    }
    Alert.alert(
      'Delete profile',
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteProfile(profile.id) },
      ]
    );
  };

  const visibleProfiles = excludeId ? profiles.filter(p => p.id !== excludeId) : profiles;

  return (
    <>
      <BottomSheet visible={visible && !showCreate && !editingProfile} onClose={onClose}>
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Choose Profile</Text>
          {visibleProfiles.length === 0 && (
            <Text style={[styles.empty, { color: colors.mutedForeground }]}>No other profiles yet. Create one below.</Text>
          )}
          {visibleProfiles.map(profile => (
            <ProfileRow
              key={profile.id}
              profile={profile}
              isSelected={selected === profile.id}
              onPress={() => { onSelect(profile); onClose(); }}
              onEdit={() => setEditingProfile(profile)}
              onDelete={() => handleDelete(profile)}
              colors={colors}
            />
          ))}
          <Pressable
            onPress={() => setShowCreate(true)}
            style={({ pressed }) => [styles.addBtn, { borderColor: colors.gold + '66', opacity: pressed ? 0.7 : 1 }]}
          >
            <Ionicons name="add" size={androidIconSize(20)} color={colors.gold} />
            <Text style={[styles.addBtnText, { color: colors.gold }]}>Add New Profile</Text>
          </Pressable>
        </View>
      </BottomSheet>
      <CreateProfileSheet
        visible={visible && showCreate}
        onClose={() => setShowCreate(false)}
        onSave={() => setShowCreate(false)}
        forceSelf={forceSelfOnCreate}
      />
      <CreateProfileSheet
        // Remount per profile so each edit session seeds its form state
        // fresh from that profile's data, instead of reusing stale state
        // left over from whichever profile was edited previously.
        key={editingProfile?.id ?? 'edit-none'}
        visible={!!editingProfile}
        onClose={() => setEditingProfile(undefined)}
        onSave={() => setEditingProfile(undefined)}
        profileToEdit={editingProfile}
      />
    </>
  );
}

// ─── Swipeable Profile Row ────────────────────────────────────────────────────
// Mirrors AudioListItem's swipe-left-to-delete gesture. Deletion still runs
// through the existing confirm dialog: releasing past the threshold shows
// the confirm prompt, and the row only animates away if the user confirms —
// otherwise it springs back so a swipe never destroys data by accident.
interface ProfileRowProps {
  profile: Profile;
  isSelected: boolean;
  onPress: () => void;
  onEdit: () => void;
  onDelete?: () => void;
  colors: any;
}

function ProfileRow({ profile, isSelected, onPress, onEdit, onDelete, colors }: ProfileRowProps) {
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => !!onDelete && Math.abs(g.dx) > 10 && Math.abs(g.dy) < 20,
      onPanResponderMove: (_, g) => {
        if (g.dx < 0) translateX.setValue(g.dx);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx < -80 && onDelete) {
          onDelete();
        }
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
      },
    })
  ).current;

  const row = (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.profileItem,
        {
          backgroundColor: colors.cardElevated,
          borderColor: isSelected ? colors.gold : colors.border,
          transform: [{ translateX }],
        },
      ]}
    >
      {/* Gold tint overlay — kept inside so the Animated.View itself stays
          opaque, preventing the delete zone from bleeding through. */}
      {isSelected && (
        <View style={[styles.selectedOverlay, { backgroundColor: colors.gold + '22' }]} pointerEvents="none" />
      )}
      <Pressable onPress={onPress} style={styles.profileItemPressable}>
        <View style={[styles.profileAvatar, { backgroundColor: colors.gold + '33', borderColor: colors.gold + '66' }]}>
          <Text style={[styles.avatarText, { color: colors.gold }]}>{profile.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: colors.foreground }]}>{profile.name}</Text>
          <Text style={[styles.profileDetail, { color: colors.mutedForeground }]}>
            {profile.isSelf ? 'You' : profile.relationship} · {new Date(profile.birthDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </Text>
        </View>
      </Pressable>
      {isSelected && (
        <Ionicons name="checkmark-circle" size={androidIconSize(20)} color={colors.gold} style={{ marginRight: 2 }} />
      )}
      <Pressable
        onPress={onEdit}
        hitSlop={8}
        style={({ pressed }) => [styles.rowIconBtn, { opacity: pressed ? 0.6 : 1 }]}
      >
        <Ionicons name="pencil-outline" size={androidIconSize(17)} color={colors.mutedForeground} />
      </Pressable>
    </Animated.View>
  );

  if (!onDelete) {
    return <View style={{ marginBottom: 8 }}>{row}</View>;
  }

  // Fixed-width zone sits behind the opaque row. Because the row background
  // is always opaque (cardElevated), the zone is completely invisible at rest
  // and is revealed at its full fixed width as the user swipes left.
  return (
    <View style={styles.profileRowWrapper}>
      <View
        style={[styles.deleteZone, { backgroundColor: colors.destructive + '22' }]}
        pointerEvents="none"
      >
        <Ionicons name="trash-outline" size={androidIconSize(16)} color={colors.destructive} />
        <Text style={[styles.swipeHintText, { color: colors.destructive }]}>Delete</Text>
      </View>
      {row}
    </View>
  );
}

// ─── Create / Edit Profile Sheet ──────────────────────────────────────────────
interface CreateProfileSheetProps {
  visible: boolean;
  onClose: () => void;
  onSave?: () => void;
  profileToEdit?: Profile;
  forceSelf?: boolean;
}

export function CreateProfileSheet({ visible, onClose, onSave, profileToEdit, forceSelf }: CreateProfileSheetProps) {
  const colors = useColors();
  const { addProfile, updateProfile } = useProfiles();

  const [name, setName] = useState(profileToEdit?.name ?? '');
  const [gender, setGender] = useState(profileToEdit?.gender ?? GENDERS[0]);
  const [birthDateStr, setBirthDateStr] = useState(() => {
    if (profileToEdit?.birthDate) {
      const d = new Date(profileToEdit.birthDate);
      return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    }
    return '';
  });
  const [birthTime, setBirthTime] = useState(profileToEdit?.birthTime ?? '');
  const [dateError, setDateError] = useState<string | null>(null);
  const [timeError, setTimeError] = useState<string | null>(null);
  const [birthCity, setBirthCity] = useState(profileToEdit?.birthCity ?? '');
  const [latitude, setLatitude] = useState(profileToEdit?.latitude ?? 0);
  const [longitude, setLongitude] = useState(profileToEdit?.longitude ?? 0);
  const [hasCoords, setHasCoords] = useState(!!profileToEdit);
  const [citySuggestions, setCitySuggestions] = useState<CitySuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [citySearching, setCitySearching] = useState(false);
  // Auto-open the coords panel when editing a profile that was saved with
  // manual coordinates (no city name), so the user can see what's stored.
  const [manualCoords, setManualCoords] = useState(
    !!profileToEdit && !profileToEdit.birthCity?.trim()
  );
  const [latText, setLatText] = useState(profileToEdit ? String(profileToEdit.latitude) : '');
  const [lonText, setLonText] = useState(profileToEdit ? String(profileToEdit.longitude) : '');
  const cityDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  // Tracks the Y offset of the birth-city section within the ScrollView so
  // we can scroll precisely to it when the field is focused, ensuring both
  // the input and the suggestions dropdown stay above the keyboard.
  const cityWrapperY = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (cityDebounce.current) clearTimeout(cityDebounce.current);
    };
  }, []);

  // The "New Profile" sheet stays mounted (only hidden) between opens so its
  // closing animation can finish, which means its useState defaults only
  // apply once — without this, whatever was typed the last time "Add New
  // Profile" was opened would still be sitting in the fields next time.
  // Reset on every open, but only in create mode: editing already gets a
  // fresh instance per profile via the `key` prop where it's rendered.
  useEffect(() => {
    if (visible && !profileToEdit) {
      setName('');
      setGender(GENDERS[0]);
      setBirthDateStr('');
      setBirthTime('');
      setDateError(null);
      setTimeError(null);
      setBirthCity('');
      setLatitude(0);
      setLongitude(0);
      setHasCoords(false);
      setCitySuggestions([]);
      setShowSuggestions(false);
      setCitySearching(false);
      setManualCoords(false);
      setLatText('');
      setLonText('');
      setRelationship('Friend');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleCityChange = (text: string) => {
    setBirthCity(text);
    setHasCoords(false);
    if (cityDebounce.current) clearTimeout(cityDebounce.current);
    if (text.trim().length < 2) {
      // If the field is fully cleared, wipe the coordinate fields too so they
      // don't silently retain a city's values when the panel is hidden.
      if (!text.trim()) {
        setLatitude(0);
        setLongitude(0);
        setLatText('');
        setLonText('');
      }
      setCitySuggestions([]);
      setShowSuggestions(false);
      return;
    }
    cityDebounce.current = setTimeout(async () => {
      setCitySearching(true);
      try {
        const results = await searchCities(text.trim());
        setCitySuggestions(results);
        setShowSuggestions(true);
      } catch (e) {
        console.error('City search failed:', e);
        setCitySuggestions([]);
      } finally {
        setCitySearching(false);
      }
    }, 400);
  };

  const handleSelectCity = (suggestion: CitySuggestion) => {
    setBirthCity(suggestion.displayName);
    setLatitude(suggestion.latitude);
    setLongitude(suggestion.longitude);
    // Always sync the text fields so they reflect the city's coords whether
    // the manual-entry panel is visible or hidden.
    setLatText(String(suggestion.latitude));
    setLonText(String(suggestion.longitude));
    setHasCoords(true);
    setShowSuggestions(false);
    setCitySuggestions([]);
  };

  // Silently apply manual coords whenever both fields contain valid numbers.
  // Called on blur of either lat/lon field — no Alert, so partial input while
  // still typing doesn't interrupt the user.
  const tryApplyManualCoords = () => {
    const lat = parseFloat(latText);
    const lon = parseFloat(lonText);
    if (!isNaN(lat) && lat >= -90 && lat <= 90 && !isNaN(lon) && lon >= -180 && lon <= 180) {
      setLatitude(lat);
      setLongitude(lon);
      setHasCoords(true);
      setShowSuggestions(false);
    }
  };

  const [relationship, setRelationship] = useState<string>(
    profileToEdit?.isSelf ? 'Friend' : (profileToEdit?.relationship ?? 'Friend')
  );
  // Identity is no longer a user-facing toggle: the very first profile a user
  // creates is always "self" (forceSelf), every profile after that is always
  // someone else, and editing an existing profile preserves its original
  // isSelf value rather than letting the user flip it.
  const isSelf = profileToEdit ? profileToEdit.isSelf : (forceSelf ?? false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter a name for this profile.');
      return;
    }
    if (!birthDateStr.trim()) {
      Alert.alert('Birth date required', 'Please enter a date in YYYY-MM-DD format (e.g. 1990-05-23).');
      return;
    }
    const dateErr = validateDateFormat(birthDateStr);
    if (dateErr) {
      setDateError(dateErr);
      return;
    }
    const timeErr = validateTimeFormat(birthTime);
    if (timeErr) {
      setTimeError(timeErr);
      return;
    }
    const parsedDate = parseDateInput(birthDateStr);
    if (!parsedDate) {
      Alert.alert('Birth date required', 'Please enter a date in YYYY-MM-DD format (e.g. 1990-05-23).');
      return;
    }
    // Compute effective coords. When the manual-coords panel is open, always
    // apply the text-field values — they may have been edited since the last
    // blur (tryApplyManualCoords) or may override an auto-filled city lat/lon.
    let effectiveLat = latitude;
    let effectiveLon = longitude;
    let effectiveHasCoords = hasCoords;
    if (manualCoords) {
      const lat = parseFloat(latText);
      const lon = parseFloat(lonText);
      if (!isNaN(lat) && lat >= -90 && lat <= 90 && !isNaN(lon) && lon >= -180 && lon <= 180) {
        effectiveLat = lat;
        effectiveLon = lon;
        effectiveHasCoords = true;
      } else if (latText || lonText) {
        Alert.alert('Invalid coordinates', 'Latitude must be between -90 and 90, longitude between -180 and 180.');
        return;
      }
    }
    if (!effectiveHasCoords) {
      if (!birthCity.trim()) {
        Alert.alert('Birth city required', 'Please enter a birth city or use "Enter coordinates" if you can\'t find it.');
        return;
      }
      Alert.alert('Location not set', 'Please select a city from the dropdown to confirm your birth location.');
      return;
    }
    const sanitizedTime = sanitizeBirthTime(birthTime || '12:00');
    const profileData = {
      name: name.trim(),
      gender,
      birthDate: parsedDate.toISOString(),
      birthTime: sanitizedTime,
      birthCity: birthCity.trim(),
      latitude: effectiveLat,
      longitude: effectiveLon,
      relationship: (isSelf ? 'Self' : relationship) as Profile['relationship'],
      isSelf,
    };
    if (profileToEdit) {
      await updateProfile(profileToEdit.id, profileData);
    } else {
      await addProfile(profileData);
    }
    onSave?.();
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <ScrollView
        ref={scrollRef}
        style={{ paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
          {profileToEdit ? 'Edit Profile' : 'New Profile'}
        </Text>

        {/* Name */}
        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={isSelf ? 'Your name' : 'Their name'}
          placeholderTextColor={colors.mutedForeground}
          style={[
            styles.textInput,
            { backgroundColor: colors.cardElevated, borderColor: colors.border, color: colors.foreground },
          ]}
        />

        {/* Gender */}
        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Gender</Text>
        <View style={styles.chipRow}>
          {GENDERS.map((g) => (
            <Pressable
              key={g}
              onPress={() => setGender(g)}
              style={[
                styles.chip,
                {
                  borderColor: gender === g ? colors.gold : colors.border,
                  backgroundColor: gender === g ? colors.gold + '22' : colors.cardElevated,
                },
              ]}
            >
              <Text style={[styles.chipText, { color: gender === g ? colors.gold : colors.foreground }]}>{g}</Text>
            </Pressable>
          ))}
        </View>

        {/* Birth date */}
        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Birth Date (YYYY-MM-DD)</Text>
        <TextInput
          value={birthDateStr}
          onChangeText={(text) => {
            setBirthDateStr(text);
            // Validate range errors inline once the format is complete so the
            // user sees feedback before leaving the field; clear while typing.
            if (/^\d{4}-\d{2}-\d{2}$/.test(text) || /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(text)) {
              setDateError(validateDateFormat(text));
            } else {
              if (dateError) setDateError(null);
            }
          }}
          onBlur={() => setDateError(validateDateFormat(birthDateStr))}
          placeholder="1990-05-23"
          placeholderTextColor={colors.mutedForeground}
          keyboardType="numbers-and-punctuation"
          style={[
            styles.textInput,
            {
              backgroundColor: colors.cardElevated,
              borderColor: dateError ? colors.destructive : colors.border,
              color: colors.foreground,
            },
          ]}
        />
        {dateError && <Text style={[styles.errorText, { color: colors.destructive }]}>{dateError}</Text>}

        {/* Birth Time */}
        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Birth Time (HH:MM, 24h)</Text>
        <TextInput
          value={birthTime}
          onChangeText={(text) => {
            setBirthTime(text);
            if (timeError) setTimeError(null);
          }}
          onBlur={() => setTimeError(validateTimeFormat(birthTime))}
          placeholder="12:00"
          placeholderTextColor={colors.mutedForeground}
          keyboardType="numbers-and-punctuation"
          style={[
            styles.textInput,
            {
              backgroundColor: colors.cardElevated,
              borderColor: timeError ? colors.destructive : colors.border,
              color: colors.foreground,
            },
          ]}
        />
        {timeError && <Text style={[styles.errorText, { color: colors.destructive }]}>{timeError}</Text>}
        <Text style={[styles.hint, { color: colors.mutedForeground }]}>
          Used for calculating your Ascendant. Enter 12:00 if unknown.
        </Text>

        {/* Birth City */}
        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Birth City</Text>
        <View
          style={{ position: 'relative', zIndex: 10 }}
          onLayout={(e) => { cityWrapperY.current = e.nativeEvent.layout.y; }}
        >
          <View style={{ position: 'relative', justifyContent: 'center' }}>
            <TextInput
              value={birthCity}
              onChangeText={handleCityChange}
              onFocus={() => {
                if (citySuggestions.length > 0) setShowSuggestions(true);
                // Scroll so the city input sits near the top of the visible
                // area, leaving ~250 px below for the suggestions dropdown
                // before the keyboard starts.
                setTimeout(() => scrollRef.current?.scrollTo({ y: Math.max(0, cityWrapperY.current - 40), animated: true }), 150);
              }}
              placeholder="Start typing a city…"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.textInput,
                { backgroundColor: colors.cardElevated, borderColor: colors.border, color: colors.foreground, paddingRight: 64 },
              ]}
            />
            {citySearching && (
              <ActivityIndicator size="small" color={colors.gold} style={{ position: 'absolute', right: 12 }} />
            )}
            {!citySearching && hasCoords && birthCity.trim().length > 0 && (
              <Ionicons name="checkmark-circle" size={androidIconSize(18)} color={colors.gold} style={{ position: 'absolute', right: 38 }} />
            )}
            {!citySearching && birthCity.length > 0 && (
              <Pressable
                onPress={() => handleCityChange('')}
                hitSlop={10}
                style={{ position: 'absolute', right: 10 }}
              >
                <Ionicons name="close-circle" size={androidIconSize(18)} color={colors.mutedForeground} />
              </Pressable>
            )}
          </View>

          {showSuggestions && citySuggestions.length > 0 && (
            <View style={[styles.suggestionBox, { backgroundColor: colors.cardElevated, borderColor: colors.border }]}>
              {citySuggestions.map((s, i) => (
                <Pressable
                  key={`${s.displayName}-${i}`}
                  onPress={() => handleSelectCity(s)}
                  style={({ pressed }) => [
                    styles.suggestionItem,
                    { borderBottomColor: colors.border, opacity: pressed ? 0.6 : 1 },
                    i === citySuggestions.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <Ionicons name="location-outline" size={androidIconSize(14)} color={colors.mutedForeground} />
                  <Text style={[styles.suggestionText, { color: colors.foreground }]} numberOfLines={1}>{s.displayName}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        <Pressable onPress={() => setManualCoords((m) => !m)} style={{ marginTop: 8 }}>
          <Text style={[styles.linkText, { color: colors.gold }]}>
            {manualCoords ? 'Hide coordinate entry' : "Can't find your city? Enter coordinates"}
          </Text>
        </Pressable>

        {manualCoords && (
          <View style={styles.coordsRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground, marginTop: 8 }]}>Latitude</Text>
              <TextInput
                value={latText}
                onChangeText={(text) => { setLatText(text); setBirthCity(''); }}
                onBlur={tryApplyManualCoords}
                placeholder="e.g. 40.7128"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numbers-and-punctuation"
                style={[
                  styles.textInput,
                  { backgroundColor: colors.cardElevated, borderColor: colors.border, color: colors.foreground },
                ]}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground, marginTop: 8 }]}>Longitude</Text>
              <TextInput
                value={lonText}
                onChangeText={(text) => { setLonText(text); setBirthCity(''); }}
                onBlur={tryApplyManualCoords}
                placeholder="e.g. -74.0060"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numbers-and-punctuation"
                style={[
                  styles.textInput,
                  { backgroundColor: colors.cardElevated, borderColor: colors.border, color: colors.foreground },
                ]}
              />
            </View>
          </View>
        )}
        {manualCoords && hasCoords && (
          <Text style={[styles.hint, { color: colors.gold, marginTop: 8 }]}>
            ✓ Coordinates applied
          </Text>
        )}

        {/* Relationship (only if not self) */}
        {!isSelf && (
          <>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Relationship</Text>
            <View style={styles.chipRow}>
              {RELATIONSHIPS.map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setRelationship(r)}
                  style={[
                    styles.chip,
                    {
                      borderColor: relationship === r ? colors.gold : colors.border,
                      backgroundColor: relationship === r ? colors.gold + '22' : colors.cardElevated,
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: relationship === r ? colors.gold : colors.foreground }]}>{r}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        <Pressable
          onPress={handleSave}
          style={({ pressed }) => [styles.saveBtn, { backgroundColor: colors.gold, opacity: pressed ? 0.8 : 1 }]}
        >
          <Text style={[styles.saveBtnText, { color: colors.background }]}>
            {profileToEdit ? 'Save Changes' : 'Create Profile'}
          </Text>
        </Pressable>
        {/* Extra bottom padding so the Save button scrolls fully above the keyboard */}
        <View style={{ height: 60 }} />
      </ScrollView>
    </BottomSheet>
  );
}

const styles = createStyles({
  sheetTitle: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 16,
    textAlign: 'center',
  },
  empty: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginBottom: 12,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  profileItemPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileRowWrapper: {
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  deleteZone: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    paddingRight: 16,
  },
  selectedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
  },
  swipeHintText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
  rowIconBtn: {
    padding: 4,
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
  profileInfo: { flex: 1 },
  profileName: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  profileDetail: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginTop: 4,
    marginBottom: 16,
  },
  addBtnText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  selfToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  selfToggleText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  suggestionBox: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    zIndex: 20,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  suggestionText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    flex: 1,
  },
  linkText: {
    fontSize: 11.5,
    fontFamily: 'Inter_500Medium',
    textDecorationLine: 'underline',
  },
  coordsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  applyCoordsBtn: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  applyCoordsText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
  fieldLabel: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 12,
  },
  errorText: {
    fontSize: 10.5,
    fontFamily: 'Inter_500Medium',
    marginTop: 6,
  },
  hint: {
    fontSize: 9.5,
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
    fontStyle: 'italic',
  },
  textInput: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  saveBtn: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveBtnText: {
    fontSize: 13.5,
    fontFamily: 'Inter_600SemiBold',
  },
});
