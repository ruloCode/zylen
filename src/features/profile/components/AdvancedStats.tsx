import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  Flame,
  Target,
  Calendar,
  Award,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { useLocale } from '@/hooks/useLocale';
import { StatsService, UserStats } from '@/services/stats.service';

// Map life area names to translation keys
const lifeAreaTranslationMap: Record<string, string> = {
  Health: 'lifeAreas.health',
  Finance: 'lifeAreas.finance',
  Creativity: 'lifeAreas.creativity',
  Social: 'lifeAreas.social',
  Family: 'lifeAreas.family',
  Career: 'lifeAreas.career',
};

export function AdvancedStats() {
  const { t } = useLocale();
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    // Load stats when component mounts
    const userStats = StatsService.getUserStats();
    setStats(userStats);
  }, []);

  if (!stats) {
    return (
      <Card variant="glass" padding="md" className="animate-pulse">
        <div className="h-40 bg-parchment-200/20 rounded-lg" />
      </Card>
    );
  }

  const statItems = [
    {
      icon: Flame,
      label: t('profile.stats.longestStreak'),
      value: stats.longestStreak,
      suffix: t('common.days'),
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      icon: Target,
      label: t('profile.stats.currentStreak'),
      value: stats.currentStreak,
      suffix: t('common.days'),
      color: 'text-teal-500',
      bgColor: 'bg-teal-500/10',
    },
    {
      icon: Calendar,
      label: t('profile.stats.activeDays'),
      value: stats.activeDaysCount,
      suffix: t('profile.stats.last7Days'),
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: TrendingUp,
      label: t('profile.stats.dailyAverage'),
      value: stats.dailyAverage.toFixed(1),
      suffix: t('profile.stats.habitsPerDay'),
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      icon: Award,
      label: t('profile.stats.totalHabits'),
      value: stats.totalHabits,
      suffix: t('profile.stats.habits'),
      color: 'text-gold-500',
      bgColor: 'bg-gold-500/10',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Stats Header */}
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-5 h-5 text-gold-500" />
        <h3 className="font-display text-lg font-bold text-navy-700">
          {t('profile.stats.title')}
        </h3>
      </div>

      {/* Stats Grid */}
      <div className="space-y-3">
        {statItems.map((stat, index) => (
          <Card
            key={index}
            variant="glass"
            padding="sm"
            className="hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center gap-3">
              {/* Icon */}
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>

              {/* Label and Value */}
              <div className="flex-1">
                <p className="text-xs text-navy-500 font-body">
                  {stat.label}
                </p>
                <p className="font-display font-bold text-navy-700">
                  {stat.value}{' '}
                  <span className="text-sm font-normal text-navy-400">
                    {stat.suffix}
                  </span>
                </p>
              </div>
            </div>
          </Card>
        ))}

        {/* XP Distribution */}
        {stats.xpDistribution.length > 0 && (
          <Card variant="glass" padding="sm">
            <div className="space-y-3">
              <p className="text-xs text-navy-500 font-body font-semibold">
                {t('profile.stats.xpDistribution')}
              </p>
              <div className="space-y-2">
                {stats.xpDistribution.slice(0, 3).map((area) => {
                  // Get translated name or use original if not in map
                  const translatedName = lifeAreaTranslationMap[area.areaName]
                    ? t(lifeAreaTranslationMap[area.areaName])
                    : area.areaName;

                  return (
                    <div key={area.areaId} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-navy-600 font-body">
                          {translatedName}
                        </span>
                        <span className="text-navy-500 font-body">
                          {area.totalXP} XP ({area.percentage}%)
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="h-1.5 bg-parchment-200/40 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-gold-400 to-gold-500 rounded-full transition-all duration-500"
                          style={{ width: `${area.percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
