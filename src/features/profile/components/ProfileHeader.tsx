import React from 'react';
import { Star, Coins, TrendingUp } from 'lucide-react';
import { User } from '@/types';
import { useLocale } from '@/hooks/useLocale';

interface ProfileHeaderProps {
  user: User;
}

/**
 * Profile Header Component
 * Shows user avatar, name, and key stats
 */
export function ProfileHeader({ user }: ProfileHeaderProps) {
  const { t } = useLocale();

  return (
    <div className="bg-gradient-to-br from-charcoal-800 to-charcoal-700 rounded-2xl p-6 border border-charcoal-600 shadow-xl">
      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* Avatar */}
        <div className="relative">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-24 h-24 rounded-full object-cover border-4 border-gold-400 shadow-lg"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-500 to-gold-500 flex items-center justify-center border-4 border-gold-400 shadow-lg">
              <span className="text-3xl font-bold text-white">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* User Info & Stats */}
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-2xl font-bold text-white mb-2">{user.name}</h1>

          <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
            {/* Level */}
            <div className="flex items-center gap-2 px-4 py-2 bg-charcoal-900/50 rounded-lg border border-charcoal-600">
              <Star className="text-teal-400" size={20} />
              <div>
                <p className="text-xs text-gray-400">{t('common.level')}</p>
                <p className="font-bold text-white">{user.level}</p>
              </div>
            </div>

            {/* Total XP */}
            <div className="flex items-center gap-2 px-4 py-2 bg-charcoal-900/50 rounded-lg border border-charcoal-600">
              <TrendingUp className="text-purple-400" size={20} />
              <div>
                <p className="text-xs text-gray-400">{t('common.totalXP')}</p>
                <p className="font-bold text-white">{user.totalXPEarned.toLocaleString()}</p>
              </div>
            </div>

            {/* Points */}
            <div className="flex items-center gap-2 px-4 py-2 bg-charcoal-900/50 rounded-lg border border-charcoal-600">
              <Coins className="text-gold-400" size={20} />
              <div>
                <p className="text-xs text-gray-400">{t('common.points')}</p>
                <p className="font-bold text-white">{user.points.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileHeader;
