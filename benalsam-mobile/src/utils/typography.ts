/**
 * 🔤 Typography System
 * 
 * Tutarlı yazı tipleri için merkezi typography sistemi.
 * Tüm uygulamada bu değerler kullanılmalı.
 */

// Font sizes (based on 4px grid)
export const fontSize = {
  // Display sizes
  display1: 32, // 32px - Hero titles
  display2: 28, // 28px - Large titles
  display3: 24, // 24px - Section titles
  
  // Heading sizes
  h1: 20, // 20px - Main headings
  h2: 18, // 18px - Sub headings
  h3: 16, // 16px - Card titles
  h4: 14, // 14px - Small headings
  
  // Body sizes
  body1: 16, // 16px - Main body text
  body2: 14, // 14px - Secondary body text
  body3: 12, // 12px - Small body text
  
  // Caption sizes
  caption1: 12, // 12px - Captions
  caption2: 10, // 10px - Small captions
  
  // Button sizes
  button1: 16, // 16px - Primary buttons
  button2: 14, // 14px - Secondary buttons
  button3: 12, // 12px - Small buttons
} as const;

// Font weights
export const fontWeight = {
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const;

// Line heights (based on font size)
export const lineHeight = {
  // Display line heights
  display1: 40, // 32px font + 8px
  display2: 36, // 28px font + 8px
  display3: 32, // 24px font + 8px
  
  // Heading line heights
  h1: 28, // 20px font + 8px
  h2: 24, // 18px font + 6px
  h3: 22, // 16px font + 6px
  h4: 20, // 14px font + 6px
  
  // Body line heights
  body1: 22, // 16px font + 6px
  body2: 20, // 14px font + 6px
  body3: 16, // 12px font + 4px
  
  // Caption line heights
  caption1: 16, // 12px font + 4px
  caption2: 14, // 10px font + 4px
  
  // Button line heights
  button1: 22, // 16px font + 6px
  button2: 20, // 14px font + 6px
  button3: 16, // 12px font + 4px
} as const;

// Typography variants
export const typography = {
  // Display variants
  display1: {
    fontSize: fontSize.display1,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.display1,
  },
  display2: {
    fontSize: fontSize.display2,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.display2,
  },
  display3: {
    fontSize: fontSize.display3,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.display3,
  },
  
  // Heading variants
  h1: {
    fontSize: fontSize.h1,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.h1,
  },
  h2: {
    fontSize: fontSize.h2,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.h2,
  },
  h3: {
    fontSize: fontSize.h3,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.h3,
  },
  h4: {
    fontSize: fontSize.h4,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.h4,
  },
  
  // Body variants
  body1: {
    fontSize: fontSize.body1,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.body1,
  },
  body2: {
    fontSize: fontSize.body2,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.body2,
  },
  body3: {
    fontSize: fontSize.body3,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.body3,
  },
  
  // Caption variants
  caption1: {
    fontSize: fontSize.caption1,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.caption1,
  },
  caption2: {
    fontSize: fontSize.caption2,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.caption2,
  },
  
  // Button variants
  button1: {
    fontSize: fontSize.button1,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.button1,
  },
  button2: {
    fontSize: fontSize.button2,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.button2,
  },
  button3: {
    fontSize: fontSize.button3,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.button3,
  },
  
  // Special variants
  title: {
    fontSize: fontSize.h1,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.h1,
  },
  subtitle: {
    fontSize: fontSize.h3,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.h3,
  },
  label: {
    fontSize: fontSize.body2,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.body2,
  },
  price: {
    fontSize: fontSize.h2,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.h2,
  },
  priceSmall: {
    fontSize: fontSize.h3,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.h3,
  },
  badge: {
    fontSize: fontSize.caption1,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.caption1,
  },
} as const;

// Text alignment
export const textAlign = {
  left: 'left',
  center: 'center',
  right: 'right',
  justify: 'justify',
} as const;

// Text decoration
export const textDecoration = {
  none: 'none',
  underline: 'underline',
  lineThrough: 'line-through',
} as const;

// Text transform
export const textTransform = {
  none: 'none',
  uppercase: 'uppercase',
  lowercase: 'lowercase',
  capitalize: 'capitalize',
} as const;

// Common text patterns
export const textPatterns = {
  // Section headers
  sectionHeader: {
    ...typography.h1,
    fontWeight: fontWeight.bold,
  },
  
  // Card titles
  cardTitle: {
    ...typography.h3,
    fontWeight: fontWeight.semibold,
  },
  
  // List item titles
  listItemTitle: {
    ...typography.body1,
    fontWeight: fontWeight.semibold,
  },
  
  // List item subtitle
  listItemSubtitle: {
    ...typography.body2,
    fontWeight: fontWeight.normal,
  },
  
  // Price display
  priceDisplay: {
    ...typography.price,
    fontWeight: fontWeight.bold,
  },
  
  // Button text
  buttonText: {
    ...typography.button1,
    fontWeight: fontWeight.semibold,
  },
  
  // Input label
  inputLabel: {
    ...typography.body2,
    fontWeight: fontWeight.medium,
  },
  
  // Error text
  errorText: {
    ...typography.body2,
    fontWeight: fontWeight.normal,
  },
  
  // Success text
  successText: {
    ...typography.body2,
    fontWeight: fontWeight.normal,
  },
  
  // Warning text
  warningText: {
    ...typography.body2,
    fontWeight: fontWeight.normal,
  },
  
  // Info text
  infoText: {
    ...typography.body2,
    fontWeight: fontWeight.normal,
  },
} as const;

// Helper functions
export const createTypography = (
  variant: keyof typeof typography,
  overrides?: Partial<typeof typography[keyof typeof typography]>
) => ({
  ...typography[variant],
  ...overrides,
});

export const createTextPattern = (
  pattern: keyof typeof textPatterns,
  overrides?: Partial<typeof textPatterns[keyof typeof textPatterns]>
) => ({
  ...textPatterns[pattern],
  ...overrides,
});

export default {
  fontSize,
  fontWeight,
  lineHeight,
  typography,
  textAlign,
  textDecoration,
  textTransform,
  textPatterns,
  createTypography,
  createTextPattern,
}; 