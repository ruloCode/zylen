/**
 * Zylen Button Component
 * Dofus-styled buttons with lime green primary and clean transitions
 */

import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
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
  type = 'button',
  'aria-label': ariaLabel
}: ButtonProps) {
  // Base styles - Dofus style (rounded corners, bold, uppercase)
  const baseStyles = `
    rounded-[10px]
    font-extrabold
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
    focus-visible:ring-4
    focus-visible:ring-offset-2
    border-0
    tracking-wide
  `;

  const variants = {
    // Primary lime green - Dofus CTA style
    'primary': `
      bg-[rgb(137,184,32)]
      text-white
      hover:bg-[rgb(151,168,0)]
      shadow-[0px_0px_4px_0px_rgb(0,0,0)]
      hover:shadow-[0px_0px_8px_0px_rgba(137,184,32,0.5)]
      focus-visible:ring-[rgb(137,184,32)]
    `,

    // Secondary gray-brown - Dofus secondary buttons
    'secondary': `
      bg-[rgb(71,65,61)]
      text-white
      hover:bg-[rgb(91,85,81)]
      shadow-[0px_0px_3px_0px_rgba(0,0,0,0.5)]
      hover:shadow-[0px_0px_6px_0px_rgba(0,0,0,0.6)]
      focus-visible:ring-[rgb(71,65,61)]
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

    // Danger - Rose red for destructive actions
    'danger': `
      bg-[rgb(232,116,129)]
      text-white
      hover:bg-[rgb(220,100,113)]
      shadow-[0px_0px_4px_0px_rgb(0,0,0)]
      hover:shadow-[0px_0px_8px_0px_rgba(232,116,129,0.5)]
      focus-visible:ring-[rgb(232,116,129)]
    `
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm h-8',              // 12px 8px, 14px text
    md: 'px-[18px] py-[10px] text-lg h-10',  // 18px 10px, 18px text - Dofus standard
    lg: 'px-6 py-3 text-xl h-12'             // 24px 12px, 20px text
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`.trim().replace(/\s+/g, ' ')}
    >
      {children}
    </button>
  );
}

export default Button;
