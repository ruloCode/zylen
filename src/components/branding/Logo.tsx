/**
 * Zylen Logo Component
 * Uses the official ZylenLife branding logo
 */

import React from 'react';
import zylenLifeLogo from '@/assets/zylenLife_logo.png';
import { cn } from '@/utils';

interface LogoProps {
  size?: number | 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Main Logo component
 * Displays the ZylenLife hexagonal logo with progress bars
 */
export const Logo: React.FC<LogoProps> = ({
  size = 48,
  className = ''
}) => {
  // Convert size string to number
  const numericSize = typeof size === 'string'
    ? { sm: 32, md: 48, lg: 64 }[size] || 48
    : size;

  return (
    <img
      src={zylenLifeLogo}
      alt="ZylenLife"
      width={numericSize}
      height={numericSize}
      className={cn('object-contain', className)}
    />
  );
};

export default Logo;
