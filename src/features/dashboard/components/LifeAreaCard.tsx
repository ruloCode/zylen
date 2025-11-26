/**
 * Zylen LifeAreaCard Component
 * Dofus-inspired character card style with vibrant backgrounds and sharp corners
 */

import React from 'react';
import { Heart, DollarSign, Palette, Users, Home, Briefcase, Star } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { getAreaLevelProgress } from '@/utils/xp';

type PredefinedArea = 'Health' | 'Finance' | 'Creativity' | 'Social' | 'Family' | 'Career';

interface LifeAreaCardProps {
  area: PredefinedArea | string;
  level: number;
  totalXP: number;
  onClick?: () => void;
  // Allow additional props from LifeArea spread
  id?: string;
  isCustom?: boolean;
  enabled?: boolean;
  iconName?: string;
  color?: string;
}

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>> = {
  Health: Heart,
  Finance: DollarSign,
  Creativity: Palette,
  Social: Users,
  Family: Home,
  Career: Briefcase
};

// Vibrant backgrounds - Dofus character card style
const bgColorMap: Record<string, string> = {
  Health: 'bg-[#DC3232]',         // Bright red
  Finance: 'bg-[#32C850]',        // Bright green
  Creativity: 'bg-[#B43CC8]',     // Bright purple
  Social: 'bg-[#3296FF]',         // Bright blue
  Family: 'bg-[#FF8C32]',         // Bright orange
  Career: 'bg-[#32C8DC]'          // Bright cyan
};

const translationKeyMap: Record<string, string> = {
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
  onClick,
  color
}: LifeAreaCardProps) {
  const { t } = useLocale();
  const Icon = iconMap[area] || Star;
  const bgColor = bgColorMap[area] || color || 'bg-[#6366F1]';
  const translationKey = translationKeyMap[area];
  const translatedArea = translationKey ? t(translationKey) : area;

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
          <div className="h-1.5 bg-charcoal-500/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-success-400 via-success-500 to-success-600 rounded-full"
              style={{ width: `${Math.min((progress.current / progress.max) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
