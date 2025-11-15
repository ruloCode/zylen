import React, { useMemo } from 'react';
import { Sparkles, TrendingUp } from 'lucide-react';
import { LifeAreaCard } from '@/features/dashboard/components';
import { StreakDisplay } from '@/features/streaks/components';
import { LanguageSwitcher } from '@/features/settings/components';
import { Button } from '@/components/ui';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import { ROUTES, APP_CONFIG } from '@/constants';
import { useLocale } from '@/hooks/useLocale';
import ruloAvatar from '../assets/rulo_avatar.png';

export function Dashboard() {
  const navigate = useNavigate();
  const user = useAppStore((state) => state.user);
  const streak = useAppStore((state) => state.streak);
  const { t } = useLocale();

  // TODO: Calculate life areas from actual habit completions
  const lifeAreas = useMemo(() => [{
    area: 'Health' as const,
    level: 5,
    currentXP: 320,
    maxXP: 500
  }, {
    area: 'Finance' as const,
    level: 3,
    currentXP: 180,
    maxXP: 300
  }, {
    area: 'Creativity' as const,
    level: 4,
    currentXP: 250,
    maxXP: 400
  }, {
    area: 'Social' as const,
    level: 6,
    currentXP: 450,
    maxXP: 600
  }, {
    area: 'Family' as const,
    level: 4,
    currentXP: 300,
    maxXP: 400
  }, {
    area: 'Career' as const,
    level: 7,
    currentXP: 580,
    maxXP: 700
  }], []);
  return <div className="min-h-screen pb-24 px-4 pt-8">
      <div className="max-w-md mx-auto">
        {/* Language Switcher */}
        <div className="flex justify-end mb-4">
          <LanguageSwitcher variant="compact" />
        </div>

        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gradient-gold mb-3 tracking-tight">
            {APP_CONFIG.displayName}
          </h1>
          <p className="text-gray-700 text-base font-semibold">{APP_CONFIG.tagline}</p>
        </header>

        {/* Points & Avatar */}
        <section aria-labelledby="points-heading" className="bg-white rounded-3xl p-6 mb-6 text-center shadow-lg border border-white/20">
          <img
            src={ruloAvatar}
            alt="Rulo Avatar"
            className="w-32 mx-auto mb-4 float-animation object-contain"
          />
          <div className="text-5xl font-bold text-gray-900 mb-2" aria-live="polite">
            {user?.points?.toLocaleString() || 0}
          </div>
          <div className="text-base text-gray-700 font-semibold flex items-center justify-center gap-2" id="points-heading">
            <TrendingUp size={18} className="text-success-600" aria-hidden="true" />
            <span>{t('common.totalPoints')}</span>
          </div>
        </section>

        {/* Streak */}
        {streak && (
          <section aria-labelledby="streak-heading" className="glass-card rounded-3xl mb-6">
            <StreakDisplay
              streak={streak.currentStreak}
              weeklyStreak={streak.weeklyStreak}
              lastSevenDays={streak.lastSevenDays}
              size="lg"
            />
          </section>
        )}

        {/* Life Areas */}
        <section aria-labelledby="life-areas-heading" className="mb-8">
          <h2 id="life-areas-heading" className="text-2xl font-bold text-gray-900 mb-5">{t('dashboard.lifeAreas')}</h2>
          <div className="grid grid-cols-2 gap-4">
            {lifeAreas.map(area => <LifeAreaCard key={area.area} {...area} />)}
          </div>
        </section>

        {/* CTA */}
        <Button variant="primary-gold" size="lg" className="w-full mb-4" onClick={() => navigate(ROUTES.HABITS)}>
          <Sparkles size={20} aria-hidden="true" />
          {t('dashboard.logHabits')}
        </Button>

        <p className="text-center text-base text-gray-700 font-semibold">
          {t('dashboard.keepGoing')}
        </p>
      </div>
    </div>;
}