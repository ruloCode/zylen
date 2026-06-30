import { useState, useEffect, useRef } from 'react';
import { Send, AlertCircle, X, Sparkles } from 'lucide-react';
import { ChatBubble } from './ChatBubble';
import { HermesService } from '@/services/hermes.service';
import { useLocale } from '@/hooks/useLocale';
import { CHAT_CONFIG } from '@/constants';
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Seed the conversation with the mentor's welcome message.
  useEffect(() => {
    setMessages([
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: t('chat.welcomeMessage'),
        timestamp: new Date(),
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the latest message in view.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || input.length > CHAT_CONFIG.maxMessageLength || isLoading) return;

    const userMessage = input.trim();
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
    <div className="fixed inset-0 z-50 flex flex-col bg-[hsl(var(--background))]/95 backdrop-blur-md">
      <div className="max-w-md mx-auto w-full h-full flex flex-col px-4">
        {/* Header */}
        <header className="flex items-center gap-3 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-4 flex-shrink-0">
          <span className="shrink-0 w-11 h-11 rounded-full bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center">
            <Sparkles size={22} className="text-white" />
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
            className="shrink-0 w-10 h-10 rounded-full glass-card flex items-center justify-center text-white"
          >
            <X size={20} />
          </button>
        </header>

        {/* Error banner */}
        {error && (
          <div className="flex-shrink-0 mb-4 bg-red-500/20 border border-red-500/50 rounded-xl p-3 flex items-start gap-2">
            <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto pb-4 flex flex-col">
          <section aria-label="Coach messages" className="space-y-1 flex-1">
            {messages.map((msg) => (
              <ChatBubble
                key={msg.id}
                message={msg.content}
                isUser={msg.role === 'user'}
                timestamp={new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              />
            ))}
            {showTyping && (
              <div className="flex justify-start">
                <div className="bg-charcoal-500 border border-white/10 rounded-2xl px-5 py-3">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gold-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gold-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-gold-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </section>
        </div>

        {/* Input */}
        <div className="pt-2 pb-[calc(env(safe-area-inset-bottom)+1rem)] flex-shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="glass-card rounded-3xl p-4 flex gap-3 items-center shadow-lg"
          >
            <label htmlFor="coach-input" className="sr-only">
              {t('chat.typeMessage')}
            </label>
            <input
              id="coach-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('chat.typeMessage')}
              className="flex-1 bg-transparent outline-none text-white placeholder-white/50 text-base py-2 focus:ring-0"
              maxLength={CHAT_CONFIG.maxMessageLength}
              autoFocus
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              aria-label={t('chat.send')}
              className="bg-gradient-to-br from-gold-500 to-gold-600 text-white p-3 rounded-xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-400/50 min-w-[48px] min-h-[48px] flex items-center justify-center"
            >
              <Send size={20} aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
