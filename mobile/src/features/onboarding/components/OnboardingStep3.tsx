import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import {
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Check,
  Minus,
} from 'lucide-react-native';
import { useOnboarding, useLifeAreas, useHabitTemplates, useTheme } from '@/store';
// Web imports HABIT_ICONS from '@/features/habits/components/IconSelector';
// on native the identical map lives in the ported atoms infra.
import { HABIT_ICONS } from '@/components/atoms';
import { Select } from '@/components/atoms';
import { useLocale } from '@/hooks/useLocale';
import { cn } from '@/utils';
import { themeHsl } from '@/theme/themeVars';

interface OnboardingStep3Props {
  onNext: () => void;
  onPrev: () => void;
}

interface TempHabit {
  name: string;
  iconName: string;
  xp: number;
  lifeArea: string;
}

/**
 * Onboarding Step 3: Create First Habits
 */
export function OnboardingStep3({ onNext, onPrev }: OnboardingStep3Props) {
  const { temporaryData, saveStepData, completeStep } = useOnboarding();
  const { lifeAreas } = useLifeAreas();
  const { templates, templatesLoading, loadTemplates } = useHabitTemplates();
  const { theme } = useTheme();
  const { t } = useLocale();

  const [habits, setHabits] = useState<TempHabit[]>(
    temporaryData.createdHabits || []
  );
  const [showForm, setShowForm] = useState(false);
  const [newHabit, setNewHabit] = useState<TempHabit>({
    name: '',
    iconName: 'CheckCircle',
    xp: 30,
    lifeArea: temporaryData.selectedLifeAreaIds?.[0] || '',
  });

  // Load global habit templates once (used to suggest common habits)
  useEffect(() => {
    if (templates.length === 0 && !templatesLoading) {
      loadTemplates();
    }
  }, [templates.length, templatesLoading, loadTemplates]);

  const selectedAreas = lifeAreas.filter((area) =>
    temporaryData.selectedLifeAreaIds?.includes(area.id)
  );

  // Build suggestions from templates that match the user's selected life areas
  const suggestions = useMemo(() => {
    return templates
      .map((tpl) => {
        const area = selectedAreas.find((a) => a.area === tpl.lifeAreaType);
        return area ? { tpl, areaId: area.id } : null;
      })
      .filter(
        (s): s is { tpl: (typeof templates)[number]; areaId: string } => s !== null
      );
  }, [templates, selectedAreas]);

  const templateDisplayName = (tpl: (typeof templates)[number]) =>
    tpl.nameKey ? t(tpl.nameKey, tpl.name) : tpl.name;

  const isHabitAdded = (name: string, areaId: string) =>
    habits.some((h) => h.name === name && h.lifeArea === areaId);

  const toggleTemplate = (
    tpl: (typeof templates)[number],
    areaId: string
  ) => {
    const name = templateDisplayName(tpl);
    if (isHabitAdded(name, areaId)) {
      setHabits(habits.filter((h) => !(h.name === name && h.lifeArea === areaId)));
      return;
    }
    setHabits([
      ...habits,
      { name, iconName: tpl.iconName, xp: tpl.suggestedXp, lifeArea: areaId },
    ]);
  };

  const addHabit = () => {
    if (!newHabit.name.trim() || !newHabit.lifeArea) return;

    setHabits([...habits, newHabit]);
    setNewHabit({
      name: '',
      iconName: 'CheckCircle',
      xp: 30,
      lifeArea: temporaryData.selectedLifeAreaIds?.[0] || '',
    });
    setShowForm(false);
  };

  const removeHabit = (index: number) => {
    setHabits(habits.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    if (habits.length === 0) return;

    saveStepData({ createdHabits: habits });
    completeStep(3);
    onNext();
  };

  const noHabits = habits.length === 0;
  const primaryForeground = themeHsl(theme, '--primary-foreground');

  return (
    <View className="mx-auto w-full max-w-2xl">
      <View className="mb-8 items-center">
        <Text className="mb-3 text-center text-2xl font-bold text-white">
          {t('onboarding.step3.title')}
        </Text>
        <Text className="text-center text-gray-300">{t('onboarding.step3.description')}</Text>
      </View>

      {/* Common habit suggestions (from templates) */}
      {suggestions.length > 0 && (
        <View className="mb-6">
          <Text className="mb-3 text-sm font-medium text-gray-300">
            {t('onboarding.step3.suggestionsTitle', 'Hábitos comunes')}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {suggestions.map(({ tpl, areaId }) => {
              const name = templateDisplayName(tpl);
              const added = isHabitAdded(name, areaId);
              const Icon = HABIT_ICONS[tpl.iconName] || HABIT_ICONS['Target'];
              return (
                <Pressable
                  key={`${tpl.id}-${areaId}`}
                  onPress={() => toggleTemplate(tpl, areaId)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: added }}
                  className={cn(
                    'flex-row items-center gap-2 rounded-xl border px-3 py-2',
                    added
                      ? 'border-teal-500 bg-teal-500/20'
                      : 'border-charcoal-600 bg-charcoal-700/50 active:border-teal-500/60'
                  )}
                >
                  {added ? (
                    <Check size={16} color="#2dd4bf" />
                  ) : (
                    <Icon size={16} color="#E5E7EB" />
                  )}
                  <Text className={cn('text-sm', added ? 'text-teal-300' : 'text-gray-200')}>
                    {name}
                  </Text>
                  <Text className="text-xs font-semibold text-teal-300">
                    +{tpl.suggestedXp}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* Habits List */}
      <View className="mb-6 gap-3">
        {habits.map((habit, index) => {
          const area = lifeAreas.find((a) => a.id === habit.lifeArea);
          return (
            <View
              key={index}
              className="flex-row items-center justify-between rounded-xl border border-charcoal-600 bg-charcoal-700/50 p-4"
            >
              <View className="flex-1">
                <Text className="font-semibold text-white">{habit.name}</Text>
                <Text className="text-sm text-gray-400">
                  {habit.xp} {t('common.xp')} •{' '}
                  {area ? t(`lifeAreas.${area.area.toLowerCase()}`) : t('common.noArea')}
                </Text>
              </View>
              <Pressable
                onPress={() => removeHabit(index)}
                accessibilityRole="button"
                accessibilityLabel={`${t('actions.delete')} ${habit.name}`}
                className="min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 active:bg-red-500/20"
              >
                <Trash2 size={18} color="#f87171" />
              </Pressable>
            </View>
          );
        })}

        {habits.length === 0 && !showForm && (
          <Text className="py-8 text-center text-gray-400">
            {t('onboarding.step3.noHabits')}
          </Text>
        )}
      </View>

      {/* Add Habit Form */}
      {showForm ? (
        <View className="mb-6 gap-4 rounded-xl border border-charcoal-600 bg-charcoal-700/50 p-4">
          <TextInput
            value={newHabit.name}
            onChangeText={(text) => setNewHabit({ ...newHabit, name: text })}
            placeholder={t('onboarding.step3.habitNamePlaceholder')}
            placeholderTextColor="#9CA3AF"
            accessibilityLabel={t('onboarding.step3.habitNamePlaceholder')}
            className="min-h-[44px] w-full rounded-lg border border-charcoal-600 bg-charcoal-800 px-4 py-3 text-white"
            autoFocus
          />

          <View className="flex-row gap-4">
            {/* XP stepper (web: <input type="range" 10-100 step 10>) */}
            <View className="flex-1">
              <Text className="mb-2 text-sm text-gray-400">XP</Text>
              <View className="flex-row items-center justify-between gap-2">
                <Pressable
                  onPress={() =>
                    setNewHabit((h) => ({ ...h, xp: Math.max(10, h.xp - 10) }))
                  }
                  accessibilityRole="button"
                  accessibilityLabel="-10 XP"
                  className="h-11 w-11 items-center justify-center rounded-lg border border-charcoal-600 bg-charcoal-800 active:bg-charcoal-600"
                >
                  <Minus size={18} color="#FFFFFF" />
                </Pressable>
                <Text className="flex-1 text-center font-semibold text-white">
                  {newHabit.xp}
                </Text>
                <Pressable
                  onPress={() =>
                    setNewHabit((h) => ({ ...h, xp: Math.min(100, h.xp + 10) }))
                  }
                  accessibilityRole="button"
                  accessibilityLabel="+10 XP"
                  className="h-11 w-11 items-center justify-center rounded-lg border border-charcoal-600 bg-charcoal-800 active:bg-charcoal-600"
                >
                  <Plus size={18} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>

            <View className="flex-1">
              <Text className="mb-2 text-sm text-gray-400">
                {t('onboarding.step3.lifeAreaLabel')}
              </Text>
              <Select
                value={newHabit.lifeArea}
                onChange={(e) => setNewHabit({ ...newHabit, lifeArea: e.target.value })}
                aria-label={t('onboarding.step3.lifeAreaLabel')}
                options={selectedAreas.map((area) => ({
                  value: area.id,
                  label: t(`lifeAreas.${area.area.toLowerCase()}`),
                }))}
              />
            </View>
          </View>

          <View className="flex-row gap-2">
            <Pressable
              onPress={() => setShowForm(false)}
              accessibilityRole="button"
              className="flex-1 items-center rounded-lg bg-charcoal-600 px-4 py-2 active:bg-charcoal-500"
            >
              <Text className="text-white">{t('common.cancel')}</Text>
            </Pressable>
            <Pressable
              onPress={addHabit}
              disabled={!newHabit.name.trim()}
              accessibilityRole="button"
              accessibilityState={{ disabled: !newHabit.name.trim() }}
              className={cn(
                'flex-1 items-center rounded-lg px-4 py-2',
                newHabit.name.trim() ? 'bg-teal-500 active:bg-teal-600' : 'bg-gray-700'
              )}
            >
              <Text
                className={cn(
                  'font-semibold',
                  newHabit.name.trim() ? 'text-white' : 'text-gray-400'
                )}
              >
                {t('onboarding.step3.addButton')}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          onPress={() => setShowForm(true)}
          accessibilityRole="button"
          className="mb-6 w-full flex-row items-center justify-center gap-2 rounded-xl border-2 border-dashed border-charcoal-600 bg-charcoal-700 px-4 py-3"
        >
          <Plus size={20} color="#D1D5DB" />
          <Text className="text-gray-300">{t('onboarding.step3.addHabitButton')}</Text>
        </Pressable>
      )}

      {/* Navigation */}
      <View className="flex-row gap-4">
        <Pressable
          onPress={onPrev}
          accessibilityRole="button"
          className="flex-1 flex-row items-center justify-center gap-2 rounded-xl border-2 border-charcoal-600 bg-charcoal-700 px-6 py-3 active:bg-charcoal-600"
        >
          <ArrowLeft size={20} color="#FFFFFF" />
          <Text className="font-semibold text-white">{t('onboarding.prevButton')}</Text>
        </Pressable>

        <Pressable
          onPress={handleNext}
          disabled={noHabits}
          accessibilityRole="button"
          accessibilityState={{ disabled: noHabits }}
          className={cn(
            'flex-1 flex-row items-center justify-center gap-2 rounded-xl px-6 py-3',
            noHabits ? 'bg-gray-700' : 'bg-primary active:opacity-90'
          )}
        >
          <Text
            className={cn('font-semibold', noHabits ? 'text-gray-400' : 'text-primary-foreground')}
          >
            {t('onboarding.nextButton')}
          </Text>
          <ArrowRight size={20} color={noHabits ? '#9CA3AF' : primaryForeground} />
        </Pressable>
      </View>
    </View>
  );
}

export default OnboardingStep3;
