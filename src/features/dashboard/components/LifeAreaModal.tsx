import React from 'react';
import { Heart, DollarSign, Palette, Users, Home, Briefcase, CheckCircle2, Circle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { LevelBadge } from '@/components/ui/LevelBadge';
import { useLocale } from '@/hooks/useLocale';
import { useLifeAreas, useHabits } from '@/store';
import { getAreaLevelProgress, getXPForAreaLevel } from '@/utils/xp';
import { HABIT_ICONS } from '@/features/habits/components/IconSelector';
import type { LifeAreaType } from '@/types';

interface LifeAreaModalProps {
  lifeAreaId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const iconMap = {
  Health: Heart,
  Finance: DollarSign,
  Creativity: Palette,
  Social: Users,
  Family: Home,
  Career: Briefcase,
};

const colorMap = {
  Health: 'text-red-500',
  Finance: 'text-green-500',
  Creativity: 'text-purple-500',
  Social: 'text-blue-500',
  Family: 'text-orange-500',
  Career: 'text-indigo-500',
};

const bgColorMap = {
  Health: 'bg-red-50',
  Finance: 'bg-green-50',
  Creativity: 'bg-purple-50',
  Social: 'bg-blue-50',
  Family: 'bg-orange-50',
  Career: 'bg-indigo-50',
};

const translationKeyMap = {
  Health: 'lifeAreas.health',
  Finance: 'lifeAreas.finance',
  Creativity: 'lifeAreas.creativity',
  Social: 'lifeAreas.social',
  Family: 'lifeAreas.family',
  Career: 'lifeAreas.career',
};

export function LifeAreaModal({ lifeAreaId, isOpen, onClose }: LifeAreaModalProps) {
  const { t } = useLocale();
  const { getLifeAreaById } = useLifeAreas();
  const { habits } = useHabits();

  // Get life area data
  const lifeArea = lifeAreaId ? getLifeAreaById(lifeAreaId) : null;

  if (!lifeArea) {
    return null;
  }

  // Get habits for this life area
  const areaHabits = habits.filter((h) => h.lifeArea === lifeArea.id);
  const completedHabits = areaHabits.filter((h) => h.completed);
  const totalXPFromHabits = completedHabits.reduce((sum, h) => sum + h.xp, 0);

  // Get icon, color, and translated name
  const Icon = iconMap[lifeArea.area as LifeAreaType];
  const colorClass = colorMap[lifeArea.area as LifeAreaType];
  const bgColorClass = bgColorMap[lifeArea.area as LifeAreaType];
  const translatedArea = t(translationKeyMap[lifeArea.area as LifeAreaType]);

  // Calculate progress to next level
  const progress = getAreaLevelProgress(lifeArea.totalXP, lifeArea.level);
  const xpForNextLevel = getXPForAreaLevel(lifeArea.level + 1);

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="lg" showCloseButton={false}>
      {/* Header with Icon and Title */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className={`${colorClass} ${bgColorClass} p-4 rounded-2xl`}>
            <Icon size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">{translatedArea}</h2>
            <p className="text-sm text-gray-500">{t('lifeAreaModal.title')}</p>
          </div>
        </div>
        <LevelBadge level={lifeArea.level} />
      </div>

      {/* Stats Section */}
      <div className="glass-card rounded-2xl p-6 mb-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">{t('lifeAreaModal.totalXP')}</p>
            <p className="text-2xl font-bold text-gold-600">{lifeArea.totalXP} XP</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">
              {t('lifeAreaModal.xpToNextLevel', { level: lifeArea.level + 1 })}
            </p>
            <p className="text-2xl font-bold text-teal-600">
              {progress.max - progress.current} XP
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>{t('common.progress')}</span>
            <span>{progress.percentage}%</span>
          </div>
          <ProgressBar current={progress.current} max={progress.max} showLabel={false} />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{progress.current} XP</span>
            <span>{xpForNextLevel} XP</span>
          </div>
        </div>
      </div>

      {/* Habits Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {t('lifeAreaModal.habitsInArea')}
          </h3>
          <span className="text-sm text-gray-600">
            {completedHabits.length}/{areaHabits.length} {t('lifeAreaModal.completedToday')}
          </span>
        </div>

        {areaHabits.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <p className="text-gray-500">{t('lifeAreaModal.noHabits')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {areaHabits.map((habit) => {
              const HabitIcon = HABIT_ICONS[habit.iconName] || HABIT_ICONS.Target;
              return (
                <div
                  key={habit.id}
                  className="glass-card rounded-xl p-4 flex items-center gap-3 hover:scale-[1.02] transition-transform"
                >
                  {/* Completion Status */}
                  <div>
                    {habit.completed ? (
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-300" />
                    )}
                  </div>

                  {/* Habit Icon */}
                  <div className={`${colorClass} ${bgColorClass} p-2 rounded-lg`}>
                    <HabitIcon size={20} />
                  </div>

                  {/* Habit Info */}
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{habit.name}</h4>
                    <p className="text-sm text-gray-500">
                      +{habit.xp} XP · +{habit.points} {t('common.points')}
                    </p>
                  </div>

                  {/* XP Badge */}
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 rounded-full bg-gold-100 text-gold-700 text-sm font-semibold">
                      {habit.xp} XP
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end">
        <button
          onClick={onClose}
          className="px-6 py-2 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700 transition-colors"
        >
          {t('lifeAreaModal.close')}
        </button>
      </div>
    </Modal>
  );
}
