/**
 * Supabase Client Configuration (React Native)
 *
 * Mirrors the web client (../../src/lib/supabase.ts) with the RN-specific
 * pieces: AsyncStorage session persistence, PKCE OAuth flow (deep-link based,
 * no URL detection) and AppState-driven token auto-refresh.
 */

import 'react-native-url-polyfill/auto';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { ENV } from './env';

if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase environment variables. ' +
      'Please check mobile/.env and ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set.'
  );
}

export const supabase = createClient<Database>(
  ENV.SUPABASE_URL,
  ENV.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      // No auth redirect ever lands on an app URL in RN; sessions are
      // established explicitly from the OAuth deep link (see AuthContext).
      detectSessionInUrl: false,
      flowType: 'pkce',
      storage: AsyncStorage,
      storageKey: 'everlight_supabase_auth',
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-application-name': 'Everlight',
      },
    },
  }
);

// Refresh tokens only while the app is foregrounded (Supabase RN guidance).
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

/**
 * Helper function to check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return !!session;
}

/**
 * Helper function to get current user
 */
export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting current user:', error);
    return null;
  }
  return user;
}

/**
 * Helper function to sign out
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}
