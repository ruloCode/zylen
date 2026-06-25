import React, { useRef } from 'react';
import { Check } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { useTheme } from '@/hooks/useTheme';
import { THEMES, ThemeMeta } from '@/constants/themes';
import { ThemeId } from '@/utils/theme';
import { cn } from '@/utils';

interface ThemeSelectorProps {
  /**
   * Display variant
   * - 'grid': preview cards in a responsive grid (default, used in Settings/Onboarding)
   * - 'compact': a horizontal row of small swatch chips (for tight spaces)
   */
  variant?: 'grid' | 'compact';
  className?: string;
}

/**
 * VS-Code-style theme palette picker. Each card previews a theme's
 * background / surface / text / accent and selecting one re-styles the
 * entire app instantly (via the themeSlice -> data-theme attribute).
 *
 * Accessible: role="radiogroup" + roving-tabindex radios with full
 * keyboard navigation (Arrows / Home / End / Space / Enter).
 */
export function ThemeSelector({ variant = 'grid', className }: ThemeSelectorProps) {
  const { t } = useLocale();
  const { theme, setTheme } = useTheme();
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const selectedIndex = Math.max(
    0,
    THEMES.findIndex((th) => th.id === theme)
  );

  const focusItem = (index: number) => {
    const clamped = (index + THEMES.length) % THEMES.length;
    const id = THEMES[clamped].id;
    setTheme(id);
    itemRefs.current[clamped]?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        focusItem(index + 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        focusItem(index - 1);
        break;
      case 'Home':
        e.preventDefault();
        focusItem(0);
        break;
      case 'End':
        e.preventDefault();
        focusItem(THEMES.length - 1);
        break;
      case ' ':
      case 'Enter':
        e.preventDefault();
        setTheme(THEMES[index].id);
        break;
      default:
        break;
    }
  };

  const renderCard = (th: ThemeMeta, index: number) => {
    const isSelected = th.id === theme;
    const name = t(th.nameKey);
    const desc = t(th.descKey);

    if (variant === 'compact') {
      return (
        <button
          key={th.id}
          ref={(el) => (itemRefs.current[index] = el)}
          type="button"
          role="radio"
          aria-checked={isSelected}
          aria-label={name}
          tabIndex={index === selectedIndex ? 0 : -1}
          onClick={() => setTheme(th.id)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          className={cn(
            'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
            'border-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            isSelected ? 'border-primary scale-110' : 'border-transparent hover:scale-105'
          )}
          style={{ background: th.swatch.bg }}
          title={name}
        >
          <span
            className="h-3.5 w-3.5 rounded-full"
            style={{ background: th.swatch.accent }}
            aria-hidden="true"
          />
          {isSelected && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Check size={10} strokeWidth={3} aria-hidden="true" />
            </span>
          )}
        </button>
      );
    }

    // Grid variant — full preview card with mini mockup
    return (
      <button
        key={th.id}
        ref={(el) => (itemRefs.current[index] = el)}
        type="button"
        role="radio"
        aria-checked={isSelected}
        aria-label={`${name} — ${desc}`}
        tabIndex={index === selectedIndex ? 0 : -1}
        onClick={() => setTheme(th.id)}
        onKeyDown={(e) => handleKeyDown(e, index)}
        className={cn(
          'group relative overflow-hidden rounded-2xl border-2 text-left transition-all duration-200',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          isSelected
            ? 'border-primary shadow-soft-lg scale-[1.02]'
            : 'border-border hover:border-primary/50 hover:scale-[1.01]'
        )}
      >
        {/* Mini mockup preview */}
        <div className="p-3" style={{ background: th.swatch.bg }} aria-hidden="true">
          <div
            className="flex h-20 flex-col justify-between rounded-lg p-2.5"
            style={{ background: th.swatch.surface }}
          >
            <div className="space-y-1.5">
              <div
                className="h-2 w-3/5 rounded-full"
                style={{ background: th.swatch.text }}
              />
              <div
                className="h-2 w-2/5 rounded-full opacity-60"
                style={{ background: th.swatch.text }}
              />
            </div>
            <div className="flex justify-end">
              <div
                className="h-4 w-12 rounded-md"
                style={{ background: th.swatch.accent }}
              />
            </div>
          </div>
        </div>

        {/* Label */}
        <div className="flex items-start justify-between gap-2 bg-surface p-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-foreground">{name}</p>
            <p className="truncate text-xs text-[hsl(var(--text-tertiary))]">{desc}</p>
          </div>
          {isSelected && (
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Check size={12} strokeWidth={3} aria-hidden="true" />
            </span>
          )}
        </div>
      </button>
    );
  };

  return (
    <div
      role="radiogroup"
      aria-label={t('themes.ariaLabel')}
      className={cn(
        variant === 'compact'
          ? 'flex gap-2 overflow-x-auto pb-1'
          : 'grid grid-cols-2 gap-3 sm:grid-cols-3',
        className
      )}
    >
      {THEMES.map((th, i) => renderCard(th, i))}
    </div>
  );
}

export default ThemeSelector;

// re-export for convenience
export type { ThemeId };
