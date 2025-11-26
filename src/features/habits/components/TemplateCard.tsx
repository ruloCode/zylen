import React from 'react';
import { Plus } from 'lucide-react';
import { HABIT_ICONS } from './IconSelector';
import { useLocale } from '@/hooks/useLocale';
import type { HabitTemplate } from '@/types';
import { cn } from '@/utils/cn';

interface TemplateCardProps {
  template: HabitTemplate;
  onSelect: (template: HabitTemplate) => void;
}

/**
 * Displays a single habit template in a card format
 */
export function TemplateCard({ template, onSelect }: TemplateCardProps) {
  const { t } = useLocale();
  const Icon = HABIT_ICONS[template.iconName] || HABIT_ICONS['Target'];

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

      {/* Icon and XP */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center justify-center w-12 h-12 bg-teal-500/20 text-teal-400 rounded-xl">
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-1 px-2 py-1 bg-gold-500/20 text-gold-400 rounded-lg text-sm font-semibold">
          +{template.suggestedXp} XP
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

      {/* Life Area Badge */}
      <div className="flex items-center justify-between">
        <span className="text-xs px-2 py-1 bg-white/10 text-white/70 rounded-lg">
          {t(`lifeAreas.${template.lifeAreaType.toLowerCase()}`)}
        </span>

        {/* Add button (visible on hover) */}
        <div className="flex items-center gap-1 text-teal-400 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          <Plus className="w-4 h-4" />
          {t('actions.add')}
        </div>
      </div>
    </div>
  );
}
