import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark';

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
  // Güven ve profesyonellik - daha sıcak mavi ton
  primary: '#2563EB',
  // Başarı ve büyüme - daha canlı yeşil
  secondary: '#059669',
  // Temizlik ve sakinlik - daha yumuşak gri
  background: '#FAFAFA',
  // Kartlar için - daha belirgin kontrast
  surface: '#FFFFFF',
  // Ana metin - daha koyu ve okunabilir
  text: '#1E293B',
  // İkincil metin - daha yumuşak
  textSecondary: '#64748B',
  // Border - daha belirgin
  border: '#E2E8F0',
  // Hata - daha dikkat çekici
  error: '#DC2626',
  // Başarı - daha canlı
  success: '#059669',
  // Uyarı - daha sıcak
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
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ themeMode: state.themeMode }),
    }
  )
);

export const useThemeColors = () => {
  const theme = useThemeStore((state) => state.currentTheme);
  return theme.colors;
};
