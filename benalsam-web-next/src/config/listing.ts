// Listing Configuration Constants
export const LISTING_CONFIG = {
  VALIDATION: {
    MIN_TITLE_LENGTH: 3,
    MAX_TITLE_LENGTH: 100,
    MIN_DESCRIPTION_LENGTH: 10,
    MAX_DESCRIPTION_LENGTH: 2000,
    MIN_BUDGET: 0,
    MAX_BUDGET: 999999999,
    MAX_IMAGES: 10,
    MIN_IMAGES: 0
  },
  UPLOAD: {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    MAX_FILES_PER_UPLOAD: 10,
    COMPRESSION_QUALITY: 0.8
  },
  JOB_POLLING: {
    MAX_ATTEMPTS: 60,
    INTERVAL_MS: 2000,
    TIMEOUT_MS: 120000 // 2 minutes
  },
  PROGRESS: {
    IMAGE_UPLOAD_RATIO: 0.5, // 50% of total progress
    LISTING_CREATION_RATIO: 0.5 // 50% of total progress
  },
  CATEGORY: {
    MAX_PATH_DEPTH: 3,
    SEPARATOR: ' > '
  },
  URGENCY: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high'
  } as const,
  CONTACT_PREFERENCE: {
    SITE_MESSAGE: 'site_message',
    PHONE: 'phone',
    BOTH: 'both'
  } as const
} as const;

export const UPLOAD_CONFIG = {
  CLOUDINARY: {
    FOLDER: 'listings',
    TRANSFORMATION: {
      quality: 'auto',
      format: 'auto',
      width: 1200,
      height: 1200,
      crop: 'limit'
    },
    THUMBNAIL: {
      width: 300,
      height: 300,
      crop: 'fill',
      quality: 'auto'
    },
    MEDIUM: {
      width: 600,
      height: 600,
      crop: 'limit',
      quality: 'auto'
    }
  },
  VALIDATION: {
    MIN_FILE_SIZE: 1024, // 1KB
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
    ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  }
} as const;

export const VALIDATION_CONFIG = {
  TITLE: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 100,
    PATTERN: /^[a-zA-Z0-9\s\-_.,!?()]+$/
  },
  DESCRIPTION: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 2000,
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li']
  },
  BUDGET: {
    MIN: 0,
    MAX: 999999999,
    DECIMAL_PLACES: 2
  },
  LOCATION: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
    PATTERN: /^[a-zA-Z\s\-.,]+$/
  },
  IMAGES: {
    MIN_COUNT: 0,
    MAX_COUNT: 10,
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  }
} as const;

export const ERROR_MESSAGES = {
  VALIDATION: {
    TITLE_TOO_SHORT: 'Başlık en az 3 karakter olmalıdır',
    TITLE_TOO_LONG: 'Başlık en fazla 100 karakter olabilir',
    DESCRIPTION_TOO_SHORT: 'Açıklama en az 10 karakter olmalıdır',
    DESCRIPTION_TOO_LONG: 'Açıklama en fazla 2000 karakter olabilir',
    BUDGET_INVALID: 'Geçerli bir bütçe giriniz',
    LOCATION_REQUIRED: 'Konum bilgisi gereklidir',
    IMAGES_TOO_MANY: 'En fazla 10 görsel yükleyebilirsiniz',
    IMAGE_TOO_LARGE: 'Görsel boyutu 5MB\'dan küçük olmalıdır',
    INVALID_IMAGE_TYPE: 'Sadece JPG, PNG, WebP ve GIF formatları desteklenir'
  },
  UPLOAD: {
    FAILED: 'Görsel yükleme başarısız',
    QUOTA_EXCEEDED: 'Günlük yükleme kotanız doldu',
    NETWORK_ERROR: 'Ağ bağlantısı hatası',
    INVALID_FILE: 'Geçersiz dosya formatı'
  },
  SERVICE: {
    LISTING_CREATE_FAILED: 'İlan oluşturma başarısız',
    JOB_TIMEOUT: 'İşlem zaman aşımına uğradı',
    SERVICE_UNAVAILABLE: 'Servis geçici olarak kullanılamıyor',
    AUTHENTICATION_FAILED: 'Kimlik doğrulama başarısız',
    AUTHORIZATION_FAILED: 'Bu işlem için yetkiniz yok'
  }
} as const;

// Type exports for better type safety
export type UrgencyLevel = typeof LISTING_CONFIG.URGENCY[keyof typeof LISTING_CONFIG.URGENCY];
export type ContactPreference = typeof LISTING_CONFIG.CONTACT_PREFERENCE[keyof typeof LISTING_CONFIG.CONTACT_PREFERENCE];
export type AllowedImageType = typeof UPLOAD_CONFIG.VALIDATION.ALLOWED_MIME_TYPES[number];
