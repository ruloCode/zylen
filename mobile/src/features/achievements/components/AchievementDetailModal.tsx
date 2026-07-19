/**
 * Achievement Detail Modal Component — React Native port.
 *
 * Full-screen modal showing detailed information about an achievement:
 * - Progress breakdown
 * - Requirements list
 * - Detailed rewards
 * - Claim functionality
 *
 * Built on the native Modal (transparent + fade) with a pressable backdrop;
 * the web's sticky header/footer become fixed Views around a ScrollView.
 */

import React, { useState } from 'react';
import {
  Modal as RNModal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Lock, Trophy, Star, Zap, Award, type LucideIcon } from 'lucide-react-native';
import * as LucideIcons from 'lucide-react-native';
import toast from '@/lib/toast';
import { useLocale } from '@/hooks/useLocale';
import { useAppStore } from '@/store';
import type { AchievementWithProgress, AchievementTier } from '@/types/achievement';
import {
  isAchievementAvailable,
  isAchievementClaimed,
  isAchievementLocked,
} from '@/types/achievement';
import { cn } from '@/utils';

interface AchievementDetailModalProps {
  achievement: AchievementWithProgress;
  isOpen: boolean;
  onClose: () => void;
}

// Tier color configurations (same as AchievementCard; literal gradient stops
// because LinearGradient can't consume Tailwind classes)
const tierColors: Record<
  AchievementTier,
  {
    gradient: [string, string, ...string[]];
    progress: [string, string, ...string[]];
    badge: [string, string, ...string[]];
    text: string;
    border: string;
  }
> = {
  bronze: {
    gradient: ['#D97706', '#92400E'], // amber-600 → amber-800
    progress: ['#FBBF24', '#D97706'], // amber-400 → amber-600
    badge: ['#D97706', '#D97706'], // amber-600 (solid)
    text: 'text-amber-400',
    border: 'border-amber-500/40',
  },
  silver: {
    gradient: ['#D1D5DB', '#6B7280'], // gray-300 → gray-500
    progress: ['#D1D5DB', '#6B7280'],
    badge: ['#9CA3AF', '#9CA3AF'], // gray-400 (solid)
    text: 'text-gray-300',
    border: 'border-gray-400/40',
  },
  gold: {
    gradient: ['#FACC15', '#CA8A04'], // yellow-400 → yellow-600
    progress: ['#FACC15', '#CA8A04'],
    badge: ['#EAB308', '#EAB308'], // yellow-500 (solid)
    text: 'text-yellow-400',
    border: 'border-yellow-500/40',
  },
  platinum: {
    gradient: ['hsl(186, 75%, 57%)', '#A855F7', '#9333EA'], // cyan-400 → purple-500 → purple-600
    progress: ['hsl(186, 75%, 57%)', '#A855F7', '#9333EA'],
    badge: ['hsl(186, 63%, 53%)', '#9333EA'], // cyan-500 → purple-600
    text: 'text-purple-400',
    border: 'border-purple-500/40',
  },
};

export function AchievementDetailModal({
  achievement,
  isOpen,
  onClose,
}: AchievementDetailModalProps) {
  const { t } = useLocale();
  const claimAchievement = useAppStore((state) => state.claimAchievement);
  const [isClaiming, setIsClaiming] = useState(false);

  if (!isOpen) return null;

  const {
    key,
    name,
    description,
    iconName,
    tier,
    category,
    requirementType,
    requirementValue,
    xpReward,
    pointsReward,
    progress,
    unlockedAt,
    claimedAt,
  } = achievement;

  // Resolve localized name/description via the achievement key, falling back
  // to the DB values for achievements without translations
  const displayName = t(`achievements.list.${key}.name`, { defaultValue: name });
  const displayDescription = t(`achievements.list.${key}.description`, {
    defaultValue: description,
  });

  // Get icon component
  const IconComponent =
    ((LucideIcons as unknown as Record<string, LucideIcon>)[iconName] as LucideIcon) || Award;

  // Calculate progress percentage
  const progressPercentage = Math.min((progress / requirementValue) * 100, 100);

  // Get tier styling
  const tierStyle = tierColors[tier];

  // Get achievement state
  const locked = isAchievementLocked(achievement);
  const available = isAchievementAvailable(achievement);
  const claimed = isAchievementClaimed(achievement);

  // Handle claim button
  const handleClaim = async () => {
    if (!available || isClaiming) return;

    setIsClaiming(true);
    try {
      const result = await claimAchievement(achievement.id);

      if (result.success) {
        toast.success(
          t('achievements.toast.claimed', {
            name: displayName,
            xp: xpReward,
            points: pointsReward,
          })
        );
        setTimeout(() => onClose(), 1500); // Close after showing success
      } else {
        toast.error(t('achievements.toast.error', { error: result.error || 'Unknown error' }));
      }
    } catch (error) {
      toast.error(t('achievements.toast.error', { error: 'Failed to claim achievement' }));
    } finally {
      setIsClaiming(false);
    }
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Get requirement text
  const requirementText = t(`achievements.requirementTypes.${requirementType}`, {
    value: requirementValue,
  });

  return (
    <RNModal transparent animationType="fade" visible={isOpen} onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/70 p-4">
        {/* Backdrop press closes the modal */}
        <Pressable
          onPress={onClose}
          style={StyleSheet.absoluteFill}
          accessibilityLabel={t('common.close')}
        />

        <View
          className={cn(
            'w-full overflow-hidden rounded-3xl border-2 bg-[hsl(var(--glass-bg)/0.98)]',
            tierStyle.border
          )}
          style={{ maxWidth: 512, maxHeight: '90%' }}
          accessibilityViewIsModal
        >
          {/* Header (web: sticky top) */}
          <View className="border-b border-white/10 bg-charcoal-800/95 p-6">
            <View className="mb-4 flex-row items-start justify-between">
              <View className="flex-1">
                <Text className="mb-1 text-2xl font-bold text-white">
                  {t('achievements.modal.title')}
                </Text>
                <Text className="text-sm text-white/60">
                  {t(`achievements.categories.${category}`)}
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                className="rounded-lg p-2 active:bg-white/10"
                accessibilityRole="button"
                accessibilityLabel={t('common.close')}
              >
                <X size={24} color="rgba(255,255,255,0.7)" />
              </Pressable>
            </View>

            {/* Achievement Icon & Name */}
            <View className="flex-row items-center gap-4">
              <View
                className={cn(
                  'h-20 w-20 items-center justify-center overflow-hidden rounded-2xl',
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
                  <Lock size={40} color="rgba(255,255,255,0.5)" />
                ) : (
                  <IconComponent size={40} color="#FFFFFF" />
                )}
              </View>

              <View className="flex-1">
                <Text
                  className={cn(
                    'mb-2 text-2xl font-bold',
                    locked ? 'text-white/70' : tierStyle.text
                  )}
                >
                  {displayName}
                </Text>
                <View className="flex-row items-center gap-2">
                  {/* Tier Badge */}
                  {locked ? (
                    <View className="rounded-full bg-white/10 px-3 py-1">
                      <Text className="text-xs font-bold uppercase tracking-wider text-white/50">
                        {t(`achievements.tiers.${tier}`)}
                      </Text>
                    </View>
                  ) : (
                    <View className="overflow-hidden rounded-full">
                      <LinearGradient
                        colors={tierStyle.badge}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={{ paddingHorizontal: 12, paddingVertical: 4 }}
                      >
                        <Text className="text-xs font-bold uppercase tracking-wider text-white">
                          {t(`achievements.tiers.${tier}`)}
                        </Text>
                      </LinearGradient>
                    </View>
                  )}

                  {/* State Badge */}
                  {available && (
                    <View className="rounded-full bg-green-600 px-3 py-1">
                      <Text className="text-xs font-bold text-white">
                        {t('achievements.available')}
                      </Text>
                    </View>
                  )}
                  {claimed && claimedAt && (
                    <View className="rounded-full bg-white/10 px-3 py-1">
                      <Text className="text-xs font-bold text-white/70">
                        {t('achievements.claimed')}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* Content */}
          <ScrollView contentContainerStyle={{ padding: 24, gap: 24 }}>
            {/* Description */}
            <View>
              <Text className="mb-2 text-[11px] font-bold uppercase tracking-[1.7px] text-white/60">
                {t('achievements.modal.description')}
              </Text>
              <Text className="leading-relaxed text-white/90">{displayDescription}</Text>
            </View>

            {/* Requirements */}
            <View>
              <Text className="mb-2 text-[11px] font-bold uppercase tracking-[1.7px] text-white/60">
                {t('achievements.requirements')}
              </Text>
              <View className="rounded-xl border border-white/10 bg-white/5 p-4">
                <Text className="text-white/90">{requirementText}</Text>
              </View>
            </View>

            {/* Progress */}
            <View>
              <View className="mb-3 flex-row items-center justify-between">
                <Text className="text-[11px] font-bold uppercase tracking-[1.7px] text-white/60">
                  {t('achievements.modal.yourProgress')}
                </Text>
                <Text
                  className={cn('text-sm font-bold', locked ? 'text-white/60' : tierStyle.text)}
                >
                  {progress} / {requirementValue}
                </Text>
              </View>

              {/* Progress Bar */}
              <View className="mb-2 h-3 overflow-hidden rounded-full bg-white/10">
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

              {/* Progress Message */}
              {locked ? (
                <Text className="text-sm text-white/60">{t('achievements.modal.keepGoing')}</Text>
              ) : (
                <Text className="text-sm font-medium text-green-400">
                  {t('achievements.modal.requirementsMet')}
                </Text>
              )}
            </View>

            {/* Rewards */}
            <View>
              <Text className="mb-3 text-[11px] font-bold uppercase tracking-[1.7px] text-white/60">
                {t('achievements.rewards')}
              </Text>
              <View className="flex-row gap-3">
                {/* XP Reward */}
                <View
                  className={cn(
                    'flex-1 rounded-xl border-2 bg-white/5 p-4',
                    locked ? 'border-white/10' : 'border-teal-500/40'
                  )}
                >
                  <View className="mb-2 flex-row items-center gap-2">
                    <Zap size={20} color={locked ? 'rgba(255,255,255,0.5)' : '#2DD4BF'} />
                    <Text className="text-sm font-medium text-white/70">{t('common.xp')}</Text>
                  </View>
                  <Text
                    className={cn('text-2xl font-bold', locked ? 'text-white/50' : 'text-teal-400')}
                  >
                    +{xpReward}
                  </Text>
                </View>

                {/* Points Reward */}
                <View
                  className={cn(
                    'flex-1 rounded-xl border-2 bg-white/5 p-4',
                    locked ? 'border-white/10' : 'border-gold-500/40'
                  )}
                >
                  <View className="mb-2 flex-row items-center gap-2">
                    <Star size={20} color={locked ? 'rgba(255,255,255,0.5)' : 'hsl(40, 95%, 58%)'} />
                    <Text className="text-sm font-medium text-white/70">{t('common.points')}</Text>
                  </View>
                  <Text
                    className={cn('text-2xl font-bold', locked ? 'text-white/50' : 'text-gold-400')}
                  >
                    +{pointsReward}
                  </Text>
                </View>
              </View>
            </View>

            {/* Timestamps */}
            {unlockedAt && (
              <View className="rounded-xl border border-white/10 bg-white/5 p-4">
                <Text className="mb-1 text-sm text-white/70">
                  {t('achievements.unlockedOn', { date: formatDate(unlockedAt) })}
                </Text>
                {claimedAt && (
                  <Text className="text-sm text-white/70">
                    {t('achievements.claimedOn', { date: formatDate(claimedAt) })}
                  </Text>
                )}
              </View>
            )}
          </ScrollView>

          {/* Footer - Action Button (web: sticky bottom) */}
          <View className="border-t border-white/10 bg-charcoal-800/95 p-6">
            {locked && (
              <View className="w-full flex-row items-center justify-center gap-2 rounded-xl bg-white/5 px-6 py-4">
                <Lock size={20} color="rgba(255,255,255,0.5)" />
                <Text className="font-bold text-white/50">{t('achievements.locked')}</Text>
              </View>
            )}

            {available && (
              <Pressable
                onPress={handleClaim}
                disabled={isClaiming}
                accessibilityRole="button"
                accessibilityState={{ disabled: isClaiming, busy: isClaiming }}
                className={cn(
                  'w-full overflow-hidden rounded-xl active:scale-95',
                  isClaiming && 'opacity-50'
                )}
              >
                <LinearGradient
                  colors={tierStyle.gradient}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    paddingHorizontal: 24,
                    paddingVertical: 16,
                  }}
                >
                  <Trophy size={20} color="#FFFFFF" />
                  <Text className="font-bold text-white">
                    {isClaiming ? t('common.loading') : t('achievements.claimReward')}
                  </Text>
                </LinearGradient>
              </Pressable>
            )}

            {claimed && claimedAt && (
              <View className="w-full overflow-hidden rounded-xl">
                <LinearGradient
                  colors={tierStyle.gradient}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 24,
                    paddingVertical: 16,
                  }}
                >
                  <Text className="text-center font-bold text-white">
                    ✓ {t('achievements.claimed')}
                  </Text>
                </LinearGradient>
              </View>
            )}
          </View>
        </View>
      </View>
    </RNModal>
  );
}
