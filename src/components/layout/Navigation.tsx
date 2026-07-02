/**
 * Everlight bottom navigation
 * HUD / sci-fi styled bar with hexagonal icon frames, a glowing top edge,
 * an underline indicator on the active item and a floating center FAB.
 * Matches navbar-reference.jpg.
 */

import React from 'react';
import { Home, CalendarCheck, Trophy, TrendingUp, User, Plus, type LucideIcon } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/utils';
import { useLocale } from '@/hooks/useLocale';
import { ROUTES } from '@/constants/routes';

interface NavItem {
  path: string;
  icon: LucideIcon;
  label: string;
}

/** Flat-top hexagon used for every icon frame. */
const HEX_CLIP = 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';

export function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLocale();

  // Don't show navigation on onboarding or welcome pages
  if (location.pathname === ROUTES.ONBOARDING || location.pathname === ROUTES.WELCOME) {
    return null;
  }

  // 5 main surfaces. Ranking (leaderboard + friends) was previously only
  // reachable from Profile — now a first-class tab.
  const items: NavItem[] = [
    { path: ROUTES.DASHBOARD, icon: Home, label: t('navigation.home') },
    { path: ROUTES.HABITS, icon: CalendarCheck, label: t('navigation.routines') },
    { path: ROUTES.LEADERBOARD, icon: Trophy, label: t('navigation.ranking') },
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
          'group relative flex flex-1 flex-col items-center gap-1.5 px-1 pt-1 pb-0.5',
          'transition-colors duration-200',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60 rounded-xl'
        )}
      >
        {/* Hexagonal icon frame (outer glow ring + inner dark face) */}
        <span
          className="relative grid place-items-center transition-transform duration-200 group-active:scale-90"
          style={{
            width: 38,
            height: 34,
            clipPath: HEX_CLIP,
            background: isActive
              ? 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-hover)))'
              : 'hsl(var(--primary) / 0.28)',
            filter: isActive ? 'drop-shadow(0 0 7px hsl(var(--glow) / 0.85))' : 'none',
          }}
        >
          <span
            className="grid place-items-center"
            style={{
              width: 32,
              height: 28,
              clipPath: HEX_CLIP,
              background: isActive ? 'hsl(var(--primary) / 0.16)' : 'hsl(var(--background))',
            }}
          >
            <Icon
              size={16}
              strokeWidth={isActive ? 2.6 : 2}
              className={isActive ? 'text-teal-200' : 'text-white/60 group-hover:text-white/85'}
            />
          </span>
        </span>

        <span
          className={cn(
            'text-[9px] font-semibold uppercase tracking-[0.15em] transition-colors',
            isActive ? 'text-teal-200' : 'text-white/45 group-hover:text-white/70'
          )}
        >
          {label}
        </span>

        {/* Active underline indicator */}
        <span
          aria-hidden="true"
          className={cn(
            'absolute -bottom-0.5 h-[2px] w-7 rounded-full transition-all duration-300',
            isActive ? 'opacity-100' : 'opacity-0'
          )}
          style={{
            background: 'hsl(var(--primary))',
            boxShadow: '0 0 8px 1px hsl(var(--glow) / 0.9)',
          }}
        />
      </button>
    );
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)]"
      aria-label="Main navigation"
    >
      <div className="relative mx-auto max-w-md">
        {/* Bar surface */}
        <div
          className="relative flex items-end gap-1 rounded-t-2xl px-2 pb-2 pt-3 backdrop-blur-xl"
          style={{
            background:
              'linear-gradient(180deg, hsl(var(--background) / 0.82), hsl(var(--background) / 0.97))',
            borderTop: '1px solid hsl(var(--primary) / 0.25)',
            boxShadow: '0 -8px 28px -10px hsl(var(--glow) / 0.45)',
          }}
        >
          {/* Glowing top edge */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-6 top-0 h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent, hsl(var(--primary) / 0.9), transparent)',
            }}
          />

          {items.map(renderItem)}
        </div>

        {/* Floating quick-create FAB (right corner, above the bar) */}
        <button
          type="button"
          onClick={() => navigate(ROUTES.HABITS)}
          aria-label={t('home.addHabit')}
          className={cn(
            'absolute right-3 -top-16',
            'grid h-12 w-12 place-items-center rounded-full',
            'transition-transform duration-200 hover:scale-105 active:scale-95',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-300/70'
          )}
          style={{
            background:
              'radial-gradient(circle at 35% 30%, hsl(var(--primary-hover)), hsl(var(--primary)) 70%)',
            border: '2px solid hsl(var(--primary) / 0.55)',
            boxShadow:
              '0 0 18px 2px hsl(var(--glow) / 0.7), inset 0 1px 2px hsl(0 0% 100% / 0.4)',
          }}
        >
          <Plus size={24} strokeWidth={2.8} className="text-primary-foreground" />
        </button>
      </div>
    </nav>
  );
}

export default Navigation;
