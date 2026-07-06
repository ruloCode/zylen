/**
 * Everlight Logo Component — React Native port.
 *
 * Renders the "Everlight" text wordmark. Native cannot paint gradient text,
 * so the web's teal→gold gradient is approximated with a two-tone wordmark
 * ("Ever" teal, "light" gold). Props API is identical to the web (`size`,
 * `className`) — `size` maps to the wordmark's font size in pixels.
 */

import React from 'react';
import { Text } from 'react-native';
import { cn } from '@/utils';

interface LogoProps {
  size?: number | 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Main Logo component — the Everlight wordmark.
 */
export const Logo: React.FC<LogoProps> = ({ size = 48, className = '' }) => {
  // Convert size string to number (pixel font size for the wordmark).
  const fontSize =
    typeof size === 'string' ? { sm: 18, md: 24, lg: 32 }[size] || 24 : Math.round(size * 0.5);

  return (
    <Text
      accessibilityLabel="Everlight"
      style={{ fontSize, lineHeight: Math.round(fontSize * 1.15) }}
      className={cn('font-bold tracking-tight', className)}
    >
      <Text className="text-teal-300">Ever</Text>
      <Text className="text-gold-300">light</Text>
    </Text>
  );
};

export default Logo;
