/**
 * Authentication Context
 *
 * Provides authentication state and methods throughout the app.
 * Handles user session management, loading states, and auth events.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError, AuthApiError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

/**
 * Maps Supabase auth error codes to translation keys so the UI never shows
 * raw (English-only) provider messages. Unmapped codes fall back to the
 * generic errors.authenticationFailed key.
 */
const AUTH_ERROR_KEYS: Record<string, string> = {
  invalid_credentials: 'errors.auth.invalidCredentials',
  user_already_exists: 'errors.auth.userAlreadyExists',
  weak_password: 'errors.auth.weakPassword',
  over_request_rate_limit: 'errors.auth.rateLimited',
  over_email_send_rate_limit: 'errors.auth.emailRateLimited',
  signup_disabled: 'errors.auth.signupDisabled',
};

function authErrorKey(err: unknown): string {
  const code = (err as AuthApiError)?.code;
  return (code && AUTH_ERROR_KEYS[code]) || 'errors.authenticationFailed';
}

const shouldSkipAuth =
  import.meta.env.DEV && import.meta.env.VITE_SKIP_AUTH === 'true';

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

interface AuthResult {
  success: boolean;
  /** Translation key describing the failure (never a raw provider message). */
  errorKey?: string;
  /** Supabase auth error code, for callers that need to branch on it. */
  errorCode?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithOAuth: (provider: 'google' | 'github') => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<AuthResult>;
  signUpWithPassword: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  error: AuthError | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
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

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
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
  ): Promise<AuthResult> => {
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
      return {
        success: false,
        errorKey: authErrorKey(err),
        errorCode: (err as AuthApiError)?.code,
      };
    } finally {
      setLoading(false);
    }
  };

  const signUpWithPassword = async (
    email: string,
    password: string
  ): Promise<AuthResult> => {
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
        return { success: false, errorKey: 'errors.auth.confirmEmail' };
      }
      return { success: true };
    } catch (err) {
      console.error('Email sign up error:', err);
      setError(err as AuthError);
      return {
        success: false,
        errorKey: authErrorKey(err),
        errorCode: (err as AuthApiError)?.code,
      };
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
