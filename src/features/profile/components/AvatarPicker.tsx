/**
 * AvatarPicker
 *
 * Reusable avatar selector showing the three explorer avatars (AVATAR_OPTIONS).
 * Presentational: the parent owns the selected value and persistence.
 * Used in Profile (change avatar) and in onboarding.
 */

import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/utils';
import { useLocale } from '@/hooks/useLocale';
import { AVATAR_OPTIONS } from '@/constants';

interface AvatarPickerProps {
  /** Currently selected avatar url. */
  value: string;
  /** Called with the chosen avatar url. */
  onChange: (url: string) => void;
  className?: string;
}

export function AvatarPicker({ value, onChange, className }: AvatarPickerProps) {
  const { t } = useLocale();

  return (
    <div className={cn('grid grid-cols-3 gap-3', className)}>
      {AVATAR_OPTIONS.map((option) => {
        const isSelected = value === option.url;
        const name = t(option.nameKey);
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.url)}
            aria-pressed={isSelected}
            aria-label={name}
            className={cn(
              'group relative flex flex-col items-center gap-2 rounded-2xl p-2 transition-all',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60',
              isSelected
                ? 'bg-teal-500/15 ring-2 ring-teal-400/70'
                : 'bg-white/[0.04] ring-1 ring-white/10 hover:bg-white/[0.07]'
            )}
          >
            <span
              className={cn(
                'relative w-full aspect-square overflow-hidden rounded-xl bg-gradient-to-b from-teal-500/15 to-teal-700/10',
                isSelected && 'shadow-glow-teal'
              )}
            >
              <img
                src={option.url}
                alt={name}
                className="h-full w-full object-cover object-top"
                loading="lazy"
              />
              {isSelected && (
                <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-teal-400 text-[hsl(var(--background))] shadow">
                  <Check size={13} strokeWidth={3} />
                </span>
              )}
            </span>
            <span
              className={cn(
                'text-[11px] font-semibold leading-tight',
                isSelected ? 'text-teal-200' : 'text-white/60'
              )}
            >
              {name}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default AvatarPicker;
