/**
 * FocusSessionScreen — the immersive running-session view. A gem grows
 * through 4 stages inside a progress ring over the shrine scene; pausing
 * shows the remaining pause budget; abandoning (confirmed) breaks the gem.
 *
 * Owns the timer + settlement: completion/pause-overrun call the store and
 * report the outcome upward; the parent only switches views.
 *
 * RN notes: the countdown keeps running via the AppState-aware
 * useFocusTimer; the CSS glow-pulse/pop-in keyframes are re-created with
 * Animated. Keep-awake is NOT wired (package not installed) — future
 * improvement: expo-keep-awake while a session runs.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  AppState,
  Easing,
  Modal,
  Pressable,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Pause, Play, Square } from 'lucide-react-native';
import { cn } from '@/utils/cn';
import { useLocale } from '@/hooks/useLocale';
import { useFocus } from '@/store';
import { CircularProgress } from '@/components/ui';
import { NotificationsService } from '@/services/notifications.service';
import { img } from '@/assets/registry';
import type {
  CompleteFocusSessionResult,
  FocusBreakReason,
} from '@/types/focus';
import { useFocusTimer, formatCountdown } from '../hooks/useFocusTimer';
import { gemStageImageSource, speciesMeta, stageForProgress } from '../utils/gemAssets';
import { displayGemName } from '../utils/displayGemName';

interface FocusSessionScreenProps {
  onCompleted: (result: CompleteFocusSessionResult) => void;
  onBroken: (reason: FocusBreakReason) => void;
}

export function FocusSessionScreen({
  onCompleted,
  onBroken,
}: FocusSessionScreenProps) {
  const { t } = useLocale();
  const {
    activeFocusSession,
    completeFocusSession,
    breakFocusSession,
    updateFocusPause,
  } = useFocus();

  const [confirmAbandon, setConfirmAbandon] = useState(false);
  const settledRef = useRef(false);

  const meta = activeFocusSession
    ? speciesMeta(activeFocusSession.species)
    : null;

  const handleComplete = async () => {
    if (settledRef.current) return;
    settledRef.current = true;
    try {
      const result = await completeFocusSession();
      // web: document.hidden — notify only when the app is backgrounded
      if (AppState.currentState !== 'active') {
        void NotificationsService.show(
          t('focus.notificationTitle'),
          t('focus.notificationBody'),
          'focus-complete'
        );
      }
      if (result.broken) {
        onBroken(result.reason ?? 'expired');
      } else {
        onCompleted(result);
      }
    } catch {
      // Already settled elsewhere (double tab): fall back to the vault state.
      onBroken('expired');
    }
  };

  const handlePauseBudgetExceeded = async () => {
    if (settledRef.current) return;
    settledRef.current = true;
    await breakFocusSession('paused_too_long');
    onBroken('paused_too_long');
  };

  const timer = useFocusTimer({
    session: activeFocusSession,
    onComplete: handleComplete,
    onPauseBudgetExceeded: handlePauseBudgetExceeded,
    onPauseChange: updateFocusPause,
  });

  const stage = stageForProgress(timer.elapsedFraction);
  const paused = timer.isPaused;

  // ── animations ──────────────────────────────────────────────────────────
  // Ambient glow behind the ring (web: animate-glow-pulse, opacity .35↔.7)
  const glow = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    if (paused) {
      glow.setValue(0.35);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 0.7,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0.35,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [glow, paused]);

  // Gem pop-in on every stage change (web: animate-pop-in keyed by stage)
  const pop = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    pop.setValue(0);
    Animated.spring(pop, {
      toValue: 1,
      friction: 6,
      tension: 140,
      useNativeDriver: true,
    }).start();
  }, [pop, stage]);

  const handleAbandon = async () => {
    if (settledRef.current) return;
    settledRef.current = true;
    await breakFocusSession('abandoned');
    onBroken('abandoned');
  };

  if (!activeFocusSession || !meta) return null;

  return (
    <View className="flex-1 items-center justify-between py-6">
      {/* Gem + ring */}
      <View className="flex-1 items-center justify-center gap-6">
        <View className="relative items-center justify-center">
          {/* Species-colored ambient glow behind the ring */}
          <Animated.View
            className="absolute rounded-full"
            style={{
              width: 216,
              height: 216,
              backgroundColor: meta.color,
              opacity: glow,
            }}
          />
          <CircularProgress
            current={Math.round(timer.elapsedFraction * 1000)}
            max={1000}
            size={264}
            strokeWidth={7}
            variant="teal"
          >
            <View className="h-40 w-40 items-center justify-center">
              <Animated.View
                style={{
                  opacity: pop,
                  transform: [
                    {
                      scale: pop.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                      }),
                    },
                  ],
                }}
              >
                <Image
                  source={
                    gemStageImageSource(activeFocusSession.species, stage) ??
                    img(meta.image)
                  }
                  contentFit="contain"
                  style={{ width: 144, height: 144, opacity: paused ? 0.6 : 1 }}
                  accessibilityElementsHidden
                />
              </Animated.View>
            </View>
          </CircularProgress>
        </View>

        {/* Gem name + stage label */}
        <View className="items-center">
          <Text className="text-lg font-bold text-white">
            {displayGemName(activeFocusSession.gemName, t)}
          </Text>
          <Text
            className="mt-0.5 text-sm font-semibold"
            style={{ color: meta.color }}
          >
            {t(`focus.stage${stage}`)}
          </Text>
        </View>

        {/* Countdown */}
        <View className="items-center">
          <Text className="text-6xl font-extrabold tabular-nums tracking-tight text-white">
            {formatCountdown(timer.remainingMs)}
          </Text>
          {paused ? (
            <Text className="mt-2 text-sm font-bold text-danger-400">
              {t('focus.pauseBudget', {
                time: formatCountdown(timer.pauseBudgetLeftMs),
              })}
            </Text>
          ) : (
            <Text className="mt-2 text-sm font-medium text-white/50">
              {t('focus.keepGrowing')}
            </Text>
          )}
        </View>
      </View>

      {/* Controls */}
      <View className="mt-6 flex-row items-center gap-4">
        <Pressable
          onPress={() => setConfirmAbandon(true)}
          accessibilityLabel={t('focus.abandon')}
          className="h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-[hsl(var(--glass-bg)/0.65)]"
        >
          <Square size={22} color="rgba(255,255,255,0.8)" />
        </Pressable>
        <Pressable
          onPress={paused ? timer.resume : timer.pause}
          accessibilityLabel={paused ? t('timer.resume') : t('timer.pause')}
          className="h-16 w-16 items-center justify-center rounded-full bg-teal-500"
          style={{
            shadowColor: '#2dd4bf',
            shadowOpacity: 0.6,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 0 },
            elevation: 6,
          }}
        >
          {paused ? (
            <Play size={26} color="#ffffff" />
          ) : (
            <Pause size={26} color="#ffffff" />
          )}
        </Pressable>
      </View>

      {/* Abandon confirm */}
      <Modal
        transparent
        animationType="fade"
        visible={confirmAbandon}
        onRequestClose={() => setConfirmAbandon(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/70 px-6">
          <View className="w-full max-w-sm items-center rounded-3xl border border-white/10 bg-charcoal-500 p-6">
            <Text className="mb-2 text-3xl">💔</Text>
            <Text className="mb-1.5 text-center text-lg font-bold text-white">
              {t('focus.abandonTitle')}
            </Text>
            <Text className="mb-5 text-center text-sm text-white/65">
              {t('focus.abandonBody')}
            </Text>
            <View className="w-full gap-2">
              <Pressable
                onPress={() => setConfirmAbandon(false)}
                className="w-full items-center rounded-2xl bg-teal-500 px-6 py-3 active:opacity-90"
              >
                <Text className="text-base font-bold text-white">
                  {t('focus.keepGrowingCta')}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleAbandon}
                className={cn(
                  'w-full items-center rounded-2xl border border-danger-500/40 bg-danger-500/20 py-3'
                )}
              >
                <Text className="text-sm font-bold text-danger-300">
                  {t('focus.abandonConfirm')}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
