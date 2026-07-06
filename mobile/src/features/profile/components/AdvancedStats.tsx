/**
 * AdvancedStats — React Native port.
 * Aggregated user statistics (streaks, active days, averages) plus the XP
 * distribution chart. Bars are Views with %-widths (no CSS gradients on the
 * track; the fill uses expo-linear-gradient).
 */

import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  TrendingUp,
  Flame,
  Target,
  Calendar,
  Award,
  BarChart3,
  type LucideIcon,
} from 'lucide-react-native';
import { GlassCard } from '@/components/ui';
import { useLocale } from '@/hooks/useLocale';
import { useTheme } from '@/hooks/useTheme';
import { THEMES } from '@/constants/themes';
import { StatsService, UserStats } from '@/services/supabase/stats.service';

// Map life area names to translation keys
const lifeAreaTranslationMap: Record<string, string> = {
  Health: 'lifeAreas.health',
  Finance: 'lifeAreas.finance',
  Creativity: 'lifeAreas.creativity',
  Social: 'lifeAreas.social',
  Family: 'lifeAreas.family',
  Career: 'lifeAreas.career',
};

// Literal icon colors (lucide-react-native needs concrete values)
const ORANGE_400 = 'hsl(36, 100%, 60%)';
const BLUE_400 = 'hsl(210, 100%, 62%)';
const PURPLE_400 = '#C084FC';
const GOLD_400 = 'hsl(40, 95%, 58%)';
const GOLD_500 = 'hsl(38, 95%, 52%)';

/** 'hsl(240 30% 8%)' → 'hsl(240, 30%, 8%)' — RN color parser needs commas. */
function hslLiteral(value: string): string {
  const [h, s, l] = value.match(/[\d.]+%?/g) ?? ['0', '0%', '0%'];
  return `hsl(${h}, ${s}, ${l})`;
}

interface StatItem {
  icon: LucideIcon;
  label: string;
  value: string | number;
  suffix: string;
  color: string;
  boxClass: string;
}

export function AdvancedStats() {
  const { t } = useLocale();
  const { theme } = useTheme();
  const [stats, setStats] = useState<UserStats | null>(null);

  const accent = hslLiteral(
    (THEMES.find((th) => th.id === theme) ?? THEMES[0]).swatch.accent
  );

  useEffect(() => {
    // Load stats when component mounts
    const loadStats = async () => {
      try {
        const userStats = await StatsService.getUserStats();
        setStats(userStats);
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    };

    void loadStats();
  }, []);

  if (!stats) {
    return (
      <GlassCard className="p-4">
        <View className="h-40 rounded-lg bg-white/10" />
      </GlassCard>
    );
  }

  const statItems: StatItem[] = [
    {
      icon: Flame,
      label: t('profile.stats.longestStreak'),
      value: stats.longestStreak,
      suffix: t('common.days'),
      color: ORANGE_400,
      boxClass: 'bg-orange-500/20 border-orange-400/30',
    },
    {
      icon: Target,
      label: t('profile.stats.currentStreak'),
      value: stats.currentStreak,
      suffix: t('common.days'),
      color: accent,
      boxClass: 'bg-teal-500/20 border-teal-400/30',
    },
    {
      icon: Calendar,
      label: t('profile.stats.activeDays'),
      value: stats.activeDaysCount,
      suffix: t('profile.stats.last7Days'),
      color: BLUE_400,
      boxClass: 'bg-blue-500/20 border-blue-400/30',
    },
    {
      icon: TrendingUp,
      label: t('profile.stats.dailyAverage'),
      value: stats.dailyAverage.toFixed(1),
      suffix: t('profile.stats.habitsPerDay'),
      color: PURPLE_400,
      boxClass: 'bg-[#A855F7]/20 border-[#C084FC]/30',
    },
    {
      icon: Award,
      label: t('profile.stats.totalHabits'),
      value: stats.totalHabits,
      suffix: t('profile.stats.habits'),
      color: GOLD_400,
      boxClass: 'bg-gold-500/20 border-gold-400/30',
    },
  ];

  return (
    <View className="gap-3">
      {/* Stats Header */}
      <GlassCard className="p-3">
        <View className="flex-row items-center gap-2">
          <View className="rounded-lg border border-gold-400/30 bg-gold-500/20 p-2">
            <BarChart3 size={20} color={GOLD_400} />
          </View>
          <Text className="text-lg font-bold text-white">{t('profile.stats.title')}</Text>
        </View>
      </GlassCard>

      {/* Stats Grid */}
      <View className="gap-2">
        {statItems.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <GlassCard key={index} className="p-3">
              <View className="flex-row items-center gap-3">
                {/* Icon */}
                <View className={`rounded-lg border p-2.5 ${stat.boxClass}`}>
                  <Icon size={20} color={stat.color} />
                </View>

                {/* Label and Value */}
                <View className="min-w-0 flex-1">
                  <Text className="mb-0.5 text-xs font-medium text-white/80" numberOfLines={1}>
                    {stat.label}
                  </Text>
                  <Text className="text-lg font-bold leading-tight text-white">
                    {stat.value}{' '}
                    <Text className="text-sm font-normal text-white/70">{stat.suffix}</Text>
                  </Text>
                </View>
              </View>
            </GlassCard>
          );
        })}

        {/* XP Distribution */}
        {stats.xpDistribution.length > 0 && (
          <GlassCard className="border-white/20 p-4">
            <View className="gap-3">
              <View className="mb-1 flex-row items-center gap-2">
                <View className="rounded-lg border border-teal-400/30 bg-teal-500/20 p-1.5">
                  <TrendingUp size={16} color={accent} />
                </View>
                <Text className="text-sm font-semibold text-white">
                  {t('profile.stats.xpDistribution')}
                </Text>
              </View>
              <View className="gap-3">
                {stats.xpDistribution.slice(0, 3).map((area) => {
                  // Get translated name or use original if not in map
                  const translatedName = lifeAreaTranslationMap[area.areaName]
                    ? t(lifeAreaTranslationMap[area.areaName])
                    : area.areaName;

                  return (
                    <View key={area.areaId} className="gap-1.5">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-xs font-medium text-white">{translatedName}</Text>
                        <Text className="text-xs font-medium text-white/70">
                          {area.totalXP} {t('common.xp')} ({area.percentage}%)
                        </Text>
                      </View>
                      {/* Progress bar */}
                      <View className="h-2 overflow-hidden rounded-full border border-white/20 bg-white/10">
                        <LinearGradient
                          colors={[GOLD_400, GOLD_500]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={{
                            height: '100%',
                            width: `${area.percentage}%`,
                            borderRadius: 999,
                          }}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </GlassCard>
        )}
      </View>
    </View>
  );
}
