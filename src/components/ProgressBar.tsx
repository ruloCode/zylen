import React from 'react';
interface ProgressBarProps {
  current: number;
  max: number;
  color?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}
export function ProgressBar({
  current,
  max,
  color = 'quest-blue',
  showLabel = true,
  size = 'md'
}: ProgressBarProps) {
  const percentage = Math.min(current / max * 100, 100);
  const heights = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4'
  };
  return <div className="w-full">
      <div className={`w-full bg-white/40 rounded-full overflow-hidden ${heights[size]}`}>
        <div className={`h-full bg-gradient-to-r from-${color} to-quest-purple rounded-full transition-all duration-500 ease-out relative`} style={{
        width: `${percentage}%`
      }}>
          <div className="absolute inset-0 bg-white/20 animate-shimmer" style={{
          backgroundSize: '200% 100%',
          backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)'
        }} />
        </div>
      </div>
      {showLabel && <div className="flex justify-between mt-1 text-xs text-gray-600">
          <span>{current} XP</span>
          <span>{max} XP</span>
        </div>}
    </div>;
}