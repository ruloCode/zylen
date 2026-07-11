/**
 * AlliesOverview
 *
 * Showcase view for the "Aliados" tab of the community hub, following the
 * dark-glass visual language of the Dashboard. Every number shown is real:
 *
 *   - Stats row: get_ally_stats() (ally count, active today, shared Luz this
 *     week, best flame in the circle), with client-side derived fallbacks
 *     while the RPC loads.
 *   - Allies rail: AllyCard per friend (level-progress ring + presence).
 *   - Recent activity: real get_friend_activity feed (habit completions,
 *     level ups, streak milestones, mission completions).
 *   - Shared missions: real catalog with join + daily check-in.
 */

import { useMemo, useState } from 'react';
import {
  Activity,
  Flame,
  Sparkles,
  Target,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/utils';
import { formatRelativeShort } from '@/utils/date';
import { useLocale } from '@/hooks/useLocale';
import { useCommunity } from '@/store';
import type { FriendProfile, LeaderboardEntry } from '@/types/social';
import type { ActivityEvent } from '@/types/community';
import { AllyCard } from './AllyCard';
import { MissionCard } from './MissionCard';

interface AlliesOverviewProps {
  friends: FriendProfile[];
  /** Weekly leaderboard entries, used for derived fallbacks while RPCs load. */
  leaderboardEntries: LeaderboardEntry[];
  /** Own weekly XP (Luz) earned, from userWeeklyStats. */
  ownWeeklyXP: number;
  ownAvatarUrl?: string;
  onAddAlly: () => void;
  onRemoveFriend: (friendshipId: string, username: string) => void;
}

const SECTION_TITLE =
  'text-xs font-bold uppercase tracking-[0.15em] text-white/50';

const GLASS =
  'bg-[hsl(var(--glass-bg)/0.3)] backdrop-blur-md border border-white/10 rounded-2xl shadow-soft';

const ACTIVITY_PREVIEW = 5;

export function AlliesOverview({
  friends,
  leaderboardEntries,
  ownWeeklyXP,
  ownAvatarUrl,
  onAddAlly,
  onRemoveFriend,
}: AlliesOverviewProps) {
  const { t, language } = useLocale();
  const [showAll, setShowAll] = useState(false);
  const [showAllActivity, setShowAllActivity] = useState(false);

  const {
    activityFeed,
    activityHasMore,
    activityLoading,
    sharedMissions,
    missionsLoading,
    allyStats,
    joinMission,
    checkinMission,
    loadMoreActivity,
  } = useCommunity();

  const weeklyByUserId = useMemo(() => {
    const map = new Map<string, LeaderboardEntry>();
    leaderboardEntries.forEach((entry) => map.set(entry.userId, entry));
    return map;
  }, [leaderboardEntries]);

  // ── Stats: real RPC values, derived fallbacks while loading ──
  const derivedBestStreak = friends.reduce((max, f) => Math.max(max, f.currentStreak), 0);
  const derivedSharedLuz =
    ownWeeklyXP +
    friends.reduce(
      (sum, f) => sum + (weeklyByUserId.get(f.userId)?.weeklyXPEarned ?? 0),
      0
    );
  const derivedActiveToday = friends.filter(
    (f) => f.lastActiveAt && Date.now() - f.lastActiveAt.getTime() < 24 * 60 * 60 * 1000
  ).length;

  const totalAllies = allyStats?.totalAllies ?? friends.length;
  const activeToday = allyStats?.activeToday ?? derivedActiveToday;
  const sharedLuz = allyStats?.sharedWeeklyXP ?? derivedSharedLuz;
  const bestStreak = allyStats?.bestStreak ?? derivedBestStreak;

  const stats = [
    {
      key: 'allies',
      icon: <Users size={18} className="text-teal-300" />,
      value: String(totalAllies),
      label: t('social.hub.statAllies'),
    },
    {
      key: 'activeToday',
      icon: (
        <span className="relative flex h-3.5 w-3.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
          <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-emerald-400" />
        </span>
      ),
      value: String(activeToday),
      label: t('community.allies.activeToday'),
    },
    {
      key: 'luz',
      icon: <Sparkles size={18} className="text-gold-400" />,
      value: `+${sharedLuz}`,
      label: t('social.hub.statSharedLight'),
    },
    {
      key: 'streak',
      icon: <Flame size={18} className="text-orange-400" />,
      value: t('social.hub.daysValue', { count: bestStreak }),
      label: t('social.hub.statBestStreak'),
    },
  ];

  // ── Real activity feed rendering ──
  const eventText = (event: ActivityEvent): string => {
    switch (event.eventType) {
      case 'habit_completed':
        return t('community.activity.types.habitCompleted', {
          habit: event.payload.habit_name || '',
        });
      case 'level_up':
        return t('community.activity.types.levelUp', {
          level: event.payload.level ?? 0,
        });
      case 'streak_milestone':
        return t('community.activity.types.streakMilestone', {
          days: event.payload.streak ?? 0,
        });
      case 'mission_completed':
        return t('community.activity.types.missionCompleted', {
          mission: event.payload.mission_code
            ? t(`community.missions.catalog.${event.payload.mission_code}.title`, {
                defaultValue: event.payload.mission_title || '',
              })
            : event.payload.mission_title || '',
        });
    }
  };

  const eventLuz = (event: ActivityEvent): number | undefined => {
    if (event.eventType === 'habit_completed') return event.payload.xp || undefined;
    if (event.eventType === 'mission_completed') return event.payload.reward_xp || undefined;
    return undefined;
  };

  const visibleActivity = showAllActivity
    ? activityFeed
    : activityFeed.slice(0, ACTIVITY_PREVIEW);

  const handleToggleActivity = () => {
    const next = !showAllActivity;
    setShowAllActivity(next);
    if (next && activityHasMore) {
      loadMoreActivity();
    }
  };

  // ── Mission actions ──
  const handleJoin = async (missionId: string) => {
    try {
      await joinMission(missionId);
      toast.success(t('community.missions.joinSuccess'));
    } catch {
      toast.error(t('community.missions.error'));
    }
  };

  const handleCheckin = async (missionId: string) => {
    try {
      const result = await checkinMission(missionId);
      if (!result.ok) return;
      if (result.missionCompleted) {
        toast.success(
          t('community.missions.missionComplete', { xp: result.xpAwarded })
        );
      } else {
        toast.success(t('community.missions.checkInSuccess'));
      }
    } catch {
      toast.error(t('community.missions.error'));
    }
  };

  return (
    <div className="space-y-5">
      {/* ── Alliance stats ── */}
      <div className={cn(GLASS, 'p-4')}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-4">
          {stats.map((stat) => (
            <div key={stat.key} className="flex flex-col items-center text-center gap-1">
              <span className="h-5 grid place-items-center">{stat.icon}</span>
              <p className="text-xl font-extrabold text-white leading-none">
                {stat.value}
              </p>
              <p className="text-[11px] text-white/55 font-medium leading-tight">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Your allies rail ── */}
      <section className={cn(GLASS, 'p-4')}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={SECTION_TITLE}>{t('social.hub.yourAllies')}</h3>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onAddAlly}
              className="flex items-center gap-1 text-xs font-semibold text-teal-300 hover:text-teal-200"
            >
              <UserPlus size={14} />
              {t('social.addFriend')}
            </button>
            {friends.length > 0 && (
              <button
                type="button"
                onClick={() => setShowAll((v) => !v)}
                className="text-xs font-semibold text-teal-300 hover:text-teal-200"
              >
                {showAll ? t('social.hub.viewLess') : `${t('social.hub.viewAll')} →`}
              </button>
            )}
          </div>
        </div>

        {friends.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/60 text-sm">{t('social.noFriends')}</p>
            <button
              type="button"
              onClick={onAddAlly}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold transition-colors"
            >
              <UserPlus size={16} />
              {t('social.findFriends')}
            </button>
          </div>
        ) : showAll ? (
          /* Detailed vertical list with management actions */
          <div className="space-y-2">
            {friends.map((friend) => (
              <div
                key={friend.userId}
                className="flex items-center justify-between rounded-xl bg-white/[0.04] border border-white/10 p-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-10 h-10 shrink-0 rounded-full overflow-hidden bg-gradient-to-b from-teal-500/20 to-teal-700/10">
                    {friend.avatarUrl ? (
                      <img
                        src={friend.avatarUrl}
                        alt={friend.username}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <span className="w-full h-full grid place-items-center font-bold text-white">
                        {friend.username.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-white truncate">
                      {friend.username}
                    </p>
                    <p className="text-xs text-white/55">
                      {t('common.level')} {friend.level} ·{' '}
                      {t('social.streakDays', { count: friend.currentStreak })}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    friend.friendshipId &&
                    onRemoveFriend(friend.friendshipId, friend.username)
                  }
                  aria-label={t('social.removeFriend')}
                  className="p-2 rounded-lg text-red-400/80 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                >
                  <UserMinus size={16} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
            {friends.slice(0, 8).map((friend) => (
              <AllyCard key={friend.userId} ally={friend} className="snap-start" />
            ))}
          </div>
        )}
      </section>

      <div className="grid md:grid-cols-2 gap-5 items-start">
        {/* ── Recent activity (real feed) ── */}
        <section className={cn(GLASS, 'p-4')}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={SECTION_TITLE}>{t('social.hub.recentActivity')}</h3>
            {activityFeed.length > ACTIVITY_PREVIEW && (
              <button
                type="button"
                onClick={handleToggleActivity}
                className="text-xs font-semibold text-teal-300 hover:text-teal-200"
              >
                {showAllActivity
                  ? t('social.hub.viewLess')
                  : `${t('social.hub.viewAll')} →`}
              </button>
            )}
          </div>

          {activityLoading && activityFeed.length === 0 ? (
            <div className="space-y-2" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-12 rounded-xl bg-white/[0.04] animate-pulse"
                />
              ))}
            </div>
          ) : activityFeed.length === 0 ? (
            <div className="text-center py-6">
              <Activity className="w-10 h-10 text-white/15 mx-auto mb-2" />
              <p className="text-white/50 text-sm">{t('social.hub.noActivity')}</p>
            </div>
          ) : (
            <ul className="space-y-1">
              {visibleActivity.map((event) => {
                const luz = eventLuz(event);
                const relative = formatRelativeShort(event.createdAt, language);
                return (
                  <li
                    key={event.id}
                    className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-white/[0.03]"
                  >
                    <span className="w-9 h-9 shrink-0 rounded-full overflow-hidden bg-gradient-to-b from-teal-500/20 to-teal-700/10">
                      {(event.isCurrentUser ? ownAvatarUrl : event.avatarUrl) ? (
                        <img
                          src={event.isCurrentUser ? ownAvatarUrl : event.avatarUrl}
                          alt={event.username}
                          className="w-full h-full object-cover object-top"
                          loading="lazy"
                        />
                      ) : (
                        <span className="w-full h-full grid place-items-center text-sm font-bold text-white">
                          {event.username.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white leading-tight truncate">
                        <span className="font-bold">
                          {event.isCurrentUser ? t('leaderboard.you') : event.username}
                        </span>{' '}
                        <span className="text-white/70">{eventText(event)}</span>
                      </p>
                      <p className="text-[11px] text-white/40">
                        {relative || t('community.activity.justNow')}
                      </p>
                    </div>
                    {luz !== undefined && (
                      <span className="shrink-0 flex items-center gap-1 text-gold-400 text-sm font-bold">
                        +{luz}
                        <Sparkles size={12} />
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* ── Shared missions (real, join + daily check-in) ── */}
        <section className={cn(GLASS, 'p-4')}>
          <h3 className={cn(SECTION_TITLE, 'mb-3')}>
            {t('social.hub.sharedMissions')}
          </h3>

          {missionsLoading && sharedMissions.length === 0 ? (
            <div className="space-y-3" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-20 rounded-xl bg-white/[0.04] animate-pulse"
                />
              ))}
            </div>
          ) : sharedMissions.length === 0 ? (
            <div className="text-center py-6">
              <Target className="w-10 h-10 text-white/15 mx-auto mb-2" />
              <p className="text-white/50 text-sm">{t('social.hub.missionsTeaser')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sharedMissions.map((mission) => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  onJoin={handleJoin}
                  onCheckin={handleCheckin}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default AlliesOverview;
