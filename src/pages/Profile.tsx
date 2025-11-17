import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Edit2, Save, X, LogOut, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { useUser, useLifeAreas, useHabits } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import * as SocialService from '@/services/supabase/social.service';
import {
  ProfileHeader,
  AdvancedStats,
  DangerZone,
} from '@/features/profile/components';
import { HabitForm } from '@/features/habits/components';
import { Habit, HabitFormData, HabitWithCompletion } from '@/types';
import { ROUTES, AVATARS } from '@/constants';
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

/**
 * Profile Page
 *
 * User profile with 2-column layout (desktop):
 * - Sidebar: ProfileHeader + AdvancedStats
 * - Main: Edit Profile, Life Areas, Habits, Settings, DangerZone
 *
 * Mobile: Single column layout
 */
export function Profile() {
  const navigate = useNavigate();
  const { user, updateUserProfile } = useUser();
  const { lifeAreas, toggleLifeAreaEnabled } = useLifeAreas();
  const { habits, deleteHabit, updateHabit } = useHabits();
  const { t } = useLocale();

  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.name || '');
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(
    user?.avatarUrl || AVATARS.RULO
  );
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

  const handleOpenEditHabit = (habit: HabitWithCompletion) => {
    // Extract only Habit properties (without 'completed')
    const habitData: Habit = {
      id: habit.id,
      userId: habit.userId,
      name: habit.name,
      lifeArea: habit.lifeArea,
      xp: habit.xp,
      points: habit.points,
      createdAt: habit.createdAt,
    };
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
      toast.error(error.message || t('username.error'));
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

  return (
    <div className="min-h-screen pt-20 pb-24 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* 2 Column Grid Layout (Desktop) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT SIDEBAR - Profile Header + Stats */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Profile Header */}
            <div className="lg:sticky lg:top-24 space-y-6">
              <ProfileHeader user={user} />
              <AdvancedStats />
            </div>
          </aside>

          {/* RIGHT MAIN PANEL - Configuration Sections */}
          <main className="lg:col-span-8 space-y-6">
            {/* Edit Name Section */}
            <section className="glass-card p-6">
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
                    className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600"
                  >
                    <Save size={18} />
                  </button>
                  <button
                    onClick={() => {
                      setNewName(user.name);
                      setIsEditingName(false);
                    }}
                    className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white">
                      {t('profile.nameLabel')}
                    </p>
                    <p className="text-white font-semibold">{user.name}</p>
                  </div>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 border border-white/20 transition-colors"
                  >
                    {t('common.edit')}
                  </button>
                </div>
              )}
            </section>

            {/* Username Section */}
            <section className="glass-card p-6">
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
                    <p className="text-sm text-success-400">{t('username.available')}</p>
                  )}
                  {!isCheckingUsername && usernameAvailable === false && (
                    <p className="text-sm text-danger-400">{t('username.taken')}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveUsername}
                      disabled={!usernameAvailable}
                      className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save size={18} />
                    </button>
                    <button
                      onClick={() => {
                        setNewUsername('');
                        setUsernameAvailable(null);
                        setIsEditingUsername(false);
                      }}
                      className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white">
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
                    className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 border border-white/20 transition-colors"
                  >
                    {t('common.edit')}
                  </button>
                </div>
              )}
            </section>

            {/* Avatar Selection Section */}
            <section className="glass-card p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Edit2 size={20} />
                {t('profile.changeAvatar')}
              </h2>

              {isEditingAvatar ? (
                <div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
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
                      className="flex-1 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 flex items-center justify-center gap-2"
                    >
                      <Save size={18} />
                      {t('actions.save')}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedAvatar(user.avatarUrl || AVATARS.RULO);
                        setIsEditingAvatar(false);
                      }}
                      className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
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
                      <p className="text-sm text-white">
                        {t('profile.avatarLabel')}
                      </p>
                      <p className="text-white font-semibold">
                        {user.avatarUrl === AVATARS.RULO
                          ? t('profile.avatarMale')
                          : user.avatarUrl === AVATARS.DANI
                          ? t('profile.avatarFemale')
                          : '-'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsEditingAvatar(true)}
                    className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 border border-white/20 transition-colors"
                  >
                    {t('common.edit')}
                  </button>
                </div>
              )}
            </section>

            {/* Life Areas Section */}
            <section className="glass-card p-6">
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
                      className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/20"
                    >
                      <div>
                        <p className="font-semibold text-white">{areaName}</p>
                        <p className="text-sm text-white">
                          {t('common.level')} {area.level} • {area.totalXP} XP
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
            <section className="glass-card p-6">
              <h2 className="text-lg font-bold text-white mb-4">
                {t('profile.habitsTitle')}
              </h2>

              <div className="grid gap-3">
                {habits.length === 0 ? (
                  <p className="text-center text-white py-6">
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
                        className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/20"
                      >
                        <div>
                          <p className="font-semibold text-white">
                            {habit.name}
                          </p>
                          <p className="text-sm text-white">
                            {habit.xp} XP • {habit.points} {t('common.pts')} • {areaName}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenEditHabit(habit)}
                            className="px-3 py-2 bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-100 border border-teal-200 transition-colors"
                          >
                            {t('common.edit')}
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(t('profile.deleteHabitConfirm'))) {
                                deleteHabit(habit.id);
                              }
                            }}
                            className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-200 transition-colors"
                          >
                            {t('common.delete')}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* Settings Section */}
            <section className="glass-card p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Settings size={20} />
                {t('profile.settingsTitle')}
              </h2>

              <div className="space-y-4">
                <p className="text-sm text-white">
                  {t('profile.languageHint')}
                </p>

                {/* Sign Out Button */}
                <div className="pt-4 border-t border-white/20">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 border border-red-500/50 transition-all duration-200 font-semibold"
                  >
                    <LogOut size={18} />
                    {t('auth.signOut')}
                  </button>
                </div>
              </div>
            </section>

            {/* Danger Zone */}
            <DangerZone />
          </main>
        </div>
      </div>

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

export default Profile;
