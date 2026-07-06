/**
 * Authentication Context (React Native)
 *
 * Mirrors the web AuthContext API exactly (user/session/loading/error +
 * signInWithOAuth/signInWithPassword/signUpWithPassword/signOut) so ported
 * screens keep working unchanged. OAuth swaps the browser redirect for the
 * native flow: expo-web-browser auth session + PKCE code exchange from the
 * zylen:// deep link.
 *
 * NOTE: `zylen://auth/callback` (and the exp:// dev-client variant) must be
 * registered in Supabase Dashboard > Auth > URL Configuration > Redirect URLs.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';
import { ENV } from '@/lib/env';

WebBrowser.maybeCompleteAuthSession();

const shouldSkipAuth = ENV.SKIP_AUTH;

const devUser = {
  id: 'local-dev-user',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'local@zylen.dev',
  email_confirmed_at: new Date().toISOString(),
  phone: '',
  confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  app_metadata: {
    provider: 'local-dev',
    providers: ['local-dev'],
  },
  user_metadata: {
    name: 'Local Dev',
  },
  identities: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
} as User;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithOAuth: (provider: 'google' | 'github') => Promise<void>;
  signInWithPassword: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  signUpWithPassword: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  error: AuthError | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Establish a Supabase session from the OAuth redirect URL that the auth
 * session browser hands back (PKCE `code` param, or token fragment as a
 * defensive fallback).
 */
async function createSessionFromUrl(url: string): Promise<void> {
  const parsed = Linking.parse(url);
  const params = parsed.queryParams ?? {};

  const errorDescription = params['error_description'];
  if (typeof errorDescription === 'string' && errorDescription) {
    throw new Error(errorDescription);
  }

  const code = params['code'];
  if (typeof code === 'string' && code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return;
  }

  // Implicit-flow fallback: tokens arrive in the URL fragment.
  const fragment = url.split('#')[1];
  if (fragment) {
    const fragmentParams = new URLSearchParams(fragment);
    const access_token = fragmentParams.get('access_token');
    const refresh_token = fragmentParams.get('refresh_token');
    if (access_token && refresh_token) {
      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
      if (error) throw error;
    }
  }
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  useEffect(() => {
    if (shouldSkipAuth) {
      setSession(null);
      setUser(devUser);
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithOAuth = async (provider: 'google' | 'github') => {
    if (shouldSkipAuth) {
      setUser(devUser);
      setSession(null);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      setLoading(true);

      // zylen://auth/callback in production builds; exp://.../auth/callback in dev.
      const redirectTo = Linking.createURL('auth/callback');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
      if (!data?.url) throw new Error('No OAuth URL returned by Supabase');

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type === 'success' && result.url) {
        await createSessionFromUrl(result.url);
      }
    } catch (err) {
      console.error('OAuth sign in error:', err);
      setError(err as AuthError);
    } finally {
      setLoading(false);
    }
  };

  const signInWithPassword = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (shouldSkipAuth) {
      setUser(devUser);
      setSession(null);
      setLoading(false);
      return { success: true };
    }

    try {
      setError(null);
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error('Email sign in error:', err);
      setError(err as AuthError);
      return { success: false, error: (err as AuthError)?.message };
    } finally {
      setLoading(false);
    }
  };

  const signUpWithPassword = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (shouldSkipAuth) {
      setUser(devUser);
      setSession(null);
      setLoading(false);
      return { success: true };
    }

    try {
      setError(null);
      setLoading(true);

      // Email confirmation is disabled (mailer_autoconfirm), so signUp returns a
      // session immediately and onAuthStateChange establishes the user.
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      // Defensive: if the project still requires confirmation, no session is
      // returned. Surface that instead of silently appearing to succeed.
      if (!data.session) {
        return {
          success: false,
          error: 'Account created but no active session. Email confirmation may be enabled.',
        };
      }
      return { success: true };
    } catch (err) {
      console.error('Email sign up error:', err);
      setError(err as AuthError);
      return { success: false, error: (err as AuthError)?.message };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    if (shouldSkipAuth) {
      setUser(devUser);
      setSession(null);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      setLoading(true);

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setSession(null);
    } catch (err) {
      console.error('Sign out error:', err);
      setError(err as AuthError);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    session,
    loading,
    signInWithOAuth,
    signInWithPassword,
    signUpWithPassword,
    signOut,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
