import { StyleSheet, Platform } from 'react-native';

// Modern typography scale
export const typography = {
  // Font weights
  weights: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    heavy: '800' as const,
  },
  
  // Font sizes with line heights
  sizes: {
    xs: { fontSize: 12, lineHeight: 16 },
    sm: { fontSize: 14, lineHeight: 20 },
    base: { fontSize: 16, lineHeight: 24 },
    lg: { fontSize: 18, lineHeight: 28 },
    xl: { fontSize: 20, lineHeight: 28 },
    '2xl': { fontSize: 24, lineHeight: 32 },
    '3xl': { fontSize: 30, lineHeight: 36 },
    '4xl': { fontSize: 36, lineHeight: 40 },
  },
  
  // Font families
  families: {
    system: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'System',
    }),
    mono: Platform.select({
      ios: 'Courier',
      android: 'monospace',
      default: 'monospace',
    }),
  },
};

// Modern spacing scale
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
};

// Border radius scale
export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
};

// Shadow presets
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
};

export const getThemeStyles = (theme: 'light' | 'dark') => {
  const isLight = theme === 'light';
  
  const colors = {
    // Primary brand colors
    primary: {
      50: isLight ? '#fff7ed' : '#451a03',
      100: isLight ? '#ffedd5' : '#78350f',
      200: isLight ? '#fed7aa' : '#a16207',
      300: isLight ? '#fdba74' : '#ca8a04',
      400: isLight ? '#fb923c' : '#eab308',
      500: isLight ? '#f97316' : '#facc15',
      600: isLight ? '#ea580c' : '#eab308',
      700: isLight ? '#c2410c' : '#ca8a04',
      800: isLight ? '#9a3412' : '#a16207',
      900: isLight ? '#7c2d12' : '#78350f',
    },
    
    // Semantic colors
    background: isLight ? '#ffffff' : '#0a0a0a',
    surface: isLight ? '#f8fafc' : '#1a1a1a',
    card: isLight ? '#ffffff' : '#262626',
    border: isLight ? '#e2e8f0' : '#374151',
    
    // Text colors
    text: {
      primary: isLight ? '#1e293b' : '#f8fafc',
      secondary: isLight ? '#64748b' : '#94a3b8',
      tertiary: isLight ? '#94a3b8' : '#64748b',
      inverse: isLight ? '#f8fafc' : '#1e293b',
    },
    
    // Status colors
    success: {
      background: isLight ? '#dcfce7' : '#064e3b',
      foreground: isLight ? '#166534' : '#a7f3d0',
      border: isLight ? '#bbf7d0' : '#047857',
    },
    error: {
      background: isLight ? '#fef2f2' : '#7f1d1d',
      foreground: isLight ? '#dc2626' : '#fca5a5',
      border: isLight ? '#fecaca' : '#dc2626',
    },
    warning: {
      background: isLight ? '#fefce8' : '#78350f',
      foreground: isLight ? '#ca8a04' : '#fcd34d',
      border: isLight ? '#fde047' : '#f59e0b',
    },
    info: {
      background: isLight ? '#eff6ff' : '#1e3a8a',
      foreground: isLight ? '#2563eb' : '#93c5fd',
      border: isLight ? '#bfdbfe' : '#3b82f6',
    },
  };
  
  return StyleSheet.create({
    // Base styles
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    surface: {
      backgroundColor: colors.surface,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
      ...shadows.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    
    // Typography styles
    heading1: {
      ...typography.sizes['3xl'],
      fontWeight: typography.weights.bold,
      color: colors.text.primary,
      fontFamily: typography.families.system,
    },
    heading2: {
      ...typography.sizes['2xl'],
      fontWeight: typography.weights.bold,
      color: colors.text.primary,
      fontFamily: typography.families.system,
    },
    heading3: {
      ...typography.sizes.xl,
      fontWeight: typography.weights.semibold,
      color: colors.text.primary,
      fontFamily: typography.families.system,
    },
    body1: {
      ...typography.sizes.base,
      fontWeight: typography.weights.regular,
      color: colors.text.primary,
      fontFamily: typography.families.system,
    },
    body2: {
      ...typography.sizes.sm,
      fontWeight: typography.weights.regular,
      color: colors.text.secondary,
      fontFamily: typography.families.system,
    },
    caption: {
      ...typography.sizes.xs,
      fontWeight: typography.weights.medium,
      color: colors.text.tertiary,
      fontFamily: typography.families.system,
    },
    
    // Button styles
    buttonPrimary: {
      backgroundColor: colors.primary[500],
      borderRadius: borderRadius.lg,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      ...shadows.sm,
    },
    buttonSecondary: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.sm,
    },
    buttonText: {
      ...typography.sizes.base,
      fontWeight: typography.weights.semibold,
      textAlign: 'center' as const,
      fontFamily: typography.families.system,
    },
    
    // Input styles
    input: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      ...typography.sizes.base,
      color: colors.text.primary,
      fontFamily: typography.families.system,
    },
    
    // Utility styles
    shadow: shadows.md,
    shadowLarge: shadows.lg,
    rounded: { borderRadius: borderRadius.lg },
    roundedFull: { borderRadius: borderRadius.full },
  });
};

// Utility function to get theme-aware styles
export const createThemedStyles = (theme: 'light' | 'dark') => {
  const baseStyles = getThemeStyles(theme);
  const isLight = theme === 'light';
  
  return {
    ...baseStyles,
    
    // Modern card variants
    cardElevated: {
      ...baseStyles.card,
      ...shadows.lg,
    },
    cardFlat: {
      ...baseStyles.card,
      shadowOpacity: 0,
      elevation: 0,
      borderWidth: 1,
      borderColor: isLight ? '#e2e8f0' : '#374151',
    },
    
    // Glass morphism card
    cardGlass: {
      backgroundColor: isLight ? 'rgba(255,255,255,0.8)' : 'rgba(26,26,26,0.8)',
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: isLight ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
      backdropFilter: 'blur(10px)',
    },
    
    // Interactive states
    pressable: {
      activeOpacity: 0.7,
    },
    
    // Layout utilities
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    column: {
      flexDirection: 'column' as const,
    },
    center: {
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    spaceBetween: {
      justifyContent: 'space-between' as const,
    },
    
    // Spacing utilities
    gap: {
      xs: { gap: spacing.xs },
      sm: { gap: spacing.sm },
      md: { gap: spacing.md },
      lg: { gap: spacing.lg },
      xl: { gap: spacing.xl },
    },
    
    // Modern gradients
    gradientPrimary: {
      colors: isLight 
        ? ['#f97316', '#ea580c'] 
        : ['#facc15', '#eab308'],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    },
    gradientSecondary: {
      colors: isLight 
        ? ['#3b82f6', '#1d4ed8'] 
        : ['#60a5fa', '#3b82f6'],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    },
  };
};

// Theme constants are exported above with their declarations 