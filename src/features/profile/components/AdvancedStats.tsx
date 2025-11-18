import { useEffect, useState } from 'react';
import {
  TrendingUp,
  Flame,
  Target,
  Calendar,
  Award,
  BarChart3,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useLocale } from '@/hooks/useLocale';
import { StatsService, UserStats } from '@/services/supabase/stats.service';

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
    const loadStats = async () => {
      try {
        const userStats = await StatsService.getUserStats();
        setStats(userStats);
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    };

    loadStats();
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
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/20',
      borderColor: 'border-orange-400/30',
    },
    {
      icon: Target,
      label: t('profile.stats.currentStreak'),
      value: stats.currentStreak,
      suffix: t('common.days'),
      color: 'text-teal-400',
      bgColor: 'bg-teal-500/20',
      borderColor: 'border-teal-400/30',
    },
    {
      icon: Calendar,
      label: t('profile.stats.activeDays'),
      value: stats.activeDaysCount,
      suffix: t('profile.stats.last7Days'),
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-400/30',
    },
    {
      icon: TrendingUp,
      label: t('profile.stats.dailyAverage'),
      value: stats.dailyAverage.toFixed(1),
      suffix: t('profile.stats.habitsPerDay'),
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
      borderColor: 'border-purple-400/30',
    },
    {
      icon: Award,
      label: t('profile.stats.totalHabits'),
      value: stats.totalHabits,
      suffix: t('profile.stats.habits'),
      color: 'text-gold-400',
      bgColor: 'bg-gold-500/20',
      borderColor: 'border-gold-400/30',
    },
  ];

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Stats Header */}
      <div className="glass-card p-3 md:p-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gold-500/20 border border-gold-400/30">
            <BarChart3 className="w-5 h-5 text-gold-400" />
          </div>
          <h3 className="text-lg font-bold text-white">
            {t('profile.stats.title')}
          </h3>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="space-y-2 md:space-y-3">
        {statItems.map((stat, index) => (
          <div
            key={index}
            className={`glass-card p-3 md:p-4 border ${stat.borderColor} hover:scale-[1.02] transition-all duration-200`}
          >
            <div className="flex items-center gap-3">
              {/* Icon */}
              <div className={`p-2.5 rounded-lg ${stat.bgColor} border ${stat.borderColor} shadow-lg`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>

              {/* Label and Value */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/80 font-medium truncate mb-0.5">
                  {stat.label}
                </p>
                <p className="font-bold text-white text-lg leading-tight">
                  {stat.value}{' '}
                  <span className="text-sm font-normal text-white/70">
                    {stat.suffix}
                  </span>
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* XP Distribution */}
        {stats.xpDistribution.length > 0 && (
          <div className="glass-card p-4 border border-white/20">
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-teal-500/20 border border-teal-400/30">
                  <TrendingUp className="w-4 h-4 text-teal-400" />
                </div>
                <p className="text-sm text-white font-semibold">
                  {t('profile.stats.xpDistribution')}
                </p>
              </div>
              <div className="space-y-3">
                {stats.xpDistribution.slice(0, 3).map((area) => {
                  // Get translated name or use original if not in map
                  const translatedName = lifeAreaTranslationMap[area.areaName]
                    ? t(lifeAreaTranslationMap[area.areaName])
                    : area.areaName;

                  return (
                    <div key={area.areaId} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white font-medium">
                          {translatedName}
                        </span>
                        <span className="text-white/70 font-medium">
                          {area.totalXP} XP ({area.percentage}%)
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden border border-white/20">
                        <div
                          className="h-full bg-gradient-to-r from-gold-400 to-gold-500 rounded-full transition-all duration-500 shadow-lg shadow-gold-500/50"
                          style={{ width: `${area.percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
