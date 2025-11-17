import { Star, Coins, TrendingUp } from 'lucide-react';
import { User } from '@/types';
import { useLocale } from '@/hooks/useLocale';

interface ProfileHeaderProps {
  user: User;
}

/**
 * Profile Header Component
 * Shows user avatar, name, and key stats
 * Optimized for sidebar layout (vertical on desktop, horizontal on mobile)
 */
export function ProfileHeader({ user }: ProfileHeaderProps) {
  const { t } = useLocale();

  return (
    <div className="glass-card p-6 shadow-xl">
      {/* Avatar and Name - Always Centered */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="relative mb-4">
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
        <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
      </div>

      {/* Stats - Vertical Stack on Desktop (sidebar), Grid on Mobile */}
      <div className="grid grid-cols-3 lg:grid-cols-1 gap-3">
        {/* Level */}
        <div className="flex items-center gap-2 px-3 py-2.5 bg-white/50 rounded-lg border border-gray-200">
          <Star className="text-teal-400 flex-shrink-0" size={20} />
          <div className="min-w-0">
            <p className="text-xs text-gray-600 truncate">{t('common.level')}</p>
            <p className="font-bold text-gray-900">{user.level}</p>
          </div>
        </div>

        {/* Total XP */}
        <div className="flex items-center gap-2 px-3 py-2.5 bg-white/50 rounded-lg border border-gray-200">
          <TrendingUp className="text-purple-400 flex-shrink-0" size={20} />
          <div className="min-w-0">
            <p className="text-xs text-gray-600 truncate">{t('common.totalXP')}</p>
            <p className="font-bold text-gray-900">{user.totalXPEarned.toLocaleString()}</p>
          </div>
        </div>

        {/* Points */}
        <div className="flex items-center gap-2 px-3 py-2.5 bg-white/50 rounded-lg border border-gray-200">
          <Coins className="text-gold-400 flex-shrink-0" size={20} />
          <div className="min-w-0">
            <p className="text-xs text-gray-600 truncate">{t('common.points')}</p>
            <p className="font-bold text-gray-900">{user.points.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileHeader;
