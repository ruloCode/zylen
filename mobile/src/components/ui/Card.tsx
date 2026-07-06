/**
 * Zylen Card Component — React Native port.
 * Theme-driven surfaces. `backdrop-blur` from the web is dropped (unsupported);
 * the glass variants rely on the translucent --glass-bg color instead.
 */

import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { cn } from '@/utils';

type CardVariant = 'dark' | 'charcoal' | 'vibrant' | 'transparent';
type CardPadding = 'sm' | 'md' | 'lg';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  className?: string;
  onClick?: () => void;
}

const VARIANTS: Record<CardVariant, string> = {
  // Dark surface - Zylen v2 standard card (theme-driven)
  dark: 'bg-surface border border-[hsl(var(--border))]',

  // Glass - Zylen v2 nav style (theme-driven)
  charcoal: 'bg-[hsl(var(--glass-bg)/0.7)] border border-[hsl(var(--glass-border)/0.12)]',

  // Vibrant for special cards (life areas, characters)
  vibrant: 'border border-[hsl(var(--border))]',

  // Transparent with subtle border
  transparent: 'bg-transparent border border-[hsl(var(--border))]',
};

const PADDINGS: Record<CardPadding, string> = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export function Card({
  children,
  variant = 'charcoal',
  padding = 'md',
  className = '',
  onClick,
}: CardProps) {
  const cardClassName = cn('rounded-2xl', VARIANTS[variant], PADDINGS[padding], className);

  if (onClick) {
    return (
      <Pressable onPress={onClick} className={cn(cardClassName, 'active:opacity-90')}>
        {children}
      </Pressable>
    );
  }

  return <View className={cardClassName}>{children}</View>;
}

/**
 * Card Header Component
 */
interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return <View className={cn('mb-4', className)}>{children}</View>;
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
  // Gradient text is not supported on native — the accent color stands in.
  const gradientClass = gradient ? 'text-teal-400' : 'text-foreground';

  return (
    <Text
      className={cn('font-display text-xl font-bold uppercase tracking-wide', gradientClass, className)}
    >
      {children}
    </Text>
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
    <Text className={cn('text-sm text-[hsl(var(--text-secondary))] font-medium', className)}>
      {children}
    </Text>
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
  return <View className={cn('gap-4', className)}>{children}</View>;
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
    <View className={cn('mt-6 border-t border-[hsl(var(--border))] pt-4', className)}>
      {children}
    </View>
  );
}

export default Card;
