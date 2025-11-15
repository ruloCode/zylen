/**
 * TypeScript type definitions for i18next
 *
 * This file extends i18next with type safety for translation keys.
 * It provides autocomplete and compile-time validation of translation keys.
 */

import 'i18next';
import type es from '../../public/locales/es/translation.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    /**
     * Default namespace
     */
    defaultNS: 'translation';

    /**
     * Resources type - uses Spanish translations as the source of truth
     */
    resources: {
      translation: typeof es;
    };

    /**
     * Return type for the `t` function
     * Set to false to allow interpolation without strict typing
     */
    returnNull: false;
  }
}
