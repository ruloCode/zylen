/**
 * Achievement Card Component
 *
 * Displays an achievement/badge with visual progress, tier-based styling,
 * and animated effects for unlocked achievements.
 */

import React from 'react';
import { Lock } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { AchievementWithProgress, AchievementTier } from '@/types/achievement';

interface AchievementCardProps {
  achievement: AchievementWithProgress;
  currentStreak?: number;
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

export function AchievementCard({ achievement, currentStreak = 0 }: AchievementCardProps) {
  const { unlocked, name, description, iconName, tier, requirementValue, xpReward, pointsReward } = achievement;

  // Get icon component
  const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.Award;

  // Calculate progress percentage
  const progressPercentage = Math.min((currentStreak / requirementValue) * 100, 100);

  // Get tier styling
  const tierStyle = tierColors[tier];

  return (
    <div
      className={`
        glass-card rounded-2xl p-5 transition-all duration-300
        ${unlocked
          ? `${tierStyle.border} border-2 ${tierStyle.glow} shadow-xl scale-100 hover:scale-105`
          : 'opacity-60 grayscale border border-white/20 hover:opacity-80'}
      `}
    >
      {/* Header with Icon */}
      <div className="flex items-center justify-between mb-4">
        <div className={`
          w-16 h-16 rounded-xl flex items-center justify-center
          ${unlocked
            ? `bg-gradient-to-br ${tierStyle.gradient} ${tierStyle.glow} shadow-lg`
            : 'bg-white/5'}
        `}>
          {unlocked ? (
            <IconComponent size={32} className="text-white" />
          ) : (
            <Lock size={32} className="text-white/50" />
          )}
        </div>

        {/* Tier Badge */}
        <div className={`
          px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
          ${unlocked
            ? `bg-gradient-to-r ${tierStyle.gradient} text-white ${tierStyle.glow}`
            : 'bg-white/10 text-white/50'}
        `}>
          {tier}
        </div>
      </div>

      {/* Name */}
      <h3 className={`
        text-lg font-bold mb-2
        ${unlocked ? tierStyle.text : 'text-white/70'}
      `}>
        {name}
      </h3>

      {/* Description */}
      <p className="text-sm text-white/80 mb-4 line-clamp-2">
        {description}
      </p>

      {/* Progress Bar */}
      {!unlocked && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-white/70 mb-2">
            <span>Progreso</span>
            <span>{currentStreak}/{requirementValue} días</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full ${tierStyle.progress} transition-all duration-500 ease-out`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Unlocked Badge or Rewards */}
      {unlocked ? (
        <div className={`
          flex items-center justify-center gap-2 px-3 py-2 rounded-lg
          bg-gradient-to-r ${tierStyle.gradient} ${tierStyle.glow}
        `}>
          <span className="text-white text-sm font-bold">✓ Desbloqueado</span>
        </div>
      ) : (
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5">
          <div className="flex items-center gap-2 text-xs text-white/70">
            <span>🎁 {xpReward} XP</span>
            <span>•</span>
            <span>💰 {pointsReward} pts</span>
          </div>
        </div>
      )}
    </div>
  );
}
