/**
 * RelicCard
 *
 * Compact "relic" tile for the streak-achievements collection on mobile:
 * tier-tinted icon medallion + name + thin progress. Designed for a 2-col
 * grid inside the 480px frame (the full AchievementCard felt cramped there).
 * Tapping opens the existing AchievementDetailModal for the long copy.
 */

import { Check, Lock } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { AchievementWithProgress, AchievementTier } from '@/types/achievement';
import {
  isAchievementAvailable,
  isAchievementClaimed,
  isAchievementLocked,
} from '@/types/achievement';
import { useLocale } from '@/hooks/useLocale';
import { cn } from '@/utils';

interface RelicCardProps {
  achievement: AchievementWithProgress;
  onClick?: () => void;
}

const tierStyles: Record<AchievementTier, { medallion: string; ring: string; text: string }> = {
  bronze: {
    medallion: 'from-amber-600 to-amber-800',
    ring: 'ring-amber-500/40',
    text: 'text-amber-300',
  },
  silver: {
    medallion: 'from-gray-300 to-gray-500',
    ring: 'ring-gray-300/40',
    text: 'text-gray-200',
  },
  gold: {
    medallion: 'from-yellow-400 to-yellow-600',
    ring: 'ring-yellow-400/50',
    text: 'text-yellow-300',
  },
  platinum: {
    medallion: 'from-cyan-400 via-purple-500 to-purple-600',
    ring: 'ring-purple-400/50',
    text: 'text-purple-300',
  },
};

export function RelicCard({ achievement, onClick }: RelicCardProps) {
  const { t } = useLocale();
  const { key, name, iconName, tier, requirementValue, progress } = achievement;

  const displayName = t(`achievements.list.${key}.name`, { defaultValue: name });
  const locked = isAchievementLocked(achievement);
  const available = isAchievementAvailable(achievement);
  const claimed = isAchievementClaimed(achievement);
  const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.Award;
  const pct = Math.min((progress / requirementValue) * 100, 100);
  const style = tierStyles[tier];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center text-center gap-2 rounded-2xl p-4 pt-5 transition-all',
        'bg-white/[0.04] border border-white/10 active:scale-[0.97]',
        locked && 'opacity-70',
        available && cn('ring-1', style.ring, 'animate-glow-pulse'),
        claimed && cn('ring-1', style.ring)
      )}
    >
      {/* Available ping / claimed check */}
      {available && (
        <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </span>
      )}
      {claimed && (
        <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-emerald-500/90 grid place-items-center">
          <Check size={10} className="text-white" strokeWidth={3} />
        </span>
      )}

      {/* Medallion */}
      <span
        className={cn(
          'w-14 h-14 rounded-full grid place-items-center overflow-hidden shrink-0',
          locked
            ? 'bg-white/5 grayscale'
            : cn('bg-gradient-to-br shadow-lg', style.medallion)
        )}
      >
        {locked ? (
          <Lock size={20} className="text-white/40" />
        ) : (
          <IconComponent size={24} className="text-white drop-shadow" />
        )}
      </span>

      <span
        className={cn(
          'w-full text-[13px] font-bold leading-tight line-clamp-2 min-h-[2em]',
          locked ? 'text-white/60' : style.text
        )}
      >
        {displayName}
      </span>

      {/* Thin progress (only while locked) or state line */}
      {locked ? (
        <span className="w-full">
          <span className="block h-1 rounded-full bg-white/10 overflow-hidden">
            <span
              className={cn('block h-full rounded-full bg-gradient-to-r', style.medallion)}
              style={{ width: `${pct}%` }}
            />
          </span>
          <span className="mt-1 block text-[10px] font-semibold text-white/45">
            {progress}/{requirementValue}
          </span>
        </span>
      ) : (
        <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-300/90">
          {available ? t('achievements.available') : t('achievements.claimed')}
        </span>
      )}
    </button>
  );
}

export default RelicCard;
