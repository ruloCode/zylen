/**
 * TemplateLibrary — browse and select habit templates. (React Native port)
 * The web's centered modal becomes a tall bottom sheet; ESC/body-scroll
 * handling is covered by the Modal itself (hardware back → onRequestClose).
 */

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { X, BookOpen, Plus, ChevronRight } from 'lucide-react-native';
import { TemplateCard } from './TemplateCard';
import { TemplateFilters } from './TemplateFilters';
import { HabitScienceSheet } from './HabitScienceSheet';
import { SheetShell } from './SheetShell';
import { useHabitTemplates } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import { findCatalogEntry } from '@/constants/habitCatalog';
import type { HabitTemplate, HabitFormData } from '@/types';

const TEAL_400 = '#2DD4BF';
const TEAL_300 = '#5EEAD4';
const WHITE = '#FFFFFF';
const WHITE_40 = 'rgba(255,255,255,0.4)';
const WHITE_60 = 'rgba(255,255,255,0.6)';

interface TemplateLibraryProps {
  /** Called when user selects a template to add */
  onSelectTemplate: (data: Partial<HabitFormData>, template: HabitTemplate) => void;
  /** Called when modal is closed */
  onClose: () => void;
  /** Called when the user wants to create a habit from scratch instead */
  onCreateCustom?: () => void;
}

/**
 * Modal component for browsing and selecting habit templates
 */
export function TemplateLibrary({ onSelectTemplate, onClose, onCreateCustom }: TemplateLibraryProps) {
  const { t } = useLocale();
  const {
    filteredTemplates,
    templatesLoading,
    templatesError,
    selectedLifeArea,
    searchQuery,
    loadTemplates,
    filterByLifeArea,
    setSearchQuery,
    clearFilters,
    incrementTemplatePopularity,
  } = useHabitTemplates();

  // Science sheet target (template whose catalog entry is being read)
  const [scienceTemplate, setScienceTemplate] = useState<HabitTemplate | null>(null);

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // Tapping a card opens the science detail first (when the template maps to
  // the catalog); templates without a catalog entry are added directly.
  const handleCardTap = (template: HabitTemplate) => {
    if (findCatalogEntry(template.name)) {
      setScienceTemplate(template);
    } else {
      handleSelectTemplate(template);
    }
  };

  // Handle template selection
  const handleSelectTemplate = (template: HabitTemplate) => {
    // Increment popularity (non-blocking)
    incrementTemplatePopularity(template.id);

    // Pass template data to parent
    onSelectTemplate(
      {
        name: template.nameKey ? t(template.nameKey, template.name) : template.name,
        iconName: template.iconName,
        xp: template.suggestedXp,
        // lifeArea will be selected by user in the form
      },
      template
    );
  };

  const scienceEntry = scienceTemplate ? findCatalogEntry(scienceTemplate.name) : null;

  return (
    <SheetShell onClose={onClose} height="90%" accessibilityLabel={t('templates.title')}>
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-white/10 px-6 py-4">
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-teal-500/20">
            <BookOpen size={20} color={TEAL_400} />
          </View>
          <View>
            <Text className="text-xl font-bold text-white">{t('templates.title')}</Text>
            <Text className="text-sm text-white/60">{t('templates.subtitle')}</Text>
          </View>
        </View>
        <Pressable
          onPress={onClose}
          className="rounded-xl p-2 active:bg-white/10"
          accessibilityRole="button"
          accessibilityLabel={t('actions.close')}
        >
          <X size={24} color={WHITE} />
        </Pressable>
      </View>

      {/* Filters */}
      <View className="border-b border-white/10 px-6 py-4">
        <TemplateFilters
          selectedLifeArea={selectedLifeArea}
          searchQuery={searchQuery}
          onLifeAreaChange={filterByLifeArea}
          onSearchChange={setSearchQuery}
          onClearFilters={clearFilters}
        />
      </View>

      {/* Content */}
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24 }}>
        {/* Custom habit CTA — always available so users can create from
            scratch without hunting through the catalog */}
        {onCreateCustom && (
          <Pressable
            onPress={onCreateCustom}
            className="mb-5 w-full flex-row items-center gap-3 rounded-2xl border border-dashed border-teal-400/40 bg-teal-500/10 p-4 active:bg-teal-500/20"
            accessibilityRole="button"
          >
            <View className="h-11 w-11 items-center justify-center rounded-xl bg-teal-500/20">
              <Plus size={24} color={TEAL_300} />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="text-sm font-bold text-white">
                {t('templates.createCustomTitle')}
              </Text>
              <Text className="mt-0.5 text-xs text-white/55">
                {t('templates.createCustomSubtitle')}
              </Text>
            </View>
            <ChevronRight size={20} color={WHITE_40} />
          </Pressable>
        )}

        {/* Loading state */}
        {templatesLoading && (
          <View className="items-center justify-center py-12">
            <ActivityIndicator size="large" color={WHITE_60} />
            <Text className="mt-3 text-white/60">{t('common.loading')}</Text>
          </View>
        )}

        {/* Error state */}
        {templatesError && (
          <View className="items-center justify-center py-12">
            <Text className="text-red-400">{t('errors.templatesLoadFailed')}</Text>
            <Pressable
              onPress={() => loadTemplates()}
              className="mt-4 rounded-xl bg-teal-500 px-4 py-2 active:bg-teal-600"
              accessibilityRole="button"
            >
              <Text className="text-white">{t('actions.retry')}</Text>
            </Pressable>
          </View>
        )}

        {/* Empty state */}
        {!templatesLoading && !templatesError && filteredTemplates.length === 0 && (
          <View className="items-center justify-center py-12">
            <BookOpen size={48} color={WHITE_40} />
            <Text className="mt-3 text-lg font-medium text-white/60">
              {t('templates.noResults')}
            </Text>
            <Text className="mt-1 text-sm text-white/60">
              {t('templates.tryDifferentFilters')}
            </Text>
            {(selectedLifeArea || searchQuery) && (
              <Pressable
                onPress={clearFilters}
                className="mt-4 rounded-xl bg-white/10 px-4 py-2 active:bg-white/20"
                accessibilityRole="button"
              >
                <Text className="text-white">{t('templates.clearFilters')}</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Template list (single column on mobile) */}
        {!templatesLoading && !templatesError && filteredTemplates.length > 0 && (
          <View className="gap-4">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onSelect={handleCardTap}
                onLearnMore={(tpl) => setScienceTemplate(tpl)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View className="border-t border-white/10 bg-white/5 px-6 py-4">
        <Text className="text-center text-sm text-white/50">{t('templates.footerHint')}</Text>
      </View>

      {/* Science sheet: learn about the habit, then create it from here */}
      {scienceTemplate && scienceEntry && (
        <HabitScienceSheet
          entry={scienceEntry}
          onClose={() => setScienceTemplate(null)}
          onCreate={() => {
            const tpl = scienceTemplate;
            setScienceTemplate(null);
            handleSelectTemplate(tpl);
          }}
        />
      )}
    </SheetShell>
  );
}
