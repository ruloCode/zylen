/**
 * MyWay (LifeQuest) Button Component
 * RPG-styled buttons with warm gold/teal palette and anime lighting effects
 */

import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary-gold' | 'teal-accent' | 'ghost-warm' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  withRimLight?: boolean;
  withGlow?: boolean;
  type?: 'button' | 'submit' | 'reset';
  'aria-label'?: string;
}

export function Button({
  children,
  variant = 'primary-gold',
  size = 'md',
  onClick,
  className = '',
  disabled = false,
  withRimLight = false,
  withGlow = false,
  type = 'button',
  'aria-label': ariaLabel
}: ButtonProps) {
  const baseStyles = 'rounded-xl font-display font-bold transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-400/50 focus-visible:ring-offset-2';

  const variants = {
    // Primary gold - Warm golden gradient with adventure vibe
    'primary-gold': `
      bg-gradient-to-br from-gold-500 via-gold-600 to-gold-700
      text-navy-700
      shadow-soft-lg hover:shadow-glow-gold
      hover:scale-105
      border-2 border-gold-400/50
      relative overflow-hidden
      ${withRimLight ? 'rim-light-gold' : ''}
      ${withGlow ? 'glow-gold' : ''}
    `,

    // Teal accent - Cool teal for secondary actions
    'teal-accent': `
      bg-gradient-to-br from-teal-400 via-teal-500 to-teal-600
      text-white
      shadow-soft-lg hover:shadow-glow-teal
      hover:scale-105
      border-2 border-teal-300/50
      relative overflow-hidden
      ${withRimLight ? 'rim-light-gold' : ''}
      ${withGlow ? 'glow-teal' : ''}
    `,

    // Ghost warm - Subtle warm glass effect
    'ghost-warm': `
      bg-parchment-50/60 backdrop-blur-lg
      text-gold-700
      border-2 border-gold-200/40
      hover:bg-parchment-100/80 hover:border-gold-300/60
      hover:shadow-soft-md
      transition-all duration-200
    `,

    // Danger - Rose red for destructive actions
    'danger': `
      bg-gradient-to-br from-danger-400 via-danger-500 to-danger-600
      text-white
      shadow-soft-lg hover:shadow-xl
      hover:scale-105
      border-2 border-danger-300/50
      relative overflow-hidden
    `
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm h-8',
    md: 'px-6 py-3 text-base h-10',
    lg: 'px-8 py-4 text-lg h-12'
  };

  // Shimmer effect for primary buttons
  const shimmerEffect = (variant === 'primary-gold' || variant === 'teal-accent') && !disabled;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {/* Shimmer overlay on hover */}
      {shimmerEffect && (
        <span className="absolute inset-0 bg-gradient-shimmer opacity-0 hover:opacity-100 transition-opacity duration-500 shimmer-gold pointer-events-none" />
      )}

      {/* Button content */}
      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>
    </button>
  );
}

export default Button;
