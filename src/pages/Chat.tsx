import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import {
  ChatBubble,
  ChatComposer,
  ChatEmptyState,
  ScrollToBottomButton,
  TypingIndicator,
} from '@/features/chat/components';
import { useSmartAutoScroll } from '@/features/chat/hooks/useSmartAutoScroll';
import { useAppStore } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import { CHAT_CONFIG } from '@/constants';
import { OpenAIService } from '@/services/openai.service';
import type { Message } from '@/types';

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
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { scrollRef, endRef, onScroll, showJump, scrollToBottom } = useSmartAutoScroll([messages, isLoading]);

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
    <div className="h-[calc(100vh-10rem)] px-4 pt-4 flex flex-col">
      <div className="max-w-md mx-auto w-full h-full flex flex-col animate-page-in">
        {/* Header */}
        <header className="pt-4 pb-3 flex-shrink-0">
          <h1 className="text-[28px] leading-tight font-extrabold text-white tracking-tight">{t('chat.title')}</h1>
          <p className="text-sm text-white/60 mt-1">{t('chat.subtitle')}</p>
        </header>

        {/* Error Message */}
        {error && (
          <div className="flex-shrink-0 mb-4 bg-red-500/20 border border-red-500/50 rounded-xl p-3 flex items-start gap-2 animate-message-in">
            <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}

        {/* Messages - Scrollable Area */}
        <div className="relative flex-1 min-h-0">
          <div
            ref={scrollRef}
            onScroll={onScroll}
            className="h-full overflow-y-auto pb-4 flex flex-col [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
              <section aria-labelledby="messages-heading" className="space-y-0 flex-1">
                <h2 className="sr-only" id="messages-heading">{t('chat.messagesHeading')}</h2>
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
                <div ref={endRef} />
              </section>
            )}
          </div>
          <ScrollToBottomButton
            show={showJump}
            onClick={scrollToBottom}
            label={t('chat.newMessages')}
            accent="teal"
          />
        </div>

        {/* Input - Always Visible at Bottom */}
        <div className="pt-4 flex-shrink-0">
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
        </div>
      </div>
    </div>
  );
}
