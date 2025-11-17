/**
 * Login Page
 *
 * Entry point for unauthenticated users.
 * Displays OAuth login options and app branding.
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import { OAuthButtons } from '@/features/auth/components/OAuthButtons';
import { Logo } from '@/components/branding/Logo';
import { useLocale } from '@/hooks/useLocale';
import { LanguageSwitcher } from '@/features/settings/components/LanguageSwitcher';

export function Login() {
  const { user, loading } = useAuth();
  const { t } = useLocale();
  const navigate = useNavigate();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (user && !loading) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[rgb(11,25,29)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[rgb(137,184,32)] mx-auto"></div>
          <p className="mt-4 text-white font-medium">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[rgb(11,25,29)] px-4">
      {/* Language Switcher - Top Right */}
      <div className="absolute top-6 right-6">
        <LanguageSwitcher variant="compact" />
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md">
        {/* Logo and Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <Logo size="lg" />
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2 uppercase tracking-wide">
            {t('app.name')}
          </h1>
          <p className="text-white/85 text-lg font-semibold">
            {t('app.tagline')}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[rgb(23,20,18)] p-8 rounded-none shadow-[0px_0px_4px_0px_rgb(0,0,0)]">
          <h2 className="text-xl font-extrabold text-white mb-6 text-center uppercase tracking-wide">
            {t('auth.welcomeBack')}
          </h2>

          {/* OAuth Buttons */}
          <OAuthButtons />

          {/* Privacy Notice */}
          <p className="text-xs text-white/75 text-center mt-6 font-medium">
            {t('auth.privacyNotice')}
          </p>
        </div>

        {/* Features List */}
        <div className="mt-8 space-y-3">
          <Feature
            icon="🎯"
            title={t('auth.feature1Title')}
            description={t('auth.feature1Desc')}
          />
          <Feature
            icon="⚡"
            title={t('auth.feature2Title')}
            description={t('auth.feature2Desc')}
          />
          <Feature
            icon="🏆"
            title={t('auth.feature3Title')}
            description={t('auth.feature3Desc')}
          />
        </div>
      </div>
    </div>
  );
}

interface FeatureProps {
  icon: string;
  title: string;
  description: string;
}

function Feature({ icon, title, description }: FeatureProps) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-2xl flex-shrink-0">{icon}</span>
      <div>
        <p className="font-bold text-white">{title}</p>
        <p className="text-sm text-white/85 font-medium">{description}</p>
      </div>
    </div>
  );
}
