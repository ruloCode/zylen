import React from 'react';
import { Heart, DollarSign, Palette, Users, Home, Briefcase } from 'lucide-react';
import { ProgressBar } from '@/components/ui';
interface LifeAreaCardProps {
  area: 'Health' | 'Finance' | 'Creativity' | 'Social' | 'Family' | 'Career';
  level: number;
  currentXP: number;
  maxXP: number;
}
const iconMap = {
  Health: Heart,
  Finance: DollarSign,
  Creativity: Palette,
  Social: Users,
  Family: Home,
  Career: Briefcase
};
const colorMap = {
  Health: 'text-red-500',
  Finance: 'text-green-500',
  Creativity: 'text-purple-500',
  Social: 'text-blue-500',
  Family: 'text-orange-500',
  Career: 'text-indigo-500'
};
export function LifeAreaCard({
  area,
  level,
  currentXP,
  maxXP
}: LifeAreaCardProps) {
  const Icon = iconMap[area];
  const colorClass = colorMap[area];
  return <div className="glass-card rounded-2xl p-4 hover:scale-105 transition-transform duration-200">
      <div className="flex items-center gap-3 mb-3">
        <div className={`${colorClass} bg-white/50 p-2 rounded-xl`}>
          <Icon size={20} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm text-gray-800">{area}</h3>
          <p className="text-xs text-gray-500">Level {level}</p>
        </div>
      </div>
      <ProgressBar current={currentXP} max={maxXP} showLabel={false} size="sm" />
    </div>;
}