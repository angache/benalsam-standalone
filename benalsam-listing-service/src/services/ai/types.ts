/**
 * AI Service Types
 * Shared types for AI service modules
 */

export interface AttributeSuggestion {
  key: string;
  value: any;
  confidence: number;
  reason: string;
}

