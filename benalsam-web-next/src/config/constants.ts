// Global Application Constants
// Centralized configuration for all magic numbers and constants

// File Size Constants
export const FILE_SIZE = {
  BYTES: {
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024
  },
  LIMITS: {
    MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
    MIN_IMAGE_SIZE: 1024, // 1KB
    MAX_PROFILE_IMAGE_SIZE: 2 * 1024 * 1024, // 2MB
    MAX_DOCUMENT_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_VIDEO_SIZE: 50 * 1024 * 1024 // 50MB
  }
} as const;

// Rating Constants
export const RATING = {
  MIN: 1,
  MAX: 5,
  DECIMAL_PLACES: 1,
  DISTRIBUTION: {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0
  }
} as const;

// Category Constants
export const CATEGORY = {
  ID_RANGES: {
    MAIN_CATEGORY: { MIN: 1, MAX: 13 },
    SUB_CATEGORY: { MIN: 101, MAX: 1303 },
    SUB_SUB_CATEGORY: { MIN: 1001, MAX: 9999 }
  },
  MULTIPLIERS: {
    SUB_CATEGORY: 100,
    SUB_SUB_CATEGORY: 10
  },
  MAX_DEPTH: 3,
  SEPARATOR: ' > '
} as const;

// Time Constants
export const TIME = {
  MILLISECONDS: {
    SECOND: 1000,
    MINUTE: 60 * 1000,
    HOUR: 60 * 60 * 1000,
    DAY: 24 * 60 * 60 * 1000
  },
  SECONDS: {
    MINUTE: 60,
    HOUR: 60 * 60,
    DAY: 24 * 60 * 60
  },
  RETRY_DELAYS: {
    NETWORK_ERROR: 5000, // 5 seconds
    RATE_LIMIT: 60000, // 1 minute
    SERVICE_ERROR: 10000, // 10 seconds
    VALIDATION_ERROR: 0 // No retry
  }
} as const;

// Pagination Constants
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 5,
  DEFAULT_PAGE: 1
} as const;

// Cache Constants
export const CACHE = {
  TTL: {
    SHORT: 5 * 60 * 1000, // 5 minutes
    MEDIUM: 30 * 60 * 1000, // 30 minutes
    LONG: 60 * 60 * 1000, // 1 hour
    VERY_LONG: 24 * 60 * 60 * 1000 // 24 hours
  },
  KEYS: {
    PREFIX: 'benalsam_',
    SEPARATOR: '_',
    VERSION: 'v1'
  }
} as const;

// API Constants
export const API = {
  TIMEOUTS: {
    DEFAULT: 30000, // 30 seconds
    UPLOAD: 120000, // 2 minutes
    DOWNLOAD: 60000 // 1 minute
  },
  RETRY: {
    MAX_ATTEMPTS: 3,
    BACKOFF_MULTIPLIER: 2,
    INITIAL_DELAY: 1000
  },
  RATE_LIMITS: {
    REQUESTS_PER_MINUTE: 60,
    REQUESTS_PER_HOUR: 1000,
    UPLOADS_PER_DAY: 100
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
    },
    EASING: {
      EASE_IN: 'cubic-bezier(0.4, 0, 1, 1)',
      EASE_OUT: 'cubic-bezier(0, 0, 0.2, 1)',
      EASE_IN_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)'
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

// Validation Constants
export const VALIDATION = {
  PATTERNS: {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE: /^[\+]?[1-9][\d]{0,15}$/,
    URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
    ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
    TURKISH_CHARACTERS: /^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/
  },
  LENGTHS: {
    MIN_PASSWORD: 8,
    MAX_PASSWORD: 128,
    MIN_USERNAME: 3,
    MAX_USERNAME: 30,
    MIN_NAME: 2,
    MAX_NAME: 50,
    MIN_TITLE: 3,
    MAX_TITLE: 100,
    MIN_DESCRIPTION: 10,
    MAX_DESCRIPTION: 2000
  }
} as const;

// Error Constants
export const ERROR = {
  CODES: {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    UPLOAD_ERROR: 'UPLOAD_ERROR',
    SERVICE_ERROR: 'SERVICE_ERROR',
    NETWORK_ERROR: 'NETWORK_ERROR',
    AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
    AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
    RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
    QUOTA_EXCEEDED_ERROR: 'QUOTA_EXCEEDED_ERROR',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR'
  },
  SEVERITY: {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL'
  }
} as const;

// Performance Constants
export const PERFORMANCE = {
  THRESHOLDS: {
    LCP: { GOOD: 2500, NEEDS_IMPROVEMENT: 4000, POOR: 4000 },
    FID: { GOOD: 100, NEEDS_IMPROVEMENT: 300, POOR: 300 },
    CLS: { GOOD: 0.1, NEEDS_IMPROVEMENT: 0.25, POOR: 0.25 },
    TTFB: { GOOD: 800, NEEDS_IMPROVEMENT: 1800, POOR: 1800 }
  },
  MONITORING: {
    SAMPLE_RATE: 0.1, // 10% of users
    BATCH_SIZE: 10,
    FLUSH_INTERVAL: 5000 // 5 seconds
  }
} as const;

// Security Constants
export const SECURITY = {
  TOKEN: {
    ACCESS_TOKEN_TTL: 15 * 60 * 1000, // 15 minutes
    REFRESH_TOKEN_TTL: 7 * 24 * 60 * 60 * 1000, // 7 days
    MAX_REFRESH_ATTEMPTS: 3
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SYMBOLS: true
  },
  RATE_LIMITS: {
    LOGIN_ATTEMPTS: 5,
    LOGIN_WINDOW: 15 * 60 * 1000, // 15 minutes
    PASSWORD_RESET_ATTEMPTS: 3,
    PASSWORD_RESET_WINDOW: 60 * 60 * 1000 // 1 hour
  }
} as const;

// Export type for better type safety
export type FileSizeLimit = typeof FILE_SIZE.LIMITS[keyof typeof FILE_SIZE.LIMITS];
export type RatingValue = typeof RATING[keyof typeof RATING];
export type TimeValue = typeof TIME[keyof typeof TIME];
export type ValidationPattern = typeof VALIDATION.PATTERNS[keyof typeof VALIDATION.PATTERNS];
export type ErrorCode = typeof ERROR.CODES[keyof typeof ERROR.CODES];
export type ErrorSeverity = typeof ERROR.SEVERITY[keyof typeof ERROR.SEVERITY];
