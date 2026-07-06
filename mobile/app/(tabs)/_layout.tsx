/**
 * Bottom tab bar — native port of the web Everlight navigation
 * (src/components/layout/Navigation.tsx): HUD-styled bar with hexagonal
 * icon frames, glowing top edge, active underline and a floating
 * quick-create FAB above the right corner.
 */

import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Polygon } from 'react-native-svg';
import {
  Home,
  CalendarCheck,
  Trophy,
  TrendingUp,
  User,
  Plus,
  type LucideIcon,
} from 'lucide-react-native';
import { useAppStore } from '@/store';
import { themeHsl } from '@/theme/themeVars';
import { useLocale } from '@/hooks/useLocale';

interface TabDef {
  name: string;
  icon: LucideIcon;
  labelKey: string;
}

const TABS: TabDef[] = [
  { name: 'index', icon: Home, labelKey: 'navigation.home' },
  { name: 'habits', icon: CalendarCheck, labelKey: 'navigation.routines' },
  { name: 'leaderboard', icon: Trophy, labelKey: 'navigation.ranking' },
  { name: 'streaks', icon: TrendingUp, labelKey: 'navigation.progress' },
  { name: 'profile', icon: User, labelKey: 'navigation.profile' },
];

/** Flat-top hexagon points for a w×h frame (mirrors the web clip-path). */
function hexPoints(w: number, h: number): string {
  return `${0.25 * w},0 ${0.75 * w},0 ${w},${0.5 * h} ${0.75 * w},${h} ${0.25 * w},${h} 0,${0.5 * h}`;
}

/**
 * Hexagonal icon frame. Active: solid primary→hover fill (icon renders in
 * primary-foreground on top = max contrast). Inactive: faint ring with the
 * bar background as the face.
 */
function HexFrame({
  active,
  children,
  ring,
  face,
  activeFill,
  glow,
}: {
  active: boolean;
  children: React.ReactNode;
  ring: string;
  face: string;
  activeFill: string;
  glow: string;
}) {
  const W = active ? 42 : 38;
  const H = active ? 37 : 34;
  return (
    <View
      style={{
        width: 42,
        height: 37,
        alignItems: 'center',
        justifyContent: 'center',
        ...(active
          ? {
              shadowColor: glow,
              shadowOpacity: 0.9,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 0 },
              elevation: 6,
            }
          : null),
      }}
    >
      <Svg width={W} height={H} style={{ position: 'absolute' }}>
        {active ? (
          <Polygon points={hexPoints(W, H)} fill={activeFill} />
        ) : (
          <>
            <Polygon points={hexPoints(W, H)} fill={ring} />
            <Polygon
              points={hexPoints(W - 4, H - 4)}
              fill={face}
              transform="translate(2, 2)"
            />
          </>
        )}
      </Svg>
      {children}
    </View>
  );
}

/**
 * Structural subset of BottomTabBarProps — expo-router and the direct
 * @react-navigation/bottom-tabs dependency ship separate type instances,
 * so the nominal type doesn't cross the boundary.
 */
interface HudTabBarProps {
  state: { index: number; routes: Array<{ key: string; name: string }> };
  navigation: { navigate: (name: string) => void };
}

function HudTabBar({ state, navigation }: HudTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useLocale();
  const theme = useAppStore((s) => s.theme);

  // IMPORTANT: themeHsl returns `hsl()/hsla()` strings — alpha must go through
  // the third arg (appending hex alpha to an hsl() string is an invalid color
  // that RN silently drops).
  const primary = themeHsl(theme, '--primary');
  const primaryFg = themeHsl(theme, '--primary-foreground');
  const foreground = themeHsl(theme, '--foreground');
  const background = themeHsl(theme, '--background');
  const glow = themeHsl(theme, '--glow');
  const ring = themeHsl(theme, '--primary', 0.3);
  const borderTop = themeHsl(theme, '--primary', 0.25);
  const edgeGlow = themeHsl(theme, '--primary', 0.9);
  const bgTop = themeHsl(theme, '--background', 0.92);
  const bgBottom = themeHsl(theme, '--background', 1);
  const inactiveIcon = themeHsl(theme, '--foreground', 0.55);
  const inactiveLabel = themeHsl(theme, '--foreground', 0.45);

  return (
    <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
      {/* Floating quick-create FAB (right corner, above the bar) */}
      <Pressable
        onPress={() => router.push('/habits')}
        accessibilityLabel={t('home.addHabit')}
        style={{
          position: 'absolute',
          right: 12,
          top: -52,
          width: 48,
          height: 48,
          borderRadius: 24,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: primary,
          borderWidth: 2,
          borderColor: themeHsl(theme, '--primary-hover', 0.6),
          shadowColor: glow,
          shadowOpacity: 0.7,
          shadowRadius: 9,
          shadowOffset: { width: 0, height: 0 },
          elevation: 8,
          zIndex: 10,
        }}
      >
        <Plus size={24} strokeWidth={2.8} color={primaryFg} />
      </Pressable>

      <LinearGradient
        colors={[bgTop, bgBottom]}
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: 4,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          paddingHorizontal: 8,
          paddingTop: 10,
          paddingBottom: Math.max(insets.bottom, 8),
          borderTopWidth: 1,
          borderTopColor: borderTop,
        }}
      >
        {/* Glowing top edge */}
        <LinearGradient
          colors={['transparent', edgeGlow, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ position: 'absolute', top: 0, left: 24, right: 24, height: 1.5 }}
        />

        {TABS.map((tab, index) => {
          const isActive = state.index === index;
          const Icon = tab.icon;
          return (
            <Pressable
              key={tab.name}
              onPress={() => navigation.navigate(state.routes[index].name)}
              accessibilityLabel={t('navigation.navigateTo', { label: t(tab.labelKey) })}
              accessibilityState={{ selected: isActive }}
              style={{ flex: 1, alignItems: 'center', gap: 5, paddingVertical: 2 }}
            >
              <HexFrame
                active={isActive}
                ring={ring}
                face={background}
                activeFill={primary}
                glow={glow}
              >
                <Icon
                  size={isActive ? 18 : 16}
                  strokeWidth={isActive ? 2.6 : 2}
                  color={isActive ? primaryFg : inactiveIcon}
                />
              </HexFrame>
              <Text
                style={{
                  fontSize: 9.5,
                  fontWeight: isActive ? '800' : '600',
                  textTransform: 'uppercase',
                  letterSpacing: 1.2,
                  color: isActive ? foreground : inactiveLabel,
                }}
              >
                {t(tab.labelKey)}
              </Text>
              <View
                style={{
                  height: 3,
                  width: 30,
                  borderRadius: 2,
                  backgroundColor: primary,
                  opacity: isActive ? 1 : 0,
                  shadowColor: glow,
                  shadowOpacity: 0.9,
                  shadowRadius: 5,
                  shadowOffset: { width: 0, height: 0 },
                }}
              />
            </Pressable>
          );
        })}
      </LinearGradient>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <HudTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: 'transparent' },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} />
      ))}
    </Tabs>
  );
}
