import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

/**
 * i18n Configuration
 *
 * Configures internationalization for the application with:
 * - Spanish (es) as the default language
 * - English (en) as alternative language
 * - Automatic browser language detection
 * - HTTP backend for loading translation files
 */

i18n
  // Load translations from public/locales
  .use(HttpBackend)
  // Detect user language from browser settings or localStorage
  .use(LanguageDetector)
  // Pass i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    // Fallback language if translation is missing
    fallbackLng: 'es',

    // Default language (Spanish)
    lng: 'es',

    // Supported languages
    supportedLngs: ['es', 'en'],

    // Debug mode (disable in production)
    debug: import.meta.env.DEV,

    // Namespace for translations
    ns: ['translation'],
    defaultNS: 'translation',

    // Interpolation settings
    interpolation: {
      // React already escapes values to prevent XSS
      escapeValue: false,
    },

    // Backend configuration for loading translation files
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    // Language detection options
    detection: {
      // Order of detection methods
      order: ['localStorage', 'navigator'],

      // Cache user language preference
      caches: ['localStorage'],

      // localStorage key for language preference
      lookupLocalStorage: 'i18nextLng',
    },

    // React specific options
    react: {
      // Disable suspense to avoid conflicts with React 18 concurrent rendering
      useSuspense: false,
    },
  });

export default i18n;
