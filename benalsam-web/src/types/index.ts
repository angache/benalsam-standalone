// ===========================
// RE-EXPORT SHARED TYPES
// ===========================

// Re-export all types from shared-types package
export * from 'benalsam-shared-types';

// ===========================
// WEB-SPECIFIC TYPES (if any)
// ===========================

// Extended QueryFilters for web-specific functionality
export interface ExtendedQueryFilters extends QueryFilters {
  selectedCategories?: Array<{ name: string; icon?: any }>;
} 