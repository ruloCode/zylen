/**
 * Achievement Detail Modal Component
 *
 * Full-screen modal showing detailed information about an achievement including:
 * - Progress breakdown
 * - Requirements list
 * - Detailed rewards
 * - Claim functionality
 */

import React, { useState } from 'react';
import { X, Lock, Trophy, Star, Zap } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import toast from 'react-hot-toast';
import { useLocale } from '@/hooks/useLocale';
import { useAppStore } from '@/store';
import type { AchievementWithProgress, AchievementTier } from '@/types/achievement';
import { getAchievementState, isAchievementAvailable, isAchievementClaimed, isAchievementLocked } from '@/types/achievement';

interface AchievementDetailModalProps {
  achievement: AchievementWithProgress;
  isOpen: boolean;
  onClose: () => void;
}

// Tier color configurations (same as AchievementCard)
const tierColors: Record<AchievementTier, {
  gradient: string;
  glow: string;
  text: string;
  border: string;
  progress: string;
  badge: string;
}> = {
  bronze: {
    gradient: 'from-amber-600 to-amber-800',
    glow: 'shadow-amber-500/30',
    text: 'text-amber-400',
    border: 'border-amber-500/40',
    progress: 'bg-gradient-to-r from-amber-400 to-amber-600',
    badge: 'bg-amber-600',
  },
  silver: {
    gradient: 'from-gray-300 to-gray-500',
    glow: 'shadow-gray-400/30',
    text: 'text-gray-300',
    border: 'border-gray-400/40',
    progress: 'bg-gradient-to-r from-gray-300 to-gray-500',
    badge: 'bg-gray-400',
  },
  gold: {
    gradient: 'from-yellow-400 to-yellow-600',
    glow: 'shadow-yellow-500/40',
    text: 'text-yellow-400',
    border: 'border-yellow-500/40',
    progress: 'bg-gradient-to-r from-yellow-400 to-yellow-600',
    badge: 'bg-yellow-500',
  },
  platinum: {
    gradient: 'from-cyan-400 via-purple-500 to-purple-600',
    glow: 'shadow-purple-500/50',
    text: 'text-purple-400',
    border: 'border-purple-500/40',
    progress: 'bg-gradient-to-r from-cyan-400 via-purple-500 to-purple-600',
    badge: 'bg-gradient-to-r from-cyan-500 to-purple-600',
  },
};

export function AchievementDetailModal({ achievement, isOpen, onClose }: AchievementDetailModalProps) {
  const { t } = useLocale();
  const claimAchievement = useAppStore((state) => state.claimAchievement);
  const [isClaiming, setIsClaiming] = useState(false);

  if (!isOpen) return null;

  const {
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

  // Get icon component
  const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.Award;

  // Calculate progress percentage
  const progressPercentage = Math.min((progress / requirementValue) * 100, 100);

  // Get tier styling
  const tierStyle = tierColors[tier];

  // Get achievement state
  const state = getAchievementState(achievement);
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
        toast.success(t('achievements.toast.claimed', {
          name,
          xp: xpReward,
          points: pointsReward
        }));
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
  const requirementText = t(`achievements.requirementTypes.${requirementType}`, { value: requirementValue });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className={`
          glass-card rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto
          border-2 ${tierStyle.border} ${tierStyle.glow}
          animate-in fade-in zoom-in duration-300
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-charcoal-950/95 backdrop-blur-sm border-b border-white/10 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-1">
                {t('achievements.modal.title')}
              </h2>
              <p className="text-sm text-white/60">{t(`achievements.categories.${category}`)}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X size={24} className="text-white/70" />
            </button>
          </div>

          {/* Achievement Icon & Name */}
          <div className="flex items-center gap-4">
            <div className={`
              w-20 h-20 rounded-2xl flex items-center justify-center
              ${locked
                ? 'bg-white/5'
                : `bg-gradient-to-br ${tierStyle.gradient} ${tierStyle.glow} shadow-xl`}
            `}>
              {locked ? (
                <Lock size={40} className="text-white/50" />
              ) : (
                <IconComponent size={40} className="text-white" />
              )}
            </div>

            <div className="flex-1">
              <h3 className={`text-2xl font-bold mb-2 ${locked ? 'text-white/70' : tierStyle.text}`}>
                {name}
              </h3>
              <div className="flex items-center gap-2">
                {/* Tier Badge */}
                <span className={`
                  px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                  ${locked
                    ? 'bg-white/10 text-white/50'
                    : `${tierStyle.badge} text-white ${tierStyle.glow}`}
                `}>
                  {t(`achievements.tiers.${tier}`)}
                </span>

                {/* State Badge */}
                {available && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-600 text-white animate-pulse">
                    {t('achievements.available')}
                  </span>
                )}
                {claimed && claimedAt && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white/70">
                    {t('achievements.claimed')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <h4 className="text-sm font-bold text-white/70 uppercase tracking-wider mb-2">
              {t('achievements.modal.description')}
            </h4>
            <p className="text-white/90 leading-relaxed">
              {description}
            </p>
          </div>

          {/* Requirements */}
          <div>
            <h4 className="text-sm font-bold text-white/70 uppercase tracking-wider mb-2">
              {t('achievements.requirements')}
            </h4>
            <div className="glass-card p-4 rounded-xl">
              <p className="text-white/90">{requirementText}</p>
            </div>
          </div>

          {/* Progress */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-white/70 uppercase tracking-wider">
                {t('achievements.modal.yourProgress')}
              </h4>
              <span className={`text-sm font-bold ${locked ? 'text-white/60' : tierStyle.text}`}>
                {progress} / {requirementValue}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="h-3 bg-white/10 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full ${tierStyle.progress} transition-all duration-500 ease-out`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            {/* Progress Message */}
            {locked && (
              <p className="text-sm text-white/60">
                {t('achievements.modal.keepGoing')}
              </p>
            )}
            {!locked && (
              <p className="text-sm text-green-400 font-medium">
                {t('achievements.modal.requirementsMet')}
              </p>
            )}
          </div>

          {/* Rewards */}
          <div>
            <h4 className="text-sm font-bold text-white/70 uppercase tracking-wider mb-3">
              {t('achievements.rewards')}
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {/* XP Reward */}
              <div className={`
                glass-card p-4 rounded-xl border-2
                ${locked ? 'border-white/10' : 'border-teal-500/40'}
              `}>
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={20} className={locked ? 'text-white/50' : 'text-teal-400'} />
                  <span className="text-sm font-medium text-white/70">XP</span>
                </div>
                <p className={`text-2xl font-bold ${locked ? 'text-white/50' : 'text-teal-400'}`}>
                  +{xpReward}
                </p>
              </div>

              {/* Points Reward */}
              <div className={`
                glass-card p-4 rounded-xl border-2
                ${locked ? 'border-white/10' : 'border-gold-500/40'}
              `}>
                <div className="flex items-center gap-2 mb-2">
                  <Star size={20} className={locked ? 'text-white/50' : 'text-gold-400'} />
                  <span className="text-sm font-medium text-white/70">Points</span>
                </div>
                <p className={`text-2xl font-bold ${locked ? 'text-white/50' : 'text-gold-400'}`}>
                  +{pointsReward}
                </p>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          {unlockedAt && (
            <div className="glass-card p-4 rounded-xl">
              <p className="text-sm text-white/70 mb-1">
                {t('achievements.unlockedOn', { date: formatDate(unlockedAt) })}
              </p>
              {claimedAt && (
                <p className="text-sm text-white/70">
                  {t('achievements.claimedOn', { date: formatDate(claimedAt) })}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer - Action Button */}
        <div className="sticky bottom-0 bg-charcoal-950/95 backdrop-blur-sm border-t border-white/10 p-6">
          {locked && (
            <button
              disabled
              className="w-full py-4 px-6 rounded-xl font-bold text-white/50 bg-white/5 cursor-not-allowed"
            >
              <Lock size={20} className="inline mr-2 mb-1" />
              {t('achievements.locked')}
            </button>
          )}

          {available && (
            <button
              onClick={handleClaim}
              disabled={isClaiming}
              className={`
                w-full py-4 px-6 rounded-xl font-bold text-white
                bg-gradient-to-r ${tierStyle.gradient} ${tierStyle.glow}
                shadow-xl hover:scale-105 active:scale-95
                transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                ${isClaiming ? 'animate-pulse' : ''}
              `}
            >
              <Trophy size={20} className="inline mr-2 mb-1" />
              {isClaiming ? t('common.loading') : t('achievements.claimReward')}
            </button>
          )}

          {claimed && claimedAt && (
            <div className={`
              w-full py-4 px-6 rounded-xl font-bold text-white text-center
              bg-gradient-to-r ${tierStyle.gradient} ${tierStyle.glow}
            `}>
              ✓ {t('achievements.claimed')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
