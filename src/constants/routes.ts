/**
 * Application route constants
 * Centralized route definitions to avoid hardcoded strings
 */

export const ROUTES = {
  DASHBOARD: '/',
  HABITS: '/habits',
  STREAKS: '/streaks',
  ROOT_HABIT: '/root-habit',
  SHOP: '/shop',
  CHAT: '/chat',
} as const;

export type RouteKey = keyof typeof ROUTES;
export type RoutePath = typeof ROUTES[RouteKey];

// Navigation items with metadata
export interface NavItem {
  path: RoutePath;
  label: string;
  icon: string; // Lucide icon name
}

export const NAV_ITEMS: NavItem[] = [
  { path: ROUTES.DASHBOARD, label: 'Home', icon: 'Home' },
  { path: ROUTES.HABITS, label: 'Habits', icon: 'CheckSquare' },
  { path: ROUTES.STREAKS, label: 'Streaks', icon: 'Flame' },
  { path: ROUTES.SHOP, label: 'Shop', icon: 'Store' },
  { path: ROUTES.CHAT, label: 'Coach', icon: 'MessageCircle' },
];
