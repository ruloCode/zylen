/**
 * Leaderboard Page (Unified Community Hub)
 *
 * Rankings ("Guardianes"), allies ("Aliados") and streaks ("Llama constante")
 * in a tabbed showcase following the Dashboard's dark-glass visual language:
 * sticky header with the user's flame, a hero banner per tab, segmented pill
 * tabs, and the AlliesOverview (stats + allies rail + activity + missions).
 */

import { useEffect, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Trophy, Flame, Target, Users, Search,
  UserPlus, UserCheck, X, Check, Sparkles, Gem
} from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import {
  useLeaderboard, useUser, useSocial, useAppStore, useAchievements, useCommunity,
} from '@/store';
import { Button } from '@/components/ui/Button';
import { StreakDisplay } from '@/features/streaks/components';
import { AchievementDetailModal, RelicCard } from '@/features/achievements/components';
import { AlliesOverview } from '@/features/social/components';
import type { AchievementWithProgress } from '@/types/achievement';
import type { LeaderboardEntry } from '@/types/social';
import type { RankingPeriod } from '@/types/community';
import { cn } from '@/utils';
import toast from 'react-hot-toast';

type TabType = 'rankings' | 'social' | 'streaks';
type SocialSubTab = 'friends' | 'requests' | 'search';

const TAB_KEYS: TabType[] = ['rankings', 'social', 'streaks'];
const RANKING_TOP_N = 5;

// Hero / showcase glass card surface — matches the Dashboard visual language.
const GLASS =
  'bg-[hsl(var(--glass-bg)/0.3)] backdrop-blur-md border border-white/10 rounded-2xl shadow-soft';

/** Small round avatar with initial fallback, used across hub lists. */
function HubAvatar({
  avatarUrl,
  username,
  size = 'md',
}: {
  avatarUrl?: string;
  username: string;
  size?: 'md' | 'lg';
}) {
  return (
    <span
      className={cn(
        'shrink-0 rounded-full overflow-hidden bg-gradient-to-b from-teal-500/20 to-teal-700/10',
        size === 'lg' ? 'w-12 h-12' : 'w-10 h-10'
      )}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={username}
          className="w-full h-full object-cover object-top"
          loading="lazy"
        />
      ) : (
        <span className="w-full h-full grid place-items-center font-bold text-white">
          {username.charAt(0).toUpperCase()}
        </span>
      )}
    </span>
  );
}

export function Leaderboard() {
  const { t } = useLocale();
  const { user } = useUser();
  const streak = useAppStore((state) => state.streak);

  // Leaderboard state
  const {
    weeklyLeaderboard,
    userRank,
    userWeeklyStats,
    weeklyComparison,
    allTimeLeaderboard,
    allTimeLoading,
    isLoading: leaderboardLoading,
    loadWeeklyLeaderboard,
    loadUserWeeklyStats,
    loadWeeklyComparison,
    loadAllTimeLeaderboard,
  } = useLeaderboard();

  // Community state (Aliados tab: real feed, missions, ally stats)
  const { loadAlliesTab } = useCommunity();

  // Social state
  const {
    friends,
    pendingRequests,
    sentRequests,
    searchResults,
    loadFriends,
    loadPendingRequests,
    loadSentRequests,
    searchUsers,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    clearSearchResults,
  } = useSocial();

  // Achievements state
  const {
    achievementsWithProgress,
    isLoading: achievementsLoading,
    loadAchievementsWithProgress,
  } = useAchievements();

  // Tab state, deep-linkable via ?tab= (the /social redirect relies on it)
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as TabType | null;
  const [activeTab, setActiveTabState] = useState<TabType>(
    tabParam && TAB_KEYS.includes(tabParam) ? tabParam : 'rankings'
  );
  const setActiveTab = (tab: TabType) => {
    setActiveTabState(tab);
    setSearchParams(tab === 'rankings' ? {} : { tab }, { replace: true });
  };
  const [socialSubTab, setSocialSubTab] = useState<SocialSubTab>('friends');
  const [searchTerm, setSearchTerm] = useState('');

  // Ranking period + collapse state
  const [rankingPeriod, setRankingPeriod] = useState<RankingPeriod>('weekly');
  const [rankingExpanded, setRankingExpanded] = useState(false);

  // Achievement modal state
  const [selectedAchievement, setSelectedAchievement] = useState<AchievementWithProgress | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAchievementClick = (achievement: AchievementWithProgress) => {
    setSelectedAchievement(achievement);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedAchievement(null), 300); // Wait for animation
  };

  // Load leaderboard data
  useEffect(() => {
    if (user?.id) {
      loadWeeklyLeaderboard(user.id);
      loadUserWeeklyStats(user.id);
      loadWeeklyComparison(user.id);
    }
  }, [user?.id, loadWeeklyLeaderboard, loadUserWeeklyStats, loadWeeklyComparison]);

  // Load the all-time ranking the first time "Histórico" is selected
  useEffect(() => {
    if (rankingPeriod === 'alltime' && user?.id && allTimeLeaderboard.length === 0) {
      loadAllTimeLeaderboard(user.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rankingPeriod, user?.id]);

  // Load real community data (feed + missions + ally stats) on the Aliados tab
  useEffect(() => {
    if (activeTab === 'social') {
      loadAlliesTab();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Load social data
  useEffect(() => {
    loadFriends();
    loadPendingRequests();
    loadSentRequests();
  }, [loadFriends, loadPendingRequests, loadSentRequests]);

  // Load achievements data
  useEffect(() => {
    loadAchievementsWithProgress();
  }, [loadAchievementsWithProgress]);

  // Get medal emoji for top 3
  const getMedal = (rank: number) => {
    if (rank === 1) return t('leaderboard.medal.first');
    if (rank === 2) return t('leaderboard.medal.second');
    if (rank === 3) return t('leaderboard.medal.third');
    return null;
  };

  // "▲12% vs anterior" under the weekly Luz/Esencia stats
  const renderDelta = (pct: number | null) => {
    if (!weeklyComparison) return null;
    if (!weeklyComparison.hasPreviousWeek || pct === null) {
      return (
        <p className="text-[10px] font-semibold text-white/40 leading-tight">
          {t('community.stats.newWeek')}
        </p>
      );
    }
    const up = pct >= 0;
    return (
      <p
        className={cn(
          'text-[10px] font-semibold leading-tight',
          up ? 'text-emerald-400' : 'text-danger-400'
        )}
      >
        {up ? '▲' : '▼'} {t('community.stats.vsPrevious', { pct: Math.abs(pct) })}
      </p>
    );
  };

  // ── Ranking entries for the active period, collapsed to top-N ──
  const activeEntries: LeaderboardEntry[] =
    rankingPeriod === 'weekly' ? weeklyLeaderboard?.entries ?? [] : allTimeLeaderboard;
  const isRankingLoading =
    rankingPeriod === 'weekly' ? leaderboardLoading : allTimeLoading;
  const rankingCollapsed = !rankingExpanded && activeEntries.length > RANKING_TOP_N;
  const topEntries = rankingCollapsed
    ? activeEntries.slice(0, RANKING_TOP_N)
    : activeEntries;
  // Keep the user visible even when their rank falls outside the top-N
  const ownHiddenEntry = rankingCollapsed
    ? activeEntries.find((e) => e.isCurrentUser && e.rank > RANKING_TOP_N)
    : undefined;

  const renderRankingEntry = (entry: LeaderboardEntry) => {
    const medal = getMedal(entry.rank);
    const isCurrentUser = entry.isCurrentUser;

    return (
      <div
        key={`${rankingPeriod}-${entry.userId}`}
        className={cn(
          'px-4 py-3 transition-colors',
          isCurrentUser
            ? 'bg-teal-500/10 border-l-2 border-teal-400'
            : 'hover:bg-white/[0.03]'
        )}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 shrink-0 text-center">
            {medal ? (
              <span className="text-2xl leading-none">{medal}</span>
            ) : (
              <span className="text-sm font-bold text-white/50">#{entry.rank}</span>
            )}
          </div>
          <HubAvatar avatarUrl={entry.avatarUrl} username={entry.username} />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-white truncate">
              {entry.username}
              {isCurrentUser && (
                <span className="ml-2 text-[10px] font-bold text-teal-300 uppercase">
                  {t('leaderboard.you')}
                </span>
              )}
            </p>
            <p className="text-xs text-white/55 flex items-center gap-1 whitespace-nowrap">
              {t('common.level')} {entry.level}
              {!!entry.currentStreak && entry.currentStreak > 0 && (
                <>
                  <span className="text-white/30">·</span>
                  <span className="flex items-center gap-0.5 text-orange-400 font-semibold">
                    <Flame size={11} className="fill-orange-500/30" />
                    {t('social.hub.daysValue', { count: entry.currentStreak })}
                  </span>
                </>
              )}
            </p>
          </div>
          {/* Luz / Esencia mini columns (mock layout) */}
          <div className="shrink-0 flex items-center gap-3.5">
            <div className="text-right">
              <p className="text-sm font-bold text-teal-300 leading-tight tabular-nums">
                {entry.weeklyXPEarned}
              </p>
              <p className="text-[9px] text-white/40 font-semibold uppercase tracking-wide">
                {t('community.ranking.light')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-orange-400 leading-tight tabular-nums">
                {entry.weeklyPointsEarned}
              </p>
              <p className="text-[9px] text-white/40 font-semibold uppercase tracking-wide">
                {t('community.ranking.essence')}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (value.trim().length >= 2) {
      searchUsers(value.trim());
    } else {
      clearSearchResults();
    }
  };

  // Handle friend actions
  const handleSendRequest = async (username: string) => {
    try {
      await sendFriendRequest(username);
      toast.success(t('social.requestSent'));
    } catch (error) {
      toast.error(t('social.errors.sendRequest'));
    }
  };

  const handleAcceptRequest = async (friendshipId: string, username: string) => {
    try {
      await acceptFriendRequest(friendshipId);
      toast.success(t('social.requestAccepted', { username }));
    } catch (error) {
      toast.error(t('social.errors.acceptRequest'));
    }
  };

  const handleRejectRequest = async (friendshipId: string) => {
    try {
      await rejectFriendRequest(friendshipId);
      toast.success(t('social.requestRejected'));
    } catch (error) {
      toast.error(t('social.errors.rejectRequest'));
    }
  };

  const handleRemoveFriend = async (friendshipId: string, username: string) => {
    if (confirm(t('social.confirmRemoveFriend', { username }))) {
      try {
        await removeFriend(friendshipId);
        toast.success(t('social.friendRemoved', { username }));
      } catch (error) {
        toast.error(t('social.errors.removeFriend'));
      }
    }
  };

  // Filter streak achievements and sort by requirement value
  const streakAchievements = achievementsWithProgress
    .filter((a) => a.category === 'streak')
    .sort((a, b) => a.requirementValue - b.requirementValue);

  // ── Hero banner content per tab ──
  const heroByTab: Record<TabType, { icon: ReactNode; title: string; subtitle: string }> = {
    rankings: {
      icon: <Trophy size={30} className="text-teal-300" />,
      title: t('leaderboard.tabs.rankings'),
      subtitle: t('leaderboard.hub.heroRankings'),
    },
    social: {
      icon: <Users size={30} className="text-teal-300" />,
      title: t('leaderboard.tabs.social'),
      subtitle: t('leaderboard.hub.heroSocial'),
    },
    streaks: {
      icon: <Flame size={30} className="text-teal-300" />,
      title: t('leaderboard.tabs.streaks'),
      subtitle: t('leaderboard.hub.heroStreaks'),
    },
  };
  const hero = heroByTab[activeTab];

  const mainTabs: { key: TabType; icon: ReactNode; label: string; badge?: number }[] = [
    { key: 'rankings', icon: <Trophy size={16} />, label: t('leaderboard.tabs.rankings') },
    {
      key: 'social',
      icon: <Users size={16} />,
      label: t('leaderboard.tabs.social'),
      badge: pendingRequests.length || undefined,
    },
    { key: 'streaks', icon: <Flame size={16} />, label: t('leaderboard.tabs.streaks') },
  ];

  return (
    <div className="min-h-screen pb-24 px-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
      <div className="container mx-auto max-w-4xl">
        {/* ── Sticky-style header: title + own flame ── */}
        <header className="flex items-center justify-between mb-4">
          <h1 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.2em] text-white">
            <Trophy size={18} className="text-gold-400" />
            {t('leaderboard.title')}
          </h1>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/10 text-sm font-bold text-white">
            <Flame size={15} className="text-orange-400 fill-orange-500/30" />
            {streak?.currentStreak ?? 0}
            <span className="text-[10px] font-semibold text-white/50 uppercase tracking-wide">
              {t('leaderboard.tabs.streaks')}
            </span>
          </span>
        </header>

        {/* ── Hero banner (changes with the active tab) ── */}
        <section className={cn(GLASS, 'p-5 mb-4 flex items-center gap-4')}>
          <span className="shrink-0 w-16 h-16 rounded-full grid place-items-center bg-teal-500/10 border border-teal-400/40 shadow-glow-teal">
            {hero.icon}
          </span>
          <div className="min-w-0">
            <h2 className="text-2xl font-extrabold text-white uppercase tracking-wide leading-tight">
              {hero.title}
            </h2>
            <p className="text-sm text-white/60 leading-snug mt-1">{hero.subtitle}</p>
          </div>
        </section>

        {/* ── Segmented pill tabs ── */}
        <div className="flex gap-1 p-1 mb-5 rounded-2xl bg-white/[0.04] border border-white/10">
          {mainTabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'relative flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[13px] font-semibold transition-colors',
                  isActive
                    ? 'bg-teal-500/15 text-teal-200 ring-1 ring-teal-400/40'
                    : 'text-white/55 hover:text-white/80'
                )}
              >
                {tab.icon}
                <span className="truncate">{tab.label}</span>
                {tab.badge && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-danger-500 rounded-full text-[10px] text-white flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="space-y-5">
          {/* ── Rankings Tab ── */}
          {activeTab === 'rankings' && (
            <>
              {/* User weekly stats */}
              {userWeeklyStats && (
                <div className={cn(GLASS, 'p-4')}>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-4">
                    <div className="flex flex-col items-center text-center gap-1">
                      <Trophy size={18} className="text-gold-400" />
                      <p className="text-xl font-extrabold text-white leading-none">
                        {userRank > 0 ? `#${userRank}` : '—'}
                      </p>
                      <p className="text-[11px] text-white/55 font-medium">{t('leaderboard.yourRank')}</p>
                    </div>
                    <div className="flex flex-col items-center text-center gap-1">
                      <Sparkles size={18} className="text-gold-400" />
                      <p className="text-xl font-extrabold text-white leading-none">
                        +{userWeeklyStats.weeklyXPEarned}
                      </p>
                      <p className="text-[11px] text-white/55 font-medium">{t('leaderboard.weeklyXP')}</p>
                      {renderDelta(weeklyComparison?.xpChangePct ?? null)}
                    </div>
                    <div className="flex flex-col items-center text-center gap-1">
                      <Gem size={18} className="text-orange-400" />
                      <p className="text-xl font-extrabold text-white leading-none">
                        {userWeeklyStats.weeklyPointsEarned}
                      </p>
                      <p className="text-[11px] text-white/55 font-medium">{t('leaderboard.weeklyPoints')}</p>
                      {renderDelta(weeklyComparison?.pointsChangePct ?? null)}
                    </div>
                    <div className="flex flex-col items-center text-center gap-1">
                      <Target size={18} className="text-emerald-400" />
                      <p className="text-xl font-extrabold text-white leading-none">
                        {userWeeklyStats.habitsCompleted}
                      </p>
                      <p className="text-[11px] text-white/55 font-medium">{t('leaderboard.habitsCompleted')}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Ranking de Guardianes: header + period toggle + rows */}
              <div className={cn(GLASS, 'overflow-hidden')}>
                <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-white/50">
                      {t('community.ranking.title')}
                    </h3>
                    <p className="text-[11px] text-white/40 mt-0.5 truncate">
                      {rankingPeriod === 'weekly'
                        ? t('community.ranking.subtitleWeekly')
                        : t('community.ranking.subtitleAllTime')}
                    </p>
                  </div>
                  <div className="shrink-0 flex p-0.5 rounded-full bg-white/[0.05] border border-white/10">
                    {(['weekly', 'alltime'] as RankingPeriod[]).map((period) => (
                      <button
                        key={period}
                        type="button"
                        onClick={() => {
                          setRankingPeriod(period);
                          setRankingExpanded(false);
                        }}
                        className={cn(
                          'px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors',
                          rankingPeriod === period
                            ? 'bg-teal-500/20 text-teal-200 ring-1 ring-teal-400/40'
                            : 'text-white/50 hover:text-white/80'
                        )}
                      >
                        {period === 'weekly'
                          ? t('community.ranking.weekly')
                          : t('community.ranking.allTime')}
                      </button>
                    ))}
                  </div>
                </div>

                {isRankingLoading && activeEntries.length === 0 ? (
                  <div className="p-4 space-y-2" aria-hidden="true">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-14 rounded-xl bg-white/[0.04] animate-pulse" />
                    ))}
                  </div>
                ) : activeEntries.length > 0 ? (
                  <>
                    <div className="divide-y divide-white/[0.06]">
                      {topEntries.map(renderRankingEntry)}
                      {ownHiddenEntry && (
                        <>
                          <div className="py-1 text-center text-white/25 text-sm leading-none select-none">
                            ···
                          </div>
                          {renderRankingEntry(ownHiddenEntry)}
                        </>
                      )}
                    </div>
                    {activeEntries.length > RANKING_TOP_N && (
                      <button
                        type="button"
                        onClick={() => setRankingExpanded((v) => !v)}
                        className="w-full py-3 border-t border-white/10 text-teal-300 hover:text-teal-200 text-sm font-semibold transition-colors"
                      >
                        {rankingExpanded
                          ? t('community.ranking.viewLess')
                          : `${t('community.ranking.viewFull')} →`}
                      </button>
                    )}
                  </>
                ) : (
                  <div className="p-12 text-center">
                    <Trophy className="w-16 h-16 text-white/20 mx-auto mb-4" />
                    <p className="text-white/60">{t('leaderboard.notRanked')}</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── Social Tab ── */}
          {activeTab === 'social' && (
            <>
              {/* Social sub-tabs (pills) */}
              <div className="flex gap-1 p-1 rounded-2xl bg-white/[0.04] border border-white/10">
                {(
                  [
                    { key: 'friends', label: `${t('social.tabs.friends')} (${friends.length})` },
                    {
                      key: 'requests',
                      label: t('social.tabs.requests'),
                      badge: pendingRequests.length || undefined,
                    },
                    { key: 'search', label: t('social.tabs.search') },
                  ] as { key: SocialSubTab; label: string; badge?: number }[]
                ).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setSocialSubTab(tab.key)}
                    className={cn(
                      'relative flex-1 py-2 rounded-xl text-[13px] font-semibold transition-colors',
                      socialSubTab === tab.key
                        ? 'bg-teal-500/15 text-teal-200 ring-1 ring-teal-400/40'
                        : 'text-white/55 hover:text-white/80'
                    )}
                  >
                    {tab.label}
                    {tab.badge && (
                      <span className="absolute top-0.5 right-1 min-w-[16px] h-4 px-1 bg-danger-500 rounded-full text-[10px] text-white inline-flex items-center justify-center">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Friends: the showcase overview from the mockup */}
              {socialSubTab === 'friends' && (
                <AlliesOverview
                  friends={friends}
                  leaderboardEntries={weeklyLeaderboard?.entries ?? []}
                  ownWeeklyXP={userWeeklyStats?.weeklyXPEarned ?? 0}
                  ownAvatarUrl={user?.avatarUrl}
                  onAddAlly={() => setSocialSubTab('search')}
                  onRemoveFriend={handleRemoveFriend}
                />
              )}

              {/* Requests */}
              {socialSubTab === 'requests' && (
                <div className="space-y-4">
                  <div className={cn(GLASS, 'p-4')}>
                    <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-white/50 mb-3">
                      {t('social.requestsReceived')}
                    </h3>
                    <div className="space-y-2">
                      {pendingRequests.length === 0 ? (
                        <p className="text-white/50 text-sm py-4 text-center">
                          {t('social.noRequests')}
                        </p>
                      ) : (
                        pendingRequests.map((request) => (
                          <div
                            key={request.friendshipId}
                            className="flex items-center justify-between rounded-xl bg-white/[0.04] border border-white/10 p-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <HubAvatar avatarUrl={request.avatarUrl} username={request.username} size="lg" />
                              <div className="min-w-0">
                                <p className="font-semibold text-white truncate">{request.username}</p>
                                <p className="text-xs text-white/55">
                                  {t('common.level')} {request.level}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleAcceptRequest(request.friendshipId, request.username)}
                              >
                                <Check className="w-4 h-4" />
                                {t('social.acceptRequest')}
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleRejectRequest(request.friendshipId)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className={cn(GLASS, 'p-4')}>
                    <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-white/50 mb-3">
                      {t('social.requestsSent')}
                    </h3>
                    <div className="space-y-2">
                      {sentRequests.length === 0 ? (
                        <p className="text-white/50 text-sm py-4 text-center">
                          {t('social.noRequests')}
                        </p>
                      ) : (
                        sentRequests.map((request) => (
                          <div
                            key={request.friendshipId}
                            className="flex items-center gap-3 rounded-xl bg-white/[0.04] border border-white/10 p-3"
                          >
                            <HubAvatar avatarUrl={request.avatarUrl} username={request.username} />
                            <div className="min-w-0">
                              <p className="font-semibold text-white truncate">{request.username}</p>
                              <p className="text-xs text-white/55">{t('social.requestSent')}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Search */}
              {socialSubTab === 'search' && (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder={t('social.searchPlaceholder')}
                      className="w-full pl-11 pr-4 py-3 bg-white/[0.05] border border-white/10 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div className="space-y-2">
                    {searchResults.length === 0 && searchTerm.length >= 2 ? (
                      <div className={cn(GLASS, 'text-center py-10')}>
                        <Search className="w-12 h-12 text-white/20 mx-auto mb-3" />
                        <p className="text-white/60 text-sm">{t('social.noResults')}</p>
                      </div>
                    ) : (
                      searchResults.map((result) => (
                        <div
                          key={result.id}
                          className="flex items-center justify-between rounded-xl bg-white/[0.04] border border-white/10 p-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <HubAvatar avatarUrl={result.avatarUrl} username={result.username} size="lg" />
                            <div className="min-w-0">
                              <p className="font-semibold text-white truncate">{result.username}</p>
                              <p className="text-xs text-white/55">
                                {t('common.level')} {result.level} ·{' '}
                                {t('social.streakDays', { count: result.currentStreak })}
                              </p>
                            </div>
                          </div>
                          <div className="shrink-0">
                            {result.friendshipStatus === 'none' && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleSendRequest(result.username)}
                              >
                                <UserPlus className="w-4 h-4" />
                                {t('social.addFriend')}
                              </Button>
                            )}
                            {result.friendshipStatus === 'request_sent' && (
                              <span className="px-3 py-1.5 bg-white/10 text-white/70 rounded-lg text-xs font-semibold">
                                {t('social.requestSent')}
                              </span>
                            )}
                            {result.friendshipStatus === 'friends' && (
                              <span className="px-3 py-1.5 bg-emerald-500/15 text-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                                <UserCheck className="w-4 h-4" />
                                {t('social.friends')}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── Streaks Tab ── */}
          {activeTab === 'streaks' && (
            <div className="space-y-5">
              {streak && (
                <>
                  {/* Current Streak */}
                  <div className={cn(GLASS, 'rounded-3xl p-8 text-center relative overflow-hidden')}>
                    <div className="absolute inset-0 bg-gradient-to-br from-gold-400/10 to-gold-500/10" />
                    <div className="relative z-10">
                      <StreakDisplay
                        streak={streak.currentStreak}
                        weeklyStreak={streak.weeklyStreak}
                        lastSevenDays={streak.lastSevenDays}
                        size="lg"
                      />
                      <h2 className="text-2xl font-bold text-white mt-6 mb-2">
                        {t('streaks.current')}
                      </h2>
                      <p className="text-white/70">{t('streaks.onFire')}</p>
                    </div>
                  </div>

                  {/* Best Streak */}
                  <div className={cn(GLASS, 'p-5 flex items-center justify-between')}>
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/50 mb-1">
                        {t('streaks.best')}
                      </div>
                      <div className="text-3xl font-extrabold text-white">
                        {streak.longestStreak} {t('common.days')}
                      </div>
                    </div>
                    <Trophy size={44} className="text-gold-400" />
                  </div>
                </>
              )}

              {/* Achievements */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-white/50">
                    {t('streaks.streakAchievements')}
                  </h2>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 font-semibold">
                      {t('achievements.availableCount', { count: streakAchievements.filter(a => a.unlocked && !a.claimedAt).length })}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-white/[0.06] text-white/60 font-semibold">
                      {streakAchievements.filter(a => a.claimedAt).length} / {streakAchievements.length}
                    </span>
                  </div>
                </div>

                {achievementsLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin w-8 h-8 border-4 border-gold-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-white/70">{t('common.loading')}</p>
                  </div>
                ) : streakAchievements.length > 0 ? (
                  /* Compact relic collection: 2-up tiles breathe better in the
                     480px frame than the full cards (details in the modal). */
                  <div className="grid grid-cols-2 gap-3">
                    {streakAchievements.map((achievement) => (
                      <RelicCard
                        key={achievement.id}
                        achievement={achievement}
                        onClick={() => handleAchievementClick(achievement)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className={cn(GLASS, 'p-12 text-center')}>
                    <Trophy className="w-16 h-16 text-white/20 mx-auto mb-4" />
                    <p className="text-white/70">{t('streaks.noAchievementsAvailable')}</p>
                  </div>
                )}
              </div>

              {/* Motivation */}
              <div className={cn(GLASS, 'p-5 text-center bg-gradient-to-br from-gold-400/10 to-gold-500/10')}>
                <p className="text-white font-semibold">
                  "{t('streaks.motivation')}"
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Achievement Detail Modal */}
      {selectedAchievement && (
        <AchievementDetailModal
          achievement={selectedAchievement}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

export default Leaderboard;
