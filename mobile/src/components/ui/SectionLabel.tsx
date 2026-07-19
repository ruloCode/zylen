/**
 * Section eyebrow — native port of the web `.section-label` (index.css).
 * 11px bold uppercase with wide tracking in the secondary text color.
 */

import React from 'react';
import { Text } from 'react-native';
import { cn } from '@/utils';

interface SectionLabelProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionLabel({ children, className = '' }: SectionLabelProps) {
  return (
    <Text
      className={cn(
        'text-[11px] font-bold uppercase tracking-[1.7px] text-[hsl(var(--text-secondary)/0.75)]',
        className,
      )}
    >
      {children}
    </Text>
  );
}

export default SectionLabel;
