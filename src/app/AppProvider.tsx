import { useEffect, useState } from 'react';
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
  const [isStoreInitializing, setIsStoreInitializing] = useState(true);

  useEffect(() => {
    // Initialize all store data from Supabase
    const init = async () => {
      await initializeStore();
      setIsStoreInitializing(false);
    };

    init();
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

  // Show loading while initializing store
  if (isStoreInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-charcoal-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-pale-100 text-lg">Loading Zylen...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
