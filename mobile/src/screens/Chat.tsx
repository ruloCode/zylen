import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertCircle } from 'lucide-react-native';
import {
  ChatBubble,
  ChatComposer,
  ChatEmptyState,
  ScrollToBottomButton,
  TypingIndicator,
} from '@/features/chat/components';
import { useSmartAutoScroll } from '@/features/chat/hooks/useSmartAutoScroll';
import { Header } from '@/components/layout';
import { useAppStore } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import { CHAT_CONFIG } from '@/constants';
import { OpenAIService } from '@/services/openai.service';
import type { Message } from '@/types';

/**
 * Chat — generic AI chat screen (OpenAI through the global chat store).
 *
 * RN port of src/pages/Chat.tsx: same store wiring and streaming flow (the
 * assistant bubble is created on the first streamed chunk and updated
 * incrementally). Stack screen — the web shows the fixed <Header /> here, so
 * we mount its native port in flow; the whole screen sits in a
 * KeyboardAvoidingView so the composer rises above the keyboard.
 */
export function Chat() {
  const messages = useAppStore((state) => state.messages);
  const isLoading = useAppStore((state) => state.chatLoading);
  const streamingMessageId = useAppStore((state) => state.streamingMessageId);
  const addMessage = useAppStore((state) => state.addMessage);
  const startStreamingMessage = useAppStore((state) => state.startStreamingMessage);
  const updateStreamingMessage = useAppStore((state) => state.updateStreamingMessage);
  const finishStreamingMessage = useAppStore((state) => state.finishStreamingMessage);
  const setLoading = useAppStore((state) => state.setLoading);
  const { t, language } = useLocale();
  const insets = useSafeAreaInsets();
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { scrollRef, onScroll, onContentSizeChange, showJump, scrollToBottom } =
    useSmartAutoScroll([messages, isLoading]);

  // The assistant bubble is created on the first streamed chunk; until then show
  // the typing indicator.
  const showTyping = isLoading && !streamingMessageId;
  const suggestions = t('chat.suggestions', { returnObjects: true }) as string[];

  const sendMessage = async (text: string) => {
    const userMessage = text.trim();
    if (!userMessage || userMessage.length > CHAT_CONFIG.maxMessageLength || isLoading) return;

    // Check if OpenAI is configured
    if (!OpenAIService.isConfigured()) {
      setError(t('chat.errors.apiKeyMissing'));
      return;
    }

    setInput('');
    setError(null);

    // Add user message
    addMessage(userMessage, 'user');
    setLoading(true);

    try {
      // Start streaming AI response
      const streamingId = startStreamingMessage();
      let accumulatedContent = '';

      const history: Message[] = messages.concat([
        {
          id: crypto.randomUUID(),
          role: 'user',
          content: userMessage,
          timestamp: new Date(),
        },
      ]);

      await OpenAIService.streamChatCompletion(history, (delta: string) => {
        accumulatedContent += delta;
        updateStreamingMessage(streamingId, accumulatedContent);
      });

      finishStreamingMessage();
    } catch (err) {
      console.error('Error streaming chat completion:', err);
      setError(t('chat.errors.streamFailed'));
      finishStreamingMessage();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <Header />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View
          className="w-full max-w-md flex-1 self-center px-4"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          {/* Header */}
          <View className="pb-4 pt-6">
            <Text className="mb-3 text-[28px] font-extrabold leading-tight tracking-tight text-white">
              {t('chat.title')}
            </Text>
            <Text className="text-base font-semibold text-white">{t('chat.subtitle')}</Text>
          </View>

          {/* Error Message */}
          {error && (
            <View className="mb-4 flex-row items-start gap-2 rounded-xl border border-red-500/50 bg-red-500/20 p-3">
              <AlertCircle size={20} color="#F87171" style={{ marginTop: 2 }} />
              <Text className="flex-1 text-sm text-red-200">{error}</Text>
            </View>
          )}

          {/* Messages - Scrollable Area */}
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
                  accent="teal"
                  title={t('chat.emptyTitle')}
                  subtitle={t('chat.emptySubtitle')}
                  suggestions={suggestions}
                  onSuggestion={sendMessage}
                />
              ) : (
                <View accessibilityLabel={t('chat.messagesHeading')} className="flex-1">
                  {messages.map((msg) => (
                    <ChatBubble
                      key={msg.id}
                      message={msg.content}
                      isUser={msg.role === 'user'}
                      accent="teal"
                      copyLabel={t('chat.copy')}
                      copiedLabel={t('chat.copied')}
                      timestamp={new Date(msg.timestamp).toLocaleTimeString(language, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    />
                  ))}
                  {showTyping && <TypingIndicator accent="teal" />}
                </View>
              )}
            </ScrollView>
            <ScrollToBottomButton
              show={showJump}
              onClick={scrollToBottom}
              label={t('chat.newMessages')}
              accent="teal"
            />
          </View>

          {/* Input - Always Visible at Bottom */}
          <View className="pt-4">
            <ChatComposer
              value={input}
              onChange={setInput}
              onSend={() => sendMessage(input)}
              placeholder={t('chat.typeMessage')}
              disabled={!input.trim()}
              isLoading={isLoading}
              accent="teal"
              maxLength={CHAT_CONFIG.maxMessageLength}
              sendLabel={t('chat.send')}
              inputId="chat-input"
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
