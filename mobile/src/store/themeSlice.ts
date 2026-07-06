import { StateCreator } from 'zustand';
import {
  ThemeId,
  DEFAULT_THEME,
  applyTheme,
  getStoredTheme,
  persistTheme,
} from '@/utils/theme';

export interface ThemeSlice {
  theme: ThemeId;
  /** Set the active theme: applies it to the DOM, persists it, updates state. */
  setTheme: (id: ThemeId) => void;
  /** Load the persisted theme (or default) and apply it. Called on app init. */
  loadTheme: () => void;
}

export const createThemeSlice: StateCreator<ThemeSlice> = (set) => ({
  theme: DEFAULT_THEME,

  setTheme: (id: ThemeId) => {
    applyTheme(id);
    persistTheme(id);
    set({ theme: id });
  },

  loadTheme: () => {
    const id = getStoredTheme();
    applyTheme(id);
    set({ theme: id });
  },
});
