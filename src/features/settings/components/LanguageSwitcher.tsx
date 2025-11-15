import React from 'react';
import { Languages } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { cn } from '@/utils';

interface LanguageSwitcherProps {
  /**
   * Display variant
   * - 'compact': Icon button with language badge
   * - 'expanded': Full buttons with labels
   */
  variant?: 'compact' | 'expanded';

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Language Switcher Component
 *
 * Allows users to toggle between Spanish and English.
 * Persists language preference to localStorage.
 *
 * @example
 * ```tsx
 * // Compact variant (good for navigation bar)
 * <LanguageSwitcher variant="compact" />
 *
 * // Expanded variant (good for settings page)
 * <LanguageSwitcher variant="expanded" />
 * ```
 */
export function LanguageSwitcher({ variant = 'compact', className }: LanguageSwitcherProps) {
  const { language, changeLanguage } = useLocale();

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={() => changeLanguage(language === 'es' ? 'en' : 'es')}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg',
          'bg-white/80 backdrop-blur-sm',
          'border border-gray-200',
          'hover:bg-gray-50 hover:border-gray-300',
          'transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-gold-400',
          className
        )}
        aria-label={`Switch to ${language === 'es' ? 'English' : 'Spanish'}`}
      >
        <Languages size={18} className="text-gray-600" aria-hidden="true" />
        <span className="text-sm font-semibold text-gray-700 uppercase">
          {language}
        </span>
      </button>
    );
  }

  // Expanded variant
  return (
    <div className={cn('flex gap-2', className)}>
      <button
        type="button"
        onClick={() => changeLanguage('es')}
        className={cn(
          'flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm',
          'transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-gold-400',
          language === 'es'
            ? 'bg-gradient-to-br from-gold-500 to-gold-600 text-white shadow-lg scale-105'
            : 'bg-white/80 text-gray-600 border border-gray-200 hover:bg-gray-50'
        )}
        aria-label="Switch to Spanish"
        aria-pressed={language === 'es'}
      >
        🇪🇸 Español
      </button>
      <button
        type="button"
        onClick={() => changeLanguage('en')}
        className={cn(
          'flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm',
          'transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-gold-400',
          language === 'en'
            ? 'bg-gradient-to-br from-gold-500 to-gold-600 text-white shadow-lg scale-105'
            : 'bg-white/80 text-gray-600 border border-gray-200 hover:bg-gray-50'
        )}
        aria-label="Switch to English"
        aria-pressed={language === 'en'}
      >
        🇺🇸 English
      </button>
    </div>
  );
}

export default LanguageSwitcher;
