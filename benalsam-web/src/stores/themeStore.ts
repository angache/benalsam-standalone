import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'auto';

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
  white: string;
  black: string;
  gray: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
}

export interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
}

interface ThemeState {
  themeMode: ThemeMode;
  currentTheme: Theme;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  getCurrentColors: () => ThemeColors;
  isDarkMode: () => boolean;
}

const lightColors: ThemeColors = {
  primary: '#2563EB',
  secondary: '#059669',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  text: '#1E293B',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  error: '#DC2626',
  success: '#059669',
  warning: '#D97706',
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },
};

const darkColors: ThemeColors = {
  primary: '#60A5FA',
  secondary: '#34D399',
  background: '#000000',
  surface: '#111111',
  text: '#F8FAFC',
  textSecondary: '#CBD5E1',
  border: '#333333',
  error: '#F87171',
  success: '#34D399',
  warning: '#FBBF24',
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      themeMode: 'dark',
      currentTheme: { mode: 'dark', colors: darkColors },

      setTheme: (mode: ThemeMode) => {
        const colors = mode === 'light' ? lightColors : darkColors;
        const theme: Theme = { mode, colors };
        set({ themeMode: mode, currentTheme: theme });
        
        // Update document attribute for CSS
        document.documentElement.setAttribute('data-theme', mode);
      },

      toggleTheme: () => {
        const { themeMode } = get();
        const newMode: ThemeMode = themeMode === 'light' ? 'dark' : 'light';
        get().setTheme(newMode);
      },

      getCurrentColors: () => {
        return get().currentTheme.colors;
      },

      isDarkMode: () => {
        return get().currentTheme.mode === 'dark';
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ themeMode: state.themeMode }),
    }
  )
);

export const useThemeColors = () => {
  const theme = useThemeStore();
  return theme.getCurrentColors();
}; 