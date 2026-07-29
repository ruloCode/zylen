import React, { useCallback, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { ArrowRight, Coins, Flame, Sparkles, Trophy, Check } from 'lucide-react-native';
import toast from '@/lib/toast';
import { useAppStore, useHabits, useOnboarding, useTheme, useUser } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import { themeHsl } from '@/theme/themeVars';
import { HabitsService } from '@/services/supabase/habits.service';
import { img } from '@/assets/registry';
import { DEFAULT_AVATAR, MOTIVATION_OPTIONS, TIME_OF_DAY_OPTIONS } from '@/constants';
import { XPBurst } from '@/components/effects/XPBurst';
import { HabitsServiceError, HABIT_ERROR_CODES } from '@/types/errors';
import { ONBOARDING_STEPS } from '@/types';
import type { FirstHabitSelection } from '@/types';
import { OnboardingScreen } from './OnboardingScreen';

interface OnboardingStepPayoffProps {
  onNext: () => void;
  onPrev: () => void;
}

/** Fingerprint of the selection a created habit came from — a changed
 *  selection after going back forces delete + recreate at the next attempt. */
function fingerprint(habit: FirstHabitSelection): string {
  return `${habit.name}|${habit.lifeArea}|${habit.xp}|${habit.iconName}`;
}

/** Fingerprint of the whole extras list — a changed list forces a re-run. */
function extrasFingerprint(habits: FirstHabitSelection[]): string {
  return habits.map(fingerprint).join('§');
}

/**
 * Onboarding payoff — the aha moment. Phase A shows a personalized summary
 * ("your kingdom is ready") with the kingdom laws condensed to three lines;
 * the CTA creates the chosen habit and completes it through the real
 * complete_habit RPC, so the first Luz the player earns is real (streak day 1
 * included). Phase B celebrates with the actual XP awarded.
 *
 * The whole write sequence is idempotent, guided by persisted markers
 * (profileSaved / firstHabitId / firstHabitCompleted): a kill, an offline
 * failure or a double tap never duplicates a write.
 */
export function OnboardingStepPayoff({ onNext, onPrev }: OnboardingStepPayoffProps) {
  const { temporaryData, saveStepData, completeStep } = useOnboarding();
  const { user, updateUserProfile } = useUser();
  const { completeHabit, deleteHabit, loadHabits } = useHabits();
  const { theme } = useTheme();
  const { t } = useLocale();

  const [phase, setPhase] = useState<'summary' | 'celebration'>(
    temporaryData.firstHabitCompleted ? 'celebration' : 'summary'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [failed, setFailed] = useState(false);
  const [showBurst, setShowBurst] = useState(false);
  // Ref guard: two taps in the same tick both see isSubmitting === false.
  const submittingRef = useRef(false);

  const handleBurstDone = useCallback(() => setShowBurst(false), []);

  const primaryForeground = themeHsl(theme, '--primary-foreground');

  const firstHabit = temporaryData.firstHabit;
  const extraHabitsCount = temporaryData.extraHabits?.length ?? 0;
  const userName = temporaryData.userName ?? user?.name ?? '';
  const genderCtx =
    temporaryData.gender === 'female' || temporaryData.gender === 'male'
      ? temporaryData.gender
      : undefined;

  const avatarUrl = temporaryData.avatarUrl ?? user?.avatarUrl ?? DEFAULT_AVATAR;
  const avatarSource = avatarUrl.startsWith('/') ? img(avatarUrl) : { uri: avatarUrl };

  const motivationOption = MOTIVATION_OPTIONS.find(
    (o) => o.value === temporaryData.motivation
  );
  const timeOption = TIME_OF_DAY_OPTIONS.find(
    (o) => o.value === temporaryData.preferredTimeOfDay
  );

  /** Latest markers — the closure's temporaryData goes stale across awaits. */
  const freshData = () => useAppStore.getState().temporaryData;

  /** Steps 1+2 of the sequence: profile (retry if the HERO save failed) and
   *  habit creation. Shared by the CTA and the "later" escape hatch. */
  const ensureProfileAndHabit = async (habit: FirstHabitSelection): Promise<string> => {
    if (!freshData().profileSaved) {
      await updateUserProfile(userName, temporaryData.avatarUrl, {
        gender: temporaryData.gender,
        motivation: temporaryData.motivation,
      });
      saveStepData({ profileSaved: true });
    } else if (temporaryData.motivation && user?.motivation !== temporaryData.motivation) {
      // Profile was saved early (HERO step) without motivation — top it up.
      await updateUserProfile(userName, temporaryData.avatarUrl, {
        gender: temporaryData.gender,
        motivation: temporaryData.motivation,
      });
    }

    const source = fingerprint(habit);
    const data = freshData();
    let habitId = data.firstHabitId;

    if (!habitId || data.firstHabitSource !== source) {
      if (habitId) {
        // The player went back and changed their mind — replace the old habit.
        try {
          await deleteHabit(habitId);
        } catch {
          // Stale/already-gone id: the new habit simply replaces it.
        }
      }

      // Resume path with no marker: a previous attempt may have inserted the
      // habit but died before persisting the id — adopt it, don't duplicate.
      let createdId: string | undefined;
      if (!data.firstHabitId) {
        await loadHabits();
        createdId = useAppStore
          .getState()
          .habits.find((h) => h.name === habit.name && h.lifeArea === habit.lifeArea)?.id;
      }

      if (!createdId) {
        // Direct service call (not the store action): we need the id persisted
        // BEFORE the store refetch, so a failed reload can't lose the insert.
        const created = await HabitsService.addHabit({
          name: habit.name,
          iconName: habit.iconName,
          xp: habit.xp,
          lifeArea: habit.lifeArea,
          timeOfDay: temporaryData.preferredTimeOfDay ?? 'anytime',
          reminderEnabled: true,
        });
        createdId = created.id;
      }

      saveStepData({
        firstHabitId: createdId,
        firstHabitSource: source,
        firstHabitCompleted: false,
      });
      habitId = createdId;
      await loadHabits();
    }

    await ensureExtraHabits();
    return habitId;
  };

  /** The other habits picked from the bank: created next to the primary one,
   *  never completed (only the first Luz is lit here). Best effort on purpose —
   *  a failed extra insert must not block the aha moment, and the marker is
   *  persisted only once every insert went through, so a later attempt retries. */
  const ensureExtraHabits = async (): Promise<void> => {
    const extras = temporaryData.extraHabits ?? [];
    const source = extrasFingerprint(extras);
    const data = freshData();
    if (data.extraHabitsSource === source) return;

    try {
      // The player went back and changed the list — drop the extras that are
      // no longer part of it (same "replace" semantics as the primary habit).
      if (data.extraHabitIds?.length) {
        const stored = useAppStore.getState().habits;
        for (const id of data.extraHabitIds) {
          const habit = stored.find((h) => h.id === id);
          const stillWanted =
            !habit ||
            extras.some((e) => e.name === habit.name && e.lifeArea === habit.lifeArea);
          if (stillWanted) continue;
          try {
            await deleteHabit(id);
          } catch {
            // Stale/already-gone id: nothing to drop.
          }
        }
      }

      if (extras.length === 0) {
        saveStepData({ extraHabitIds: [], extraHabitsSource: source });
        return;
      }

      // Resume path: adopt whatever a previous attempt already inserted
      // instead of duplicating it (selection is deduped by name upstream).
      await loadHabits();
      const existing = useAppStore.getState().habits;
      const ids: string[] = [];

      for (const habit of extras) {
        const already = existing.find(
          (h) => h.name === habit.name && h.lifeArea === habit.lifeArea
        );
        if (already) {
          ids.push(already.id);
          continue;
        }
        const created = await HabitsService.addHabit({
          name: habit.name,
          iconName: habit.iconName,
          xp: habit.xp,
          lifeArea: habit.lifeArea,
          timeOfDay: temporaryData.preferredTimeOfDay ?? 'anytime',
          reminderEnabled: true,
        });
        ids.push(created.id);
      }

      saveStepData({ extraHabitIds: ids, extraHabitsSource: source });
      await loadHabits();
    } catch (error) {
      console.error('Error creating extra onboarding habits:', error);
    }
  };

  const handleLightFirstLuz = async () => {
    if (submittingRef.current || !firstHabit) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    setFailed(false);
    try {
      const habitId = await ensureProfileAndHabit(firstHabit);

      if (!freshData().firstHabitCompleted) {
        // Resume path: the habit may exist in DB but not in the store yet.
        if (!useAppStore.getState().habits.some((h) => h.id === habitId)) {
          await loadHabits();
        }
        try {
          const result = await completeHabit(habitId);
          saveStepData({
            firstHabitCompleted: true,
            firstHabitXp: result.xpEarned,
            firstHabitPoints: result.pointsEarned,
          });
        } catch (error) {
          if (
            error instanceof HabitsServiceError &&
            error.code === HABIT_ERROR_CODES.ALREADY_COMPLETED
          ) {
            // A previous attempt got through — treat as success.
            saveStepData({
              firstHabitCompleted: true,
              firstHabitXp: firstHabit.xp,
              firstHabitPoints: Math.round(firstHabit.xp * 0.5),
            });
          } else {
            throw error;
          }
        }
      }

      completeStep(ONBOARDING_STEPS.PAYOFF);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowBurst(true);
      setPhase('celebration');
    } catch (error) {
      console.error('Error lighting the first Luz:', error);
      setFailed(true);
      toast.error(t('onboarding.payoff.error'));
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  /** Escape hatch — still tries to create the habit silently so Home isn't
   *  empty, but never blocks the player from moving on. */
  const handleSkip = async () => {
    if (submittingRef.current) return;
    if (freshData().firstHabitCompleted) {
      onNext();
      return;
    }
    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      if (firstHabit) {
        await ensureProfileAndHabit(firstHabit);
      }
    } catch {
      // Best-effort only.
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
      completeStep(ONBOARDING_STEPS.PAYOFF);
      onNext();
    }
  };

  // ── Phase B: celebration ──
  if (phase === 'celebration') {
    const earnedXp = temporaryData.firstHabitXp ?? firstHabit?.xp ?? 0;
    const earnedPoints = temporaryData.firstHabitPoints ?? Math.round(earnedXp * 0.5);
    return (
      <OnboardingScreen
        step={ONBOARDING_STEPS.PAYOFF}
        centered
        cta={{
          label: t('onboarding.payoff.continueCta'),
          onPress: onNext,
          icon: <ArrowRight size={20} color={primaryForeground} />,
        }}
      >
        <View className="relative items-center gap-4 py-8">
          {showBurst && <XPBurst xp={earnedXp} onDone={handleBurstDone} />}
          <View className="h-20 w-20 items-center justify-center rounded-full border-2 border-gold-300/60 bg-gold-500/20">
            <Flame size={38} color="#FBC956" />
          </View>
          <Text className="text-center text-2xl font-extrabold tracking-tight text-white">
            {t('onboarding.payoff.celebrationTitle', { context: genderCtx })}
          </Text>
          <View className="flex-row items-center gap-3">
            <View className="flex-row items-center gap-1.5 rounded-full bg-gold-500/20 px-3 py-1.5">
              <Trophy size={16} color="#FBC956" />
              <Text className="text-sm font-bold text-gold-300">+{earnedXp} XP</Text>
            </View>
            <View className="flex-row items-center gap-1.5 rounded-full bg-teal-500/20 px-3 py-1.5">
              <Coins size={16} color="#5eead4" />
              <Text className="text-sm font-bold text-teal-300">+{earnedPoints}</Text>
            </View>
          </View>
          <Text className="text-center text-base text-white/70">
            {t('onboarding.payoff.celebrationBody', { habit: firstHabit?.name ?? '' })}
          </Text>
        </View>
      </OnboardingScreen>
    );
  }

  // ── Phase A: personalized summary ──
  return (
    <OnboardingScreen
      step={ONBOARDING_STEPS.PAYOFF}
      onBack={!temporaryData.firstHabitCompleted && !isSubmitting ? onPrev : undefined}
      cta={{
        label: failed
          ? t('onboarding.payoff.retryCta')
          : t('onboarding.payoff.completeCta', { xp: firstHabit?.xp ?? 0 }),
        onPress: handleLightFirstLuz,
        disabled: !firstHabit,
        loading: isSubmitting,
        loadingLabel: t('onboarding.payoff.completing'),
        icon: <Sparkles size={20} color={primaryForeground} />,
      }}
      secondaryLink={{
        label: t('onboarding.payoff.skip'),
        onPress: handleSkip,
        disabled: isSubmitting,
      }}
    >
      <View className="items-center gap-4">
        <View className="h-24 w-24 overflow-hidden rounded-full border-2 border-teal-400/50 bg-teal-500/15">
          <Image
            source={avatarSource}
            contentFit="cover"
            contentPosition="top"
            style={{ width: '100%', height: '100%' }}
            accessibilityLabel={userName}
          />
        </View>
        <Text className="text-center text-2xl font-extrabold tracking-tight text-white">
          {t('onboarding.payoff.title', { name: userName })}
        </Text>
        <Text className="text-center text-base text-white/70">
          {t('onboarding.payoff.subtitle')}
        </Text>

        {/* Their answers, reflected back */}
        <View className="flex-row flex-wrap justify-center gap-2">
          {motivationOption && (
            <View className="flex-row items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5">
              <Text className="text-sm">{motivationOption.emoji}</Text>
              <Text className="text-xs font-semibold text-white/80">
                {t(motivationOption.labelKey)}
              </Text>
            </View>
          )}
          {timeOption && (
            <View className="flex-row items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5">
              <Text className="text-sm">{timeOption.emoji}</Text>
              <Text className="text-xs font-semibold text-white/80">{t(timeOption.labelKey)}</Text>
            </View>
          )}
          {firstHabit && (
            <View className="flex-row items-center gap-1.5 rounded-full border border-teal-400/40 bg-teal-500/15 px-3 py-1.5">
              <Check size={13} strokeWidth={3} color="#5eead4" />
              <Text className="text-xs font-semibold text-teal-200">{firstHabit.name}</Text>
            </View>
          )}
          {extraHabitsCount > 0 && (
            <View className="flex-row items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5">
              <Text className="text-xs font-semibold text-white/80">
                {t('onboarding.payoff.extraHabits', { count: extraHabitsCount })}
              </Text>
            </View>
          )}
        </View>

        {/* Kingdom laws, condensed to three lines */}
        <View className="mt-2 w-full gap-2.5">
          {(
            [
              { icon: Trophy, color: '#2dd4bf', text: t('onboarding.payoff.lawXp') },
              { icon: Coins, color: '#5eead4', text: t('onboarding.payoff.lawPoints') },
              { icon: Flame, color: '#fb923c', text: t('onboarding.payoff.lawStreak') },
            ] as const
          ).map((law, index) => {
            const Icon = law.icon;
            return (
              <View
                key={index}
                className="w-full flex-row items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3"
              >
                <Icon size={18} color={law.color} />
                <Text className="flex-1 text-sm font-medium text-white/80">{law.text}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </OnboardingScreen>
  );
}

export default OnboardingStepPayoff;
