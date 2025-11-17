/**
 * Zylen LifeAreaCard Component
 * Dofus-inspired character card style with vibrant backgrounds and sharp corners
 */

import React from 'react';
import { Heart, DollarSign, Palette, Users, Home, Briefcase } from 'lucide-react';
import { ProgressBar } from '@/components/ui';
import { useLocale } from '@/hooks/useLocale';
import { getAreaLevelProgress } from '@/utils/xp';

interface LifeAreaCardProps {
  area: 'Health' | 'Finance' | 'Creativity' | 'Social' | 'Family' | 'Career';
  level: number;
  totalXP: number;
  onClick?: () => void;
}

const iconMap = {
  Health: Heart,
  Finance: DollarSign,
  Creativity: Palette,
  Social: Users,
  Family: Home,
  Career: Briefcase
};

// Vibrant backgrounds - Dofus character card style
const bgColorMap = {
  Health: 'bg-[#DC3232]',         // Bright red
  Finance: 'bg-[#32C850]',        // Bright green
  Creativity: 'bg-[#B43CC8]',     // Bright purple
  Social: 'bg-[#3296FF]',         // Bright blue
  Family: 'bg-[#FF8C32]',         // Bright orange
  Career: 'bg-[#32C8DC]'          // Bright cyan
};

const translationKeyMap = {
  Health: 'lifeAreas.health',
  Finance: 'lifeAreas.finance',
  Creativity: 'lifeAreas.creativity',
  Social: 'lifeAreas.social',
  Family: 'lifeAreas.family',
  Career: 'lifeAreas.career'
};

export function LifeAreaCard({
  area,
  level,
  totalXP,
  onClick
}: LifeAreaCardProps) {
  const { t } = useLocale();
  const Icon = iconMap[area];
  const bgColor = bgColorMap[area];
  const translatedArea = t(translationKeyMap[area]);

  // Calculate progress to next level
  const progress = getAreaLevelProgress(totalXP, level);

  return (
    <div
      className="group cursor-pointer rounded-none shadow-[0px_0px_4px_0px_rgb(0,0,0)] hover:shadow-[0px_0px_8px_0px_rgba(0,0,0,0.8)] hover:-translate-y-0.5 transition-all duration-200 ease-in-out overflow-hidden"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {/* Vibrant background section with icon - Dofus character card style */}
      <div className={`${bgColor} relative flex items-center justify-center py-12 px-4`}>
        {/* Large centered icon - white */}
        <div className="relative z-10">
          <Icon size={64} className="text-white drop-shadow-lg" strokeWidth={2} />
        </div>

        {/* Level badge in top-right corner */}
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded-md px-2 py-1 text-white font-bold text-xs uppercase shadow-lg">
          {t('common.level')} {level}
        </div>
      </div>

      {/* Dark title bar at bottom - Dofus style */}
      <div className="bg-[rgb(23,20,18)] px-4 py-3">
        {/* Area name - uppercase, white, bold */}
        <h3 className="font-display font-extrabold uppercase text-white text-center text-sm tracking-wide mb-2">
          {translatedArea}
        </h3>

        {/* Progress bar - integrated into title bar */}
        <div className="w-full">
          <ProgressBar
            current={progress.current}
            max={progress.max}
            showLabel={false}
            size="sm"
            variant="success"
          />
        </div>
      </div>
    </div>
  );
}
