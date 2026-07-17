import { useState, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Mountain,
  Lock,
  NotebookPen,
  Bell,
  Wind,
  Leaf,
  Quote,
  Wand2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import * as LucideIcons from 'lucide-react';
import { useUser, useLifeAreas, useHabits, useStreaks, useAchievements } from '@/store';
import { useLocale } from '@/hooks/useLocale';
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
import { ProgressBar } from '@/components/ui';
import { Habit, HabitFormData } from '@/types';
import type { HabitWithCompletion } from '@/services/supabase/habits.service';
import { ROUTES, AVATARS, isCustomAvatar } from '@/constants';
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

// Hero / showcase glass card surface — matches the Dashboard visual language.
const GLASS =
  'bg-[hsl(var(--glass-bg)/0.3)] backdrop-blur-md border border-white/10 rounded-2xl shadow-soft';

/**
 * Profile Page
 *
 * Default view is an immersive "showcase" profile (identity hero, quote, stats,
 * achievements, tools, about). All the original settings/management UI (edit
 * name/username/avatar, life areas, habits, explore, theme, sign out, danger
 * zone) lives verbatim behind the gear button in a full-screen settings sheet.
 */
export function Profile() {
  const navigate = useNavigate();
  const { user, updateUserProfile, applyCustomAvatar } = useUser();
  const { lifeAreas, toggleLifeAreaEnabled } = useLifeAreas();
  const { habits, deleteHabit, updateHabit } = useHabits();
  const { achievementsWithProgress, loadAchievementsWithProgress } = useAchievements();

  useEffect(() => {
    loadAchievementsWithProgress();
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
  const [pickerAvatar, setPickerAvatar] = useState(user?.avatarUrl || AVATARS.RULO);
  const [isAvatarCreatorOpen, setIsAvatarCreatorOpen] = useState(false);
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

    loadUsername();
  }, []);

  if (!user) {
    navigate(ROUTES.DASHBOARD);
    return null;
  }

  const handleSaveName = () => {
    if (newName.trim().length >= 2) {
      updateUserProfile(newName.trim(), user.avatarUrl);
      setIsEditingName(false);
    }
  };

  const handleSaveAvatar = () => {
    updateUserProfile(user.name, selectedAvatar);
    setIsEditingAvatar(false);
  };

  // Avatar picker used by the showcase identity hero (pencil on the avatar).
  const handleSavePickerAvatar = () => {
    updateUserProfile(user.name, pickerAvatar);
    setIsAvatarPickerOpen(false);
    setSelectedAvatar(pickerAvatar);
    toast.success(t('profile.avatars.saved'));
  };

  // AI avatar creator: AvatarService.save already persisted the URLs in the
  // profile — just sync the store and local picker state.
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
      updateHabit(habitToEdit.id, data);
      setIsEditingHabit(false);
      setHabitToEdit(undefined);
    }
  };

  const handleCancelEditHabit = () => {
    setIsEditingHabit(false);
    setHabitToEdit(undefined);
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
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      // Redirect to root (which will redirect to login)
      window.location.href = '/';
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

  const achievementTone: Record<string, string> = {
    gold: 'from-gold-400/30 to-gold-600/10 border-gold-400/40 text-gold-300',
    silver: 'from-white/20 to-white/5 border-white/30 text-white/80',
    bronze: 'from-orange-400/25 to-orange-600/10 border-orange-400/40 text-orange-300',
    platinum: 'from-blue-400/30 to-blue-600/10 border-blue-400/40 text-blue-200',
    locked: 'from-white/[0.04] to-white/[0.02] border-white/10 text-white/30',
  };

  // Reminders now has a real settings card (ReminderSettings) below.
  const tools = [
    { icon: NotebookPen, titleKey: 'profile.tools.journal', descKey: 'profile.tools.journalDesc', tone: 'bg-success-500/20 text-success-400' },
    { icon: Target, titleKey: 'profile.tools.goals', descKey: 'profile.tools.goalsDesc', tone: 'bg-purple-500/20 text-purple-300' },
    { icon: Wind, titleKey: 'profile.tools.breathing', descKey: 'profile.tools.breathingDesc', tone: 'bg-blue-500/20 text-blue-300' },
  ] as const;

  const comingSoon = () => toast(t('profile.comingSoon'));

  return (
    <div className="relative min-h-screen pb-28">
      {/* ── Hero background (matches Dashboard) ── */}
      <div className="absolute top-0 left-0 right-0 h-[120vw] max-h-[520px] -z-0 bg-[hsl(var(--background))] overflow-hidden">
        <img
          src={HERO_BG_SRC}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-[hsl(var(--background))]/85 via-[hsl(var(--background))]/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-[hsl(var(--background))]" />
      </div>

      {/* ── Foreground ── */}
      <div className="relative z-10 max-w-md mx-auto px-4 pt-[calc(env(safe-area-inset-top)+1.5rem)] animate-page-in">
        {/* 1. Header */}
        <header className="flex items-start justify-between gap-3 mb-6">
          <div className="min-w-0">
            <h1 className="font-sans normal-case text-[26px] leading-tight font-extrabold text-white tracking-tight">
              {t('navigation.profile')}
            </h1>
            <p className="text-white/70 text-[15px] font-medium mt-1.5 leading-snug">
              {t('profile.subtitle')}
            </p>
            <p className="text-teal-300 text-[15px] font-medium leading-snug">
              {t('profile.subtitle2')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            aria-label={t('profile.settingsTitle')}
            className="shrink-0 w-11 h-11 rounded-full glass-card flex items-center justify-center text-white"
          >
            <Settings size={20} />
          </button>
        </header>

        {/* 2. Identity hero */}
        <section className={`${GLASS} p-5 mb-5 flex flex-col items-center text-center`}>
          <div className="relative">
            <div className="w-[120px] h-[120px] rounded-full p-[3px] bg-gradient-to-br from-teal-300 via-teal-500 to-teal-700">
              <div className="w-full h-full rounded-full overflow-hidden bg-[hsl(var(--background))]">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
                    <span className="text-4xl font-bold text-white">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setPickerAvatar(user.avatarUrl || AVATARS.RULO);
                setIsAvatarPickerOpen(true);
              }}
              aria-label={t('profile.changeAvatar')}
              className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-teal-500 text-white border-2 border-[hsl(var(--background))] flex items-center justify-center shadow-soft hover:bg-teal-600 transition-colors"
            >
              <Pencil size={15} />
            </button>
          </div>

          <h2 className="mt-4 text-2xl font-extrabold text-white">{user.name}</h2>

          <span className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-500/15 border border-gold-400/30 text-gold-300 text-sm font-bold">
            <Gem size={14} />
            {t('profile.levelLabel', { level: user.level })}
          </span>

          <button
            type="button"
            onClick={() => setIsAvatarCreatorOpen(true)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/15 border border-teal-400/40 text-teal-200 text-sm font-semibold hover:bg-teal-500/25 transition-colors"
          >
            <Wand2 size={15} />
            {t('profile.avatarCreator.cta')}
          </button>

          <div className="w-full mt-4">
            <ProgressBar
              current={levelProgress.current}
              max={levelProgress.max || 1}
              variant="teal"
              showLabel={false}
            />
            <p className="text-right text-white/50 text-xs mt-1 font-medium">
              {levelProgress.current} / {levelProgress.max} {t('common.xp')}
            </p>
          </div>
        </section>

        {/* 2b. Hero Forge — forge the AI avatar into the 3D arena hero */}
        <ForgeHeroCard className="mb-5" />

        {/* 3. Motivational quote */}
        <section className={`${GLASS} p-5 mb-5 flex items-start gap-3`}>
          <Quote size={32} className="text-teal-400/60 shrink-0 -mt-1" />
          <div className="min-w-0">
            <p className="text-white font-semibold leading-snug">{t('profile.quote')}</p>
            <p className="text-teal-300 font-bold mt-1">{t('profile.quoteAccent')}</p>
          </div>
        </section>

        {/* 4. Stats grid */}
        <section className={`${GLASS} p-4 mb-5`}>
          <div className="grid grid-cols-4 gap-2">
            <StatCell
              icon={<Flame size={20} className="text-orange-400" />}
              value={streak?.currentStreak ?? 0}
              label={t('progress.streakChip', { count: streak?.currentStreak ?? 0 })}
              hint={t('profile.statStreakHint')}
              hintClass="text-teal-300"
            />
            <StatCell
              icon={<Clock size={20} className="text-purple-300" />}
              value={minutesThisWeek}
              label={t('profile.statMinutes')}
              hint={t('profile.statMinutesHint')}
            />
            <StatCell
              icon={<Gem size={20} className="text-blue-300" />}
              value={user.totalXPEarned}
              label={t('profile.statTotalXp')}
              hint={t('profile.statTotalXpHint')}
            />
            <StatCell
              icon={<Target size={20} className="text-success-400" />}
              value={habitsCompleted}
              label={t('profile.statHabits')}
            />
          </div>
        </section>

        {/* 5. Achievements (real backend data) */}
        <section className={`${GLASS} p-4 mb-5`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">{t('profile.achievementsTitle')}</h3>
            <button
              type="button"
              onClick={() => navigate(ROUTES.LEADERBOARD)}
              className="text-teal-300 text-sm font-semibold"
            >
              {t('profile.seeAll')}
            </button>
          </div>
          {profileAchievements.length === 0 ? (
            <p className="text-white/50 text-sm text-center py-3">{t('profile.locked')}</p>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
              {profileAchievements.map((ach) => {
                const Icon =
                  ((LucideIcons as Record<string, unknown>)[ach.iconName] as typeof Star) || Star;
                const tone = ach.unlocked ? achievementTone[ach.tier] ?? achievementTone.gold : achievementTone.locked;
                return (
                  <div key={ach.id} className="shrink-0 w-[88px] flex flex-col items-center text-center">
                    <div
                      className={cn(
                        'w-16 h-16 rounded-2xl flex items-center justify-center relative overflow-hidden',
                        ach.unlocked ? '' : cn('bg-gradient-to-br border', tone)
                      )}
                    >
                      {ach.unlocked ? (
                        <>
                          <img
                            src={`/achievements/${ach.key}.png`}
                            alt=""
                            aria-hidden="true"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              const img = e.currentTarget;
                              img.style.display = 'none';
                              const fb = img.nextElementSibling as HTMLElement | null;
                              if (fb) fb.style.display = 'flex';
                            }}
                          />
                          <span className={cn('absolute inset-0 rounded-2xl bg-gradient-to-br border hidden items-center justify-center', tone)}>
                            <Icon size={26} />
                          </span>
                        </>
                      ) : (
                        <Lock size={22} />
                      )}
                    </div>
                    <p className="mt-2 text-[11px] font-semibold text-white/90 leading-tight">
                      {t(`achievements.list.${ach.key}.name` as any, { defaultValue: ach.name })}
                    </p>
                    <p className="text-[10px] text-white/40 mt-0.5">
                      {ach.unlocked && ach.unlockedAt
                        ? new Date(ach.unlockedAt).toLocaleDateString()
                        : `${Math.round(ach.progress)}%`}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 6. Tools */}
        <section className={`${GLASS} p-4 mb-5`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">{t('profile.toolsTitle')}</h3>
            <button
              type="button"
              onClick={comingSoon}
              className="text-teal-300 text-sm font-semibold"
            >
              {t('profile.seeAllTools')}
            </button>
          </div>
          <div className="space-y-2.5">
            {tools.map(({ icon: Icon, titleKey, descKey, tone }) => (
              <button
                key={titleKey}
                type="button"
                onClick={comingSoon}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-left transition-colors"
              >
                <span className={cn('shrink-0 w-11 h-11 rounded-full flex items-center justify-center', tone)}>
                  <Icon size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-white font-semibold text-sm leading-tight">
                    {t(titleKey as any)}
                  </span>
                  <span className="block text-white/55 text-xs mt-0.5 truncate">
                    {t(descKey as any)}
                  </span>
                </span>
                <ChevronRight size={18} className="text-white/30 shrink-0" />
              </button>
            ))}
          </div>
        </section>

        {/* Habit reminders (local notifications) */}
        <ReminderSettings />

        {/* 7. About me */}
        <section className={`${GLASS} p-5 mb-2`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Leaf size={18} className="text-success-400" />
              <h3 className="text-lg font-bold text-white">{t('profile.aboutTitle')}</h3>
            </div>
            <button
              type="button"
              onClick={comingSoon}
              aria-label={t('common.edit')}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 transition-colors"
            >
              <Pencil size={14} />
            </button>
          </div>
          <p className="text-white/70 text-sm leading-relaxed">{t('profile.aboutDefault')}</p>
        </section>
      </div>

      {/* ── Avatar picker sheet (showcase hero) ── */}
      {isAvatarPickerOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">{t('profile.avatars.pickTitle')}</h3>
              <button
                type="button"
                onClick={() => setIsAvatarPickerOpen(false)}
                aria-label={t('common.cancel')}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X size={18} />
              </button>
            </div>
            <AvatarPicker
              value={pickerAvatar}
              onChange={setPickerAvatar}
              customAvatarUrl={
                isCustomAvatar(user.avatarUrl) ? user.avatarUrl : undefined
              }
              onCreateCustom={() => {
                setIsAvatarPickerOpen(false);
                setIsAvatarCreatorOpen(true);
              }}
            />
            <button
              type="button"
              onClick={handleSavePickerAvatar}
              className="mt-5 w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-xl py-3 transition-colors"
            >
              {t('profile.avatars.save')}
            </button>
          </div>
        </div>
      )}

      {/* ── AI avatar creator (photo → chibi hero) ── */}
      {isAvatarCreatorOpen && (
        <AvatarCreator
          gender={user.gender}
          onClose={() => setIsAvatarCreatorOpen(false)}
          onSaved={handleCustomAvatarSaved}
        />
      )}

      {/* ── Settings sheet (full original settings UI, gear-triggered) ── */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[60] bg-[hsl(var(--background))] overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-24">
            {/* Sheet header */}
            <div className="sticky top-0 -mx-4 px-4 py-3 mb-4 bg-[hsl(var(--background))]/90 backdrop-blur-md flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Settings size={22} />
                {t('profile.settingsTitle')}
              </h2>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                aria-label={t('common.cancel')}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 md:space-y-6">
              {/* Profile Header + Stats */}
              <ProfileHeader user={user} />
              <AdvancedStats />

              {/* Edit Name Section */}
              <section className="glass-card p-4 md:p-6">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Edit2 size={20} />
                  {t('profile.editProfile')}
                </h2>

                {isEditingName ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="flex-1 px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-teal-400"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveName}
                      aria-label={t('actions.save')}
                      className="p-2 md:px-4 md:py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 flex items-center justify-center gap-2"
                    >
                      <Save size={18} />
                      <span className="hidden md:inline">{t('actions.save')}</span>
                    </button>
                    <button
                      onClick={() => {
                        setNewName(user.name);
                        setIsEditingName(false);
                      }}
                      aria-label={t('common.cancel')}
                      className="p-2 md:px-4 md:py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors flex items-center justify-center"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/70">
                        {t('profile.nameLabel')}
                      </p>
                      <p className="text-white font-semibold">{user.name}</p>
                    </div>
                    <button
                      onClick={() => setIsEditingName(true)}
                      aria-label={t('common.edit')}
                      className="p-2 md:px-4 md:py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 border border-white/20 transition-colors flex items-center justify-center gap-2"
                    >
                      <Edit2 size={18} />
                      <span className="hidden md:inline">{t('common.edit')}</span>
                    </button>
                  </div>
                )}
              </section>

              {/* Username Section */}
              <section className="glass-card p-4 md:p-6">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <UserIcon size={20} />
                  {t('username.title')}
                </h2>

                {isEditingUsername ? (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => {
                          setNewUsername(e.target.value);
                          handleCheckUsername(e.target.value);
                        }}
                        className="flex-1 px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-teal-400"
                        placeholder={t('username.placeholder')}
                        autoFocus
                        maxLength={20}
                      />
                    </div>
                    {isCheckingUsername && (
                      <p className="text-sm text-teal-400">{t('username.checking')}</p>
                    )}
                    {!isCheckingUsername && usernameAvailable === true && (
                      <p className="text-sm text-green-400">{t('username.available')}</p>
                    )}
                    {!isCheckingUsername && usernameAvailable === false && (
                      <p className="text-sm text-red-400">{t('username.taken')}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveUsername}
                        disabled={!usernameAvailable}
                        aria-label={t('actions.save')}
                        className="p-2 md:px-4 md:py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <Save size={18} />
                        <span className="hidden md:inline">{t('actions.save')}</span>
                      </button>
                      <button
                        onClick={() => {
                          setNewUsername('');
                          setUsernameAvailable(null);
                          setIsEditingUsername(false);
                        }}
                        aria-label={t('common.cancel')}
                        className="p-2 md:px-4 md:py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors flex items-center justify-center"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/70">
                        {t('username.title')}
                      </p>
                      <p className="text-white font-semibold">
                        {currentUsername ? `@${currentUsername}` : t('username.choose')}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setNewUsername(currentUsername || '');
                        setIsEditingUsername(true);
                      }}
                      aria-label={t('common.edit')}
                      className="p-2 md:px-4 md:py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 border border-white/20 transition-colors flex items-center justify-center gap-2"
                    >
                      <Edit2 size={18} />
                      <span className="hidden md:inline">{t('common.edit')}</span>
                    </button>
                  </div>
                )}
              </section>

              {/* Avatar Selection Section */}
              <section className="glass-card p-4 md:p-6">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Edit2 size={20} />
                  {t('profile.changeAvatar')}
                </h2>

                {isEditingAvatar ? (
                  <div>
                    <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4">
                      {/* Rulo Avatar (Male) */}
                      <button
                        type="button"
                        onClick={() => setSelectedAvatar(AVATARS.RULO)}
                        className={cn(
                          'relative p-4 rounded-xl transition-all duration-200',
                          'border-2 hover:scale-105',
                          'focus:outline-none focus:ring-2 focus:ring-gold-400',
                          selectedAvatar === AVATARS.RULO
                            ? 'border-gold-400 bg-gold-400/10 shadow-lg shadow-gold-400/30'
                            : 'border-white/20 bg-white/5 hover:border-gold-400/50'
                        )}
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div
                            className={cn(
                              'w-20 h-20 rounded-full overflow-hidden border-2',
                              selectedAvatar === AVATARS.RULO
                                ? 'border-gold-400'
                                : 'border-white/20'
                            )}
                          >
                            <img
                              src={AVATARS.RULO}
                              alt="Rulo"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span
                            className={cn(
                              'text-sm font-medium',
                              selectedAvatar === AVATARS.RULO
                                ? 'text-gold-400'
                                : 'text-white'
                            )}
                          >
                            {t('profile.avatarMale')}
                          </span>
                        </div>
                        {selectedAvatar === AVATARS.RULO && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-gold-400 rounded-full flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        )}
                      </button>

                      {/* Dani Avatar (Female) */}
                      <button
                        type="button"
                        onClick={() => setSelectedAvatar(AVATARS.DANI)}
                        className={cn(
                          'relative p-4 rounded-xl transition-all duration-200',
                          'border-2 hover:scale-105',
                          'focus:outline-none focus:ring-2 focus:ring-gold-400',
                          selectedAvatar === AVATARS.DANI
                            ? 'border-gold-400 bg-gold-400/10 shadow-lg shadow-gold-400/30'
                            : 'border-white/20 bg-white/5 hover:border-gold-400/50'
                        )}
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div
                            className={cn(
                              'w-20 h-20 rounded-full overflow-hidden border-2',
                              selectedAvatar === AVATARS.DANI
                                ? 'border-gold-400'
                                : 'border-white/20'
                            )}
                          >
                            <img
                              src={AVATARS.DANI}
                              alt="Dani"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span
                            className={cn(
                              'text-sm font-medium',
                              selectedAvatar === AVATARS.DANI
                                ? 'text-gold-400'
                                : 'text-white'
                            )}
                          >
                            {t('profile.avatarFemale')}
                          </span>
                        </div>
                        {selectedAvatar === AVATARS.DANI && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-gold-400 rounded-full flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        )}
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveAvatar}
                        aria-label={t('actions.save')}
                        className="flex-1 bg-teal-500 text-white rounded-lg hover:bg-teal-600 flex items-center justify-center gap-2 p-2 md:px-4 md:py-2"
                      >
                        <Save size={18} />
                        <span className="hidden md:inline">{t('actions.save')}</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedAvatar(user.avatarUrl || AVATARS.RULO);
                          setIsEditingAvatar(false);
                        }}
                        aria-label={t('common.cancel')}
                        className="p-2 md:px-4 md:py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors flex items-center justify-center"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/20">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
                            <span className="text-2xl font-bold text-white">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-white/70">
                          {t('profile.avatarLabel')}
                        </p>
                        <p className="text-white font-semibold">
                          {user.avatarUrl === AVATARS.RULO
                            ? t('profile.avatarMale')
                            : user.avatarUrl === AVATARS.DANI
                            ? t('profile.avatarFemale')
                            : isCustomAvatar(user.avatarUrl)
                            ? t('profile.avatars.custom')
                            : '-'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsEditingAvatar(true)}
                      aria-label={t('common.edit')}
                      className="p-2 md:px-4 md:py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 border border-white/20 transition-colors flex items-center justify-center gap-2"
                    >
                      <Edit2 size={18} />
                      <span className="hidden md:inline">{t('common.edit')}</span>
                    </button>
                  </div>
                )}
              </section>

              {/* Life Areas Section */}
              <section className="glass-card p-4 md:p-6">
                <h2 className="text-lg font-bold text-white mb-4">
                  {t('profile.lifeAreasTitle')}
                </h2>

                <div className="grid gap-3">
                  {lifeAreas.map((area) => {
                    // Get translated name or use original if not in map
                    const translationKey = typeof area.area === 'string'
                      ? lifeAreaTranslationMap[area.area]
                      : undefined;
                    const areaName = translationKey
                      ? t(translationKey as any)
                      : area.area;

                    return (
                      <div
                        key={area.id}
                        className="flex items-center justify-between p-3 md:p-4 bg-white/5 rounded-lg border border-white/20"
                      >
                        <div>
                          <p className="font-semibold text-white">{areaName}</p>
                          <p className="text-sm text-white/70">
                            {t('common.level')} {area.level} • {area.totalXP} {t('common.xp')}
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={area.enabled}
                            onChange={(e) =>
                              toggleLifeAreaEnabled(area.id, e.target.checked)
                            }
                            className="sr-only peer"
                            disabled={
                              area.isCustom === false &&
                              !area.enabled &&
                              selectedAreas.length <= 1
                            }
                          />
                          <div className="w-11 h-6 bg-white/20 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Habits Section */}
              <section className="glass-card p-4 md:p-6">
                <h2 className="text-lg font-bold text-white mb-4">
                  {t('profile.habitsTitle')}
                </h2>

                <div className="grid gap-3">
                  {habits.length === 0 ? (
                    <p className="text-center text-white/70 py-6">
                      {t('profile.noHabits')}
                    </p>
                  ) : (
                    habits.map((habit) => {
                      const area = lifeAreas.find((a) => a.id === habit.lifeArea);
                      // Get translated area name or use original if not in map
                      const translationKey = area && typeof area.area === 'string'
                        ? lifeAreaTranslationMap[area.area]
                        : undefined;
                      const areaName = area
                        ? (translationKey ? t(translationKey as any) : area.area)
                        : t('common.noArea');

                      return (
                        <div
                          key={habit.id}
                          className="flex items-center justify-between p-3 md:p-4 bg-white/5 rounded-lg border border-white/20"
                        >
                          <div className="flex-1 min-w-0 mr-2">
                            <p className="font-semibold text-white truncate">
                              {habit.name}
                            </p>
                            <p className="text-sm text-white/70">
                              {habit.xp} {t('common.xp')} • {habit.points} {t('common.pts')} • {areaName}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleOpenEditHabit(habit)}
                              aria-label={t('common.edit')}
                              className="p-2 md:px-3 md:py-2 bg-teal-500/20 text-teal-400 rounded-lg hover:bg-teal-500/30 border border-teal-400/50 transition-colors flex items-center justify-center gap-2"
                            >
                              <Pencil size={18} />
                              <span className="hidden md:inline">{t('common.edit')}</span>
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(t('profile.deleteHabitConfirm'))) {
                                  deleteHabit(habit.id);
                                }
                              }}
                              aria-label={t('common.delete')}
                              className="p-2 md:px-3 md:py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 border border-red-400/50 transition-colors flex items-center justify-center gap-2"
                            >
                              <Trash2 size={18} />
                              <span className="hidden md:inline">{t('common.delete')}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>

              {/* Explore Section — entry points not in the bottom nav */}
              <section className="glass-card p-4 md:p-6">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Compass size={20} />
                  {t('profile.exploreTitle')}
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { path: ROUTES.MOOD, icon: Smile, label: t('navigation.mood') },
                    { path: ROUTES.SHOP, icon: ShoppingBag, label: t('navigation.shop') },
                    { path: ROUTES.LEADERBOARD, icon: Trophy, label: t('navigation.leaderboard') },
                    { path: ROUTES.CHAT, icon: MessageCircle, label: t('navigation.chat') },
                    { path: ROUTES.ROOT_HABIT, icon: Flame, label: t('rootHabit.title') },
                    { path: `${ROUTES.LEADERBOARD}?tab=social`, icon: UserIcon, label: t('navigation.social') },
                  ].map(({ path, icon: Icon, label }) => (
                    <button
                      key={path}
                      onClick={() => {
                        setIsSettingsOpen(false);
                        navigate(path);
                      }}
                      className="flex items-center gap-2 px-3 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-left transition-colors"
                    >
                      <Icon size={18} className="text-teal-300 shrink-0" />
                      <span className="text-sm font-semibold text-white truncate flex-1">{label}</span>
                      <ChevronRight size={16} className="text-white/30 shrink-0" />
                    </button>
                  ))}
                </div>
              </section>

              {/* Settings Section */}
              <section className="glass-card p-4 md:p-6">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Settings size={20} />
                  {t('profile.settingsTitle')}
                </h2>

                <div className="space-y-4">
                  {/* Theme Selector */}
                  <div>
                    <h3 className="text-sm font-bold text-white/90 mb-3 uppercase tracking-wide">
                      {t('themes.title')}
                    </h3>
                    <ThemeSelector variant="grid" />
                  </div>

                  <p className="text-sm text-white/70 pt-2 border-t border-white/10">
                    {t('profile.languageHint')}
                  </p>

                  {/* Sign Out Button */}
                  <div className="pt-4 border-t border-white/20">
                    <button
                      onClick={handleSignOut}
                      aria-label={t('auth.signOut')}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 border border-red-500/50 transition-all duration-200 font-semibold"
                    >
                      <LogOut size={18} />
                      <span>{t('auth.signOut')}</span>
                    </button>
                  </div>
                </div>
              </section>

              {/* Danger Zone */}
              <DangerZone />
            </div>
          </div>
        </div>
      )}

      {/* Habit Edit Modal */}
      {isEditingHabit && habitToEdit && (
        <HabitForm
          habit={habitToEdit}
          onSubmit={handleEditHabit}
          onCancel={handleCancelEditHabit}
        />
      )}
    </div>
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
    <div className="flex flex-col items-center text-center">
      {icon}
      <span className="text-xl font-extrabold text-white leading-none mt-1.5">
        {value.toLocaleString()}
      </span>
      <span className="text-[10px] text-white/60 font-medium leading-tight mt-1">{label}</span>
      {hint && <span className={cn('text-[9px] mt-0.5 font-medium', hintClass)}>{hint}</span>}
    </div>
  );
}

export default Profile;
