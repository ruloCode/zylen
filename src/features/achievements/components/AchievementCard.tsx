/**
 * Achievement Card Component
 *
 * Displays an achievement/badge with visual progress, tier-based styling,
 * and animated effects for unlocked/available achievements.
 *
 * States:
 * - Locked: Gray, low opacity, lock icon
 * - Available: Vibrant, pulsing glow, "Available!" badge
 * - Claimed: Normal colors, checkmark badge
 */

import React from 'react';
import { Lock } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { AchievementWithProgress, AchievementTier } from '@/types/achievement';
import { isAchievementAvailable, isAchievementClaimed, isAchievementLocked } from '@/types/achievement';

interface AchievementCardProps {
  achievement: AchievementWithProgress;
  onClick?: () => void;
}

// Tier color configurations
const tierColors: Record<AchievementTier, {
  gradient: string;
  glow: string;
  text: string;
  border: string;
  progress: string;
}> = {
  bronze: {
    gradient: 'from-amber-600 to-amber-800',
    glow: 'shadow-amber-500/30',
    text: 'text-amber-400',
    border: 'border-amber-500/40',
    progress: 'bg-gradient-to-r from-amber-400 to-amber-600',
  },
  silver: {
    gradient: 'from-gray-300 to-gray-500',
    glow: 'shadow-gray-400/30',
    text: 'text-gray-300',
    border: 'border-gray-400/40',
    progress: 'bg-gradient-to-r from-gray-300 to-gray-500',
  },
  gold: {
    gradient: 'from-yellow-400 to-yellow-600',
    glow: 'shadow-yellow-500/40',
    text: 'text-yellow-400',
    border: 'border-yellow-500/40',
    progress: 'bg-gradient-to-r from-yellow-400 to-yellow-600',
  },
  platinum: {
    gradient: 'from-cyan-400 via-purple-500 to-purple-600',
    glow: 'shadow-purple-500/50',
    text: 'text-purple-400',
    border: 'border-purple-500/40',
    progress: 'bg-gradient-to-r from-cyan-400 via-purple-500 to-purple-600',
  },
};

export function AchievementCard({ achievement, onClick }: AchievementCardProps) {
  const { name, description, iconName, tier, requirementValue, xpReward, pointsReward, progress } = achievement;

  // Get achievement states
  const locked = isAchievementLocked(achievement);
  const available = isAchievementAvailable(achievement);
  const claimed = isAchievementClaimed(achievement);

  // Get icon component
  const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.Award;

  // Calculate progress percentage
  const progressPercentage = Math.min((progress / requirementValue) * 100, 100);

  // Get tier styling
  const tierStyle = tierColors[tier];

  return (
    <div
      onClick={onClick}
      className={`
        glass-card rounded-2xl p-5 transition-all duration-300
        ${onClick ? 'cursor-pointer' : ''}
        ${locked && 'opacity-60 grayscale border border-white/20 hover:opacity-80'}
        ${available && `${tierStyle.border} border-2 ${tierStyle.glow} shadow-xl hover:scale-105 animate-pulse`}
        ${claimed && `${tierStyle.border} border-2 ${tierStyle.glow} shadow-lg hover:scale-102`}
      `}
    >
      {/* Header with Icon */}
      <div className="flex items-center justify-between mb-4">
        <div className={`
          w-16 h-16 rounded-xl flex items-center justify-center
          ${locked
            ? 'bg-white/5'
            : `bg-gradient-to-br ${tierStyle.gradient} ${tierStyle.glow} shadow-lg`}
        `}>
          {locked ? (
            <Lock size={32} className="text-white/50" />
          ) : (
            <IconComponent size={32} className="text-white" />
          )}
        </div>

        {/* Tier Badge */}
        <div className={`
          px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
          ${locked
            ? 'bg-white/10 text-white/50'
            : `bg-gradient-to-r ${tierStyle.gradient} text-white ${tierStyle.glow}`}
        `}>
          {tier}
        </div>
      </div>

      {/* Name & Available Badge */}
      <div className="flex items-center gap-2 mb-2">
        <h3 className={`
          text-lg font-bold flex-1
          ${locked ? 'text-white/70' : tierStyle.text}
        `}>
          {name}
        </h3>
        {available && (
          <span className="px-2 py-1 rounded-md text-xs font-bold bg-green-600 text-white animate-pulse">
            ¡Disponible!
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-white/80 mb-4 line-clamp-2">
        {description}
      </p>

      {/* Progress Bar - Only show when locked */}
      {locked && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-white/70 mb-2">
            <span>Progreso</span>
            <span>{progress}/{requirementValue}</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full ${tierStyle.progress} transition-all duration-500 ease-out`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer - State Badge or Rewards */}
      {locked && (
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5">
          <div className="flex items-center gap-2 text-xs text-white/70">
            <span>🎁 {xpReward} XP</span>
            <span>•</span>
            <span>💰 {pointsReward} pts</span>
          </div>
        </div>
      )}

      {available && (
        <div className={`
          flex items-center justify-center gap-2 px-3 py-2 rounded-lg
          bg-gradient-to-r ${tierStyle.gradient} ${tierStyle.glow}
        `}>
          <span className="text-white text-sm font-bold">🎁 Reclamar: +{xpReward} XP, +{pointsReward} pts</span>
        </div>
      )}

      {claimed && (
        <div className={`
          flex items-center justify-center gap-2 px-3 py-2 rounded-lg
          bg-gradient-to-r ${tierStyle.gradient} ${tierStyle.glow}
        `}>
          <span className="text-white text-sm font-bold">✓ Reclamado</span>
        </div>
      )}
    </div>
  );
}
