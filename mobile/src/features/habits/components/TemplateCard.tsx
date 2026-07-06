/**
 * TemplateCard — displays a single habit template. (React Native port)
 * The web's hover-reveal "add" affordance is always visible on native.
 */

import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Plus, FlaskConical } from 'lucide-react-native';
import { HABIT_ICONS } from './IconSelector';
import { useLocale } from '@/hooks/useLocale';
import { findCatalogEntry } from '@/constants/habitCatalog';
import { img } from '@/assets/registry';
import type { HabitTemplate } from '@/types';

const TEAL_400 = '#2DD4BF';
const TEAL_300 = '#5EEAD4';

interface TemplateCardProps {
  template: HabitTemplate;
  onSelect: (template: HabitTemplate) => void;
  /** open the science sheet for this template (only offered when it maps to the catalog) */
  onLearnMore?: (template: HabitTemplate) => void;
}

/**
 * Displays a single habit template in a card format
 */
export function TemplateCard({ template, onSelect, onLearnMore }: TemplateCardProps) {
  const { t } = useLocale();
  const Icon = HABIT_ICONS[template.iconName] || HABIT_ICONS['Target'];
  const catalogEntry = findCatalogEntry(template.name);
  const hasScience = !!catalogEntry;

  // Get translated name if key exists, otherwise use raw name
  const displayName = template.nameKey ? t(template.nameKey, template.name) : template.name;
  const displayDescription = template.descriptionKey
    ? t(template.descriptionKey, template.description || '')
    : template.description;

  // Bundled catalog illustration (undefined → icon fallback)
  const illustration = catalogEntry ? img(`/catalog/${catalogEntry.slug}.png`) : undefined;

  return (
    <Pressable
      className="relative rounded-2xl border border-white/10 bg-white/5 p-4 active:border-teal-500/50 active:bg-white/10"
      onPress={() => onSelect(template)}
      accessibilityRole="button"
      accessibilityLabel={`${t('templates.addToMyHabits')}: ${displayName}`}
    >
      {/* Featured badge */}
      {template.isFeatured && (
        <View className="absolute -right-2 -top-2 z-10 rounded-full bg-gold-500 px-2 py-0.5">
          <Text className="text-xs font-bold text-charcoal-500">{t('templates.featured')}</Text>
        </View>
      )}

      {/* Illustration (or icon fallback) and XP */}
      <View className="mb-3 flex-row items-start justify-between">
        <View className="h-14 w-14 items-center justify-center overflow-hidden rounded-xl">
          {illustration ? (
            <Image
              source={illustration}
              contentFit="contain"
              style={{ width: 56, height: 56 }}
              accessibilityElementsHidden
            />
          ) : (
            <View className="h-12 w-12 items-center justify-center rounded-xl bg-teal-500/20">
              <Icon size={24} color={TEAL_400} />
            </View>
          )}
        </View>
        <View className="rounded-lg bg-gold-500/20 px-2 py-1">
          <Text className="text-sm font-semibold text-gold-400">
            +{template.suggestedXp} XP
          </Text>
        </View>
      </View>

      {/* Name */}
      <Text numberOfLines={2} className="mb-1 text-sm font-semibold text-white">
        {displayName}
      </Text>

      {/* Description */}
      {displayDescription ? (
        <Text numberOfLines={2} className="mb-3 text-xs text-white/60">
          {displayDescription}
        </Text>
      ) : null}

      {/* Life Area Badge + learn more / add */}
      <View className="flex-row items-center justify-between">
        <View className="rounded-lg bg-white/10 px-2 py-1">
          <Text className="text-xs text-white/70">
            {t(`lifeAreas.${template.lifeAreaType.toLowerCase()}`)}
          </Text>
        </View>

        {hasScience && onLearnMore ? (
          <Pressable
            onPress={() => onLearnMore(template)}
            className="flex-row items-center gap-1 rounded-lg bg-teal-500/10 px-2 py-1 active:bg-teal-500/20"
            accessibilityRole="button"
            accessibilityLabel={`${t('habitScience.learnMore')}: ${displayName}`}
          >
            <FlaskConical size={14} color={TEAL_300} />
            <Text className="text-xs font-semibold text-teal-300">
              {t('habitScience.learnMore')}
            </Text>
          </Pressable>
        ) : (
          <View className="flex-row items-center gap-1">
            <Plus size={16} color={TEAL_400} />
            <Text className="text-xs font-medium text-teal-400">{t('actions.add')}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}
