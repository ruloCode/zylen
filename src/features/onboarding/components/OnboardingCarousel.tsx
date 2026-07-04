/**
 * OnboardingCarousel
 *
 * Pre-auth marketing flow shown to unauthenticated users reaching /onboarding
 * from the Welcome splash. Five slides: 4 feature intro slides + a final auth
 * slide (Google + email/password — signs up new users and signs in returning
 * ones). After successful auth the app's normal protected redirect leads the
 * user into the existing multi-step onboarding/profile setup.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useLocale } from '@/hooks/useLocale';
import { ROUTES } from '@/constants';

const PORTAL_BG = '/login-bg.png';

/**
 * Per-slide background art (index = step). Slides without a dedicated image
 * fall back to PORTAL_BG.
 */
const SLIDE_BG: (string | undefined)[] = [
  '/onboarding-1.png',
  '/onboarding-2.png',
  '/onboarding-3.png',
  '/onboarding-4.png',
];

interface CarouselSlide {
  title: string;
  accent: string;
  desc: string;
}

/** Dots indicator (5 steps). */
function Dots({ active }: { active: number }) {
  return (
    <div className="flex items-center justify-center gap-2" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={
            i === active
              ? 'h-2 w-5 rounded-full bg-[#4aa8ff] transition-all'
              : 'h-2 w-2 rounded-full bg-white/25 transition-all'
          }
        />
      ))}
    </div>
  );
}

export function OnboardingCarousel() {
  const { signInWithOAuth, signUpWithPassword, signInWithPassword } = useAuth();
  const { t } = useLocale();
  const navigate = useNavigate();

  const slides = t('onboardingCarousel.slides', { returnObjects: true }) as CarouselSlide[];
  const totalSlides = slides.length + 1; // + auth slide
  const authIndex = slides.length;

  const [step, setStep] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const goToAuth = () => setStep(authIndex);
  const next = () => setStep((s) => Math.min(s + 1, totalSlides - 1));

  const handleGoogle = async () => {
    await signInWithOAuth('google');
  };

  const handleEmailContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      toast.error(t('auth.enterEmail'));
      return;
    }
    if (password.length < 6) {
      toast.error(t('auth.passwordTooShort'));
      return;
    }
    setSubmitting(true);
    // Try to create the account; if the email already exists, sign in instead,
    // so the same form works for new and returning users.
    let res = await signUpWithPassword(value, password);
    let returning = false;
    if (!res.success && res.errorCode === 'user_already_exists') {
      returning = true;
      res = await signInWithPassword(value, password);
    }
    setSubmitting(false);
    if (res.success) toast.success(returning ? t('auth.welcomeBack') : t('auth.accountCreated'));
    else toast.error(t((res.errorKey ?? 'errors.authenticationFailed') as any));
  };

  const isAuthSlide = step === authIndex;
  const bg = SLIDE_BG[step] ?? PORTAL_BG;
  const slide: CarouselSlide | undefined = slides[step];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0a1622] text-white">
      {/* ── Portal background ── */}
      <div className="absolute inset-0 -z-0">
        <img src={bg} alt="" aria-hidden="true" className="w-full h-full object-cover object-top" />
        <div
          className={`absolute inset-0 bg-gradient-to-b ${
            isAuthSlide
              ? 'from-[#0a1622]/35 via-[#0a1622]/10 to-[#0a1622]'
              : 'from-[#0a1622]/65 via-[#0a1622]/35 to-[#0a1622]'
          }`}
        />
        <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-b from-transparent via-[#0a1622]/70 to-[#0a1622]" />
      </div>

      {/* Skip (hidden on auth slide) */}
      {!isAuthSlide && (
        <div className="absolute top-5 right-5 z-20">
          <button
            type="button"
            onClick={goToAuth}
            className="text-sm font-semibold text-white/70 hover:text-white transition"
          >
            {t('onboardingCarousel.skip')}
          </button>
        </div>
      )}

      {/* ── Content ── */}
      <div className="relative z-10 min-h-screen flex flex-col max-w-md mx-auto px-6 pt-[calc(env(safe-area-inset-top)+3.5rem)] pb-8">
        {isAuthSlide ? (
          <>
            {/* Logo + tagline are baked into the background image — reserve their zone */}
            <div aria-hidden="true" className="flex-1 min-h-[36vh]" />

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
                  autoComplete="new-password"
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
                {t('auth.createAccount')}
              </button>
            </form>

            {/* Sign in */}
            <p className="text-center text-sm text-white/65 mt-6">
              {t('welcome.haveAccount')}{' '}
              <button
                type="button"
                onClick={() => navigate(ROUTES.LOGIN)}
                className="text-[#4aa8ff] font-semibold hover:underline"
              >
                {t('welcome.signIn')}
              </button>
            </p>
          </>
        ) : (
          <>
            <div className="flex-1 min-h-[40px]" />

            <div className="relative flex flex-col items-center text-center">
              {/* Readability scrim: soft dark halo behind the copy so text
                  stays legible over bright areas of the artwork (WCAG contrast). */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-x-10 -inset-y-12 -z-10 rounded-[40px] bg-[radial-gradient(ellipse_at_center,rgba(5,9,13,0.9)_0%,rgba(5,9,13,0.65)_45%,transparent_78%)] blur-xl"
              />
              <h2 className="text-[26px] leading-tight font-extrabold [text-shadow:0_2px_14px_rgba(0,0,0,0.85)]">
                <span className="text-white">{slide?.title} </span>
                <span className="text-[#7cc4ff]">{slide?.accent}</span>
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-white/90 px-2 [text-shadow:0_1px_10px_rgba(0,0,0,0.85)]">
                {slide?.desc}
              </p>
            </div>

            <div className="flex-1 min-h-[40px]" />

            {/* Dots */}
            <div className="mb-6">
              <Dots active={step} />
            </div>

            {/* Next */}
            <button
              type="button"
              onClick={next}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-[#2dd4bf] to-[#3b82f6] text-white font-semibold text-[15px] shadow-[0_8px_24px_-6px_rgba(59,130,246,0.6)] hover:brightness-110 active:scale-[0.99] transition"
            >
              {t('onboardingCarousel.next')}
              <ArrowRight size={18} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default OnboardingCarousel;
