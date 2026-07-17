/**
 * GuardianProfileSheet
 *
 * Bottom-sheet detail for any user tapped in the ranking (weekly or
 * all-time): avatar with level-progress ring, presence, lifetime stats,
 * mutual allies, and the friendship action (add / sent / accept / allies).
 * Data comes from v_user_public_profile + get_mutual_friends_count; the
 * friendship state is derived from the already-loaded social slice lists.
 */

import { useEffect, useState } from 'react';
import {
  Check,
  Flame,
  Gem,
  Loader2,
  Sparkles,
  Trophy,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatRelativeShort } from '@/utils/date';
import { getLevelProgress } from '@/utils/xp';
import { useLocale } from '@/hooks/useLocale';
import { useSocial, useUser } from '@/store';
import * as SocialService from '@/services/supabase/social.service';
import type { PublicUserProfile } from '@/types/user';
import { ProgressRing } from './ProgressRing';

interface GuardianProfileSheetProps {
  username: string;
  onClose: () => void;
}

const ACTIVE_NOW_MS = 10 * 60 * 1000;

type FriendshipState = 'self' | 'friends' | 'request_sent' | 'request_received' | 'none';

export function GuardianProfileSheet({ username, onClose }: GuardianProfileSheetProps) {
  const { t, language } = useLocale();
  const { user } = useUser();
  const {
    friends,
    pendingRequests,
    sentRequests,
    sendFriendRequest,
    acceptFriendRequest,
  } = useSocial();

  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [mutualCount, setMutualCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setProfile(null);
    setMutualCount(null);

    SocialService.getPublicProfile(username)
      .then((data) => {
        if (cancelled) return;
        setProfile(data);
        setLoading(false);
        if (data && user?.id && data.id !== user.id) {
          SocialService.getMutualFriendsCount(user.id, data.id).then((count) => {
            if (!cancelled) setMutualCount(count);
          });
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [username, user?.id]);

  // Friendship state from the lists the hub already keeps fresh
  const receivedRequest = profile
    ? pendingRequests.find((r) => r.userId === profile.id)
    : undefined;
  const state: FriendshipState = !profile
    ? 'none'
    : profile.id === user?.id
      ? 'self'
      : friends.some((f) => f.userId === profile.id)
        ? 'friends'
        : sentRequests.some((r) => r.userId === profile.id)
          ? 'request_sent'
          : receivedRequest
            ? 'request_received'
            : 'none';

  const activeNow =
    !!profile?.lastActiveAt &&
    Date.now() - profile.lastActiveAt.getTime() < ACTIVE_NOW_MS;

  const handleAdd = async () => {
    if (actionBusy || !profile) return;
    setActionBusy(true);
    try {
      await sendFriendRequest(profile.username);
      toast.success(t('social.requestSent'));
    } catch {
      toast.error(t('social.errors.sendRequest'));
    } finally {
      setActionBusy(false);
    }
  };

  const handleAccept = async () => {
    if (actionBusy || !receivedRequest || !profile) return;
    setActionBusy(true);
    try {
      await acceptFriendRequest(receivedRequest.friendshipId);
      toast.success(t('social.requestAccepted', { username: profile.username }));
    } catch {
      toast.error(t('social.errors.acceptRequest'));
    } finally {
      setActionBusy(false);
    }
  };

  const progress = profile ? getLevelProgress(profile.totalXPEarned, profile.level) : null;

  const statTiles = profile
    ? [
        {
          key: 'level',
          icon: <Trophy size={15} className="text-gold-400" />,
          value: String(profile.level),
          label: t('common.level'),
        },
        {
          key: 'flame',
          icon: <Flame size={15} className="text-orange-400" />,
          value: t('social.hub.daysValue', { count: profile.currentStreak }),
          label: t('community.profile.currentFlame'),
        },
        {
          key: 'best',
          icon: <Flame size={15} className="text-orange-300" />,
          value: t('social.hub.daysValue', { count: profile.longestStreak }),
          label: t('community.profile.bestFlame'),
        },
        {
          key: 'light',
          icon: <Sparkles size={15} className="text-teal-300" />,
          value: profile.totalXPEarned.toLocaleString(language),
          label: t('community.profile.totalLight'),
        },
        {
          key: 'essence',
          icon: <Gem size={15} className="text-orange-400" />,
          value: profile.points.toLocaleString(language),
          label: t('community.ranking.essence'),
        },
        {
          key: 'mutual',
          icon: <Users size={15} className="text-teal-300" />,
          value: mutualCount === null || state === 'self' ? '—' : String(mutualCount),
          label: t('community.profile.mutualAllies'),
        },
      ]
    : [];

  return (
    <div
      className="fixed inset-0 z-[115] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-md bg-charcoal-500 rounded-t-3xl sm:rounded-3xl border border-white/10 shadow-soft-xl max-h-[92vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={t('community.profile.title')}
      >
        {/* Handle + close */}
        <div className="pt-3 pb-1 grid place-items-center">
          <span className="w-10 h-1 rounded-full bg-white/20" aria-hidden="true" />
        </div>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-xl grid place-items-center bg-black/40 backdrop-blur-sm text-white/80 hover:bg-black/60"
          aria-label={t('actions.close')}
        >
          <X className="w-5 h-5" />
        </button>

        {loading ? (
          <div className="py-16 grid place-items-center">
            <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
          </div>
        ) : !profile ? (
          <div className="py-16 text-center px-6">
            <Users className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/60 text-sm">{t('social.noResults')}</p>
          </div>
        ) : (
          <div className="px-5 pb-6 pt-2">
            {/* Identity */}
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <ProgressRing percentage={progress?.percentage ?? 0} size={104} strokeWidth={4}>
                  <span className="w-[86px] h-[86px] rounded-full overflow-hidden bg-gradient-to-b from-teal-500/20 to-teal-700/10">
                    {profile.avatarUrl ? (
                      <img
                        src={profile.avatarUrl}
                        alt={profile.username}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <span className="w-full h-full grid place-items-center text-2xl font-bold text-white">
                        {profile.username.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </span>
                </ProgressRing>
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-[hsl(var(--background))] border border-teal-400/40 text-[10px] font-bold text-teal-300 whitespace-nowrap">
                  {progress?.percentage ?? 0}%
                </span>
              </div>

              <h3 className="mt-3 font-sans normal-case text-lg font-extrabold text-white leading-tight">
                @{profile.username}
                {state === 'self' && (
                  <span className="ml-2 text-[10px] font-bold text-teal-300 uppercase align-middle">
                    {t('leaderboard.you')}
                  </span>
                )}
              </h3>

              {/* Presence */}
              {activeNow ? (
                <p className="mt-0.5 text-xs font-semibold text-emerald-400">
                  ● {t('community.allies.activeNow')}
                </p>
              ) : profile.lastActiveAt ? (
                <p className="mt-0.5 text-xs text-white/45">
                  {formatRelativeShort(profile.lastActiveAt, language) ||
                    t('community.activity.justNow')}
                </p>
              ) : null}

              <p className="mt-1 text-[11px] text-white/40">
                {t('community.profile.guardianSince', {
                  date: profile.createdAt.toLocaleDateString(language, {
                    month: 'long',
                    year: 'numeric',
                  }),
                })}
              </p>
            </div>

            {/* Stats */}
            <div className="mt-5 grid grid-cols-3 gap-2">
              {statTiles.map((stat) => (
                <div
                  key={stat.key}
                  className="rounded-xl bg-white/[0.04] border border-white/10 p-2.5 flex flex-col items-center text-center gap-1"
                >
                  <span className="h-4 grid place-items-center">{stat.icon}</span>
                  <p className="text-sm font-extrabold text-white leading-none">
                    {stat.value}
                  </p>
                  <p className="text-[10px] text-white/50 font-medium leading-tight">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Friendship action */}
            {state !== 'self' && (
              <div className="mt-5">
                {state === 'none' && (
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={handleAdd}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 text-white text-sm font-bold ring-1 ring-inset ring-white/20 shadow-glow-teal transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
                  >
                    {actionBusy ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <UserPlus size={16} />
                    )}
                    {t('community.profile.addAlly')}
                  </button>
                )}
                {state === 'request_sent' && (
                  <div className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/[0.06] border border-white/10 text-white/60 text-sm font-bold">
                    <Check size={16} />
                    {t('social.requestSent')}
                  </div>
                )}
                {state === 'request_received' && (
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={handleAccept}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 text-charcoal-900 text-sm font-bold ring-1 ring-inset ring-white/25 shadow-glow-gold transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
                  >
                    {actionBusy ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <UserCheck size={16} />
                    )}
                    {t('community.profile.acceptRequest')}
                  </button>
                )}
                {state === 'friends' && (
                  <div className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-sm font-bold">
                    <UserCheck size={16} />
                    {t('social.friends')}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default GuardianProfileSheet;
