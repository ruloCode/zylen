/**
 * Profile Screen — React Native port of src/pages/Profile.tsx.
 *
 * Default view is an immersive "showcase" profile (identity hero, quote,
 * stats, achievements, tools, about). All the original settings/management UI
 * (edit name/username/avatar, life areas, habits, explore, theme, sign out,
 * danger zone) lives behind the gear button in a full-screen settings sheet
 * (native Modal). Tab screen: content leaves room for the tab bar
 * (paddingBottom: 130).
 */

import React, { useEffect, useState, type ReactNode } from 'react';
import {
  Alert,
  Modal as RNModal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Settings,
  Edit2,
  Save,
  X,
  LogOut,
  User as UserIcon,
  Pencil,
  Trash2,
  Smile,
  ShoppingBag,
  Trophy,
  MessageCircle,
  Flame,
  ChevronRight,
  Compass,
  Gem,
  Clock,
  Target,
  Star,
  Lock,
  NotebookPen,
  Wind,
  Leaf,
  Quote,
  Check,
  type LucideIcon,
  Wand2,
} from 'lucide-react-native';
import toast from '@/lib/toast';
import { supabase } from '@/lib/supabase';
import { useUser, useLifeAreas, useHabits, useStreaks, useAchievements } from '@/store';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useLocale } from '@/hooks/useLocale';
import { useTheme } from '@/hooks/useTheme';
import * as SocialService from '@/services/supabase/social.service';
import {
  ProfileHeader,
  AdvancedStats,
  DangerZone,
  AvatarPicker,
  AvatarCreator,
  ForgeHeroCard,
} from '@/features/profile/components';
import { HabitForm } from '@/features/habits/components';
import { ThemeSelector, ReminderSettings } from '@/features/settings/components';
import { Header } from '@/components/layout';
import { ProgressBar } from '@/components/ui';
import { getIcon } from '@/components/atoms/icons/iconMaps';
import { Habit, HabitFormData } from '@/types';
import type { HabitWithCompletion } from '@/services/supabase/habits.service';
import { ROUTES, AVATARS, THEMES, FEATURES, isCustomAvatar } from '@/constants';
import { img } from '@/assets/registry';
import { getLevelProgress } from '@/utils/xp';
import { cn } from '@/utils';

// Map life area names to translation keys
const lifeAreaTranslationMap: Record<string, string> = {
  Health: 'lifeAreas.health',
  Finance: 'lifeAreas.finance',
  Creativity: 'lifeAreas.creativity',
  Social: 'lifeAreas.social',
  Family: 'lifeAreas.family',
  Career: 'lifeAreas.career',
};

const HERO_BG_SRC = '/hero-bg.png';

// Hero / showcase glass card surface — matches the Dashboard visual language
// (web adds backdrop-blur; unsupported on native).
const GLASS = 'rounded-2xl border border-white/10 bg-[hsl(var(--glass-bg)/0.3)]';

// Settings-sheet card surface (web `.glass-card`).
const GLASS_CARD = 'rounded-2xl border border-white/10 bg-[hsl(var(--glass-bg)/0.65)]';

// Literal icon colors (lucide-react-native needs concrete values)
const WHITE = '#FFFFFF';
const GOLD_300 = 'hsl(42, 95%, 66%)';
const GOLD_400 = 'hsl(40, 95%, 58%)';
const GOLD_600 = 'hsl(34, 92%, 46%)';
const ORANGE_400 = 'hsl(36, 100%, 60%)';
const BLUE_300 = 'hsl(210, 100%, 70%)';
const PURPLE_300 = '#D8B4FE';
const SUCCESS_400 = '#66CB8F';
const RED_400 = '#F56565';

/**
 * 'hsl(240 30% 8%)' → 'hsl(240, 30%, 8%)' (optionally 'hsla(…, a)').
 * RN's color parser needs commas; THEMES swatches use space syntax.
 */
function hsla(value: string, alpha?: number): string {
  const [h, s, l] = value.match(/[\d.]+%?/g) ?? ['0', '0%', '0%'];
  return alpha === undefined
    ? `hsl(${h}, ${s}, ${l})`
    : `hsla(${h}, ${s}, ${l}, ${alpha})`;
}

/** Shift the lightness of an 'hsl(h, s%, l%)' literal by `dl` points. */
function shadeHsl(value: string, dl: number): string {
  const [h, s, l] = (value.match(/[\d.]+/g) ?? ['0', '0', '50']).map(Number);
  return `hsl(${h}, ${s}%, ${Math.max(0, Math.min(100, l + dl))}%)`;
}

export function Profile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { user, updateUserProfile, applyCustomAvatar } = useUser();
  const { signOut } = useAuth();
  const { lifeAreas, toggleLifeAreaEnabled } = useLifeAreas();
  const { habits, deleteHabit, updateHabit } = useHabits();
  const { achievementsWithProgress, loadAchievementsWithProgress } = useAchievements();
  const { theme } = useTheme();

  useEffect(() => {
    void loadAchievementsWithProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const { streak } = useStreaks();
  const { t } = useLocale();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.name || '');
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(
    user?.avatarUrl || AVATARS.RULO
  );
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [isAvatarCreatorOpen, setIsAvatarCreatorOpen] = useState(false);
  const [pickerAvatar, setPickerAvatar] = useState(user?.avatarUrl || AVATARS.RULO);
  const [isEditingHabit, setIsEditingHabit] = useState(false);
  const [habitToEdit, setHabitToEdit] = useState<Habit | undefined>(undefined);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);

  // Load current username from database
  useEffect(() => {
    const loadUsername = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return;

        const { data, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', authUser.id)
          .single();

        if (!error && data) {
          setCurrentUsername(data.username);
        }
      } catch (error) {
        console.error('Error loading username:', error);
      }
    };

    void loadUsername();
  }, []);

  // Web: `if (!user) { navigate(DASHBOARD); return null; }` — on native the
  // navigation must happen in an effect (expo-router).
  useEffect(() => {
    if (!user) router.replace(ROUTES.DASHBOARD);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!user) return null;

  // ── Theme-derived literal colors (icons / gradients can't use CSS vars) ──
  const themeMeta = THEMES.find((th) => th.id === theme) ?? THEMES[0];
  const ACCENT = hsla(themeMeta.swatch.accent);
  const ACCENT_LIGHT = shadeHsl(ACCENT, 10);
  const ACCENT_DARK = shadeHsl(ACCENT, -15);
  const BG = themeMeta.swatch.bg;

  const heroHeight = Math.min(width * 1.2, 520);

  const avatarSource = user.avatarUrl
    ? user.avatarUrl.startsWith('/')
      ? img(user.avatarUrl)
      : { uri: user.avatarUrl }
    : undefined;

  const handleSaveName = () => {
    if (newName.trim().length >= 2) {
      void updateUserProfile(newName.trim(), user.avatarUrl);
      setIsEditingName(false);
    }
  };

  const handleSaveAvatar = () => {
    void updateUserProfile(user.name, selectedAvatar);
    setIsEditingAvatar(false);
  };

  // Avatar picker used by the showcase identity hero (pencil on the avatar).
  const handleSavePickerAvatar = () => {
    void updateUserProfile(user.name, pickerAvatar);
    setIsAvatarPickerOpen(false);
    setSelectedAvatar(pickerAvatar);
    toast.success(t('profile.avatars.saved'));
  };

  // Custom AI avatar creator: the service already uploaded + persisted; here
  // we just sync the store and local UI state (mirrors the web Profile).
  const handleCustomAvatarSaved = (avatarUrl: string, avatarBodyUrl: string) => {
    applyCustomAvatar(avatarUrl, avatarBodyUrl);
    setSelectedAvatar(avatarUrl);
    setPickerAvatar(avatarUrl);
    setIsAvatarCreatorOpen(false);
    toast.success(t('profile.avatarCreator.saved'));
  };

  const handleOpenEditHabit = (habit: HabitWithCompletion) => {
    // Keep EVERY habit field (iconName, habitType, unit, dailyGoal, color,
    // timeOfDay, reminderEnabled...) — building a partial copy here used to
    // degrade measurable/quit habits back to 'check' on save.
    const { completedToday, todayValue, ...rest } = habit;
    void completedToday;
    void todayValue;
    const habitData: Habit = { ...rest, completed: false };
    setHabitToEdit(habitData);
    setIsEditingHabit(true);
  };

  const handleEditHabit = (data: HabitFormData) => {
    if (habitToEdit) {
      void updateHabit(habitToEdit.id, data);
      setIsEditingHabit(false);
      setHabitToEdit(undefined);
    }
  };

  const handleCancelEditHabit = () => {
    setIsEditingHabit(false);
    setHabitToEdit(undefined);
  };

  const handleDeleteHabit = (habit: HabitWithCompletion) => {
    // window.confirm → Alert.alert with a destructive button
    Alert.alert(t('common.delete'), t('profile.deleteHabitConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => void deleteHabit(habit.id),
      },
    ]);
  };

  const handleCheckUsername = async (username: string) => {
    if (username.length < 3 || username.length > 20) {
      setUsernameAvailable(null);
      return;
    }

    setIsCheckingUsername(true);
    try {
      const available = await SocialService.checkUsernameAvailability(username);
      setUsernameAvailable(available);
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameAvailable(null);
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const handleSaveUsername = async () => {
    if (!newUsername || !usernameAvailable) return;

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('User not authenticated');

      await SocialService.updateUsername(authUser.id, newUsername);
      setCurrentUsername(newUsername);
      setIsEditingUsername(false);
      toast.success(t('username.success'));
    } catch (error: any) {
      console.error('Error updating username:', error);
      toast.error(t(error?.code === 'username_taken' ? 'username.taken' : 'username.error'));
    }
  };

  const handleSignOut = async () => {
    try {
      setIsSettingsOpen(false);
      // AuthGate redirects to /welcome once the session is gone
      // (web: window.location.href = '/').
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error(t('errors.general'));
    }
  };

  const selectedAreas = lifeAreas.filter((area) =>
    user.selectedLifeAreas.includes(area.id)
  );

  // ── Derived showcase data ──
  const levelProgress = getLevelProgress(user.totalXPEarned, user.level);

  // Habits completed today (store exposes today's completion via `completedToday`).
  const habitsCompleted = habits.filter((h) => h.completedToday).length;

  // Minutes invested this week. Not historically tracked yet, so we approximate
  // from completed measurable habits whose unit is minutes (logged value, or the
  // daily goal as a proxy). Falls back to 0 when there's nothing to derive.
  const minutesThisWeek = habits.reduce((sum, h) => {
    if (h.completedToday && h.unit === 'min') {
      return sum + (h.todayValue ?? h.dailyGoal ?? 0);
    }
    return sum;
  }, 0);

  // Real achievements from the backend: unlocked first, then in-progress.
  const profileAchievements = [...achievementsWithProgress]
    .sort((a, b) => Number(b.unlocked) - Number(a.unlocked) || b.progress - a.progress)
    .slice(0, 8);

  // Web gradient tones → translucent box classes + literal icon colors.
  const achievementTone: Record<string, { box: string; icon: string }> = {
    gold: { box: 'bg-gold-400/15 border-gold-400/40', icon: GOLD_300 },
    silver: { box: 'bg-white/10 border-white/30', icon: 'rgba(255,255,255,0.8)' },
    bronze: { box: 'bg-orange-400/15 border-orange-400/40', icon: 'hsl(36, 100%, 70%)' },
    platinum: { box: 'bg-blue-400/15 border-blue-400/40', icon: 'hsl(210, 100%, 80%)' },
    locked: { box: 'bg-white/5 border-white/10', icon: 'rgba(255,255,255,0.3)' },
  };

  // Reminders now has a real settings card (ReminderSettings) below.
  const tools: Array<{
    icon: LucideIcon;
    titleKey: string;
    descKey: string;
    box: string;
    color: string;
  }> = [
    {
      icon: NotebookPen,
      titleKey: 'profile.tools.journal',
      descKey: 'profile.tools.journalDesc',
      box: 'bg-success-500/20',
      color: SUCCESS_400,
    },
    {
      icon: Target,
      titleKey: 'profile.tools.goals',
      descKey: 'profile.tools.goalsDesc',
      box: 'bg-[#A855F7]/20',
      color: PURPLE_300,
    },
    {
      icon: Wind,
      titleKey: 'profile.tools.breathing',
      descKey: 'profile.tools.breathingDesc',
      box: 'bg-blue-500/20',
      color: BLUE_300,
    },
  ];

  const comingSoon = () => toast(t('profile.comingSoon'));

  const exploreItems: Array<{ path: string; icon: LucideIcon; label: string }> = [
    { path: ROUTES.MOOD, icon: Smile, label: t('navigation.mood') },
    { path: ROUTES.SHOP, icon: ShoppingBag, label: t('navigation.shop') },
    { path: ROUTES.LEADERBOARD, icon: Trophy, label: t('navigation.leaderboard') },
    { path: ROUTES.CHAT, icon: MessageCircle, label: t('navigation.chat') },
    { path: ROUTES.ROOT_HABIT, icon: Flame, label: t('rootHabit.title') },
    { path: ROUTES.SOCIAL, icon: UserIcon, label: t('navigation.social') },
  ];

  return (
    <View className="flex-1 bg-background">
      <Header />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero background (matches Dashboard) ── */}
        <View
          className="absolute left-0 right-0 top-0 overflow-hidden bg-background"
          style={{ height: heroHeight }}
        >
          <Image
            source={img(HERO_BG_SRC)}
            contentFit="cover"
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <LinearGradient
            colors={[hsla(BG, 0.85), hsla(BG, 0.3), hsla(BG, 0)]}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 224 }}
          />
          <LinearGradient
            colors={[hsla(BG, 0), hsla(BG, 1)]}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 192 }}
          />
        </View>

        {/* ── Foreground ── */}
        <View className="w-full max-w-md self-center px-4 pt-6">
          {/* 1. Header */}
          <View className="mb-6 flex-row items-start justify-between gap-3">
            <View className="min-w-0 flex-1">
              <Text className="text-[28px] font-extrabold leading-tight tracking-tight text-white">
                {t('navigation.profile')}
              </Text>
              <Text className="mt-1.5 text-[15px] font-medium leading-snug text-white/70">
                {t('profile.subtitle')}
              </Text>
              <Text className="text-[15px] font-medium leading-snug text-teal-300">
                {t('profile.subtitle2')}
              </Text>
            </View>
            <Pressable
              onPress={() => setIsSettingsOpen(true)}
              accessibilityRole="button"
              accessibilityLabel={t('profile.settingsTitle')}
              className={cn(GLASS, 'h-11 w-11 shrink-0 items-center justify-center rounded-full')}
            >
              <Settings size={20} color={WHITE} />
            </Pressable>
          </View>

          {/* 2. Identity hero */}
          <View className={cn(GLASS, 'mb-5 items-center p-5')}>
            <View className="relative">
              <LinearGradient
                colors={[ACCENT_LIGHT, ACCENT, ACCENT_DARK]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ width: 120, height: 120, borderRadius: 60, padding: 3 }}
              >
                <View className="h-full w-full items-center justify-center overflow-hidden rounded-full bg-background">
                  {avatarSource ? (
                    <Image
                      source={avatarSource}
                      accessibilityLabel={user.name}
                      contentFit="cover"
                      contentPosition="top"
                      style={{ width: '100%', height: '100%' }}
                    />
                  ) : (
                    <LinearGradient
                      colors={[GOLD_400, GOLD_600]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        width: '100%',
                        height: '100%',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text className="text-4xl font-bold text-white">
                        {user.name.charAt(0).toUpperCase()}
                      </Text>
                    </LinearGradient>
                  )}
                </View>
              </LinearGradient>
              <Pressable
                onPress={() => {
                  setPickerAvatar(user.avatarUrl || AVATARS.RULO);
                  setIsAvatarPickerOpen(true);
                }}
                accessibilityRole="button"
                accessibilityLabel={t('profile.changeAvatar')}
                className="absolute bottom-1 right-1 h-9 w-9 items-center justify-center rounded-full border-2 border-background bg-teal-500 active:bg-teal-600"
              >
                <Pencil size={15} color={WHITE} />
              </Pressable>
            </View>

            <Text className="mt-4 text-2xl font-extrabold text-white">{user.name}</Text>

            <View className="mt-2 flex-row items-center gap-1.5 rounded-full border border-gold-400/30 bg-gold-500/15 px-3 py-1">
              <Gem size={14} color={GOLD_300} />
              <Text className="text-sm font-bold text-gold-300">
                {t('profile.levelLabel', { level: user.level })}
              </Text>
            </View>

            <Pressable
              onPress={() => setIsAvatarCreatorOpen(true)}
              accessibilityRole="button"
              accessibilityLabel={t('profile.avatarCreator.cta')}
              className="mt-4 flex-row items-center gap-2 rounded-full border border-teal-400/40 bg-teal-500/15 px-4 py-2 active:bg-teal-500/25"
            >
              <Wand2 size={15} color="#99F6E4" />
              <Text className="text-sm font-semibold text-teal-200">
                {t('profile.avatarCreator.cta')}
              </Text>
            </Pressable>

            <View className="mt-4 w-full">
              <ProgressBar
                current={levelProgress.current}
                max={levelProgress.max || 1}
                variant="teal"
                showLabel={false}
              />
              <Text className="mt-1 text-right text-xs font-medium text-white/50">
                {levelProgress.current} / {levelProgress.max} {t('common.xp')}
              </Text>
            </View>
          </View>

          {/* 2b. Hero Forge — forge the AI avatar into a 3D arena hero */}
          <ForgeHeroCard className="mb-5" />

          {/* 3. Motivational quote */}
          <View className={cn(GLASS, 'mb-5 flex-row items-start gap-3 p-5')}>
            <Quote
              size={32}
              color={hsla(themeMeta.swatch.accent, 0.6)}
              style={{ marginTop: -4 }}
            />
            <View className="min-w-0 flex-1">
              <Text className="font-semibold leading-snug text-white">
                {t('profile.quote')}
              </Text>
              <Text className="mt-1 font-bold text-teal-300">
                {t('profile.quoteAccent')}
              </Text>
            </View>
          </View>

          {/* 4. Stats grid */}
          <View className={cn(GLASS, 'mb-5 p-4')}>
            <View className="flex-row gap-2">
              <StatCell
                icon={<Flame size={20} color={ORANGE_400} />}
                value={streak?.currentStreak ?? 0}
                label={t('profile.statStreakDays')}
                hint={t('profile.statStreakHint')}
                hintClass="text-teal-300"
              />
              <StatCell
                icon={<Clock size={20} color={PURPLE_300} />}
                value={minutesThisWeek}
                label={t('profile.statMinutes')}
                hint={t('profile.statMinutesHint')}
              />
              <StatCell
                icon={<Gem size={20} color={BLUE_300} />}
                value={user.totalXPEarned}
                label={t('profile.statTotalXp')}
                hint={t('profile.statTotalXpHint')}
              />
              <StatCell
                icon={<Target size={20} color={SUCCESS_400} />}
                value={habitsCompleted}
                label={t('profile.statHabits')}
              />
            </View>
          </View>

          {/* 5. Achievements (real backend data) */}
          <View className={cn(GLASS, 'mb-5 p-4')}>
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-white">
                {t('profile.achievementsTitle')}
              </Text>
              <Pressable
                onPress={() => router.push(ROUTES.LEADERBOARD)}
                accessibilityRole="button"
              >
                <Text className="text-sm font-semibold text-teal-300">
                  {t('profile.seeAll')}
                </Text>
              </Pressable>
            </View>
            {profileAchievements.length === 0 ? (
              <Text className="py-3 text-center text-sm text-white/50">
                {t('profile.locked')}
              </Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12, paddingBottom: 4 }}
              >
                {profileAchievements.map((ach) => {
                  const AchIcon = getIcon(ach.iconName, Star);
                  const tone = ach.unlocked
                    ? achievementTone[ach.tier] ?? achievementTone.gold
                    : achievementTone.locked;
                  const achImage = ach.unlocked
                    ? img(`/achievements/${ach.key}.png`)
                    : undefined;
                  return (
                    <View key={ach.id} className="w-[88px] items-center">
                      <View
                        className={cn(
                          'h-16 w-16 items-center justify-center overflow-hidden rounded-2xl',
                          (!ach.unlocked || !achImage) && cn('border', tone.box)
                        )}
                      >
                        {ach.unlocked ? (
                          achImage ? (
                            <Image
                              source={achImage}
                              contentFit="contain"
                              style={{ width: '100%', height: '100%' }}
                            />
                          ) : (
                            <AchIcon size={26} color={tone.icon} />
                          )
                        ) : (
                          <Lock size={22} color={tone.icon} />
                        )}
                      </View>
                      <Text className="mt-2 text-center text-[11px] font-semibold leading-tight text-white/90">
                        {t(`achievements.list.${ach.key}.name`, { defaultValue: ach.name })}
                      </Text>
                      <Text className="mt-0.5 text-[10px] text-white/40">
                        {ach.unlocked && ach.unlockedAt
                          ? new Date(ach.unlockedAt).toLocaleDateString()
                          : `${Math.round(ach.progress)}%`}
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>

          {/* 6. Tools — coming-soon placeholders, hidden for the store release */}
          {FEATURES.enableProfileTools ? (
          <View className={cn(GLASS, 'mb-5 p-4')}>
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-white">{t('profile.toolsTitle')}</Text>
              <Pressable onPress={comingSoon} accessibilityRole="button">
                <Text className="text-sm font-semibold text-teal-300">
                  {t('profile.seeAllTools')}
                </Text>
              </Pressable>
            </View>
            <View className="gap-2.5">
              {tools.map(({ icon: ToolIcon, titleKey, descKey, box, color }) => (
                <Pressable
                  key={titleKey}
                  onPress={comingSoon}
                  accessibilityRole="button"
                  className="w-full flex-row items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-2.5 active:bg-white/[0.08]"
                >
                  <View
                    className={cn(
                      'h-11 w-11 shrink-0 items-center justify-center rounded-full',
                      box
                    )}
                  >
                    <ToolIcon size={20} color={color} />
                  </View>
                  <View className="min-w-0 flex-1">
                    <Text className="text-sm font-semibold leading-tight text-white">
                      {t(titleKey)}
                    </Text>
                    <Text className="mt-0.5 text-xs text-white/55" numberOfLines={1}>
                      {t(descKey)}
                    </Text>
                  </View>
                  <ChevronRight size={18} color="rgba(255,255,255,0.3)" />
                </Pressable>
              ))}
            </View>
          </View>
          ) : null}

          {/* Habit reminders (local notifications) */}
          <ReminderSettings />

          {/* 7. About me */}
          <View className={cn(GLASS, 'mb-2 p-5')}>
            <View className="mb-3 flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Leaf size={18} color={SUCCESS_400} />
                <Text className="text-lg font-bold text-white">
                  {t('profile.aboutTitle')}
                </Text>
              </View>
              {FEATURES.enableProfileTools ? (
                <Pressable
                  onPress={comingSoon}
                  accessibilityRole="button"
                  accessibilityLabel={t('common.edit')}
                  className="h-8 w-8 items-center justify-center rounded-full bg-white/10 active:bg-white/20"
                >
                  <Pencil size={14} color="rgba(255,255,255,0.7)" />
                </Pressable>
              ) : null}
            </View>
            <Text className="text-sm leading-relaxed text-white/70">
              {t('profile.aboutDefault')}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ── Avatar picker sheet (showcase hero) ── */}
      <RNModal
        transparent
        visible={isAvatarPickerOpen}
        animationType="fade"
        onRequestClose={() => setIsAvatarPickerOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/60 p-4">
          <View className="w-full max-w-md self-center rounded-2xl border border-white/10 bg-[hsl(var(--glass-bg)/0.95)] p-5">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-white">
                {t('profile.avatars.pickTitle')}
              </Text>
              <Pressable
                onPress={() => setIsAvatarPickerOpen(false)}
                accessibilityRole="button"
                accessibilityLabel={t('common.cancel')}
                className="h-8 w-8 items-center justify-center rounded-full bg-white/10 active:bg-white/20"
              >
                <X size={18} color={WHITE} />
              </Pressable>
            </View>
            <AvatarPicker
              value={pickerAvatar}
              onChange={setPickerAvatar}
              customAvatarUrl={isCustomAvatar(user.avatarUrl) ? user.avatarUrl : undefined}
              onCreateCustom={() => {
                setIsAvatarPickerOpen(false);
                setIsAvatarCreatorOpen(true);
              }}
            />
            <Pressable
              onPress={handleSavePickerAvatar}
              accessibilityRole="button"
              className="mt-5 w-full items-center rounded-xl bg-teal-500 py-3 active:bg-teal-600"
            >
              <Text className="font-semibold text-white">{t('profile.avatars.save')}</Text>
            </Pressable>
          </View>
        </View>
      </RNModal>

      {/* ── AI avatar creator (photo → chibi hero via Edge Function) ── */}
      {isAvatarCreatorOpen && user ? (
        <AvatarCreator
          gender={user.gender}
          onClose={() => setIsAvatarCreatorOpen(false)}
          onSaved={handleCustomAvatarSaved}
        />
      ) : null}

      {/* ── Settings sheet (full original settings UI, gear-triggered) ── */}
      <RNModal
        visible={isSettingsOpen}
        animationType="slide"
        onRequestClose={() => setIsSettingsOpen(false)}
      >
        <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
          {/* Sheet header */}
          <View className="flex-row items-center justify-between px-4 py-3">
            <View className="flex-row items-center gap-2">
              <Settings size={22} color={WHITE} />
              <Text className="text-xl font-bold text-white">
                {t('profile.settingsTitle')}
              </Text>
            </View>
            <Pressable
              onPress={() => setIsSettingsOpen(false)}
              accessibilityRole="button"
              accessibilityLabel={t('common.cancel')}
              className="h-10 w-10 items-center justify-center rounded-full bg-white/10 active:bg-white/20"
            >
              <X size={20} color={WHITE} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingBottom: 96 + insets.bottom,
            }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="gap-4">
              {/* Profile Header + Stats */}
              <ProfileHeader user={user} />
              <AdvancedStats />

              {/* Edit Name Section */}
              <View className={cn(GLASS_CARD, 'p-4')}>
                <View className="mb-4 flex-row items-center gap-2">
                  <Edit2 size={20} color={WHITE} />
                  <Text className="text-lg font-bold text-white">
                    {t('profile.editProfile')}
                  </Text>
                </View>

                {isEditingName ? (
                  <View className="flex-row gap-2">
                    <TextInput
                      value={newName}
                      onChangeText={setNewName}
                      autoFocus
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      className="flex-1 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white"
                    />
                    <Pressable
                      onPress={handleSaveName}
                      accessibilityRole="button"
                      accessibilityLabel={t('actions.save')}
                      className="items-center justify-center rounded-lg bg-teal-500 px-3 active:bg-teal-600"
                    >
                      <Save size={18} color={WHITE} />
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        setNewName(user.name);
                        setIsEditingName(false);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={t('common.cancel')}
                      className="items-center justify-center rounded-lg bg-white/10 px-3 active:bg-white/20"
                    >
                      <X size={18} color={WHITE} />
                    </Pressable>
                  </View>
                ) : (
                  <View className="flex-row items-center justify-between">
                    <View className="min-w-0 flex-1">
                      <Text className="text-sm text-white/70">{t('profile.nameLabel')}</Text>
                      <Text className="font-semibold text-white">{user.name}</Text>
                    </View>
                    <Pressable
                      onPress={() => setIsEditingName(true)}
                      accessibilityRole="button"
                      accessibilityLabel={t('common.edit')}
                      className="items-center justify-center rounded-lg border border-white/20 bg-white/10 p-2 active:bg-white/20"
                    >
                      <Edit2 size={18} color={WHITE} />
                    </Pressable>
                  </View>
                )}
              </View>

              {/* Username Section */}
              <View className={cn(GLASS_CARD, 'p-4')}>
                <View className="mb-4 flex-row items-center gap-2">
                  <UserIcon size={20} color={WHITE} />
                  <Text className="text-lg font-bold text-white">{t('username.title')}</Text>
                </View>

                {isEditingUsername ? (
                  <View className="gap-3">
                    <TextInput
                      value={newUsername}
                      onChangeText={(text) => {
                        setNewUsername(text);
                        void handleCheckUsername(text);
                      }}
                      placeholder={t('username.placeholder')}
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      autoFocus
                      autoCapitalize="none"
                      autoCorrect={false}
                      maxLength={20}
                      className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white"
                    />
                    {isCheckingUsername && (
                      <Text className="text-sm text-teal-400">{t('username.checking')}</Text>
                    )}
                    {!isCheckingUsername && usernameAvailable === true && (
                      <Text className="text-sm text-success-400">
                        {t('username.available')}
                      </Text>
                    )}
                    {!isCheckingUsername && usernameAvailable === false && (
                      <Text className="text-sm text-danger-400">{t('username.taken')}</Text>
                    )}
                    <View className="flex-row gap-2">
                      <Pressable
                        onPress={() => void handleSaveUsername()}
                        disabled={!usernameAvailable}
                        accessibilityRole="button"
                        accessibilityLabel={t('actions.save')}
                        className={cn(
                          'items-center justify-center rounded-lg bg-teal-500 p-2 px-3 active:bg-teal-600',
                          !usernameAvailable && 'opacity-50'
                        )}
                      >
                        <Save size={18} color={WHITE} />
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          setNewUsername('');
                          setUsernameAvailable(null);
                          setIsEditingUsername(false);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={t('common.cancel')}
                        className="items-center justify-center rounded-lg bg-white/10 p-2 px-3 active:bg-white/20"
                      >
                        <X size={18} color={WHITE} />
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View className="flex-row items-center justify-between">
                    <View className="min-w-0 flex-1">
                      <Text className="text-sm text-white/70">{t('username.title')}</Text>
                      <Text className="font-semibold text-white">
                        {currentUsername ? `@${currentUsername}` : t('username.choose')}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => {
                        setNewUsername(currentUsername || '');
                        setIsEditingUsername(true);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={t('common.edit')}
                      className="items-center justify-center rounded-lg border border-white/20 bg-white/10 p-2 active:bg-white/20"
                    >
                      <Edit2 size={18} color={WHITE} />
                    </Pressable>
                  </View>
                )}
              </View>

              {/* Avatar Selection Section */}
              <View className={cn(GLASS_CARD, 'p-4')}>
                <View className="mb-4 flex-row items-center gap-2">
                  <Edit2 size={20} color={WHITE} />
                  <Text className="text-lg font-bold text-white">
                    {t('profile.changeAvatar')}
                  </Text>
                </View>

                {isEditingAvatar ? (
                  <View>
                    <View className="mb-4 flex-row gap-3">
                      {/* Rulo Avatar (Male) / Dani Avatar (Female) */}
                      {(
                        [
                          { url: AVATARS.RULO, label: t('profile.avatarMale'), alt: 'Rulo' },
                          { url: AVATARS.DANI, label: t('profile.avatarFemale'), alt: 'Dani' },
                        ] as const
                      ).map((option) => {
                        const isSelected = selectedAvatar === option.url;
                        return (
                          <Pressable
                            key={option.alt}
                            onPress={() => setSelectedAvatar(option.url)}
                            accessibilityRole="button"
                            accessibilityState={{ selected: isSelected }}
                            className={cn(
                              'relative flex-1 rounded-xl border-2 p-4',
                              isSelected
                                ? 'border-gold-400 bg-gold-400/10'
                                : 'border-white/20 bg-white/5'
                            )}
                          >
                            <View className="items-center gap-3">
                              <View
                                className={cn(
                                  'h-20 w-20 overflow-hidden rounded-full border-2',
                                  isSelected ? 'border-gold-400' : 'border-white/20'
                                )}
                              >
                                <Image
                                  source={img(option.url)}
                                  accessibilityLabel={option.alt}
                                  contentFit="cover"
                                  style={{ width: '100%', height: '100%' }}
                                />
                              </View>
                              <Text
                                className={cn(
                                  'text-sm font-medium',
                                  isSelected ? 'text-gold-400' : 'text-white'
                                )}
                              >
                                {option.label}
                              </Text>
                            </View>
                            {isSelected && (
                              <View className="absolute right-2 top-2 h-6 w-6 items-center justify-center rounded-full bg-gold-400">
                                <Check size={16} strokeWidth={3} color={WHITE} />
                              </View>
                            )}
                          </Pressable>
                        );
                      })}
                    </View>

                    <View className="flex-row gap-2">
                      <Pressable
                        onPress={handleSaveAvatar}
                        accessibilityRole="button"
                        accessibilityLabel={t('actions.save')}
                        className="flex-1 flex-row items-center justify-center gap-2 rounded-lg bg-teal-500 p-2 active:bg-teal-600"
                      >
                        <Save size={18} color={WHITE} />
                        <Text className="font-semibold text-white">{t('actions.save')}</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          setSelectedAvatar(user.avatarUrl || AVATARS.RULO);
                          setIsEditingAvatar(false);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={t('common.cancel')}
                        className="items-center justify-center rounded-lg bg-white/10 p-2 px-3 active:bg-white/20"
                      >
                        <X size={18} color={WHITE} />
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View className="flex-row items-center justify-between">
                    <View className="min-w-0 flex-1 flex-row items-center gap-4">
                      <View className="h-16 w-16 overflow-hidden rounded-full border-2 border-white/20">
                        {avatarSource ? (
                          <Image
                            source={avatarSource}
                            accessibilityLabel={user.name}
                            contentFit="cover"
                            style={{ width: '100%', height: '100%' }}
                          />
                        ) : (
                          <LinearGradient
                            colors={[GOLD_400, GOLD_600]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{
                              width: '100%',
                              height: '100%',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Text className="text-2xl font-bold text-white">
                              {user.name.charAt(0).toUpperCase()}
                            </Text>
                          </LinearGradient>
                        )}
                      </View>
                      <View className="min-w-0 flex-1">
                        <Text className="text-sm text-white/70">
                          {t('profile.avatarLabel')}
                        </Text>
                        <Text className="font-semibold text-white">
                          {user.avatarUrl === AVATARS.RULO
                            ? t('profile.avatarMale')
                            : user.avatarUrl === AVATARS.DANI
                            ? t('profile.avatarFemale')
                            : '-'}
                        </Text>
                      </View>
                    </View>
                    <Pressable
                      onPress={() => setIsEditingAvatar(true)}
                      accessibilityRole="button"
                      accessibilityLabel={t('common.edit')}
                      className="items-center justify-center rounded-lg border border-white/20 bg-white/10 p-2 active:bg-white/20"
                    >
                      <Edit2 size={18} color={WHITE} />
                    </Pressable>
                  </View>
                )}
              </View>

              {/* Life Areas Section */}
              <View className={cn(GLASS_CARD, 'p-4')}>
                <Text className="mb-4 text-lg font-bold text-white">
                  {t('profile.lifeAreasTitle')}
                </Text>

                <View className="gap-3">
                  {lifeAreas.map((area) => {
                    // Get translated name or use original if not in map
                    const translationKey =
                      typeof area.area === 'string'
                        ? lifeAreaTranslationMap[area.area]
                        : undefined;
                    const areaName = translationKey ? t(translationKey) : area.area;

                    return (
                      <View
                        key={area.id}
                        className="flex-row items-center justify-between rounded-lg border border-white/20 bg-white/5 p-3"
                      >
                        <View className="min-w-0 flex-1">
                          <Text className="font-semibold text-white">{areaName}</Text>
                          <Text className="text-sm text-white/70">
                            {t('common.level')} {area.level} • {area.totalXP}{' '}
                            {t('common.xp')}
                          </Text>
                        </View>
                        <Switch
                          value={area.enabled}
                          onValueChange={(checked) =>
                            void toggleLifeAreaEnabled(area.id, checked)
                          }
                          disabled={
                            area.isCustom === false &&
                            !area.enabled &&
                            selectedAreas.length <= 1
                          }
                          trackColor={{ false: 'rgba(255,255,255,0.2)', true: ACCENT }}
                          thumbColor={WHITE}
                        />
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Habits Section */}
              <View className={cn(GLASS_CARD, 'p-4')}>
                <Text className="mb-4 text-lg font-bold text-white">
                  {t('profile.habitsTitle')}
                </Text>

                <View className="gap-3">
                  {habits.length === 0 ? (
                    <Text className="py-6 text-center text-white/70">
                      {t('profile.noHabits')}
                    </Text>
                  ) : (
                    habits.map((habit) => {
                      const area = lifeAreas.find((a) => a.id === habit.lifeArea);
                      // Get translated area name or use original if not in map
                      const translationKey =
                        area && typeof area.area === 'string'
                          ? lifeAreaTranslationMap[area.area]
                          : undefined;
                      const areaName = area
                        ? translationKey
                          ? t(translationKey)
                          : area.area
                        : t('common.noArea');

                      return (
                        <View
                          key={habit.id}
                          className="flex-row items-center justify-between rounded-lg border border-white/20 bg-white/5 p-3"
                        >
                          <View className="mr-2 min-w-0 flex-1">
                            <Text className="font-semibold text-white" numberOfLines={1}>
                              {habit.name}
                            </Text>
                            <Text className="text-sm text-white/70">
                              {habit.xp} {t('common.xp')} • {habit.points}{' '}
                              {t('common.pts')} • {areaName}
                            </Text>
                          </View>
                          <View className="flex-row gap-2">
                            <Pressable
                              onPress={() => handleOpenEditHabit(habit)}
                              accessibilityRole="button"
                              accessibilityLabel={t('common.edit')}
                              className="items-center justify-center rounded-lg border border-teal-400/50 bg-teal-500/20 p-2 active:bg-teal-500/30"
                            >
                              <Pencil size={18} color={ACCENT} />
                            </Pressable>
                            <Pressable
                              onPress={() => handleDeleteHabit(habit)}
                              accessibilityRole="button"
                              accessibilityLabel={t('common.delete')}
                              className="items-center justify-center rounded-lg border border-danger-400/50 bg-danger-500/20 p-2 active:bg-danger-500/30"
                            >
                              <Trash2 size={18} color={RED_400} />
                            </Pressable>
                          </View>
                        </View>
                      );
                    })
                  )}
                </View>
              </View>

              {/* Explore Section — entry points not in the bottom nav */}
              <View className={cn(GLASS_CARD, 'p-4')}>
                <View className="mb-4 flex-row items-center gap-2">
                  <Compass size={20} color={WHITE} />
                  <Text className="text-lg font-bold text-white">
                    {t('profile.exploreTitle')}
                  </Text>
                </View>
                <View className="flex-row flex-wrap gap-3">
                  {exploreItems.map(({ path, icon: ExploreIcon, label }) => (
                    <Pressable
                      key={path}
                      onPress={() => {
                        setIsSettingsOpen(false);
                        router.push(path as never);
                      }}
                      accessibilityRole="button"
                      className="w-[47%] flex-row items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-3 active:bg-white/10"
                    >
                      <ExploreIcon size={18} color={ACCENT} />
                      <Text
                        className="flex-1 text-sm font-semibold text-white"
                        numberOfLines={1}
                      >
                        {label}
                      </Text>
                      <ChevronRight size={16} color="rgba(255,255,255,0.3)" />
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Settings Section */}
              <View className={cn(GLASS_CARD, 'p-4')}>
                <View className="mb-4 flex-row items-center gap-2">
                  <Settings size={20} color={WHITE} />
                  <Text className="text-lg font-bold text-white">
                    {t('profile.settingsTitle')}
                  </Text>
                </View>

                <View className="gap-4">
                  {/* Theme Selector */}
                  <View>
                    <Text className="mb-3 text-sm font-semibold text-white/90">
                      {t('themes.title')}
                    </Text>
                    <ThemeSelector variant="grid" />
                  </View>

                  <View className="border-t border-white/10 pt-2">
                    <Text className="text-sm text-white/70">
                      {t('profile.languageHint')}
                    </Text>
                  </View>

                  {/* Sign Out Button */}
                  <View className="border-t border-white/20 pt-4">
                    <Pressable
                      onPress={() => void handleSignOut()}
                      accessibilityRole="button"
                      accessibilityLabel={t('auth.signOut')}
                      className="w-full flex-row items-center justify-center gap-2 rounded-lg border border-danger-500/50 bg-danger-500/20 px-4 py-3 active:bg-danger-500/30"
                    >
                      <LogOut size={18} color={RED_400} />
                      <Text className="font-semibold text-danger-400">
                        {t('auth.signOut')}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>

              {/* Danger Zone */}
              <DangerZone />
            </View>
          </ScrollView>
        </View>
      </RNModal>

      {/* Habit Edit Modal */}
      {isEditingHabit && habitToEdit && (
        <HabitForm
          habit={habitToEdit}
          onSubmit={handleEditHabit}
          onCancel={handleCancelEditHabit}
        />
      )}
    </View>
  );
}

/** A single cell in the showcase stats grid. */
function StatCell({
  icon,
  value,
  label,
  hint,
  hintClass = 'text-white/40',
}: {
  icon: ReactNode;
  value: number;
  label: string;
  hint?: string;
  hintClass?: string;
}) {
  return (
    <View className="flex-1 items-center">
      {icon}
      <Text className="mt-1.5 text-xl font-extrabold leading-none text-white">
        {value.toLocaleString()}
      </Text>
      <Text className="mt-1 text-center text-[10px] font-medium leading-tight text-white/60">
        {label}
      </Text>
      {hint && (
        <Text className={cn('mt-0.5 text-center text-[9px] font-medium', hintClass)}>
          {hint}
        </Text>
      )}
    </View>
  );
}

export default Profile;
