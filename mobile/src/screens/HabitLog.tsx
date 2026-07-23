/**
 * HabitLog — "Rituales" tab. (React Native port of ../pages/HabitLog.tsx)
 * Hero card with the user's avatar + level ring, AAA streak tracker
 * (flame medallion + Mon→Sun path), time-of-day filters, habit list and
 * all the sheets (create/edit form, template library, measure logger,
 * detail, analytics). window.confirm → Alert.alert; toasts via @/lib/toast.
 */

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Plus,
  LayoutGrid,
  Sun,
  CloudSun,
  Moon,
  Gem,
  Check,
  Flame,
  Compass,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react-native';
import toast from '@/lib/toast';
import {
  HabitItem,
  HabitForm,
  TemplateLibrary,
  MeasureLogger,
  HabitAnalytics,
  HabitDetailSheet,
} from '@/features/habits/components';
import { LevelUpNotification, CircularProgress, GlassCard } from '@/components/ui';
import { Header } from '@/components/layout';
import { useUser, useHabits, useStreaks } from '@/store';
import { calculateGlobalLevelUpReward, getLevelProgress } from '@/utils/xp';
import { useLocale } from '@/hooks/useLocale';
import { getHeroBodySrc } from '@/constants';
import { img } from '@/assets/registry';
import { cn } from '@/utils/cn';
import type { HabitFormData, HabitTemplate } from '@/types';

interface LevelUpState {
  type: 'global' | 'area';
  level: number;
  areaName?: string;
  pointsReward: number;
}

type RoutineFilter = 'all' | 'morning' | 'afternoon' | 'night';

// Hero layers (shared visual language with Dashboard).
// The character body is resolved from the user's chosen avatar (see getHeroBodySrc).
const HERO_BG_SRC = '/hero-bg.png';

const WHITE = '#FFFFFF';
const TEAL_300 = '#5EEAD4';
const GOLD_400 = '#F6AD37';
const WHITE_40 = 'rgba(255,255,255,0.4)';

export function HabitLog() {
  const { t } = useLocale();

  // Use the new async hooks
  const { habits, isLoading, loadHabits, addHabit, updateHabit, completeHabit, uncompleteHabit, recordRelapse } = useHabits();
  const { user } = useUser();
  const { streak, refreshStreak } = useStreaks();

  // State for level up notifications
  const [levelUpNotification, setLevelUpNotification] = useState<LevelUpState | null>(null);

  // State for habit form (only for creation)
  const [isFormOpen, setIsFormOpen] = useState(false);

  // State for template library
  const [isTemplateLibraryOpen, setIsTemplateLibraryOpen] = useState(false);

  // State for initial data from template
  const [templateInitialData, setTemplateInitialData] = useState<Partial<HabitFormData> | undefined>(undefined);

  // Measurable value/timer logger + detail/analytics/edit modal targets
  const [loggerHabitId, setLoggerHabitId] = useState<string | null>(null);
  const [analyticsHabitId, setAnalyticsHabitId] = useState<string | null>(null);
  const [detailHabitId, setDetailHabitId] = useState<string | null>(null);
  const [editHabitId, setEditHabitId] = useState<string | null>(null);

  // Active time-of-day filter pill
  const [activeFilter, setActiveFilter] = useState<RoutineFilter>('all');

  // Load habits + realign the streak strip on mount. refreshStreak recomputes
  // last_seven_days so its last slot is *today* even if nothing was completed
  // yet — otherwise the weekly tracker could show a stale (previous) day.
  // The midnight rollover itself is handled app-wide in AppProvider.
  useEffect(() => {
    loadHabits();
    refreshStreak();
  }, [loadHabits, refreshStreak]);

  /**
   * Handle habit completion
   */
  const handleComplete = async (id: string) => {
    try {
      // Complete habit — the RPC returns the awarded XP (streak bonus +
      // daily cap applied) and whether the user leveled up.
      const result = await completeHabit(id);

      if (result.leveledUp && result.newLevel) {
        setLevelUpNotification({
          type: 'global',
          level: result.newLevel,
          pointsReward: calculateGlobalLevelUpReward(result.newLevel),
        });
      }

      // Success toast with the real XP awarded + bonus/cap hints
      const bonusPercent = Math.round(((result.streakMultiplier ?? 1) - 1) * 100);
      let message = `${t('habits.habitCompleted')} +${result.xpEarned} ${t('common.xp')}`;
      if (bonusPercent > 0) {
        message += ` · ${t('habits.streakBonus', { percent: bonusPercent })}`;
      }
      if (result.capped) {
        toast(`🌙 ${t('habits.xpCapped')}`);
      }
      toast.success(message);
      return result;
    } catch (error) {
      console.error('Error completing habit:', error);
      toast.error(t('errors.habitCompleteFailed'));
      // Re-throw so HabitItem's own catch suppresses the success burst/haptic.
      throw error;
    }
  };

  /**
   * Handle habit uncompletion
   */
  const handleUncomplete = async (id: string): Promise<void> => {
    try {
      await uncompleteHabit(id);

      // Show success toast
      toast.success(t('habits.habitUncompleted'));
    } catch (error) {
      console.error('Error uncompleting habit:', error);
      toast.error(t('errors.habitUncompleteFailed'));
    }
  };

  /**
   * Save a measurable value (from the timer/value logger)
   */
  const handleLogValue = async (value: number): Promise<void> => {
    if (!loggerHabitId) return;
    try {
      const result = await completeHabit(loggerHabitId, value);
      setLoggerHabitId(null);
      if (result.leveledUp && result.newLevel) {
        setLevelUpNotification({
          type: 'global',
          level: result.newLevel,
          pointsReward: calculateGlobalLevelUpReward(result.newLevel),
        });
      }
      toast.success(`${t('timer.logged')} +${result.xpEarned} ${t('common.xp')}`);
    } catch (error) {
      console.error('Error logging value:', error);
      toast.error(t('errors.habitCompleteFailed'));
    }
  };

  /**
   * Register a relapse for a quit-habit: persists the relapse event and
   * reverts today's completion server-side (streak recomputed).
   * (window.confirm → Alert.alert on native)
   */
  const handleRelapse = (id: string): void => {
    Alert.alert(t('habits.relapse'), t('habits.relapseConfirm'), [
      { text: t('actions.cancel'), style: 'cancel' },
      {
        text: t('habits.relapse'),
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await recordRelapse(id);
              toast(`💪 ${t('habits.relapseRecorded')}`);
            } catch (error) {
              console.error('Error registering relapse:', error);
              toast.error(t('errors.habitUncompleteFailed'));
            }
          })();
        },
      },
    ]);
  };

  /**
   * Start habit creation: open the suggested-habits catalog first; the user
   * can pick a template (detail sheet → prefilled form) or jump to a custom
   * habit from there.
   */
  const handleCreateHabit = (): void => {
    setTemplateInitialData(undefined); // Clear any template data
    setIsTemplateLibraryOpen(true);
  };

  /**
   * Create a habit from scratch (from the catalog's custom option)
   */
  const handleCreateCustomHabit = (): void => {
    setIsTemplateLibraryOpen(false);
    setTemplateInitialData(undefined);
    setIsFormOpen(true);
  };

  /**
   * Handle template selection from library
   */
  const handleSelectTemplate = (data: Partial<HabitFormData>, _template: HabitTemplate): void => {
    setIsTemplateLibraryOpen(false);
    setTemplateInitialData(data);
    setIsFormOpen(true);
  };

  /**
   * Handle form submission (create only)
   */
  const handleFormSubmit = async (data: HabitFormData): Promise<void> => {
    try {
      await addHabit(data);

      toast.success(t('habits.habitCreated'));

      // Close form and clear template data
      setIsFormOpen(false);
      setTemplateInitialData(undefined);
    } catch (error) {
      console.error('Error creating habit:', error);
      toast.error(t('errors.habitCreateFailed'));
    }
  };

  /**
   * Handle form cancel
   */
  const handleFormCancel = (): void => {
    setIsFormOpen(false);
    setTemplateInitialData(undefined);
  };

  /**
   * Handle edit form submission (opened from the detail sheet)
   */
  const handleEditSubmit = async (data: HabitFormData): Promise<void> => {
    if (!editHabitId) return;
    try {
      await updateHabit(editHabitId, data);
      toast.success(t('habitDetail.saved'));
      setEditHabitId(null);
    } catch (error) {
      console.error('Error updating habit:', error);
      toast.error(t('errors.habitUpdateFailed'));
    }
  };

  // Level / XP ring data for the hero badge.
  const levelProgress = user
    ? getLevelProgress(user.totalXPEarned, user.level)
    : { current: 0, max: 0, percentage: 0 };

  // Weekly streak data from the server-refreshed streak (never invented).
  // lastSevenDays is oldest-first with index 6 = TODAY (server computes it in
  // the user's timezone, kept in sync with the device; refreshStreak realigns
  // it on load). We render a fixed Monday→Sunday calendar week aligned to the
  // device's local date, so "today" lights up its real weekday column instead
  // of always sitting in the last (Sunday) slot.
  const weekdaysShort =
    (t('routines.weekdaysShort', { returnObjects: true }) as unknown as string[]) || [];
  const lastSevenDays: boolean[] =
    streak?.lastSevenDays && streak.lastSevenDays.length === 7
      ? streak.lastSevenDays
      : [false, false, false, false, false, false, false];
  const currentStreak = streak?.currentStreak ?? 0;

  // Monday-based index of today: JS getDay() is 0=Sun..6=Sat.
  const todayMondayIndex = (new Date().getDay() + 6) % 7;
  const weekDays = weekdaysShort.map((label, position) => {
    // offset < 0 → earlier this week · 0 → today · > 0 → still to come
    const offset = position - todayMondayIndex;
    return {
      label,
      isToday: offset === 0,
      isUpcoming: offset > 0,
      completed: offset <= 0 ? lastSevenDays[6 + offset] ?? false : false,
    };
  });

  // Filter pills config, backed by the habit's time_of_day field.
  const filters: { key: RoutineFilter; label: string; icon: LucideIcon }[] = [
    { key: 'all', label: t('routines.filterAll'), icon: LayoutGrid },
    { key: 'morning', label: t('routines.filterMorning'), icon: Sun },
    { key: 'afternoon', label: t('routines.filterAfternoon'), icon: CloudSun },
    { key: 'night', label: t('routines.filterNight'), icon: Moon },
  ];

  // 'anytime' habits show under every filter; the UI's "night" maps to the
  // model's 'evening'.
  const visibleHabits =
    activeFilter === 'all'
      ? habits
      : habits.filter((h) => {
          const tod = h.timeOfDay ?? 'anytime';
          if (tod === 'anytime') return true;
          return activeFilter === 'night' ? tod === 'evening' : tod === activeFilter;
        });

  // Bundled hero images (web public/ paths resolved through the registry)
  const heroBgSource = img(HERO_BG_SRC);
  const heroBody = getHeroBodySrc(user?.avatarUrl, user?.avatarBodyUrl);
  const heroBodySource = img(heroBody) ?? { uri: heroBody };

  return (
    <View className="flex-1 bg-background">
      <Header />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full px-4 pt-4">
          {/* ── Hero card (contained: bg + character + title + level + filters) ── */}
          <View className="relative mb-5 min-h-[212px] overflow-hidden rounded-3xl border border-white/10">
            {/* Background scene */}
            {heroBgSource && (
              <Image
                source={heroBgSource}
                contentFit="cover"
                contentPosition="top"
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                accessibilityElementsHidden
              />
            )}
            {/* Scrims: darken the left (title) and bottom (chips) for legibility */}
            <LinearGradient
              colors={['rgba(10,13,18,0.9)', 'rgba(10,13,18,0.35)', 'transparent']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.55)']}
              style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 96 }}
            />
            {/* Character bust on the right: head at the top, lower body clipped by the card */}
            {heroBodySource && (
              <Image
                source={heroBodySource}
                contentFit="contain"
                contentPosition="top"
                style={{
                  position: 'absolute',
                  top: 8,
                  left: '33.5%', // web: left 57% − half of the 47% width
                  width: '47%',
                  maxWidth: 190,
                  height: 204,
                }}
                accessibilityElementsHidden
              />
            )}

            {/* Card content */}
            <View className="relative z-10 min-h-[212px] p-4">
              <View className="flex-row items-start justify-between gap-2">
                <View className="min-w-0 shrink">
                  <Text className="text-[30px] font-extrabold leading-tight tracking-tight text-white">
                    {t('routines.title')}
                  </Text>
                  <Text className="mt-1.5 max-w-[144px] text-[14px] font-medium leading-snug text-white/75">
                    {t('routines.subtitle')}
                  </Text>
                </View>

                {/* Level badge — eyebrow + level beside a compact ring so nothing
                    crowds the circle; dark backdrop keeps it legible over the character */}
                <View className="flex-row items-center gap-2 rounded-2xl border border-white/10 bg-black/35 py-1.5 pl-2.5 pr-1.5">
                  <View className="items-end">
                    <Text
                      className="text-[9px] font-bold uppercase text-[#8Fb3ff]"
                      style={{ letterSpacing: 1 }}
                    >
                      {t('home.guardianTitle')}
                    </Text>
                    <Text className="text-[13px] font-extrabold leading-tight text-white">
                      {t('home.levelShort', { level: user?.level ?? 1 })}
                    </Text>
                  </View>
                  <CircularProgress
                    current={levelProgress.current}
                    max={levelProgress.max || 1}
                    variant="xp"
                    size={50}
                    strokeWidth={5}
                  >
                    <View className="items-center">
                      <Gem size={12} color="#8FB3FF" />
                      <Text className="mt-0.5 text-[13px] font-extrabold leading-none text-white">
                        {levelProgress.current}
                      </Text>
                      <Text className="mt-0.5 text-[7px] font-medium text-white/55">
                        /{levelProgress.max} {t('common.xp')}
                      </Text>
                    </View>
                  </CircularProgress>
                </View>
              </View>

              {/* Filter pills pinned to the bottom of the card */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mt-auto pt-5"
                contentContainerStyle={{ gap: 8, alignItems: 'center' }}
                accessibilityLabel={t('routines.myRoutines')}
              >
                {filters.map(({ key, label, icon: Icon }) => {
                  const isActive = activeFilter === key;
                  return (
                    <Pressable
                      key={key}
                      onPress={() => setActiveFilter(key)}
                      className={cn(
                        'flex-row items-center gap-1 rounded-full px-2.5 py-1.5',
                        isActive ? 'bg-teal-500' : 'border border-white/10 bg-black/30'
                      )}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: isActive }}
                    >
                      <Icon size={13} color={isActive ? WHITE : 'rgba(255,255,255,0.8)'} />
                      <Text
                        className={cn(
                          'text-[12px] font-semibold',
                          isActive ? 'text-white' : 'text-white/80'
                        )}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          {/* Racha actual — AAA streak tracker (flame medallion + 7-day path) */}
          <GlassCard
            className="relative mb-6 overflow-hidden p-4"
            accessibilityLabel={t('routines.currentStreak')}
          >
            {/* Warm ember glow (blur omitted on native) */}
            <View
              pointerEvents="none"
              className="absolute -right-10 -top-12 h-44 w-44 rounded-full bg-gold-500/10"
            />

            {/* Header: flame medallion + streak count */}
            <View className="mb-4 flex-row items-center gap-3">
              <View className="h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-white/25">
                <LinearGradient
                  colors={['#F5B22E', '#EA580C']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                />
                <Flame size={24} color={WHITE} fill="rgba(255,255,255,0.3)" />
              </View>
              <View className="min-w-0 shrink">
                <Text className="text-[11px] font-bold uppercase tracking-wider text-white/55">
                  {t('routines.currentStreak')}
                </Text>
                <Text className="mt-0.5 text-[26px] font-extrabold leading-none text-gold-400">
                  {currentStreak}{' '}
                  <Text className="text-sm font-bold text-white/70">{t('routines.days')}</Text>
                </Text>
              </View>
            </View>

            {/* 7-day tracker: connecting path behind glowing nodes */}
            <View className="relative">
              <View
                pointerEvents="none"
                className="absolute left-4 right-4 top-[15px] h-0.5 rounded-full bg-white/10"
              />
              <View className="flex-row justify-between gap-1">
                {weekDays.map(({ label, isToday, isUpcoming, completed }, index) => (
                  <View
                    key={`${label}-${index}`}
                    className="z-10 min-w-0 items-center gap-1.5"
                  >
                    {completed ? (
                      <View className="h-8 w-8 items-center justify-center rounded-full border border-white/25 bg-success-500">
                        <Check size={15} strokeWidth={3} color={WHITE} />
                      </View>
                    ) : isToday ? (
                      <View
                        className="h-8 w-8 items-center justify-center rounded-full border-2 border-teal-400/60 bg-teal-400/10"
                        accessibilityLabel={t('routines.today')}
                      >
                        <View className="h-1.5 w-1.5 rounded-full bg-teal-300" />
                      </View>
                    ) : (
                      <View
                        className={cn(
                          'h-8 w-8 rounded-full border border-white/10 bg-white/5',
                          isUpcoming && 'opacity-40'
                        )}
                      />
                    )}
                    <Text
                      numberOfLines={1}
                      className={cn(
                        'text-[10px] font-semibold',
                        isToday ? 'text-teal-300' : isUpcoming ? 'text-white/25' : 'text-white/45'
                      )}
                    >
                      {isToday ? t('routines.today') : label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </GlassCard>

          {/* Mis rutinas */}
          <View className="mb-6">
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-xl font-bold text-white">{t('routines.myRoutines')}</Text>
              <Pressable
                onPress={handleCreateHabit}
                disabled={isLoading}
                className={cn(
                  'flex-row items-center gap-1 rounded-full border border-white/20 bg-teal-500 px-3.5 py-1.5 active:scale-95',
                  isLoading && 'opacity-50'
                )}
                accessibilityRole="button"
                accessibilityLabel={t('routines.newRoutine')}
              >
                <Plus size={16} color={WHITE} />
                <Text className="text-sm font-semibold text-white">
                  {t('routines.newRoutine')}
                </Text>
              </Pressable>
            </View>

            {/* Progreso del día — cuántas rutinas van completadas hoy */}
            {habits.length > 0 && (
              <View className="mb-4 flex-row items-center gap-3">
                <View className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                  <View
                    className="h-full rounded-full bg-teal-400"
                    style={{
                      width: `${Math.round(
                        (habits.filter((h) => h.completedToday).length / habits.length) * 100
                      )}%`,
                    }}
                  />
                </View>
                <Text className="text-xs font-bold text-white/60">
                  {t('routines.todayProgress', {
                    done: habits.filter((h) => h.completedToday).length,
                    total: habits.length,
                  })}
                </Text>
              </View>
            )}

            {/* Loading state */}
            {isLoading && habits.length === 0 && (
              <View className="items-center justify-center py-12">
                <ActivityIndicator size="large" color={TEAL_300} />
              </View>
            )}

            {/* Empty state */}
            {!isLoading && habits.length === 0 && (
              <GlassCard className="items-center rounded-2xl p-8">
                <Text className="mb-4 text-center font-semibold text-white/80">
                  {t('routines.empty')}
                </Text>
                <Pressable
                  onPress={handleCreateHabit}
                  className="flex-row items-center justify-center rounded-xl bg-teal-500 px-6 py-3 active:bg-teal-600"
                  accessibilityRole="button"
                >
                  <Text className="font-semibold text-white">
                    {t('habits.createFirstHabit')}
                  </Text>
                </Pressable>
              </GlassCard>
            )}

            {/* Habits list */}
            {visibleHabits.length > 0 && (
              <View className="gap-2.5">
                {visibleHabits.map((habit) => (
                  <HabitItem
                    key={habit.id}
                    id={habit.id}
                    name={habit.name}
                    iconName={habit.iconName}
                    xp={habit.xp}
                    completedToday={habit.completedToday}
                    lifeArea={habit.lifeArea}
                    habitType={habit.habitType}
                    unit={habit.unit}
                    dailyGoal={habit.dailyGoal}
                    todayValue={habit.todayValue}
                    onComplete={handleComplete}
                    onUncomplete={handleUncomplete}
                    onLog={(id) => setLoggerHabitId(id)}
                    onRelapse={handleRelapse}
                    onOpenAnalytics={(id) => setDetailHabitId(id)}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Banner */}
          <Pressable
            onPress={() => setIsTemplateLibraryOpen(true)}
            className="w-full flex-row items-center gap-3 rounded-2xl border border-white/10 bg-teal-500/10 p-4 active:bg-teal-500/15"
            accessibilityRole="button"
          >
            <View className="h-11 w-11 items-center justify-center rounded-full bg-gold-500/15">
              <Compass size={22} color={GOLD_400} />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="text-sm font-bold leading-snug text-white">
                {t('routines.bannerTitle')}
              </Text>
              <Text className="mt-0.5 text-xs text-white/55">
                {t('routines.bannerSubtitle')}
              </Text>
            </View>
            <ChevronRight size={20} color={WHITE_40} />
          </Pressable>
        </View>
      </ScrollView>

      {/* Level Up Notification */}
      {levelUpNotification && (
        <LevelUpNotification
          level={levelUpNotification.level}
          type={levelUpNotification.type}
          areaName={levelUpNotification.areaName}
          pointsReward={levelUpNotification.pointsReward}
          onClose={() => setLevelUpNotification(null)}
        />
      )}

      {/* Habit Form (Create only) */}
      {isFormOpen && (
        <HabitForm
          initialData={templateInitialData}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      )}

      {/* Template Library Modal */}
      {isTemplateLibraryOpen && (
        <TemplateLibrary
          onSelectTemplate={handleSelectTemplate}
          onClose={() => setIsTemplateLibraryOpen(false)}
          onCreateCustom={handleCreateCustomHabit}
        />
      )}

      {/* Measurable value / timer logger */}
      {loggerHabitId && (() => {
        const h = habits.find((x) => x.id === loggerHabitId);
        if (!h) return null;
        return (
          <MeasureLogger
            habitName={h.name}
            unit={h.unit || 'min'}
            dailyGoal={h.dailyGoal}
            onSave={handleLogValue}
            onClose={() => setLoggerHabitId(null)}
          />
        );
      })()}

      {/* Habit detail sheet (tap on a habit) */}
      {detailHabitId && (() => {
        const h = habits.find((x) => x.id === detailHabitId);
        if (!h) return null;
        return (
          <HabitDetailSheet
            habit={h}
            onClose={() => setDetailHabitId(null)}
            onOpenAnalytics={(id) => {
              setDetailHabitId(null);
              setAnalyticsHabitId(id);
            }}
            onOpenEdit={(id) => {
              setDetailHabitId(null);
              setEditHabitId(id);
            }}
            onRelapse={(id) => {
              setDetailHabitId(null);
              handleRelapse(id);
            }}
          />
        );
      })()}

      {/* Habit Form (edit, opened from the detail sheet) */}
      {editHabitId && (() => {
        const h = habits.find((x) => x.id === editHabitId);
        if (!h) return null;
        return (
          <HabitForm
            habit={{ ...h, completed: h.completedToday }}
            onSubmit={handleEditSubmit}
            onCancel={() => setEditHabitId(null)}
          />
        );
      })()}

      {/* Per-habit analytics */}
      {analyticsHabitId && (() => {
        const h = habits.find((x) => x.id === analyticsHabitId);
        if (!h) return null;
        return (
          <HabitAnalytics
            habitId={h.id}
            habitName={h.name}
            habitType={h.habitType}
            unit={h.unit}
            onClose={() => setAnalyticsHabitId(null)}
          />
        );
      })()}
    </View>
  );
}

export default HabitLog;
