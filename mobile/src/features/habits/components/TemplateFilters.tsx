/**
 * TemplateFilters — filter controls for the template library. (React Native port)
 */

import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { useLocale } from '@/hooks/useLocale';
import type { LifeAreaType } from '@/types';
import { cn } from '@/utils/cn';

const LIFE_AREAS: LifeAreaType[] = ['Health', 'Finance', 'Creativity', 'Social', 'Family', 'Career'];

const TEAL_400 = '#2DD4BF';
const WHITE_40 = 'rgba(255,255,255,0.4)';

interface TemplateFiltersProps {
  selectedLifeArea: LifeAreaType | null;
  searchQuery: string;
  onLifeAreaChange: (area: LifeAreaType | null) => void;
  onSearchChange: (query: string) => void;
  onClearFilters: () => void;
}

/**
 * Filter controls for the template library
 */
export function TemplateFilters({
  selectedLifeArea,
  searchQuery,
  onLifeAreaChange,
  onSearchChange,
  onClearFilters,
}: TemplateFiltersProps) {
  const { t } = useLocale();

  const hasActiveFilters = selectedLifeArea !== null || searchQuery.trim() !== '';

  return (
    <View className="gap-4">
      {/* Search Bar */}
      <View className="flex-row items-center rounded-xl border border-white/10 bg-white/5 px-3">
        <Search size={20} color={WHITE_40} />
        <TextInput
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder={t('templates.searchPlaceholder')}
          placeholderTextColor={WHITE_40}
          className="flex-1 px-2 py-3 text-white"
        />
        {searchQuery ? (
          <Pressable
            onPress={() => onSearchChange('')}
            className="p-1"
            accessibilityRole="button"
            accessibilityLabel={t('actions.clear')}
          >
            <X size={16} color={WHITE_40} />
          </Pressable>
        ) : null}
      </View>

      {/* Life Area Filter Pills */}
      <View className="flex-row flex-wrap gap-2">
        {/* All button */}
        <Pressable
          onPress={() => onLifeAreaChange(null)}
          className={cn(
            'rounded-xl px-4 py-2',
            selectedLifeArea === null ? 'bg-teal-500' : 'bg-white/10 active:bg-white/20'
          )}
          accessibilityRole="button"
          accessibilityState={{ selected: selectedLifeArea === null }}
        >
          <Text
            className={cn(
              'text-sm font-medium',
              selectedLifeArea === null ? 'text-white' : 'text-white/70'
            )}
          >
            {t('templates.filters.all')}
          </Text>
        </Pressable>

        {/* Life area buttons */}
        {LIFE_AREAS.map((area) => (
          <Pressable
            key={area}
            onPress={() => onLifeAreaChange(area)}
            className={cn(
              'rounded-xl px-4 py-2',
              selectedLifeArea === area ? 'bg-teal-500' : 'bg-white/10 active:bg-white/20'
            )}
            accessibilityRole="button"
            accessibilityState={{ selected: selectedLifeArea === area }}
          >
            <Text
              className={cn(
                'text-sm font-medium',
                selectedLifeArea === area ? 'text-white' : 'text-white/70'
              )}
            >
              {t(`lifeAreas.${area.toLowerCase()}`)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Clear filters button */}
      {hasActiveFilters && (
        <Pressable
          onPress={onClearFilters}
          className="flex-row items-center gap-2 active:opacity-70"
          accessibilityRole="button"
        >
          <X size={16} color={TEAL_400} />
          <Text className="text-sm text-teal-400">{t('templates.clearFilters')}</Text>
        </Pressable>
      )}
    </View>
  );
}
