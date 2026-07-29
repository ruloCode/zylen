import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Check, PenLine, Plus, RefreshCw, Search, X } from 'lucide-react-native';
import { useOnboarding, useLifeAreas, useHabitTemplates, useTheme } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import { cn } from '@/utils';
import { themeHsl } from '@/theme/themeVars';
import { getIcon } from '@/components/atoms';
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
/** How many motivation-ranked suggestions sit above the bank. */
const SUGGESTION_COUNT = 4;

/** Identity of a selection: the template it came from, or its custom name. */
function selectionKey(selection: FirstHabitSelection): string {
  return selection.templateId
    ? `tpl:${selection.templateId}`
    : `custom:${selection.name.trim().toLowerCase()}`;
}

/**
 * Onboarding: pick the habits the kingdom starts with. Motivation-ranked
 * suggestions sit on top, the full habit bank (searchable, filterable by
 * category) below, and a custom habit can be written from scratch.
 *
 * Selection is ordered and multiple: the FIRST habit picked is the one the
 * payoff step completes for real (the aha moment) and the rest are created
 * alongside it. Nothing is written to the DB here.
 */
export function OnboardingStepFirstHabit({ onNext, onPrev }: OnboardingStepFirstHabitProps) {
  const { temporaryData, saveStepData, completeStep } = useOnboarding();
  const { lifeAreas, loadLifeAreas } = useLifeAreas();
  const { templates, templatesError, loadTemplates } = useHabitTemplates();
  const { theme } = useTheme();
  const { t } = useLocale();

  /** Ordered selection — index 0 is the habit the payoff step completes. */
  const [selection, setSelection] = useState<FirstHabitSelection[]>(() =>
    [temporaryData.firstHabit, ...(temporaryData.extraHabits ?? [])].filter(
      (habit): habit is FirstHabitSelection => !!habit
    )
  );
  const [showCustom, setShowCustom] = useState(false);
  const [customDraft, setCustomDraft] = useState('');
  const [query, setQuery] = useState('');
  const [areaFilter, setAreaFilter] = useState<string | null>(null);

  const themeBg = themeHsl(theme, '--background');

  // This screen is reachable as a public route, so AuthGate does NOT hold it
  // behind the store bootstrap: both datasets may still be empty on mount.
  // `probeDone` distinguishes "still fetching" from "fetched and empty" — the
  // store's loading flags are false before the effect fires, which would flash
  // the retry block on the first frame.
  const [probeDone, setProbeDone] = useState(false);
  const probeStarted = useRef(false);

  /** Fetch whatever is missing. The store actions swallow their own errors
   *  (they set *Error state), so `finally` always settles the probe. */
  const probe = useCallback(
    (needsTemplates: boolean, needsAreas: boolean) => {
      if (!needsTemplates && !needsAreas) {
        setProbeDone(true);
        return;
      }
      setProbeDone(false);
      void Promise.all([
        needsTemplates ? loadTemplates() : Promise.resolve(),
        needsAreas ? loadLifeAreas() : Promise.resolve(),
      ]).finally(() => setProbeDone(true));
    },
    [loadTemplates, loadLifeAreas]
  );

  useEffect(() => {
    // Once per mount: a failed load leaves the list empty, so retrying on
    // these deps would hammer the network. Manual retry lives in the CTA below.
    if (probeStarted.current) return;
    probeStarted.current = true;
    probe(templates.length === 0, lifeAreas.length === 0);
  }, [probe, templates.length, lifeAreas.length]);

  // Habits need a category, and a player with every area disabled used to get
  // an unescapable dead end here (no suggestions AND no valid custom habit).
  // Areas ship enabled, but fall back to all of them rather than trap anyone.
  const areasForMatching = useMemo(() => {
    const enabled = lifeAreas.filter((area) => area.enabled);
    return enabled.length > 0 ? enabled : lifeAreas;
  }, [lifeAreas]);

  // Stable default for custom habits (not whatever area the DB returned first).
  const defaultAreaId =
    areasForMatching.find((a) => String(a.area).toLowerCase() === 'health')?.id ??
    areasForMatching[0]?.id ??
    '';

  /** Every template resolved against the player's areas, deduped by name. */
  const candidates = useMemo(() => {
    const seen = new Set<string>();
    const resolved: FirstHabitCandidate[] = [];
    for (const tpl of templates) {
      // Case-insensitive: the DB stores 'health' while mappers capitalize
      // the user's areas to 'Health' (same fix as TemplateLibrary).
      const area = areasForMatching.find(
        (a) => String(a.area).toLowerCase() === String(tpl.lifeAreaType).toLowerCase()
      );
      if (!area) continue;
      const name = tpl.nameKey ? t(tpl.nameKey, tpl.name) : tpl.name;
      const key = name.trim().toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      resolved.push({ tpl, areaId: area.id, name });
    }
    return resolved;
  }, [templates, areasForMatching, t]);

  const suggestions = useMemo(
    () => rankFirstHabitSuggestions(candidates, temporaryData.motivation, SUGGESTION_COUNT),
    [candidates, temporaryData.motivation]
  );

  /** Categories that actually have templates behind them. */
  const categories = useMemo(() => {
    const byArea = new Map<string, string>();
    for (const candidate of candidates) {
      if (!byArea.has(candidate.areaId)) {
        byArea.set(candidate.areaId, String(candidate.tpl.lifeAreaType).toLowerCase());
      }
    }
    return [...byArea.entries()].map(([areaId, areaType]) => ({ areaId, areaType }));
  }, [candidates]);

  const trimmedQuery = query.trim().toLowerCase();
  const isBrowsing = trimmedQuery.length > 0 || areaFilter !== null;

  const bankCandidates = useMemo(() => {
    const suggested = new Set(suggestions.map((s) => s.tpl.id));
    return candidates.filter((candidate) => {
      // Unfiltered, the bank skips what is already offered as a suggestion.
      // While searching or filtering, show every match — the player is
      // looking for something specific and hiding hits reads as a bug.
      if (!isBrowsing && suggested.has(candidate.tpl.id)) return false;
      if (areaFilter && candidate.areaId !== areaFilter) return false;
      if (trimmedQuery && !candidate.name.toLowerCase().includes(trimmedQuery)) return false;
      return true;
    });
  }, [candidates, suggestions, isBrowsing, areaFilter, trimmedQuery]);

  const customSelections = useMemo(
    () => selection.filter((habit) => !habit.templateId),
    [selection]
  );

  const selectedKeys = useMemo(
    () => new Set(selection.map(selectionKey)),
    [selection]
  );
  const primaryKey = selection.length > 0 ? selectionKey(selection[0]) : null;

  // Same icon resolution as TemplateLibrary/HabitItem, so the habit looks
  // identical here and on Home.
  const resolveIconName = (candidate: FirstHabitCandidate) =>
    findCatalogEntry(candidate.name)?.iconName ?? candidate.tpl.iconName;

  const toggleCandidate = (candidate: FirstHabitCandidate) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next: FirstHabitSelection = {
      name: candidate.name,
      iconName: resolveIconName(candidate),
      xp: candidate.tpl.suggestedXp,
      lifeArea: candidate.areaId,
      templateId: candidate.tpl.id,
    };
    const key = selectionKey(next);
    setSelection((prev) =>
      prev.some((habit) => selectionKey(habit) === key)
        ? prev.filter((habit) => selectionKey(habit) !== key)
        : [...prev, next]
    );
  };

  const remove = (habit: FirstHabitSelection) => {
    const key = selectionKey(habit);
    setSelection((prev) => prev.filter((item) => selectionKey(item) !== key));
  };

  /** Turn the draft into a selection; returns the resulting list. */
  const commitCustomDraft = (): FirstHabitSelection[] => {
    const name = customDraft.trim();
    if (name.length < 2 || !defaultAreaId) return selection;
    const custom: FirstHabitSelection = {
      name,
      iconName: findCatalogEntry(name)?.iconName ?? 'Sparkles',
      xp: CUSTOM_HABIT_XP,
      lifeArea: defaultAreaId,
    };
    const key = selectionKey(custom);
    const next = selection.some((habit) => selectionKey(habit) === key)
      ? selection
      : [...selection, custom];
    setSelection(next);
    setCustomDraft('');
    return next;
  };

  const handleAddCustom = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    commitCustomDraft();
  };

  const canAddCustom = customDraft.trim().length >= 2 && !!defaultAreaId;

  const handleNext = () => {
    // A typed-but-not-added draft still counts — losing it reads as a bug.
    const finalSelection = canAddCustom ? commitCustomDraft() : selection;
    const [primary, ...extras] = finalSelection;
    if (!primary) return;
    saveStepData({ firstHabit: primary, extraHabits: extras });
    completeStep(ONBOARDING_STEPS.FIRST_HABIT);
    onNext();
  };

  const isLoading = !probeDone && candidates.length === 0;
  const loadFailed = probeDone && candidates.length === 0;

  /** Selectable row — shared by the suggestions and the bank. */
  const renderCandidate = (candidate: FirstHabitCandidate) => {
    const key = `tpl:${candidate.tpl.id}`;
    const isSelected = selectedKeys.has(key);
    const Icon = getIcon(resolveIconName(candidate));
    return (
      <Pressable
        key={`${candidate.tpl.id}-${candidate.areaId}`}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isSelected }}
        accessibilityLabel={candidate.name}
        onPress={() => toggleCandidate(candidate)}
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
        <View className="flex-1 gap-0.5">
          <Text
            className={cn(
              'text-base font-semibold',
              isSelected ? 'text-teal-200' : 'text-white/85'
            )}
          >
            {candidate.name}
          </Text>
          {primaryKey === key && (
            <Text className="text-[11px] font-bold uppercase tracking-wider text-gold-300">
              {t('onboarding.firstHabit.primaryBadge')}
            </Text>
          )}
        </View>
        <Text className="text-sm font-bold text-gold-300">+{candidate.tpl.suggestedXp} XP</Text>
        <View
          className={cn(
            'h-6 w-6 items-center justify-center rounded-full',
            isSelected ? 'bg-teal-400' : 'border-2 border-white/25'
          )}
        >
          {isSelected && <Check size={15} strokeWidth={3} color={themeBg} />}
        </View>
      </Pressable>
    );
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
        disabled: selection.length === 0 && !canAddCustom,
        icon: <Check size={20} color={themeHsl(theme, '--primary-foreground')} />,
      }}
    >
      {/* Nothing to show yet */}
      {isLoading && (
        <View className="items-center py-10">
          <ActivityIndicator size="large" color="#2dd4bf" />
          <Text className="mt-3 text-sm text-white/60">{t('common.loading')}</Text>
        </View>
      )}

      {/* Load failed (or no area matched) — offer a retry instead of a dead end.
          The custom habit below stays available either way. */}
      {loadFailed && (
        <Pressable
          onPress={() => probe(true, lifeAreas.length === 0)}
          accessibilityRole="button"
          className="mb-3 w-full items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-5 active:bg-white/[0.07]"
        >
          <Text className="text-center text-sm text-white/70">
            {t(templatesError ? 'errors.templatesLoadFailed' : 'onboarding.firstHabit.noResults')}
          </Text>
          <View className="flex-row items-center gap-2">
            <RefreshCw size={16} color="#2dd4bf" />
            <Text className="text-sm font-semibold text-teal-300">{t('actions.retry')}</Text>
          </View>
        </Pressable>
      )}

      {/* ── Suggestions, ranked by the motivation they just tapped ── */}
      {suggestions.length > 0 && (
        <>
          <Text className="section-label mb-2">{t('onboarding.firstHabit.suggestedLabel')}</Text>
          <View className="mb-6 gap-3">{suggestions.map(renderCandidate)}</View>
        </>
      )}

      {/* ── The full habit bank ── */}
      {candidates.length > 0 && (
        <>
          <Text className="section-label mb-2">{t('onboarding.firstHabit.bankLabel')}</Text>

          <View className="mb-3 flex-row items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-3">
            <Search size={16} color="rgba(255,255,255,0.45)" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t('onboarding.firstHabit.searchPlaceholder')}
              placeholderTextColor="rgba(255,255,255,0.45)"
              accessibilityLabel={t('onboarding.firstHabit.searchPlaceholder')}
              className="min-h-[44px] flex-1 font-medium text-white"
            />
            {query.length > 0 && (
              <Pressable
                onPress={() => setQuery('')}
                accessibilityRole="button"
                accessibilityLabel={t('actions.clear')}
                hitSlop={8}
              >
                <X size={16} color="rgba(255,255,255,0.55)" />
              </Pressable>
            )}
          </View>

          {/* Category chips */}
          <View className="mb-3 flex-row flex-wrap gap-2">
            {[{ areaId: null, areaType: null }, ...categories].map((category) => {
              const isActive = areaFilter === category.areaId;
              const label = category.areaType
                ? t(`lifeAreas.${category.areaType}`)
                : t('onboarding.firstHabit.allCategories');
              return (
                <Pressable
                  key={category.areaId ?? 'all'}
                  onPress={() => setAreaFilter(category.areaId)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  className={cn(
                    'rounded-full border px-3.5 py-2',
                    isActive
                      ? 'border-teal-400/70 bg-teal-500/20'
                      : 'border-white/10 bg-white/[0.04] active:bg-white/[0.07]'
                  )}
                >
                  <Text
                    className={cn(
                      'text-xs font-bold',
                      isActive ? 'text-teal-200' : 'text-white/70'
                    )}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View className="gap-3">{bankCandidates.map(renderCandidate)}</View>

          {bankCandidates.length === 0 && (
            <Text className="py-6 text-center text-sm text-white/50">
              {t('onboarding.firstHabit.noResults')}
            </Text>
          )}
        </>
      )}

      {/* ── Custom habits ── */}
      <View className="mt-6 gap-3">
        {customSelections.map((habit) => {
          const Icon = getIcon(habit.iconName);
          const key = selectionKey(habit);
          return (
            <View
              key={key}
              className="w-full flex-row items-center gap-3 rounded-2xl border border-teal-400/70 bg-teal-500/15 p-4"
            >
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-teal-500/25">
                <Icon size={20} color="#5eead4" />
              </View>
              <View className="flex-1 gap-0.5">
                <Text className="text-base font-semibold text-teal-200">{habit.name}</Text>
                {primaryKey === key && (
                  <Text className="text-[11px] font-bold uppercase tracking-wider text-gold-300">
                    {t('onboarding.firstHabit.primaryBadge')}
                  </Text>
                )}
              </View>
              <Text className="text-sm font-bold text-gold-300">+{habit.xp} XP</Text>
              <Pressable
                onPress={() => remove(habit)}
                accessibilityRole="button"
                accessibilityLabel={t('actions.delete')}
                hitSlop={8}
                className="h-6 w-6 items-center justify-center rounded-full bg-white/10"
              >
                <X size={14} strokeWidth={3} color="#FFFFFF" />
              </Pressable>
            </View>
          );
        })}

        {showCustom ? (
          <View className="w-full gap-3 rounded-2xl border border-white/15 bg-white/[0.04] p-4">
            <TextInput
              value={customDraft}
              onChangeText={setCustomDraft}
              placeholder={t('onboarding.firstHabit.customPlaceholder')}
              placeholderTextColor="rgba(255,255,255,0.45)"
              accessibilityLabel={t('onboarding.firstHabit.customPlaceholder')}
              className="min-h-[44px] w-full rounded-xl border border-white/15 bg-[rgb(23,20,18)] px-4 py-3 font-medium text-white"
              maxLength={60}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleAddCustom}
            />
            <Pressable
              onPress={handleAddCustom}
              disabled={!canAddCustom}
              accessibilityRole="button"
              accessibilityState={{ disabled: !canAddCustom }}
              className={cn(
                'min-h-[44px] w-full flex-row items-center justify-center gap-2 rounded-xl px-4 py-3',
                canAddCustom ? 'bg-teal-500/25 active:opacity-90' : 'bg-white/[0.06]'
              )}
            >
              <Plus size={16} color={canAddCustom ? '#5eead4' : 'rgba(255,255,255,0.35)'} />
              <Text
                className={cn(
                  'text-sm font-bold',
                  canAddCustom ? 'text-teal-200' : 'text-white/35'
                )}
              >
                {t('onboarding.firstHabit.customAdd')}
              </Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={() => setShowCustom(true)}
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
        {selection.length > 0
          ? t('onboarding.firstHabit.selectedCount', { count: selection.length })
          : t('onboarding.firstHabit.hint')}
      </Text>
    </OnboardingScreen>
  );
}

export default OnboardingStepFirstHabit;
