import { useState, useEffect, useRef } from 'react';
import { Send, AlertCircle } from 'lucide-react';
import { ChatBubble } from '@/features/chat/components';
import { useAppStore } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import { CHAT_CONFIG } from '@/constants';
import { OpenAIService } from '@/services/openai.service';

export function Chat() {
  const messages = useAppStore((state) => state.messages);
  const isLoading = useAppStore((state) => state.isLoading);
  const addMessage = useAppStore((state) => state.addMessage);
  const startStreamingMessage = useAppStore((state) => state.startStreamingMessage);
  const updateStreamingMessage = useAppStore((state) => state.updateStreamingMessage);
  const finishStreamingMessage = useAppStore((state) => state.finishStreamingMessage);
  const setLoading = useAppStore((state) => state.setLoading);
  const { t } = useLocale();
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with welcome message if empty
  useEffect(() => {
    if (messages.length === 0) {
      addMessage(
        t('chat.welcomeMessage'),
        'assistant'
      );
    }
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || input.length > CHAT_CONFIG.maxMessageLength) return;

    // Check if OpenAI is configured
    if (!OpenAIService.isConfigured()) {
      setError('OpenAI API key not configured. Please add your API key to .env.local');
      return;
    }

    const userMessage = input.trim();
    setInput('');
    setError(null);

    // Add user message
    addMessage(userMessage, 'user');
    setLoading(true);

    try {
      // Start streaming AI response
      const streamingId = startStreamingMessage();
      let accumulatedContent = '';

      await OpenAIService.streamChatCompletion(
        messages.concat([{
          id: crypto.randomUUID(),
          role: 'user',
          content: userMessage,
          timestamp: new Date(),
        }]),
        (delta: string) => {
          accumulatedContent += delta;
          updateStreamingMessage(streamingId, accumulatedContent);
        }
      );

      finishStreamingMessage();
    } catch (err) {
      console.error('Error streaming chat completion:', err);
      setError(err instanceof Error ? err.message : 'Failed to get AI response');
      finishStreamingMessage();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-10rem)] px-2 pt-4 flex flex-col">
      <div className="max-w-md mx-auto w-full h-full flex flex-col">
        {/* Header */}
        <header className="pt-6 pb-4 flex-shrink-0">
          <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">{t('chat.title')}</h1>
          <p className="text-base text-white font-semibold">{t('chat.subtitle')}</p>
        </header>

        {/* Error Message */}
        {error && (
          <div className="flex-shrink-0 mb-4 bg-red-500/20 border border-red-500/50 rounded-xl p-3 flex items-start gap-2">
            <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}

        {/* Messages - Scrollable Area */}
        <div className="flex-1 overflow-y-auto pb-4 flex flex-col">
          <section aria-labelledby="messages-heading" className="space-y-4 flex-1">
            <h2 className="sr-only" id="messages-heading">Chat Messages</h2>
            {messages.map(msg => (
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
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/70 rounded-2xl px-5 py-3 shadow-lg">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </section>
        </div>

        {/* Input - Always Visible at Bottom */}
        <div className="pt-4 flex-shrink-0">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="glass-card rounded-3xl p-4 flex gap-3 items-center shadow-lg"
          >
            <label htmlFor="chat-input" className="sr-only">Message to AI coach</label>
            <input
              id="chat-input"
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={t('chat.typeMessage')}
              className="flex-1 bg-transparent outline-none text-white placeholder-white/50 text-base py-2 focus:ring-0"
              aria-label="Type your message"
              maxLength={CHAT_CONFIG.maxMessageLength}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
              className="bg-gradient-to-br from-teal-500 to-teal-600 text-white p-3 rounded-xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-400/50 focus-visible:ring-offset-2 min-w-[48px] min-h-[48px] flex items-center justify-center"
            >
              <Send size={20} aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
