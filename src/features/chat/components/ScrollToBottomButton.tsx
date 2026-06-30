import { ArrowDown } from 'lucide-react';

interface ScrollToBottomButtonProps {
  show: boolean;
  onClick: () => void;
  label: string;
  accent?: 'teal' | 'gold';
}

/**
 * Floating "↓ new messages" pill, shown when the user has scrolled up and fresh
 * content arrived below. Tapping it jumps to the latest message.
 */
export function ScrollToBottomButton({ show, onClick, label, accent = 'gold' }: ScrollToBottomButtonProps) {
  if (!show) return null;

  const accentBg =
    accent === 'gold'
      ? 'from-gold-500 to-gold-600 focus-visible:ring-gold-400/50'
      : 'from-teal-500 to-teal-600 focus-visible:ring-teal-400/50';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 animate-message-in items-center gap-1.5 rounded-full bg-gradient-to-br px-4 py-2 text-xs font-semibold text-white shadow-soft-lg transition-all duration-200 hover:scale-105 focus:outline-none focus-visible:ring-4 ${accentBg}`}
    >
      <ArrowDown size={14} />
      {label}
    </button>
  );
}
