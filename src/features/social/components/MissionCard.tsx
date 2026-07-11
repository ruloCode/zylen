/**
 * MissionCard
 *
 * Real shared-mission card: lucide icon tile, i18n title (by mission code,
 * falling back to the DB title), overlapping participant avatar stack,
 * personal progress bar (my check-ins / duration) and a join / daily
 * check-in action. All state comes from the get_shared_missions RPC.
 */

import { useState } from 'react';
import {
  Check,
  Droplets,
  Dumbbell,
  Sparkles,
  Sprout,
  Sunrise,
  Target,
  type LucideIcon,
} from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import type { SharedMission } from '@/types/community';

interface MissionCardProps {
  mission: SharedMission;
  onJoin: (missionId: string) => Promise<void>;
  onCheckin: (missionId: string) => Promise<void>;
}

// Seed catalog uses these lucide names; unknown codes fall back to Target.
const MISSION_ICONS: Record<string, LucideIcon> = {
  Droplets,
  Sunrise,
  Dumbbell,
  Sprout,
};

const ICON_TINTS: Record<string, string> = {
  Droplets: 'text-teal-300',
  Sunrise: 'text-gold-400',
  Dumbbell: 'text-orange-400',
  Sprout: 'text-emerald-300',
};

export function MissionCard({ mission, onJoin, onCheckin }: MissionCardProps) {
  const { t } = useLocale();
  const [busy, setBusy] = useState(false);

  const Icon = (mission.iconName && MISSION_ICONS[mission.iconName]) || Target;
  const tint = (mission.iconName && ICON_TINTS[mission.iconName]) || 'text-teal-300';
  const title = t(`community.missions.catalog.${mission.code}.title`, {
    defaultValue: mission.title,
  });
  const pct = Math.min(
    (mission.myDaysCompleted / mission.durationDays) * 100,
    100
  );

  const handleAction = async (action: (id: string) => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try {
      await action(mission.id);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl bg-white/[0.04] border border-white/10 p-3">
      {/* Title row: icon tile + title + action */}
      <div className="flex items-center gap-2.5 mb-2.5">
        <span className="shrink-0 w-9 h-9 rounded-xl bg-white/[0.06] ring-1 ring-inset ring-white/10 grid place-items-center">
          <Icon size={17} className={tint} />
        </span>
        <span className="min-w-0 flex-1 text-sm font-semibold text-white leading-tight line-clamp-2">
          {title}
        </span>
        {/* Action */}
        {mission.isCompleted ? (
          <span className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[11px] font-bold">
            <Check size={12} strokeWidth={3} />
            {t('community.missions.completed')}
          </span>
        ) : !mission.isJoined ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => handleAction(onJoin)}
            className="shrink-0 px-3 py-1.5 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 text-white text-[11px] font-bold ring-1 ring-inset ring-white/20 shadow-glow-teal transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
          >
            {t('community.missions.join')}
          </button>
        ) : mission.checkedInToday ? (
          <span className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/[0.06] text-white/50 text-[11px] font-bold">
            <Check size={12} strokeWidth={3} />
            {t('community.missions.checkedIn')}
          </span>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => handleAction(onCheckin)}
            className="shrink-0 px-3 py-1.5 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 text-charcoal-900 text-[11px] font-bold ring-1 ring-inset ring-white/25 shadow-glow-gold transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
          >
            {t('community.missions.checkIn')}
          </button>
        )}
      </div>

      {/* Personal progress */}
      <div className="flex items-center gap-2 mb-2">
        <span className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <span
            className="block h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-500 transition-[width] duration-500"
            style={{ width: `${mission.isJoined ? pct : 0}%` }}
          />
        </span>
        <span className="shrink-0 text-[11px] font-bold text-white/60 tabular-nums">
          {mission.isJoined ? mission.myDaysCompleted : 0}/{mission.durationDays}
        </span>
      </div>

      {/* Reward + participants */}
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1 text-[11px] font-bold text-gold-400 whitespace-nowrap">
          {t('community.missions.reward', { xp: mission.rewardXP })}
          <Sparkles size={10} />
        </span>

        {mission.participantAvatars.length > 0 && (
          <span className="flex items-center min-w-0">
            <span className="flex -space-x-2">
              {mission.participantAvatars.map((p) => (
                <span
                  key={p.userId}
                  className="w-6 h-6 rounded-full overflow-hidden ring-2 ring-[hsl(var(--surface))] bg-gradient-to-b from-teal-500/30 to-teal-700/20"
                  title={p.username}
                >
                  {p.avatarUrl ? (
                    <img
                      src={p.avatarUrl}
                      alt={p.username}
                      className="w-full h-full object-cover object-top"
                      loading="lazy"
                    />
                  ) : (
                    <span className="w-full h-full grid place-items-center text-[9px] font-bold text-white">
                      {p.username.charAt(0).toUpperCase()}
                    </span>
                  )}
                </span>
              ))}
              {mission.participantCount > mission.participantAvatars.length && (
                <span className="w-6 h-6 rounded-full ring-2 ring-[hsl(var(--surface))] bg-white/10 grid place-items-center text-[9px] font-bold text-white/70">
                  +{mission.participantCount - mission.participantAvatars.length}
                </span>
              )}
            </span>
            <span className="ml-1.5 text-[10px] font-medium text-white/45 truncate">
              {t('community.missions.participants', { count: mission.participantCount })}
            </span>
          </span>
        )}
      </div>
    </div>
  );
}

export default MissionCard;
