import { useLayoutEffect, useRef, type KeyboardEvent } from 'react';
import { Send } from 'lucide-react';

interface ChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  /** Fired on submit (Enter without Shift, or the send button). */
  onSend: () => void;
  placeholder?: string;
  /** Disables the send button (e.g. empty input or in-flight request). */
  disabled?: boolean;
  /** Request in flight — keeps the send button disabled. */
  isLoading?: boolean;
  accent?: 'teal' | 'gold';
  maxLength?: number;
  sendLabel?: string;
  autoFocus?: boolean;
  inputId?: string;
}

const MAX_TEXTAREA_HEIGHT = 160; // px — ~6-7 lines before it scrolls internally

/**
 * Auto-growing chat input. The textarea expands with its content up to
 * {@link MAX_TEXTAREA_HEIGHT} (then scrolls internally), Enter sends while
 * Shift+Enter inserts a newline, and the gradient send button matches the
 * surface accent (teal for the generic chat, gold for the Coach).
 */
export function ChatComposer({
  value,
  onChange,
  onSend,
  placeholder,
  disabled,
  isLoading,
  accent = 'gold',
  maxLength,
  sendLabel = 'Send',
  autoFocus,
  inputId = 'chat-input',
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Grow-to-fit: reset to auto so shrinking works, then clamp to the max.
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  }, [value]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && !isLoading) onSend();
    }
  };

  const sendBg =
    accent === 'gold'
      ? 'from-gold-500 to-gold-600 focus-visible:ring-gold-400/50'
      : 'from-teal-500 to-teal-600 focus-visible:ring-teal-400/50';

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!disabled && !isLoading) onSend();
      }}
      className="glass-card flex items-end gap-3 rounded-3xl p-3 shadow-lg"
    >
      <label htmlFor={inputId} className="sr-only">
        {placeholder}
      </label>
      <textarea
        id={inputId}
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        maxLength={maxLength}
        autoFocus={autoFocus}
        className="flex-1 resize-none self-center bg-transparent py-2 pl-2 text-base leading-relaxed text-white outline-none placeholder-white/50 focus:ring-0"
        style={{ maxHeight: MAX_TEXTAREA_HEIGHT }}
      />
      <button
        type="submit"
        disabled={disabled || isLoading}
        aria-label={sendLabel}
        className={`flex min-h-[48px] min-w-[48px] flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-soft transition-all duration-200 hover:scale-105 focus:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 ${sendBg}`}
      >
        <Send size={20} aria-hidden="true" />
      </button>
    </form>
  );
}
