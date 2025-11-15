import { useEffect, useState } from 'react';
import { Trophy, Sparkles, Coins } from 'lucide-react';
import { cn } from '@/utils';

interface LevelUpNotificationProps {
  level: number;
  type: 'global' | 'area';
  areaName?: string;
  pointsReward: number;
  onClose?: () => void;
  autoCloseDelay?: number; // ms
}

/**
 * LevelUpNotification - Animated notification for level ups
 */
export function LevelUpNotification({
  level,
  type,
  areaName,
  pointsReward,
  onClose,
  autoCloseDelay = 4000,
}: LevelUpNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    setTimeout(() => setIsVisible(true), 10);

    // Auto-close after delay
    const closeTimer = setTimeout(() => {
      handleClose();
    }, autoCloseDelay);

    return () => clearTimeout(closeTimer);
  }, [autoCloseDelay]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  };

  const title = type === 'global'
    ? 'Level Up!'
    : `${areaName} Level Up!`;

  return (
    <div
      className={cn(
        'fixed top-4 left-1/2 -translate-x-1/2 z-50',
        'transition-all duration-300 ease-out',
        isVisible && !isLeaving
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 -translate-y-4'
      )}
    >
      <div
        className={cn(
          'glass-card p-6 min-w-[320px]',
          'bg-gradient-to-br from-gold-500/20 to-gold-600/20',
          'border-2 border-gold-400',
          'shadow-2xl',
          'relative overflow-hidden'
        )}
      >
        {/* Sparkle background effect */}
        <div className="absolute inset-0 opacity-20">
          <Sparkles className="absolute top-2 right-2 text-gold-300 animate-pulse" size={24} />
          <Sparkles className="absolute bottom-2 left-2 text-gold-300 animate-pulse delay-100" size={16} />
          <Sparkles className="absolute top-1/2 left-1/4 text-gold-300 animate-pulse delay-200" size={20} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center gap-3 text-center">
          {/* Icon */}
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gold-400/20 border-2 border-gold-400">
            <Trophy className="text-gold-300" size={32} />
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold text-gold-100 drop-shadow-lg">
            {title}
          </h3>

          {/* Level Badge */}
          <div className="px-6 py-2 rounded-full bg-gradient-to-r from-gold-400 to-gold-500 text-charcoal-900 font-bold text-xl shadow-lg">
            Level {level}
          </div>

          {/* Reward */}
          {pointsReward > 0 && (
            <div className="flex items-center gap-2 text-gold-200">
              <Coins size={20} />
              <span className="text-lg font-semibold">+{pointsReward} points</span>
            </div>
          )}

          {/* Close button (click anywhere) */}
          <button
            onClick={handleClose}
            className="mt-2 text-sm text-pale-200/60 hover:text-pale-100 transition-colors"
          >
            Click to dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
