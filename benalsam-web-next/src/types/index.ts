// ===========================
// RE-EXPORT SHARED TYPES
// ===========================

// Re-export only client-safe types from shared-types package
export type {
  // Core types
  User,
  Listing,
  Category,
  ListingStatus,
  ListingReport,
  QueryFilters,
  // Analytics types
  AnalyticsEventType,
  AnalyticsEventProperties,
  // Messaging types
  Conversation,
  Message,
  // Utility types
  ApiResponse,
  PaginatedResponse
} from 'benalsam-shared-types';

// Re-export utility functions
export { formatDate } from 'benalsam-shared-types';

// ===========================
// WEB-SPECIFIC TYPES (if any)
// ===========================

// Extended QueryFilters for web-specific functionality
export interface ExtendedQueryFilters extends QueryFilters {
  selectedCategories?: Array<{ name: string; icon?: any }>;
} 