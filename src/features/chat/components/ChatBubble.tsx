import { useState } from 'react';
import { Check, Copy, User } from 'lucide-react';
import { MarkdownMessage } from './MarkdownMessage';

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
  /** Accent palette: gold for the Coach (Hermes), teal for the generic chat. */
  accent?: 'teal' | 'gold';
  /** Label for the copy action (i18n). */
  copyLabel?: string;
  /** Label shown briefly after copying (i18n). */
  copiedLabel?: string;
}

/**
 * A single chat row: avatar + bubble.
 *
 * Assistant messages render rich markdown ({@link MarkdownMessage}) in a wide
 * bubble so formatted content (lists, code, tables) breathes, and expose a
 * copy button + timestamp that fade in on hover. User messages stay plain
 * text in a tighter, accent-tinted bubble.
 */
export function ChatBubble({
  message,
  isUser,
  timestamp,
  avatarSrc,
  accent = 'gold',
  copyLabel = 'Copy',
  copiedLabel = 'Copied',
}: ChatBubbleProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — silently ignore */
    }
  };

  const userAvatarBg = 'bg-gradient-to-br from-teal-500 to-teal-600';
  const assistantAvatarBg =
    accent === 'gold'
      ? 'bg-gradient-to-br from-gold-500 to-gold-600'
      : 'bg-gradient-to-br from-teal-500 to-teal-600';

  return (
    <div
      className={`group flex w-full max-w-full animate-message-in gap-3 ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      } mb-4`}
    >
      {/* Avatar */}
      <div
        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full ${
          isUser ? userAvatarBg : assistantAvatarBg
        }`}
      >
        {isUser ? (
          <User size={20} className="text-white" />
        ) : avatarSrc ? (
          <img src={avatarSrc} alt="" className="h-full w-full object-cover object-top" draggable={false} />
        ) : (
          <User size={20} className="text-white" />
        )}
      </div>

      {/* Bubble + meta */}
      <div className={`flex min-w-0 flex-col ${isUser ? 'items-end' : 'items-start'} ${isUser ? 'max-w-[80%]' : 'max-w-[88%]'}`}>
        <div
          className={`max-w-full rounded-2xl border px-4 py-3 shadow-soft ${
            isUser
              ? 'rounded-tr-md border-teal-600/30 bg-teal-500/90'
              : 'rounded-tl-md border-white/10 bg-charcoal-500'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-white [overflow-wrap:anywhere]">
              {message}
            </p>
          ) : (
            <MarkdownMessage content={message} accent={accent} />
          )}
        </div>

        {/* Meta row — copy (assistant only) + timestamp, revealed on hover */}
        <div
          className={`mt-1 flex items-center gap-2 px-1 opacity-0 transition-opacity duration-200 focus-within:opacity-100 group-hover:opacity-100 ${
            isUser ? 'flex-row-reverse' : 'flex-row'
          }`}
        >
          {!isUser && (
            <button
              type="button"
              onClick={handleCopy}
              aria-label={copied ? copiedLabel : copyLabel}
              className="flex items-center gap-1 rounded-md px-1 py-0.5 text-xs text-white/50 transition-colors hover:text-white/90 focus:outline-none focus-visible:text-white/90"
            >
              {copied ? (
                <>
                  <Check size={12} className="text-green-400" />
                  <span className="text-green-400">{copiedLabel}</span>
                </>
              ) : (
                <Copy size={12} />
              )}
            </button>
          )}
          {timestamp && <span className="text-xs text-white/40">{timestamp}</span>}
        </div>
      </div>
    </div>
  );
}
