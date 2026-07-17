import {
  Flame,
  Clock,
  Star,
  Gem,
  Check,
  ChevronDown,
  ChevronRight,
  Compass,
  type LucideIcon,
  Loader2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useHabits, useStreaks, useLifeAreas } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import { getAreaLevelProgress } from '@/utils/xp';
import { getHeroBodySrc, getLifeAreaMeta, ROUTES } from '@/constants';
import { getIcon } from '@/components/atoms/icons/iconMaps';
import { StatsService, type DailyActivity } from '@/services/supabase/stats.service';
import { CompletionTimesChart } from '@/features/streaks/components';

// The character body is resolved from the user's chosen avatar (see getHeroBodySrc).
const HERO_BG_SRC = '/hero-bg.png';

export function Streaks() {
  const { user, isLoading: userLoading } = useUser();
  const { streak, isLoading: streakLoading } = useStreaks();
  const { habits } = useHabits();
  const { lifeAreas } = useLifeAreas();
  const { t } = useLocale();
  const navigate = useNavigate();

  const isLoading = userLoading || streakLoading;

  // Real daily activity (XP per local day) from habit_completions.
  const [activity, setActivity] = useState<DailyActivity[]>([]);
  // Raw completion timestamps (last 30 days) for the time-of-day chart.
  const [completionTimes, setCompletionTimes] = useState<Date[]>([]);
  useEffect(() => {
    let alive = true;
    StatsService.getDailyActivity(7).then((rows) => {
      if (alive) setActivity(rows);
    });
    StatsService.getCompletionTimestamps(30).then((times) => {
      if (alive) setCompletionTimes(times);
    });
    return () => {
      alive = false;
    };
  }, []);

  const weekdays = t('progress.weekdaysShort', { returnObjects: true }) as string[];
  const safeWeekdays = Array.isArray(weekdays) && weekdays.length === 7
    ? weekdays
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // lastSevenDays / getDailyActivity(7) end at today, so rotate the static
  // Mon-Sun labels so slot 6 = today's weekday.
  const todayIdx = (new Date().getDay() + 6) % 7;
  const rotatedWeekdays = safeWeekdays.map(
    (_, i) => safeWeekdays[(todayIdx + 1 + i) % 7]
  );

  // Glass cards (slightly translucent so the page background shows through).
  const card = 'glass-card rounded-2xl p-4';
  const heroChip =
    'bg-[hsl(var(--glass-bg)/0.4)] backdrop-blur-md border border-white/10 rounded-full';

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

  const completedCount = habits.filter((h) => h.completedToday).length;
  const totalHabits = habits.length;

  const lastSeven = streak?.lastSevenDays ?? [];
  const currentStreak = streak?.currentStreak ?? 0;
  const longestStreak = streak?.longestStreak ?? currentStreak;
  const totalXP = user?.totalXPEarned ?? 0;

  // Minutes invested today, from measurable habits logged in 'min'.
  const minutesInvested = habits.reduce((sum, h) => {
    const value = (h as { todayValue?: number }).todayValue ?? 0;
    return h.unit === 'min' ? sum + value : sum;
  }, 0);

  const focusAreas = lifeAreas.filter((a) => a.enabled).slice(0, 4);

  const stats: Array<{
    icon: LucideIcon;
    iconColor: string;
    ring: string;
    big: string;
    small?: string;
    label: string;
  }> = [
    {
      icon: Check,
      iconColor: 'text-success-400',
      ring: 'bg-success-500/15',
      big: `${completedCount}`,
      small: `${t('progress.of')} ${totalHabits}`,
      label: t('progress.habitsCompleted'),
    },
    {
      icon: Clock,
      iconColor: 'text-purple-400',
      ring: 'bg-purple-500/15',
      big: `${minutesInvested}`,
      small: t('progress.min'),
      label: t('progress.minutesInvested'),
    },
    {
      icon: Star,
      iconColor: 'text-gold-400',
      ring: 'bg-gold-500/15',
      big: `${longestStreak}`,
      small: t('progress.daysCount', { count: longestStreak }),
      label: t('progress.bestStreak'),
    },
    {
      icon: Gem,
      iconColor: 'text-blue-400',
      ring: 'bg-blue-500/15',
      big: `${totalXP}`,
      small: t('progress.xp'),
      label: t('progress.xpEarned'),
    },
  ];

  return (
    <div className="relative min-h-screen pb-28 overflow-x-hidden">
      {/* ── Hero (full-bleed top), layered like the Dashboard ── */}
      <div className="absolute top-0 left-0 right-0 h-[120vw] max-h-[460px] -z-0 bg-[hsl(var(--background))] overflow-hidden">
        <img
          src={HERO_BG_SRC}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-top"
        />
        {/* Top scrim for header legibility */}
        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-[hsl(var(--background))]/85 via-[hsl(var(--background))]/30 to-transparent" />
        {/* Bottom fade into the page */}
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-b from-transparent to-[hsl(var(--background))]" />
        {/* Character (transparent PNG), upper-right */}
        <img
          src={getHeroBodySrc(user?.avatarUrl, user?.avatarBodyUrl)}
          alt=""
          aria-hidden="true"
          className="absolute top-[6%] right-[-4%] w-[52%] max-w-[230px] h-auto object-contain drop-shadow-[0_14px_14px_rgba(0,0,0,0.5)]"
          onError={(e) => {
            e.currentTarget.style.opacity = '0';
          }}
        />
      </div>

      {/* ── Foreground content ── */}
      <div className="relative z-10 max-w-md mx-auto px-4 pt-[calc(env(safe-area-inset-top)+1.5rem)] animate-page-in">
        {/* Hero text + streak chip */}
        <header className="relative mb-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 max-w-[62%]">
              <h1 className="font-sans normal-case text-[32px] leading-none font-extrabold text-white tracking-tight">
                {t('progress.title')}
              </h1>
              <p className="font-sans text-white/70 text-[15px] font-medium mt-2 leading-snug">
                {t('progress.subtitle')}
              </p>
            </div>
            <span
              className={`${heroChip} shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-white text-xs font-bold`}
            >
              <Flame size={14} className="text-orange-400" />
              {currentStreak} {t('progress.streakChip', { count: currentStreak })}
            </span>
          </div>
          {/* Motivational quote */}
          <p className="mt-4 text-sm text-white/80 font-medium max-w-[60%] leading-snug">
            {t('profile.quote')}{' '}
            <span className="text-teal-300 font-semibold">{t('profile.quoteAccent')}</span>
          </p>
        </header>

        {/* Spacer so cards clear the character */}
        <div className="h-[24vw] max-h-[96px]" aria-hidden="true" />

        {/* ── Resumen semanal ── */}
        <section className={`${card} mb-4`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-base">{t('progress.weeklySummary')}</h2>
            <span className="flex items-center gap-1 rounded-full bg-white/10 border border-white/10 px-3 py-1 text-white/80 text-xs font-semibold">
              {t('progress.thisWeek')}
              <ChevronDown size={14} />
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 p-3"
                >
                  <span
                    className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${s.ring}`}
                  >
                    <Icon size={18} className={s.iconColor} />
                  </span>
                  <div className="min-w-0">
                    <p className="leading-none">
                      <span className="text-white text-xl font-extrabold">{s.big}</span>
                      {s.small && (
                        <span className="text-white/50 text-xs font-medium ml-1">{s.small}</span>
                      )}
                    </p>
                    <p className="text-white/55 text-[11px] mt-1 leading-tight">{s.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Tu racha actual ── */}
        {/* Stacked layout: the 7-day row gets its own full-width line so the
            circles never overflow the card on narrow phones (320-360px). */}
        <section className={`${card} mb-4`}>
          <h2 className="text-white font-bold text-base mb-3">{t('progress.currentStreakTitle')}</h2>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-baseline gap-1.5 min-w-0">
                <Flame size={26} className="text-orange-400 self-center shrink-0" />
                <span className="text-3xl font-extrabold text-white leading-none">
                  {currentStreak}
                </span>
                <span className="text-white/60 text-sm font-semibold">
                  {t('progress.daysCount', { count: currentStreak })}
                </span>
              </div>
              <p className="text-white/55 text-xs text-right">{t('progress.keepItUp')}</p>
            </div>
            <div className="flex justify-between gap-1 min-w-0">
              {rotatedWeekdays.map((label, i) => {
                const isToday = i === rotatedWeekdays.length - 1;
                const active = lastSeven[i] === true;
                return (
                  <div key={i} className="flex flex-col items-center gap-1 min-w-0">
                    <span className="text-[10px] font-semibold text-white/55 truncate max-w-full">
                      {isToday ? t('progress.today') : label}
                    </span>
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        active ? 'bg-orange-500/20' : 'bg-white/5'
                      } ${isToday ? 'ring-2 ring-inset ring-teal-400' : ''}`}
                    >
                      <Flame
                        size={13}
                        className={active ? 'text-orange-400' : 'text-white/25'}
                      />
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Actividad diaria (XP real por día) ── */}
        <section className={`${card} mb-4`}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-white font-bold text-base">{t('progress.dailyActivity')}</h2>
            <span className="rounded-full bg-white/10 border border-white/10 px-3 py-1 text-white/80 text-xs font-semibold">
              {t('progress.xp')}
            </span>
          </div>
          {(() => {
            const values = activity.length === 7 ? activity.map((a) => a.xp) : Array(7).fill(0);
            const max = Math.max(...values, 1);
            return (
              <div className="flex items-end justify-between gap-2 h-36">
                {values.map((value, i) => {
                  const heightPct = Math.max((value / max) * 100, 6);
                  const isToday = i === values.length - 1;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-1.5 min-w-0">
                      <span className="text-[10px] font-semibold text-white/70">{value}</span>
                      <div className="w-full flex-1 flex items-end">
                        <div
                          className={`w-full rounded-lg bg-gradient-to-t from-teal-600 to-teal-400 transition-all ${
                            isToday ? 'ring-1 ring-inset ring-teal-300/60' : ''
                          }`}
                          style={{ height: `${heightPct}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-medium text-white/50 truncate max-w-full">
                        {isToday ? t('progress.today') : rotatedWeekdays[i]}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </section>

        {/* ── Horas de completado (distribución 0-23h, últimos 30 días) ── */}
        <CompletionTimesChart timestamps={completionTimes} className={`${card} mb-4`} />

        {/* ── Áreas de enfoque ── */}
        <section className={`${card} mb-4`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-base">{t('progress.focusAreas')}</h2>
            <button
              type="button"
              onClick={() => navigate(ROUTES.REALMS)}
              className="text-teal-300 text-sm font-semibold"
              aria-label={t('progress.seeDetail')}
            >
              {t('progress.seeDetail')}
            </button>
          </div>
          {focusAreas.length === 0 ? (
            <p className="text-white/50 text-sm text-center py-4">{t('progress.noFocusAreas')}</p>
          ) : (
            <div className="space-y-3">
              {focusAreas.map((area) => {
                const meta = getLifeAreaMeta(area);
                const Icon = getIcon(meta.iconName, Star);
                const label = t(meta.i18nKey, { defaultValue: String(area.area) });
                const prog = getAreaLevelProgress(area.totalXP, area.level);
                const pct = prog.max > 0 ? Math.min((prog.current / prog.max) * 100, 100) : 0;
                return (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => navigate(ROUTES.REALMS, { state: { areaId: area.id } })}
                    className="w-full flex items-center gap-3 text-left"
                    aria-label={label}
                  >
                    <span className="shrink-0 w-11 h-11 rounded-full grid place-items-center relative">
                      <img
                        src={meta.image}
                        alt=""
                        aria-hidden="true"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          // Fall back to the colored lucide icon if the gem is missing.
                          const img = e.currentTarget;
                          img.style.display = 'none';
                          const fb = img.nextElementSibling as HTMLElement | null;
                          if (fb) {
                            fb.style.display = 'flex';
                            fb.style.backgroundColor = meta.color;
                          }
                        }}
                      />
                      <span
                        className="absolute inset-0 rounded-full hidden items-center justify-center"
                      >
                        <Icon size={18} className="text-white" />
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-white font-semibold text-sm truncate">{label}</span>
                        <span className="text-white/50 text-xs font-medium shrink-0">
                          {t('realms.levelLabel', {
                            level: area.level,
                            defaultValue: `Nivel ${area.level}`,
                          })}
                        </span>
                      </span>
                      <span className="flex items-center gap-2 mt-1.5">
                        <span className="h-1.5 flex-1 rounded-full bg-white/10 overflow-hidden">
                          <span
                            className="block h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: meta.color }}
                          />
                        </span>
                        <span className="text-white/50 text-[10px] font-medium shrink-0">
                          {prog.current} / {prog.max} {t('common.xp')}
                        </span>
                      </span>
                    </span>
                    <ChevronRight size={18} className="text-white/30 shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Banner ── */}
        <button
          type="button"
          className="w-full glass-card rounded-2xl p-4 flex items-center gap-3 text-left"
          aria-label={t('progress.bannerTitle')}
        >
          <span className="shrink-0 w-11 h-11 rounded-full bg-gold-500/15 flex items-center justify-center">
            <Compass size={22} className="text-gold-400" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-white text-sm font-bold leading-snug">
              {t('progress.bannerTitle')}
            </span>
            <span className="block text-white/55 text-xs mt-0.5">
              {t('progress.bannerSubtitle')}
            </span>
          </span>
          <ChevronRight size={20} className="text-white/40 shrink-0" />
        </button>
      </div>
    </div>
  );
}

export default Streaks;
