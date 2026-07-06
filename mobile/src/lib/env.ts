/**
 * Environment variables (Expo).
 *
 * EXPO_PUBLIC_* vars are inlined into the JS bundle at build time — same
 * visibility model as the web app's VITE_* vars. Values live in mobile/.env.
 */

export const ENV = {
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  OPENAI_API_KEY: process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '',
  HERMES_API_URL: process.env.EXPO_PUBLIC_HERMES_API_URL ?? '',
  HERMES_API_KEY: process.env.EXPO_PUBLIC_HERMES_API_KEY ?? '',
  /** DEV ONLY: run with a mock user + mock data, no Supabase auth. */
  SKIP_AUTH: __DEV__ && process.env.EXPO_PUBLIC_SKIP_AUTH === 'true',
  DEV: __DEV__,
} as const;
