import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, LogOut, Edit2, Save, X } from 'lucide-react';
import { useUser, useLifeAreas, useHabits } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import { ProfileHeader } from '@/features/profile/components';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/utils';

/**
 * Profile Page
 *
 * User profile with settings, life areas management, and habits management
 */
export function Profile() {
  const navigate = useNavigate();
  const { user, updateUserProfile } = useUser();
  const { lifeAreas, toggleLifeAreaEnabled } = useLifeAreas();
  const { habits, deleteHabit } = useHabits();
  const { t } = useLocale();

  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.name || '');

  if (!user) {
    navigate(ROUTES.DASHBOARD);
    return null;
  }

  const handleSaveName = () => {
    if (newName.trim().length >= 2) {
      updateUserProfile(newName.trim());
      setIsEditingName(false);
    }
  };

  const selectedAreas = lifeAreas.filter((area) =>
    user.selectedLifeAreas.includes(area.id)
  );

  return (
    <div className="min-h-screen bg-charcoal-900 pt-20 pb-24 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Profile Header */}
        <ProfileHeader user={user} />

        {/* Edit Name Section */}
        <section className="mt-6 bg-charcoal-800 rounded-xl p-6 border border-charcoal-700">
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
                <p className="text-sm text-gray-400">{t('profile.nameLabel')}</p>
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

        {/* Life Areas Section */}
        <section className="mt-6 bg-charcoal-800 rounded-xl p-6 border border-charcoal-700">
          <h2 className="text-lg font-bold text-white mb-4">
            {t('profile.lifeAreasTitle')}
          </h2>

          <div className="grid gap-3">
            {lifeAreas.map((area) => (
              <div
                key={area.id}
                className="flex items-center justify-between p-4 bg-charcoal-700/50 rounded-lg border border-charcoal-600"
              >
                <div>
                  <p className="font-semibold text-white">{area.area}</p>
                  <p className="text-sm text-gray-400">
                    Nivel {area.level} • {area.totalXP} XP
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={area.enabled}
                    onChange={(e) => toggleLifeAreaEnabled(area.id, e.target.checked)}
                    className="sr-only peer"
                    disabled={area.isCustom === false && !area.enabled && selectedAreas.length <= 1}
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                </label>
              </div>
            ))}
          </div>
        </section>

        {/* Habits Section */}
        <section className="mt-6 bg-charcoal-800 rounded-xl p-6 border border-charcoal-700">
          <h2 className="text-lg font-bold text-white mb-4">
            {t('profile.habitsTitle')}
          </h2>

          <div className="grid gap-3">
            {habits.length === 0 ? (
              <p className="text-center text-gray-400 py-6">{t('profile.noHabits')}</p>
            ) : (
              habits.map((habit) => {
                const area = lifeAreas.find((a) => a.id === habit.lifeArea);
                return (
                  <div
                    key={habit.id}
                    className="flex items-center justify-between p-4 bg-charcoal-700/50 rounded-lg border border-charcoal-600"
                  >
                    <div>
                      <p className="font-semibold text-white">{habit.name}</p>
                      <p className="text-sm text-gray-400">
                        {habit.xp} XP • {habit.points} pts • {area?.area || 'Sin área'}
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
        <section className="mt-6 bg-charcoal-800 rounded-xl p-6 border border-charcoal-700">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Settings size={20} />
            {t('profile.settingsTitle')}
          </h2>

          <p className="text-sm text-gray-400">
            {t('profile.languageHint')}
          </p>
        </section>
      </div>
    </div>
  );
}

export default Profile;
