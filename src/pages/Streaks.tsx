import React, { useEffect } from 'react';
import { Trophy, Award, Zap, Star, Flame, Crown, CheckCheck, Target, Sparkles } from 'lucide-react';
import { StreakDisplay } from '@/features/streaks/components';
import { useAppStore, useAchievements } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import * as LucideIcons from 'lucide-react';

export function Streaks() {
  const streak = useAppStore((state) => state.streak);
  const { t } = useLocale();
  const {
    achievementsWithProgress,
    loadAchievementsWithProgress,
    isLoading
  } = useAchievements();

  // Load achievements on mount
  useEffect(() => {
    loadAchievementsWithProgress();
  }, [loadAchievementsWithProgress]);

  // Get icon component from icon name
  const getIcon = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    if (IconComponent) {
      return <IconComponent size={32} />;
    }
    return <Award size={32} />;
  };

  // Filter to show only streak-related achievements (or all if you want)
  const streakAchievements = achievementsWithProgress
    .filter(a => a.category === 'streak')
    .slice(0, 6); // Show top 6
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
          {isLoading ? (
            <div className="text-center text-white/70 py-8">Loading achievements...</div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {streakAchievements.map(achievement => (
                <div key={achievement.id} className={`glass-card rounded-2xl p-4 text-center transition-all ${achievement.unlocked ? 'scale-100' : 'opacity-50 grayscale'}`}>
                  <div className={`${achievement.unlocked ? 'text-[rgb(242,156,6)]' : 'text-white/50'} mb-2`}>
                    {getIcon(achievement.iconName)}
                  </div>
                  <p className="text-xs font-semibold text-white">
                    {achievement.name}
                  </p>
                  {!achievement.unlocked && achievement.requirementValue && (
                    <p className="text-xs text-white/50 mt-1">
                      {achievement.requirementValue} {t('common.days')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
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