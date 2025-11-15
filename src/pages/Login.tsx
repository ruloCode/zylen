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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-parchment-50 via-gold-50 to-parchment-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
          <p className="mt-4 text-navy-700">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-parchment-50 via-gold-50 to-parchment-100 px-4">
      {/* Language Switcher - Top Right */}
      <div className="absolute top-6 right-6">
        <LanguageSwitcher variant="compact" />
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md">
        {/* Logo and Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4 glow-gold">
            <Logo size="lg" />
          </div>
          <h1 className="text-3xl font-bold text-gradient-gold mb-2">
            {t('app.name')}
          </h1>
          <p className="text-navy-600 text-lg font-medium">
            {t('app.tagline')}
          </p>
        </div>

        {/* Login Card */}
        <div className="rpg-card p-8 rounded-2xl shadow-2xl glow-effect">
          <h2 className="text-xl font-semibold text-navy-800 mb-6 text-center">
            {t('auth.welcomeBack')}
          </h2>

          {/* OAuth Buttons */}
          <OAuthButtons />

          {/* Privacy Notice */}
          <p className="text-xs text-navy-500 text-center mt-6">
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
    <div className="flex items-start gap-3 text-navy-700">
      <span className="text-2xl flex-shrink-0">{icon}</span>
      <div>
        <p className="font-medium text-navy-800">{title}</p>
        <p className="text-sm text-navy-600">{description}</p>
      </div>
    </div>
  );
}
