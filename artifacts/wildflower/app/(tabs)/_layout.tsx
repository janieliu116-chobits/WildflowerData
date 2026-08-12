import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { androidIconSize } from '@/utils/responsiveStyles';

// Fixed-height wrapper so every tab icon — whether it's an Ionicon (which
// centers itself within its font metrics) or an Image (which doesn't) —
// lands on the same vertical center within the tab bar.
const ICON_SLOT = androidIconSize(24);

function IconSlot({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ height: ICON_SLOT, alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </View>
  );
}

function IconImage({ source, color, size }: { source: number; color: string; size: number }) {
  return (
    <Image
      source={source}
      style={{ width: size, height: size, tintColor: color }}
      resizeMode="contain"
    />
  );
}

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  // On Android, phones with the classic on-screen nav bar (or a gesture
  // pill) report a non-zero bottom inset; without adding it to the tab
  // bar's own padding the bar sits partly behind/under that system bar
  // instead of clear above it.
  const androidBottomPad = Platform.OS === 'android' ? Math.max(8, insets.bottom) : 8;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Without this, the navigator's scene container defaults to a
        // plain (white on Android/Expo Go) background, which flashes
        // through as a bar under the input whenever the keyboard-driven
        // resize briefly exposes it — force it to match the app's dark
        // background so nothing shows through.
        sceneStyle: { backgroundColor: colors.background },
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 82 : 60 + (androidBottomPad - 8),
          paddingBottom: Platform.OS === 'ios' ? 26 : androidBottomPad,
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <IconSlot><Ionicons name="home-outline" size={androidIconSize(size * 0.7 * 0.8)} color={color} /></IconSlot>
          ),
        }}
      />
      <Tabs.Screen
        name="astrology"
        options={{
          title: 'Astrology',
          tabBarIcon: ({ color, size }) => (
            <IconSlot><IconImage source={require('@/assets/images/icon-astrology.png')} color={color} size={androidIconSize(size * 1.5 * 0.7 * 0.9 * 0.8)} /></IconSlot>
          ),
        }}
      />
      <Tabs.Screen
        name="ask"
        options={{
          title: 'Ask',
          tabBarIcon: ({ color, size }) => (
            <IconSlot><Ionicons name="chatbubble-outline" size={androidIconSize(size * 0.7 * 0.8)} color={color} /></IconSlot>
          ),
        }}
      />
      <Tabs.Screen
        name="meditation"
        options={{
          title: 'Meditate',
          tabBarIcon: ({ color, size }) => (
            <IconSlot><IconImage source={require('@/assets/images/icon-lotus.png')} color={color} size={androidIconSize(size * 1.5 * 0.7 * 0.8)} /></IconSlot>
          ),
        }}
      />
      <Tabs.Screen
        name="sleep"
        options={{
          title: 'Sleep',
          tabBarIcon: ({ color, size }) => (
            <IconSlot><Ionicons name="moon-outline" size={androidIconSize(size * 0.7 * 0.8)} color={color} /></IconSlot>
          ),
        }}
      />
    </Tabs>
  );
}
