/**
 * Achievement Card Component — React Native port.
 *
 * Displays an achievement/badge with visual progress, tier-based styling,
 * and gradient effects for unlocked/available achievements.
 *
 * States:
 * - Locked: Gray, low opacity, lock icon
 * - Available: Vibrant, tier glow border, "Available!" badge
 * - Claimed: Normal colors, claimed banner
 *
 * The CSS pulse/scale/grayscale effects are decorative and omitted on
 * native; the gradient identity is preserved via expo-linear-gradient.
 */

import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock, Award, type LucideIcon } from 'lucide-react-native';
import * as LucideIcons from 'lucide-react-native';
import type { AchievementWithProgress, AchievementTier } from '@/types/achievement';
import {
  isAchievementAvailable,
  isAchievementClaimed,
  isAchievementLocked,
} from '@/types/achievement';
import { useLocale } from '@/hooks/useLocale';
import { img } from '@/assets/registry';
import { cn } from '@/utils';

interface AchievementCardProps {
  achievement: AchievementWithProgress;
  onClick?: () => void;
}

// Tier color configurations (gradients as literal stops — LinearGradient
// can't consume Tailwind classes; values mirror the web's tailwind colors)
export const tierColors: Record<
  AchievementTier,
  {
    gradient: [string, string, ...string[]];
    progress: [string, string, ...string[]];
    text: string;
    border: string;
  }
> = {
  bronze: {
    gradient: ['#D97706', '#92400E'], // amber-600 → amber-800
    progress: ['#FBBF24', '#D97706'], // amber-400 → amber-600
    text: 'text-amber-400',
    border: 'border-amber-500/40',
  },
  silver: {
    gradient: ['#D1D5DB', '#6B7280'], // gray-300 → gray-500
    progress: ['#D1D5DB', '#6B7280'],
    text: 'text-gray-300',
    border: 'border-gray-400/40',
  },
  gold: {
    gradient: ['#FACC15', '#CA8A04'], // yellow-400 → yellow-600
    progress: ['#FACC15', '#CA8A04'],
    text: 'text-yellow-400',
    border: 'border-yellow-500/40',
  },
  platinum: {
    gradient: ['hsl(186, 75%, 57%)', '#A855F7', '#9333EA'], // cyan-400 → purple-500 → purple-600
    progress: ['hsl(186, 75%, 57%)', '#A855F7', '#9333EA'],
    text: 'text-purple-400',
    border: 'border-purple-500/40',
  },
};

export function AchievementCard({ achievement, onClick }: AchievementCardProps) {
  const { t } = useLocale();
  const {
    key,
    name,
    description,
    iconName,
    tier,
    requirementValue,
    xpReward,
    pointsReward,
    progress,
  } = achievement;

  // Resolve localized name/description via the achievement key, falling back
  // to the DB values for achievements without translations
  const displayName = t(`achievements.list.${key}.name`, { defaultValue: name });
  const displayDescription = t(`achievements.list.${key}.description`, {
    defaultValue: description,
  });

  // Get achievement states
  const locked = isAchievementLocked(achievement);
  const available = isAchievementAvailable(achievement);
  const claimed = isAchievementClaimed(achievement);

  // Get icon component (fallback to the lucide icon when the PNG is missing)
  const IconComponent =
    ((LucideIcons as unknown as Record<string, LucideIcon>)[iconName] as LucideIcon) || Award;
  const [imageFailed, setImageFailed] = useState(false);
  const imageSource = img(`/achievements/${key}.png`);

  // Calculate progress percentage
  const progressPercentage = Math.min((progress / requirementValue) * 100, 100);

  // Get tier styling
  const tierStyle = tierColors[tier];

  return (
    <Pressable
      onPress={onClick}
      disabled={!onClick}
      accessibilityRole={onClick ? 'button' : undefined}
      accessibilityLabel={displayName}
      className={cn(
        'rounded-2xl border border-white/10 bg-[hsl(var(--glass-bg)/0.65)] p-5',
        locked && 'border-white/20 opacity-60',
        available && cn('border-2', tierStyle.border),
        claimed && cn('border-2', tierStyle.border),
        onClick && 'active:opacity-80'
      )}
    >
      {/* Header with Icon */}
      <View className="mb-4 flex-row items-center justify-between">
        <View
          className={cn(
            'relative h-16 w-16 items-center justify-center overflow-hidden rounded-xl',
            locked && 'bg-white/5'
          )}
        >
          {!locked && (
            <LinearGradient
              colors={tierStyle.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          )}
          {locked ? (
            <Lock size={32} color="rgba(255,255,255,0.5)" />
          ) : imageSource && !imageFailed ? (
            <Image
              source={imageSource}
              contentFit="contain"
              style={{ width: '100%', height: '100%' }}
              onError={() => setImageFailed(true)}
              accessibilityElementsHidden
            />
          ) : (
            <IconComponent size={32} color="#FFFFFF" />
          )}
        </View>

        {/* Tier Badge */}
        <View className="overflow-hidden rounded-full">
          {locked ? (
            <View className="rounded-full bg-white/10 px-3 py-1">
              <Text className="text-xs font-bold uppercase tracking-wider text-white/50">
                {tier}
              </Text>
            </View>
          ) : (
            <LinearGradient
              colors={tierStyle.gradient}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{ paddingHorizontal: 12, paddingVertical: 4 }}
            >
              <Text className="text-xs font-bold uppercase tracking-wider text-white">{tier}</Text>
            </LinearGradient>
          )}
        </View>
      </View>

      {/* Name & Available Badge */}
      <View className="mb-2 flex-row items-center gap-2">
        <Text className={cn('flex-1 text-lg font-bold', locked ? 'text-white/70' : tierStyle.text)}>
          {displayName}
        </Text>
        {available && (
          <View className="rounded-md bg-green-600 px-2 py-1">
            <Text className="text-xs font-bold text-white">{t('achievements.available')}</Text>
          </View>
        )}
      </View>

      {/* Description */}
      <Text className="mb-4 text-sm text-white/80" numberOfLines={2}>
        {displayDescription}
      </Text>

      {/* Progress Bar - Only show when locked */}
      {locked && (
        <View className="mb-4">
          <View className="mb-2 flex-row justify-between">
            <Text className="text-xs text-white/70">{t('common.progress')}</Text>
            <Text className="text-xs text-white/70">
              {progress}/{requirementValue}
            </Text>
          </View>
          <View className="h-2 overflow-hidden rounded-full bg-white/10">
            <View
              className="h-full overflow-hidden rounded-full"
              style={{ width: `${progressPercentage}%` }}
            >
              <LinearGradient
                colors={tierStyle.progress}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFill}
              />
            </View>
          </View>
        </View>
      )}

      {/* Footer - State Badge or Rewards */}
      {locked && (
        <View className="flex-row items-center justify-between rounded-lg bg-white/5 px-3 py-2">
          <View className="flex-row items-center gap-2">
            <Text className="text-xs text-white/70">
              ✦ {xpReward} {t('common.xp')}
            </Text>
            <Text className="text-xs text-white/70">•</Text>
            <Text className="text-xs text-white/70">
              ◈ {pointsReward} {t('common.points')}
            </Text>
          </View>
        </View>
      )}

      {available && (
        <View className="overflow-hidden rounded-lg">
          <LinearGradient
            colors={tierStyle.gradient}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 12,
              paddingVertical: 8,
            }}
          >
            <Text className="text-sm font-bold text-white">
              🎁 {t('achievements.claimReward')}: +{xpReward} {t('common.xp')}, +{pointsReward}{' '}
              {t('common.points')}
            </Text>
          </LinearGradient>
        </View>
      )}

      {claimed && (
        <View className="overflow-hidden rounded-lg">
          <LinearGradient
            colors={tierStyle.gradient}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 12,
              paddingVertical: 8,
            }}
          >
            <Text className="text-sm font-bold text-white">{t('achievements.claimed')}</Text>
          </LinearGradient>
        </View>
      )}
    </Pressable>
  );
}
