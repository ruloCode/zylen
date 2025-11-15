import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Edit2, Save, X } from 'lucide-react';
import { useUser, useLifeAreas, useHabits } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import {
  ProfileHeader,
  AdvancedStats,
  DangerZone,
} from '@/features/profile/components';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/utils';
import ruloAvatar from '@/assets/rulo_avatar.png';
import daniAvatar from '@/assets/dani_avatar.png';

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
  const { habits, deleteHabit } = useHabits();
  const { t } = useLocale();

  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.name || '');
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(
    user?.avatarUrl || ruloAvatar
  );

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

  const selectedAreas = lifeAreas.filter((area) =>
    user.selectedLifeAreas.includes(area.id)
  );

  return (
    <div className="min-h-screen bg-charcoal-900 pt-20 pb-24 px-6 md:px-8">
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
                      onClick={() => setSelectedAvatar(ruloAvatar)}
                      className={cn(
                        'relative p-4 rounded-xl transition-all duration-200',
                        'border-2 hover:scale-105',
                        'focus:outline-none focus:ring-2 focus:ring-gold-400',
                        selectedAvatar === ruloAvatar
                          ? 'border-gold-400 bg-gold-400/10 shadow-lg shadow-gold-400/30'
                          : 'border-charcoal-600 bg-charcoal-700 hover:border-gold-400/50'
                      )}
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div
                          className={cn(
                            'w-20 h-20 rounded-full overflow-hidden border-2',
                            selectedAvatar === ruloAvatar
                              ? 'border-gold-400'
                              : 'border-charcoal-500'
                          )}
                        >
                          <img
                            src={ruloAvatar}
                            alt="Rulo"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span
                          className={cn(
                            'text-sm font-medium',
                            selectedAvatar === ruloAvatar
                              ? 'text-gold-400'
                              : 'text-gray-300'
                          )}
                        >
                          {t('profile.avatarMale')}
                        </span>
                      </div>
                      {selectedAvatar === ruloAvatar && (
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
                      onClick={() => setSelectedAvatar(daniAvatar)}
                      className={cn(
                        'relative p-4 rounded-xl transition-all duration-200',
                        'border-2 hover:scale-105',
                        'focus:outline-none focus:ring-2 focus:ring-gold-400',
                        selectedAvatar === daniAvatar
                          ? 'border-gold-400 bg-gold-400/10 shadow-lg shadow-gold-400/30'
                          : 'border-charcoal-600 bg-charcoal-700 hover:border-gold-400/50'
                      )}
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div
                          className={cn(
                            'w-20 h-20 rounded-full overflow-hidden border-2',
                            selectedAvatar === daniAvatar
                              ? 'border-gold-400'
                              : 'border-charcoal-500'
                          )}
                        >
                          <img
                            src={daniAvatar}
                            alt="Dani"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span
                          className={cn(
                            'text-sm font-medium',
                            selectedAvatar === daniAvatar
                              ? 'text-gold-400'
                              : 'text-gray-300'
                          )}
                        >
                          {t('profile.avatarFemale')}
                        </span>
                      </div>
                      {selectedAvatar === daniAvatar && (
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
                        setSelectedAvatar(user.avatarUrl || ruloAvatar);
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
                        {user.avatarUrl === ruloAvatar
                          ? t('profile.avatarMale')
                          : user.avatarUrl === daniAvatar
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
                  const areaName =
                    typeof area.area === 'string' && lifeAreaTranslationMap[area.area]
                      ? t(lifeAreaTranslationMap[area.area])
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
                    const areaName = area
                      ? typeof area.area === 'string' && lifeAreaTranslationMap[area.area]
                        ? t(lifeAreaTranslationMap[area.area])
                        : area.area
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

              <p className="text-sm text-gray-400">
                {t('profile.languageHint')}
              </p>
            </section>

            {/* Danger Zone */}
            <DangerZone />
          </main>
        </div>
      </div>
    </div>
  );
}

export default Profile;
