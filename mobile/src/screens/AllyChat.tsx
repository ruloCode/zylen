/**
 * AllyChat — conversación 1:1 con un aliado (/messages/[conversationId]).
 *
 * Mensajería real sobre Supabase: historial por RPC (get_messages), envío
 * optimista (send_message), entrega en vivo por Realtime SOLO mientras la
 * pantalla está montada, y delta-refetch al volver de background para cubrir
 * huecos del socket. Mientras la conversación está enfocada, sus push de
 * chat no muestran banner (setActiveChatConversation).
 *
 * Fotos: se eligen con expo-image-picker, se comprimen y suben al bucket
 * privado antes del RPC; para mostrarlas se firman URLs (useSignedPhotos).
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Camera, X } from 'lucide-react-native';
import toast from '@/lib/toast';
import { useLocale } from '@/hooks/useLocale';
import { useSignedPhotos } from '@/hooks/useSignedPhotos';
import { useMessages, useUser } from '@/store';
import {
  ChatBubble,
  ChatComposer,
  ScrollToBottomButton,
} from '@/features/chat/components';
import { useSmartAutoScroll } from '@/features/chat/hooks/useSmartAutoScroll';
import { GuardianProfileSheet } from '@/features/social/components';
import { subscribeToConversation } from '@/services/supabase/chat.service';
import { setActiveChatConversation } from '@/services/notifications.service';
import { img } from '@/assets/registry';

const glass = 'rounded-2xl border border-white/10 bg-[hsl(var(--glass-bg)/0.65)]';
const ACTIVE_NOW_MS = 5 * 60 * 1000;
const AVATAR_GRADIENT = ['rgba(20,184,166,0.2)', 'rgba(15,118,110,0.1)'] as const;
const MAX_MESSAGE_LENGTH = 2000;

const avatarSource = (url?: string) =>
  url ? (url.startsWith('/') ? img(url) : { uri: url }) : undefined;

export function AllyChat() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, language } = useLocale();
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const { user } = useUser();
  const {
    conversations,
    messagesByConversation,
    messagesLoading,
    loadConversations,
    loadMessages,
    refreshConversation,
    sendAllyMessage,
    receiveRealtimeMessage,
    markConversationRead,
  } = useMessages();

  const [input, setInput] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);

  const conversation = conversations.find((c) => c.conversationId === conversationId);
  const messages = useMemo(
    () => (conversationId ? (messagesByConversation[conversationId] ?? []) : []),
    [messagesByConversation, conversationId]
  );

  // Cold start desde una push: la lista aún no está cargada
  useEffect(() => {
    if (!conversation && user) void loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Historial + realtime + marcar leído, atados al montaje de la pantalla
  useEffect(() => {
    if (!conversationId || !user) return undefined;
    void loadMessages(conversationId);
    void markConversationRead(conversationId);
    const unsubscribe = subscribeToConversation(conversationId, (message) => {
      receiveRealtimeMessage(message);
      if (message.senderId !== user.id) void markConversationRead(conversationId);
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, user?.id]);

  // Con la pantalla enfocada, las push de ESTA conversación no muestran banner
  useFocusEffect(
    useCallback(() => {
      if (conversationId) setActiveChatConversation(conversationId);
      return () => setActiveChatConversation(null);
    }, [conversationId])
  );

  // Huecos del socket (background, reconexión) → delta-refetch al volver
  useEffect(() => {
    if (!conversationId) return undefined;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refreshConversation(conversationId);
    });
    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  const { scrollRef, onScroll, onContentSizeChange, showJump, scrollToBottom } =
    useSmartAutoScroll([messages]);

  // Signed URLs para los mensajes con foto
  const photoUrls = useSignedPhotos(messages.map((m) => m.imagePath));

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });
    const uri = result.assets?.[0]?.uri;
    if (!result.canceled && uri) setPhotoUri(uri);
  };

  const handleSend = async () => {
    const body = input.trim();
    if ((!body && !photoUri) || !conversationId || sending) return;
    setInput('');
    const photo = photoUri ?? undefined;
    setPhotoUri(null);
    setSending(true);
    try {
      await sendAllyMessage(conversationId, body, photo);
    } catch (error) {
      toast.error(
        error instanceof Error && error.message === 'not_allies'
          ? t('messages.notAllies')
          : t('messages.sendError')
      );
    } finally {
      setSending(false);
    }
  };

  const username = conversation?.otherUsername ?? '';
  const activeNow =
    !!conversation?.otherLastActiveAt &&
    Date.now() - conversation.otherLastActiveAt.getTime() < ACTIVE_NOW_MS;

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 12 }}>
      {/* Header: back + aliado (tap → perfil) */}
      <View className="mb-2 flex-row items-center gap-3 px-4 pb-2">
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.push('/messages'))}
          accessibilityRole="button"
          accessibilityLabel={t('actions.back')}
          className={`h-9 w-9 shrink-0 items-center justify-center rounded-full ${glass}`}
        >
          <ArrowLeft size={18} color="#ffffff" />
        </Pressable>
        <Pressable
          onPress={() => username && setProfileOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={username ? `@${username}` : t('messages.title')}
          className="min-w-0 flex-1 flex-row items-center gap-2.5 active:opacity-80"
        >
          <LinearGradient
            colors={AVATAR_GRADIENT}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              overflow: 'hidden',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {conversation?.otherAvatarUrl ? (
              <Image
                source={avatarSource(conversation.otherAvatarUrl)}
                accessibilityLabel={username}
                contentFit="cover"
                contentPosition="top"
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <Text className="text-base font-bold text-white">
                {(username || '?').charAt(0).toUpperCase()}
              </Text>
            )}
          </LinearGradient>
          <View className="min-w-0 flex-1">
            <Text numberOfLines={1} className="text-base font-extrabold text-white">
              {username ? `@${username}` : '…'}
            </Text>
            {activeNow ? (
              <Text className="text-[11px] font-semibold text-emerald-400">
                ● {t('community.allies.activeNow')}
              </Text>
            ) : conversation?.otherLastActiveAt ? (
              <Text className="text-[11px] text-white/45">
                {new Date(conversation.otherLastActiveAt).toLocaleDateString(language, {
                  day: 'numeric',
                  month: 'short',
                })}
              </Text>
            ) : null}
          </View>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 px-4" style={{ paddingBottom: insets.bottom + 12 }}>
          {/* Mensajes */}
          <View className="relative flex-1">
            <ScrollView
              ref={scrollRef}
              onScroll={onScroll}
              onContentSizeChange={onContentSizeChange}
              scrollEventThrottle={16}
              className="flex-1"
              contentContainerStyle={{ flexGrow: 1, paddingBottom: 12, paddingTop: 8 }}
              keyboardShouldPersistTaps="handled"
            >
              {messagesLoading && messages.length === 0 ? (
                <View className="flex-1 items-center justify-center py-16">
                  <ActivityIndicator size="large" color="#2dd4bf" />
                </View>
              ) : messages.length === 0 ? (
                <View className="flex-1 items-center justify-center px-6 py-16">
                  <Text className="text-center text-sm leading-relaxed text-white/55">
                    {t('messages.emptyConversation', { username: username || '...' })}
                  </Text>
                </View>
              ) : (
                messages.map((message) => {
                  const isUser = message.senderId === user?.id;
                  const imageUrl = message.imagePath
                    ? photoUrls[message.imagePath]
                    : undefined;
                  return (
                    <ChatBubble
                      key={message.id}
                      message={message.body}
                      isUser={isUser}
                      plain
                      accent="teal"
                      avatarSrc={!isUser ? conversation?.otherAvatarUrl : undefined}
                      imageUrl={imageUrl}
                      imageCacheKey={message.imagePath}
                      onImagePress={imageUrl ? () => setViewerUrl(imageUrl) : undefined}
                      status={message.status}
                      failedLabel={t('messages.failed')}
                      timestamp={message.createdAt.toLocaleTimeString(language, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    />
                  );
                })
              )}
            </ScrollView>
            <ScrollToBottomButton
              show={showJump}
              onClick={scrollToBottom}
              label={t('chat.newMessages')}
              accent="teal"
            />
          </View>

          {/* Preview de la foto elegida */}
          {photoUri && (
            <View className="mb-2 mt-1 flex-row items-center gap-2">
              <View className="overflow-hidden rounded-xl border border-white/15">
                <Image source={{ uri: photoUri }} style={{ width: 64, height: 64 }} contentFit="cover" />
              </View>
              <Pressable
                onPress={() => setPhotoUri(null)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t('actions.close')}
                className="h-7 w-7 items-center justify-center rounded-full bg-white/10 active:bg-white/20"
              >
                <X size={14} color="rgba(255,255,255,0.8)" />
              </Pressable>
            </View>
          )}

          {/* Composer */}
          <View className="pt-2">
            <ChatComposer
              value={input}
              onChange={setInput}
              onSend={() => void handleSend()}
              placeholder={t('messages.typeMessage')}
              disabled={!input.trim() && !photoUri}
              isLoading={sending}
              accent="teal"
              maxLength={MAX_MESSAGE_LENGTH}
              sendLabel={t('chat.send')}
              leftAccessory={
                <Pressable
                  onPress={() => void pickPhoto()}
                  accessibilityRole="button"
                  accessibilityLabel={t('messages.attachPhoto')}
                  className="h-12 w-12 items-center justify-center rounded-2xl bg-white/10 active:bg-white/20"
                >
                  <Camera size={20} color="rgba(255,255,255,0.8)" />
                </Pressable>
              }
            />
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Visor de foto a pantalla completa */}
      {viewerUrl && (
        <Modal transparent animationType="fade" visible onRequestClose={() => setViewerUrl(null)}>
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
              className="absolute right-5 h-9 w-9 items-center justify-center rounded-full bg-white/10"
              style={{ top: insets.top + 8 }}
            >
              <X size={18} color="#ffffff" />
            </Pressable>
          </View>
        </Modal>
      )}

      {/* Perfil del aliado */}
      {profileOpen && username && (
        <GuardianProfileSheet username={username} onClose={() => setProfileOpen(false)} />
      )}
    </View>
  );
}
