/**
 * Leaderboard Screen (Unified Community Hub) — React Native port of web
 * src/pages/Leaderboard.tsx. Rankings, Social, and Streaks in a tabbed UI.
 * Tab screen: mounts <Header /> and leaves room for the tab bar
 * (paddingBottom: 130).
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Trophy, TrendingUp, Flame, Target, Users, Search,
  UserPlus, UserCheck, X, Check,
} from 'lucide-react-native';
import { useLocale } from '@/hooks/useLocale';
import {
  useLeaderboard, useUser, useSocial, useAppStore, useAchievements, useCommunity,
} from '@/store';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui';
import { Header } from '@/components/layout';
import { StreakDisplay } from '@/features/streaks/components';
import { AchievementCard, AchievementDetailModal } from '@/features/achievements/components';
import { AlliesOverview, GuardianProfileSheet } from '@/features/social/components';
import type { AchievementWithProgress } from '@/types/achievement';
import type { LeaderboardEntry } from '@/types/social';
import type { RankingPeriod } from '@/types/community';
import toast from '@/lib/toast';

type TabType = 'rankings' | 'social' | 'streaks';
type SocialSubTab = 'friends' | 'requests' | 'search';

const RANKING_TOP_N = 5;

const COLORS = {
  green500: 'hsl(76, 85%, 52%)',
  teal400: '#2dd4bf',
  teal500: '#14b8a6',
  gold400: '#FAB62E',
  gold500: '#F9A410',
  success500: '#3FBE73',
  red400: '#F87171',
  white: '#FFFFFF',
  white30: 'rgba(255,255,255,0.3)',
  white70: 'rgba(255,255,255,0.7)',
  white90: 'rgba(255,255,255,0.9)',
};

/** Web gradient avatar circles (from-* to-*) → expo LinearGradient */
const AVATAR_GRADIENTS = {
  teal: ['hsl(172, 58%, 62%)', 'hsl(172, 70%, 42%)'],
  gold: ['hsl(40, 95%, 58%)', 'hsl(34, 92%, 46%)'],
  gray: ['#9CA3AF', '#4B5563'],
} as const;

function AvatarCircle({
  username,
  variant,
  size = 48,
}: {
  username: string;
  variant: keyof typeof AVATAR_GRADIENTS;
  size?: number;
}) {
  return (
    <LinearGradient
      colors={AVATAR_GRADIENTS[variant]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text className={size >= 48 ? 'text-lg font-bold text-white' : 'text-sm font-bold text-white'}>
        {username.charAt(0).toUpperCase()}
      </Text>
    </LinearGradient>
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

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('rankings');
  const [socialSubTab, setSocialSubTab] = useState<SocialSubTab>('friends');
  const [searchTerm, setSearchTerm] = useState('');

  // Ranking period + collapse state
  const [rankingPeriod, setRankingPeriod] = useState<RankingPeriod>('weekly');
  const [rankingExpanded, setRankingExpanded] = useState(false);

  // Guardian detail sheet (opened by tapping any ranking row)
  const [profileUsername, setProfileUsername] = useState<string | null>(null);

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
        <Text className="text-[10px] font-semibold leading-tight text-white/40">
          {t('community.stats.newWeek')}
        </Text>
      );
    }
    const up = pct >= 0;
    return (
      <Text
        className={`text-[10px] font-semibold leading-tight ${
          up ? 'text-emerald-400' : 'text-danger-400'
        }`}
      >
        {up ? '▲' : '▼'} {t('community.stats.vsPrevious', { pct: Math.abs(pct) })}
      </Text>
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

  // Countdown to the weekly reset (Monday 00:00 local) — Duolingo-style urgency
  const resetCountdown = useMemo(() => {
    const now = new Date();
    const next = new Date(now);
    const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
    next.setDate(now.getDate() + daysUntilMonday);
    next.setHours(0, 0, 0, 0);
    const ms = next.getTime() - now.getTime();
    const days = Math.floor(ms / 86_400_000);
    const hours = Math.floor((ms % 86_400_000) / 3_600_000);
    return days > 0 ? `${days}d ${hours}h` : `${hours}h`;
  }, []);

  // ── Per-tab context line ──
  const heroByTab: Record<TabType, string> = {
    rankings: t('leaderboard.hub.heroRankings'),
    social: t('leaderboard.hub.heroSocial'),
    streaks: t('leaderboard.hub.heroStreaks'),
  };

  const renderRankingEntry = (entry: LeaderboardEntry, isLast: boolean) => {
    const medal = getMedal(entry.rank);
    const isCurrentUser = entry.isCurrentUser;

    return (
      <Pressable
        key={`${rankingPeriod}-${entry.userId}`}
        onPress={() => setProfileUsername(entry.username)}
        accessibilityRole="button"
        accessibilityLabel={`@${entry.username}`}
        className={`p-4 active:bg-white/[0.05] ${isLast ? '' : 'border-b border-white/10'} ${
          isCurrentUser ? 'border-l-4 border-l-teal-500 bg-teal-500/10' : ''
        }`}
      >
        <View className="flex-row items-center justify-between">
          {/* Rank & User */}
          <View className="flex-1 flex-row items-center gap-4">
            <View className="w-12 items-center">
              {medal ? (
                <Text className="text-3xl">{medal}</Text>
              ) : (
                <Text className="text-xl font-bold text-white/70">#{entry.rank}</Text>
              )}
            </View>
            <View className="flex-1 flex-row items-center gap-3">
              <AvatarCircle username={entry.username} variant="teal" size={40} />
              <View className="flex-1">
                <Text className="font-semibold text-white" numberOfLines={1}>
                  @{entry.username}
                  {isCurrentUser && (
                    <Text className="text-xs text-teal-600">
                      {'  '}({t('leaderboard.you')})
                    </Text>
                  )}
                </Text>
                <Text className="text-sm text-white">
                  {t('common.level')} {entry.level}
                </Text>
              </View>
            </View>
          </View>

          {/* Compact stats — the web hides these behind md:
              breakpoints, but on a phone the ranking is
              meaningless without the weekly XP that sorts it. */}
          <View className="items-end">
            <Text className="text-base font-bold text-teal-300">
              +{entry.weeklyXPEarned} XP
            </Text>
            <Text className="text-xs text-white/60">
              ◆ {entry.weeklyPointsEarned} · ✓ {entry.habitsCompleted}
            </Text>
          </View>
        </View>
      </Pressable>
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

  // window.confirm → Alert.alert
  const handleRemoveFriend = (friendshipId: string, username: string) => {
    Alert.alert(
      t('social.removeFriend'),
      t('social.confirmRemoveFriend', { username }),
      [
        { text: t('actions.cancel'), style: 'cancel' },
        {
          text: t('social.removeFriend'),
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFriend(friendshipId);
              toast.success(t('social.friendRemoved', { username }));
            } catch (error) {
              toast.error(t('social.errors.removeFriend'));
            }
          },
        },
      ]
    );
  };

  // Filter streak achievements and sort by requirement value
  const streakAchievements = achievementsWithProgress
    .filter((a) => a.category === 'streak')
    .sort((a, b) => a.requirementValue - b.requirementValue);

  // Segmented pills (the web's border-b tabs read poorly on a phone: labels
  // were behind sm:/md: breakpoints that never apply on native).
  const mainTabClass = (tab: TabType) =>
    `flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 ${
      activeTab === tab ? 'border-teal-400/70 bg-teal-500/20' : 'border-white/10 bg-white/5'
    }`;

  const subTabClass = (tab: SocialSubTab) =>
    `flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 ${
      socialSubTab === tab ? 'border-teal-400/70 bg-teal-500/20' : 'border-white/10 bg-white/5'
    }`;

  const tabIconColor = (active: boolean) => (active ? COLORS.teal400 : COLORS.white70);
  const tabLabelClass = (active: boolean) =>
    `text-xs font-bold ${active ? 'text-teal-300' : 'text-white/70'}`;

  return (
    <View className="flex-1 bg-background">
      <Header />
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 8,
          paddingTop: 16,
          paddingBottom: 130,
        }}
      >
        <View className="w-full max-w-4xl self-center">
          {/* Header */}
          <View className="mb-8">
            <View className="mb-2 flex-row items-center gap-3">
              <Trophy size={32} color={COLORS.gold400} />
              <Text className="text-[28px] font-extrabold leading-tight tracking-tight text-white">{t('leaderboard.title')}</Text>
            </View>
            {/* Per-tab context line */}
            <Text className="text-sm leading-snug text-white/60">{heroByTab[activeTab]}</Text>
          </View>

          {/* Main Tabs */}
          <View className="mb-6 flex-row gap-2">
            <Pressable onPress={() => setActiveTab('rankings')} className={mainTabClass('rankings')}>
              <Trophy size={17} color={tabIconColor(activeTab === 'rankings')} />
              <Text numberOfLines={1} className={tabLabelClass(activeTab === 'rankings')}>
                {t('leaderboard.tabs.rankings')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab('social')}
              className={`relative ${mainTabClass('social')}`}
            >
              <Users size={17} color={tabIconColor(activeTab === 'social')} />
              <Text numberOfLines={1} className={tabLabelClass(activeTab === 'social')}>
                {t('leaderboard.tabs.social')}
              </Text>
              {pendingRequests.length > 0 && (
                <View className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full bg-danger-500">
                  <Text className="text-[10px] font-bold text-white">{pendingRequests.length}</Text>
                </View>
              )}
            </Pressable>
            <Pressable onPress={() => setActiveTab('streaks')} className={mainTabClass('streaks')}>
              <Flame size={17} color={tabIconColor(activeTab === 'streaks')} />
              <Text numberOfLines={1} className={tabLabelClass(activeTab === 'streaks')}>
                {t('leaderboard.tabs.streaks')}
              </Text>
            </Pressable>
          </View>

          {/* Tab Content */}
          <View className="gap-6">
            {/* Rankings Tab */}
            {activeTab === 'rankings' && (
              <>
                {/* User Stats Card */}
                {userWeeklyStats && (
                  <GlassCard className="mb-6 overflow-hidden border-teal-500/20 p-6">
                    <LinearGradient
                      colors={['rgba(20,184,166,0.10)', 'rgba(249,164,16,0.10)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />
                    <View className="flex-row flex-wrap gap-4">
                      <View className="w-[45%] flex-1 items-center">
                        <View className="mb-2 flex-row items-center justify-center gap-2">
                          <Trophy size={20} color={COLORS.gold500} />
                          <Text className="text-sm text-white">{t('leaderboard.yourRank')}</Text>
                        </View>
                        <Text className="text-2xl font-bold text-white">
                          {userRank > 0 ? `#${userRank}` : '-'}
                        </Text>
                      </View>
                      <View className="w-[45%] flex-1 items-center">
                        <View className="mb-2 flex-row items-center justify-center gap-2">
                          <TrendingUp size={20} color={COLORS.teal500} />
                          <Text className="text-sm text-white">{t('leaderboard.weeklyXP')}</Text>
                        </View>
                        <Text className="text-2xl font-bold text-teal-600">
                          {userWeeklyStats.weeklyXPEarned}
                        </Text>
                        {renderDelta(weeklyComparison?.xpChangePct ?? null)}
                      </View>
                      <View className="w-[45%] flex-1 items-center">
                        <View className="mb-2 flex-row items-center justify-center gap-2">
                          <Flame size={20} color={COLORS.gold500} />
                          <Text className="text-sm text-white">{t('leaderboard.weeklyPoints')}</Text>
                        </View>
                        <Text className="text-2xl font-bold text-white">
                          {userWeeklyStats.weeklyPointsEarned}
                        </Text>
                        {renderDelta(weeklyComparison?.pointsChangePct ?? null)}
                      </View>
                      <View className="w-[45%] flex-1 items-center">
                        <View className="mb-2 flex-row items-center justify-center gap-2">
                          <Target size={20} color={COLORS.success500} />
                          <Text className="text-sm text-white">
                            {t('leaderboard.habitsCompleted')}
                          </Text>
                        </View>
                        <Text className="text-2xl font-bold text-success-600">
                          {userWeeklyStats.habitsCompleted}
                        </Text>
                      </View>
                    </View>
                  </GlassCard>
                )}

                {/* Ranking de Guardianes: header + period toggle + rows */}
                <GlassCard className="overflow-hidden">
                  <View className="flex-row items-center justify-between gap-2 border-b border-white/20 bg-white/5 px-4 py-3">
                    <View className="min-w-0 flex-1">
                      <Text className="text-lg font-semibold text-white">
                        {t('community.ranking.title')}
                      </Text>
                      <Text numberOfLines={1} className="mt-0.5 text-[11px] text-white/40">
                        {rankingPeriod === 'weekly'
                          ? t('community.ranking.resetsIn', { time: resetCountdown })
                          : t('community.ranking.subtitleAllTime')}
                      </Text>
                    </View>
                    <View className="flex-row rounded-full border border-white/10 bg-white/[0.05] p-0.5">
                      {(['weekly', 'alltime'] as RankingPeriod[]).map((period) => (
                        <Pressable
                          key={period}
                          onPress={() => {
                            setRankingPeriod(period);
                            setRankingExpanded(false);
                          }}
                          accessibilityRole="button"
                          className={`rounded-full px-2.5 py-1 active:opacity-80 ${
                            rankingPeriod === period
                              ? 'border border-teal-400/40 bg-teal-500/20'
                              : ''
                          }`}
                        >
                          <Text
                            className={`text-[11px] font-bold ${
                              rankingPeriod === period ? 'text-teal-200' : 'text-white/50'
                            }`}
                          >
                            {period === 'weekly'
                              ? t('community.ranking.weekly')
                              : t('community.ranking.allTime')}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  {isRankingLoading && activeEntries.length === 0 ? (
                    <View className="items-center p-12">
                      <ActivityIndicator size="large" color={COLORS.teal500} />
                      <Text className="mt-4 text-white">{t('common.loading')}</Text>
                    </View>
                  ) : activeEntries.length > 0 ? (
                    <View>
                      {topEntries.map((entry, index) =>
                        renderRankingEntry(
                          entry,
                          index === topEntries.length - 1 && !ownHiddenEntry
                        )
                      )}
                      {ownHiddenEntry && (
                        <>
                          <Text className="border-b border-white/10 py-1 text-center text-sm leading-none text-white/25">
                            ···
                          </Text>
                          {renderRankingEntry(ownHiddenEntry, true)}
                        </>
                      )}
                      {activeEntries.length > RANKING_TOP_N && (
                        <Pressable
                          onPress={() => setRankingExpanded((v) => !v)}
                          accessibilityRole="button"
                          className="w-full border-t border-white/10 py-3 active:bg-white/[0.05]"
                        >
                          <Text className="text-center text-sm font-semibold text-teal-300">
                            {rankingExpanded
                              ? t('community.ranking.viewLess')
                              : `${t('community.ranking.viewFull')} →`}
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  ) : (
                    <View className="items-center p-12">
                      <Trophy size={64} color={COLORS.white30} />
                      <Text className="mt-4 text-center text-white">
                        {t('leaderboard.notRanked')}
                      </Text>
                    </View>
                  )}
                </GlassCard>
              </>
            )}

            {/* Social Tab */}
            {activeTab === 'social' && (
              <>
                {/* Social Sub-Tabs */}
                <View className="mb-6 flex-row gap-2">
                  <Pressable
                    onPress={() => setSocialSubTab('friends')}
                    className={subTabClass('friends')}
                  >
                    <Users size={16} color={tabIconColor(socialSubTab === 'friends')} />
                    <Text numberOfLines={1} className={tabLabelClass(socialSubTab === 'friends')}>
                      {t('social.friends')} ({friends.length})
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setSocialSubTab('requests')}
                    className={`relative ${subTabClass('requests')}`}
                  >
                    <UserPlus size={16} color={tabIconColor(socialSubTab === 'requests')} />
                    <Text numberOfLines={1} className={tabLabelClass(socialSubTab === 'requests')}>
                      {t('social.requests')}
                    </Text>
                    {pendingRequests.length > 0 && (
                      <View className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full bg-danger-500">
                        <Text className="text-[10px] font-bold text-white">
                          {pendingRequests.length}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                  <Pressable
                    onPress={() => setSocialSubTab('search')}
                    className={subTabClass('search')}
                  >
                    <Search size={16} color={tabIconColor(socialSubTab === 'search')} />
                    <Text numberOfLines={1} className={tabLabelClass(socialSubTab === 'search')}>
                      {t('social.search')}
                    </Text>
                  </Pressable>
                </View>

                {/* Social Sub-Tab Content */}
                <View className="gap-4">
                  {/* Friends Sub-Tab: the showcase overview (stats + allies
                      rail + activity feed + shared missions), like the web */}
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

                  {/* Requests Sub-Tab */}
                  {socialSubTab === 'requests' && (
                    <View className="gap-4">
                      {/* Received Requests */}
                      <View>
                        <Text className="mb-3 text-lg font-semibold text-white">
                          {t('social.requestsReceived')}
                        </Text>
                        <View className="gap-3">
                          {pendingRequests.length === 0 ? (
                            <GlassCard className="items-center py-8">
                              <Text className="text-center text-white">
                                {t('social.noRequests')}
                              </Text>
                            </GlassCard>
                          ) : (
                            pendingRequests.map((request) => (
                              <GlassCard key={request.friendshipId} className="p-4">
                                <View className="flex-row items-center justify-between">
                                  <View className="flex-1 flex-row items-center gap-4">
                                    <AvatarCircle username={request.username} variant="gold" />
                                    <View className="flex-1">
                                      <Text
                                        className="font-semibold text-white"
                                        numberOfLines={1}
                                      >
                                        @{request.username}
                                      </Text>
                                      <Text className="text-sm text-white">
                                        {t('common.level')} {request.level}
                                      </Text>
                                    </View>
                                  </View>
                                  <View className="flex-row gap-2">
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      onClick={() =>
                                        handleAcceptRequest(
                                          request.friendshipId,
                                          request.username
                                        )
                                      }
                                    >
                                      <Check size={16} color={COLORS.white} />
                                      <Text className="text-sm font-semibold text-primary-foreground">
                                        {t('social.acceptRequest')}
                                      </Text>
                                    </Button>
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={() => handleRejectRequest(request.friendshipId)}
                                    >
                                      <X size={16} color={COLORS.white} />
                                    </Button>
                                  </View>
                                </View>
                              </GlassCard>
                            ))
                          )}
                        </View>
                      </View>

                      {/* Sent Requests */}
                      <View>
                        <Text className="mb-3 text-lg font-semibold text-white">
                          {t('social.requestsSent')}
                        </Text>
                        <View className="gap-3">
                          {sentRequests.length === 0 ? (
                            <GlassCard className="items-center py-8">
                              <Text className="text-center text-white">
                                {t('social.noRequests')}
                              </Text>
                            </GlassCard>
                          ) : (
                            sentRequests.map((request) => (
                              <GlassCard key={request.friendshipId} className="p-4">
                                <View className="flex-row items-center justify-between">
                                  <View className="flex-1 flex-row items-center gap-4">
                                    <AvatarCircle username={request.username} variant="gray" />
                                    <View className="flex-1">
                                      <Text
                                        className="font-semibold text-white"
                                        numberOfLines={1}
                                      >
                                        @{request.username}
                                      </Text>
                                      <Text className="text-sm text-white">
                                        {t('social.requestSent')}
                                      </Text>
                                    </View>
                                  </View>
                                </View>
                              </GlassCard>
                            ))
                          )}
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Search Sub-Tab */}
                  {socialSubTab === 'search' && (
                    <View className="gap-4">
                      {/* Search Input */}
                      <View className="relative">
                        <View className="absolute bottom-0 left-3 top-0 z-10 justify-center">
                          <Search size={20} color={COLORS.white70} />
                        </View>
                        <TextInput
                          value={searchTerm}
                          onChangeText={handleSearch}
                          placeholder={t('social.searchPlaceholder')}
                          placeholderTextColor="rgba(255,255,255,0.5)"
                          autoCapitalize="none"
                          autoCorrect={false}
                          className="w-full rounded-xl border border-white/20 bg-white/5 py-3 pl-11 pr-4 text-white"
                        />
                      </View>

                      {/* Search Results */}
                      <View className="gap-3">
                        {searchResults.length === 0 && searchTerm.length >= 2 ? (
                          <GlassCard className="items-center py-12">
                            <Search size={64} color={COLORS.white30} />
                            <Text className="mt-4 text-center text-white">
                              {t('social.noResults')}
                            </Text>
                          </GlassCard>
                        ) : (
                          searchResults.map((result) => (
                            <GlassCard key={result.id} className="p-4">
                              <View className="flex-row items-center justify-between">
                                <View className="flex-1 flex-row items-center gap-4">
                                  <AvatarCircle username={result.username} variant="teal" />
                                  <View className="flex-1">
                                    <Text className="font-semibold text-white" numberOfLines={1}>
                                      @{result.username}
                                    </Text>
                                    <Text className="text-sm text-white">
                                      {t('common.level')} {result.level} •{' '}
                                      {t('social.streakDays', { count: result.currentStreak })}
                                    </Text>
                                  </View>
                                </View>
                                {result.friendshipStatus === 'none' && (
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handleSendRequest(result.username)}
                                  >
                                    <UserPlus size={16} color={COLORS.white} />
                                    <Text className="text-sm font-semibold text-primary-foreground">
                                      {t('social.addFriend')}
                                    </Text>
                                  </Button>
                                )}
                                {result.friendshipStatus === 'request_sent' && (
                                  <View className="rounded-lg bg-white/10 px-4 py-2">
                                    <Text className="text-sm text-white">
                                      {t('social.requestSent')}
                                    </Text>
                                  </View>
                                )}
                                {result.friendshipStatus === 'friends' && (
                                  <View className="flex-row items-center gap-2 rounded-lg bg-success-500/20 px-4 py-2">
                                    <UserCheck size={16} color={COLORS.white} />
                                    <Text className="text-sm text-white">
                                      {t('social.friends')}
                                    </Text>
                                  </View>
                                )}
                              </View>
                            </GlassCard>
                          ))
                        )}
                      </View>
                    </View>
                  )}
                </View>
              </>
            )}

            {/* Streaks Tab */}
            {activeTab === 'streaks' && (
              <View className="gap-6">
                {streak && (
                  <>
                    {/* Current Streak */}
                    <GlassCard className="relative overflow-hidden rounded-3xl border-gold-200/40 p-8">
                      <LinearGradient
                        colors={['rgba(250,182,46,0.10)', 'rgba(249,164,16,0.10)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                      />
                      <View className="relative z-10 items-center">
                        <StreakDisplay
                          streak={streak.currentStreak}
                          weeklyStreak={streak.weeklyStreak}
                          lastSevenDays={streak.lastSevenDays}
                          size="lg"
                        />
                        <Text className="mb-2 mt-6 text-center text-2xl font-bold text-white">
                          {t('streaks.current')}
                        </Text>
                        <Text className="text-center text-white">{t('streaks.onFire')}</Text>
                      </View>
                    </GlassCard>

                    {/* Best Streak */}
                    <GlassCard className="flex-row items-center justify-between p-6">
                      <View>
                        <Text className="mb-1 text-sm text-white">{t('streaks.best')}</Text>
                        <Text className="text-3xl font-bold text-white">
                          {streak.longestStreak} {t('common.days')}
                        </Text>
                      </View>
                      <Trophy size={48} color={COLORS.gold500} />
                    </GlassCard>
                  </>
                )}

                {/* Achievements */}
                <View className="mb-6">
                  <View className="mb-6 flex-row items-center justify-between gap-3">
                    <Text className="flex-1 text-2xl font-bold text-white">
                      {t('streaks.streakAchievements')}
                    </Text>
                    <View className="flex-row items-center gap-3">
                      <View className="rounded-full bg-green-600/20 px-3 py-1">
                        <Text className="text-sm font-medium text-green-400">
                          {t('achievements.availableCount', {
                            count: streakAchievements.filter((a) => a.unlocked && !a.claimedAt)
                              .length,
                          })}
                        </Text>
                      </View>
                      <View className="rounded-full bg-white/10 px-3 py-1">
                        <Text className="text-sm font-medium text-white/70">
                          {streakAchievements.filter((a) => a.claimedAt).length} /{' '}
                          {streakAchievements.length}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {achievementsLoading ? (
                    <View className="items-center py-12">
                      <ActivityIndicator size="large" color={COLORS.gold500} />
                      <Text className="mt-4 text-white/70">{t('common.loading')}</Text>
                    </View>
                  ) : streakAchievements.length > 0 ? (
                    <View className="gap-4">
                      {streakAchievements.map((achievement) => (
                        <AchievementCard
                          key={achievement.id}
                          achievement={achievement}
                          onClick={() => handleAchievementClick(achievement)}
                        />
                      ))}
                    </View>
                  ) : (
                    <GlassCard className="items-center p-12">
                      <Trophy size={64} color={COLORS.white30} />
                      <Text className="mt-4 text-center text-white/70">
                        {t('streaks.noAchievementsAvailable')}
                      </Text>
                    </GlassCard>
                  )}
                </View>

                {/* Motivation */}
                <GlassCard className="items-center overflow-hidden border-gold-500/20 p-6">
                  <LinearGradient
                    colors={['rgba(250,182,46,0.10)', 'rgba(249,164,16,0.10)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <Text className="text-center font-semibold text-white">
                    "{t('streaks.motivation')}"
                  </Text>
                </GlassCard>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Achievement Detail Modal */}
      {selectedAchievement && (
        <AchievementDetailModal
          achievement={selectedAchievement}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}

      {/* Guardian detail (tapped from the ranking) */}
      {profileUsername && (
        <GuardianProfileSheet
          username={profileUsername}
          onClose={() => setProfileUsername(null)}
        />
      )}
    </View>
  );
}

export default Leaderboard;
