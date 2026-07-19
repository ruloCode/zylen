import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bell,
  Flame,
  Gem,
  Target,
  NotebookPen,
  ChevronRight,
  Check,
  FlaskConical,
  Swords,
  Crown,
} from 'lucide-react-native';
import { CircularProgress, LevelUpNotification } from '@/components/ui';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';
import { HabitScienceSheet, TemplateLibrary } from '@/features/habits/components';
import { HABIT_CATALOG } from '@/constants/habitCatalog';
import type { HabitCatalogEntry } from '@/constants/habitCatalog';
import type { HabitFormData, HabitTemplate } from '@/types';
import { DailyFocusChallenge } from '@/features/focus/components';
// Web lazy-loads this (markdown bundle); on native a static import is fine —
// Metro bundles everything up front anyway. Same module path as the web.
import { CoachChat } from '@/features/chat/components/CoachChat';
import { HABIT_ICONS } from '@/components/atoms/icons/iconMaps';
import HeroCharacter from '@/components/hero/HeroCharacter';
import type { HeroCharacterHandle } from '@/components/hero/HeroCharacter';
import { useUser, useHabits, useStreaks, useFocus, useTheme } from '@/store';
import {
  ROUTES,
  FEATURES,
  getHeroBodySrc,
  getHeroVideoSources,
  LIFE_AREA_CATALOG,
} from '@/constants';
import { useLocale } from '@/hooks/useLocale';
import { calculateGlobalLevelUpReward, getLevelProgress } from '@/utils/xp';
import { getGreetingKey } from '@/utils/greeting';
import { img } from '@/assets/registry';
import { themeHsl } from '@/theme/themeVars';

// Hero is composed of two independent layers (swappable / animatable):
// the jungle background and the transparent character.
const HERO_BG_SRC = '/hero-bg.png';

// Fallback accent palette for habit rows when a habit has no explicit color.
const HABIT_COLORS = ['#4CAF6D', '#8B5CF6', '#E0A93B', '#2DD4BF', '#F472B6', '#60A5FA'];

// ── Layout ratios (see the web Dashboard's ASSET ALIGNMENT note) ──
// The hero container is locked to the BACKGROUND's exact aspect ratio
// (941×1672) so the scene shows in full with NO crop at any width. The
// character canvas is 820×1230 (2:3), feet baseline ~93% down the canvas;
// bottom 24.4% + width 58% (centred → left 21%) lands the feet on the
// platform rune at every width.
const HERO_ASPECT = 941 / 1672;
const HERO_OVERLAY_ASPECT = 941 / 1210; // down to the character's feet (72.4% of 1672)
const CHARACTER_ASPECT = 820 / 1230;

// glass-card recipe (PORTING.md)
const glass = 'rounded-2xl border border-white/10 bg-[hsl(var(--glass-bg)/0.65)]';
// Hero cards: lighter, more translucent glass so the character shows through
const heroCard = 'rounded-2xl border border-white/15 bg-[hsl(var(--glass-bg)/0.55)]';

const GOLD_400 = 'hsl(40, 95%, 58%)';
const TEAL_300 = '#5eead4';

export function Dashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isLoading: userLoading } = useUser();
  const { habits, completeHabit, uncompleteHabit } = useHabits();
  const { streak, isLoading: streakLoading } = useStreaks();
  const { loadFocusData } = useFocus();
  const { t } = useLocale();
  const { theme } = useTheme();
  const [isCoachOpen, setIsCoachOpen] = useState(false);
  const heroRef = useRef<HeroCharacterHandle>(null);
  // Habit catalog: browse the library, or read a featured habit's science card.
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [catalogEntry, setCatalogEntry] = useState<HabitCatalogEntry | null>(null);
  // Level-up celebration (the daily-challenge claim can level the hero).
  const [levelUpLevel, setLevelUpLevel] = useState<number | null>(null);

  // Load focus data on mount so the daily-challenge banner knows today's
  // minutes and claim state (same as the web Dashboard).
  useEffect(() => {
    loadFocusData();
  }, [loadFocusData]);

  const levelProgress = user
    ? getLevelProgress(user.totalXPEarned, user.level)
    : { current: 0, max: 0, percentage: 0 };
  const animatedXP = useAnimatedNumber(levelProgress.current);

  const isLoading = userLoading || streakLoading;

  // Theme background as a literal color for the JS-built gradient scrims.
  const bg = (alpha: number) => themeHsl(theme, '--background', alpha);

  const firstName = user?.name?.split(' ')[0] || '';
  const todaysHabits = habits.slice(0, 3);
  const pendingCount = habits.filter((h) => !h.completedToday).length;

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#2dd4bf" />
        <Text className="mt-4 font-semibold text-white">{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 130 }}
      >
        {/* ── Hero (full-bleed top), composed of independent layers ── */}
        {/* Absolute within the scroll content so it scrolls away with the page. */}
        <View
          className="absolute left-0 right-0 top-0 overflow-hidden bg-background"
          style={{ aspectRatio: HERO_ASPECT }}
        >
          {/* Layer 0 — background scene (swappable / themable) */}
          <Image
            source={img(HERO_BG_SRC)}
            contentFit="cover"
            style={StyleSheet.absoluteFill}
          />
          {/* Top scrim for header legibility */}
          <LinearGradient
            colors={[bg(0.9), bg(0.35), bg(0)]}
            style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '36%' }}
          />
          {/* Fade the bottom of the BACKGROUND into the page (kept BELOW the
              character so it doesn't fade the figure) */}
          <LinearGradient
            colors={[bg(0), bg(1)]}
            style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '14%' }}
          />
          {/* Layer 1 — character. Box at the artwork's canvas ratio so the PNG
              fits exactly and the feet land on the platform rune. */}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              bottom: '24.4%',
              left: '21%',
              width: '58%',
              aspectRatio: CHARACTER_ASPECT,
            }}
          >
            <HeroCharacter
              ref={heroRef}
              imgSrc={getHeroBodySrc(user?.avatarUrl, user?.avatarBodyUrl)}
              videoSources={getHeroVideoSources(user?.avatarUrl, user?.avatarBodyUrl)}
            />
          </View>
        </View>

        {/* ── Foreground content ── */}
        <View className="px-4">
          {/* Hero overlay zone — a spacer whose height tracks the hero scene
              down to the character's FEET. Greeting + stat cards sit at the
              top; the gap reveals the character standing on the platform.
              (Web's tap-to-interact is dropped: playRandomInteraction is a
              no-op on native's PNG-only hero.) */}
          <View
            style={{
              aspectRatio: HERO_OVERLAY_ASPECT,
              marginHorizontal: -16,
              paddingHorizontal: 16,
            }}
          >
            {/* Top bar: greeting + notifications (carries the safe-area inset) */}
            <View
              className="mb-5 flex-row items-start justify-between gap-3"
              style={{ paddingTop: insets.top + 24 }}
            >
              <View className="min-w-0 flex-1">
                <Text className="text-[28px] font-extrabold leading-tight tracking-tight text-white">
                  {t(getGreetingKey(), { name: firstName })} 👋
                </Text>
                <Text className="mt-1.5 max-w-[240px] text-[15px] font-medium leading-snug text-white/85">
                  {t('home.subtitle')}
                </Text>
              </View>
              <Pressable
                onPress={() => router.push(ROUTES.HABITS)}
                accessibilityLabel={t('home.notifications')}
                className={`relative h-11 w-11 shrink-0 items-center justify-center rounded-full ${glass}`}
              >
                <Bell size={20} color="#ffffff" />
                {pendingCount > 0 && (
                  <View className="absolute -right-0.5 -top-0.5 h-[18px] min-w-[18px] items-center justify-center rounded-full border border-background bg-danger-500 px-1">
                    <Text className="text-[10px] font-bold text-white">{pendingCount}</Text>
                  </View>
                )}
              </Pressable>
            </View>

            {/* Stat cards + quick actions, split left/right with the hero character in the gap */}
            <View className="flex-row items-start justify-between gap-3">
              {/* Left column */}
              <View className="w-[27%] gap-2.5">
                {/* Streak card */}
                <View className={`${heroCard} items-center p-2.5`}>
                  <Text className="text-center text-[10px] font-semibold leading-tight text-white/90">
                    {t('home.streakLabel')}
                  </Text>
                  <View className="mt-0.5 flex-row items-center justify-center gap-1">
                    <Flame size={16} color="#fb923c" />
                    <Text className="text-2xl font-extrabold leading-none text-white">
                      {streak?.currentStreak ?? 0}
                    </Text>
                  </View>
                  <Text className="text-[10px] font-medium text-white/80">
                    {t('common.days').toLowerCase()}
                  </Text>
                  <Text className="mt-0.5 text-center text-[9px] text-white/70">
                    {t('home.streakKeepGoing')}
                  </Text>
                </View>

                {/* Quick action: focus of the day (Pomodoro gems) */}
                <Pressable
                  onPress={() => router.push(ROUTES.FOCUS)}
                  accessibilityRole="button"
                  accessibilityLabel={t('home.focusOfDay')}
                  className={`${heroCard} items-center gap-1.5 p-2.5`}
                >
                  <Target size={18} color={TEAL_300} />
                  <Text className="text-center text-[12px] font-semibold leading-tight text-white">
                    {t('home.focusOfDay')}
                  </Text>
                </Pressable>
              </View>

              {/* Right column */}
              <View className="w-[27%] gap-2.5">
                {/* Level / XP card */}
                <View className={`${heroCard} items-center p-2.5`}>
                  <Text className="mb-1.5 text-[10px] font-semibold text-white/90">
                    {t('home.levelLabel', { level: user?.level ?? 1 })}
                  </Text>
                  <CircularProgress
                    current={levelProgress.current}
                    max={levelProgress.max || 1}
                    variant="xp"
                    size={74}
                    strokeWidth={6}
                  >
                    <View className="items-center">
                      <Gem size={14} color="#8Fb3ff" />
                      <Text className="text-base font-extrabold leading-none text-white">
                        {animatedXP}
                      </Text>
                      <Text className="text-[8px] font-medium text-white/75">
                        / {levelProgress.max} {t('progress.xp')}
                      </Text>
                    </View>
                  </CircularProgress>
                </View>

                {/* Quick action: personal coach (Hermes chat) */}
                <Pressable
                  onPress={() => setIsCoachOpen(true)}
                  accessibilityRole="button"
                  accessibilityLabel={t('home.personalJournal')}
                  className={`${heroCard} items-center gap-1.5 p-2.5`}
                >
                  <NotebookPen size={18} color="#fcd34d" />
                  <Text className="text-center text-[12px] font-semibold leading-tight text-white">
                    {t('home.personalJournal')}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
          {/* /hero overlay zone */}

          {/* Daily focus challenge — floats just below the character's feet.
              Reads today's focus minutes and offers the claimable reward
              (replaces the old motivational banner, same as the web Home). */}
          <DailyFocusChallenge onLevelUp={setLevelUpLevel} className="mt-3" />

          {/* Arena — the embedded Everlight co-op game (Templo del Desorden).
              Hidden behind FEATURES.enableArena for the first store release. */}
          {FEATURES.enableArena ? (
          <View className="mb-7">
            <Pressable
              onPress={() => router.push(ROUTES.ARENA)}
              accessibilityRole="button"
              accessibilityLabel={t('arena.cardTitle')}
              className={`${glass} relative w-full overflow-hidden`}
            >
              <Image
                source={img('/images/arena-cover.png')}
                contentFit="cover"
                style={[StyleSheet.absoluteFill, { opacity: 0.7 }]}
              />
              <LinearGradient
                colors={[bg(0.95), bg(0.55), bg(0)]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFill}
              />
              <View className="justify-center p-4 pr-24" style={{ minHeight: 120 }}>
                <View className="mb-1 flex-row items-center gap-1.5">
                  <Swords size={13} color={TEAL_300} />
                  <Text className="text-[11px] font-bold uppercase tracking-wider text-teal-300">
                    {t('arena.badge')}
                  </Text>
                </View>
                <Text className="text-lg font-extrabold leading-tight text-white">
                  {t('arena.cardTitle')}
                </Text>
                <Text className="mt-1 max-w-[256px] text-xs leading-snug text-white/80">
                  {t('arena.cardSubtitle')}
                </Text>
                <View className="mt-2 flex-row items-center gap-1">
                  <Text className="text-sm font-bold text-gold-400">{t('arena.cardCta')}</Text>
                  <ChevronRight size={16} color={GOLD_400} />
                </View>
              </View>
            </Pressable>
          </View>
          ) : null}

          {/* Focus realms — life areas as fantasy kingdoms, each with its own detail */}
          <View className="mb-7">
            <Pressable
              onPress={() => router.push(ROUTES.REALMS)}
              accessibilityRole="button"
              accessibilityLabel={t('realms.cardTitle')}
              className={`${glass} w-full flex-row items-center gap-3 p-4`}
            >
              <View className="min-w-0 flex-1">
                <View className="mb-1 flex-row items-center gap-1.5">
                  <Crown size={13} color={TEAL_300} />
                  <Text className="text-[11px] font-bold uppercase tracking-wider text-teal-300">
                    {t('realms.cardBadge')}
                  </Text>
                </View>
                <Text className="text-lg font-extrabold leading-tight text-white">
                  {t('realms.cardTitle')}
                </Text>
                <Text className="mt-1 text-xs leading-snug text-white/80">
                  {t('realms.cardSubtitle')}
                </Text>
                <View className="mt-2 flex-row items-center gap-1">
                  <Text className="text-sm font-bold text-gold-400">{t('realms.cardCta')}</Text>
                  <ChevronRight size={16} color={GOLD_400} />
                </View>
              </View>
              {/* Mosaic peek at the six realm gems (3×2) */}
              <View className="w-[104px] shrink-0 flex-row flex-wrap gap-1">
                {LIFE_AREA_CATALOG.map((m) => (
                  <Image
                    key={m.key}
                    source={img(m.image)}
                    contentFit="contain"
                    style={{ width: 32, height: 32 }}
                  />
                ))}
              </View>
            </Pressable>
          </View>

          {/* Habit catalog — learn about science-backed habits before adding them */}
          <View className="mb-7">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-xl font-bold text-white">{t('catalog.homeTitle')}</Text>
              <Pressable
                onPress={() => setIsCatalogOpen(true)}
                className="flex-row items-center gap-1"
              >
                <Text className="text-sm font-semibold text-teal-300">{t('catalog.explore')}</Text>
                <ChevronRight size={16} color={TEAL_300} />
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginHorizontal: -16 }}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 4, gap: 12 }}
            >
              {HABIT_CATALOG.slice(0, 8).map((entry) => {
                const Icon = HABIT_ICONS[entry.iconName] || Target;
                const illustration = img(`/catalog/${entry.slug}.png`);
                return (
                  <Pressable
                    key={entry.slug}
                    onPress={() => setCatalogEntry(entry)}
                    className={`${glass} w-[132px] shrink-0 p-3`}
                  >
                    <View className="mb-2 h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-teal-500/10">
                      {illustration ? (
                        <Image
                          source={illustration}
                          contentFit="contain"
                          style={{ width: '100%', height: '100%' }}
                        />
                      ) : (
                        // Fall back to the lucide icon if the illustration is missing.
                        <Icon size={20} color={TEAL_300} />
                      )}
                    </View>
                    <Text
                      numberOfLines={2}
                      className="text-sm font-bold leading-tight text-white"
                    >
                      {(t as (k: string) => string)(`habitCatalog.${entry.slug}.title`)}
                    </Text>
                    <View className="mt-2 flex-row items-center gap-1">
                      <FlaskConical size={12} color={TEAL_300} />
                      <Text className="text-[11px] font-semibold text-teal-300">
                        {t('habitScience.learnMore')}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Today's path */}
          <View>
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-xl font-bold text-white">{t('home.todayPath')}</Text>
              <Pressable
                onPress={() => router.push(ROUTES.HABITS)}
                className="flex-row items-center gap-1"
              >
                <Text className="text-sm font-semibold text-teal-300">{t('home.seeAll')}</Text>
                <ChevronRight size={16} color={TEAL_300} />
              </Pressable>
            </View>

            {todaysHabits.length === 0 ? (
              <View className="items-center py-6">
                <Text className="mb-4 text-center text-sm text-white/70">
                  {t('home.noHabits')}
                </Text>
                <Pressable
                  onPress={() => router.push(ROUTES.HABITS)}
                  accessibilityRole="button"
                  className="rounded-xl bg-teal-500 px-6 py-3 active:bg-teal-600"
                >
                  <Text className="font-semibold text-white">
                    {t('habits.createFirstHabit')}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View className="gap-3">
                {todaysHabits.map((habit, index) => {
                  const Icon = HABIT_ICONS[habit.iconName] || HABIT_ICONS['Target'] || Target;
                  const color = habit.color || HABIT_COLORS[index % HABIT_COLORS.length];
                  const isMeasurable = habit.habitType === 'measurable' && !!habit.dailyGoal;
                  const value = habit.todayValue ?? 0;
                  const goal = habit.dailyGoal ?? 0;
                  const pct = goal > 0 ? Math.min((value / goal) * 100, 100) : 0;
                  const unitLabel = habit.unit
                    ? t(`habits.units.${habit.unit}`, { defaultValue: habit.unit })
                    : '';
                  const subtitle = habit.dailyGoal
                    ? `${goal} ${unitLabel}`.trim()
                    : `+${habit.xp} ${t('progress.xp')}`;

                  return (
                    <Pressable
                      key={habit.id}
                      disabled={!isMeasurable}
                      onPress={() => router.push(ROUTES.HABITS)}
                      className={`${glass} flex-row items-center gap-3 p-3.5`}
                    >
                      {/* Icon */}
                      <View
                        className="h-11 w-11 shrink-0 items-center justify-center rounded-full"
                        style={{ backgroundColor: color }}
                      >
                        <Icon size={20} color="#ffffff" />
                      </View>

                      {/* Name + subtitle */}
                      <View className="min-w-0 flex-1">
                        <Text
                          numberOfLines={1}
                          className="font-semibold leading-tight text-white"
                        >
                          {habit.name}
                        </Text>
                        <Text className="mt-0.5 text-xs text-white/75">{subtitle}</Text>
                      </View>

                      {/* Right side: progress or check */}
                      {isMeasurable ? (
                        <View className="w-28 shrink-0">
                          <Text className="mb-1 text-right text-sm font-semibold text-white">
                            {value}
                            <Text className="text-white/70">
                              {' '}/ {goal} {unitLabel}
                            </Text>
                          </Text>
                          <View className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                            <View
                              className="h-full rounded-full"
                              style={{ width: `${pct}%`, backgroundColor: color }}
                            />
                          </View>
                        </View>
                      ) : (
                        <Pressable
                          onPress={() => {
                            if (habit.completedToday) void uncompleteHabit(habit.id);
                            else void completeHabit(habit.id);
                          }}
                          accessibilityLabel={habit.name}
                          accessibilityState={{ selected: habit.completedToday }}
                          className={`h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                            habit.completedToday
                              ? 'bg-success-500'
                              : 'border border-white/15 bg-white/10'
                          }`}
                        >
                          <Check
                            size={18}
                            strokeWidth={3}
                            color={habit.completedToday ? '#ffffff' : 'rgba(255,255,255,0.4)'}
                          />
                        </Pressable>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Coach Personal — Hermes-powered chat overlay */}
      {isCoachOpen && <CoachChat onClose={() => setIsCoachOpen(false)} />}

      {/* Habit catalog library (browse + learn + create) */}
      {isCatalogOpen && (
        <TemplateLibrary
          onClose={() => setIsCatalogOpen(false)}
          onSelectTemplate={(_data: Partial<HabitFormData>, _template: HabitTemplate) => {
            // Creating from a template requires picking a life area in the form,
            // which lives on the Rituales page. Route there to finish setup.
            setIsCatalogOpen(false);
            router.push(ROUTES.HABITS);
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
            router.push(ROUTES.HABITS);
          }}
        />
      )}

      {/* Level Up celebration (daily-challenge claims award real XP too) */}
      {levelUpLevel !== null && (
        <LevelUpNotification
          level={levelUpLevel}
          type="global"
          pointsReward={calculateGlobalLevelUpReward(levelUpLevel)}
          onClose={() => setLevelUpLevel(null)}
        />
      )}
    </View>
  );
}

export default Dashboard;
