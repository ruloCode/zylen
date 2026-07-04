import React from 'react';
import { Plus, FlaskConical } from 'lucide-react';
import { HABIT_ICONS } from './IconSelector';
import { useLocale } from '@/hooks/useLocale';
import { findCatalogEntry } from '@/constants/habitCatalog';
import type { HabitTemplate } from '@/types';
import { cn } from '@/utils/cn';

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

  return (
    <div
      className={cn(
        'group relative bg-white/5 rounded-2xl p-4 border border-white/10',
        'hover:bg-white/10 hover:border-teal-500/50 transition-all duration-200',
        'cursor-pointer'
      )}
      onClick={() => onSelect(template)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(template);
        }
      }}
      aria-label={`${t('templates.addToMyHabits')}: ${displayName}`}
    >
      {/* Featured badge */}
      {template.isFeatured && (
        <div className="absolute -top-2 -right-2 bg-gold-500 text-charcoal-500 text-xs font-bold px-2 py-0.5 rounded-full">
          {t('templates.featured')}
        </div>
      )}

      {/* Illustration (or icon fallback) and XP */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center justify-center w-14 h-14 rounded-xl overflow-hidden relative">
          {catalogEntry ? (
            <>
              <img
                src={`/catalog/${catalogEntry.slug}.png`}
                alt=""
                aria-hidden="true"
                className="w-full h-full object-contain"
                onError={(e) => {
                  const img = e.currentTarget;
                  img.style.display = 'none';
                  const fb = img.nextElementSibling as HTMLElement | null;
                  if (fb) fb.style.display = 'flex';
                }}
              />
              <span className="absolute inset-0 hidden items-center justify-center bg-teal-500/20 text-teal-400 rounded-xl">
                <Icon className="w-6 h-6" />
              </span>
            </>
          ) : (
            <span className="w-12 h-12 flex items-center justify-center bg-teal-500/20 text-teal-400 rounded-xl">
              <Icon className="w-6 h-6" />
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 px-2 py-1 bg-gold-500/20 text-gold-400 rounded-lg text-sm font-semibold">
          +{template.suggestedXp} {t('common.xp')}
        </div>
      </div>

      {/* Name */}
      <h3 className="text-white font-semibold text-sm mb-1 line-clamp-2">
        {displayName}
      </h3>

      {/* Description */}
      {displayDescription && (
        <p className="text-white/60 text-xs line-clamp-2 mb-3">
          {displayDescription}
        </p>
      )}

      {/* Life Area Badge + learn more */}
      <div className="flex items-center justify-between">
        <span className="text-xs px-2 py-1 bg-white/10 text-white/70 rounded-lg">
          {t(`lifeAreas.${template.lifeAreaType.toLowerCase()}`)}
        </span>

        {hasScience && onLearnMore ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onLearnMore(template);
            }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-teal-300 text-xs font-semibold bg-teal-500/10 hover:bg-teal-500/20 transition-colors"
            aria-label={`${t('habitScience.learnMore')}: ${displayName}`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            {t('habitScience.learnMore')}
          </button>
        ) : (
          <div className="flex items-center gap-1 text-teal-400 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            <Plus className="w-4 h-4" />
            {t('actions.add')}
          </div>
        )}
      </div>
    </div>
  );
}
