import { useEffect } from 'react';
import { initializeStore } from '@/store';

interface AppProviderProps {
  children: React.ReactNode;
}

/**
 * App-level provider that initializes the store on mount
 */
export function AppProvider({ children }: AppProviderProps) {
  useEffect(() => {
    // Initialize all store data from localStorage
    initializeStore();
  }, []);

  return <>{children}</>;
}
