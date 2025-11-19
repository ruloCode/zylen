import React, { useState, useEffect } from 'react';
import { Heart, DollarSign, Palette, Users, Home as HomeIcon, Briefcase, BookOpen, Brain, Sparkles, Home, Gamepad2, ArrowLeft, ArrowRight } from 'lucide-react';
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
  Education: BookOpen,
  Mindfulness: Brain,
  Spiritual: Sparkles,
  Environment: Home,
  Fun: Gamepad2,
};

/**
 * Onboarding Step 2: Life Areas Selection
 */
export function OnboardingStep2({ onNext, onPrev }: OnboardingStep2Props) {
  const { temporaryData, saveStepData, completeStep } = useOnboarding();
  const { lifeAreas } = useLifeAreas();
  const { t } = useLocale();

  const [selectedAreaIds, setSelectedAreaIds] = useState<string[]>(
    temporaryData.selectedLifeAreaIds || []
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
    <div className="w-full max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Title */}
      <div className="text-center mb-6 md:mb-10">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 uppercase">
          {t('onboarding.step2.title')}
        </h2>
        <p className="text-white/70 text-sm sm:text-base max-w-xl mx-auto">
          {t('onboarding.step2.description')}
        </p>
      </div>

      {/* Life Areas Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
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
                'p-4 md:p-5 rounded-none border-2 transition-all duration-300 min-h-[100px] md:min-h-[120px]',
                'flex flex-col items-center justify-center gap-2',
                'focus:outline-none focus:ring-2 focus:ring-[rgb(137,184,32)]',
                'hover:scale-105',
                isSelected
                  ? 'bg-[rgb(137,184,32)]/20 border-[rgb(137,184,32)] shadow-2xl shadow-[rgb(137,184,32)]/30'
                  : 'bg-charcoal-800/80 border-charcoal-600 hover:border-[rgb(137,184,32)]/50'
              )}
            >
              <Icon
                size={28}
                className={cn(
                  'transition-colors duration-200',
                  isSelected ? 'text-[rgb(137,184,32)]' : 'text-gray-400'
                )}
              />
              <span
                className={cn(
                  'font-semibold text-xs sm:text-sm transition-colors duration-200',
                  isSelected ? 'text-white' : 'text-gray-300'
                )}
              >
                {t(`lifeAreas.${area.area.toLowerCase()}`)}
              </span>
              {isSelected && (
                <div className="w-2 h-2 rounded-none bg-[rgb(137,184,32)] animate-in zoom-in duration-200" />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Count */}
      {selectedAreaIds.length > 0 && (
        <p className="text-center text-xs sm:text-sm text-[rgb(137,184,32)] mb-4 font-medium animate-in fade-in zoom-in duration-300">
          {selectedAreaIds.length} {t('onboarding.step2.areasSelected')}
        </p>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-3 mt-4">
        <button
          type="button"
          onClick={onPrev}
          className={cn(
            'px-4 py-2 md:py-3 rounded-none font-medium text-sm',
            'flex items-center justify-center gap-2',
            'bg-charcoal-800/50 text-white/70 border border-charcoal-600',
            'hover:bg-charcoal-700 hover:text-white',
            'transition-all duration-300',
            'focus:outline-none focus:ring-2 focus:ring-[rgb(137,184,32)]'
          )}
        >
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">{t('onboarding.prevButton')}</span>
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={selectedAreaIds.length === 0}
          className={cn(
            'flex-1 py-3 md:py-4 px-6 rounded-none font-bold text-base md:text-lg uppercase',
            'flex items-center justify-center gap-2',
            'transition-all duration-300',
            'focus:outline-none focus:ring-2 focus:ring-[rgb(137,184,32)]',
            selectedAreaIds.length === 0
              ? 'bg-charcoal-700 text-charcoal-500 cursor-not-allowed'
              : 'bg-[rgb(137,184,32)] text-charcoal-900 hover:bg-[rgb(120,160,28)] shadow-xl hover:shadow-[rgb(137,184,32)]/40 hover:scale-[1.02] active:scale-[0.98]'
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
