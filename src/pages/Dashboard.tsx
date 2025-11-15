import React, { useState } from 'react';
import { Sparkles, TrendingUp, Loader2 } from 'lucide-react';
import { LifeAreaCard, LifeAreaModal } from '@/features/dashboard/components';
import { StreakDisplay } from '@/features/streaks/components';
import { Button, LevelBadge, ProgressBar } from '@/components/ui';
import { useNavigate } from 'react-router-dom';
import { useUser, useLifeAreas, useStreaks } from '@/store';
import { ROUTES, APP_CONFIG } from '@/constants';
import { useLocale } from '@/hooks/useLocale';
import { getLevelProgress } from '@/utils/xp';
import ruloAvatar from '@/assets/rulo_avatar.png';

export function Dashboard() {
  const navigate = useNavigate();
  const { user, isLoading: userLoading } = useUser();
  const { lifeAreas, lifeAreasInitialized } = useLifeAreas();
  const { streak, isLoading: streakLoading } = useStreaks();
  const { t } = useLocale();

  // Modal state
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);

  // Calculate progress to next level
  const levelProgress = user
    ? getLevelProgress(user.totalXPEarned, user.level)
    : { current: 0, max: 0, percentage: 0 };

  // Loading state - show spinner while any critical data is loading
  const isLoading = userLoading || !lifeAreasInitialized || streakLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-teal-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-700 font-semibold">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return <div className="min-h-screen pb-24 px-4 pt-16">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gradient-gold mb-3 tracking-tight">
            {APP_CONFIG.displayName}
          </h1>
          <p className="text-gray-700 text-base font-semibold">{t('app.tagline')}</p>
        </header>

        {/* User Stats Card */}
        <section aria-labelledby="stats-heading" className="bg-white rounded-3xl p-6 mb-6 text-center shadow-lg border border-white/20">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name || 'User Avatar'}
              className="w-32 h-32 mx-auto mb-4 float-animation object-cover rounded-full"
            />
          ) : (
            <div className="w-32 h-32 mx-auto mb-4 float-animation rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
              <span className="text-5xl font-bold text-white">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
          )}

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
            {lifeAreas.map(area => <LifeAreaCard key={area.area} {...area} onClick={() => setSelectedAreaId(area.id)} />)}
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

      {/* Life Area Modal */}
      <LifeAreaModal
        lifeAreaId={selectedAreaId}
        isOpen={selectedAreaId !== null}
        onClose={() => setSelectedAreaId(null)}
      />
    </div>;
}