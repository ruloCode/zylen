/**
 * Authentication Context
 *
 * Provides authentication state and methods throughout the app.
 * Handles user session management, loading states, and auth events.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

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

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithOAuth: (provider: 'google' | 'github') => Promise<void>;
  signInWithEmail: (email: string) => Promise<{ success: boolean }>;
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

  const signInWithEmail = async (email: string): Promise<{ success: boolean }> => {
    if (shouldSkipAuth) {
      setUser(devUser);
      setSession(null);
      setLoading(false);
      return { success: true };
    }

    try {
      setError(null);
      setLoading(true);

      // Passwordless magic link / OTP
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error('Email sign in error:', err);
      setError(err as AuthError);
      return { success: false };
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
    signInWithEmail,
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
