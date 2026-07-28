/**
 * GuardianProfileSheet
 *
 * Bottom-sheet detail for any user tapped in the ranking (weekly or
 * all-time): avatar with level-progress ring, presence, lifetime stats,
 * mutual allies, and the friendship action (add / sent / accept / allies).
 * Data comes from v_user_public_profile + get_mutual_friends_count; the
 * friendship state is derived from the already-loaded social slice lists.
 *
 * RN port: the web's fixed-overlay sheet becomes a transparent Modal
 * anchored to the bottom (same recipe as the habits/focus sheets).
 */

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Ban,
  Check,
  Flag,
  Flame,
  Gem,
  MessageCircle,
  Sparkles,
  Swords,
  Trophy,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react-native';
import toast from '@/lib/toast';
import { FEATURES } from '@/constants/config';
import { formatRelativeShort } from '@/utils/date';
import { getLevelProgress } from '@/utils/xp';
import { useLocale } from '@/hooks/useLocale';
import { useMessages, useSocial, useUser } from '@/store';
import * as SocialService from '@/services/supabase/social.service';
import * as ModerationService from '@/services/supabase/moderation.service';
import { img } from '@/assets/registry';
import type { PublicUserProfile } from '@/types/user';
import { ProgressRing } from './ProgressRing';
import { ReportSheet } from './ReportSheet';

interface GuardianProfileSheetProps {
  username: string;
  onClose: () => void;
  /** Tras bloquear (p.ej. AllyChat navega fuera del DM del bloqueado). */
  onBlocked?: () => void;
}

const ACTIVE_NOW_MS = 10 * 60 * 1000;

type FriendshipState = 'self' | 'friends' | 'request_sent' | 'request_received' | 'none';

/** Web `from-teal-500/20 to-teal-700/10` avatar backdrop */
const AVATAR_GRADIENT = ['rgba(20,184,166,0.2)', 'rgba(15,118,110,0.1)'] as const;
const TEAL_GRADIENT = ['#2dd4bf', '#0d9488'] as const; // from-teal-400 to-teal-600
const GOLD_GRADIENT = ['hsl(40, 95%, 58%)', 'hsl(34, 92%, 46%)'] as const; // from-gold-400 to-gold-600

const avatarSource = (url?: string) =>
  url ? (url.startsWith('/') ? img(url) : { uri: url }) : undefined;

export function GuardianProfileSheet({ username, onClose, onBlocked }: GuardianProfileSheetProps) {
  const { t, language } = useLocale();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useUser();
  const { openDm } = useMessages();
  const {
    friends,
    pendingRequests,
    sentRequests,
    sendFriendRequest,
    acceptFriendRequest,
    loadFriends,
    loadPendingRequests,
    loadSentRequests,
  } = useSocial();

  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [mutualCount, setMutualCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

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

  const handleArenaInvite = async () => {
    if (actionBusy || !profile) return;
    setActionBusy(true);
    try {
      const result = await SocialService.inviteToArena(profile.id);
      if (result.success) {
        toast.success(t('social.arenaInviteSent', { username: profile.username }));
      } else if (result.error === 'already_invited') {
        toast(t('social.arenaInviteAlready'));
      } else {
        toast.error(t('social.errors.arenaInvite'));
      }
    } catch {
      toast.error(t('social.errors.arenaInvite'));
    } finally {
      setActionBusy(false);
    }
  };

  // Chatear: abre (o crea) el DM y navega. El sheet se cierra antes de
  // navegar para que el back no lo re-muestre encima del chat.
  const handleChat = async () => {
    if (actionBusy || !profile) return;
    setActionBusy(true);
    try {
      const conversationId = await openDm(profile.id);
      onClose();
      router.push(`/messages/${conversationId}`);
    } catch {
      toast.error(t('messages.openError'));
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

  // Bloquear: confirmación nativa → RPC (rompe la alianza en el servidor) →
  // refrescar aliados/solicitudes y cerrar el sheet. Feedback de error por
  // Alert (nativo, se ve sobre el Modal); el de éxito por toast tras cerrar.
  const handleBlock = () => {
    if (!profile) return;
    Alert.alert(
      t('moderation.blockConfirmTitle', { username: profile.username }),
      t('moderation.blockConfirmBody'),
      [
        { text: t('actions.cancel'), style: 'cancel' },
        {
          text: t('moderation.blockUser'),
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await ModerationService.blockUser(profile.id);
                await Promise.all([
                  loadFriends(),
                  loadPendingRequests(),
                  loadSentRequests(),
                ]).catch(() => undefined);
                onClose();
                toast.success(t('moderation.blocked', { username: profile.username }));
                onBlocked?.();
              } catch {
                Alert.alert(t('moderation.blockError'));
              }
            })();
          },
        },
      ]
    );
  };

  const progress = profile ? getLevelProgress(profile.totalXPEarned, profile.level) : null;

  const statTiles = profile
    ? [
        {
          key: 'level',
          icon: <Trophy size={15} color="hsl(40, 95%, 58%)" />,
          value: String(profile.level),
          label: t('common.level'),
        },
        {
          key: 'flame',
          icon: <Flame size={15} color="#fb923c" />,
          value: t('social.hub.daysValue', { count: profile.currentStreak }),
          label: t('community.profile.currentFlame'),
        },
        {
          key: 'best',
          icon: <Flame size={15} color="#fdba74" />,
          value: t('social.hub.daysValue', { count: profile.longestStreak }),
          label: t('community.profile.bestFlame'),
        },
        {
          key: 'light',
          icon: <Sparkles size={15} color="#5eead4" />,
          value: profile.totalXPEarned.toLocaleString(language),
          label: t('community.profile.totalLight'),
        },
        {
          key: 'essence',
          icon: <Gem size={15} color="#fb923c" />,
          value: profile.points.toLocaleString(language),
          label: t('community.ranking.essence'),
        },
        {
          key: 'mutual',
          icon: <Users size={15} color="#5eead4" />,
          value: mutualCount === null || state === 'self' ? '—' : String(mutualCount),
          label: t('community.profile.mutualAllies'),
        },
      ]
    : [];

  return (
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/60">
        {/* Backdrop press closes the sheet */}
        <Pressable
          onPress={onClose}
          style={StyleSheet.absoluteFill}
          accessibilityLabel={t('actions.close')}
        />
        <View
          className="w-full overflow-hidden rounded-t-3xl border border-white/10 bg-charcoal-500"
          style={{ maxHeight: '92%' }}
          accessibilityViewIsModal
          accessibilityLabel={t('community.profile.title')}
        >
          {/* Handle + close */}
          <View className="items-center pb-1 pt-3">
            <View className="h-1 w-10 rounded-full bg-white/20" />
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('actions.close')}
            className="absolute right-4 top-4 z-20 h-9 w-9 items-center justify-center rounded-xl bg-black/40 active:bg-black/60"
          >
            <X size={20} color="rgba(255,255,255,0.8)" />
          </Pressable>

          {loading ? (
            <View className="items-center py-16" style={{ paddingBottom: insets.bottom + 64 }}>
              <ActivityIndicator size="large" color="#2dd4bf" />
            </View>
          ) : !profile ? (
            <View
              className="items-center px-6 py-16"
              style={{ paddingBottom: insets.bottom + 64 }}
            >
              <Users size={48} color="rgba(255,255,255,0.2)" />
              <Text className="mt-3 text-center text-sm text-white/60">
                {t('social.noResults')}
              </Text>
            </View>
          ) : (
            <ScrollView
              className="px-5 pt-2"
              contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
            >
              {/* Identity */}
              <View className="items-center">
                <View className="relative">
                  <ProgressRing percentage={progress?.percentage ?? 0} size={104} strokeWidth={4}>
                    <LinearGradient
                      colors={AVATAR_GRADIENT}
                      style={{
                        width: 86,
                        height: 86,
                        borderRadius: 43,
                        overflow: 'hidden',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {profile.avatarUrl ? (
                        <Image
                          source={avatarSource(profile.avatarUrl)}
                          accessibilityLabel={profile.username}
                          contentFit="cover"
                          contentPosition="top"
                          style={{ width: '100%', height: '100%' }}
                        />
                      ) : (
                        <Text className="text-2xl font-bold text-white">
                          {profile.username.charAt(0).toUpperCase()}
                        </Text>
                      )}
                    </LinearGradient>
                  </ProgressRing>
                  <View pointerEvents="none" className="absolute -bottom-1 left-0 right-0 items-center">
                    <View className="rounded-full border border-teal-400/40 bg-background px-2 py-0.5">
                      <Text className="text-[10px] font-bold text-teal-300">
                        {progress?.percentage ?? 0}%
                      </Text>
                    </View>
                  </View>
                </View>

                <Text className="mt-3 text-center text-lg font-extrabold leading-tight text-white">
                  @{profile.username}
                  {state === 'self' && (
                    <Text className="text-[10px] font-bold text-teal-300">
                      {'  '}{t('leaderboard.you')}
                    </Text>
                  )}
                </Text>

                {/* Presence */}
                {activeNow ? (
                  <Text className="mt-0.5 text-xs font-semibold text-emerald-400">
                    ● {t('community.allies.activeNow')}
                  </Text>
                ) : profile.lastActiveAt ? (
                  <Text className="mt-0.5 text-xs text-white/45">
                    {formatRelativeShort(profile.lastActiveAt, language) ||
                      t('community.activity.justNow')}
                  </Text>
                ) : null}

                <Text className="mt-1 text-[11px] text-white/40">
                  {t('community.profile.guardianSince', {
                    date: profile.createdAt.toLocaleDateString(language, {
                      month: 'long',
                      year: 'numeric',
                    }),
                  })}
                </Text>
              </View>

              {/* Stats */}
              <View className="mt-5 flex-row flex-wrap gap-2">
                {statTiles.map((stat) => (
                  <View
                    key={stat.key}
                    className="min-w-[30%] flex-1 items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-2.5"
                  >
                    <View className="h-4 items-center justify-center">{stat.icon}</View>
                    <Text className="text-sm font-extrabold leading-none text-white">
                      {stat.value}
                    </Text>
                    <Text className="text-center text-[10px] font-medium leading-tight text-white/50">
                      {stat.label}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Friendship action */}
              {state !== 'self' && (
                <View className="mt-5">
                  {state === 'none' && (
                    <Pressable
                      disabled={actionBusy}
                      onPress={handleAdd}
                      accessibilityRole="button"
                      className={`overflow-hidden rounded-2xl active:scale-[0.98] ${
                        actionBusy ? 'opacity-50' : ''
                      }`}
                    >
                      <LinearGradient
                        colors={TEAL_GRADIENT}
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
                        {actionBusy ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <UserPlus size={16} color="#FFFFFF" />
                        )}
                        <Text className="text-sm font-bold text-white">
                          {t('community.profile.addAlly')}
                        </Text>
                      </LinearGradient>
                    </Pressable>
                  )}
                  {state === 'request_sent' && (
                    <View className="w-full flex-row items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] py-3">
                      <Check size={16} color="rgba(255,255,255,0.6)" />
                      <Text className="text-sm font-bold text-white/60">
                        {t('social.requestSent')}
                      </Text>
                    </View>
                  )}
                  {state === 'request_received' && (
                    <Pressable
                      disabled={actionBusy}
                      onPress={handleAccept}
                      accessibilityRole="button"
                      className={`overflow-hidden rounded-2xl active:scale-[0.98] ${
                        actionBusy ? 'opacity-50' : ''
                      }`}
                    >
                      <LinearGradient
                        colors={GOLD_GRADIENT}
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
                        {actionBusy ? (
                          <ActivityIndicator size="small" color="#1c1917" />
                        ) : (
                          <UserCheck size={16} color="#1c1917" />
                        )}
                        <Text className="text-sm font-bold text-charcoal-900">
                          {t('community.profile.acceptRequest')}
                        </Text>
                      </LinearGradient>
                    </Pressable>
                  )}
                  {state === 'friends' && (
                    <>
                      <View className="w-full flex-row items-center justify-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500/15 py-3">
                        <UserCheck size={16} color="#6ee7b7" />
                        <Text className="text-sm font-bold text-emerald-300">
                          {t('social.friends')}
                        </Text>
                      </View>
                      <Pressable
                        disabled={actionBusy}
                        onPress={() => void handleChat()}
                        accessibilityRole="button"
                        className={`mt-2 w-full overflow-hidden rounded-2xl active:scale-[0.98] ${
                          actionBusy ? 'opacity-50' : ''
                        }`}
                      >
                        <LinearGradient
                          colors={TEAL_GRADIENT}
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
                          {actionBusy ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <MessageCircle size={16} color="#FFFFFF" />
                          )}
                          <Text className="text-sm font-bold text-white">
                            {t('messages.chatAction')}
                          </Text>
                        </LinearGradient>
                      </Pressable>
                      {FEATURES.enableArena && (
                        <Pressable
                          disabled={actionBusy}
                          onPress={() => void handleArenaInvite()}
                          accessibilityRole="button"
                          className={`mt-2 w-full flex-row items-center justify-center gap-2 rounded-2xl border border-amber-400/40 bg-amber-500/10 py-3 active:bg-amber-500/20 ${
                            actionBusy ? 'opacity-50' : ''
                          }`}
                        >
                          {actionBusy ? (
                            <ActivityIndicator size="small" color="#fbbf24" />
                          ) : (
                            <Swords size={16} color="#fbbf24" />
                          )}
                          <Text className="text-sm font-bold text-amber-300">
                            {t('social.arenaInviteAction')}
                          </Text>
                        </Pressable>
                      )}
                    </>
                  )}
                </View>
              )}

              {/* Moderación: denunciar / bloquear (cualquier perfil ajeno) */}
              {state !== 'self' && (
                <View className="mt-4 flex-row justify-center gap-6 border-t border-white/10 pt-3">
                  <Pressable
                    onPress={() => setReportOpen(true)}
                    accessibilityRole="button"
                    hitSlop={8}
                    className="min-h-[44px] flex-row items-center gap-1.5 px-2 active:opacity-70"
                  >
                    <Flag size={13} color="rgba(255,255,255,0.45)" />
                    <Text className="text-xs font-semibold text-white/45">
                      {t('moderation.reportUser')}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleBlock}
                    accessibilityRole="button"
                    hitSlop={8}
                    className="min-h-[44px] flex-row items-center gap-1.5 px-2 active:opacity-70"
                  >
                    <Ban size={13} color="rgba(248,113,113,0.6)" />
                    <Text className="text-xs font-semibold text-red-400/70">
                      {t('moderation.blockUser')}
                    </Text>
                  </Pressable>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>

      {/* Sheet de denuncia (encima del perfil) */}
      {reportOpen && profile && (
        <ReportSheet
          title={t('moderation.reportUserTitle', { username: profile.username })}
          onClose={() => setReportOpen(false)}
          onSubmit={(reason, details) =>
            ModerationService.reportContent({
              reportedUserId: profile.id,
              contentType: 'profile',
              reason,
              details,
            }).then(() => undefined)
          }
        />
      )}
    </Modal>
  );
}

export default GuardianProfileSheet;
