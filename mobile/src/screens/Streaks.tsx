/**
 * Streaks ("Progreso") — React Native port of ../src/pages/Streaks.tsx.
 *
 * Full-bleed hero (background art + avatar character) layered behind glass
 * cards: weekly summary, current streak (Mon→Sun strip, index 6 = today),
 * real daily XP activity chart and focus areas. Tab screen: bottom padding
 * clears the tab bar.
 */

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
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
} from 'lucide-react-native';
import { useUser, useHabits, useStreaks, useLifeAreas, useTheme } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import { getAreaLevelProgress } from '@/utils/xp';
import { getHeroBodySrc, getLifeAreaMeta, ROUTES } from '@/constants';
import { getIcon } from '@/components/atoms/icons/iconMaps';
import { StatsService, type DailyActivity } from '@/services/supabase/stats.service';
import { Header } from '@/components/layout';
import { img } from '@/assets/registry';
import { themeHsl } from '@/theme/themeVars';
import { cn } from '@/utils';
import type { LifeArea } from '@/types';

// The character body is resolved from the user's chosen avatar (see getHeroBodySrc).
const HERO_BG_SRC = '/hero-bg.png';

/** glass-card recipe (PORTING.md) */
const glass = 'rounded-2xl border border-white/10 bg-[hsl(var(--glass-bg)/0.65)] p-4';

/** Life-area gem illustration with lucide-icon fallback (web: img onError). */
function FocusAreaGem({
  image,
  iconName,
  color,
}: {
  image: string;
  iconName: string;
  color: string;
}) {
  const [failed, setFailed] = useState(false);
  const source = img(image);
  const Icon = getIcon(iconName, Star);

  if (!source || failed) {
    return (
      <View
        className="h-11 w-11 items-center justify-center rounded-full"
        style={{ backgroundColor: color }}
      >
        <Icon size={18} color="#FFFFFF" />
      </View>
    );
  }
  return (
    <View className="h-11 w-11 items-center justify-center rounded-full">
      <Image
        source={source}
        contentFit="contain"
        style={{ width: '100%', height: '100%' }}
        onError={() => setFailed(true)}
        accessibilityElementsHidden
      />
    </View>
  );
}

export function Streaks() {
  const { user, isLoading: userLoading } = useUser();
  const { streak, isLoading: streakLoading } = useStreaks();
  const { habits } = useHabits();
  const { lifeAreas } = useLifeAreas();
  const { theme } = useTheme();
  const { t } = useLocale();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const isLoading = userLoading || streakLoading;

  // Real daily activity (XP per local day) from habit_completions.
  const [activity, setActivity] = useState<DailyActivity[]>([]);
  useEffect(() => {
    let alive = true;
    StatsService.getDailyActivity(7).then((rows) => {
      if (alive) setActivity(rows);
    });
    return () => {
      alive = false;
    };
  }, []);

  const [heroFailed, setHeroFailed] = useState(false);

  const weekdays = t('progress.weekdaysShort', { returnObjects: true }) as unknown as string[];
  const safeWeekdays =
    Array.isArray(weekdays) && weekdays.length === 7
      ? weekdays
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // lastSevenDays / getDailyActivity(7) end at today, so rotate the static
  // Mon-Sun labels so slot 6 = today's weekday.
  const todayIdx = (new Date().getDay() + 6) % 7;
  const rotatedWeekdays = safeWeekdays.map((_, i) => safeWeekdays[(todayIdx + 1 + i) % 7]);

  // Literal theme colors for gradients built in JS (LinearGradient can't
  // consume `hsl(var(--x))` classes).
  const bg = themeHsl(theme, '--background');
  const bg85 = themeHsl(theme, '--background', 0.85);
  const bg30 = themeHsl(theme, '--background', 0.3);
  const bg0 = themeHsl(theme, '--background', 0);
  const teal400 = themeHsl(theme, '--accent-400');
  const teal600 = themeHsl(theme, '--accent-600');

  if (isLoading) {
    return (
      <View className="flex-1 bg-background">
        <Header />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={themeHsl(theme, '--accent-500')} />
          <Text className="mt-4 font-semibold text-white">{t('common.loading')}</Text>
        </View>
      </View>
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
      iconColor: '#66CB8F', // success-400
      ring: 'bg-success-500/15',
      big: `${completedCount}`,
      small: `${t('progress.of')} ${totalHabits}`,
      label: t('progress.habitsCompleted'),
    },
    {
      icon: Clock,
      iconColor: '#C084FC', // purple-400
      ring: 'bg-purple-500/15',
      big: `${minutesInvested}`,
      small: t('progress.min'),
      label: t('progress.minutesInvested'),
    },
    {
      icon: Star,
      iconColor: 'hsl(40, 95%, 58%)', // gold-400
      ring: 'bg-gold-500/15',
      big: `${longestStreak}`,
      small: t('progress.daysCount', { count: longestStreak }),
      label: t('progress.bestStreak'),
    },
    {
      icon: Gem,
      iconColor: 'hsl(210, 100%, 62%)', // blue-400
      ring: 'bg-blue-500/15',
      big: `${totalXP}`,
      small: t('progress.xp'),
      label: t('progress.xpEarned'),
    },
  ];

  // Hero sizing (web: h-[120vw] max-h-[460px]; character w-[52%] max 230px)
  const heroH = Math.min(width * 1.2, 460);
  const charW = Math.min(width * 0.52, 230);
  const spacerH = Math.min(width * 0.24, 96);

  const goToRealms = (areaId?: string) => {
    if (areaId) {
      router.push({ pathname: ROUTES.REALMS, params: { areaId } });
    } else {
      router.push(ROUTES.REALMS);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <Header />
      <ScrollView contentContainerStyle={{ paddingBottom: 130 }}>
        {/* ── Hero (full-bleed top), layered like the Dashboard ── */}
        <View
          className="absolute left-0 right-0 top-0 overflow-hidden bg-background"
          style={{ height: heroH }}
        >
          <Image
            source={img(HERO_BG_SRC)}
            contentFit="cover"
            contentPosition="top"
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            accessibilityElementsHidden
          />
          {/* Top scrim for header legibility */}
          <LinearGradient
            colors={[bg85, bg30, bg0]}
            style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 192 }}
          />
          {/* Bottom fade into the page */}
          <LinearGradient
            colors={[bg0, bg]}
            style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 176 }}
          />
          {/* Character (transparent PNG), upper-right */}
          {!heroFailed && (
            <Image
              source={img(getHeroBodySrc(user?.avatarUrl))}
              contentFit="contain"
              contentPosition="top"
              onError={() => setHeroFailed(true)}
              style={{
                position: 'absolute',
                top: heroH * 0.06,
                right: -width * 0.04,
                width: charW,
                height: heroH * 0.8,
              }}
              accessibilityElementsHidden
            />
          )}
        </View>

        {/* ── Foreground content ── */}
        <View
          className="px-4 pt-6"
          style={{ width: '100%', maxWidth: 448, alignSelf: 'center' }}
        >
          {/* Hero text + streak chip */}
          <View className="mb-6">
            <View className="flex-row items-start justify-between gap-3">
              <View className="max-w-[62%]">
                <Text className="text-[32px] font-extrabold leading-none tracking-tight text-white">
                  {t('progress.title')}
                </Text>
                <Text className="mt-2 text-[15px] font-medium leading-snug text-white/70">
                  {t('progress.subtitle')}
                </Text>
              </View>
              <View className="flex-row items-center gap-1.5 rounded-full border border-white/10 bg-[hsl(var(--glass-bg)/0.4)] px-3 py-1.5">
                <Flame size={14} color="hsl(36, 100%, 60%)" />
                <Text className="text-xs font-bold text-white">
                  {currentStreak} {t('progress.streakChip', { count: currentStreak })}
                </Text>
              </View>
            </View>
            {/* Motivational quote */}
            <Text className="mt-4 max-w-[60%] text-sm font-medium leading-snug text-white/80">
              {t('profile.quote')}{' '}
              <Text className="font-semibold text-teal-300">{t('profile.quoteAccent')}</Text>
            </Text>
          </View>

          {/* Spacer so cards clear the character */}
          <View style={{ height: spacerH }} />

          {/* ── Resumen semanal ── */}
          <View className={cn(glass, 'mb-4')}>
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-base font-bold text-white">
                {t('progress.weeklySummary')}
              </Text>
              <View className="flex-row items-center gap-1 rounded-full border border-white/10 bg-white/10 px-3 py-1">
                <Text className="text-xs font-semibold text-white/80">
                  {t('progress.thisWeek')}
                </Text>
                <ChevronDown size={14} color="rgba(255,255,255,0.8)" />
              </View>
            </View>
            <View className="flex-row flex-wrap gap-3">
              {stats.map((s) => {
                const Icon = s.icon;
                return (
                  <View
                    key={s.label}
                    className="flex-row items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
                    style={{ width: '47%', flexGrow: 1 }}
                  >
                    <View
                      className={cn(
                        'h-10 w-10 items-center justify-center rounded-full',
                        s.ring
                      )}
                    >
                      <Icon size={18} color={s.iconColor} />
                    </View>
                    <View className="flex-1">
                      <Text numberOfLines={1}>
                        <Text className="text-xl font-extrabold text-white">{s.big}</Text>
                        {s.small && (
                          <Text className="text-xs font-medium text-white/50"> {s.small}</Text>
                        )}
                      </Text>
                      <Text className="mt-1 text-[11px] leading-tight text-white/55">
                        {s.label}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* ── Tu racha actual ── */}
          {/* Stacked layout: the 7-day row gets its own full-width line so the
              circles never overflow the card on narrow phones (320-360px). */}
          <View className={cn(glass, 'mb-4')}>
            <Text className="mb-3 text-base font-bold text-white">
              {t('progress.currentStreakTitle')}
            </Text>
            <View className="gap-4">
              <View className="flex-row items-center justify-between gap-3">
                <View className="flex-row items-center gap-1.5">
                  <Flame size={26} color="hsl(36, 100%, 60%)" />
                  <Text className="text-3xl font-extrabold leading-none text-white">
                    {currentStreak}
                  </Text>
                  <Text className="text-sm font-semibold text-white/60">
                    {t('progress.daysCount', { count: currentStreak })}
                  </Text>
                </View>
                <Text className="text-right text-xs text-white/55">
                  {t('progress.keepItUp')}
                </Text>
              </View>
              <View className="flex-row justify-between gap-1">
                {rotatedWeekdays.map((label, i) => {
                  const isToday = i === rotatedWeekdays.length - 1;
                  const active = lastSeven[i] === true;
                  return (
                    <View key={i} className="items-center gap-1">
                      <Text
                        numberOfLines={1}
                        className="text-[10px] font-semibold text-white/55"
                      >
                        {isToday ? t('progress.today') : label}
                      </Text>
                      <View
                        className={cn(
                          'h-6 w-6 items-center justify-center rounded-full',
                          active ? 'bg-orange-500/20' : 'bg-white/5',
                          isToday && 'border-2 border-teal-400'
                        )}
                      >
                        <Flame
                          size={13}
                          color={active ? 'hsl(36, 100%, 60%)' : 'rgba(255,255,255,0.25)'}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>

          {/* ── Actividad diaria (XP real por día) ── */}
          <View className={cn(glass, 'mb-4')}>
            <View className="mb-5 flex-row items-center justify-between">
              <Text className="text-base font-bold text-white">
                {t('progress.dailyActivity')}
              </Text>
              <View className="rounded-full border border-white/10 bg-white/10 px-3 py-1">
                <Text className="text-xs font-semibold text-white/80">{t('progress.xp')}</Text>
              </View>
            </View>
            {(() => {
              const values =
                activity.length === 7 ? activity.map((a) => a.xp) : Array(7).fill(0);
              const max = Math.max(...values, 1);
              return (
                <View className="h-36 flex-row items-end justify-between gap-2">
                  {values.map((value, i) => {
                    const heightPct = Math.max((value / max) * 100, 6);
                    const isToday = i === values.length - 1;
                    return (
                      <View
                        key={i}
                        className="h-full flex-1 items-center justify-end gap-1.5"
                      >
                        <Text className="text-[10px] font-semibold text-white/70">{value}</Text>
                        <View className="w-full flex-1 justify-end">
                          <View
                            className={cn(
                              'w-full overflow-hidden rounded-lg',
                              isToday && 'border border-teal-300/60'
                            )}
                            style={{ height: `${heightPct}%` }}
                          >
                            <LinearGradient
                              colors={[teal600, teal400]}
                              start={{ x: 0, y: 1 }}
                              end={{ x: 0, y: 0 }}
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                              }}
                            />
                          </View>
                        </View>
                        <Text
                          numberOfLines={1}
                          className="text-[10px] font-medium text-white/50"
                        >
                          {isToday ? t('progress.today') : rotatedWeekdays[i]}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              );
            })()}
          </View>

          {/* ── Áreas de enfoque ── */}
          <View className={cn(glass, 'mb-4')}>
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-base font-bold text-white">{t('progress.focusAreas')}</Text>
              <Pressable
                onPress={() => goToRealms()}
                accessibilityRole="button"
                accessibilityLabel={t('progress.seeDetail')}
              >
                <Text className="text-sm font-semibold text-teal-300">
                  {t('progress.seeDetail')}
                </Text>
              </Pressable>
            </View>
            {focusAreas.length === 0 ? (
              <Text className="py-4 text-center text-sm text-white/50">
                {t('progress.noFocusAreas')}
              </Text>
            ) : (
              <View className="gap-3">
                {focusAreas.map((area: LifeArea) => {
                  const meta = getLifeAreaMeta(area);
                  const label = t(meta.i18nKey, { defaultValue: String(area.area) });
                  const prog = getAreaLevelProgress(area.totalXP, area.level);
                  const pct = prog.max > 0 ? Math.min((prog.current / prog.max) * 100, 100) : 0;
                  return (
                    <Pressable
                      key={area.id}
                      onPress={() => goToRealms(area.id)}
                      accessibilityRole="button"
                      accessibilityLabel={label}
                      className="w-full flex-row items-center gap-3 active:opacity-80"
                    >
                      <FocusAreaGem
                        image={meta.image}
                        iconName={meta.iconName}
                        color={meta.color}
                      />
                      <View className="flex-1">
                        <View className="flex-row items-center justify-between gap-2">
                          <Text numberOfLines={1} className="flex-1 text-sm font-semibold text-white">
                            {label}
                          </Text>
                          <Text className="text-xs font-medium text-white/50">
                            {t('realms.levelLabel', {
                              level: area.level,
                              defaultValue: `Nivel ${area.level}`,
                            })}
                          </Text>
                        </View>
                        <View className="mt-1.5 flex-row items-center gap-2">
                          <View className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                            <View
                              className="h-full rounded-full"
                              style={{ width: `${pct}%`, backgroundColor: meta.color }}
                            />
                          </View>
                          <Text className="text-[10px] font-medium text-white/50">
                            {prog.current} / {prog.max} XP
                          </Text>
                        </View>
                      </View>
                      <ChevronRight size={18} color="rgba(255,255,255,0.3)" />
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>

          {/* ── Banner ── */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('progress.bannerTitle')}
            className="w-full flex-row items-center gap-3 rounded-2xl border border-white/10 bg-[hsl(var(--glass-bg)/0.65)] p-4 active:opacity-80"
          >
            <View className="h-11 w-11 items-center justify-center rounded-full bg-gold-500/15">
              <Compass size={22} color="hsl(40, 95%, 58%)" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold leading-snug text-white">
                {t('progress.bannerTitle')}
              </Text>
              <Text className="mt-0.5 text-xs text-white/55">
                {t('progress.bannerSubtitle')}
              </Text>
            </View>
            <ChevronRight size={20} color="rgba(255,255,255,0.4)" />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

export default Streaks;
