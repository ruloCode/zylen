import { useState } from 'react';
import { AlertCircle, X, Sparkles } from 'lucide-react';
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
 */
export function CoachChat({ onClose }: CoachChatProps) {
  const { t } = useLocale();
  const { user } = useUser();
  // Hermes "speaks" to you wearing the same hero the user picked on the Home.
  const hermesAvatar = getHeroBodySrc(user?.avatarUrl);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { scrollRef, endRef, onScroll, showJump, scrollToBottom } = useSmartAutoScroll([messages, isLoading]);
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
      setError(err instanceof Error ? err.message : 'No se pudo conectar con Hermes.');
    } finally {
      setIsLoading(false);
      setStreamingId(null);
    }
  };

  const showTyping = isLoading && !streamingId;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col overflow-x-hidden bg-[hsl(var(--background))]/95 backdrop-blur-md">
      <div className="max-w-md mx-auto w-full h-full flex flex-col overflow-x-hidden px-4">
        {/* Header */}
        <header className="flex items-center gap-3 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-4 flex-shrink-0">
          <span className="shrink-0 w-11 h-11 rounded-full bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center overflow-hidden">
            {hermesAvatar ? (
              <img src={hermesAvatar} alt="" className="w-full h-full object-cover object-top" draggable={false} />
            ) : (
              <Sparkles size={22} className="text-white" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-extrabold text-white tracking-tight leading-tight truncate">
              {t('home.personalJournal')}
            </h1>
            <p className="text-sm text-white/60 font-medium truncate">{t('chat.subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="shrink-0 w-10 h-10 rounded-full glass-card flex items-center justify-center text-white transition-transform duration-200 hover:scale-105"
          >
            <X size={20} />
          </button>
        </header>

        {/* Error banner */}
        {error && (
          <div className="flex-shrink-0 mb-4 bg-red-500/20 border border-red-500/50 rounded-xl p-3 flex items-start gap-2 animate-message-in">
            <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}

        {/* Messages */}
        <div className="relative flex-1 min-h-0">
          <div ref={scrollRef} onScroll={onScroll} className="h-full overflow-y-auto pb-4 flex flex-col">
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
              <section aria-label="Coach messages" className="flex-1">
                {messages.map((msg) => (
                  <ChatBubble
                    key={msg.id}
                    message={msg.content}
                    isUser={msg.role === 'user'}
                    accent="gold"
                    avatarSrc={hermesAvatar}
                    copyLabel={t('chat.copy')}
                    copiedLabel={t('chat.copied')}
                    timestamp={new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  />
                ))}
                {showTyping && <TypingIndicator accent="gold" avatarSrc={hermesAvatar} />}
                <div ref={endRef} />
              </section>
            )}
          </div>
          <ScrollToBottomButton
            show={showJump}
            onClick={scrollToBottom}
            label={t('chat.newMessages')}
            accent="gold"
          />
        </div>

        {/* Input */}
        <div className="pt-2 pb-[calc(env(safe-area-inset-bottom)+1rem)] flex-shrink-0">
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
        </div>
      </div>
    </div>
  );
}
