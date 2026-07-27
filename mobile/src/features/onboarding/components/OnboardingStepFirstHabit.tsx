import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ArrowRight, Check, PenLine, RefreshCw } from 'lucide-react-native';
import { useOnboarding, useLifeAreas, useHabitTemplates, useTheme } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import { cn } from '@/utils';
import { themeHsl } from '@/theme/themeVars';
import { HABIT_ICONS } from '@/components/atoms';
import { findCatalogEntry } from '@/constants/habitCatalog';
import { ONBOARDING_STEPS } from '@/types';
import type { FirstHabitSelection } from '@/types';
import { OnboardingScreen } from './OnboardingScreen';
import {
  rankFirstHabitSuggestions,
  type FirstHabitCandidate,
} from '../utils/firstHabitSuggestions';

interface OnboardingStepFirstHabitProps {
  onNext: () => void;
  onPrev: () => void;
}

const CUSTOM_HABIT_XP = 30;

/**
 * Onboarding: pick exactly ONE first habit. Suggestions are ranked by the
 * motivation tapped in the previous step; a collapsible input covers custom
 * habits. Nothing is written to the DB here — the payoff step creates and
 * completes the habit in one idempotent sequence.
 */
export function OnboardingStepFirstHabit({ onNext, onPrev }: OnboardingStepFirstHabitProps) {
  const { temporaryData, saveStepData, completeStep } = useOnboarding();
  const { lifeAreas } = useLifeAreas();
  const { templates, templatesLoading, templatesError, loadTemplates } = useHabitTemplates();
  const { theme } = useTheme();
  const { t } = useLocale();

  const savedIsCustom = !!temporaryData.firstHabit && !temporaryData.firstHabit.templateId;
  const [selected, setSelected] = useState<FirstHabitSelection | undefined>(
    savedIsCustom ? undefined : temporaryData.firstHabit
  );
  const [showCustom, setShowCustom] = useState(savedIsCustom);
  const [customName, setCustomName] = useState(
    savedIsCustom ? temporaryData.firstHabit?.name ?? '' : ''
  );

  const themeBg = themeHsl(theme, '--background');

  // Load templates once per mount; a failed load leaves templates empty AND
  // loading=false, so re-running on those deps would hammer the network.
  const attemptedLoad = useRef(false);
  useEffect(() => {
    if (!attemptedLoad.current && templates.length === 0) {
      attemptedLoad.current = true;
      loadTemplates();
    }
  }, [templates.length, loadTemplates]);

  const availableAreas = useMemo(
    () => lifeAreas.filter((area) => area.enabled),
    [lifeAreas]
  );
  // Stable default for custom habits (not whatever area the DB returned first).
  const defaultAreaId =
    availableAreas.find((a) => String(a.area).toLowerCase() === 'health')?.id ??
    availableAreas[0]?.id ??
    '';

  const suggestions = useMemo(() => {
    const candidates: FirstHabitCandidate[] = templates
      .map((tpl) => {
        // Case-insensitive: the DB stores 'health' while mappers capitalize
        // the user's areas to 'Health' (same fix as TemplateLibrary).
        const area = availableAreas.find(
          (a) => String(a.area).toLowerCase() === String(tpl.lifeAreaType).toLowerCase()
        );
        if (!area) return null;
        const name = tpl.nameKey ? t(tpl.nameKey, tpl.name) : tpl.name;
        return { tpl, areaId: area.id, name };
      })
      .filter((c): c is FirstHabitCandidate => c !== null);
    return rankFirstHabitSuggestions(candidates, temporaryData.motivation);
  }, [templates, availableAreas, temporaryData.motivation, t]);

  const trimmedCustom = customName.trim();
  const customSelection: FirstHabitSelection | undefined =
    showCustom && trimmedCustom.length >= 2 && defaultAreaId
      ? {
          name: trimmedCustom,
          iconName: findCatalogEntry(trimmedCustom)?.iconName ?? 'Sparkles',
          xp: CUSTOM_HABIT_XP,
          lifeArea: defaultAreaId,
        }
      : undefined;

  const effectiveSelection = showCustom ? customSelection : selected;

  // Same icon resolution as TemplateLibrary/HabitItem, so the habit looks
  // identical here and on Home.
  const resolveIconName = (candidate: FirstHabitCandidate) =>
    findCatalogEntry(candidate.name)?.iconName ?? candidate.tpl.iconName;

  const handlePickSuggestion = (candidate: FirstHabitCandidate) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowCustom(false);
    setSelected({
      name: candidate.name,
      iconName: resolveIconName(candidate),
      xp: candidate.tpl.suggestedXp,
      lifeArea: candidate.areaId,
      templateId: candidate.tpl.id,
    });
  };

  const handleNext = () => {
    if (!effectiveSelection) return;
    saveStepData({ firstHabit: effectiveSelection });
    completeStep(ONBOARDING_STEPS.FIRST_HABIT);
    onNext();
  };

  return (
    <OnboardingScreen
      step={ONBOARDING_STEPS.FIRST_HABIT}
      onBack={onPrev}
      title={t('onboarding.firstHabit.title')}
      subtitle={t('onboarding.firstHabit.subtitle')}
      cta={{
        label: t('onboarding.nextButton'),
        onPress: handleNext,
        disabled: !effectiveSelection,
        icon: <ArrowRight size={20} color={themeHsl(theme, '--primary-foreground')} />,
      }}
    >
      {/* Templates still loading and nothing to show yet */}
      {templatesLoading && suggestions.length === 0 && (
        <View className="items-center py-10">
          <ActivityIndicator size="large" color="#2dd4bf" />
          <Text className="mt-3 text-sm text-white/60">{t('common.loading')}</Text>
        </View>
      )}

      {/* Load failed — offer a retry instead of a dead end */}
      {!templatesLoading && templatesError && suggestions.length === 0 && (
        <Pressable
          onPress={() => loadTemplates()}
          accessibilityRole="button"
          className="mb-3 w-full items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-5 active:bg-white/[0.07]"
        >
          <Text className="text-center text-sm text-white/70">
            {t('errors.templatesLoadFailed')}
          </Text>
          <View className="flex-row items-center gap-2">
            <RefreshCw size={16} color="#2dd4bf" />
            <Text className="text-sm font-semibold text-teal-300">{t('actions.retry')}</Text>
          </View>
        </Pressable>
      )}

      <View className="gap-3" accessibilityRole="radiogroup">
        {suggestions.map((candidate) => {
          const isSelected =
            !showCustom &&
            selected?.templateId === candidate.tpl.id &&
            selected?.lifeArea === candidate.areaId;
          const Icon = HABIT_ICONS[resolveIconName(candidate)] || HABIT_ICONS['Target'];
          return (
            <Pressable
              key={`${candidate.tpl.id}-${candidate.areaId}`}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
              onPress={() => handlePickSuggestion(candidate)}
              className={cn(
                'w-full flex-row items-center gap-3 rounded-2xl border p-4',
                isSelected
                  ? 'border-teal-400/70 bg-teal-500/15'
                  : 'border-white/10 bg-white/[0.04] active:bg-white/[0.07]'
              )}
            >
              <View
                className={cn(
                  'h-10 w-10 items-center justify-center rounded-xl',
                  isSelected ? 'bg-teal-500/25' : 'bg-white/[0.06]'
                )}
              >
                <Icon size={20} color={isSelected ? '#5eead4' : '#E5E7EB'} />
              </View>
              <Text
                className={cn(
                  'flex-1 text-base font-semibold',
                  isSelected ? 'text-teal-200' : 'text-white/85'
                )}
              >
                {candidate.name}
              </Text>
              <Text className="text-sm font-bold text-gold-300">
                +{candidate.tpl.suggestedXp} XP
              </Text>
              {isSelected && (
                <View className="h-6 w-6 items-center justify-center rounded-full bg-teal-400">
                  <Check size={15} strokeWidth={3} color={themeBg} />
                </View>
              )}
            </Pressable>
          );
        })}

        {/* Custom habit — the only other keyboard in the whole flow */}
        {showCustom ? (
          <View
            className={cn(
              'w-full gap-3 rounded-2xl border p-4',
              customSelection
                ? 'border-teal-400/70 bg-teal-500/15'
                : 'border-white/15 bg-white/[0.04]'
            )}
          >
            <TextInput
              value={customName}
              onChangeText={setCustomName}
              placeholder={t('onboarding.firstHabit.customPlaceholder')}
              placeholderTextColor="rgba(255,255,255,0.45)"
              accessibilityLabel={t('onboarding.firstHabit.customPlaceholder')}
              className="min-h-[44px] w-full rounded-xl border border-white/15 bg-[rgb(23,20,18)] px-4 py-3 font-medium text-white"
              maxLength={60}
              autoFocus
            />
          </View>
        ) : (
          <Pressable
            onPress={() => {
              setShowCustom(true);
            }}
            accessibilityRole="button"
            className="w-full flex-row items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/15 px-4 py-4 active:bg-white/[0.05]"
          >
            <PenLine size={18} color="#D1D5DB" />
            <Text className="font-semibold text-gray-300">
              {t('onboarding.firstHabit.customCta')}
            </Text>
          </Pressable>
        )}
      </View>

      <Text className="mt-4 text-center text-xs text-white/60">
        {t('onboarding.firstHabit.hint')}
      </Text>
    </OnboardingScreen>
  );
}

export default OnboardingStepFirstHabit;
