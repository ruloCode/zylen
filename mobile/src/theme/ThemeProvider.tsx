/**
 * ThemeProvider — applies the active theme's CSS variables to the whole app.
 *
 * Wraps children in a View carrying the nativewind vars() for the theme in
 * the Zustand store, so every `hsl(var(--x))` Tailwind color under it
 * resolves. Switching theme re-renders the subtree with the new palette
 * (the native equivalent of stamping `data-theme` on <html>).
 */

import React from 'react';
import { View } from 'react-native';
import { useAppStore } from '@/store';
import { themeVars } from './themeVars';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useAppStore((state) => state.theme);

  return (
    <View style={themeVars[theme]} className="flex-1 bg-background">
      {children}
    </View>
  );
}
