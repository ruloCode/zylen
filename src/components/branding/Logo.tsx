/**
 * Everlight Logo Component
 *
 * Renders the "Everlight" text wordmark. The previous Zylen image mark was
 * retired with the rebrand; dedicated logo art is a follow-up. The component
 * keeps its original props API (`size`, `className`) so every call-site that
 * sized the old hexagonal logo continues to work — `size` now maps to the
 * wordmark's font size in pixels.
 */

import React from 'react';
import { cn } from '@/utils';

interface LogoProps {
  size?: number | 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Main Logo component — the Everlight wordmark.
 */
export const Logo: React.FC<LogoProps> = ({
  size = 48,
  className = ''
}) => {
  // Convert size string to number (pixel font size for the wordmark).
  const fontSize = typeof size === 'string'
    ? { sm: 18, md: 24, lg: 32 }[size] || 24
    : Math.round(size * 0.5);

  return (
    <span
      aria-label="Everlight"
      style={{ fontSize }}
      className={cn(
        'inline-flex items-center font-bold tracking-tight leading-none',
        'bg-gradient-to-r from-teal-200 via-teal-400 to-gold-300 bg-clip-text text-transparent',
        className
      )}
    >
      Everlight
    </span>
  );
};

export default Logo;
