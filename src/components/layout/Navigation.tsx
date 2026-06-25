/**
 * Zylen bottom navigation
 * Floating glass pill with a center FAB, matching the Home reference design.
 */

import React from 'react';
import { Home, CalendarCheck, TrendingUp, User, Plus, type LucideIcon } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/utils';
import { useLocale } from '@/hooks/useLocale';
import { ROUTES } from '@/constants/routes';

interface NavItem {
  path: string;
  icon: LucideIcon;
  label: string;
}

export function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLocale();

  // Don't show navigation on onboarding or welcome pages
  if (location.pathname === ROUTES.ONBOARDING || location.pathname === ROUTES.WELCOME) {
    return null;
  }

  const leftItems: NavItem[] = [
    { path: ROUTES.DASHBOARD, icon: Home, label: t('navigation.home') },
    { path: ROUTES.HABITS, icon: CalendarCheck, label: t('navigation.routines') },
  ];

  const rightItems: NavItem[] = [
    { path: ROUTES.STREAKS, icon: TrendingUp, label: t('navigation.progress') },
    { path: ROUTES.PROFILE, icon: User, label: t('navigation.profile') },
  ];

  const renderItem = ({ path, icon: Icon, label }: NavItem) => {
    const isActive = location.pathname === path;
    return (
      <button
        key={path}
        type="button"
        onClick={() => navigate(path)}
        aria-label={t('navigation.navigateTo', { label })}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'flex flex-col items-center gap-1 px-2 py-1 rounded-xl transition-all duration-200',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60',
          isActive ? 'text-teal-300' : 'text-white/55 hover:text-white/80'
        )}
      >
        <Icon size={22} strokeWidth={isActive ? 2.6 : 2} />
        <span className={cn('text-[11px] tracking-wide', isActive ? 'font-bold' : 'font-medium')}>
          {label}
        </span>
      </button>
    );
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2"
      aria-label="Main navigation"
    >
      <div className="relative max-w-md mx-auto">
        <div className="glass-card rounded-3xl px-3 py-2.5 flex items-center justify-between shadow-soft-xl">
          <div className="flex items-center gap-2">{leftItems.map(renderItem)}</div>

          {/* Spacer for the floating FAB */}
          <div className="w-16 shrink-0" aria-hidden="true" />

          <div className="flex items-center gap-2">{rightItems.map(renderItem)}</div>
        </div>

        {/* Center FAB */}
        <button
          type="button"
          onClick={() => navigate(ROUTES.HABITS)}
          aria-label={t('home.addHabit')}
          className={cn(
            'absolute left-1/2 -translate-x-1/2 -top-5',
            'w-14 h-14 rounded-full bg-primary text-primary-foreground',
            'flex items-center justify-center shadow-glow-teal',
            'border-4 border-[hsl(var(--background))]',
            'transition-transform duration-200 hover:scale-105 active:scale-95',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/70'
          )}
        >
          <Plus size={26} strokeWidth={2.8} />
        </button>
      </div>
    </nav>
  );
}

export default Navigation;
