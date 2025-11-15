import { Trophy } from 'lucide-react';
import { cn } from '@/utils';

interface LevelBadgeProps {
  level: number;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

/**
 * LevelBadge component - Displays a user or life area level
 */
export function LevelBadge({
  level,
  size = 'md',
  showIcon = true,
  className,
}: LevelBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20,
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-bold',
        'bg-gradient-to-r from-gold-400 to-gold-500',
        'text-charcoal-900 shadow-md',
        'glow-effect',
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Trophy size={iconSizes[size]} className="flex-shrink-0" />}
      <span>LVL {level}</span>
    </div>
  );
}
