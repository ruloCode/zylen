/**
 * ProgressRing
 *
 * Circular progress ring used to wrap ally avatars (level progress).
 * Purely presentational; the child renders in the center.
 * RN port: inline SVG → react-native-svg (Circle + strokeDasharray/offset);
 * the -rotate-90 start point moves to a transform on the Svg element.
 */

import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { cn } from '@/utils';

interface ProgressRingProps {
  /** 0-100 */
  percentage: number;
  /** Outer size in px. */
  size?: number;
  strokeWidth?: number;
  className?: string;
  children?: React.ReactNode;
}

export function ProgressRing({
  percentage,
  size = 72,
  strokeWidth = 3.5,
  className,
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percentage));
  const offset = circumference * (1 - clamped / 100);

  return (
    <View
      className={cn('items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}
      >
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(174, 62%, 47%)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={offset}
        />
      </Svg>
      {children}
    </View>
  );
}

export default ProgressRing;
