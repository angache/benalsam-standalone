/**
 * 📏 Spacing System
 * 
 * Tutarlı boşluklar için merkezi spacing sistemi.
 * Tüm uygulamada bu değerler kullanılmalı.
 */

// Base spacing unit (4px)
const BASE_UNIT = 4;

// Spacing scale (4px grid system)
export const spacing = {
  // Micro spacing
  xs: BASE_UNIT,        // 4px
  sm: BASE_UNIT * 2,    // 8px
  md: BASE_UNIT * 4,    // 16px
  lg: BASE_UNIT * 6,    // 24px
  xl: BASE_UNIT * 8,    // 32px
  xxl: BASE_UNIT * 12,  // 48px
  xxxl: BASE_UNIT * 16, // 64px
} as const;

// Common spacing patterns
export const commonSpacing = {
  // Screen edges
  screenHorizontal: spacing.md,  // 16px
  screenVertical: spacing.md,    // 16px
  
  // Section spacing
  sectionVertical: spacing.sm,   // 8px
  sectionHorizontal: spacing.md, // 16px
  
  // Card spacing
  cardPadding: spacing.md,       // 16px
  cardMargin: spacing.sm,        // 8px
  
  // List spacing
  listItemSpacing: spacing.sm,   // 8px
  listSectionSpacing: spacing.md, // 16px
  
  // Button spacing
  buttonPadding: spacing.md,     // 16px
  buttonMargin: spacing.sm,      // 8px
  
  // Input spacing
  inputPadding: spacing.md,      // 16px
  inputMargin: spacing.sm,       // 8px
  
  // Header spacing
  headerPadding: spacing.md,     // 16px
  headerMargin: spacing.sm,      // 8px
  
  // Content spacing
  contentPadding: spacing.md,    // 16px
  contentMargin: spacing.sm,     // 8px
} as const;

// Margin helpers
export const margins = {
  // Horizontal margins
  h: {
    xs: { marginHorizontal: spacing.xs },
    sm: { marginHorizontal: spacing.sm },
    md: { marginHorizontal: spacing.md },
    lg: { marginHorizontal: spacing.lg },
    xl: { marginHorizontal: spacing.xl },
  },
  
  // Vertical margins
  v: {
    xs: { marginVertical: spacing.xs },
    sm: { marginVertical: spacing.sm },
    md: { marginVertical: spacing.md },
    lg: { marginVertical: spacing.lg },
    xl: { marginVertical: spacing.xl },
  },
  
  // Top margins
  t: {
    xs: { marginTop: spacing.xs },
    sm: { marginTop: spacing.sm },
    md: { marginTop: spacing.md },
    lg: { marginTop: spacing.lg },
    xl: { marginTop: spacing.xl },
  },
  
  // Bottom margins
  b: {
    xs: { marginBottom: spacing.xs },
    sm: { marginBottom: spacing.sm },
    md: { marginBottom: spacing.md },
    lg: { marginBottom: spacing.lg },
    xl: { marginBottom: spacing.xl },
  },
  
  // Left margins
  l: {
    xs: { marginLeft: spacing.xs },
    sm: { marginLeft: spacing.sm },
    md: { marginLeft: spacing.md },
    lg: { marginLeft: spacing.lg },
    xl: { marginLeft: spacing.xl },
  },
  
  // Right margins
  r: {
    xs: { marginRight: spacing.xs },
    sm: { marginRight: spacing.sm },
    md: { marginRight: spacing.md },
    lg: { marginRight: spacing.lg },
    xl: { marginRight: spacing.xl },
  },
} as const;

// Padding helpers
export const paddings = {
  // Horizontal padding
  h: {
    xs: { paddingHorizontal: spacing.xs },
    sm: { paddingHorizontal: spacing.sm },
    md: { paddingHorizontal: spacing.md },
    lg: { paddingHorizontal: spacing.lg },
    xl: { paddingHorizontal: spacing.xl },
  },
  
  // Vertical padding
  v: {
    xs: { paddingVertical: spacing.xs },
    sm: { paddingVertical: spacing.sm },
    md: { paddingVertical: spacing.md },
    lg: { paddingVertical: spacing.lg },
    xl: { paddingVertical: spacing.xl },
  },
  
  // All sides padding
  all: {
    xs: { padding: spacing.xs },
    sm: { padding: spacing.sm },
    md: { padding: spacing.md },
    lg: { padding: spacing.lg },
    xl: { padding: spacing.xl },
  },
} as const;

// Common layout patterns
export const layout = {
  // Screen container
  screen: {
    paddingHorizontal: commonSpacing.screenHorizontal,
    paddingVertical: commonSpacing.screenVertical,
  },
  
  // Section container
  section: {
    marginVertical: commonSpacing.sectionVertical,
    paddingHorizontal: commonSpacing.sectionHorizontal,
  },
  
  // Card container
  card: {
    padding: commonSpacing.cardPadding,
    margin: commonSpacing.cardMargin,
  },
  
  // List container
  list: {
    paddingHorizontal: commonSpacing.screenHorizontal,
  },
  
  // List item
  listItem: {
    marginBottom: commonSpacing.listItemSpacing,
  },
  
  // Header
  header: {
    paddingHorizontal: commonSpacing.headerPadding,
    paddingVertical: commonSpacing.headerPadding,
  },
  
  // Content
  content: {
    paddingHorizontal: commonSpacing.contentPadding,
    paddingVertical: commonSpacing.contentPadding,
  },
} as const;

// Gap helpers for flexbox
export const gaps = {
  xs: spacing.xs,  // 4px
  sm: spacing.sm,  // 8px
  md: spacing.md,  // 16px
  lg: spacing.lg,  // 24px
  xl: spacing.xl,  // 32px
} as const;

// Border radius helpers
export const borderRadius = {
  xs: spacing.xs,  // 4px
  sm: spacing.sm,  // 8px
  md: spacing.md,  // 16px
  lg: spacing.lg,  // 24px
  xl: spacing.xl,  // 32px
} as const;

// Shadow helpers
export const shadows = {
  sm: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
} as const;

export default {
  spacing,
  commonSpacing,
  margins,
  paddings,
  layout,
  gaps,
  borderRadius,
  shadows,
}; 