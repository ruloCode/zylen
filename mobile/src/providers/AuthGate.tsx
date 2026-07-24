/**
 * AuthGate — native equivalent of the web's ProtectedRoute + AppProvider.
 *
 * Responsibilities:
 *  - Redirect unauthenticated users to /welcome (public routes excepted).
 *  - Once authenticated, initialize the Zustand store from Supabase and show
 *    the "El reino despierta…" loader until it's ready.
 *  - Redirect to /onboarding while the profile hasn't completed onboarding.
 *  - App-wide daily reset at local midnight.
 *  - Notificaciones: sincroniza los recordatorios del coach con el estado de
 *    los hábitos, registra el token push tras autenticar y enruta el tap de
 *    cualquier notificación (data.url) con expo-router.
 */

import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Text, View } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useAuth } from '@/features/auth/context/AuthContext';
import { initializeStore, useAppStore } from '@/store';
import { ensureNotificationChannels } from '@/services/notifications.service';
import { isCoachPrefEnabled, syncCoachReminders } from '@/services/coachReminders.service';
import {
  isPushPrefEnabled,
  registerPushToken,
  watchPushTokenRotation,
} from '@/services/push.service';
import { useDailyReset } from '@/hooks/useDailyReset';
import { useLocale } from '@/hooks/useLocale';

/** First route segments that never require an authenticated session. */
const PUBLIC_SEGMENTS = new Set(['welcome', 'login', 'onboarding', 'auth']);

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const { t, language } = useLocale();
  const { user: authUser, loading: authLoading } = useAuth();

  const storeUser = useAppStore((state) => state.user);
  const isInitialized = useAppStore((state) => state.isInitialized);
  const habits = useAppStore((state) => state.habits);

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

  // --- canales Android listos cuanto antes (requisito del prompt en 13+) ---
  useEffect(() => {
    void ensureNotificationChannels();
  }, []);

  // --- coach: re-programa recordatorios cuando cambian los hábitos ---
  // (completar/editar/toggle de recordatorio disparan cambios en `habits`;
  // el debounce agrupa ráfagas de cambios en una sola sincronización)
  useEffect(() => {
    if (!isInitialized) return;
    const timer = setTimeout(() => {
      void syncCoachReminders(habits, t, isCoachPrefEnabled());
    }, 800);
    return () => clearTimeout(timer);
  }, [isInitialized, habits, t]);

  // --- coach: re-sincroniza también al volver a primer plano ---
  useEffect(() => {
    if (!isInitialized) return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void syncCoachReminders(useAppStore.getState().habits, t, isCoachPrefEnabled());
      }
    });
    return () => subscription.remove();
  }, [isInitialized, t]);

  // --- push: registro del token tras autenticar + rotación FCM ---
  useEffect(() => {
    if (!authUser || !isInitialized) return;
    if (isPushPrefEnabled()) void registerPushToken(language);
    const subscription = watchPushTokenRotation(language);
    return () => subscription.remove();
  }, [authUser, isInitialized, language]);

  // --- tap en notificación → deep link (cold start y app viva) ---
  const notificationResponse = Notifications.useLastNotificationResponse();
  const handledResponse = useRef<string | null>(null);
  useEffect(() => {
    if (!notificationResponse || authLoading || !authUser) return;
    const id = `${notificationResponse.notification.request.identifier}-${notificationResponse.actionIdentifier}`;
    if (handledResponse.current === id) return;
    handledResponse.current = id;

    const url = notificationResponse.notification.request.content.data?.url;
    if (typeof url === 'string' && url.startsWith('/')) {
      router.push(url as never);
    }
  }, [notificationResponse, authLoading, authUser, router]);

  // --- hard daily reset at 00:00 device time ---
  useDailyReset(() => {
    if (!isInitialized) return;
    const state = useAppStore.getState();
    void state.loadHabits();
    void state.refreshStreak();
    void syncCoachReminders(state.habits, t, isCoachPrefEnabled());
  });

  // Loader while auth resolves, or while the store initializes for an
  // authenticated user heading into the app.
  const waitingForStore = authUser != null && !storeReady && !inPublic;
  if (authLoading || waitingForStore) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" className="mb-4" color="#2dd4bf" />
        <Text className="text-lg text-foreground">{t('common.awakening')}</Text>
      </View>
    );
  }

  return <>{children}</>;
}
