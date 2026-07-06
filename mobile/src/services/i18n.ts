import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { kv } from '@/lib/kvStorage';
import es from '@/i18n/locales/es/translation.json';
import en from '@/i18n/locales/en/translation.json';

/**
 * i18n Configuration (React Native)
 *
 * Translations are BUNDLED (no HTTP backend on native). Language preference
 * persists through kvStorage. Like the web app, first launch always starts
 * in Spanish — device language is intentionally ignored; only an explicit
 * user choice (persisted under `i18nextLng`) switches to English.
 *
 * IMPORTANT: initI18n() must run AFTER kv.hydrate() so the stored language
 * preference is readable synchronously (see app/_layout.tsx).
 */

const LANGUAGE_KEY = 'i18nextLng';

export function initI18n(): void {
  if (i18n.isInitialized) return;

  const stored = kv.getItem(LANGUAGE_KEY);
  const lng = stored === 'en' || stored === 'es' ? stored : 'es';

  void i18n.use(initReactI18next).init({
    resources: {
      es: { translation: es },
      en: { translation: en },
    },
    lng,
    fallbackLng: 'es',
    supportedLngs: ['es', 'en'],
    ns: ['translation'],
    defaultNS: 'translation',
    interpolation: {
      // React already escapes values to prevent XSS
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

  // Persist the preference on every explicit change (mirrors the web
  // localStorage cache used by i18next-browser-languagedetector).
  i18n.on('languageChanged', (language) => {
    kv.setItem(LANGUAGE_KEY, language);
  });
}

export default i18n;
