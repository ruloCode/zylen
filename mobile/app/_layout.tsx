import '../global.css';

import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import * as ScreenOrientation from 'expo-screen-orientation';
import Toast from 'react-native-toast-message';
import { useFonts } from 'expo-font';
import { BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';

import { kv } from '@/lib/kvStorage';
import { initI18n } from '@/services/i18n';
import { useAppStore } from '@/store';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { AuthProvider } from '@/features/auth/context/AuthContext';
import { AuthGate } from '@/providers/AuthGate';

void SplashScreen.preventAutoHideAsync();

/** Status bar icons follow the active theme (nous is the only light theme). */
function ThemedStatusBar() {
  const theme = useAppStore((state) => state.theme);
  return <StatusBar style={theme === 'nous' ? 'dark' : 'light'} />;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    BebasNeue_400Regular,
    JetBrainsMono_400Regular,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  // The app lives in portrait; the Arena unlocks landscape while playing
  // (app.json orientation is "default" so runtime locks can switch).
  useEffect(() => {
    void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  }, []);

  // Boot sequence: hydrate the sync storage mirror FIRST (theme, language and
  // ported localStorage reads depend on it), then init i18n + theme.
  const [booted, setBooted] = useState(false);
  useEffect(() => {
    void (async () => {
      await kv.hydrate();
      initI18n();
      useAppStore.getState().loadTheme();
      setBooted(true);
    })();
  }, []);

  const ready = booted && fontsLoaded;
  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <ThemedStatusBar />
          <AuthGate>
            <Stack
              screenOptions={{
                headerShown: false,
                animation: 'fade',
                contentStyle: { backgroundColor: 'transparent' },
              }}
            />
          </AuthGate>
          <Toast />
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
