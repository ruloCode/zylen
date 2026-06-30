/**
 * Login Page
 *
 * Immersive portal-themed entry point for unauthenticated users.
 * Google OAuth + passwordless email (magic link).
 */

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useLocale } from '@/hooks/useLocale';
import { LanguageSwitcher } from '@/features/settings/components/LanguageSwitcher';

const LOGIN_BG = '/login-bg.png';

export function Login() {
  const { user, loading, signInWithOAuth, signInWithPassword, signUpWithPassword } = useAuth();
  const { t } = useLocale();
  const navigate = useNavigate();
  const emailRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
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

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      toast.error(t('auth.enterEmail'));
      emailRef.current?.focus();
      return;
    }
    if (password.length < 6) {
      toast.error(t('auth.passwordTooShort'));
      return;
    }
    setSubmitting(true);
    const { success, error } =
      mode === 'signup'
        ? await signUpWithPassword(value, password)
        : await signInWithPassword(value, password);
    setSubmitting(false);
    if (success) {
      toast.success(mode === 'signup' ? t('auth.accountCreated') : t('auth.welcomeBack'));
      // Navigation happens via the auth state effect once the session is set.
    } else {
      toast.error(error || t('errors.authenticationFailed'));
    }
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
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a1622]/35 via-[#0a1622]/10 to-[#0a1622]" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-transparent to-[#0a1622]" />
      </div>

      {/* Language switcher */}
      <div className="absolute top-5 right-5 z-20 opacity-80">
        <LanguageSwitcher variant="compact" />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 min-h-screen flex flex-col max-w-md mx-auto px-6 pt-[calc(env(safe-area-inset-top)+2.5rem)] pb-8">
        {/* Logo + tagline are baked into the background image — reserve their zone */}
        <div aria-hidden="true" className="min-h-[34vh]" />

        {/* Spacer reveals the portal */}
        <div className="flex-1 min-h-[120px]" />

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

        {/* Email + Password */}
        <form onSubmit={handleEmailSubmit} className="space-y-3">
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
          <div className="relative">
            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2dd4bf]" />
            <input
              type="password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.passwordPlaceholder')}
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/[0.04] border border-white/12 text-white placeholder-white/40 outline-none focus:border-[#4aa8ff]/60 focus:bg-white/[0.06] transition"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-[#2dd4bf] to-[#3b82f6] text-white font-semibold text-[15px] shadow-[0_8px_24px_-6px_rgba(59,130,246,0.6)] hover:brightness-110 active:scale-[0.99] transition disabled:opacity-60"
          >
            {submitting && <Loader2 size={18} className="animate-spin" />}
            {mode === 'signup' ? t('auth.createAccount') : t('auth.signIn')}
          </button>
        </form>

        {/* Toggle sign in / sign up */}
        <p className="text-center text-sm text-white/65 mt-6">
          {mode === 'signup' ? t('auth.haveAccount') : t('auth.noAccount')}{' '}
          <button
            type="button"
            onClick={() => {
              setMode((m) => (m === 'signup' ? 'signin' : 'signup'));
              emailRef.current?.focus();
            }}
            className="text-[#4aa8ff] font-semibold hover:underline"
          >
            {mode === 'signup' ? t('auth.signIn') : t('auth.register')}
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
