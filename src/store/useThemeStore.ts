import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_THEME_ID,
  THEME_PRESETS,
  ThemeDefinition,
  ThemeId
} from '../theme';

const THEME_STORAGE_KEY = '@adaptive_workout_theme_id_v1';

interface ThemeStoreState {
  themeId: ThemeId;
  theme: ThemeDefinition;
  isHydrated: boolean;
  setTheme: (themeId: ThemeId) => void;
  hydrateTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeStoreState>((set, get) => ({
  themeId: DEFAULT_THEME_ID,
  theme: THEME_PRESETS[DEFAULT_THEME_ID],
  isHydrated: false,

  setTheme: (themeId: ThemeId) => {
    const selectedTheme = THEME_PRESETS[themeId] || THEME_PRESETS[DEFAULT_THEME_ID];
    set({
      themeId,
      theme: selectedTheme
    });

    AsyncStorage.setItem(THEME_STORAGE_KEY, themeId).catch((err) => {
      console.warn('Failed to save theme setting:', err);
    });
  },

  hydrateTheme: async () => {
    try {
      const savedThemeId = (await AsyncStorage.getItem(THEME_STORAGE_KEY)) as ThemeId | null;
      if (savedThemeId && THEME_PRESETS[savedThemeId]) {
        set({
          themeId: savedThemeId,
          theme: THEME_PRESETS[savedThemeId],
          isHydrated: true
        });
        return;
      }
    } catch (e) {
      console.warn('Failed to hydrate theme from storage:', e);
    }
    set({ isHydrated: true });
  }
}));

export function useAppTheme() {
  const theme = useThemeStore((state) => state.theme);
  const themeId = useThemeStore((state) => state.themeId);
  const setTheme = useThemeStore((state) => state.setTheme);

  return { theme, themeId, setTheme };
}
