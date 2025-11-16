import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Edit2, Save, X, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { useUser, useLifeAreas, useHabits } from '@/store';
import { useLocale } from '@/hooks/useLocale';
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
    <div className="min-h-screen bg-charcoal-900 pt-20 pb-24 px-4">
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
            <section className="bg-charcoal-800 rounded-xl p-6 border border-charcoal-700">
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
                    className="flex-1 px-4 py-2 bg-charcoal-700 border border-charcoal-600 rounded-lg text-white"
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
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500"
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">
                      {t('profile.nameLabel')}
                    </p>
                    <p className="text-white font-semibold">{user.name}</p>
                  </div>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="px-4 py-2 bg-charcoal-700 text-white rounded-lg hover:bg-charcoal-600 border border-charcoal-600"
                  >
                    {t('common.edit')}
                  </button>
                </div>
              )}
            </section>

            {/* Avatar Selection Section */}
            <section className="bg-charcoal-800 rounded-xl p-6 border border-charcoal-700">
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
                          : 'border-charcoal-600 bg-charcoal-700 hover:border-gold-400/50'
                      )}
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div
                          className={cn(
                            'w-20 h-20 rounded-full overflow-hidden border-2',
                            selectedAvatar === AVATARS.RULO
                              ? 'border-gold-400'
                              : 'border-charcoal-500'
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
                              : 'text-gray-300'
                          )}
                        >
                          {t('profile.avatarMale')}
                        </span>
                      </div>
                      {selectedAvatar === AVATARS.RULO && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-gold-400 rounded-full flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-charcoal-900"
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
                          : 'border-charcoal-600 bg-charcoal-700 hover:border-gold-400/50'
                      )}
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div
                          className={cn(
                            'w-20 h-20 rounded-full overflow-hidden border-2',
                            selectedAvatar === AVATARS.DANI
                              ? 'border-gold-400'
                              : 'border-charcoal-500'
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
                              : 'text-gray-300'
                          )}
                        >
                          {t('profile.avatarFemale')}
                        </span>
                      </div>
                      {selectedAvatar === AVATARS.DANI && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-gold-400 rounded-full flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-charcoal-900"
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
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-charcoal-500">
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
                      <p className="text-sm text-gray-400">
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
                    className="px-4 py-2 bg-charcoal-700 text-white rounded-lg hover:bg-charcoal-600 border border-charcoal-600"
                  >
                    {t('common.edit')}
                  </button>
                </div>
              )}
            </section>

            {/* Life Areas Section */}
            <section className="bg-charcoal-800 rounded-xl p-6 border border-charcoal-700">
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
                      className="flex items-center justify-between p-4 bg-charcoal-700/50 rounded-lg border border-charcoal-600"
                    >
                      <div>
                        <p className="font-semibold text-white">{areaName}</p>
                        <p className="text-sm text-gray-400">
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
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                      </label>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Habits Section */}
            <section className="bg-charcoal-800 rounded-xl p-6 border border-charcoal-700">
              <h2 className="text-lg font-bold text-white mb-4">
                {t('profile.habitsTitle')}
              </h2>

              <div className="grid gap-3">
                {habits.length === 0 ? (
                  <p className="text-center text-gray-400 py-6">
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
                        className="flex items-center justify-between p-4 bg-charcoal-700/50 rounded-lg border border-charcoal-600"
                      >
                        <div>
                          <p className="font-semibold text-white">
                            {habit.name}
                          </p>
                          <p className="text-sm text-gray-400">
                            {habit.xp} XP • {habit.points} {t('common.pts')} • {areaName}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenEditHabit(habit)}
                            className="px-3 py-2 bg-teal-500/20 text-teal-400 rounded-lg hover:bg-teal-500/30 border border-teal-500/50"
                          >
                            {t('common.edit')}
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(t('profile.deleteHabitConfirm'))) {
                                deleteHabit(habit.id);
                              }
                            }}
                            className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 border border-red-500/50"
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
            <section className="bg-charcoal-800 rounded-xl p-6 border border-charcoal-700">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Settings size={20} />
                {t('profile.settingsTitle')}
              </h2>

              <div className="space-y-4">
                <p className="text-sm text-gray-400">
                  {t('profile.languageHint')}
                </p>

                {/* Sign Out Button */}
                <div className="pt-4 border-t border-charcoal-700">
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
