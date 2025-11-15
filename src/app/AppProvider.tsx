import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { initializeStore, useAppStore } from '@/store';
import { ROUTES } from '@/constants/routes';

interface AppProviderProps {
  children: React.ReactNode;
}

/**
 * App-level provider that initializes the store on mount
 * Also handles onboarding redirects
 */
export function AppProvider({ children }: AppProviderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppStore((state) => state.user);
  const isInitialized = useAppStore((state) => state.isInitialized);

  useEffect(() => {
    // Initialize all store data from localStorage
    initializeStore();
  }, []);

  useEffect(() => {
    // Redirect to onboarding if user hasn't completed it
    if (isInitialized && user) {
      if (
        !user.hasCompletedOnboarding &&
        location.pathname !== ROUTES.ONBOARDING
      ) {
        navigate(ROUTES.ONBOARDING, { replace: true });
      }
    }
  }, [user, isInitialized, location.pathname, navigate]);

  return <>{children}</>;
}
