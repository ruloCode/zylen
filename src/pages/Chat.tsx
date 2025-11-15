import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send } from 'lucide-react';
import { ChatBubble } from '@/features/chat/components';
import { Button } from '@/components/ui';
import { useAppStore } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import { CHAT_CONFIG } from '@/constants';
import ruloAvatar from '../assets/rulo_avatar.png';

export function Chat() {
  const messages = useAppStore((state) => state.messages);
  const isLoading = useAppStore((state) => state.isLoading);
  const addMessage = useAppStore((state) => state.addMessage);
  const setLoading = useAppStore((state) => state.setLoading);
  const { t } = useLocale();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const responses = useMemo(() => [
    t('chat.responses.1'),
    t('chat.responses.2'),
    t('chat.responses.3'),
    t('chat.responses.4'),
  ], [t]);

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

  const handleSend = () => {
    if (!input.trim() || input.length > CHAT_CONFIG.maxMessageLength) return;

    // Add user message
    addMessage(input, 'user');
    setInput('');
    setLoading(true);

    // Simulate AI response with delay
    setTimeout(() => {
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      addMessage(randomResponse, 'assistant');
      setLoading(false);
    }, CHAT_CONFIG.aiResponseDelay);
  };

  return (
    <div className="h-[calc(100vh-10rem)] px-4 flex flex-col">
      <div className="max-w-md mx-auto w-full h-full flex flex-col">
        {/* Header */}
        <header className="pt-6 pb-4 flex-shrink-0">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">{t('chat.title')}</h1>
          <p className="text-base text-gray-700 font-semibold">{t('chat.subtitle')}</p>
        </header>

        {/* Messages - Scrollable Area */}
        <div className="flex-1 overflow-y-auto pb-4 flex flex-col">
          <section aria-labelledby="messages-heading" className="space-y-4 flex-1">
            <h2 className="sr-only" id="messages-heading">Chat Messages</h2>
            {messages.map(msg => (
              <ChatBubble
                key={msg.id}
                id={msg.id}
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
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
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
              className="flex-1 bg-transparent outline-none text-gray-900 placeholder-gray-500 text-base py-2 focus:ring-0"
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
