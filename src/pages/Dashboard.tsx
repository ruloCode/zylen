import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  Flame,
  Gem,
  Target,
  ChevronRight,
  Play,
  Plus,
  Loader2,
  FlaskConical,
  Swords,
  Crown,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CircularProgress, LevelUpNotification } from '@/components/ui';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';
import { HabitItem, HabitScienceSheet, TemplateLibrary, MeasureLogger } from '@/features/habits/components';
import { HABIT_CATALOG, findCatalogEntry } from '@/constants/habitCatalog';
import type { HabitCatalogEntry } from '@/constants/habitCatalog';
import type { HabitFormData, HabitTemplate } from '@/types';
import { DailyFocusChallenge } from '@/features/focus/components';
import { HABIT_ICONS } from '@/components/atoms/icons/iconMaps';
import HeroCharacter from '@/components/hero/HeroCharacter';
import type { HeroCharacterHandle } from '@/components/hero/HeroCharacter';
import { useUser, useHabits, useStreaks, useFocus } from '@/store';
import { ROUTES, getHeroBodySrc, getHeroVideoSources, LIFE_AREA_CATALOG } from '@/constants';
import { useLocale } from '@/hooks/useLocale';
import { calculateGlobalLevelUpReward, getLevelProgress } from '@/utils/xp';
import { getGreetingKey } from '@/utils/greeting';

// Hero is composed of two independent layers (swappable / animatable):
// the jungle background and the transparent character. Both live in /public.
const HERO_BG_SRC = '/hero-bg.png';

export function Dashboard() {
  const navigate = useNavigate();
  const { user, isLoading: userLoading } = useUser();
  const {
    habits,
    isLoading: habitsLoading,
    loadHabits,
    completeHabit,
    uncompleteHabit,
    recordRelapse,
  } = useHabits();
  const { streak, isLoading: streakLoading, refreshStreak } = useStreaks();
  const { loadFocusData } = useFocus();
  const { t } = useLocale();
  const heroRef = useRef<HeroCharacterHandle>(null);
  // Habit catalog: browse the library, or read a featured habit's science card.
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [catalogEntry, setCatalogEntry] = useState<HabitCatalogEntry | null>(null);
  // Level-up celebration + measurable value/timer logger (same flow as Rituales).
  const [levelUpLevel, setLevelUpLevel] = useState<number | null>(null);
  const [loggerHabitId, setLoggerHabitId] = useState<string | null>(null);

  // Refresh habits + realign the weekly streak strip on mount, and load focus
  // data so the daily-challenge banner knows today's minutes and claim state
  // (refreshStreak recomputes last_seven_days with index 6 = today).
  useEffect(() => {
    loadHabits();
    refreshStreak();
    loadFocusData();
  }, [loadHabits, refreshStreak, loadFocusData]);

  const levelProgress = user
    ? getLevelProgress(user.totalXPEarned, user.level)
    : { current: 0, max: 0, percentage: 0 };
  const animatedXP = useAnimatedNumber(levelProgress.current);

  const isLoading = userLoading || streakLoading;

  const firstName = user?.name?.split(' ')[0] || '';
  const pendingCount = habits.filter((h) => !h.completedToday).length;

  /**
   * Complete a habit from the home list — mirrors the Rituales page flow:
   * real awarded XP (streak bonus + daily cap) in the toast, level-up modal.
   */
  const handleComplete = async (id: string) => {
    try {
      const result = await completeHabit(id);
      if (result.leveledUp && result.newLevel) {
        setLevelUpLevel(result.newLevel);
      }
      const bonusPercent = Math.round(((result.streakMultiplier ?? 1) - 1) * 100);
      let message = `${t('habits.habitCompleted')} +${result.xpEarned} ${t('common.xp')}`;
      if (bonusPercent > 0) {
        message += ` · ${t('habits.streakBonus', { percent: bonusPercent })}`;
      }
      if (result.capped) {
        toast(t('habits.xpCapped'), { icon: '🌙', duration: 3500 });
      }
      toast.success(message);
      return result;
    } catch (error) {
      console.error('Error completing habit:', error);
      toast.error(t('errors.habitCompleteFailed'));
    }
  };

  const handleUncomplete = async (id: string): Promise<void> => {
    try {
      await uncompleteHabit(id);
      toast.success(t('habits.habitUncompleted'));
    } catch (error) {
      console.error('Error uncompleting habit:', error);
      toast.error(t('errors.habitUncompleteFailed'));
    }
  };

  /** Save a measurable value from the timer/value logger. */
  const handleLogValue = async (value: number): Promise<void> => {
    if (!loggerHabitId) return;
    try {
      const result = await completeHabit(loggerHabitId, value);
      setLoggerHabitId(null);
      if (result.leveledUp && result.newLevel) {
        setLevelUpLevel(result.newLevel);
      }
      toast.success(`${t('timer.logged')} +${result.xpEarned} ${t('common.xp')}`);
    } catch (error) {
      console.error('Error logging value:', error);
      toast.error(t('errors.habitCompleteFailed'));
    }
  };

  /** Register a relapse for a quit-habit (streak recomputed server-side). */
  const handleRelapse = async (id: string): Promise<void> => {
    if (!window.confirm(t('habits.relapseConfirm'))) return;
    try {
      await recordRelapse(id);
      toast(t('habits.relapseRecorded'), { icon: '💪' });
    } catch (error) {
      console.error('Error registering relapse:', error);
      toast.error(t('errors.habitUncompleteFailed'));
    }
  };

  // Hero cards: lighter, more translucent glass so the character shows through
  const heroCard =
    'bg-[hsl(var(--glass-bg)/0.3)] backdrop-blur-md border border-white/10 rounded-2xl shadow-soft';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-teal-500 animate-spin mx-auto mb-4" />
          <p className="text-white font-semibold">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden pb-28">
      {/* ── Hero (full-bleed top), composed of independent layers ── */}
      {/* The container is locked to the BACKGROUND's exact aspect ratio
          (941×1672) so the scene shows in full with NO crop at any width. That
          makes every feature of the scene — crucially the platform — sit at a
          fixed PERCENTAGE of the container regardless of screen size. The
          character is then placed by a percentage too, so feet always land on
          the platform centre (see ASSET ALIGNMENT note below). */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-md aspect-[941/1672] -z-0 bg-[hsl(var(--background))] overflow-hidden">
        {/* Layer 0 — background scene (swappable / themable). aspect matches the
            container, so object-cover shows the whole image without cropping. */}
        <img
          src={HERO_BG_SRC}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        {/* Top scrim for header legibility (matches the reference's darker top) */}
        <div className="absolute inset-x-0 top-0 h-[36%] bg-gradient-to-b from-[hsl(var(--background))]/90 via-[hsl(var(--background))]/35 to-transparent" />
        {/* Fade the bottom of the BACKGROUND into the page (kept BELOW the character so it doesn't fade the figure) */}
        <div className="absolute inset-x-0 bottom-0 h-[14%] bg-gradient-to-b from-transparent to-[hsl(var(--background))]" />
        {/*
          Layer 1 — character (PNG placeholder + animated 3D stage on top).

          ── ASSET ALIGNMENT (keep avatars consistent so they always line up) ──
          Background platform centre (golden rune): 47% x, 72.4% y of /hero-bg.png.
          Character canvas (/hero-character.png 820×1230): feet baseline at 93.4%
          of the canvas height, content horizontally centred ~46%.
          With the container aspect-locked, `bottom-[24.4%]` + `w-[58%]` lands the
          feet exactly on the rune at EVERY width (the width term cancels).
          NEW AVATARS must use the SAME canvas: portrait 820×1230 ratio (2:3),
          character horizontally centred, feet at ~93% down the canvas. Then they
          align automatically with no code change.
          ANIMATED AVATARS (idle-loop video with alpha) are generated FROM the
          same PNG artwork, so they inherit the canvas convention and swap in
          over the PNG with no visual jump (same box, same classes).
        */}
        <HeroCharacter
          ref={heroRef}
          imgSrc={getHeroBodySrc(user?.avatarUrl, user?.avatarBodyUrl)}
          videoSources={getHeroVideoSources(user?.avatarUrl, user?.avatarBodyUrl)}
          className="absolute inset-0"
          imgClassName="absolute bottom-[24.4%] left-1/2 -translate-x-1/2 w-[58%] h-auto object-contain drop-shadow-[0_14px_14px_rgba(0,0,0,0.5)]"
        />
      </div>

      {/* ── Foreground content ── */}
      {/* No top padding here: the content column shares the hero's top origin
          (y=0) so the spacer below tracks the character's feet exactly. The
          safe-area / top inset is applied to the header instead. */}
      <div className="relative z-10 max-w-md mx-auto px-4">
        {/* Hero overlay zone — a spacer whose height tracks the hero scene down
            to the character's FEET. The hero is aspect-[941/1672] and the feet
            land on the platform at 72.4% of that height → 0.724 × 1672 ≈ 1210.
            Because this spacer shares the hero's width (max-w-md) and top origin
            (y=0), its bottom edge lands on the feet at ANY width, so the banner
            that follows floats right below them. Greeting + stat cards sit at
            the top; the gap reveals the character standing on the platform. */}
        <div
          className="aspect-[941/1210] -mx-4 px-4"
          // Tap-to-interact: the hero canvas sits behind this spacer (-z-0 vs
          // z-10), so taps "on the character" actually land here. Only react
          // when the tap hits the spacer itself — not the cards/header inside.
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) {
              heroRef.current?.playRandomInteraction();
            }
          }}
        >
        {/* Top bar: greeting + notifications (carries the safe-area / top inset) */}
        <header className="flex items-start justify-between gap-3 mb-5 pt-[calc(env(safe-area-inset-top)+1.5rem)]">
          <div className="min-w-0">
            <h1 className="font-sans normal-case text-[26px] leading-tight font-extrabold text-white tracking-tight">
              {t(getGreetingKey(), { name: firstName })} 👋
            </h1>
            <p className="font-sans text-white/70 text-[15px] font-medium mt-1.5 max-w-[15rem] leading-snug">
              {t('home.subtitle')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(ROUTES.HABITS)}
            aria-label={t('home.notifications')}
            className="relative shrink-0 w-11 h-11 rounded-full glass-card flex items-center justify-center text-white"
          >
            <Bell size={20} />
            {pendingCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-danger-500 text-white text-[10px] font-bold flex items-center justify-center border border-[hsl(var(--background))]">
                {pendingCount}
              </span>
            )}
          </button>
        </header>

        {/* Stat cards + quick actions, split left/right with the hero character in the gap */}
        <div className="flex justify-between items-start gap-3">
          {/* Left column */}
          <div className="flex flex-col gap-2.5 w-[27%]">
            {/* Streak card */}
            <div className={`${heroCard} p-2.5 flex flex-col items-center text-center`}>
              <p className="text-white/85 text-[10px] font-semibold leading-tight">{t('home.streakLabel')}</p>
              <div className="flex items-center justify-center gap-1 mt-0.5">
                <Flame size={16} className="text-orange-400" />
                <span className="text-2xl font-extrabold text-white leading-none">
                  {streak?.currentStreak ?? 0}
                </span>
              </div>
              <p className="text-white/75 text-[10px] font-medium">{t('common.days').toLowerCase()}</p>
              <p className="text-white/60 text-[9px] mt-0.5">{t('home.streakKeepGoing')}</p>
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-2.5 w-[27%]">
            {/* Level / XP card */}
            <div className={`${heroCard} p-2.5 flex flex-col items-center`}>
              <p className="text-white/85 text-[10px] font-semibold mb-1.5">
                {t('home.levelLabel', { level: user?.level ?? 1 })}
              </p>
              <CircularProgress
                current={levelProgress.current}
                max={levelProgress.max || 1}
                variant="xp"
                size={74}
                strokeWidth={6}
              >
                <div className="flex flex-col items-center">
                  <Gem size={14} className="text-[#8Fb3ff]" />
                  <span className="text-base font-extrabold text-white leading-none">
                    {animatedXP}
                  </span>
                  <span className="text-white/65 text-[8px] font-medium">
                    / {levelProgress.max} {t('progress.xp')}
                  </span>
                </div>
              </CircularProgress>
            </div>

            {/* Primary action: focus of the day — thumb-reachable, the strongest
                CTA on the home (grows the hero via focus sessions). */}
            <button
              type="button"
              onClick={() => navigate(ROUTES.FOCUS)}
              aria-label={t('home.focusOfDay')}
              className="relative overflow-hidden p-3 rounded-2xl flex flex-col items-center text-center gap-1.5 bg-gradient-to-br from-teal-500/45 to-gold-500/30 ring-1 ring-inset ring-white/25 shadow-[0_0_18px_hsl(178_60%_45%/0.45)] active:scale-[0.97] transition-transform"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gold-400/10 animate-glow-pulse"
              />
              <span className="relative w-9 h-9 rounded-xl grid place-items-center bg-white/15 ring-1 ring-inset ring-white/25">
                <Target size={18} className="text-white" />
              </span>
              <span className="relative text-white text-[12px] font-bold leading-tight">
                {t('home.focusOfDay')}
              </span>
              <span className="relative flex items-center gap-1 text-white/85 text-[10px] font-semibold">
                <Play size={9} className="fill-current" />
                {t('home.focusStart')}
              </span>
            </button>
          </div>
        </div>
        </div>{/* /hero overlay zone */}

        {/* Daily focus challenge — floats just below the character's feet (the
            spacer above ends at the feet; this small margin is the breathing
            gap). Reads today's focus minutes and offers the claimable reward. */}
        <DailyFocusChallenge onLevelUp={setLevelUpLevel} className="mt-3" />

        {/* Mis rituales — same AAA tiles as the Rituales page */}
        <section aria-labelledby="home-rituals-heading" className="mb-7">
          <div className="flex items-center justify-between mb-4">
            <h2
              id="home-rituals-heading"
              className="font-sans normal-case text-xl font-bold text-white"
            >
              {t('routines.myRoutines')}
            </h2>
            <button
              type="button"
              onClick={() => setIsCatalogOpen(true)}
              disabled={habitsLoading}
              className="inline-flex items-center gap-1 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 text-white text-sm font-semibold px-3.5 py-1.5 ring-1 ring-inset ring-white/20 shadow-glow-teal transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={t('routines.newRoutine')}
            >
              <Plus size={16} />
              {t('routines.newRoutine')}
            </button>
          </div>

          {/* Loading state */}
          {habitsLoading && habits.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
            </div>
          )}

          {/* Empty state */}
          {!habitsLoading && habits.length === 0 && (
            <div className="glass-card rounded-2xl p-8 text-center">
              <p className="text-white/80 font-semibold mb-4">{t('routines.empty')}</p>
              <button
                type="button"
                onClick={() => setIsCatalogOpen(true)}
                className="btn-primary"
              >
                {t('habits.createFirstHabit')}
              </button>
            </div>
          )}

          {/* Rituals list */}
          {habits.length > 0 && (
            <div className="space-y-2.5 sm:space-y-3">
              {habits.map((habit) => (
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
                  onOpenAnalytics={() => navigate(ROUTES.HABITS)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Arena — the embedded Everlight co-op game (Templo del Desorden) */}
        <section aria-labelledby="arena-heading" className="mb-7">
          <button
            type="button"
            onClick={() => navigate(ROUTES.ARENA)}
            className="relative w-full glass-card overflow-hidden text-left group"
          >
            <img
              src="/images/arena-cover.png"
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-85 transition-opacity"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--background))]/95 via-[hsl(var(--background))]/55 to-transparent" />
            <div className="relative p-4 pr-24 min-h-[7.5rem] flex flex-col justify-center">
              <span className="inline-flex items-center gap-1.5 text-teal-300 text-[11px] font-bold uppercase tracking-wider mb-1">
                <Swords size={13} /> {t('arena.badge')}
              </span>
              <h2 id="arena-heading" className="font-sans normal-case text-lg font-extrabold text-white leading-tight">
                {t('arena.cardTitle')}
              </h2>
              <p className="text-white/80 text-xs mt-1 max-w-[16rem] leading-snug">
                {t('arena.cardSubtitle')}
              </p>
              <span className="mt-2 inline-flex items-center gap-1 text-gold-400 text-sm font-bold">
                {t('arena.cardCta')} <ChevronRight size={16} />
              </span>
            </div>
          </button>
        </section>

        {/* Focus realms — life areas as fantasy kingdoms, each with its own detail */}
        <section aria-labelledby="realms-heading" className="mb-7">
          <button
            type="button"
            onClick={() => navigate(ROUTES.REALMS)}
            className="relative w-full glass-card overflow-hidden text-left p-4 group"
          >
            <span
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(70% 90% at 85% 25%, hsl(var(--primary) / 0.16), transparent 65%)',
              }}
            />
            <span className="relative flex items-center gap-3">
              <span className="min-w-0 flex-1">
                <span className="inline-flex items-center gap-1.5 text-teal-300 text-[11px] font-bold uppercase tracking-wider mb-1">
                  <Crown size={13} /> {t('realms.cardBadge')}
                </span>
                <h2
                  id="realms-heading"
                  className="font-sans normal-case text-lg font-extrabold text-white leading-tight"
                >
                  {t('realms.cardTitle')}
                </h2>
                <p className="text-white/70 text-xs mt-1 leading-snug">
                  {t('realms.cardSubtitle')}
                </p>
                <span className="mt-2 inline-flex items-center gap-1 text-gold-400 text-sm font-bold">
                  {t('realms.cardCta')} <ChevronRight size={16} />
                </span>
              </span>
              {/* Mosaic peek at the six realm gems */}
              <span className="shrink-0 grid grid-cols-3 gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                {LIFE_AREA_CATALOG.map((m) => (
                  <img
                    key={m.key}
                    src={m.image}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    className="w-8 h-8 object-contain drop-shadow"
                  />
                ))}
              </span>
            </span>
          </button>
        </section>

        {/* Habit catalog — learn about science-backed habits before adding them */}
        <section aria-labelledby="catalog-heading" className="mb-7">
          <div className="flex items-center justify-between mb-4">
            <h2 id="catalog-heading" className="font-sans normal-case text-xl font-bold text-white">
              {t('catalog.homeTitle')}
            </h2>
            <button
              type="button"
              onClick={() => setIsCatalogOpen(true)}
              className="flex items-center gap-1 text-teal-300 text-sm font-semibold"
            >
              {t('catalog.explore')} <ChevronRight size={16} />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {HABIT_CATALOG.slice(0, 8).map((entry) => {
              const Icon = HABIT_ICONS[entry.iconName] || Target;
              return (
                <button
                  key={entry.slug}
                  type="button"
                  onClick={() => setCatalogEntry(entry)}
                  className="shrink-0 w-[132px] flex flex-col glass-card p-3 text-left hover:border-teal-400/40 transition-colors"
                >
                  <span className="w-16 h-16 rounded-full grid place-items-center mb-2 overflow-hidden ring-1 ring-inset ring-white/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] bg-[radial-gradient(circle_at_50%_30%,rgba(45,212,191,0.16),rgba(2,10,13,0.95))]">
                    <img
                      src={`/catalog/${entry.slug}.png`}
                      alt=""
                      aria-hidden="true"
                      className="w-full h-full object-contain p-1.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)]"
                      onError={(e) => {
                        // Fall back to the lucide icon if the illustration is missing.
                        const el = e.currentTarget;
                        el.style.display = 'none';
                        el.parentElement?.classList.add('text-teal-300');
                      }}
                    />
                    <Icon size={20} className="hidden" />
                  </span>
                  <p className="min-h-[2.2rem] text-white text-sm font-bold leading-tight line-clamp-2">
                    {(t as (k: string) => string)(`habitCatalog.${entry.slug}.title`)}
                  </p>
                  <span className="mt-auto pt-2 inline-flex items-center gap-1 text-teal-300 text-[11px] font-semibold">
                    <FlaskConical size={12} /> {t('habitScience.learnMore')}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

      </div>

      {/* Habit catalog library (browse + learn + create) */}
      {isCatalogOpen && (
        <TemplateLibrary
          onClose={() => setIsCatalogOpen(false)}
          onSelectTemplate={(_data: Partial<HabitFormData>, _template: HabitTemplate) => {
            // Creating from a template requires picking a life area in the form,
            // which lives on the Rituales page. Route there to finish setup.
            setIsCatalogOpen(false);
            navigate(ROUTES.HABITS);
          }}
        />
      )}

      {/* Featured habit science card (from the Home carousel) */}
      {catalogEntry && (
        <HabitScienceSheet
          entry={catalogEntry}
          onClose={() => setCatalogEntry(null)}
          onCreate={() => {
            setCatalogEntry(null);
            navigate(ROUTES.HABITS);
          }}
        />
      )}

      {/* Level Up celebration (home completions award real XP too) */}
      {levelUpLevel !== null && (
        <LevelUpNotification
          level={levelUpLevel}
          type="global"
          pointsReward={calculateGlobalLevelUpReward(levelUpLevel)}
          onClose={() => setLevelUpLevel(null)}
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
    </div>
  );
}

export default Dashboard;
