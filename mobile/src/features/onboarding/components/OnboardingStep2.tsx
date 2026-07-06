import React, { useState, useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  Heart,
  DollarSign,
  Palette,
  Users,
  Home as HomeIcon,
  Briefcase,
  ArrowLeft,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react-native';
import { useOnboarding, useLifeAreas, useTheme } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import { cn } from '@/utils';
import { LifeAreaType } from '@/types/habit';
import { themeHsl } from '@/theme/themeVars';

interface OnboardingStep2Props {
  onNext: () => void;
  onPrev: () => void;
}

// Icon mapping for predefined areas
const AREA_ICONS: Record<LifeAreaType, LucideIcon> = {
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
  const { theme } = useTheme();
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
    completeStep(2);
    onNext();
  };

  const predefinedAreas = lifeAreas.filter((area) => !area.isCustom);
  const noneSelected = selectedAreaIds.length === 0;
  const primaryForeground = themeHsl(theme, '--primary-foreground');

  return (
    <View className="mx-auto w-full max-w-2xl">
      {/* Title */}
      <View className="mb-8 items-center">
        <Text className="mb-3 text-center text-2xl font-bold text-white">
          {t('onboarding.step2.title')}
        </Text>
        <Text className="text-center text-gray-300">
          {t('onboarding.step2.description')}
        </Text>
      </View>

      {/* Life Areas Grid */}
      <View className="mb-8 flex-row flex-wrap justify-between gap-y-3">
        {predefinedAreas.map((area) => {
          const isSelected = selectedAreaIds.includes(area.id);
          const Icon = AREA_ICONS[area.area as LifeAreaType] || Heart;

          return (
            <Pressable
              key={area.id}
              onPress={() => toggleArea(area.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={t(`lifeAreas.${area.area.toLowerCase()}`)}
              className={cn(
                'min-h-[120px] w-[48.5%] rounded-xl border-2 p-4',
                'items-center justify-center gap-3',
                isSelected
                  ? 'border-teal-500 bg-teal-500/20'
                  : 'border-charcoal-600 bg-charcoal-700/50 active:border-charcoal-500'
              )}
            >
              <Icon size={32} color={isSelected ? '#2dd4bf' : '#9CA3AF'} />
              <Text
                className={cn(
                  'text-center text-sm font-semibold',
                  isSelected ? 'text-white' : 'text-gray-300'
                )}
              >
                {t(`lifeAreas.${area.area.toLowerCase()}`)}
              </Text>
              {isSelected && <View className="h-2 w-2 rounded-full bg-teal-400" />}
            </Pressable>
          );
        })}
      </View>

      {/* Selected Count */}
      <Text className="mb-6 text-center text-sm text-gray-400">
        {selectedAreaIds.length} {t('onboarding.step2.areasSelected')}
      </Text>

      {/* Navigation Buttons */}
      <View className="flex-row gap-4">
        <Pressable
          onPress={onPrev}
          accessibilityRole="button"
          className={cn(
            'flex-1 flex-row items-center justify-center gap-2 rounded-xl px-6 py-3',
            'border-2 border-charcoal-600 bg-charcoal-700 active:bg-charcoal-600'
          )}
        >
          <ArrowLeft size={20} color="#FFFFFF" />
          <Text className="font-semibold text-white">{t('onboarding.prevButton')}</Text>
        </Pressable>

        <Pressable
          onPress={handleNext}
          disabled={noneSelected}
          accessibilityRole="button"
          accessibilityState={{ disabled: noneSelected }}
          className={cn(
            'flex-1 flex-row items-center justify-center gap-2 rounded-xl px-6 py-3',
            noneSelected ? 'bg-gray-700' : 'bg-primary active:opacity-90'
          )}
        >
          <Text
            className={cn(
              'font-semibold',
              noneSelected ? 'text-gray-400' : 'text-primary-foreground'
            )}
          >
            {t('onboarding.nextButton')}
          </Text>
          <ArrowRight size={20} color={noneSelected ? '#9CA3AF' : primaryForeground} />
        </Pressable>
      </View>
    </View>
  );
}

export default OnboardingStep2;
