/**
 * VaultPlatform — the vault's centerpiece: the isometric jungle platform
 * where the selected period's gems grow on a virtual 5×5 grid (Forest-style
 * forest view). Completed sessions plant their species' full gem; broken
 * ones leave a shattered husk. The portal-altar highlights the latest
 * session with a duration chip. Overflow beyond the grid shows as "+N"
 * (computed from the authoritative aggregates, not the visible list).
 *
 * RN port: the scene container is locked to the artwork's aspect ratio
 * (PLATFORM_ASPECT_RATIO) and each gem is an absolute View anchored with
 * percentage left/top + own-size percentage translates, so the calibrated
 * web anchors hold 1:1. The dev-only ?debugAnchors overlay is not ported.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Gem, Sparkle } from 'lucide-react-native';
import { cn } from '@/utils/cn';
import { useLocale } from '@/hooks/useLocale';
import { img } from '@/assets/registry';
import type { FocusPeriodStats, FocusSessionRecord } from '@/types/focus';
import {
  GEM_BROKEN_IMAGE,
  VAULT_PLATFORM_IMAGE,
  gemStageImageSource,
  speciesMeta,
} from '../utils/gemAssets';
import {
  FILL_ORDER,
  MAX_PLATFORM_TILES,
  PLATFORM_ASPECT_RATIO,
  PORTAL_ANCHOR,
  anchorFor,
} from '../utils/platformAnchors';

interface VaultPlatformProps {
  /** Newest-first sessions of the selected period (pre-filtered, ≤ grid size). */
  sessions: FocusSessionRecord[];
  /** Authoritative aggregates of the selected period (for totals/overflow). */
  periodStats: FocusPeriodStats;
}

const glass = 'rounded-2xl border border-white/10 bg-[hsl(var(--glass-bg)/0.65)]';

/** Staggered pop-in (web: animate-pop-in + animation-delay i*45ms). */
function PopIn({
  delay,
  children,
}: {
  delay: number;
  children: React.ReactNode;
}) {
  const pop = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(pop, {
      toValue: 1,
      delay,
      friction: 6,
      tension: 140,
      useNativeDriver: true,
    }).start();
  }, [pop, delay]);
  return (
    <Animated.View
      style={{
        opacity: pop,
        transform: [
          { scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

export function VaultPlatform({ sessions, periodStats }: VaultPlatformProps) {
  const { t } = useLocale();

  const placed = useMemo(
    () => sessions.slice(0, MAX_PLATFORM_TILES),
    [sessions]
  );
  const latest = placed[0] ?? null;
  const periodTotal = periodStats.completed + periodStats.broken;
  const overflow = Math.max(0, periodTotal - MAX_PLATFORM_TILES);

  return (
    <View
      className="w-full overflow-hidden rounded-3xl border border-white/10"
      style={{ aspectRatio: PLATFORM_ASPECT_RATIO }}
    >
      {/* Scene */}
      <Image
        source={img(VAULT_PLATFORM_IMAGE)}
        contentFit="cover"
        style={StyleSheet.absoluteFill}
        accessibilityElementsHidden
      />
      {/* Ambient light over the scene (web: breathing teal wash) */}
      <View
        className="absolute inset-0 bg-teal-400/5"
        pointerEvents="none"
      />
      {/* Soft top/bottom scrims for chip legibility */}
      <LinearGradient
        colors={['rgba(0,0,0,0.45)', 'rgba(0,0,0,0)']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 56 }}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.55)']}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 64 }}
        pointerEvents="none"
      />

      {/* Gems on the grid — newest first, front-center outward */}
      {placed.map((session, i) => {
        const [row, col] = FILL_ORDER[i];
        const anchor = anchorFor(row, col);
        const meta = speciesMeta(session.species);
        const broken = session.status === 'broken';
        return (
          <View
            key={session.id}
            className="absolute"
            style={{
              left: `${anchor.xPct}%`,
              top: `${anchor.yPct}%`,
              width: `${12.5 * anchor.scale}%`,
              zIndex: 10 + row,
              transform: [{ translateX: '-50%' }, { translateY: '-82%' }],
            }}
          >
            <PopIn delay={Math.min(i, 15) * 45}>
              {/* Species-colored ground glow */}
              {!broken && (
                <View
                  className="absolute rounded-full"
                  style={{
                    left: '50%',
                    bottom: 0,
                    width: '85%',
                    height: '30%',
                    opacity: 0.45,
                    backgroundColor: meta.color,
                    transform: [{ translateX: '-50%' }, { translateY: '35%' }],
                  }}
                />
              )}
              <Image
                source={
                  broken
                    ? img(GEM_BROKEN_IMAGE)
                    : gemStageImageSource(session.species, 4) ?? img(meta.image)
                }
                contentFit="contain"
                style={{
                  width: '100%',
                  aspectRatio: 1,
                  opacity: broken ? 0.6 : 1,
                }}
                accessibilityElementsHidden
              />
            </PopIn>
          </View>
        );
      })}

      {/* Portal highlight: latest session's duration */}
      {latest && (
        <View
          className="absolute z-30"
          style={{
            left: `${PORTAL_ANCHOR.xPct}%`,
            top: `${PORTAL_ANCHOR.yPct}%`,
            transform: [{ translateX: '-50%' }, { translateY: '-100%' }],
          }}
        >
          <View
            className={cn(glass, 'px-2 py-0.5')}
            accessibilityLabel={t('focus.vaultLatest')}
          >
            <Text className="text-[11px] font-bold text-teal-200">
              {latest.durationMinutes}m
            </Text>
          </View>
        </View>
      )}

      {/* Empty state */}
      {placed.length === 0 && (
        <View className="absolute inset-x-6 bottom-16 z-30 items-center">
          <View className={cn(glass, 'px-4 py-2')}>
            <Text className="text-center text-xs font-semibold text-white/80">
              {t('focus.vaultEmpty')}
            </Text>
          </View>
        </View>
      )}

      {/* Bottom counters + overflow */}
      <View className="absolute inset-x-3 bottom-2.5 z-30 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View className={cn(glass, 'flex-row items-center gap-1 px-2 py-1')}>
            <Gem size={11} color="#99f6e4" />
            <Text className="text-[11px] font-bold text-teal-200">
              {periodStats.completed}
            </Text>
          </View>
          <View className={cn(glass, 'flex-row items-center gap-1 px-2 py-1')}>
            <Text className="text-[11px] font-bold text-white/55">
              💔 {periodStats.broken}
            </Text>
          </View>
        </View>
        {overflow > 0 && (
          <View className={cn(glass, 'flex-row items-center gap-1 px-2 py-1')}>
            <Sparkle size={11} color="#FBCB6A" />
            <Text className="text-[11px] font-bold text-gold-300">
              {t('focus.vaultOverflow', { count: overflow })}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
