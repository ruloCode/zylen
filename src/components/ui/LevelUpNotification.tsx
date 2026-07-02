import { useEffect, useState } from 'react';
import { Trophy, Sparkles, Coins } from 'lucide-react';
import { cn } from '@/utils';
import { useLocale } from '@/hooks/useLocale';

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
  const { t } = useLocale();
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
    ? t('levelUp.title')
    : t('levelUp.areaTitle', { area: areaName });

  return (
    <div
      className={cn(
        'fixed inset-0 z-[120] grid place-items-center p-6',
        'transition-all duration-300 ease-out',
        isVisible && !isLeaving ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
      onClick={handleClose}
      role="dialog"
      aria-label={title}
    >
      {/* Dim + blur backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />

      <div
        className={cn(
          'glass-card p-7 w-full max-w-[340px] relative overflow-hidden',
          'bg-gradient-to-br from-gold-500/25 to-gold-600/10',
          'border-2 border-gold-400 shadow-2xl',
          'animate-pop-in motion-reduce:animate-none'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Golden shimmer sweep */}
        <div
          className="absolute inset-0 animate-shimmer-gold motion-reduce:hidden opacity-40 pointer-events-none"
          style={{
            background:
              'linear-gradient(105deg, transparent 40%, rgba(242,201,76,0.35) 50%, transparent 60%)',
            backgroundSize: '200% 100%',
          }}
          aria-hidden="true"
        />

        {/* Rising sparkles */}
        <div className="absolute inset-0 pointer-events-none motion-reduce:hidden" aria-hidden="true">
          <Sparkles className="absolute top-4 right-5 text-gold-300 animate-sparkle-rise" size={20} />
          <Sparkles className="absolute bottom-8 left-5 text-gold-300 animate-sparkle-rise animation-delay-200" size={14} />
          <Sparkles className="absolute top-1/3 left-8 text-gold-300 animate-sparkle-rise animation-delay-500" size={16} />
          <Sparkles className="absolute bottom-5 right-10 text-gold-300 animate-sparkle-rise animation-delay-300" size={12} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center gap-3 text-center">
          {/* Icon */}
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gold-400/20 border-2 border-gold-400 animate-glow-pulse">
            <Trophy className="text-gold-300" size={40} />
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold text-gold-100 drop-shadow-lg">
            {title}
          </h3>

          {/* Level Badge */}
          <div className="px-7 py-2.5 rounded-full bg-gradient-to-r from-gold-400 to-gold-500 text-charcoal-900 font-bold text-2xl shadow-lg">
            {t('levelUp.levelLabel', { level })}
          </div>

          {/* Reward */}
          {pointsReward > 0 && (
            <div className="flex items-center gap-2 text-gold-200">
              <Coins size={20} />
              <span className="text-lg font-semibold">{t('levelUp.essenceReward', { points: pointsReward })}</span>
            </div>
          )}

          {/* Close */}
          <button
            onClick={handleClose}
            className="mt-2 px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-semibold text-pale-100 transition-colors"
          >
            {t('levelUp.dismiss')}
          </button>
        </div>
      </div>
    </div>
  );
}
