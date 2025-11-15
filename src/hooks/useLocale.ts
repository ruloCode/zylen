import { useTranslation } from 'react-i18next';

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
  const { t, i18n } = useTranslation();

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
