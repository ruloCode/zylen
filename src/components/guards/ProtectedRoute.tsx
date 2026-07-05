/**
 * Protected Route Component
 *
 * Wrapper component that protects routes requiring authentication.
 * Redirects unauthenticated users to the login page.
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useLocale } from '@/hooks/useLocale';
import { ROUTES } from '@/constants/routes';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const { t } = useLocale();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-charcoal-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
          <p className="mt-4 text-pale-200">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // Redirect unauthenticated users to the Welcome splash (entry point).
  // /login stays reachable from there for returning users.
  if (!user) {
    // Arena invite links must survive the login redirect (the login flow drops
    // state.from) — stash the room; Arena consumes and clears it after login.
    if (location.pathname === ROUTES.ARENA) {
      const room = new URLSearchParams(location.search).get('room');
      if (room) sessionStorage.setItem('el_invite_room', room);
    }
    return <Navigate to={ROUTES.WELCOME} state={{ from: location }} replace />;
  }

  // Render protected content
  return <>{children}</>;
}
