import { User } from 'lucide-react';

interface ChatBubbleProps {
  message: string;
  isUser: boolean;
  timestamp?: string;
  /**
   * Full-body hero avatar shown for assistant (Hermes) messages — the same
   * character the user picked on the Home. Falls back to a generic icon when
   * absent. Ignored for user messages.
   */
  avatarSrc?: string;
}
export function ChatBubble({
  message,
  isUser,
  timestamp,
  avatarSrc
}: ChatBubbleProps) {
  return <div className={`flex gap-3 w-full max-w-full ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-4`}>
      <div className={`flex-shrink-0 w-10 h-10 rounded-full overflow-hidden flex items-center justify-center ${isUser ? 'bg-gradient-to-br from-teal-500 to-teal-600' : 'bg-gradient-to-br from-gold-500 to-gold-600'}`}>
        {isUser ? (
          <User size={20} className="text-white" />
        ) : avatarSrc ? (
          <img
            src={avatarSrc}
            alt="Hermes"
            className="w-full h-full object-cover object-top"
            draggable={false}
          />
        ) : (
          <User size={20} className="text-white" />
        )}
      </div>
      <div className={`flex flex-col min-w-0 ${isUser ? 'items-end' : 'items-start'} max-w-[75%]`}>
        <div className={`max-w-full rounded-2xl px-4 py-3 border ${isUser ? 'bg-teal-500/90 border-teal-600/30' : 'bg-charcoal-500 border-white/10'}`}>
          <p className="text-sm leading-relaxed text-white break-words [overflow-wrap:anywhere]">{message}</p>
        </div>
        {timestamp && <span className="text-xs text-white/70 mt-1 px-2">{timestamp}</span>}
      </div>
    </div>;
}
