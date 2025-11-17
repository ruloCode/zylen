import React, { useMemo } from 'react';
import { Trophy, Award, Zap } from 'lucide-react';
import { StreakDisplay } from '@/features/streaks/components';
import { useAppStore } from '@/store';
import { useLocale } from '@/hooks/useLocale';

export function Streaks() {
  const streak = useAppStore((state) => state.streak);
  const { t } = useLocale();

  const badges = useMemo(() => [{
    id: 1,
    name: t('streaks.badges.weekWarrior'),
    icon: <Award size={32} />,
    unlocked: true
  }, {
    id: 2,
    name: t('streaks.badges.consistencyKing'),
    icon: <Trophy size={32} />,
    unlocked: true
  }, {
    id: 3,
    name: t('streaks.badges.unstoppable'),
    icon: <Zap size={32} />,
    unlocked: false
  }], [t]);
  return <div className="min-h-screen pb-24 px-4 pt-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">{t('streaks.title')}</h1>
          <p className="text-white">{t('streaks.subtitle')}</p>
        </div>

        {/* Current Streak */}
        {streak && (
          <>
            <div className="glass-card rounded-3xl p-8 mb-6 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[rgb(242,156,6)]/20 to-danger-500/20" />
              <div className="relative z-10">
                <StreakDisplay
                  streak={streak.currentStreak}
                  weeklyStreak={streak.weeklyStreak}
                  lastSevenDays={streak.lastSevenDays}
                  size="lg"
                />
                <h2 className="text-2xl font-bold text-white mt-6 mb-2">
                  {t('streaks.current')}
                </h2>
                <p className="text-white">{t('streaks.onFire')}</p>
              </div>
            </div>

            {/* Best Streak */}
            <div className="glass-card rounded-3xl p-6 mb-6 flex items-center justify-between">
              <div>
                <div className="text-sm text-white mb-1">{t('streaks.best')}</div>
                <div className="text-3xl font-bold text-white">{streak.longestStreak} {t('common.days')}</div>
              </div>
              <Trophy size={48} className="text-[rgb(242,156,6)]" />
            </div>
          </>
        )}

       

        {/* Badges */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-4">{t('streaks.achievements')}</h2>
          <div className="grid grid-cols-3 gap-4">
            {badges.map(badge => <div key={badge.id} className={`glass-card rounded-2xl p-4 text-center transition-all ${badge.unlocked ? 'scale-100' : 'opacity-50 grayscale'}`}>
                <div className={`${badge.unlocked ? 'text-[rgb(242,156,6)]' : 'text-white/50'} mb-2`}>
                  {badge.icon}
                </div>
                <p className="text-xs font-semibold text-white">
                  {badge.name}
                </p>
              </div>)}
          </div>
        </div>

        {/* Motivation */}
        <div className="glass-card rounded-3xl p-6 text-center bg-gradient-to-br from-[rgb(242,156,6)]/10 to-danger-500/10">
          <p className="text-white font-semibold">
            "{t('streaks.motivation')}"
          </p>
        </div>
      </div>
    </div>;
}