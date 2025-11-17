/**
 * Zylen Card Component
 * Dofus-styled cards with dark backgrounds and sharp corners
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  variant?: 'dark' | 'charcoal' | 'vibrant' | 'transparent';
  padding?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

export function Card({
  children,
  variant = 'charcoal',
  padding = 'md',
  className = '',
  onClick
}: CardProps) {
  const variants = {
    // Dark charcoal - Dofus standard card
    dark: `
      bg-[rgb(23,20,18)]
      shadow-[0px_0px_4px_0px_rgb(0,0,0)]
    `,

    // Charcoal with slight transparency - Dofus nav style
    charcoal: `
      bg-[rgba(23,20,18,0.85)]
      backdrop-blur-sm
      shadow-[0px_0px_3px_0px_rgba(0,0,0,0.5)]
    `,

    // Vibrant for special cards (life areas, characters)
    vibrant: `
      shadow-[0px_0px_4px_0px_rgb(0,0,0)]
      hover:shadow-[0px_0px_8px_0px_rgba(0,0,0,0.8)]
      hover:-translate-y-0.5
      transition-all
      duration-200
      ease-in-out
    `,

    // Transparent with subtle border
    transparent: `
      bg-transparent
      border
      border-white/10
      hover:border-white/20
      transition-colors
      duration-200
    `
  };

  const paddings = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  const interactiveClass = onClick ? 'cursor-pointer hover:shadow-[0px_0px_6px_0px_rgba(0,0,0,0.7)] transition-shadow duration-200' : '';

  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-none',  // Sharp corners - Dofus style
        variants[variant],
        paddings[padding],
        interactiveClass,
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Card Header Component
 */
interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={cn('mb-4', className)}>
      {children}
    </div>
  );
}

/**
 * Card Title Component
 */
interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
}

export function CardTitle({ children, className = '', gradient = false }: CardTitleProps) {
  const gradientClass = gradient ? 'text-gradient-lime' : 'text-white';

  return (
    <h3 className={cn('font-display text-xl font-bold uppercase tracking-wide', gradientClass, className)}>
      {children}
    </h3>
  );
}

/**
 * Card Description Component
 */
interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function CardDescription({ children, className = '' }: CardDescriptionProps) {
  return (
    <p className={cn('text-sm text-white/85 font-body font-medium', className)}>
      {children}
    </p>
  );
}

/**
 * Card Content Component
 */
interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {children}
    </div>
  );
}

/**
 * Card Footer Component
 */
interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div className={cn('mt-6 pt-4 border-t border-white/10', className)}>
      {children}
    </div>
  );
}

export default Card;
