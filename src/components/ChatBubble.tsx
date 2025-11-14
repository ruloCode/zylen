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
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isUser ? 'bg-gradient-to-br from-quest-blue to-quest-purple' : 'bg-gradient-to-br from-quest-green to-quest-gold'}`}>
        {isUser ? <User size={20} className="text-white" /> : <Bot size={20} className="text-white" />}
      </div>
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[75%]`}>
        <div className={`glass-card rounded-2xl px-4 py-3 ${isUser ? 'bg-gradient-to-br from-quest-blue/20 to-quest-purple/20' : 'bg-white/90'}`}>
          <p className="text-gray-800 text-sm leading-relaxed">{message}</p>
        </div>
        {timestamp && <span className="text-xs text-gray-500 mt-1 px-2">{timestamp}</span>}
      </div>
    </div>;
}