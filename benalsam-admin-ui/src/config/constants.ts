// Global Application Constants
// Centralized configuration for all magic numbers and constants

// API Constants
export const API = {
  TIMEOUTS: {
    DEFAULT: 30000, // 30 seconds
    UPLOAD: 180000, // 3 minutes for Supabase CLI commands
    DOWNLOAD: 60000 // 1 minute
  },
  RETRY: {
    MAX_ATTEMPTS: 3,
    BACKOFF_MULTIPLIER: 2,
    INITIAL_DELAY: 1000
  }
} as const;

// UI Constants
export const UI = {
  BREAKPOINTS: {
    MOBILE: 768,
    TABLET: 1024,
    DESKTOP: 1280,
    LARGE_DESKTOP: 1536
  },
  ANIMATION: {
    DURATION: {
      FAST: 150,
      NORMAL: 300,
      SLOW: 500
    }
  },
  Z_INDEX: {
    DROPDOWN: 1000,
    STICKY: 1020,
    FIXED: 1030,
    MODAL_BACKDROP: 1040,
    MODAL: 1050,
    POPOVER: 1060,
    TOOLTIP: 1070
  }
} as const;

// Table Constants
export const TABLE = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 5,
  DEFAULT_PAGE: 1
} as const;

// Form Constants
export const FORM = {
  VALIDATION: {
    EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE_PATTERN: /^[\+]?[1-9][\d]{0,15}$/,
    PASSWORD_MIN_LENGTH: 8,
    USERNAME_MIN_LENGTH: 3,
    USERNAME_MAX_LENGTH: 30,
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 50
  }
} as const;

// Notification Constants
export const NOTIFICATION = {
  DURATION: {
    SUCCESS: 3000,
    ERROR: 5000,
    WARNING: 4000,
    INFO: 3000
  },
  TYPES: {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
  } as const
} as const;

// Chart Constants
export const CHART = {
  COLORS: {
    PRIMARY: '#1976d2',
    SECONDARY: '#dc004e',
    SUCCESS: '#2e7d32',
    WARNING: '#ed6c02',
    ERROR: '#d32f2f',
    INFO: '#0288d1'
  },
  TYPES: {
    LINE: 'line',
    BAR: 'bar',
    PIE: 'pie',
    DOUGHNUT: 'doughnut'
  } as const
} as const;

// Modal Constants
export const MODAL = {
  SIZES: {
    SM: 'sm',
    MD: 'md',
    LG: 'lg',
    XL: 'xl'
  } as const
} as const;

// Theme Constants
export const THEME = {
  COLORS: {
    PRIMARY: '#1976d2',
    SECONDARY: '#dc004e',
    SUCCESS: '#2e7d32',
    WARNING: '#ed6c02',
    ERROR: '#d32f2f',
    INFO: '#0288d1',
    BACKGROUND: '#ffffff',
    SURFACE: '#f5f5f5',
    TEXT_PRIMARY: '#212121',
    TEXT_SECONDARY: '#757575',
    TEXT_DISABLED: '#bdbdbd',
    BORDER: '#e0e0e0'
  }
} as const;

// Storage Constants
export const STORAGE = {
  KEYS: {
    AUTH_TOKEN: 'auth_token',
    USER_DATA: 'user_data',
    THEME: 'theme',
    PREFERENCES: 'preferences'
  },
  TTL: {
    SHORT: 5 * 60 * 1000, // 5 minutes
    MEDIUM: 30 * 60 * 1000, // 30 minutes
    LONG: 60 * 60 * 1000, // 1 hour
    VERY_LONG: 24 * 60 * 60 * 1000 // 24 hours
  }
} as const;

// Permission Constants
export const PERMISSIONS = {
  LISTINGS: {
    VIEW: 'listings:view',
    CREATE: 'listings:create',
    EDIT: 'listings:edit',
    DELETE: 'listings:delete',
    MODERATE: 'listings:moderate'
  },
  USERS: {
    VIEW: 'users:view',
    CREATE: 'users:create',
    EDIT: 'users:edit',
    DELETE: 'users:delete'
  },
  CATEGORIES: {
    VIEW: 'categories:view',
    CREATE: 'categories:create',
    EDIT: 'categories:edit',
    DELETE: 'categories:delete'
  },
  ANALYTICS: {
    VIEW: 'analytics:view',
    EXPORT: 'analytics:export'
  },
  ADMIN: {
    MANAGE: 'admin:manage',
    SETTINGS: 'admin:settings'
  }
} as const;

// Export type for better type safety
export type ApiTimeout = typeof API.TIMEOUTS[keyof typeof API.TIMEOUTS];
export type UiBreakpoint = typeof UI.BREAKPOINTS[keyof typeof UI.BREAKPOINTS];
export type NotificationType = typeof NOTIFICATION.TYPES[keyof typeof NOTIFICATION.TYPES];
export type ChartType = typeof CHART.TYPES[keyof typeof CHART.TYPES];
export type ModalSize = typeof MODAL.SIZES[keyof typeof MODAL.SIZES];
export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS][keyof typeof PERMISSIONS[keyof typeof PERMISSIONS]];
