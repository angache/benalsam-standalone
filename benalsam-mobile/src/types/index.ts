// ===========================
// MOBILE TYPES (Re-export from shared-types)
// ===========================

// Re-export all types and utilities from shared-types
export {
  // Admin Types
  AdminRole,
  AdminPermission,
  AdminUser,
  
  // User Types
  User,
  UserProfile,
  
  // Listing Types
  Listing,
  ListingWithUser,
  ListingWithFavorite,
  ListingStatus,
  
  // Message and Conversation Types
  Message,
  Conversation,
  
  // Offer Types
  InventoryItem,
  Offer,
  OfferAttachment,
  
  // API Response Types
  ApiResponse,
  
  // Common Types
  ID,
  Pagination,
  QueryFilters,
  ServerConfig,
  JwtConfig,
  SecurityConfig,
  PaginationInfo,
  
  // Auth Types
  AuthCredentials,
  RegisterData,
  
  // User Feedback Types
  FeedbackType,
  UserFeedback,
  
  // User Statistics Types
  UserStatistics,
  MonthlyUsageStats,
  
  // Error Types
  AppError,
  
  // Location Types
  District,
  Province,
  
  // Internationalization Types
  Currency,
  Language,
  
  // Category Types
  Category,
  
  // Preference Types
  NotificationPreferences,
  ChatPreferences,
  PlatformPreferences,
  
  // Utility Functions
  formatPrice,
  formatDate,
  formatRelativeTime,
  validateEmail,
  getInitials,
  truncateText,
  getAvatarUrl,
  isPremiumUser,
  getTrustLevel,
  getTrustLevelColor,
  formatPhoneNumber
} from 'benalsam-shared-types';

// ===========================
// MOBILE-SPECIFIC TYPES
// ===========================

// Mobile-specific types that are not in shared-types

// Mobile notification preferences
export interface MobileNotificationPreferences {
  pushToken: string;
  deviceType: 'ios' | 'android';
  badgeCount: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

// Mobile device info
export interface MobileDeviceInfo {
  deviceId: string;
  platform: 'ios' | 'android';
  version: string;
  buildNumber: string;
  isTablet: boolean;
}

// Mobile app state
export interface MobileAppState {
  isActive: boolean;
  isBackground: boolean;
  lastActiveTime: string;
}

// Mobile-specific error types
export interface MobileError {
  code: string;
  message: string;
  stack?: string;
  timestamp: string;
  deviceInfo?: MobileDeviceInfo;
}

// Mobile-specific API response
export interface MobileApiResponse<T> {
  success: boolean;
  data?: T;
  error?: MobileError;
  timestamp: string;
  requestId: string;
}

// Mobile-specific user session
export interface MobileUserSession {
  userId: string;
  sessionToken: string;
  refreshToken: string;
  expiresAt: string;
  deviceId: string;
  lastActivity: string;
}

// Mobile-specific listing filters
export interface MobileListingFilters {
  search?: string;
  category?: string;
  location?: string;
  minBudget?: number;
  maxBudget?: number;
  urgency?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  attributes?: Record<string, string[]>;
  radius?: number; // Search radius in kilometers
  useLocation?: boolean; // Use device location
  sortByDistance?: boolean; // Sort by distance from user
  showOnlyFavorites?: boolean; // Show only favorited listings
}

// Mobile-specific offer data
export interface MobileOfferData {
  id: string;
  listing_id: string;
  offering_user_id: string;
  offered_item_id?: string;
  offered_price?: number;
  message: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  created_at: string;
  updated_at: string;
  isRead: boolean;
  notificationSent: boolean;
  lastInteraction: string;
}

// Mobile-specific conversation data
export interface MobileConversationData {
  id: string;
  user1_id: string;
  user2_id: string;
  offer_id?: string;
  listing_id?: string;
  created_at: string;
  updated_at: string;
  last_message_at?: string;
  unreadCount: number;
  lastMessagePreview: string;
  isMuted: boolean;
  isPinned: boolean;
}

// Mobile-specific user profile data
export interface MobileUserProfileData extends UserProfile {
  isOnline: boolean;
  lastSeen: string;
  deviceInfo?: MobileDeviceInfo;
  mobileNotificationPreferences: MobileNotificationPreferences;
}

// ===========================
// MOBILE-SPECIFIC UTILITY FUNCTIONS
// ===========================

// Validate Turkish phone number format
export const isValidTurkishPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^(\+90|0)?[5][0-9]{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// Capitalize first letter
export const capitalize = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

// Generate random ID for mobile
export const generateMobileId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

// Debounce function for mobile
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Check if device is online
export const isDeviceOnline = (): boolean => {
  return navigator.onLine !== false;
};

// Get device pixel ratio
export const getDevicePixelRatio = (): number => {
  return window.devicePixelRatio || 1;
};

// Format file size for mobile
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Check if image is cached
export const isImageCached = (url: string): boolean => {
  const img = new Image();
  img.src = url;
  return img.complete;
};

// Get mobile-friendly date format
export const formatMobileDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 24) {
    return dateObj.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } else if (diffInHours < 48) {
    return 'Dün';
  } else {
    return dateObj.toLocaleDateString('tr-TR', { 
      month: 'short', 
      day: 'numeric' 
    });
  }
}; 