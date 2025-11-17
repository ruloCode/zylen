import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User as UserIcon, Star, Coins } from 'lucide-react';
import { useUser } from '@/store';
import { LanguageSwitcher } from '@/features/settings/components/LanguageSwitcher';
import { Logo } from '@/components/branding/Logo';
import { cn } from '@/utils';
import { ROUTES } from '@/constants/routes';

/**
 * Header Component
 *
 * Fixed header bar at the top of the application
 * Shows: Logo, User stats (points & level), Language switcher, Profile link
 */
export function Header() {
  const { user } = useUser();
  const location = useLocation();

  // Don't show header on onboarding page
  if (location.pathname === ROUTES.ONBOARDING) {
    return null;
  }

  if (!user) return null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-charcoal-800/95 backdrop-blur-md border-b border-charcoal-700 shadow-lg">
      <div className="container mx-auto h-full px-4">
        <div className="flex items-center justify-between h-full">
          {/* Left: Logo */}
          <Link
            to={ROUTES.DASHBOARD}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            aria-label="Go to dashboard"
          >
            <Logo size="sm" />
          </Link>

          {/* Center: User Stats (visible on md+ screens) */}
          <div className="hidden md:flex items-center gap-6">
            {/* Points */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-charcoal-700/50 rounded-lg border border-charcoal-600">
              <Coins size={18} className="text-[rgb(137,184,32)]" aria-hidden="true" />
              <span className="text-sm font-semibold text-white">
                {user.points.toLocaleString()}
              </span>
              <span className="text-xs text-gray-200">pts</span>
            </div>

            {/* Level */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-charcoal-700/50 rounded-lg border border-charcoal-600">
              <Star size={18} className="text-[rgb(137,184,32)]" aria-hidden="true" />
              <span className="text-sm font-semibold text-white">
                Nv. {user.level}
              </span>
            </div>
          </div>

          {/* Right: Language Switcher + Profile */}
          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <LanguageSwitcher variant="compact" />

            {/* Profile Link */}
            <Link
              to={ROUTES.PROFILE}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg',
                'transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-[rgb(137,184,32)]',
                location.pathname === ROUTES.PROFILE
                  ? 'bg-[rgb(137,184,32)]/20 border border-[rgb(137,184,32)]/50'
                  : 'bg-white/10 border border-white/20 hover:bg-white/20'
              )}
              aria-label="View profile"
              aria-current={location.pathname === ROUTES.PROFILE ? 'page' : undefined}
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name || 'User avatar'}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <UserIcon size={18} className="text-white" aria-hidden="true" />
              )}
              <span className="hidden sm:inline text-sm font-medium text-white">
                {user.name || 'Perfil'}
              </span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
