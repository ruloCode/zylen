/**
 * AuthGate — native equivalent of the web's ProtectedRoute + AppProvider.
 *
 * Responsibilities:
 *  - Redirect unauthenticated users to /welcome (public routes excepted).
 *  - Once authenticated, initialize the Zustand store from Supabase and show
 *    the "El reino despierta…" loader until it's ready.
 *  - Redirect to /onboarding while the profile hasn't completed onboarding.
 *  - App-wide daily reset at local midnight + habit reminder checks on
 *    foreground (mirrors src/app/AppProvider.tsx on the web).
 */

import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Text, View } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '@/features/auth/context/AuthContext';
import { initializeStore, useAppStore } from '@/store';
import { NotificationsService } from '@/services/notifications.service';
import { useDailyReset } from '@/hooks/useDailyReset';
import { useLocale } from '@/hooks/useLocale';

/** First route segments that never require an authenticated session. */
const PUBLIC_SEGMENTS = new Set(['welcome', 'login', 'onboarding', 'auth']);

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const { t } = useLocale();
  const { user: authUser, loading: authLoading } = useAuth();

  const storeUser = useAppStore((state) => state.user);
  const isInitialized = useAppStore((state) => state.isInitialized);

  // --- store bootstrap (web AppProvider.init) ---
  const [storeReady, setStoreReady] = useState(false);
  const initStarted = useRef(false);
  useEffect(() => {
    if (!authUser || initStarted.current) return;
    initStarted.current = true;
    void initializeStore().finally(() => setStoreReady(true));
  }, [authUser]);

  // --- routing guards ---
  const segment = segments[0] ?? '';
  const inPublic = PUBLIC_SEGMENTS.has(segment);

  useEffect(() => {
    if (authLoading) return;

    if (!authUser) {
      if (!inPublic) router.replace('/welcome');
      return;
    }

    // Authenticated: leave the auth surfaces.
    if (segment === 'welcome' || segment === 'login' || segment === 'auth') {
      router.replace('/');
      return;
    }

    // Redirect to onboarding until the profile completes it.
    if (
      isInitialized &&
      storeUser &&
      !storeUser.hasCompletedOnboarding &&
      segment !== 'onboarding'
    ) {
      router.replace('/onboarding');
    }
  }, [authLoading, authUser, inPublic, segment, isInitialized, storeUser, router]);

  // --- habit reminders on foreground (web: visibilitychange) ---
  useEffect(() => {
    if (!isInitialized) return;

    const check = () => {
      const habits = useAppStore.getState().habits;
      NotificationsService.checkPendingReminders(
        habits,
        t('reminders.notificationTitle'),
        (habitName: string) => t('reminders.notificationBody', { habit: habitName })
      ).catch((err: unknown) => console.warn('Reminder check failed:', err));
    };

    check();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    return () => subscription.remove();
  }, [isInitialized, t]);

  // --- hard daily reset at 00:00 device time ---
  useDailyReset(() => {
    if (!isInitialized) return;
    const state = useAppStore.getState();
    void state.loadHabits();
    void state.refreshStreak();
  });

  // Loader while auth resolves, or while the store initializes for an
  // authenticated user heading into the app.
  const waitingForStore = authUser != null && !storeReady && !inPublic;
  if (authLoading || waitingForStore) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" className="mb-4" color="#2dd4bf" />
        <Text className="text-lg text-foreground">El reino despierta…</Text>
      </View>
    );
  }

  return <>{children}</>;
}
