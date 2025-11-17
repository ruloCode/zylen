/**
 * Leaderboard Page (Unified Community Hub)
 * Contains Rankings, Social, and Streaks in a tabbed interface
 */

import { useEffect, useState } from 'react';
import {
  Trophy, TrendingUp, Flame, Target, Users, Search,
  UserPlus, UserCheck, X, Check, Award, Zap
} from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { useLeaderboard, useUser, useSocial, useAppStore } from '@/store';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StreakDisplay } from '@/features/streaks/components';
import toast from 'react-hot-toast';

type TabType = 'rankings' | 'social' | 'streaks';
type SocialSubTab = 'friends' | 'requests' | 'search';

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
    isLoading: socialLoading,
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

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('rankings');
  const [socialSubTab, setSocialSubTab] = useState<SocialSubTab>('friends');
  const [searchTerm, setSearchTerm] = useState('');

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

  const handleRemoveFriend = async (friendshipId: string, username: string) => {
    if (confirm(t('social.removeFriend') + ` @${username}?`)) {
      try {
        await removeFriend(friendshipId);
        toast.success(t('social.friendRemoved', { username }));
      } catch (error) {
        toast.error(t('social.errors.removeFriend'));
      }
    }
  };

  // Badges for streaks tab
  const badges = [
    {
      id: 1,
      name: t('streaks.badges.weekWarrior'),
      icon: <Award size={32} />,
      unlocked: true
    },
    {
      id: 2,
      name: t('streaks.badges.consistencyKing'),
      icon: <Trophy size={32} />,
      unlocked: true
    },
    {
      id: 3,
      name: t('streaks.badges.unstoppable'),
      icon: <Zap size={32} />,
      unlocked: false
    }
  ];

  return (
    <div className="min-h-screen pb-24 px-4 pt-8">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Trophy className="w-8 h-8 text-gold-400" />
            {t('leaderboard.title')}
          </h1>
        </div>

        {/* Main Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('rankings')}
            className={`px-4 py-3 font-semibold transition-colors ${
              activeTab === 'rankings'
                ? 'text-gold-600 border-b-2 border-gold-600'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              {t('leaderboard.tabs.rankings')}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('social')}
            className={`px-4 py-3 font-semibold transition-colors relative ${
              activeTab === 'social'
                ? 'text-teal-600 border-b-2 border-teal-600'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              {t('leaderboard.tabs.social')}
              {pendingRequests.length > 0 && (
                <span className="w-5 h-5 bg-danger-500 rounded-full text-xs text-white flex items-center justify-center">
                  {pendingRequests.length}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('streaks')}
            className={`px-4 py-3 font-semibold transition-colors ${
              activeTab === 'streaks'
                ? 'text-gold-600 border-b-2 border-gold-600'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5" />
              {t('leaderboard.tabs.streaks')}
            </div>
          </button>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Rankings Tab */}
          {activeTab === 'rankings' && (
            <>
              {/* User Stats Card */}
              {userWeeklyStats && (
                <div className="glass-card p-6 mb-6 bg-gradient-to-br from-teal-500/10 to-gold-500/10 border-teal-500/20">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Trophy className="w-5 h-5 text-gold-500" />
                        <p className="text-sm text-gray-600">{t('leaderboard.yourRank')}</p>
                      </div>
                      <p className="text-2xl font-bold text-gold-600">
                        {userRank > 0 ? `#${userRank}` : '-'}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <TrendingUp className="w-5 h-5 text-teal-500" />
                        <p className="text-sm text-gray-600">{t('leaderboard.weeklyXP')}</p>
                      </div>
                      <p className="text-2xl font-bold text-teal-600">
                        {userWeeklyStats.weeklyXPEarned}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Flame className="w-5 h-5 text-gold-500" />
                        <p className="text-sm text-gray-600">{t('leaderboard.weeklyPoints')}</p>
                      </div>
                      <p className="text-2xl font-bold text-gold-600">
                        {userWeeklyStats.weeklyPointsEarned}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Target className="w-5 h-5 text-success-500" />
                        <p className="text-sm text-gray-600">{t('leaderboard.habitsCompleted')}</p>
                      </div>
                      <p className="text-2xl font-bold text-success-600">
                        {userWeeklyStats.habitsCompleted}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Leaderboard Table */}
              <div className="glass-card overflow-hidden">
                <div className="bg-white/60 p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {t('leaderboard.topPlayers')}
                  </h2>
                </div>

                {leaderboardLoading ? (
                  <div className="p-12 text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">{t('common.loading')}</p>
                  </div>
                ) : weeklyLeaderboard && weeklyLeaderboard.entries.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {weeklyLeaderboard.entries.map((entry) => {
                      const medal = getMedal(entry.rank);
                      const isCurrentUser = entry.isCurrentUser;

                      return (
                        <div
                          key={entry.userId}
                          className={`p-4 transition-colors ${
                            isCurrentUser
                              ? 'bg-teal-50 border-l-4 border-teal-500'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            {/* Rank & User */}
                            <div className="flex items-center gap-4 flex-1">
                              <div className="w-12 text-center">
                                {medal ? (
                                  <span className="text-3xl">{medal}</span>
                                ) : (
                                  <span className="text-xl font-bold text-gray-400">
                                    #{entry.rank}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                                  <span className="text-sm font-bold text-white">
                                    {entry.username.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">
                                    @{entry.username}
                                    {isCurrentUser && (
                                      <span className="ml-2 text-xs text-teal-600">
                                        ({t('leaderboard.you')})
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {t('common.level')} {entry.level}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Stats */}
                            <div className="hidden md:flex items-center gap-6">
                              <div className="text-right">
                                <p className="text-sm text-gray-500">{t('leaderboard.weeklyXP')}</p>
                                <p className="font-semibold text-teal-600">{entry.weeklyXPEarned}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-500">{t('leaderboard.weeklyPoints')}</p>
                                <p className="font-semibold text-gold-600">{entry.weeklyPointsEarned}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-500">{t('leaderboard.habitsCompleted')}</p>
                                <p className="font-semibold text-success-600">{entry.habitsCompleted}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">{t('leaderboard.notRanked')}</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Social Tab */}
          {activeTab === 'social' && (
            <>
              {/* Social Sub-Tabs */}
              <div className="flex gap-2 mb-6 border-b border-gray-200">
                <button
                  onClick={() => setSocialSubTab('friends')}
                  className={`px-4 py-3 font-semibold transition-colors ${
                    socialSubTab === 'friends'
                      ? 'text-teal-600 border-b-2 border-teal-600'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {t('social.tabs.friends')} ({friends.length})
                </button>
                <button
                  onClick={() => setSocialSubTab('requests')}
                  className={`px-4 py-3 font-semibold transition-colors relative ${
                    socialSubTab === 'requests'
                      ? 'text-teal-600 border-b-2 border-teal-600'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {t('social.tabs.requests')}
                  {pendingRequests.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger-500 rounded-full text-xs text-white flex items-center justify-center">
                      {pendingRequests.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setSocialSubTab('search')}
                  className={`px-4 py-3 font-semibold transition-colors ${
                    socialSubTab === 'search'
                      ? 'text-teal-600 border-b-2 border-teal-600'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {t('social.tabs.search')}
                </button>
              </div>

              {/* Social Sub-Tab Content */}
              <div className="space-y-4">
                {/* Friends Sub-Tab */}
                {socialSubTab === 'friends' && (
                  <div className="space-y-3">
                    {friends.length === 0 ? (
                      <div className="glass-card text-center py-12">
                        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600">{t('social.noFriends')}</p>
                      </div>
                    ) : (
                      friends.map((friend) => (
                        <div key={friend.userId} className="glass-card p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                                <span className="text-lg font-bold text-white">
                                  {friend.username.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">@{friend.username}</p>
                                <p className="text-sm text-gray-600">
                                  {t('common.level')} {friend.level} • {friend.currentStreak} {t('streaks.current')}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleRemoveFriend(friend.friendshipId!, friend.username)}
                            >
                              {t('social.removeFriend')}
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Requests Sub-Tab */}
                {socialSubTab === 'requests' && (
                  <div className="space-y-4">
                    {/* Received Requests */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        {t('social.requestsReceived')}
                      </h3>
                      <div className="space-y-3">
                        {pendingRequests.length === 0 ? (
                          <div className="glass-card text-center py-8">
                            <p className="text-gray-600">{t('social.noRequests')}</p>
                          </div>
                        ) : (
                          pendingRequests.map((request) => (
                            <div key={request.friendshipId} className="glass-card p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
                                    <span className="text-lg font-bold text-white">
                                      {request.username.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-900">@{request.username}</p>
                                    <p className="text-sm text-gray-600">
                                      {t('common.level')} {request.level}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
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
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Sent Requests */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        {t('social.requestsSent')}
                      </h3>
                      <div className="space-y-3">
                        {sentRequests.length === 0 ? (
                          <div className="glass-card text-center py-8">
                            <p className="text-gray-600">{t('social.noRequests')}</p>
                          </div>
                        ) : (
                          sentRequests.map((request) => (
                            <div key={request.friendshipId} className="glass-card p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                                    <span className="text-lg font-bold text-white">
                                      {request.username.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-900">@{request.username}</p>
                                    <p className="text-sm text-gray-600">{t('social.requestSent')}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Search Sub-Tab */}
                {socialSubTab === 'search' && (
                  <div className="space-y-4">
                    {/* Search Input */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder={t('social.searchPlaceholder')}
                        className="w-full pl-11 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    {/* Search Results */}
                    <div className="space-y-3">
                      {searchResults.length === 0 && searchTerm.length >= 2 ? (
                        <div className="glass-card text-center py-12">
                          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-600">{t('social.noResults')}</p>
                        </div>
                      ) : (
                        searchResults.map((user) => (
                          <div key={user.id} className="glass-card p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                                  <span className="text-lg font-bold text-white">
                                    {user.username.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">@{user.username}</p>
                                  <p className="text-sm text-gray-600">
                                    {t('common.level')} {user.level} • {user.currentStreak} {t('streaks.current')}
                                  </p>
                                </div>
                              </div>
                              {user.friendshipStatus === 'none' && (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleSendRequest(user.username)}
                                >
                                  <UserPlus className="w-4 h-4" />
                                  {t('social.addFriend')}
                                </Button>
                              )}
                              {user.friendshipStatus === 'request_sent' && (
                                <div className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm">
                                  {t('social.requestSent')}
                                </div>
                              )}
                              {user.friendshipStatus === 'friends' && (
                                <div className="px-4 py-2 bg-success-50 text-success-600 rounded-lg text-sm flex items-center gap-2">
                                  <UserCheck className="w-4 h-4" />
                                  {t('social.friends')}
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Streaks Tab */}
          {activeTab === 'streaks' && (
            <div className="space-y-6">
              {streak && (
                <>
                  {/* Current Streak */}
                  <div className="glass-card rounded-3xl p-8 text-center relative overflow-hidden border border-gold-200/40">
                    <div className="absolute inset-0 bg-gradient-to-br from-gold-400/10 to-gold-500/10" />
                    <div className="relative z-10">
                      <StreakDisplay
                        streak={streak.currentStreak}
                        weeklyStreak={streak.weeklyStreak}
                        lastSevenDays={streak.lastSevenDays}
                        size="lg"
                      />
                      <h2 className="text-2xl font-bold text-gray-900 mt-6 mb-2">
                        {t('streaks.current')}
                      </h2>
                      <p className="text-gray-600">{t('streaks.onFire')}</p>
                    </div>
                  </div>

                  {/* Best Streak */}
                  <div className="glass-card p-6 flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">{t('streaks.best')}</div>
                      <div className="text-3xl font-bold text-gray-900">
                        {streak.longestStreak} {t('common.days')}
                      </div>
                    </div>
                    <Trophy size={48} className="text-gold-500" />
                  </div>
                </>
              )}

              {/* Badges */}
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">{t('streaks.achievements')}</h2>
                <div className="grid grid-cols-3 gap-4">
                  {badges.map(badge => (
                    <div
                      key={badge.id}
                      className={`glass-card p-4 text-center transition-all ${
                        badge.unlocked ? 'scale-100' : 'opacity-50 grayscale'
                      }`}
                    >
                      <div className={`${badge.unlocked ? 'text-gold-500' : 'text-gray-400'} mb-2 flex justify-center`}>
                        {badge.icon}
                      </div>
                      <p className="text-xs font-semibold text-gray-900">
                        {badge.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Motivation */}
              <div className="glass-card p-6 text-center bg-gradient-to-br from-gold-400/10 to-gold-500/10 border-gold-500/20">
                <p className="text-gray-900 font-semibold">
                  "{t('streaks.motivation')}"
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Leaderboard;
