import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navigation, Header } from '@/components/layout';
import { AppProvider } from '@/app/AppProvider';
import { I18nProvider } from '@/components/I18nProvider';
import { AuthProvider } from '@/features/auth/context/AuthContext';
import { ProtectedRoute } from '@/components/guards/ProtectedRoute';
import { ToastContainer } from '@/components/ui/Toast';
import { ROUTES } from '@/constants';

// Lazy load pages for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const HabitLog = lazy(() => import('./pages/HabitLog').then(m => ({ default: m.HabitLog })));
const Streaks = lazy(() => import('./pages/Streaks').then(m => ({ default: m.Streaks })));
const RootHabit = lazy(() => import('./pages/RootHabit').then(m => ({ default: m.RootHabit })));
const Shop = lazy(() => import('./pages/Shop').then(m => ({ default: m.Shop })));
const Chat = lazy(() => import('./pages/Chat').then(m => ({ default: m.Chat })));
const Onboarding = lazy(() => import('./pages/Onboarding').then(m => ({ default: m.Onboarding })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
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

export function App() {
  return (
    <I18nProvider>
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Routes */}
              <Route path={ROUTES.LOGIN} element={<Login />} />
              <Route path={ROUTES.AUTH_CALLBACK} element={<AuthCallback />} />

              {/* Protected Routes */}
              <Route
                path="*"
                element={
                  <ProtectedRoute>
                    <AppProvider>
                      <div className="w-full min-h-screen">
                        {/* Skip Navigation for screen readers (WCAG 2.4.1) */}
                        <a
                          href="#main-content"
                          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-6 focus:py-3 focus:bg-gold-500 focus:text-navy-700 focus:rounded-xl focus:font-bold focus:shadow-glow-gold focus:outline-none focus:ring-4 focus:ring-gold-400"
                        >
                          Skip to main content
                        </a>

                        {/* Header */}
                        <Header />

                        {/* Main content with proper landmark */}
                        <main id="main-content" className="pt-16 pb-24">
                          <Routes>
                            <Route path={ROUTES.ONBOARDING} element={<Onboarding />} />
                            <Route path={ROUTES.PROFILE} element={<Profile />} />
                            <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
                            <Route path={ROUTES.HABITS} element={<HabitLog />} />
                            <Route path={ROUTES.STREAKS} element={<Streaks />} />
                            <Route path={ROUTES.ROOT_HABIT} element={<RootHabit />} />
                            <Route path={ROUTES.SHOP} element={<Shop />} />
                            <Route path={ROUTES.CHAT} element={<Chat />} />
                          </Routes>
                        </main>

                        <Navigation />
                      </div>

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