/**
 * Header Component — React Native port.
 *
 * Top bar for internal screens. Unlike the web's `fixed` header, it renders
 * in normal flow inside each screen and pads itself below the status bar via
 * useSafeAreaInsets. Shows: Logo, user stats (md+ widths), language switcher
 * and profile link — same visibility rules as the web.
 */

import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { usePathname, useRouter } from 'expo-router';
import { Coins, User as UserIcon } from 'lucide-react-native';
import { useUser } from '@/store';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';
import { LanguageSwitcher } from '@/features/settings/components/LanguageSwitcher';
import { Logo } from '@/components/branding/Logo';
import { cn } from '@/utils';
import { ROUTES } from '@/constants/routes';
import { img } from '@/assets/registry';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// v2: rewards/currency read in gold (the legacy lime is banned by the design system)
const GOLD_400 = '#F6A93B';

export function Header() {
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const animatedPoints = useAnimatedNumber(user?.points ?? 0);

  // Don't show header on onboarding, or on Home (which has its own immersive header)
  if (pathname === ROUTES.ONBOARDING || pathname === ROUTES.DASHBOARD) {
    return null;
  }

  if (!user) return null;

  const isProfile = pathname === ROUTES.PROFILE;
  const avatarSource = user.avatarUrl
    ? user.avatarUrl.startsWith('/')
      ? img(user.avatarUrl)
      : { uri: user.avatarUrl }
    : undefined;

  return (
    <View
      className="border-b border-[hsl(var(--glass-border)/0.12)] bg-[hsl(var(--glass-bg)/0.7)]"
      style={{ paddingTop: insets.top }}
    >
      <View className="h-16 flex-row items-center justify-between px-4">
        {/* Left: Logo */}
        <Pressable
          onPress={() => router.push(ROUTES.DASHBOARD)}
          accessibilityRole="button"
          accessibilityLabel="Go to dashboard"
          className="flex-row items-center gap-2 active:opacity-80"
        >
          <Logo size="sm" />
        </Pressable>

        {/* Center: points always visible on phone (md: never applies at 360-430dp) */}
        <View className="flex-row items-center gap-2">
          <View className="flex-row items-center gap-1.5 rounded-full border border-gold-400/25 bg-gold-400/10 px-3 py-1.5">
            <Coins size={15} color={GOLD_400} />
            <Text className="text-sm font-bold text-gold-300">
              {animatedPoints.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Right: Language Switcher + Profile */}
        <View className="flex-row items-center gap-3">
          {/* Language Switcher */}
          <LanguageSwitcher variant="compact" />

          {/* Profile Link */}
          <Pressable
            onPress={() => router.push(ROUTES.PROFILE)}
            accessibilityRole="button"
            accessibilityLabel="View profile"
            accessibilityState={{ selected: isProfile }}
            className={cn(
              'flex-row items-center gap-2 rounded-lg px-3 py-2',
              isProfile
                ? 'border border-teal-400/50 bg-teal-400/15'
                : 'border border-white/20 bg-white/10 active:bg-white/20'
            )}
          >
            {avatarSource ? (
              <Image
                source={avatarSource}
                accessibilityLabel={user.name || 'User avatar'}
                contentFit="cover"
                style={{ width: 24, height: 24, borderRadius: 12 }}
              />
            ) : (
              <UserIcon size={18} color="#FFFFFF" />
            )}
            <Text className="hidden text-sm font-medium text-white sm:flex">
              {user.name || 'Perfil'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default Header;
