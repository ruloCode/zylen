/**
 * IconSelector — React Native port.
 * The icon map lives in the shared atoms layer (lucide-react-native backed);
 * re-exported here so feature imports stay identical to the web
 * (`import { HABIT_ICONS } from './IconSelector'`).
 */

import React from 'react';
import { Pressable, View } from 'react-native';
import { HABIT_ICONS } from '@/components/atoms';
import { cn } from '@/utils/cn';
import { useLocale } from '@/hooks/useLocale';

export { HABIT_ICONS };

interface IconSelectorProps {
  selectedIcon: string;
  onSelectIcon: (iconName: string) => void;
}

export function IconSelector({ selectedIcon, onSelectIcon }: IconSelectorProps) {
  const { t } = useLocale();

  return (
    <View className="-m-1 flex-row flex-wrap">
      {Object.entries(HABIT_ICONS).map(([name, Icon]) => {
        const selected = selectedIcon === name;
        return (
          <View key={name} className="w-1/6 p-1">
            <Pressable
              onPress={() => onSelectIcon(name)}
              className={cn(
                'items-center justify-center rounded-xl p-3 active:bg-teal-500/20',
                selected ? 'bg-teal-500' : 'bg-white/10'
              )}
              accessibilityRole="button"
              accessibilityLabel={t(`icons.${name}`, name)}
              accessibilityState={{ selected }}
            >
              <Icon size={24} color="#FFFFFF" />
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}
