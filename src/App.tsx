import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navigation, Header } from '@/components/layout';
import { AppProvider } from '@/app/AppProvider';
import { I18nProvider } from '@/components/I18nProvider';
import { AuthProvider, useAuth } from '@/features/auth/context/AuthContext';
import { ProtectedRoute } from '@/components/guards/ProtectedRoute';
import { ToastContainer } from '@/components/ui/Toast';
import { ROUTES } from '@/constants';

// Lazy load pages for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const HabitLog = lazy(() => import('./pages/HabitLog').then(m => ({ default: m.HabitLog })));
const Streaks = lazy(() => import('./pages/Streaks').then(m => ({ default: m.Streaks })));
const RootHabit = lazy(() => import('./pages/RootHabit').then(m => ({ default: m.RootHabit })));
const Mood = lazy(() => import('./pages/Mood').then(m => ({ default: m.Mood })));
const Shop = lazy(() => import('./pages/Shop').then(m => ({ default: m.Shop })));
const Chat = lazy(() => import('./pages/Chat').then(m => ({ default: m.Chat })));
const Leaderboard = lazy(() => import('./pages/Leaderboard').then(m => ({ default: m.Leaderboard })));
const Arena = lazy(() => import('./pages/Arena').then(m => ({ default: m.Arena })));
const Realms = lazy(() => import('./pages/Realms').then(m => ({ default: m.Realms })));
const Focus = lazy(() => import('./pages/Focus').then(m => ({ default: m.Focus })));
const Onboarding = lazy(() => import('./pages/Onboarding').then(m => ({ default: m.Onboarding })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Welcome = lazy(() => import('./pages/Welcome').then(m => ({ default: m.Welcome })));
const OnboardingCarousel = lazy(() =>
  import('./features/onboarding/components').then(m => ({ default: m.OnboardingCarousel }))
);
const AuthCallback = lazy(() => import('./pages/AuthCallback').then(m => ({ default: m.AuthCallback })));

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500 mx-auto mb-4"></div>
        <p className="text-gray-600 font-semibold">Loading...</p>
      </div>
    </div>
  );
}

// Onboarding entry: unauthenticated visitors (arriving from the Welcome
// splash) see the marketing carousel ending in a sign-in slide. Once
// authenticated, they fall through to the existing protected multi-step
// onboarding/profile setup.
function OnboardingEntry() {
  const { user, loading } = useAuth();

  if (loading) return <PageLoader />;

  if (!user) return <OnboardingCarousel />;

  // Render the multi-step Onboarding directly. We must NOT reuse ProtectedShell
  // here: its self-contained <Routes> resolves relative to the already-matched
  // "/onboarding" parent route, leaving an empty path that falls through to the
  // "/" (Dashboard) route — which made /onboarding render the Dashboard and the
  // onboarding steps (incl. the identity/gender step) never show.
  return (
    <ProtectedRoute>
      <AppProvider>
        <Onboarding />
        <ToastContainer />
      </AppProvider>
    </ProtectedRoute>
  );
}

// Protected app shell: Home is full-bleed (its own header + hero), so it
// drops the top padding the fixed Header would otherwise need.
function ProtectedShell() {
  const location = useLocation();
  const isHome = location.pathname === ROUTES.DASHBOARD;
  // Immersive routes render their own chrome: the Arena (fullscreen game
  // embed) and Focus (a running countdown must not share the screen with the
  // bottom nav — mis-taps break gems).
  const isImmersive =
    location.pathname === ROUTES.ARENA || location.pathname === ROUTES.FOCUS;

  return (
    <div className="w-full min-h-screen">
      {/* Skip Navigation for screen readers (WCAG 2.4.1) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-6 focus:py-3 focus:bg-gold-500 focus:text-navy-700 focus:rounded-xl focus:font-bold focus:shadow-glow-gold focus:outline-none focus:ring-4 focus:ring-gold-400"
      >
        Skip to main content
      </a>

      {/* Header */}
      {!isImmersive && <Header />}

      {/* Main content with proper landmark. The keyed wrapper replays a
          short fade+slide on every route change (page transition). */}
      <main id="main-content" className={isImmersive ? '' : isHome ? 'pb-28' : 'pt-16 pb-24'}>
        <div key={location.pathname} className="animate-page-in motion-reduce:animate-none">
          <Routes>
            <Route path={ROUTES.ONBOARDING} element={<Onboarding />} />
            <Route path={ROUTES.PROFILE} element={<Profile />} />
            <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
            <Route path={ROUTES.HABITS} element={<HabitLog />} />
            <Route path={ROUTES.STREAKS} element={<Streaks />} />
            <Route path={ROUTES.ROOT_HABIT} element={<RootHabit />} />
            <Route path={ROUTES.MOOD} element={<Mood />} />
            <Route path={ROUTES.SHOP} element={<Shop />} />
            <Route path={ROUTES.CHAT} element={<Chat />} />
            {/* Aliados now lives inside the community hub */}
            <Route
              path={ROUTES.SOCIAL}
              element={<Navigate to={`${ROUTES.LEADERBOARD}?tab=social`} replace />}
            />
            <Route path={ROUTES.LEADERBOARD} element={<Leaderboard />} />
            <Route path={ROUTES.ARENA} element={<Arena />} />
            <Route path={ROUTES.REALMS} element={<Realms />} />
            <Route path={ROUTES.FOCUS} element={<Focus />} />
          </Routes>
        </div>
      </main>

      {!isImmersive && <Navigation />}
    </div>
  );
}

export function App() {
  return (
    <I18nProvider>
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Routes */}
              <Route path={ROUTES.WELCOME} element={<Welcome />} />
              <Route path={ROUTES.ONBOARDING} element={<OnboardingEntry />} />
              <Route path={ROUTES.LOGIN} element={<Login />} />
              <Route path={ROUTES.AUTH_CALLBACK} element={<AuthCallback />} />

              {/* Protected Routes */}
              <Route
                path="*"
                element={
                  <ProtectedRoute>
                    <AppProvider>
                      <ProtectedShell />

                      {/* Toast Notifications */}
                      <ToastContainer />
                    </AppProvider>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </I18nProvider>
  );
}