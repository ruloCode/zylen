/**
 * Auth Callback Screen — React Native port.
 *
 * On native the OAuth deep link (zylen://auth/callback) is fully handled by
 * AuthContext (expo-web-browser auth session + PKCE code exchange), so unlike
 * the web this screen does no token processing. It only bridges the deep-link
 * route: show a spinner and hand control back to the app — the AuthGate then
 * routes according to the session state.
 */

import React, { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useLocale } from '@/hooks/useLocale';
import { Logo } from '@/components/branding/Logo';
import { ROUTES } from '@/constants/routes';

export function AuthCallback() {
  const router = useRouter();
  const { t } = useLocale();

  useEffect(() => {
    router.replace(ROUTES.DASHBOARD);
  }, [router]);

  return (
    <View className="flex-1 items-center justify-center bg-background px-4">
      <View className="items-center">
        <View className="mb-6">
          <Logo size="lg" />
        </View>
        <View className="mb-4">
          <ActivityIndicator size="large" color="#2dd4bf" />
        </View>
        <Text className="mb-2 text-2xl font-bold text-foreground">
          {t('auth.completingSignIn')}
        </Text>
        <Text className="text-muted-foreground">{t('auth.pleaseWait')}</Text>
      </View>
    </View>
  );
}

export default AuthCallback;
