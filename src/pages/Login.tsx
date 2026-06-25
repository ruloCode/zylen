/**
 * Login Page
 *
 * Immersive portal-themed entry point for unauthenticated users.
 * Google OAuth + passwordless email (magic link).
 */

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Mountain, Gem, Mail, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useLocale } from '@/hooks/useLocale';
import { LanguageSwitcher } from '@/features/settings/components/LanguageSwitcher';

const LOGIN_BG = '/login-bg.png';

/** Faceted crystal emblem (matches the reference brand mark). */
function CrystalLogo() {
  return (
    <svg
      width={62}
      height={74}
      viewBox="0 0 64 76"
      fill="none"
      className="drop-shadow-[0_0_22px_rgba(80,170,255,0.85)]"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="crystalFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d6f1ff" />
          <stop offset="0.5" stopColor="#54acff" />
          <stop offset="1" stopColor="#1e63d6" />
        </linearGradient>
      </defs>
      {/* pavilion */}
      <polygon points="14,26 32,74 32,26" fill="#2f86e8" opacity="0.9" />
      <polygon points="50,26 32,74 32,26" fill="#1b59bd" opacity="0.95" />
      {/* crown */}
      <polygon points="32,2 14,26 50,26" fill="url(#crystalFill)" />
      <polygon points="32,2 32,26 14,26" fill="#a9dcff" opacity="0.65" />
      <polygon points="32,2 50,26 32,26" fill="#6fb8ff" opacity="0.8" />
      {/* center sparkle line */}
      <polygon points="32,2 30,26 34,26" fill="#eaf7ff" opacity="0.9" />
    </svg>
  );
}

interface HeroFeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function HeroFeature({ icon, title, description }: HeroFeatureProps) {
  return (
    <div className="flex flex-col items-center text-center gap-2 px-1">
      <div className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-white text-[13px] font-bold leading-tight">{title}</p>
        <p className="text-white/55 text-[11px] leading-tight mt-0.5">{description}</p>
      </div>
    </div>
  );
}

export function Login() {
  const { user, loading, signInWithOAuth, signInWithEmail } = useAuth();
  const { t } = useLocale();
  const navigate = useNavigate();
  const emailRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (user && !loading) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleGoogle = async () => {
    await signInWithOAuth('google');
  };

  const handleEmailContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      toast.error(t('auth.enterEmail'));
      emailRef.current?.focus();
      return;
    }
    setSubmitting(true);
    const { success } = await signInWithEmail(value);
    setSubmitting(false);
    if (success) toast.success(t('auth.emailSent'));
    else toast.error(t('errors.authenticationFailed'));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a1622]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#4aa8ff] animate-spin mx-auto" />
          <p className="mt-4 text-white font-medium">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0a1622] text-white">
      {/* ── Portal background ── */}
      <div className="absolute inset-0 -z-0">
        <img src={LOGIN_BG} alt="" aria-hidden="true" className="w-full h-full object-cover object-top" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a1622]/40 via-[#0a1622]/10 to-[#0a1622]" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-transparent to-[#0a1622]" />
      </div>

      {/* Language switcher */}
      <div className="absolute top-5 right-5 z-20 opacity-80">
        <LanguageSwitcher variant="compact" />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 min-h-screen flex flex-col max-w-md mx-auto px-6 pt-[calc(env(safe-area-inset-top)+2.5rem)] pb-8">
        {/* Brand */}
        <div className="flex flex-col items-center text-center">
          <CrystalLogo />
          <h1 className="mt-4 text-3xl font-bold tracking-[0.32em] text-white pl-[0.32em]">
            {t('app.name').toUpperCase()}
          </h1>
          <div className="flex items-center gap-2 my-3 w-44">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-white/30" />
            <span className="w-1.5 h-1.5 rotate-45 bg-[#4aa8ff]" />
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-white/30" />
          </div>
          <p className="text-[13px] font-semibold tracking-wider text-white/80 uppercase">
            {t('auth.tagline')}{' '}
            <span className="text-[#4aa8ff]">{t('auth.taglineAccent')}</span>
          </p>
        </div>

        {/* Spacer reveals the portal */}
        <div className="flex-1 min-h-[120px]" />

        {/* Feature highlights */}
        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-white/[0.06] backdrop-blur-md border border-white/10 p-4 mb-5">
          <HeroFeature
            icon={<Target size={20} className="text-[#2dd4bf]" />}
            title={t('auth.heroFeature1Title')}
            description={t('auth.heroFeature1Desc')}
          />
          <HeroFeature
            icon={<Mountain size={20} className="text-[#a855f7]" />}
            title={t('auth.heroFeature2Title')}
            description={t('auth.heroFeature2Desc')}
          />
          <HeroFeature
            icon={<Gem size={20} className="text-[#4aa8ff]" />}
            title={t('auth.heroFeature3Title')}
            description={t('auth.heroFeature3Desc')}
          />
        </div>

        {/* Google */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={submitting}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl bg-white text-[#1a1a1a] font-semibold text-[15px] shadow-lg hover:bg-white/95 active:scale-[0.99] transition disabled:opacity-60"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {t('auth.continueWithGoogle')}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <span className="h-px flex-1 bg-white/12" />
          <span className="text-white/45 text-xs">{t('auth.orContinueWith')}</span>
          <span className="h-px flex-1 bg-white/12" />
        </div>

        {/* Email + Continue */}
        <form onSubmit={handleEmailContinue} className="space-y-3">
          <div className="relative">
            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2dd4bf]" />
            <input
              ref={emailRef}
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.emailPlaceholder')}
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/[0.04] border border-white/12 text-white placeholder-white/40 outline-none focus:border-[#4aa8ff]/60 focus:bg-white/[0.06] transition"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-[#2dd4bf] to-[#3b82f6] text-white font-semibold text-[15px] shadow-[0_8px_24px_-6px_rgba(59,130,246,0.6)] hover:brightness-110 active:scale-[0.99] transition disabled:opacity-60"
          >
            {submitting && <Loader2 size={18} className="animate-spin" />}
            {t('auth.continue')}
          </button>
        </form>

        {/* Register */}
        <p className="text-center text-sm text-white/65 mt-6">
          {t('auth.noAccount')}{' '}
          <button
            type="button"
            onClick={() => emailRef.current?.focus()}
            className="text-[#4aa8ff] font-semibold hover:underline"
          >
            {t('auth.register')}
          </button>
        </p>

        {/* Terms */}
        <p className="text-center text-[11px] leading-relaxed text-white/40 mt-5">
          {t('auth.termsPrefix')}{' '}
          <a href="#" className="text-[#4aa8ff]/80 hover:underline">{t('auth.termsOfService')}</a>{' '}
          {t('auth.and')}{' '}
          <a href="#" className="text-[#4aa8ff]/80 hover:underline">{t('auth.privacyPolicy')}</a>.
        </p>
      </div>
    </div>
  );
}

export default Login;
