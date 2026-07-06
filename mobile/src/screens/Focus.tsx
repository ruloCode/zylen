/**
 * Focus — "Enfoque del día". Immersive fullscreen Pomodoro: pick a gem and
 * a duration, grow the gem through the session, celebrate (or mourn) the
 * result, browse the vault.
 *
 * On mount a persisted session is classified (running / complete-pending /
 * broken) and the flow resumes accordingly, so app restarts and
 * backgrounding never lose or double-award a session.
 *
 * RN notes: immersive route (no Header/tab bar) — safe areas via
 * useSafeAreaInsets. The timer keeps counting while the screen is awake;
 * keep-awake during sessions is a future improvement (expo-keep-awake not
 * installed).
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Gem, Sparkles } from 'lucide-react-native';
import toast from '@/lib/toast';
import { cn } from '@/utils/cn';
import { useFocus } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import { useTheme } from '@/hooks/useTheme';
import { themeHsl } from '@/theme/themeVars';
import { ROUTES } from '@/constants/routes';
import { NotificationsService } from '@/services/notifications.service';
import { img } from '@/assets/registry';
import type {
  CompleteFocusSessionResult,
  FocusBreakReason,
  GemSpecies,
} from '@/types/focus';
import {
  GemPicker,
  GemCreatorSheet,
  DurationPicker,
  FocusSessionScreen,
  SessionCelebration,
  SessionBrokenScreen,
  GemVault,
  VaultCurrencyChips,
} from '@/features/focus/components';
import {
  evaluatePersisted,
  readPersistedFocusSession,
} from '@/features/focus/utils/focusStorage';
import { FOCUS_BG_IMAGE } from '@/features/focus/utils/gemAssets';

type View_ = 'home' | 'session' | 'celebration' | 'broken' | 'vault';

const glass = 'rounded-2xl border border-white/10 bg-[hsl(var(--glass-bg)/0.65)]';

export function Focus() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLocale();
  const { theme } = useTheme();
  const {
    focusGems,
    focusStats,
    activeFocusSession,
    isLoading,
    loadFocusData,
    startFocusSession,
    completeFocusSession,
    breakFocusSession,
    setActiveFocusSession,
  } = useFocus();

  const [view, setView] = useState<View_>('home');
  const [selectedGemId, setSelectedGemId] = useState<string | null>(null);
  const [minutes, setMinutes] = useState<number>(25);
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const [lastResult, setLastResult] = useState<CompleteFocusSessionResult | null>(null);
  const [lastSpecies, setLastSpecies] = useState<GemSpecies | null>(null);
  const [lastGemName, setLastGemName] = useState('');
  const [breakReason, setBreakReason] = useState<FocusBreakReason>('abandoned');

  // ---- restore-on-mount -------------------------------------------------
  const restoredRef = useRef(false);
  useEffect(() => {
    void loadFocusData();

    if (restoredRef.current) return;
    restoredRef.current = true;

    const persisted = readPersistedFocusSession();
    if (!persisted) return;

    setActiveFocusSession(persisted);
    setLastSpecies(persisted.species);
    setLastGemName(persisted.gemName);

    const verdict = evaluatePersisted(persisted, Date.now());
    if (verdict === 'running') {
      setView('session');
      return;
    }

    void (async () => {
      if (verdict === 'complete-pending') {
        try {
          const result = await completeFocusSession();
          if (result.broken) {
            setBreakReason(result.reason ?? 'expired');
            setView('broken');
          } else {
            setLastResult(result);
            setView('celebration');
          }
          return;
        } catch {
          setBreakReason('expired');
          setView('broken');
          return;
        }
      }
      const reason: FocusBreakReason =
        verdict === 'broken-pause' ? 'paused_too_long' : 'expired';
      await breakFocusSession(reason);
      setBreakReason(reason);
      setView('broken');
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Default gem selection once data loads
  useEffect(() => {
    if (!selectedGemId && focusGems.length > 0) {
      setSelectedGemId(focusGems[0].id);
    }
  }, [focusGems, selectedGemId]);

  // ---- actions ----------------------------------------------------------
  const handleStart = async () => {
    if (!selectedGemId || starting) return;
    const gem = focusGems.find((g) => g.id === selectedGemId);
    if (!gem) return;

    setStarting(true);
    // First session is the moment to ask (never on load).
    void NotificationsService.requestPermission();
    try {
      await startFocusSession(selectedGemId, minutes);
      setLastSpecies(gem.species);
      setLastGemName(gem.name);
      setView('session');
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      toast.error(
        message.includes('session_already_running')
          ? t('focus.errors.alreadyRunning')
          : t('focus.errors.startFailed')
      );
    } finally {
      setStarting(false);
    }
  };

  const handleCompleted = useCallback((result: CompleteFocusSessionResult) => {
    setLastResult(result);
    setView('celebration');
  }, []);

  const handleBroken = useCallback((reason: FocusBreakReason) => {
    setBreakReason(reason);
    setView('broken');
  }, []);

  const inSession = view === 'session' && activeFocusSession !== null;

  // ---- render -----------------------------------------------------------
  return (
    <View className="flex-1 overflow-hidden bg-background">
      {/* Shrine scene under a themed gradient (web: bg image + hsl overlays) */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Image
          source={img(FOCUS_BG_IMAGE)}
          contentFit="cover"
          style={[StyleSheet.absoluteFill, { opacity: 0.4 }]}
          accessibilityElementsHidden
        />
        <LinearGradient
          colors={[
            themeHsl(theme, '--background', 0.85),
            themeHsl(theme, '--background', 0.4),
            themeHsl(theme, '--background', 0.95),
          ]}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <View
        className="flex-1 px-4"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        {/* Header */}
        <View
          className="min-h-[64px] flex-row items-center gap-3 pb-2"
          style={{ paddingTop: insets.top + 16, zIndex: 20 }}
        >
          {!inSession && (
            <Pressable
              onPress={() =>
                view === 'vault' || view === 'celebration' || view === 'broken'
                  ? setView('home')
                  : router.push(ROUTES.DASHBOARD)
              }
              accessibilityLabel={t('actions.back')}
              className={cn(glass, 'h-9 w-9 shrink-0 items-center justify-center rounded-full')}
            >
              <ArrowLeft size={18} color="#ffffff" />
            </Pressable>
          )}
          <View className="min-w-0 flex-1">
            <Text className="text-xl font-extrabold leading-tight text-white">
              {view === 'vault' ? t('focus.vault') : t('focus.title')}
            </Text>
            {view === 'home' && (
              <Text className="text-xs text-white/60">{t('focus.subtitle')}</Text>
            )}
          </View>
          {view === 'home' && (
            <Pressable
              onPress={() => setView('vault')}
              accessibilityLabel={t('focus.vault')}
              className={cn(glass, 'h-9 w-9 shrink-0 items-center justify-center rounded-full')}
            >
              <Gem size={17} color="#5eead4" />
            </Pressable>
          )}
          {view === 'vault' && <VaultCurrencyChips stats={focusStats} />}
        </View>

        {/* Views */}
        {view === 'home' && (
          <View className="flex-1 gap-6 pt-2">
            {isLoading && focusGems.length === 0 ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#2dd4bf" />
              </View>
            ) : (
              <>
                <View>
                  <Text className="mb-2.5 text-sm font-bold text-white">
                    {t('focus.pickGem')}
                  </Text>
                  {focusGems.length === 0 && !isLoading && (
                    <Text className="mb-2 text-xs text-white/50">
                      {t('focus.noGems')}
                    </Text>
                  )}
                  <GemPicker
                    gems={focusGems}
                    selectedGemId={selectedGemId}
                    onSelect={setSelectedGemId}
                    onCreateNew={() => setCreatorOpen(true)}
                  />
                </View>

                <View>
                  <Text className="mb-2.5 text-sm font-bold text-white">
                    {t('focus.duration')}
                  </Text>
                  <DurationPicker minutes={minutes} onChange={setMinutes} />
                </View>

                {/* Start CTA (web: .btn-primary) */}
                <View className="mt-auto pb-2">
                  <Pressable
                    onPress={handleStart}
                    disabled={!selectedGemId || starting}
                    className={cn(
                      'w-full flex-row items-center justify-center gap-2 rounded-2xl bg-teal-500 py-4 active:opacity-90',
                      (!selectedGemId || starting) && 'opacity-40'
                    )}
                    style={{
                      shadowColor: '#2dd4bf',
                      shadowOpacity: 0.55,
                      shadowRadius: 12,
                      shadowOffset: { width: 0, height: 0 },
                      elevation: 6,
                    }}
                  >
                    {starting ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Sparkles size={20} color="#ffffff" />
                    )}
                    <Text className="text-base font-bold text-white">
                      {t('focus.start')}
                    </Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        )}

        {inSession && (
          <FocusSessionScreen
            onCompleted={handleCompleted}
            onBroken={handleBroken}
          />
        )}

        {view === 'celebration' && lastResult && lastSpecies && (
          <SessionCelebration
            result={lastResult}
            species={lastSpecies}
            gemName={lastGemName}
            onAgain={() => setView('home')}
            onVault={() => setView('vault')}
          />
        )}

        {view === 'broken' && (
          <SessionBrokenScreen
            reason={breakReason}
            species={lastSpecies}
            onRetry={() => setView('home')}
          />
        )}

        {view === 'vault' &&
          (focusStats ? (
            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 8 }}
            >
              <GemVault stats={focusStats} />
            </ScrollView>
          ) : (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#2dd4bf" />
            </View>
          ))}
      </View>

      {creatorOpen && (
        <GemCreatorSheet
          onClose={() => setCreatorOpen(false)}
          onCreated={(gem) => {
            setCreatorOpen(false);
            setSelectedGemId(gem.id);
          }}
        />
      )}
    </View>
  );
}

export default Focus;
