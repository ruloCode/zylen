/**
 * AlliesOverview
 *
 * Showcase view for the "Aliados" tab of the community hub. Every number
 * shown is real:
 *
 *   - Stats row: get_ally_stats() (ally count, active today, shared Luz this
 *     week, best flame in the circle), with client-side derived fallbacks
 *     while the RPC loads.
 *   - Allies rail: AllyCard per friend (level-progress ring + presence).
 *   - Recent activity: real get_friend_activity feed (habit completions,
 *     level ups, streak milestones, mission completions).
 *   - Shared missions: real catalog with join + daily check-in.
 *
 * RN port of web src/features/social/components/AlliesOverview.tsx:
 * glass sections → GlassCard, uppercase section titles → SectionLabel,
 * allies rail → horizontal ScrollView (the screen owns vertical scroll).
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Activity,
  Camera,
  Flame,
  MessageCircle,
  Sparkles,
  Target,
  UserMinus,
  UserPlus,
  Users,
  X,
} from 'lucide-react-native';
import toast from '@/lib/toast';
import { cn } from '@/utils';
import { formatRelativeShort } from '@/utils/date';
import { useLocale } from '@/hooks/useLocale';
import { useSignedPhotos } from '@/hooks/useSignedPhotos';
import { useCommunity, useMessages } from '@/store';
import { GlassCard, SectionLabel } from '@/components/ui';
import { img } from '@/assets/registry';
import type { FriendProfile, LeaderboardEntry } from '@/types/social';
import type { ActivityEvent } from '@/types/community';
import { AllyCard } from './AllyCard';
import { MissionCard } from './MissionCard';
import { PhotoPostCard } from './PhotoPostCard';
import { ProgressPostComposer } from './ProgressPostComposer';

interface AlliesOverviewProps {
  friends: FriendProfile[];
  /** Weekly leaderboard entries, used for derived fallbacks while RPCs load. */
  leaderboardEntries: LeaderboardEntry[];
  /** Own weekly XP (Luz) earned, from userWeeklyStats. */
  ownWeeklyXP: number;
  ownAvatarUrl?: string;
  onAddAlly: () => void;
  onRemoveFriend: (friendshipId: string, username: string) => void;
  /** Abre el detalle del aliado (GuardianProfileSheet), que vive en la pantalla. */
  onOpenProfile?: (username: string) => void;
}

const ACTIVITY_PREVIEW = 5;

/** Web `from-teal-500/20 to-teal-700/10` avatar backdrop */
const AVATAR_GRADIENT = ['rgba(20,184,166,0.2)', 'rgba(15,118,110,0.1)'] as const;

const avatarSource = (url?: string) =>
  url ? (url.startsWith('/') ? img(url) : { uri: url }) : undefined;

function FeedAvatar({ url, username, size }: { url?: string; username: string; size: number }) {
  return (
    <LinearGradient
      colors={AVATAR_GRADIENT}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {url ? (
        <Image
          source={avatarSource(url)}
          accessibilityLabel={username}
          contentFit="cover"
          contentPosition="top"
          style={{ width: '100%', height: '100%' }}
        />
      ) : (
        <Text className="text-sm font-bold text-white">
          {username.charAt(0).toUpperCase()}
        </Text>
      )}
    </LinearGradient>
  );
}

export function AlliesOverview({
  friends,
  leaderboardEntries,
  ownWeeklyXP,
  ownAvatarUrl,
  onAddAlly,
  onRemoveFriend,
  onOpenProfile,
}: AlliesOverviewProps) {
  const { t, language } = useLocale();
  const router = useRouter();
  const [showAll, setShowAll] = useState(false);
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);

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
    togglePostReaction,
    removeProgressPost,
    verifyPost,
  } = useCommunity();

  const { unreadTotal, loadConversations } = useMessages();

  // Badge de mensajes del hub — refresco barato al montar la pestaña
  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  // Signed URLs de las fotos del feed (bucket privado, lote único)
  const photoUrls = useSignedPhotos(activityFeed.map((e) => e.imagePath));

  const handleVerify = async (postId: string) => {
    try {
      const result = await verifyPost(postId);
      if (result.ok) {
        toast.success(
          t('community.posts.verifiedToast', { xp: result.verifierBonusXP })
        );
      } else if (result.reason === 'already_verified') {
        toast(t('community.posts.alreadyVerified'));
      } else {
        toast.error(t('community.posts.verifyError'));
      }
    } catch {
      toast.error(t('community.posts.verifyError'));
    }
  };

  const confirmDeletePost = (postId: string) => {
    Alert.alert(
      t('community.posts.deleteTitle'),
      t('community.posts.deleteConfirm'),
      [
        { text: t('actions.cancel'), style: 'cancel' },
        {
          text: t('community.posts.delete'),
          style: 'destructive',
          onPress: () => {
            removeProgressPost(postId).catch(() =>
              toast.error(t('community.posts.deleteError'))
            );
          },
        },
      ]
    );
  };

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
      icon: <Users size={18} color="#5eead4" />,
      value: String(totalAllies),
      label: t('social.hub.statAllies'),
    },
    {
      key: 'activeToday',
      // Web renders an animate-ping halo here; decorative, omitted on native.
      icon: <View className="h-3.5 w-3.5 rounded-full bg-emerald-400" />,
      value: String(activeToday),
      label: t('community.allies.activeToday'),
    },
    {
      key: 'luz',
      icon: <Sparkles size={18} color="hsl(40, 95%, 58%)" />,
      value: `+${sharedLuz}`,
      label: t('social.hub.statSharedLight'),
    },
    {
      key: 'streak',
      icon: <Flame size={18} color="#fb923c" />,
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
      case 'progress_photo':
        // Renderizado por PhotoPostCard; texto solo como fallback defensivo
        return t('community.activity.types.progressPhoto');
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
    <View className="gap-5">
      {/* ── Acciones sociales: compartir progreso + mensajes ── */}
      <View className="flex-row items-center gap-2.5">
        <Pressable
          onPress={() => setComposerOpen(true)}
          accessibilityRole="button"
          className="flex-1 overflow-hidden rounded-2xl active:scale-[0.98]"
        >
          <LinearGradient
            colors={['#2dd4bf', '#0d9488']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              paddingVertical: 12,
            }}
          >
            <Camera size={16} color="#FFFFFF" />
            <Text className="text-sm font-bold text-white">
              {t('community.posts.shareCta')}
            </Text>
          </LinearGradient>
        </Pressable>
        <Pressable
          onPress={() => router.push('/messages')}
          accessibilityRole="button"
          accessibilityLabel={t('messages.title')}
          className="h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] active:bg-white/[0.12]"
        >
          <MessageCircle size={18} color="#5eead4" />
          {unreadTotal > 0 && (
            <View className="absolute -right-1 -top-1 h-5 min-w-5 items-center justify-center rounded-full bg-teal-500 px-1">
              <Text className="text-[10px] font-bold text-white">
                {unreadTotal > 99 ? '99+' : unreadTotal}
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* ── Alliance stats ── */}
      <GlassCard className="p-4">
        <View className="flex-row flex-wrap">
          {stats.map((stat) => (
            <View key={stat.key} className="w-1/2 items-center gap-1 py-2">
              <View className="h-5 items-center justify-center">{stat.icon}</View>
              <Text className="text-xl font-extrabold leading-none text-white">
                {stat.value}
              </Text>
              <Text className="text-center text-[11px] font-medium leading-tight text-white/55">
                {stat.label}
              </Text>
            </View>
          ))}
        </View>
      </GlassCard>

      {/* ── Your allies rail ── */}
      <GlassCard className="p-4">
        <View className="mb-3 flex-row items-center justify-between">
          <SectionLabel>{t('social.hub.yourAllies')}</SectionLabel>
          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={onAddAlly}
              hitSlop={10}
              accessibilityRole="button"
              className="flex-row items-center gap-1 active:opacity-90"
            >
              <UserPlus size={14} color="#5eead4" />
              <Text className="text-xs font-semibold text-teal-300">
                {t('social.addFriend')}
              </Text>
            </Pressable>
            {friends.length > 0 && (
              <Pressable
                onPress={() => setShowAll((v) => !v)}
                hitSlop={10}
                accessibilityRole="button"
                className="active:opacity-90"
              >
                <Text className="text-xs font-semibold text-teal-300">
                  {showAll ? t('social.hub.viewLess') : `${t('social.hub.viewAll')} →`}
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        {friends.length === 0 ? (
          <View className="items-center py-8">
            <Users size={48} color="rgba(255,255,255,0.2)" />
            <Text className="mt-3 text-center text-sm text-white/60">
              {t('social.noFriends')}
            </Text>
            <Pressable
              onPress={onAddAlly}
              accessibilityRole="button"
              className="mt-4 flex-row items-center gap-2 rounded-xl bg-teal-500 px-4 py-3 active:scale-[0.975]"
            >
              <UserPlus size={16} color="#FFFFFF" />
              <Text className="text-sm font-semibold text-white">
                {t('social.findFriends')}
              </Text>
            </Pressable>
          </View>
        ) : showAll ? (
          /* Detailed vertical list with management actions */
          <View className="gap-2">
            {friends.map((friend) => (
              <View
                key={friend.userId}
                className="flex-row items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] p-3"
              >
                {/* Tocar la fila abre el detalle; el botón de quitar mantiene
                    su propia área táctil a la derecha. */}
                <Pressable
                  onPress={onOpenProfile ? () => onOpenProfile(friend.username) : undefined}
                  disabled={!onOpenProfile}
                  accessibilityRole={onOpenProfile ? 'button' : undefined}
                  accessibilityLabel={friend.username}
                  className="min-w-0 flex-1 flex-row items-center gap-3 active:opacity-80"
                >
                  <FeedAvatar url={friend.avatarUrl} username={friend.username} size={40} />
                  <View className="min-w-0 flex-1">
                    <Text numberOfLines={1} className="font-semibold text-white">
                      {friend.username}
                    </Text>
                    <Text className="text-xs text-white/55">
                      {t('common.level')} {friend.level} ·{' '}
                      {t('social.streakDays', { count: friend.currentStreak })}
                    </Text>
                  </View>
                </Pressable>
                <Pressable
                  onPress={() =>
                    friend.friendshipId &&
                    onRemoveFriend(friend.friendshipId, friend.username)
                  }
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel={t('social.removeFriend')}
                  className="rounded-lg p-2 active:bg-red-500/10 active:opacity-90"
                >
                  <UserMinus size={16} color="rgba(248,113,113,0.8)" />
                </Pressable>
              </View>
            ))}
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingBottom: 4 }}
          >
            {friends.slice(0, 8).map((friend) => (
              <AllyCard key={friend.userId} ally={friend} onPress={onOpenProfile} />
            ))}
          </ScrollView>
        )}
      </GlassCard>

      <View className="gap-5">
        {/* ── Recent activity (real feed) ── */}
        <GlassCard className="p-4">
          <View className="mb-3 flex-row items-center justify-between">
            <SectionLabel>{t('social.hub.recentActivity')}</SectionLabel>
            {activityFeed.length > ACTIVITY_PREVIEW && (
              <Pressable
                onPress={handleToggleActivity}
                hitSlop={10}
                accessibilityRole="button"
                className="active:opacity-90"
              >
                <Text className="text-xs font-semibold text-teal-300">
                  {showAllActivity
                    ? t('social.hub.viewLess')
                    : `${t('social.hub.viewAll')} →`}
                </Text>
              </Pressable>
            )}
          </View>

          {activityLoading && activityFeed.length === 0 ? (
            <View className="gap-2">
              {[0, 1, 2].map((i) => (
                <View key={i} className="h-12 rounded-xl bg-white/[0.04]" />
              ))}
            </View>
          ) : activityFeed.length === 0 ? (
            <View className="items-center py-6">
              <Activity size={40} color="rgba(255,255,255,0.15)" />
              <Text className="mt-2 text-center text-sm text-white/50">
                {t('social.hub.noActivity')}
              </Text>
            </View>
          ) : (
            <View className="gap-1">
              {visibleActivity.map((event) => {
                // Fotos de progreso: card propia con imagen + reacciones
                if (event.eventType === 'progress_photo' && event.postId) {
                  return (
                    <View key={event.id} className="py-1.5">
                      <PhotoPostCard
                        event={event}
                        imageUrl={event.imagePath ? photoUrls[event.imagePath] : undefined}
                        ownAvatarUrl={ownAvatarUrl}
                        onReact={(postId, kind) => void togglePostReaction(postId, kind)}
                        onDelete={confirmDeletePost}
                        onImagePress={setViewerUrl}
                        onVerify={(postId) => void handleVerify(postId)}
                      />
                    </View>
                  );
                }
                const luz = eventLuz(event);
                const relative = formatRelativeShort(event.createdAt, language);
                return (
                  <View
                    key={event.id}
                    className="flex-row items-center gap-3 rounded-xl px-2 py-2.5"
                  >
                    <FeedAvatar
                      url={event.isCurrentUser ? ownAvatarUrl : event.avatarUrl}
                      username={event.username}
                      size={36}
                    />
                    <View className="min-w-0 flex-1">
                      <Text numberOfLines={1} className="text-sm leading-tight text-white">
                        <Text className="font-bold">
                          {event.isCurrentUser ? t('leaderboard.you') : event.username}
                        </Text>{' '}
                        <Text className="text-white/70">{eventText(event)}</Text>
                      </Text>
                      <Text className="text-[11px] text-white/40">
                        {relative || t('community.activity.justNow')}
                      </Text>
                    </View>
                    {luz !== undefined && (
                      <View className="flex-row items-center gap-1">
                        <Text className="text-sm font-bold text-gold-400">+{luz}</Text>
                        <Sparkles size={12} color="hsl(40, 95%, 58%)" />
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </GlassCard>

        {/* ── Shared missions (real, join + daily check-in) ── */}
        <GlassCard className="p-4">
          <SectionLabel className="mb-3">
            {t('social.hub.sharedMissions')}
          </SectionLabel>

          {missionsLoading && sharedMissions.length === 0 ? (
            <View className="gap-3">
              {[0, 1, 2].map((i) => (
                <View key={i} className="h-20 rounded-xl bg-white/[0.04]" />
              ))}
            </View>
          ) : sharedMissions.length === 0 ? (
            <View className="items-center py-6">
              <Target size={40} color="rgba(255,255,255,0.15)" />
              <Text className="mt-2 text-center text-sm text-white/50">
                {t('social.hub.missionsTeaser')}
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {sharedMissions.map((mission) => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  onJoin={handleJoin}
                  onCheckin={handleCheckin}
                />
              ))}
            </View>
          )}
        </GlassCard>
      </View>

      {/* ── Composer de foto de progreso ── */}
      {composerOpen && <ProgressPostComposer onClose={() => setComposerOpen(false)} />}

      {/* ── Visor de foto a pantalla completa ── */}
      {viewerUrl && (
        <Modal
          transparent
          animationType="fade"
          visible
          onRequestClose={() => setViewerUrl(null)}
        >
          <View className="flex-1 items-center justify-center bg-black/95">
            <Pressable
              onPress={() => setViewerUrl(null)}
              style={StyleSheet.absoluteFill}
              accessibilityLabel={t('actions.close')}
            />
            <Image
              source={{ uri: viewerUrl }}
              contentFit="contain"
              style={{ width: '100%', height: '80%' }}
            />
            <Pressable
              onPress={() => setViewerUrl(null)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t('actions.close')}
              className="absolute right-5 top-14 h-9 w-9 items-center justify-center rounded-full bg-white/10"
            >
              <X size={18} color="#ffffff" />
            </Pressable>
          </View>
        </Modal>
      )}
    </View>
  );
}

export default AlliesOverview;
