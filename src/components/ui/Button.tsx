/**
 * Zylen Button Component
 * DOFUS-styled buttons - Exact DOFUS specification
 * - Square corners (border-radius: 0)
 * - Green primary rgb(151, 168, 0)
 * - Orange secondary rgb(242, 156, 6)
 * - font-weight: 400, font-size: 23px
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  isLoading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  'aria-label'?: string;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  className = '',
  disabled = false,
  isLoading = false,
  type = 'button',
  'aria-label': ariaLabel
}: ButtonProps) {
  // Base styles - DOFUS style (SQUARE corners, normal weight, uppercase)
  const baseStyles = `
    rounded-xl
    font-semibold
    transition-all
    duration-200
    ease-in-out
    active:scale-95
    hover:-translate-y-0.5
    disabled:opacity-50
    disabled:cursor-not-allowed
    disabled:transform-none
    flex
    items-center
    justify-center
    gap-2
    focus:outline-none
    focus-visible:ring-2
    focus-visible:ring-offset-2
    border-0
  `;

  const variants = {
    // Primary accent - theme-driven
    'primary': `
      bg-primary
      text-primary-foreground
      hover:bg-primary-hover
      shadow-dofus
      hover:shadow-dofus-hover
      focus-visible:ring-primary
    `,

    // Secondary accent - theme-driven
    'secondary': `
      bg-secondary
      text-secondary-foreground
      hover:opacity-90
      shadow-dofus
      hover:shadow-dofus-hover
      focus-visible:ring-secondary
    `,

    // Ghost - Transparent with border
    'ghost': `
      bg-transparent
      text-foreground
      border-2
      border-[hsl(var(--glass-border)/0.2)]
      hover:bg-[hsl(var(--glass-bg)/0.4)]
      hover:border-[hsl(var(--glass-border)/0.3)]
      focus-visible:ring-primary
    `,

    // Danger - theme-driven destructive
    'danger': `
      bg-destructive
      text-destructive-foreground
      hover:opacity-90
      shadow-dofus
      hover:shadow-dofus-hover
      focus-visible:ring-destructive
    `
  };

  const sizes = {
    sm: 'px-4 py-2.5 text-sm min-h-[44px]',          // Small buttons - WCAG compliant
    md: 'px-6 py-3 text-base min-h-[48px]',          // Zylen v2 standard
    lg: 'px-8 py-3.5 text-lg min-h-[52px]'           // Zylen v2 large
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      aria-label={ariaLabel}
      aria-busy={isLoading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`.trim().replace(/\s+/g, ' ')}
    >
      {isLoading && <Loader2 className="animate-spin" size={size === 'sm' ? 16 : 20} aria-hidden="true" />}
      {children}
    </button>
  );
}

export default Button;
