/**
 * SessionBrokenScreen — the gem shattered (abandon / pause overrun /
 * expiry). The shared broken artwork gets the species' accent as a dim
 * glow behind it.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { RotateCcw } from 'lucide-react-native';
import { useLocale } from '@/hooks/useLocale';
import { img } from '@/assets/registry';
import type { FocusBreakReason, GemSpecies } from '@/types/focus';
import { GEM_BROKEN_IMAGE, speciesMeta } from '../utils/gemAssets';

interface SessionBrokenScreenProps {
  reason: FocusBreakReason;
  species: GemSpecies | null;
  onRetry: () => void;
}

const REASON_KEY: Record<FocusBreakReason, string> = {
  paused_too_long: 'focus.brokenPause',
  abandoned: 'focus.brokenAbandon',
  expired: 'focus.brokenExpired',
};

export function SessionBrokenScreen({
  reason,
  species,
  onRetry,
}: SessionBrokenScreenProps) {
  const { t } = useLocale();
  const meta = species ? speciesMeta(species) : null;

  // Pop-in for the broken husk (web: animate-pop-in)
  const pop = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(pop, {
      toValue: 1,
      friction: 6,
      tension: 140,
      useNativeDriver: true,
    }).start();
  }, [pop]);

  return (
    <View className="flex-1 items-center justify-center gap-6 py-8">
      <View className="relative items-center justify-center">
        {/* Dim species glow */}
        <View
          className="absolute rounded-full opacity-25"
          style={{
            width: 192,
            height: 192,
            backgroundColor: meta?.color ?? '#2DD4BF',
          }}
        />
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
            source={img(GEM_BROKEN_IMAGE)}
            contentFit="contain"
            style={{ width: 176, height: 176 }}
            accessibilityElementsHidden
          />
        </Animated.View>
      </View>

      <View className="items-center px-8">
        <Text className="mb-2 text-3xl">💔</Text>
        <Text className="text-center text-2xl font-extrabold text-white">
          {t('focus.brokenTitle')}
        </Text>
        <Text className="mt-2 text-center text-sm leading-relaxed text-white/60">
          {t(REASON_KEY[reason])}
        </Text>
      </View>

      <View className="w-full max-w-sm px-6">
        <Pressable
          onPress={onRetry}
          className="w-full flex-row items-center justify-center gap-2 rounded-2xl bg-teal-500 px-6 py-3 active:opacity-90"
        >
          <RotateCcw size={18} color="#ffffff" />
          <Text className="text-base font-bold text-white">
            {t('focus.retry')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
