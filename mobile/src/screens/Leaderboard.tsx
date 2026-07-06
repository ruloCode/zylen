/**
 * Leaderboard Screen (Unified Community Hub) — React Native port of web
 * src/pages/Leaderboard.tsx. Rankings, Social, and Streaks in a tabbed UI.
 * Tab screen: mounts <Header /> and leaves room for the tab bar
 * (paddingBottom: 130).
 */

import React, { useEffect, useState } from 'react';
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
  UserPlus, UserCheck, X, Check, UserMinus,
} from 'lucide-react-native';
import { useLocale } from '@/hooks/useLocale';
import { useLeaderboard, useUser, useSocial, useAppStore, useAchievements } from '@/store';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui';
import { Header } from '@/components/layout';
import { StreakDisplay } from '@/features/streaks/components';
import { AchievementCard, AchievementDetailModal } from '@/features/achievements/components';
import type { AchievementWithProgress } from '@/types/achievement';
import toast from '@/lib/toast';

type TabType = 'rankings' | 'social' | 'streaks';
type SocialSubTab = 'friends' | 'requests' | 'search';

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
    isLoading: leaderboardLoading,
    loadWeeklyLeaderboard,
    loadUserWeeklyStats,
  } = useLeaderboard();

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
    }
  }, [user?.id, loadWeeklyLeaderboard, loadUserWeeklyStats]);

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
              <Text className="text-3xl font-bold text-white">{t('leaderboard.title')}</Text>
            </View>
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
                      </View>
                      <View className="w-[45%] flex-1 items-center">
                        <View className="mb-2 flex-row items-center justify-center gap-2">
                          <Flame size={20} color={COLORS.gold500} />
                          <Text className="text-sm text-white">{t('leaderboard.weeklyPoints')}</Text>
                        </View>
                        <Text className="text-2xl font-bold text-white">
                          {userWeeklyStats.weeklyPointsEarned}
                        </Text>
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

                {/* Leaderboard Table */}
                <GlassCard className="overflow-hidden">
                  <View className="border-b border-white/20 bg-white/5 p-4">
                    <Text className="text-lg font-semibold text-white">
                      {t('leaderboard.topPlayers')}
                    </Text>
                  </View>

                  {leaderboardLoading ? (
                    <View className="items-center p-12">
                      <ActivityIndicator size="large" color={COLORS.teal500} />
                      <Text className="mt-4 text-white">{t('common.loading')}</Text>
                    </View>
                  ) : weeklyLeaderboard && weeklyLeaderboard.entries.length > 0 ? (
                    <View>
                      {weeklyLeaderboard.entries.map((entry, index) => {
                        const medal = getMedal(entry.rank);
                        const isCurrentUser = entry.isCurrentUser;
                        const isLast = index === weeklyLeaderboard.entries.length - 1;

                        return (
                          <View
                            key={entry.userId}
                            className={`p-4 ${isLast ? '' : 'border-b border-white/10'} ${
                              isCurrentUser
                                ? 'border-l-4 border-l-teal-500 bg-teal-500/10'
                                : ''
                            }`}
                          >
                            <View className="flex-row items-center justify-between">
                              {/* Rank & User */}
                              <View className="flex-1 flex-row items-center gap-4">
                                <View className="w-12 items-center">
                                  {medal ? (
                                    <Text className="text-3xl">{medal}</Text>
                                  ) : (
                                    <Text className="text-xl font-bold text-white/70">
                                      #{entry.rank}
                                    </Text>
                                  )}
                                </View>
                                <View className="flex-1 flex-row items-center gap-3">
                                  <AvatarCircle
                                    username={entry.username}
                                    variant="teal"
                                    size={40}
                                  />
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
                          </View>
                        );
                      })}
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
                  {/* Friends Sub-Tab */}
                  {socialSubTab === 'friends' && (
                    <View className="gap-3">
                      {friends.length === 0 ? (
                        <GlassCard className="items-center py-12">
                          <Users size={64} color={COLORS.white30} />
                          <Text className="mt-4 text-center text-white">
                            {t('social.noFriends')}
                          </Text>
                        </GlassCard>
                      ) : (
                        friends.map((friend) => (
                          <GlassCard key={friend.userId} className="p-4">
                            <View className="flex-row items-center justify-between">
                              <View className="flex-1 flex-row items-center gap-4">
                                <AvatarCircle username={friend.username} variant="teal" />
                                <View className="flex-1">
                                  <Text className="font-semibold text-white" numberOfLines={1}>
                                    @{friend.username}
                                  </Text>
                                  <Text className="text-sm text-white">
                                    {t('common.level')} {friend.level} •{' '}
                                    {t('social.streakDays', { count: friend.currentStreak })}
                                  </Text>
                                </View>
                              </View>
                              <Pressable
                                onPress={() =>
                                  handleRemoveFriend(friend.friendshipId!, friend.username)
                                }
                                accessibilityRole="button"
                                accessibilityLabel={t('social.removeFriend')}
                                className="rounded-lg border border-red-400/50 bg-red-500/20 p-2 active:bg-red-500/30"
                              >
                                <UserMinus size={18} color={COLORS.red400} />
                              </Pressable>
                            </View>
                          </GlassCard>
                        ))
                      )}
                    </View>
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
    </View>
  );
}

export default Leaderboard;
