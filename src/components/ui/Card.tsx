/**
 * MyWay (LifeQuest) Card Component
 * Warm RPG-styled cards with parchment backgrounds and golden accents
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  variant?: 'glass' | 'parchment' | 'isometric' | 'elevated';
  padding?: 'sm' | 'md' | 'lg';
  className?: string;
  withGlow?: boolean;
  withFloat?: boolean;
  onClick?: () => void;
}

export function Card({
  children,
  variant = 'glass',
  padding = 'md',
  className = '',
  withGlow = false,
  withFloat = false,
  onClick
}: CardProps) {
  const variants = {
    // Warm glass effect with parchment tint
    glass: `
      bg-parchment-50/80 backdrop-blur-xl
      border border-parchment-200/30
      shadow-soft-md
    `,

    // Solid parchment card with more opacity
    parchment: `
      bg-parchment-50/95 backdrop-blur-lg
      border-2 border-parchment-300/40
      shadow-soft-lg
    `,

    // Isometric shadow depth effect
    isometric: `
      bg-white/95
      border-2 border-gold-200
      shadow-isometric
      hover:shadow-isometric-hover
      transition-all duration-200
      hover:-translate-x-0.5 hover:-translate-y-0.5
    `,

    // Elevated card with dramatic shadow
    elevated: `
      bg-gradient-to-br from-parchment-50 to-parchment-100
      border-2 border-gold-300/50
      shadow-dramatic
    `
  };

  const paddings = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const glowClass = withGlow ? 'glow-gold' : '';
  const floatClass = withFloat ? 'float-gentle' : '';
  const interactiveClass = onClick ? 'cursor-pointer hover:scale-[1.02] transition-transform duration-200' : '';

  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-2xl',
        variants[variant],
        paddings[padding],
        glowClass,
        floatClass,
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
  const gradientClass = gradient ? 'text-gradient-gold' : 'text-navy-700';

  return (
    <h3 className={cn('font-display text-xl font-bold', gradientClass, className)}>
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
    <p className={cn('text-sm text-navy-500 font-body', className)}>
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
    <div className={cn('mt-6 pt-4 border-t border-parchment-300/40', className)}>
      {children}
    </div>
  );
}

export default Card;
