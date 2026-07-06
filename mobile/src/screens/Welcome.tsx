/**
 * Welcome Page — React Native port.
 *
 * Full-screen portal splash for unauthenticated users — the landing entry.
 * Leads into the pre-auth onboarding carousel (CTA) and keeps /login reachable.
 */

import React, { useEffect } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useLocale } from '@/hooks/useLocale';
import { LanguageSwitcher } from '@/features/settings/components/LanguageSwitcher';
import { ROUTES } from '@/constants';
import { img } from '@/assets/registry';

const LOGIN_BG = '/login-bg.png';

export function Welcome() {
  const { user, loading } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (user && !loading) {
      router.replace(ROUTES.DASHBOARD);
    }
  }, [user, loading, router]);

  return (
    <View className="flex-1 bg-[#0a1622]">
      {/* ── Portal background ── */}
      <View className="absolute inset-0">
        <Image
          source={img(LOGIN_BG)}
          contentFit="cover"
          contentPosition="top"
          style={{ width: '100%', height: '100%' }}
        />
        <LinearGradient
          colors={['rgba(10,22,34,0.40)', 'rgba(10,22,34,0.10)', '#0a1622']}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <LinearGradient
          colors={['transparent', '#0a1622']}
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '50%' }}
        />
      </View>

      {/* Language switcher */}
      <View className="absolute right-5 z-20 opacity-80" style={{ top: insets.top + 20 }}>
        <LanguageSwitcher variant="compact" />
      </View>

      {/* ── Content ── */}
      <View
        className="mx-auto w-full max-w-md flex-1 px-6"
        style={{ paddingTop: insets.top + 40, paddingBottom: insets.bottom + 32 }}
      >
        {/* Logo + tagline are baked into the background image — reserve their zone */}
        <View className="flex-1" style={{ minHeight: height * 0.4 }} />

        {/* Hero copy */}
        <View className="mb-6 items-center">
          <Text className="text-center text-[28px] font-extrabold leading-tight">
            <Text className="text-white">{t('welcome.heroTitle1')}</Text>
            {'\n'}
            <Text className="text-[#4aa8ff]">{t('welcome.heroTitle2')}</Text>
          </Text>
          <Text className="mt-4 text-center text-[15px] leading-relaxed text-white/70">
            {t('welcome.heroSubtitle')}
          </Text>
        </View>

        {/* Decorative carousel dots */}
        <View className="mb-6 flex-row items-center justify-center gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <View
              key={i}
              className={
                i === 0
                  ? 'h-2 w-5 rounded-full bg-[#4aa8ff]'
                  : 'h-2 w-2 rounded-full bg-white/25'
              }
            />
          ))}
        </View>

        {/* Primary CTA */}
        <Pressable
          onPress={() => router.push(ROUTES.ONBOARDING)}
          accessibilityRole="button"
          className="w-full overflow-hidden rounded-2xl active:opacity-90"
        >
          <LinearGradient
            colors={['#2dd4bf', '#3b82f6']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            className="w-full flex-row items-center justify-center gap-2 py-3.5"
          >
            <Text className="text-[15px] font-semibold text-white">{t('welcome.cta')}</Text>
            <ArrowRight size={18} color="#FFFFFF" />
          </LinearGradient>
        </Pressable>

        {/* Sign in */}
        <Text className="mt-6 text-center text-sm text-white/65">
          {t('welcome.haveAccount')}{' '}
          <Text
            className="font-semibold text-[#4aa8ff]"
            onPress={() => router.push(ROUTES.LOGIN)}
          >
            {t('welcome.signIn')}
          </Text>
        </Text>
      </View>
    </View>
  );
}

export default Welcome;
