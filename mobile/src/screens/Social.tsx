/**
 * Social Screen — React Native port of web src/pages/Social.tsx
 * Friends list, friend requests, and user search.
 * Stack screen: mounts <Header /> at the top.
 */

import React, { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Users, Search, UserPlus, UserCheck, X, Check, UserMinus } from 'lucide-react-native';
import { useLocale } from '@/hooks/useLocale';
import { useSocial } from '@/store';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/layout';
import toast from '@/lib/toast';

type TabType = 'friends' | 'requests' | 'search';

const COLORS = {
  teal400: '#2dd4bf',
  red400: '#F87171',
  success400: '#66CB8F',
  white: '#FFFFFF',
  white30: 'rgba(255,255,255,0.3)',
  white50: 'rgba(255,255,255,0.5)',
};

/** Web gradient avatar circles (from-* to-*) → expo LinearGradient */
const AVATAR_GRADIENTS = {
  teal: ['hsl(172, 58%, 62%)', 'hsl(172, 70%, 42%)'],
  gold: ['hsl(40, 95%, 58%)', 'hsl(34, 92%, 46%)'],
  charcoal: ['hsl(190, 20%, 17%)', 'hsl(190, 16%, 24%)'],
} as const;

function AvatarCircle({
  username,
  variant,
}: {
  username: string;
  variant: keyof typeof AVATAR_GRADIENTS;
}) {
  return (
    <LinearGradient
      colors={AVATAR_GRADIENTS[variant]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text className="text-lg font-bold text-white">
        {username.charAt(0).toUpperCase()}
      </Text>
    </LinearGradient>
  );
}

export function Social() {
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
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

  const tabClass = (tab: TabType) =>
    `px-4 py-3 border-b-2 ${
      activeTab === tab ? 'border-teal-400' : 'border-transparent'
    }`;
  const tabTextClass = (tab: TabType) =>
    `font-semibold ${activeTab === tab ? 'text-teal-400' : 'text-white/60'}`;

  return (
    <View className="flex-1 bg-charcoal-900">
      <Header />
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 8,
          paddingTop: 16,
          paddingBottom: insets.bottom + 96,
        }}
      >
        <View className="w-full max-w-4xl self-center">
          {/* Header */}
          <View className="mb-8">
            <View className="mb-2 flex-row items-center gap-3">
              <Users size={32} color={COLORS.teal400} />
              <Text className="text-3xl font-bold text-white">{t('social.title')}</Text>
            </View>
          </View>

          {/* Tabs */}
          <View className="mb-6 flex-row gap-2 border-b border-charcoal-700">
            <Pressable onPress={() => setActiveTab('friends')} className={tabClass('friends')}>
              <Text className={tabTextClass('friends')}>
                {t('social.tabs.friends')} ({friends.length})
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab('requests')}
              className={`relative ${tabClass('requests')}`}
            >
              <Text className={tabTextClass('requests')}>{t('social.tabs.requests')}</Text>
              {pendingRequests.length > 0 && (
                <View className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full bg-danger-500">
                  <Text className="text-xs text-white">{pendingRequests.length}</Text>
                </View>
              )}
            </Pressable>
            <Pressable onPress={() => setActiveTab('search')} className={tabClass('search')}>
              <Text className={tabTextClass('search')}>{t('social.tabs.search')}</Text>
            </Pressable>
          </View>

          {/* Tab Content */}
          <View className="gap-4">
            {/* Friends Tab */}
            {activeTab === 'friends' && (
              <View className="gap-3">
                {friends.length === 0 ? (
                  <Card className="items-center py-12">
                    <Users size={64} color={COLORS.white30} />
                    <Text className="mt-4 text-center text-white/70">
                      {t('social.noFriends')}
                    </Text>
                  </Card>
                ) : (
                  friends.map((friend) => (
                    <Card key={friend.userId} className="p-4">
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1 flex-row items-center gap-4">
                          <AvatarCircle username={friend.username} variant="teal" />
                          <View className="flex-1">
                            <Text className="font-semibold text-white" numberOfLines={1}>
                              @{friend.username}
                            </Text>
                            <Text className="text-sm text-white/70">
                              {t('common.level')} {friend.level} •{' '}
                              {t('social.streakDays', { count: friend.currentStreak })}
                            </Text>
                          </View>
                        </View>
                        <Pressable
                          onPress={() => handleRemoveFriend(friend.friendshipId!, friend.username)}
                          accessibilityRole="button"
                          accessibilityLabel={t('social.removeFriend')}
                          className="rounded-lg border border-red-400/50 bg-red-500/20 p-2 active:bg-red-500/30"
                        >
                          <UserMinus size={18} color={COLORS.red400} />
                        </Pressable>
                      </View>
                    </Card>
                  ))
                )}
              </View>
            )}

            {/* Requests Tab */}
            {activeTab === 'requests' && (
              <View className="gap-4">
                {/* Received Requests */}
                <View>
                  <Text className="mb-3 text-lg font-semibold text-white">
                    {t('social.requestsReceived')}
                  </Text>
                  <View className="gap-3">
                    {pendingRequests.length === 0 ? (
                      <Card className="items-center py-8">
                        <Text className="text-center text-white/70">{t('social.noRequests')}</Text>
                      </Card>
                    ) : (
                      pendingRequests.map((request) => (
                        <Card key={request.friendshipId} className="p-4">
                          <View className="flex-row items-center justify-between">
                            <View className="flex-1 flex-row items-center gap-4">
                              <AvatarCircle username={request.username} variant="gold" />
                              <View className="flex-1">
                                <Text className="font-semibold text-white" numberOfLines={1}>
                                  @{request.username}
                                </Text>
                                <Text className="text-sm text-white/70">
                                  {t('common.level')} {request.level}
                                </Text>
                              </View>
                            </View>
                            <View className="flex-row gap-2">
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() =>
                                  handleAcceptRequest(request.friendshipId, request.username)
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
                        </Card>
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
                      <Card className="items-center py-8">
                        <Text className="text-center text-white/70">{t('social.noRequests')}</Text>
                      </Card>
                    ) : (
                      sentRequests.map((request) => (
                        <Card key={request.friendshipId} className="p-4">
                          <View className="flex-row items-center justify-between">
                            <View className="flex-1 flex-row items-center gap-4">
                              <AvatarCircle username={request.username} variant="charcoal" />
                              <View className="flex-1">
                                <Text className="font-semibold text-white" numberOfLines={1}>
                                  @{request.username}
                                </Text>
                                <Text className="text-sm text-white/70">
                                  {t('social.requestSent')}
                                </Text>
                              </View>
                            </View>
                          </View>
                        </Card>
                      ))
                    )}
                  </View>
                </View>
              </View>
            )}

            {/* Search Tab */}
            {activeTab === 'search' && (
              <View className="gap-4">
                {/* Search Input */}
                <View className="relative">
                  <View className="absolute bottom-0 left-3 top-0 z-10 justify-center">
                    <Search size={20} color={COLORS.white50} />
                  </View>
                  <TextInput
                    value={searchTerm}
                    onChangeText={handleSearch}
                    placeholder={t('social.searchPlaceholder')}
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    autoCapitalize="none"
                    autoCorrect={false}
                    className="w-full rounded-xl border border-charcoal-600 bg-charcoal-800 py-3 pl-11 pr-4 text-white"
                  />
                </View>

                {/* Search Results */}
                <View className="gap-3">
                  {searchResults.length === 0 && searchTerm.length >= 2 ? (
                    <Card className="items-center py-12">
                      <Search size={64} color={COLORS.white30} />
                      <Text className="mt-4 text-center text-white/70">
                        {t('social.noResults')}
                      </Text>
                    </Card>
                  ) : (
                    searchResults.map((user) => (
                      <Card key={user.id} className="p-4">
                        <View className="flex-row items-center justify-between">
                          <View className="flex-1 flex-row items-center gap-4">
                            <AvatarCircle username={user.username} variant="teal" />
                            <View className="flex-1">
                              <Text className="font-semibold text-white" numberOfLines={1}>
                                @{user.username}
                              </Text>
                              <Text className="text-sm text-white/70">
                                {t('common.level')} {user.level} •{' '}
                                {t('social.streakDays', { count: user.currentStreak })}
                              </Text>
                            </View>
                          </View>
                          {user.friendshipStatus === 'none' && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleSendRequest(user.username)}
                            >
                              <UserPlus size={16} color={COLORS.white} />
                              <Text className="text-sm font-semibold text-primary-foreground">
                                {t('social.addFriend')}
                              </Text>
                            </Button>
                          )}
                          {user.friendshipStatus === 'request_sent' && (
                            <View className="rounded-lg bg-white/10 px-4 py-2">
                              <Text className="text-sm text-white/70">
                                {t('social.requestSent')}
                              </Text>
                            </View>
                          )}
                          {user.friendshipStatus === 'friends' && (
                            <View className="flex-row items-center gap-2 rounded-lg bg-success-500/20 px-4 py-2">
                              <UserCheck size={16} color={COLORS.success400} />
                              <Text className="text-sm text-success-400">
                                {t('social.friends')}
                              </Text>
                            </View>
                          )}
                        </View>
                      </Card>
                    ))
                  )}
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

export default Social;
