import React, { useState, Suspense, lazy } from 'react';
import {
  Bell,
  Flame,
  Gem,
  Target,
  NotebookPen,
  Compass,
  ChevronRight,
  Check,
  Loader2,
  FlaskConical,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CircularProgress } from '@/components/ui';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';
import { HabitScienceSheet, TemplateLibrary } from '@/features/habits/components';
import { HABIT_CATALOG, findCatalogEntry } from '@/constants/habitCatalog';
import type { HabitCatalogEntry } from '@/constants/habitCatalog';
import type { HabitFormData, HabitTemplate } from '@/types';
// Lazy-loaded: pulls in the markdown + syntax-highlighting bundle only when the
// user actually opens the Coach overlay, keeping the Dashboard chunk lean.
const CoachChat = lazy(() =>
  import('@/features/chat/components/CoachChat').then((m) => ({ default: m.CoachChat }))
);
import { HABIT_ICONS } from '@/components/atoms/icons/iconMaps';
import { useUser, useHabits, useStreaks } from '@/store';
import { ROUTES, getHeroBodySrc } from '@/constants';
import { useLocale } from '@/hooks/useLocale';
import { getLevelProgress } from '@/utils/xp';
import { getGreetingKey, getDailyQuoteIndex } from '@/utils/greeting';

// Hero is composed of two independent layers (swappable / animatable):
// the jungle background and the transparent character. Both live in /public.
const HERO_BG_SRC = '/hero-bg.png';

// Fallback accent palette for habit rows when a habit has no explicit color.
const HABIT_COLORS = ['#4CAF6D', '#8B5CF6', '#E0A93B', '#2DD4BF', '#F472B6', '#60A5FA'];

export function Dashboard() {
  const navigate = useNavigate();
  const { user, isLoading: userLoading } = useUser();
  const { habits, completeHabit, uncompleteHabit } = useHabits();
  const { streak, isLoading: streakLoading } = useStreaks();
  const { t } = useLocale();
  const [isCoachOpen, setIsCoachOpen] = useState(false);
  // Habit catalog: browse the library, or read a featured habit's science card.
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [catalogEntry, setCatalogEntry] = useState<HabitCatalogEntry | null>(null);

  const levelProgress = user
    ? getLevelProgress(user.totalXPEarned, user.level)
    : { current: 0, max: 0, percentage: 0 };
  const animatedXP = useAnimatedNumber(levelProgress.current);

  const isLoading = userLoading || streakLoading;

  const comingSoon = () => toast(t('home.comingSoon'), { icon: '🚧' });

  // Motivational quote rotates once per day.
  const quotes = t('home.quotes', { returnObjects: true }) as string[];
  const quote = Array.isArray(quotes) && quotes.length > 0
    ? quotes[getDailyQuoteIndex(quotes.length)]
    : '';

  const firstName = user?.name?.split(' ')[0] || '';
  const todaysHabits = habits.slice(0, 3);
  const pendingCount = habits.filter((h) => !h.completedToday).length;

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
          Layer 1 — character (transparent PNG, own layer → swappable / animatable).

          ── ASSET ALIGNMENT (keep avatars consistent so they always line up) ──
          Background platform centre (golden rune): 47% x, 72.4% y of /hero-bg.png.
          Character canvas (/hero-character.png 820×1230): feet baseline at 93.4%
          of the canvas height, content horizontally centred ~46%.
          With the container aspect-locked, `bottom-[24.4%]` + `w-[58%]` lands the
          feet exactly on the rune at EVERY width (the width term cancels).
          NEW AVATARS must use the SAME canvas: portrait 820×1230 ratio (2:3),
          character horizontally centred, feet at ~93% down the canvas. Then they
          align automatically with no code change.
        */}
        <img
          src={getHeroBodySrc(user?.avatarUrl)}
          alt=""
          aria-hidden="true"
          className="absolute bottom-[24.4%] left-1/2 -translate-x-1/2 w-[58%] h-auto object-contain drop-shadow-[0_14px_14px_rgba(0,0,0,0.5)]"
          onError={(e) => { (e.currentTarget.style.opacity = '0'); }}
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
        <div className="aspect-[941/1210] -mx-4 px-4">
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
              <p className="text-white/70 text-[10px] font-semibold leading-tight">{t('home.streakLabel')}</p>
              <div className="flex items-center justify-center gap-1 mt-0.5">
                <Flame size={16} className="text-orange-400" />
                <span className="text-2xl font-extrabold text-white leading-none">
                  {streak?.currentStreak ?? 0}
                </span>
              </div>
              <p className="text-white/60 text-[10px] font-medium">{t('common.days').toLowerCase()}</p>
              <p className="text-white/45 text-[9px] mt-0.5">{t('home.streakKeepGoing')}</p>
            </div>

            {/* Quick action: focus of the day */}
            <button
              type="button"
              onClick={comingSoon}
              className={`${heroCard} p-2.5 flex flex-col items-center text-center gap-1.5`}
            >
              <Target size={18} className="text-teal-300" />
              <span className="text-white text-[12px] font-semibold leading-tight">
                {t('home.focusOfDay')}
              </span>
            </button>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-2.5 w-[27%]">
            {/* Level / XP card */}
            <div className={`${heroCard} p-2.5 flex flex-col items-center`}>
              <p className="text-white/70 text-[10px] font-semibold mb-1.5">
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
                  <span className="text-white/50 text-[8px] font-medium">
                    / {levelProgress.max} XP
                  </span>
                </div>
              </CircularProgress>
            </div>

            {/* Quick action: personal coach (Hermes chat) */}
            <button
              type="button"
              onClick={() => setIsCoachOpen(true)}
              className={`${heroCard} p-2.5 flex flex-col items-center text-center gap-1.5`}
            >
              <NotebookPen size={18} className="text-amber-300" />
              <span className="text-white text-[12px] font-semibold leading-tight">
                {t('home.personalJournal')}
              </span>
            </button>
          </div>
        </div>
        </div>{/* /hero overlay zone */}

        {/* Motivational banner — floats just below the character's feet (the
            spacer above ends at the feet; this small margin is the breathing gap) */}
        <button
          type="button"
          onClick={comingSoon}
          className="w-full glass-card p-4 flex items-center gap-3 text-left mt-3 mb-7"
        >
          <span className="shrink-0 w-11 h-11 rounded-full bg-gold-500/15 flex items-center justify-center">
            <Compass size={22} className="text-gold-400" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-white text-sm font-bold leading-snug">{quote}</span>
            <span className="block text-white/55 text-xs mt-0.5">{t('home.quoteSubtitle')}</span>
          </span>
          <ChevronRight size={20} className="text-white/40 shrink-0" />
        </button>

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
                  className="shrink-0 w-[132px] glass-card p-3 text-left hover:border-teal-400/40 transition-colors"
                >
                  <span className="w-10 h-10 rounded-xl grid place-items-center bg-teal-500/15 text-teal-300 mb-2">
                    <Icon size={20} />
                  </span>
                  <p className="text-white text-sm font-bold leading-tight line-clamp-2">
                    {(t as (k: string) => string)(`habitCatalog.${entry.slug}.title`)}
                  </p>
                  <span className="mt-2 inline-flex items-center gap-1 text-teal-300 text-[11px] font-semibold">
                    <FlaskConical size={12} /> {t('habitScience.learnMore')}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Today's path */}
        <section aria-labelledby="today-heading">
          <div className="flex items-center justify-between mb-4">
            <h2 id="today-heading" className="font-sans normal-case text-xl font-bold text-white">
              {t('home.todayPath')}
            </h2>
            <button
              type="button"
              onClick={() => navigate(ROUTES.HABITS)}
              className="flex items-center gap-1 text-teal-300 text-sm font-semibold"
            >
              {t('home.seeAll')} <ChevronRight size={16} />
            </button>
          </div>

          {todaysHabits.length === 0 ? (
            <p className="text-white/50 text-sm text-center py-6">{t('home.noHabits')}</p>
          ) : (
            <div className="space-y-3">
              {todaysHabits.map((habit, index) => {
                const Icon = HABIT_ICONS[habit.iconName] || HABIT_ICONS['Target'] || Target;
                const color = habit.color || HABIT_COLORS[index % HABIT_COLORS.length];
                const isMeasurable = habit.habitType === 'measurable' && !!habit.dailyGoal;
                const value = habit.todayValue ?? 0;
                const goal = habit.dailyGoal ?? 0;
                const pct = goal > 0 ? Math.min((value / goal) * 100, 100) : 0;
                const unitLong = habit.unit === 'min' ? t('home.minutes') : habit.unit ?? '';
                const subtitle = habit.dailyGoal
                  ? `${goal} ${unitLong}`.trim()
                  : `+${habit.xp} XP`;

                return (
                  <div
                    key={habit.id}
                    onClick={() => isMeasurable && navigate(ROUTES.HABITS)}
                    className="glass-card p-3.5 flex items-center gap-3"
                    role={isMeasurable ? 'button' : undefined}
                  >
                    {/* Icon */}
                    <span
                      className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: color }}
                    >
                      <Icon size={20} className="text-white" />
                    </span>

                    {/* Name + subtitle */}
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-semibold leading-tight truncate">{habit.name}</p>
                      <p className="text-white/55 text-xs mt-0.5">{subtitle}</p>
                    </div>

                    {/* Right side: progress or check */}
                    {isMeasurable ? (
                      <div className="w-28 shrink-0">
                        <p className="text-right text-white text-sm font-semibold mb-1">
                          <span className="text-white">{value}</span>
                          <span className="text-white/50"> / {goal} {habit.unit}</span>
                        </p>
                        <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: color }}
                          />
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          habit.completedToday ? uncompleteHabit(habit.id) : completeHabit(habit.id);
                        }}
                        aria-pressed={habit.completedToday}
                        aria-label={habit.name}
                        className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                          habit.completedToday
                            ? 'bg-success-500 text-white shadow-glow-success'
                            : 'bg-white/10 text-white/40 border border-white/15'
                        }`}
                      >
                        <Check size={18} strokeWidth={3} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Coach Personal — Hermes-powered chat overlay */}
      {isCoachOpen && (
        <Suspense fallback={null}>
          <CoachChat onClose={() => setIsCoachOpen(false)} />
        </Suspense>
      )}

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
    </div>
  );
}

export default Dashboard;
