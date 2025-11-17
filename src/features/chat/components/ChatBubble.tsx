import React from 'react';
import { Bot, User } from 'lucide-react';
interface ChatBubbleProps {
  message: string;
  isUser: boolean;
  timestamp?: string;
}
export function ChatBubble({
  message,
  isUser,
  timestamp
}: ChatBubbleProps) {
  return <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-4`}>
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isUser ? 'bg-gradient-to-br from-teal-500 to-teal-600' : 'bg-gradient-to-br from-gold-500 to-gold-600'}`}>
        {isUser ? <User size={20} className="text-white" /> : <Bot size={20} className="text-white" />}
      </div>
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[75%]`}>
        <div className={`rounded-2xl px-4 py-3 border ${isUser ? 'bg-teal-500/90 border-teal-600/30' : 'bg-charcoal-500 border-white/10'}`}>
          <p className={`text-sm leading-relaxed ${isUser ? 'text-white' : 'text-white'}`}>{message}</p>
        </div>
        {timestamp && <span className="text-xs text-white/70 mt-1 px-2">{timestamp}</span>}
      </div>
    </div>;
}