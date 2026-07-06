/**
 * GemVault — "Bóveda de gemas": period tabs (Hoy/Semana/Mes/Año), stat
 * cards, the isometric platform where the period's gems grow, the species
 * collection rail and the Arena power teaser.
 *
 * Rendered inside the Focus screen's ScrollView (the web page scrolls the
 * body instead).
 */

import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, Gem, HeartCrack, Lock, ShieldCheck, Swords } from 'lucide-react-native';
import { cn } from '@/utils/cn';
import { useLocale } from '@/hooks/useLocale';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';
import { img } from '@/assets/registry';
import { FOCUS_CONFIG } from '@/constants/config';
import {
  GEM_SPECIES,
  type FocusStats,
  type FocusVaultPeriod,
} from '@/types/focus';
import { getIcon } from '@/components/atoms/icons/iconMaps';
import { gemStageImageSource, speciesMeta, totalGems } from '../utils/gemAssets';
import { MAX_PLATFORM_TILES } from '../utils/platformAnchors';
import { VaultPlatform } from './VaultPlatform';

interface GemVaultProps {
  stats: FocusStats;
}

const PERIODS: Array<{ key: FocusVaultPeriod; labelKey: string }> = [
  { key: 'today', labelKey: 'focus.vaultToday' },
  { key: 'week', labelKey: 'focus.vaultWeek' },
  { key: 'month', labelKey: 'focus.vaultMonth' },
  { key: 'year', labelKey: 'focus.vaultYear' },
];

const glass = 'rounded-2xl border border-white/10 bg-[hsl(var(--glass-bg)/0.65)]';

export function GemVault({ stats }: GemVaultProps) {
  const { t } = useLocale();
  const [period, setPeriod] = useState<FocusVaultPeriod>('today');

  const periodStats = stats[period];
  const animatedGems = useAnimatedNumber(periodStats.completed);
  const animatedMinutes = useAnimatedNumber(periodStats.minutes);

  // Period sessions are a prefix of the newest-first list (all windows end
  // at now), so filter + cap is lossless up to the grid size.
  const periodSessions = useMemo(() => {
    const start = new Date(stats.periodStarts[period]).getTime();
    return stats.recentSessions
      .filter((s) => s.endedAt && new Date(s.endedAt).getTime() >= start)
      .slice(0, MAX_PLATFORM_TILES);
  }, [stats.recentSessions, stats.periodStarts, period]);

  const total = totalGems(stats.speciesCounts);
  const shieldTarget = FOCUS_CONFIG.arena.shieldUnlockGems;
  const shieldUnlocked = total >= shieldTarget;

  return (
    <View className="w-full gap-4 pb-2">
      {/* Period tabs */}
      <View className="flex-row gap-1 rounded-2xl bg-white/5 p-1">
        {PERIODS.map(({ key, labelKey }) => {
          const active = period === key;
          return (
            <Pressable
              key={key}
              onPress={() => setPeriod(key)}
              className={cn(
                'flex-1 items-center rounded-xl py-2',
                active ? 'bg-teal-500' : ''
              )}
              style={
                active
                  ? {
                      shadowColor: '#2dd4bf',
                      shadowOpacity: 0.5,
                      shadowRadius: 8,
                      shadowOffset: { width: 0, height: 0 },
                      elevation: 4,
                    }
                  : undefined
              }
            >
              <Text
                className={cn(
                  'text-[13px] font-semibold',
                  active ? 'text-white' : 'text-white/60'
                )}
              >
                {t(labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Stat cards */}
      <View className="flex-row gap-2">
        <View className={cn(glass, 'flex-1 items-center gap-1 p-3')}>
          <View className="h-7 w-7 items-center justify-center rounded-full bg-teal-500/15">
            <Gem size={14} color="#5eead4" />
          </View>
          <Text className="text-xl font-extrabold leading-none tabular-nums text-white">
            {animatedGems}
          </Text>
          <Text className="text-[11px] font-semibold text-white/55">
            {t('focus.statsGems')}
          </Text>
        </View>
        <View className={cn(glass, 'flex-1 items-center gap-1 p-3')}>
          <View className="h-7 w-7 items-center justify-center rounded-full bg-sky-500/15">
            <Clock size={14} color="#7dd3fc" />
          </View>
          <Text className="text-xl font-extrabold leading-none tabular-nums text-white">
            {animatedMinutes}
          </Text>
          <Text className="text-[11px] font-semibold text-white/55">
            {t('focus.statsMinutes')}
          </Text>
        </View>
        <View className={cn(glass, 'flex-1 items-center gap-1 p-3')}>
          <View className="h-7 w-7 items-center justify-center rounded-full bg-purple-500/15">
            <HeartCrack size={14} color="#d8b4fe" />
          </View>
          <Text className="text-xl font-extrabold leading-none tabular-nums text-white">
            {periodStats.broken}
          </Text>
          <Text className="text-[11px] font-semibold text-white/55">
            {t('focus.statsBroken')}
          </Text>
        </View>
      </View>

      {/* The platform */}
      <VaultPlatform sessions={periodSessions} periodStats={periodStats} />

      {/* Species collection rail */}
      <View className={cn(glass, 'p-4')}>
        <Text className="mb-3 text-sm font-bold text-white">
          {t('focus.speciesTotals')}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="-mx-4"
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 4, gap: 8 }}
        >
          {GEM_SPECIES.map((species) => {
            const meta = speciesMeta(species);
            const Icon = getIcon(meta.iconName);
            const count = stats.speciesCounts[species] ?? 0;
            return (
              <View
                key={species}
                className={cn(
                  'w-[72px] shrink-0 items-center gap-1 rounded-2xl border border-white/10 bg-white/5 p-2',
                  count === 0 && 'opacity-45'
                )}
              >
                <Image
                  source={gemStageImageSource(species, 4) ?? img(meta.image)}
                  contentFit="contain"
                  style={{ width: 40, height: 40 }}
                  accessibilityElementsHidden
                />
                <View className="flex-row items-center gap-1">
                  <Icon size={10} color={meta.color} />
                  <Text className="text-[11px] font-bold tabular-nums text-white/80">
                    ×{count}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* Arena power teaser */}
      <View className={cn(glass, 'p-4')}>
        <View className="mb-1 flex-row items-center gap-1.5">
          <Swords size={15} color="#d8b4fe" />
          <Text className="text-sm font-bold text-white">
            {t('focus.arenaPower')}
          </Text>
        </View>
        <Text className="mb-3 text-xs leading-snug text-white/55">
          {t('focus.arenaPowerHint')}
        </Text>
        <View className="flex-row items-center gap-2">
          {shieldUnlocked ? (
            <ShieldCheck size={18} color="#5eead4" />
          ) : (
            <Lock size={16} color="rgba(255,255,255,0.4)" />
          )}
          <View className="flex-1">
            <Text
              className={cn(
                'text-xs font-bold',
                shieldUnlocked ? 'text-teal-300' : 'text-white/70'
              )}
            >
              {t('focus.shieldProgress', {
                count: Math.min(total, shieldTarget),
                total: shieldTarget,
              })}
            </Text>
            <View className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
              <View
                className="h-full overflow-hidden rounded-full"
                style={{
                  width: `${Math.min(100, (total / shieldTarget) * 100)}%`,
                }}
              >
                <LinearGradient
                  colors={['#2bd4bd', '#a855f7']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
