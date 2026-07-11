/**
 * AllyCard
 *
 * Compact ally tile for the "Tus aliados" rail: avatar wrapped in a level
 * progress ring + streak-status dot, name, level and current streak.
 * All data is real (FriendProfile) — the ring is progress to next level.
 */

import { Flame } from 'lucide-react';
import { cn } from '@/utils';
import { formatRelativeShort } from '@/utils/date';
import { useLocale } from '@/hooks/useLocale';
import { getLevelProgress } from '@/utils/xp';
import type { FriendProfile } from '@/types/social';
import { ProgressRing } from './ProgressRing';

interface AllyCardProps {
  ally: FriendProfile;
  className?: string;
}

const ACTIVE_NOW_MS = 10 * 60 * 1000;

export function AllyCard({ ally, className }: AllyCardProps) {
  const { t, language } = useLocale();
  const progress = getLevelProgress(ally.totalXPEarned, ally.level);
  const flameAlive = ally.currentStreak > 0;
  const activeNow =
    !!ally.lastActiveAt && Date.now() - ally.lastActiveAt.getTime() < ACTIVE_NOW_MS;

  return (
    <div
      className={cn(
        'shrink-0 w-[132px] rounded-2xl p-3 flex flex-col items-center text-center',
        'bg-white/[0.04] border border-white/10',
        className
      )}
    >
      <div className="relative">
        <ProgressRing percentage={progress.percentage} size={72}>
          <span className="w-[58px] h-[58px] rounded-full overflow-hidden bg-gradient-to-b from-teal-500/20 to-teal-700/10">
            {ally.avatarUrl ? (
              <img
                src={ally.avatarUrl}
                alt={ally.username}
                className="w-full h-full object-cover object-top"
                loading="lazy"
              />
            ) : (
              <span className="w-full h-full grid place-items-center text-lg font-bold text-white">
                {ally.username.charAt(0).toUpperCase()}
              </span>
            )}
          </span>
        </ProgressRing>
        {/* Presence dot: green while the ally is active right now */}
        <span
          className={cn(
            'absolute top-0.5 left-0.5 w-3 h-3 rounded-full border-2 border-[hsl(var(--background))]',
            activeNow ? 'bg-emerald-400' : 'bg-white/25'
          )}
          aria-hidden="true"
        />
        {/* Level progress % */}
        <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-[hsl(var(--background))] border border-teal-400/40 text-[10px] font-bold text-teal-300">
          {progress.percentage}%
        </span>
      </div>

      <p className="mt-2 w-full truncate font-bold text-white text-sm">
        {ally.username}
      </p>
      <p className="text-[11px] text-white/55 font-medium">
        {t('common.level')} {ally.level}
      </p>

      <p
        className={cn(
          'mt-1 flex items-center gap-1 text-[11px] font-semibold',
          flameAlive ? 'text-orange-400' : 'text-white/35'
        )}
      >
        <Flame size={12} className={flameAlive ? 'fill-orange-500/30' : ''} />
        {t('social.streakDays', { count: ally.currentStreak })}
      </p>
      {/* Presence line when known; flame status otherwise */}
      {activeNow ? (
        <p className="text-[10px] font-semibold text-emerald-400">
          ● {t('community.allies.activeNow')}
        </p>
      ) : ally.lastActiveAt ? (
        <p className="text-[10px] font-semibold text-white/35">
          {formatRelativeShort(ally.lastActiveAt, language) ||
            t('community.activity.justNow')}
        </p>
      ) : (
        <p
          className={cn(
            'text-[10px] font-semibold',
            flameAlive ? 'text-emerald-400' : 'text-white/35'
          )}
        >
          {flameAlive ? t('social.hub.flameAlive') : t('social.hub.flameOut')}
        </p>
      )}
    </div>
  );
}

export default AllyCard;
