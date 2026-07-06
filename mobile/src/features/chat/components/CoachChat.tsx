import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertCircle, X, Sparkles } from 'lucide-react-native';
import { ChatBubble } from './ChatBubble';
import { ChatComposer } from './ChatComposer';
import { ChatEmptyState } from './ChatEmptyState';
import { ScrollToBottomButton } from './ScrollToBottomButton';
import { TypingIndicator } from './TypingIndicator';
import { useSmartAutoScroll } from '../hooks/useSmartAutoScroll';
import { HermesService } from '@/services/hermes.service';
import { useLocale } from '@/hooks/useLocale';
import { useUser } from '@/store';
import { CHAT_CONFIG, getHeroBodySrc } from '@/constants';
import { img } from '@/assets/registry';
import type { Message } from '@/types';

interface CoachChatProps {
  /** Called when the user dismisses the coach overlay. */
  onClose: () => void;
}

/**
 * CoachChat — full-screen chat overlay wired to the local Hermes Agent.
 *
 * Opened from the Dashboard's "Coach Personal" quick action. Unlike the
 * generic Chat page (which talks to OpenAI through the global chat store),
 * this keeps its own local conversation state so the Hermes session stays
 * isolated. Streaming arrives via {@link HermesService}, which forwards each
 * message together with a persisted `session_id` so Hermes remembers context.
 *
 * RN port: the web's `fixed inset-0` overlay becomes a react-native `Modal`
 * so it covers the tab bar; the screen is wrapped in a KeyboardAvoidingView
 * so the composer rises above the keyboard.
 */
export function CoachChat({ onClose }: CoachChatProps) {
  const { t, language } = useLocale();
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  // Hermes "speaks" to you wearing the same hero the user picked on the Home.
  const hermesAvatar = getHeroBodySrc(user?.avatarUrl);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { scrollRef, onScroll, onContentSizeChange, showJump, scrollToBottom } =
    useSmartAutoScroll([messages, isLoading]);
  const suggestions = t('chat.suggestions', { returnObjects: true }) as string[];

  const sendMessage = async (text: string) => {
    const userMessage = text.trim();
    if (!userMessage || userMessage.length > CHAT_CONFIG.maxMessageLength || isLoading) return;

    setInput('');
    setError(null);

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };
    const history = [...messages, userMsg];
    setMessages(history);
    setIsLoading(true);

    const assistantId = crypto.randomUUID();
    let accumulated = '';
    let inserted = false;

    try {
      await HermesService.streamChatCompletion(history, (delta: string) => {
        accumulated += delta;
        // Insert the assistant bubble lazily on the first chunk so the typing
        // indicator shows until Hermes actually starts responding.
        if (!inserted) {
          inserted = true;
          setStreamingId(assistantId);
          setMessages((prev) => [
            ...prev,
            { id: assistantId, role: 'assistant', content: accumulated, timestamp: new Date() },
          ]);
        } else {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: accumulated } : m))
          );
        }
      });
    } catch (err) {
      console.error('Error streaming Hermes response:', err);
      setError(t('chat.errors.coachUnavailable'));
    } finally {
      setIsLoading(false);
      setStreamingId(null);
    }
  };

  const showTyping = isLoading && !streamingId;
  const heroSource = hermesAvatar
    ? hermesAvatar.startsWith('/')
      ? img(hermesAvatar)
      : { uri: hermesAvatar }
    : undefined;

  return (
    <Modal visible animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View className="flex-1 bg-background">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <View
            className="w-full max-w-md flex-1 self-center px-4"
            style={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 16 }}
          >
            {/* Header */}
            <View className="mb-4 flex-row items-center gap-3">
              <LinearGradient
                colors={['hsl(38, 95%, 52%)', 'hsl(34, 92%, 46%)']}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  overflow: 'hidden',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {heroSource ? (
                  <Image
                    source={heroSource}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                    contentPosition="top"
                  />
                ) : (
                  <Sparkles size={22} color="#FFFFFF" />
                )}
              </LinearGradient>
              <View className="min-w-0 flex-1">
                <Text
                  className="text-2xl font-extrabold leading-tight tracking-tight text-white"
                  numberOfLines={1}
                >
                  {t('home.personalJournal')}
                </Text>
                <Text className="text-sm font-medium text-white/60" numberOfLines={1}>
                  {t('chat.subtitle')}
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel={t('common.close')}
                className="h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[hsl(var(--glass-bg)/0.65)] active:opacity-80"
              >
                <X size={20} color="#FFFFFF" />
              </Pressable>
            </View>

            {/* Error banner */}
            {error && (
              <View className="mb-4 flex-row items-start gap-2 rounded-xl border border-red-500/50 bg-red-500/20 p-3">
                <AlertCircle size={20} color="#F87171" style={{ marginTop: 2 }} />
                <Text className="flex-1 text-sm text-red-200">{error}</Text>
              </View>
            )}

            {/* Messages */}
            <View className="relative flex-1">
              <ScrollView
                ref={scrollRef}
                onScroll={onScroll}
                onContentSizeChange={onContentSizeChange}
                scrollEventThrottle={16}
                className="flex-1"
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 16 }}
                keyboardShouldPersistTaps="handled"
              >
                {messages.length === 0 && !showTyping ? (
                  <ChatEmptyState
                    accent="gold"
                    avatarSrc={hermesAvatar}
                    title={t('chat.emptyTitle')}
                    subtitle={t('chat.emptySubtitle')}
                    suggestions={suggestions}
                    onSuggestion={sendMessage}
                  />
                ) : (
                  <View accessibilityLabel={t('chat.coachMessagesHeading')} className="flex-1">
                    {messages.map((msg) => (
                      <ChatBubble
                        key={msg.id}
                        message={msg.content}
                        isUser={msg.role === 'user'}
                        accent="gold"
                        avatarSrc={hermesAvatar}
                        copyLabel={t('chat.copy')}
                        copiedLabel={t('chat.copied')}
                        timestamp={new Date(msg.timestamp).toLocaleTimeString(language, {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      />
                    ))}
                    {showTyping && <TypingIndicator accent="gold" avatarSrc={hermesAvatar} />}
                  </View>
                )}
              </ScrollView>
              <ScrollToBottomButton
                show={showJump}
                onClick={scrollToBottom}
                label={t('chat.newMessages')}
                accent="gold"
              />
            </View>

            {/* Input */}
            <View className="pt-2">
              <ChatComposer
                value={input}
                onChange={setInput}
                onSend={() => sendMessage(input)}
                placeholder={t('chat.typeMessage')}
                disabled={!input.trim()}
                isLoading={isLoading}
                accent="gold"
                maxLength={CHAT_CONFIG.maxMessageLength}
                sendLabel={t('chat.send')}
                inputId="coach-input"
                autoFocus
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
