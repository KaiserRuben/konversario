'use client';

import { useEffect } from 'react';
import { getTimeBasedAtmosphere } from '@/lib/design-system';
import { useUIStore } from '@/store/ui-store';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const atmosphereMode = useUIStore((state) => state.preferences.atmosphereMode);

  useEffect(() => {
    const updateTheme = () => {
      let shouldBeDark = false;

      if (atmosphereMode === 'auto') {
        const atmosphere = getTimeBasedAtmosphere();
        shouldBeDark = atmosphere.name === 'night';
      } else {
        shouldBeDark = atmosphereMode === 'night';
      }

      // Apply or remove dark class to html element
      if (shouldBeDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    // Update immediately
    updateTheme();

    // Update every minute to catch time changes
    const interval = setInterval(updateTheme, 60000);

    // No need for manual subscription since useEffect runs when atmosphereMode changes

    return () => {
      clearInterval(interval);
    };
  }, [atmosphereMode]);

  return <>{children}</>;
}