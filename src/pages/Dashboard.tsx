import React from 'react';
import { Sparkles, TrendingUp, Zap } from 'lucide-react';
import { LifeAreaCard } from '@/features/dashboard/components';
import { StreakDisplay } from '@/features/streaks/components';
import { LanguageSwitcher } from '@/features/settings/components';
import { Button, LevelBadge, ProgressBar } from '@/components/ui';
import { useNavigate } from 'react-router-dom';
import { useUser, useLifeAreas, useStreaks } from '@/store';
import { ROUTES, APP_CONFIG } from '@/constants';
import { useLocale } from '@/hooks/useLocale';
import { getLevelProgress } from '@/utils/xp';
import ruloAvatar from '../assets/rulo_avatar.png';

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { lifeAreas } = useLifeAreas();
  const { streak } = useStreaks();
  const { t } = useLocale();

  // Calculate progress to next level
  const levelProgress = user
    ? getLevelProgress(user.totalXPEarned, user.level)
    : { current: 0, max: 0, percentage: 0 };
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
          <p className="text-gray-700 text-base font-semibold">{t('app.tagline')}</p>
        </header>

        {/* User Stats Card */}
        <section aria-labelledby="stats-heading" className="bg-white rounded-3xl p-6 mb-6 text-center shadow-lg border border-white/20">
          <img
            src={ruloAvatar}
            alt="Rulo Avatar"
            className="w-32 mx-auto mb-4 float-animation object-contain"
          />

          {/* Global Level */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <LevelBadge level={user?.level || 1} size="lg" />
          </div>

          {/* XP Progress */}
          <div className="mb-6">
            <ProgressBar
              current={levelProgress.current}
              max={levelProgress.max}
              variant="gold"
              size="md"
              showLabel={false}
            />
            <p className="text-xs text-gray-500 mt-1">
              {levelProgress.max - levelProgress.current} XP to Level {(user?.level || 1) + 1}
            </p>
          </div>

          {/* Points */}
          <div className="text-5xl font-bold text-gray-900 mb-2" aria-live="polite">
            {user?.points?.toLocaleString() || 0}
          </div>
          <div className="text-base text-gray-700 font-semibold flex items-center justify-center gap-2" id="stats-heading">
            <TrendingUp size={18} className="text-success-600" aria-hidden="true" />
            <span>{t('common.points')}</span>
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