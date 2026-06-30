/**
 * Welcome Page
 *
 * Full-screen portal splash for unauthenticated users — the landing entry.
 * Leads into the pre-auth onboarding carousel (CTA) and keeps /login reachable.
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useLocale } from '@/hooks/useLocale';
import { LanguageSwitcher } from '@/features/settings/components/LanguageSwitcher';
import { ROUTES } from '@/constants';

const LOGIN_BG = '/login-bg.png';

export function Welcome() {
  const { user, loading } = useAuth();
  const { t } = useLocale();
  const navigate = useNavigate();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (user && !loading) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

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
        {/* Logo + tagline are baked into the background image — reserve their zone */}
        <div aria-hidden="true" className="flex-1 min-h-[40vh]" />

        {/* Hero copy */}
        <div className="text-center mb-6">
          <h2 className="text-[28px] leading-tight font-extrabold">
            <span className="text-white">{t('welcome.heroTitle1')}</span>
            <br />
            <span className="text-[#4aa8ff]">{t('welcome.heroTitle2')}</span>
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-white/70">
            {t('welcome.heroSubtitle')}
          </p>
        </div>

        {/* Decorative carousel dots */}
        <div className="flex items-center justify-center gap-2 mb-6" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className={
                i === 0
                  ? 'h-2 w-5 rounded-full bg-[#4aa8ff]'
                  : 'h-2 w-2 rounded-full bg-white/25'
              }
            />
          ))}
        </div>

        {/* Primary CTA */}
        <button
          type="button"
          onClick={() => navigate(ROUTES.ONBOARDING)}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-[#2dd4bf] to-[#3b82f6] text-white font-semibold text-[15px] shadow-[0_8px_24px_-6px_rgba(59,130,246,0.6)] hover:brightness-110 active:scale-[0.99] transition"
        >
          {t('welcome.cta')}
          <ArrowRight size={18} />
        </button>

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
      </div>
    </div>
  );
}

export default Welcome;
