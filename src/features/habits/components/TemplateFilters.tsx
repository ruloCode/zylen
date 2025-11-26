import React from 'react';
import { Search, X } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import type { LifeAreaType } from '@/types';
import { cn } from '@/utils/cn';

const LIFE_AREAS: LifeAreaType[] = ['Health', 'Finance', 'Creativity', 'Social', 'Family', 'Career'];

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
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('templates.searchPlaceholder')}
          className={cn(
            'w-full pl-10 pr-10 py-3 rounded-xl',
            'bg-white/5 border border-white/10 text-white placeholder:text-white/40',
            'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent',
            'transition-all'
          )}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white transition-colors"
            aria-label={t('actions.clear')}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Life Area Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {/* All button */}
        <button
          type="button"
          onClick={() => onLifeAreaChange(null)}
          className={cn(
            'px-4 py-2 rounded-xl text-sm font-medium transition-all',
            selectedLifeArea === null
              ? 'bg-teal-500 text-white shadow-lg'
              : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
          )}
        >
          {t('templates.filters.all')}
        </button>

        {/* Life area buttons */}
        {LIFE_AREAS.map((area) => (
          <button
            key={area}
            type="button"
            onClick={() => onLifeAreaChange(area)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium transition-all',
              selectedLifeArea === area
                ? 'bg-teal-500 text-white shadow-lg'
                : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
            )}
          >
            {t(`lifeAreas.${area.toLowerCase()}`)}
          </button>
        ))}
      </div>

      {/* Clear filters button */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          className="flex items-center gap-2 text-sm text-teal-400 hover:text-teal-300 transition-colors"
        >
          <X className="w-4 h-4" />
          {t('templates.clearFilters')}
        </button>
      )}
    </div>
  );
}
