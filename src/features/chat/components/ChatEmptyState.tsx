import { Sparkles } from 'lucide-react';

interface ChatEmptyStateProps {
  title: string;
  subtitle: string;
  /** Starter prompts rendered as tappable chips. */
  suggestions?: string[];
  /** Called when a suggestion chip is tapped. */
  onSuggestion?: (text: string) => void;
  /** Hero avatar (Coach). Falls back to a sparkle glyph. */
  avatarSrc?: string;
  accent?: 'teal' | 'gold';
}

/**
 * Friendly empty state shown before a conversation starts: a glowing avatar,
 * a warm greeting, and a few starter chips that kick off the chat in one tap.
 */
export function ChatEmptyState({
  title,
  subtitle,
  suggestions = [],
  onSuggestion,
  avatarSrc,
  accent = 'gold',
}: ChatEmptyStateProps) {
  // i18n's `returnObjects` can briefly yield a non-array while locales load.
  const items = Array.isArray(suggestions) ? suggestions : [];
  const halo =
    accent === 'gold'
      ? 'from-gold-500/30 to-gold-600/10 shadow-glow-gold'
      : 'from-teal-500/30 to-teal-600/10 shadow-glow-teal';
  const ringGlow = accent === 'gold' ? 'bg-gold-500/20' : 'bg-teal-500/20';

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 text-center animate-fade-in">
      {/* Glowing avatar */}
      <div className="relative mb-5">
        <div className={`absolute inset-0 -z-10 animate-glow-pulse rounded-full blur-2xl ${ringGlow}`} />
        <div
          className={`flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br ${halo} border border-white/10`}
        >
          {avatarSrc ? (
            <img src={avatarSrc} alt="" className="h-full w-full object-cover object-top" draggable={false} />
          ) : (
            <Sparkles size={34} className="text-white" />
          )}
        </div>
      </div>

      <h2 className="mb-2 font-sans text-xl font-bold normal-case leading-snug text-white">{title}</h2>
      <p className="mb-6 max-w-xs text-sm leading-relaxed text-white/60">{subtitle}</p>

      {items.length > 0 && (
        <div className="flex w-full max-w-sm flex-col gap-2">
          {items.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => onSuggestion?.(suggestion)}
              className="group glass-card flex items-center gap-2 rounded-2xl px-4 py-3 text-left text-sm text-white/80 transition-all duration-200 hover:scale-[1.02] hover:text-white active:scale-100"
            >
              <Sparkles
                size={15}
                className={`flex-shrink-0 transition-colors ${
                  accent === 'gold' ? 'text-gold-400' : 'text-teal-400'
                }`}
              />
              <span className="min-w-0 [overflow-wrap:anywhere]">{suggestion}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
