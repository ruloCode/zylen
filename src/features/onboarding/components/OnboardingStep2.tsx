import React, { useState, useEffect } from 'react';
import { Heart, DollarSign, Palette, Users, Home as HomeIcon, Briefcase, Plus, ArrowLeft, ArrowRight } from 'lucide-react';
import { useOnboarding, useLifeAreas } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import { cn } from '@/utils';
import { LifeAreaType } from '@/types/habit';

interface OnboardingStep2Props {
  onNext: () => void;
  onPrev: () => void;
}

// Icon mapping for predefined areas
const AREA_ICONS: Record<LifeAreaType, React.ComponentType<{ size?: number; className?: string }>> = {
  Health: Heart,
  Finance: DollarSign,
  Creativity: Palette,
  Social: Users,
  Family: HomeIcon,
  Career: Briefcase,
};

/**
 * Onboarding Step 2: Life Areas Selection
 */
export function OnboardingStep2({ onNext, onPrev }: OnboardingStep2Props) {
  const { temporaryData, saveStepData, completeStep } = useOnboarding();
  const { lifeAreas } = useLifeAreas();
  const { t } = useLocale();

  // Get predefined area IDs
  const predefinedAreaIds = lifeAreas
    .filter((area) => !area.isCustom)
    .map((area) => area.id);

  const [selectedAreaIds, setSelectedAreaIds] = useState<string[]>(
    temporaryData.selectedLifeAreaIds || predefinedAreaIds
  );

  useEffect(() => {
    // Load saved selection if exists
    if (temporaryData.selectedLifeAreaIds) {
      setSelectedAreaIds(temporaryData.selectedLifeAreaIds);
    }
  }, [temporaryData.selectedLifeAreaIds]);

  const toggleArea = (areaId: string) => {
    setSelectedAreaIds((prev) =>
      prev.includes(areaId)
        ? prev.filter((id) => id !== areaId)
        : [...prev, areaId]
    );
  };

  const handleNext = () => {
    if (selectedAreaIds.length === 0) return;

    saveStepData({ selectedLifeAreaIds: selectedAreaIds });
    completeStep(1);
    onNext();
  };

  const predefinedAreas = lifeAreas.filter((area) => !area.isCustom);

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Title */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-3">
          {t('onboarding.step2.title')}
        </h2>
        <p className="text-gray-300">
          {t('onboarding.step2.description')}
        </p>
      </div>

      {/* Life Areas Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-3 sm:gap-4 mb-8">
        {predefinedAreas.map((area) => {
          const isSelected = selectedAreaIds.includes(area.id);
          const Icon = AREA_ICONS[area.area as LifeAreaType] || Heart;

          return (
            <button
              key={area.id}
              type="button"
              onClick={() => toggleArea(area.id)}
              aria-pressed={isSelected}
              aria-label={`${isSelected ? 'Deselect' : 'Select'} ${t(`lifeAreas.${area.area.toLowerCase()}`)}`}
              className={cn(
                'p-4 rounded-xl border-2 transition-all duration-200 min-h-[120px]',
                'flex flex-col items-center gap-3',
                'focus:outline-none focus:ring-2 focus:ring-gold-400',
                isSelected
                  ? 'bg-teal-500/20 border-teal-500 scale-105 shadow-lg shadow-teal-500/20'
                  : 'bg-charcoal-700/50 border-charcoal-600 hover:border-charcoal-500'
              )}
            >
              <Icon
                size={32}
                className={cn(
                  'transition-colors duration-200',
                  isSelected ? 'text-teal-400' : 'text-gray-400'
                )}
              />
              <span
                className={cn(
                  'font-semibold text-sm transition-colors duration-200',
                  isSelected ? 'text-white' : 'text-gray-300'
                )}
              >
                {t(`lifeAreas.${area.area.toLowerCase()}`)}
              </span>
              {isSelected && (
                <div className="w-2 h-2 rounded-full bg-teal-400 animate-in zoom-in duration-200" />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Count */}
      <p className="text-center text-sm text-gray-400 mb-6">
        {selectedAreaIds.length} {t('onboarding.step2.areasSelected')}
      </p>

      {/* Navigation Buttons */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={onPrev}
          className={cn(
            'flex-1 py-3 px-6 rounded-xl font-semibold',
            'flex items-center justify-center gap-2',
            'bg-charcoal-700 text-white border-2 border-charcoal-600',
            'hover:bg-charcoal-600 hover:border-charcoal-500',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-gold-400'
          )}
        >
          <ArrowLeft size={20} />
          {t('onboarding.prevButton')}
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={selectedAreaIds.length === 0}
          className={cn(
            'flex-1 py-3 px-6 rounded-xl font-semibold',
            'flex items-center justify-center gap-2',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-gold-400',
            selectedAreaIds.length === 0
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-gold-500 to-gold-600 text-white hover:from-gold-600 hover:to-gold-700 shadow-lg hover:shadow-gold-500/50'
          )}
        >
          {t('onboarding.nextButton')}
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}

export default OnboardingStep2;
