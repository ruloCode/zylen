/**
 * MyWay (LifeQuest) Navigation Component
 * RPG HUD-style bottom navigation with warm golden accents
 */

import React from 'react';
import { Home, CheckSquare, Flame, ShoppingBag, MessageCircle } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/utils';
import { useLocale } from '@/hooks/useLocale';
import { ROUTES } from '@/constants/routes';

export function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLocale();

  // Don't show navigation on onboarding page
  if (location.pathname === ROUTES.ONBOARDING) {
    return null;
  }

  const navItems = [
    {
      path: '/',
      icon: Home,
      label: t('navigation.home'),
      color: 'text-gold-600'
    },
    {
      path: '/habits',
      icon: CheckSquare,
      label: t('navigation.habits'),
      color: 'text-teal-500'
    },
    {
      path: '/streaks',
      icon: Flame,
      label: t('navigation.streaks'),
      color: 'text-warning-500'
    },
    {
      path: '/shop',
      icon: ShoppingBag,
      label: t('navigation.shop'),
      color: 'text-gold-700'
    },
    {
      path: '/chat',
      icon: MessageCircle,
      label: t('navigation.chat'),
      color: 'text-teal-600'
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50" aria-label="Main navigation">
      {/* RPG HUD background with warm parchment glass */}
      <div className="glass-card border-t-2 border-gold-200/40 px-4 py-3 shadow-soft-xl backdrop-blur-2xl">
        <div className="max-w-md mx-auto flex justify-around items-center">
          {navItems.map(({ path, icon: Icon, label, color }) => {
            const isActive = location.pathname === path;

            return (
              <button
                key={path}
                type="button"
                onClick={() => navigate(path)}
                aria-label={`Navigate to ${label}`}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl transition-all duration-300 relative',
                  'font-body font-semibold',
                  'focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-400/50 focus-visible:ring-offset-2',
                  isActive
                    ? `${color} bg-gradient-to-br from-gold-100/80 to-gold-50/60 scale-110 shadow-soft-md border-2 border-gold-300/50`
                    : 'text-gray-600 hover:text-gold-700 hover:bg-parchment-50/40 hover:scale-105'
                )}
              >
                {/* Active indicator glow */}
                {isActive && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-adventure-glow opacity-30 animate-glow-pulse -z-10" />
                )}

                {/* Icon with golden glow on active */}
                <div className={cn(
                  'relative',
                  isActive && 'drop-shadow-lg'
                )}>
                  <Icon
                    size={24}
                    strokeWidth={isActive ? 2.5 : 2}
                    className="transition-all duration-200"
                  />

                  {/* Sparkle effect on active */}
                  {isActive && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-gold-500 rounded-full animate-sparkle" />
                  )}
                </div>

                {/* Label */}
                <span className={cn(
                  'text-[11px] tracking-wide',
                  isActive ? 'font-extrabold' : 'font-medium'
                )}>
                  {label}
                </span>

                {/* Golden underline on active */}
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-transparent via-gold-500 to-transparent rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Subtle top rim light */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-400/50 to-transparent" />
    </nav>
  );
}

export default Navigation;
