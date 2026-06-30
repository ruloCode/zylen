import { User } from 'lucide-react';

interface TypingIndicatorProps {
  /** Hero avatar shown beside the bubble (assistant identity). */
  avatarSrc?: string;
  /** Accent palette for the pulsing dots. */
  accent?: 'teal' | 'gold';
}

/**
 * Elegant "assistant is typing" indicator — a soft glassy bubble with three
 * gently pulsing dots, aligned with the assistant avatar so it reads as the
 * coach gathering their thoughts before the response streams in.
 */
export function TypingIndicator({ avatarSrc, accent = 'gold' }: TypingIndicatorProps) {
  const dot = accent === 'gold' ? 'bg-gold-400' : 'bg-teal-400';
  const avatarBg =
    accent === 'gold'
      ? 'bg-gradient-to-br from-gold-500 to-gold-600'
      : 'bg-gradient-to-br from-teal-500 to-teal-600';

  return (
    <div className="mb-4 flex w-full max-w-full animate-fade-in flex-row gap-3">
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full ${avatarBg}`}>
        {avatarSrc ? (
          <img src={avatarSrc} alt="" className="h-full w-full object-cover object-top" draggable={false} />
        ) : (
          <User size={20} className="text-white" />
        )}
      </div>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-md border border-white/10 bg-charcoal-500 px-4 py-3.5 shadow-soft">
        <span className={`h-2 w-2 rounded-full ${dot} animate-typing-dot`} />
        <span className={`h-2 w-2 rounded-full ${dot} animate-typing-dot animation-delay-200`} />
        <span className={`h-2 w-2 rounded-full ${dot} animate-typing-dot animation-delay-300`} />
      </div>
    </div>
  );
}
