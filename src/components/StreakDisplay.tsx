import React from 'react';
import { Flame } from 'lucide-react';
interface StreakDisplayProps {
  streak: number;
  size?: 'sm' | 'md' | 'lg';
}
export function StreakDisplay({
  streak,
  size = 'md'
}: StreakDisplayProps) {
  const sizes = {
    sm: {
      container: 'w-16 h-16',
      icon: 24,
      text: 'text-lg'
    },
    md: {
      container: 'w-24 h-24',
      icon: 32,
      text: 'text-2xl'
    },
    lg: {
      container: 'w-32 h-32',
      icon: 48,
      text: 'text-4xl'
    }
  };
  const config = sizes[size];
  return <div className="relative inline-flex items-center justify-center">
      <div className={`${config.container} rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-2xl relative overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-t from-yellow-300/30 to-transparent animate-pulse" />
        <Flame size={config.icon} className="text-white relative z-10" />
      </div>
      <div className={`absolute ${config.text} font-bold text-white drop-shadow-lg`}>
        {streak}
      </div>
      {streak > 7 && <div className="absolute -inset-4 rounded-full border-4 border-orange-300/50 animate-ping" />}
    </div>;
}