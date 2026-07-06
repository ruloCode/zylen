import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useAppStore } from '@/store';

/**
 * Custom hook for internationalization
 *
 * Provides convenient access to:
 * - t: Translation function
 * - language: Current active language
 * - changeLanguage: Function to switch languages
 * - isReady: Whether translations are loaded
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { t, language, changeLanguage } = useLocale();
 *
 *   return (
 *     <div>
 *       <h1>{t('dashboard.title')}</h1>
 *       <button onClick={() => changeLanguage('en')}>English</button>
 *       <button onClick={() => changeLanguage('es')}>Español</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useLocale() {
  const { t: baseT, i18n } = useTranslation();

  // Player identity drives gendered copy. We inject an i18next `context` so that
  // `key_female` / `key_male` variants resolve automatically; neutral (or unset)
  // falls back to the base key. Only 'female' | 'male' produce a context.
  const genderContext = useAppStore((state) =>
    state.user?.gender === 'female' || state.user?.gender === 'male'
      ? state.user.gender
      : undefined
  );

  // Wrapped translation function that injects the gender context by default.
  // Call sites keep using `t('key')` unchanged; an explicit `context` in options
  // still wins. Strings without `_female`/`_male` variants fall back to the base key.
  const t = useCallback(
    ((key: Parameters<TFunction>[0], options?: Parameters<TFunction>[1]) => {
      if (genderContext && (options === undefined || typeof options === 'object')) {
        return baseT(key, { context: genderContext, ...(options as object) });
      }
      return baseT(key, options as never);
    }) as TFunction,
    [baseT, genderContext]
  );

  /**
   * Change the current language
   * @param lang - Language code ('es' | 'en')
   */
  const changeLanguage = async (lang: 'es' | 'en') => {
    await i18n.changeLanguage(lang);
  };

  /**
   * Toggle between Spanish and English
   */
  const toggleLanguage = async () => {
    const newLang = i18n.language === 'es' ? 'en' : 'es';
    await changeLanguage(newLang);
  };

  return {
    /**
     * Translation function
     * @param key - Translation key (e.g., 'dashboard.title')
     * @param options - Interpolation options
     */
    t,

    /**
     * Current active language code
     */
    language: i18n.language as 'es' | 'en',

    /**
     * Change to a specific language
     */
    changeLanguage,

    /**
     * Toggle between Spanish and English
     */
    toggleLanguage,

    /**
     * Whether translations are fully loaded
     */
    isReady: i18n.isInitialized,

    /**
     * List of supported languages
     */
    supportedLanguages: ['es', 'en'] as const,
  };
}
