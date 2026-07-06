/**
 * SessionCelebration — the grown gem pops in with a shard burst, floating
 * "+XP" and animated totals.
 *
 * RN port: the CSS keyframes (pop-in / burst-particle / xp-float /
 * glow-pulse) are re-created with a handful of Animated values driven by a
 * single progress timeline each.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Gem, Sparkles } from 'lucide-react-native';
import { useLocale } from '@/hooks/useLocale';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';
import { img } from '@/assets/registry';
import type {
  CompleteFocusSessionResult,
  GemSpecies,
} from '@/types/focus';
import { gemStageImageSource, speciesMeta } from '../utils/gemAssets';
import { displayGemName } from '../utils/displayGemName';

interface SessionCelebrationProps {
  result: CompleteFocusSessionResult;
  species: GemSpecies;
  gemName: string;
  onAgain: () => void;
  onVault: () => void;
}

const BURST_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

export function SessionCelebration({
  result,
  species,
  gemName,
  onAgain,
  onVault,
}: SessionCelebrationProps) {
  const { t } = useLocale();
  const meta = speciesMeta(species);
  const animatedXP = useAnimatedNumber(result.xpAwarded);

  // ── animations ──────────────────────────────────────────────────────────
  const glow = useRef(new Animated.Value(0.35)).current; // glow-pulse loop
  const pop = useRef(new Animated.Value(0)).current; // gem pop-in
  const burst = useRef(new Animated.Value(0)).current; // shard burst 0→1
  const xpFloat = useRef(new Animated.Value(0)).current; // +XP rise 0→1

  useEffect(() => {
    Animated.spring(pop, {
      toValue: 1,
      friction: 6,
      tension: 140,
      useNativeDriver: true,
    }).start();
    Animated.timing(burst, {
      toValue: 1,
      duration: 700,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
    Animated.timing(xpFloat, {
      toValue: 1,
      duration: 1100,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
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
  }, [pop, burst, xpFloat, glow]);

  return (
    <View className="flex-1 items-center justify-center gap-6 py-8">
      <View className="relative items-center justify-center">
        {/* Species glow */}
        <Animated.View
          className="absolute rounded-full"
          style={{
            width: 224,
            height: 224,
            backgroundColor: meta.color,
            opacity: glow,
          }}
        />
        {/* Shard burst (web: animate-burst-particle) */}
        {BURST_ANGLES.map((angle) => {
          const rad = (angle * Math.PI) / 180;
          return (
            <Animated.View
              key={angle}
              className="absolute h-2 w-2 rounded-sm"
              style={{
                backgroundColor: meta.color,
                opacity: burst.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0],
                }),
                transform: [
                  {
                    translateX: burst.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, Math.cos(rad) * 110],
                    }),
                  },
                  {
                    translateY: burst.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, Math.sin(rad) * 110],
                    }),
                  },
                  {
                    scale: burst.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 0.4],
                    }),
                  },
                ],
              }}
            />
          );
        })}
        {/* The grown gem */}
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
            source={gemStageImageSource(species, 4) ?? img(meta.image)}
            contentFit="contain"
            style={{ width: 192, height: 192 }}
            accessibilityElementsHidden
          />
        </Animated.View>
        {/* Floating XP (web: animate-xp-float) */}
        <Animated.View
          className="absolute -top-3"
          style={{
            opacity: xpFloat.interpolate({
              inputRange: [0, 0.2, 1],
              outputRange: [0, 1, 0],
            }),
            transform: [
              {
                translateY: xpFloat.interpolate({
                  inputRange: [0, 0.2, 1],
                  outputRange: [4, 0, -28],
                }),
              },
            ],
          }}
        >
          <Text className="text-xl font-extrabold text-gold-400">
            +{result.xpAwarded} {t('common.xp')}
          </Text>
        </Animated.View>
      </View>

      <View className="items-center px-6">
        <View className="flex-row items-center justify-center gap-2">
          <Sparkles size={20} color="#FAB62E" />
          <Text className="text-2xl font-extrabold text-white">
            {t('focus.completeTitle')}
          </Text>
        </View>
        <Text className="mt-1 text-sm font-semibold text-white/70">
          {displayGemName(gemName, t)}
        </Text>
        <Text className="mt-3 text-lg font-bold tabular-nums text-gold-300">
          {t('focus.completeReward', {
            xp: animatedXP,
            points: result.pointsAwarded,
          })}
        </Text>
        {result.capped && (
          <Text className="mt-1 text-xs text-white/45">
            {t('focus.completeCapped')}
          </Text>
        )}
        {result.leveledUp && (
          <Text className="mt-2 text-sm font-bold text-teal-300">
            {t('levelUp.title')} 🎉
          </Text>
        )}
      </View>

      <View className="w-full max-w-sm gap-2 px-6">
        <Pressable
          onPress={onAgain}
          className="w-full items-center rounded-2xl bg-teal-500 px-6 py-3 active:opacity-90"
        >
          <Text className="text-base font-bold text-white">
            {t('focus.growAnother')}
          </Text>
        </Pressable>
        <Pressable
          onPress={onVault}
          className="w-full flex-row items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[hsl(var(--glass-bg)/0.65)] py-3 active:opacity-90"
        >
          <Gem size={16} color="#5eead4" />
          <Text className="text-sm font-bold text-white">{t('focus.vault')}</Text>
        </Pressable>
      </View>
    </View>
  );
}
