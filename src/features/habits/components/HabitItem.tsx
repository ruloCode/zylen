/**
 * MyWay (LifeQuest) HabitItem Component
 * RPG-styled habit tiles with golden completion glow and teal check icons
 */

import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/utils';
import { XPBadge } from '@/components/ui';
import { HABIT_ICONS } from './IconSelector';
import { useLifeAreas } from '@/store';
import { useLocale } from '@/hooks/useLocale';

// Icon mapper using the centralized HABIT_ICONS from IconSelector
const iconMap = HABIT_ICONS;

interface HabitItemProps {
  id: string;
  name: string;
  iconName: string; // Changed from icon: React.ReactNode
  xp: number;
  completed: boolean;
  lifeArea: string; // Life area ID
  onToggle: (id: string, completed: boolean) => void;
}

export function HabitItem({
  id,
  name,
  iconName,
  xp,
  completed,
  lifeArea,
  onToggle
}: HabitItemProps) {
  const { t } = useLocale();
  const { lifeAreas } = useLifeAreas();
  const [isCompleted, setIsCompleted] = useState(completed);

  const handleToggle = (value: boolean) => {
    setIsCompleted(value);
    onToggle(id, value);
  };

  // Get icon component from map, fallback to Target if not found
  const IconComponent = iconMap[iconName] || iconMap['Target'];

  // Get life area info
  const lifeAreaInfo = lifeAreas.find(area => area.id === lifeArea);
  const lifeAreaName = lifeAreaInfo ? t(`lifeAreas.${String(lifeAreaInfo.area).toLowerCase()}`) : '';

  return (
    <article
      className={cn(
        'glass-card rounded-2xl p-3 sm:p-4 transition-all duration-500 relative overflow-hidden',
        isCompleted
          ? 'bg-gradient-to-br from-success-50/90 to-teal-50/80 border-2 border-success-300/60 shadow-glow-success'
          : 'hover:shadow-soft-lg hover:scale-[1.02]'
      )}
      aria-label={`Habit: ${name}`}
    >
      {/* Golden celebration glow on completion */}
      {isCompleted && (
        <div className="absolute inset-0 bg-gradient-adventure-glow opacity-20 animate-glow-pulse pointer-events-none" />
      )}

      <div className="flex items-center gap-3 relative z-10">
        {/* Icon with warm background */}
        <div
          className={cn(
            'p-2.5 sm:p-3 rounded-xl transition-all duration-300 flex-shrink-0',
            isCompleted
              ? 'bg-gradient-to-br from-teal-400 to-teal-600 text-white shadow-glow-teal'
              : 'bg-gradient-to-br from-parchment-100 to-parchment-200 text-gold-600 shadow-soft'
          )}
        >
          <IconComponent size={20} className="sm:w-6 sm:h-6" />
        </div>

        {/* Habit details */}
        <div className="flex-1 min-w-0">
          <h3
            className={cn(
              'font-display font-bold text-sm sm:text-base truncate transition-colors',
              isCompleted ? 'text-success-700' : 'text-gray-900'
            )}
          >
            {name}
          </h3>

          {/* XP Badge and Life Area Badge */}
          <div className="mt-1 flex items-center gap-1.5 flex-wrap">
            <XPBadge xp={xp} size="sm" />
            {lifeAreaName && (
              <span className="px-1.5 py-0.5 text-xs font-semibold rounded-md bg-teal-100 text-teal-700">
                {lifeAreaName}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons - Increased to 44x44px for better touch targets (WCAG 2.5.5) */}
        <div className="flex gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Complete button */}
          <button
            type="button"
            onClick={() => handleToggle(true)}
            className={cn(
              'w-11 h-11 sm:w-12 sm:h-12 p-2 sm:p-3 rounded-xl transition-all duration-300 relative flex items-center justify-center',
              'focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-400/50 focus-visible:ring-offset-2',
              isCompleted
                ? 'bg-gradient-to-br from-success-500 to-success-600 text-white shadow-glow-success scale-110'
                : 'bg-parchment-100/80 text-teal-600 hover:bg-teal-50 hover:text-teal-700 hover:scale-110 hover:shadow-soft-md'
            )}
            aria-label={`Mark ${name} as complete`}
            aria-pressed={isCompleted}
          >
            <Check size={20} strokeWidth={isCompleted ? 3 : 2} />

            {/* Sparkle on completed */}
            {isCompleted && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-gold-400 rounded-full animate-sparkle" />
            )}
          </button>

          {/* Incomplete button */}
          <button
            type="button"
            onClick={() => handleToggle(false)}
            className={cn(
              'w-11 h-11 sm:w-12 sm:h-12 p-2 sm:p-3 rounded-xl transition-all duration-300 flex items-center justify-center',
              'focus:outline-none focus-visible:ring-4 focus-visible:ring-danger-400/50 focus-visible:ring-offset-2',
              !isCompleted && isCompleted !== completed
                ? 'bg-gradient-to-br from-danger-400 to-danger-500 text-white shadow-soft-lg scale-110'
                : 'bg-parchment-100/80 text-navy-400 hover:bg-danger-50 hover:text-danger-600 hover:scale-110 hover:shadow-soft-md'
            )}
            aria-label={`Mark ${name} as incomplete`}
            aria-pressed={!isCompleted}
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Completion celebration effect */}
      {isCompleted && (
        <>
          <div className="absolute top-2 right-2 w-3 h-3 bg-gold-500 rounded-full animate-sparkle-rise opacity-0" />
          <div className="absolute top-4 right-8 w-2 h-2 bg-gold-400 rounded-full animate-sparkle-rise opacity-0 animation-delay-100" />
          <div className="absolute top-3 right-14 w-2.5 h-2.5 bg-gold-500 rounded-full animate-sparkle-rise opacity-0 animation-delay-200" />
        </>
      )}
    </article>
  );
}

export default HabitItem;
