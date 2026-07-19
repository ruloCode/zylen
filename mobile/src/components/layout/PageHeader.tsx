/**
 * Standard v2 page header — native port of the web page-title convention
 * (28px extrabold sentence-case title + small muted subtitle, optional
 * eyebrow label above and an action slot on the right).
 */

import React from 'react';
import { Text, View } from 'react-native';
import { cn } from '@/utils';
import { SectionLabel } from '@/components/ui/SectionLabel';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  /** Optional node rendered on the right edge (settings gear, actions…). */
  right?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, eyebrow, right, className = '' }: PageHeaderProps) {
  return (
    <View className={cn('flex-row items-start justify-between gap-3', className)}>
      <View className="flex-1">
        {eyebrow ? <SectionLabel className="mb-1">{eyebrow}</SectionLabel> : null}
        <Text className="text-[28px] font-extrabold leading-tight tracking-tight text-foreground">
          {title}
        </Text>
        {subtitle ? (
          <Text className="mt-1 text-sm font-medium text-[hsl(var(--text-secondary))]">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View className="shrink-0">{right}</View> : null}
    </View>
  );
}

export default PageHeader;
