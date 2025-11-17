/**
 * Social Page
 * Friends list, friend requests, and user search
 */

import { useEffect, useState } from 'react';
import { Users, Search, UserPlus, UserCheck, X, Check } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { useSocial } from '@/store';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

type TabType = 'friends' | 'requests' | 'search';

export function Social() {
  const { t } = useLocale();
  const {
    friends,
    pendingRequests,
    sentRequests,
    searchResults,
    isLoading,
    loadFriends,
    loadPendingRequests,
    loadSentRequests,
    searchUsers,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    clearSearchResults,
    clearError,
  } = useSocial();

  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [searchTerm, setSearchTerm] = useState('');

  // Load initial data
  useEffect(() => {
    loadFriends();
    loadPendingRequests();
    loadSentRequests();
  }, [loadFriends, loadPendingRequests, loadSentRequests]);

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

  return (
    <div className="min-h-screen bg-charcoal-900 pt-20 pb-24 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-pale-50 mb-2 flex items-center gap-3">
            <Users className="w-8 h-8 text-teal-400" />
            {t('social.title')}
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-charcoal-700">
          <button
            onClick={() => setActiveTab('friends')}
            className={`px-4 py-3 font-semibold transition-colors ${
              activeTab === 'friends'
                ? 'text-teal-400 border-b-2 border-teal-400'
                : 'text-charcoal-400 hover:text-pale-100'
            }`}
          >
            {t('social.tabs.friends')} ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-3 font-semibold transition-colors relative ${
              activeTab === 'requests'
                ? 'text-teal-400 border-b-2 border-teal-400'
                : 'text-charcoal-400 hover:text-pale-100'
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
            onClick={() => setActiveTab('search')}
            className={`px-4 py-3 font-semibold transition-colors ${
              activeTab === 'search'
                ? 'text-teal-400 border-b-2 border-teal-400'
                : 'text-charcoal-400 hover:text-pale-100'
            }`}
          >
            {t('social.tabs.search')}
          </button>
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          {/* Friends Tab */}
          {activeTab === 'friends' && (
            <div className="space-y-3">
              {friends.length === 0 ? (
                <Card className="text-center py-12">
                  <Users className="w-16 h-16 text-charcoal-600 mx-auto mb-4" />
                  <p className="text-charcoal-300">{t('social.noFriends')}</p>
                </Card>
              ) : (
                friends.map((friend) => (
                  <Card key={friend.userId} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                          <span className="text-lg font-bold text-white">
                            {friend.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-pale-50">@{friend.username}</p>
                          <p className="text-sm text-charcoal-300">
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
                  </Card>
                ))
              )}
            </div>
          )}

          {/* Requests Tab */}
          {activeTab === 'requests' && (
            <div className="space-y-4">
              {/* Received Requests */}
              <div>
                <h3 className="text-lg font-semibold text-pale-50 mb-3">
                  {t('social.requestsReceived')}
                </h3>
                <div className="space-y-3">
                  {pendingRequests.length === 0 ? (
                    <Card className="text-center py-8">
                      <p className="text-charcoal-300">{t('social.noRequests')}</p>
                    </Card>
                  ) : (
                    pendingRequests.map((request) => (
                      <Card key={request.friendshipId} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
                              <span className="text-lg font-bold text-white">
                                {request.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-pale-50">@{request.username}</p>
                              <p className="text-sm text-charcoal-300">
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
                      </Card>
                    ))
                  )}
                </div>
              </div>

              {/* Sent Requests */}
              <div>
                <h3 className="text-lg font-semibold text-pale-50 mb-3">
                  {t('social.requestsSent')}
                </h3>
                <div className="space-y-3">
                  {sentRequests.length === 0 ? (
                    <Card className="text-center py-8">
                      <p className="text-charcoal-300">{t('social.noRequests')}</p>
                    </Card>
                  ) : (
                    sentRequests.map((request) => (
                      <Card key={request.friendshipId} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-charcoal-600 to-charcoal-700 flex items-center justify-center">
                              <span className="text-lg font-bold text-white">
                                {request.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-pale-50">@{request.username}</p>
                              <p className="text-sm text-charcoal-300">{t('social.requestSent')}</p>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Search Tab */}
          {activeTab === 'search' && (
            <div className="space-y-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder={t('social.searchPlaceholder')}
                  className="w-full pl-11 pr-4 py-3 bg-charcoal-800 border border-charcoal-600 rounded-xl text-pale-50 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Search Results */}
              <div className="space-y-3">
                {searchResults.length === 0 && searchTerm.length >= 2 ? (
                  <Card className="text-center py-12">
                    <Search className="w-16 h-16 text-charcoal-600 mx-auto mb-4" />
                    <p className="text-charcoal-300">{t('social.noResults')}</p>
                  </Card>
                ) : (
                  searchResults.map((user) => (
                    <Card key={user.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                            <span className="text-lg font-bold text-white">
                              {user.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-pale-50">@{user.username}</p>
                            <p className="text-sm text-charcoal-300">
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
                          <div className="px-4 py-2 bg-charcoal-700 text-charcoal-300 rounded-lg text-sm">
                            {t('social.requestSent')}
                          </div>
                        )}
                        {user.friendshipStatus === 'friends' && (
                          <div className="px-4 py-2 bg-success-500/20 text-success-400 rounded-lg text-sm flex items-center gap-2">
                            <UserCheck className="w-4 h-4" />
                            {t('social.friends')}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Social;
