/**
 * GlassCard — native stand-in for the web's `.glass-card` recipe.
 * The web version uses backdrop-blur; on native we approximate with a
 * translucent themed background (--glass-bg) and a soft white border.
 */

import React from 'react';
import { View, type ViewProps } from 'react-native';
import { cn } from '@/utils';

export interface GlassCardProps extends ViewProps {
  children?: React.ReactNode;
  className?: string;
}

export function GlassCard({ children, className, ...rest }: GlassCardProps) {
  return (
    <View
      className={cn(
        'rounded-2xl border border-white/10 bg-[hsl(var(--glass-bg)/0.65)]',
        className
      )}
      {...rest}
    >
      {children}
    </View>
  );
}

export default GlassCard;
