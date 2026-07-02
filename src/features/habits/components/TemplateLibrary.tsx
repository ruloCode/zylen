import React, { useEffect, useState } from 'react';
import { X, BookOpen, Loader2, Plus, ChevronRight } from 'lucide-react';
import { TemplateCard } from './TemplateCard';
import { TemplateFilters } from './TemplateFilters';
import { HabitScienceSheet } from './HabitScienceSheet';
import { useHabitTemplates } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import { findCatalogEntry } from '@/constants/habitCatalog';
import type { HabitTemplate, HabitFormData } from '@/types';
import { cn } from '@/utils/cn';

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

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-library-title"
    >
      <div className="bg-charcoal-500 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-teal-500/20 text-teal-400 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 id="template-library-title" className="text-xl font-bold text-white">
                {t('templates.title')}
              </h2>
              <p className="text-sm text-white/60">{t('templates.subtitle')}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
            aria-label={t('actions.close')}
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-white/10">
          <TemplateFilters
            selectedLifeArea={selectedLifeArea}
            searchQuery={searchQuery}
            onLifeAreaChange={filterByLifeArea}
            onSearchChange={setSearchQuery}
            onClearFilters={clearFilters}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Custom habit CTA — always available so users can create from
              scratch without hunting through the catalog */}
          {onCreateCustom && (
            <button
              type="button"
              onClick={onCreateCustom}
              className="w-full mb-5 flex items-center gap-3 rounded-2xl p-4 text-left border border-dashed border-teal-400/40 bg-teal-500/[0.06] hover:bg-teal-500/[0.12] hover:border-teal-400/70 transition-colors"
            >
              <span className="shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-teal-500/20 text-teal-300">
                <Plus className="w-6 h-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-white text-sm font-bold">
                  {t('templates.createCustomTitle')}
                </span>
                <span className="block text-white/55 text-xs mt-0.5">
                  {t('templates.createCustomSubtitle')}
                </span>
              </span>
              <ChevronRight className="w-5 h-5 text-white/40 shrink-0" />
            </button>
          )}

          {/* Loading state */}
          {templatesLoading && (
            <div className="flex flex-col items-center justify-center py-12 text-white/60">
              <Loader2 className="w-8 h-8 animate-spin mb-3" />
              <p>{t('common.loading')}</p>
            </div>
          )}

          {/* Error state */}
          {templatesError && (
            <div className="flex flex-col items-center justify-center py-12 text-red-400">
              <p>{templatesError}</p>
              <button
                type="button"
                onClick={() => loadTemplates()}
                className="mt-4 px-4 py-2 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition-colors"
              >
                {t('actions.retry')}
              </button>
            </div>
          )}

          {/* Empty state */}
          {!templatesLoading && !templatesError && filteredTemplates.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-white/60">
              <BookOpen className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-lg font-medium">{t('templates.noResults')}</p>
              <p className="text-sm mt-1">{t('templates.tryDifferentFilters')}</p>
              {(selectedLifeArea || searchQuery) && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
                >
                  {t('templates.clearFilters')}
                </button>
              )}
            </div>
          )}

          {/* Template grid */}
          {!templatesLoading && !templatesError && filteredTemplates.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onSelect={handleCardTap}
                  onLearnMore={(tpl) => setScienceTemplate(tpl)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-white/10 bg-white/5">
          <p className="text-center text-sm text-white/50">
            {t('templates.footerHint')}
          </p>
        </div>
      </div>

      {/* Science sheet: learn about the habit, then create it from here */}
      {scienceTemplate && (() => {
        const entry = findCatalogEntry(scienceTemplate.name);
        if (!entry) return null;
        return (
          <HabitScienceSheet
            entry={entry}
            onClose={() => setScienceTemplate(null)}
            onCreate={() => {
              const tpl = scienceTemplate;
              setScienceTemplate(null);
              handleSelectTemplate(tpl);
            }}
          />
        );
      })()}
    </div>
  );
}
