/**
 * Auth Callback Page
 *
 * Handles OAuth redirect after successful authentication.
 * Processes the auth code and redirects to the app.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useLocale } from '@/hooks/useLocale';
import { Logo } from '@/components/branding/Logo';
import { ROUTES } from '@/constants/routes';

export function AuthCallback() {
  const navigate = useNavigate();
  const { t } = useLocale();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the auth code from URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          // Set the session
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) throw sessionError;

          // Check if user has completed onboarding
          const { data: { user } } = await supabase.auth.getUser();

          if (user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('has_completed_onboarding')
              .eq('id', user.id)
              .single();

            // Redirect to onboarding or dashboard
            if (profile?.has_completed_onboarding) {
              navigate(ROUTES.DASHBOARD, { replace: true });
            } else {
              // New user - redirect to onboarding
              navigate(ROUTES.ONBOARDING, { replace: true });
            }
          }
        } else {
          throw new Error('No access token received');
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-charcoal-950 via-charcoal-900 to-charcoal-950 px-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center mb-6">
          <Logo size="lg" />
        </div>

        {error ? (
          <>
            <div className="text-danger-400 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-pale-50 mb-2">
              {t('errors.authenticationFailed')}
            </h1>
            <p className="text-pale-400 mb-4">{error}</p>
            <p className="text-sm text-pale-500">
              {t('auth.redirectingToLogin')}
            </p>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-500 mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-pale-50 mb-2">
              {t('auth.completingSignIn')}
            </h1>
            <p className="text-pale-400">
              {t('auth.pleaseWait')}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
