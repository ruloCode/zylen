import React, { useEffect, useState } from 'react';
import i18n from '@/services/i18n';

/**
 * I18nProvider - Ensures i18next is fully initialized before rendering children
 */
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (i18n.isInitialized) {
      setIsReady(true);
    } else {
      i18n.on('initialized', () => {
        setIsReady(true);
      });
    }
  }, []);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500" aria-hidden="true"></div>
      </div>
    );
  }

  return <>{children}</>;
}
