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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="lg"
      showCloseButton={false}
      description={t('lifeAreaModal.title')}
      footer={
        <button
          onClick={onClose}
          className="w-full py-4 px-6 bg-green-500 text-black font-bold hover:bg-green-400 transition-dofus uppercase touch-manipulation min-h-[44px] rounded-xl"
        >
          {t('lifeAreaModal.close')}
        </button>
      }
    >
      {/* Header with Icon and Title */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className={`${colorClass} bg-charcoal-700 p-4 rounded-none`}>
            <Icon size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white">{translatedArea}</h2>
            <p className="text-sm text-white/70">{t('lifeAreaModal.title')}</p>
          </div>
        </div>
        <LevelBadge level={lifeArea.level} />
      </div>

      {/* Stats Section */}
      <div className="rpg-card p-6 mb-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-white/70 mb-1">{t('lifeAreaModal.totalXP')}</p>
            <p className="text-2xl font-bold text-orange-500">{lifeArea.totalXP} XP</p>
          </div>
          <div>
            <p className="text-sm text-white/70 mb-1">
              {t('lifeAreaModal.xpToNextLevel', { level: lifeArea.level + 1 })}
            </p>
            <p className="text-2xl font-bold text-cyan-400">
              {progress.max - progress.current} XP
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-white/80">
            <span>{t('common.progress')}</span>
            <span>{progress.percentage}%</span>
          </div>
          <ProgressBar current={progress.current} max={progress.max} showLabel={false} />
          <div className="flex justify-between text-xs text-white/60">
            <span>{progress.current} XP</span>
            <span>{xpForNextLevel} XP</span>
          </div>
        </div>
      </div>

      {/* Habits Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">
            {t('lifeAreaModal.habitsInArea')}
          </h3>
          <span className="text-sm text-white/70">
            {completedHabits.length}/{areaHabits.length} {t('lifeAreaModal.completedToday')}
          </span>
        </div>

        {areaHabits.length === 0 ? (
          <div className="rpg-card p-8 text-center">
            <p className="text-white/60">{t('lifeAreaModal.noHabits')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {areaHabits.map((habit) => {
              const HabitIcon = HABIT_ICONS[habit.iconName] || HABIT_ICONS.Target;
              return (
                <div
                  key={habit.id}
                  className="rpg-card p-4 flex items-center gap-3 hover:scale-[1.02] transition-dofus"
                >
                  {/* Completion Status */}
                  <div>
                    {habit.completed ? (
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    ) : (
                      <Circle className="w-6 h-6 text-white/30" />
                    )}
                  </div>

                  {/* Habit Icon */}
                  <div className={`${colorClass} bg-charcoal-700 p-2`}>
                    <HabitIcon size={20} />
                  </div>

                  {/* Habit Info */}
                  <div className="flex-1">
                    <h4 className="font-semibold text-white">{habit.name}</h4>
                    <p className="text-sm text-white/60">
                      +{habit.xp} XP · +{habit.points} {t('common.points')}
                    </p>
                  </div>

                  {/* XP Badge */}
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 bg-orange-500/20 text-orange-400 text-sm font-semibold border border-orange-500/30">
                      {habit.xp} XP
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
