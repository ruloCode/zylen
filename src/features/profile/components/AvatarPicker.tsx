/**
 * AvatarPicker
 *
 * Reusable avatar selector showing the preset hero avatars (AVATAR_OPTIONS),
 * plus — when the user has one — their custom AI-generated avatar, and an
 * optional "create your own" tile that opens the AvatarCreator.
 * Presentational: the parent owns the selected value and persistence.
 * Used in Profile (change avatar) and in onboarding.
 */

import React from 'react';
import { Check, Wand2 } from 'lucide-react';
import { cn } from '@/utils';
import { useLocale } from '@/hooks/useLocale';
import { AVATAR_OPTIONS, isCustomAvatar } from '@/constants';

interface AvatarPickerProps {
  /** Currently selected avatar url. */
  value: string;
  /** Called with the chosen avatar url. */
  onChange: (url: string) => void;
  /**
   * Custom AI avatar bust to offer as a tile (usually the user's saved
   * avatarUrl when it points at storage). Falls back to `value` when the
   * current selection itself is custom.
   */
  customAvatarUrl?: string;
  /** When provided, renders a "create with your photo" tile. */
  onCreateCustom?: () => void;
  className?: string;
}

interface TileProps {
  selected: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}

function Tile({ selected, onClick, label, children }: TileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={label}
      className={cn(
        'group relative flex flex-col items-center gap-2 rounded-2xl p-2 transition-all',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60',
        selected
          ? 'bg-teal-500/15 ring-2 ring-teal-400/70'
          : 'bg-white/[0.04] ring-1 ring-white/10 hover:bg-white/[0.07]'
      )}
    >
      <span
        className={cn(
          'relative w-full aspect-square overflow-hidden rounded-xl bg-gradient-to-b from-teal-500/15 to-teal-700/10',
          selected && 'shadow-glow-teal'
        )}
      >
        {children}
        {selected && (
          <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-teal-400 text-[hsl(var(--background))] shadow">
            <Check size={13} strokeWidth={3} />
          </span>
        )}
      </span>
      <span
        className={cn(
          'text-[11px] font-semibold leading-tight',
          selected ? 'text-teal-200' : 'text-white/60'
        )}
      >
        {label}
      </span>
    </button>
  );
}

export function AvatarPicker({
  value,
  onChange,
  customAvatarUrl,
  onCreateCustom,
  className,
}: AvatarPickerProps) {
  const { t } = useLocale();

  // Surface the user's custom avatar as its own tile — either the one passed
  // in, or the current selection when it already points at storage.
  const customUrl =
    customAvatarUrl ?? (isCustomAvatar(value) ? value : undefined);

  return (
    <div className={cn('grid grid-cols-3 gap-3', className)}>
      {customUrl && (
        <Tile
          selected={value === customUrl}
          onClick={() => onChange(customUrl)}
          label={t('profile.avatars.custom')}
        >
          <img
            src={customUrl}
            alt={t('profile.avatars.custom')}
            className="h-full w-full object-cover object-top"
            loading="lazy"
          />
        </Tile>
      )}

      {AVATAR_OPTIONS.map((option) => {
        const name = t(option.nameKey);
        return (
          <Tile
            key={option.id}
            selected={value === option.url}
            onClick={() => onChange(option.url)}
            label={name}
          >
            <img
              src={option.url}
              alt={name}
              className="h-full w-full object-cover object-top"
              loading="lazy"
            />
          </Tile>
        );
      })}

      {onCreateCustom && (
        <button
          type="button"
          onClick={onCreateCustom}
          aria-label={t('profile.avatars.createCustom')}
          className={cn(
            'group relative flex flex-col items-center gap-2 rounded-2xl p-2 transition-all',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60',
            'bg-white/[0.04] ring-1 ring-dashed ring-teal-400/40 hover:bg-teal-500/10'
          )}
        >
          <span className="relative w-full aspect-square overflow-hidden rounded-xl bg-gradient-to-b from-teal-500/10 to-teal-700/5 grid place-items-center">
            <Wand2 size={26} className="text-teal-300" />
          </span>
          <span className="text-[11px] font-semibold leading-tight text-teal-200">
            {t('profile.avatars.createCustom')}
          </span>
        </button>
      )}
    </div>
  );
}

export default AvatarPicker;
