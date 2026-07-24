/**
 * Messages — lista de conversaciones con aliados.
 *
 * Stack screen (/messages). Cada fila: avatar + presencia, nombre, snippet
 * del último mensaje (📷 para fotos) y badge de no leídos. Se refresca al
 * enfocar la pantalla y con pull-to-refresh; el orden lo da el backend
 * (get_conversations, por last_message_at).
 */

import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, MessageCircle } from 'lucide-react-native';
import { useLocale } from '@/hooks/useLocale';
import { useMessages, useUser } from '@/store';
import { formatRelativeShort } from '@/utils/date';
import { img } from '@/assets/registry';
import type { Conversation } from '@/types/allyChat';

const glass = 'rounded-2xl border border-white/10 bg-[hsl(var(--glass-bg)/0.65)]';
const ACTIVE_NOW_MS = 5 * 60 * 1000;
const AVATAR_GRADIENT = ['rgba(20,184,166,0.2)', 'rgba(15,118,110,0.1)'] as const;

const avatarSource = (url?: string) =>
  url ? (url.startsWith('/') ? img(url) : { uri: url }) : undefined;

function ConversationRow({
  conversation,
  onPress,
}: {
  conversation: Conversation;
  onPress: () => void;
}) {
  const { t, language } = useLocale();
  const username = conversation.otherUsername ?? '???';
  const activeNow =
    !!conversation.otherLastActiveAt &&
    Date.now() - conversation.otherLastActiveAt.getTime() < ACTIVE_NOW_MS;
  const snippet =
    conversation.lastMessageKind === 'image'
      ? `📷 ${t('messages.photo')}`
      : conversation.lastMessageBody || t('messages.sayHi');
  const relative = conversation.lastMessageAt
    ? formatRelativeShort(conversation.lastMessageAt, language)
    : '';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('messages.openChatWith', { username })}
      className={`${glass} flex-row items-center gap-3 p-3 active:bg-white/[0.08]`}
    >
      <View>
        <LinearGradient
          colors={AVATAR_GRADIENT}
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {conversation.otherAvatarUrl ? (
            <Image
              source={avatarSource(conversation.otherAvatarUrl)}
              accessibilityLabel={username}
              contentFit="cover"
              contentPosition="top"
              style={{ width: '100%', height: '100%' }}
            />
          ) : (
            <Text className="text-lg font-bold text-white">
              {username.charAt(0).toUpperCase()}
            </Text>
          )}
        </LinearGradient>
        {activeNow && (
          <View className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background bg-emerald-400" />
        )}
      </View>

      <View className="min-w-0 flex-1">
        <View className="flex-row items-center justify-between gap-2">
          <Text numberOfLines={1} className="flex-1 text-sm font-bold text-white">
            @{username}
          </Text>
          {!!relative && <Text className="text-[11px] text-white/40">{relative}</Text>}
        </View>
        <View className="mt-0.5 flex-row items-center justify-between gap-2">
          <Text
            numberOfLines={1}
            className={`flex-1 text-[12.5px] ${
              conversation.unreadCount > 0 ? 'font-semibold text-white/90' : 'text-white/55'
            }`}
          >
            {snippet}
          </Text>
          {conversation.unreadCount > 0 && (
            <View className="h-5 min-w-5 items-center justify-center rounded-full bg-teal-500 px-1.5">
              <Text className="text-[10px] font-bold text-white">
                {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export function Messages() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLocale();
  const { user } = useUser();
  const { conversations, conversationsLoading, loadConversations } = useMessages();
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (user) void loadConversations();
    }, [user, loadConversations])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  }, [loadConversations]);

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 20 }}>
      {/* Header */}
      <View className="mb-4 flex-row items-center gap-3 px-4">
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.push('/'))}
          accessibilityRole="button"
          accessibilityLabel={t('actions.back')}
          className={`h-9 w-9 shrink-0 items-center justify-center rounded-full ${glass}`}
        >
          <ArrowLeft size={18} color="#ffffff" />
        </Pressable>
        <View className="min-w-0 flex-1">
          <Text className="text-xl font-extrabold leading-tight text-white">
            {t('messages.title')}
          </Text>
          <Text className="text-xs text-white/60">{t('messages.subtitle')}</Text>
        </View>
      </View>

      {conversationsLoading && conversations.length === 0 ? (
        <View className="items-center py-16">
          <ActivityIndicator size="large" color="#2dd4bf" />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.conversationId}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 32,
            gap: 8,
            flexGrow: 1,
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2dd4bf" />
          }
          renderItem={({ item }) => (
            <ConversationRow
              conversation={item}
              onPress={() => router.push(`/messages/${item.conversationId}`)}
            />
          )}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center px-8 py-16">
              <MessageCircle size={48} color="rgba(255,255,255,0.2)" />
              <Text className="mt-4 text-center text-base font-bold text-white">
                {t('messages.emptyTitle')}
              </Text>
              <Text className="mt-1.5 text-center text-sm leading-relaxed text-white/55">
                {t('messages.emptySubtitle')}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
