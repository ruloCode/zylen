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
    rounded-none
    font-normal
    uppercase
    transition-all
    duration-200
    ease-in-out
    active:scale-95
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
    // Primary verde brillante - Alto contraste
    'primary': `
      bg-[rgb(155,215,50)]
      text-black
      hover:bg-[rgb(180,240,80)]
      shadow-dofus
      hover:shadow-dofus-hover
      focus-visible:ring-[rgb(155,215,50)]
    `,

    // Secondary DOFUS orange - Exact DOFUS secondary CTA
    'secondary': `
      bg-[rgb(242,156,6)]
      text-white
      hover:opacity-90
      shadow-dofus
      hover:shadow-dofus-hover
      focus-visible:ring-[rgb(242,156,6)]
    `,

    // Ghost - Transparent with border
    'ghost': `
      bg-transparent
      text-white
      border-2
      border-white/20
      hover:bg-white/10
      hover:border-white/30
      focus-visible:ring-white/50
    `,

    // Danger - DOFUS red for destructive actions
    'danger': `
      bg-[rgb(217,83,79)]
      text-white
      hover:opacity-90
      shadow-dofus
      hover:shadow-dofus-hover
      focus-visible:ring-[rgb(217,83,79)]
    `
  };

  const sizes = {
    sm: 'px-3 py-2.5 text-sm min-h-[44px]',               // Small buttons - WCAG compliant
    md: 'px-[34px] py-[12px] text-[23px] min-h-[44px]',   // DOFUS standard: 12px 34px, 23px text
    lg: 'px-[34px] py-[12px] text-[23px] min-h-[48px]'    // DOFUS large: slightly larger
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
