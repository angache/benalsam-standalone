// ===========================
// AI SUGGESTIONS INDEX
// ===========================

export * from './types';
export { default as aiSuggestionsRouter } from './aiSuggestions';
export { default as ElasticsearchSuggestionsService } from './services/ElasticsearchSuggestionsService';
export { default as CategorySuggestionsService } from './services/CategorySuggestionsService';
export { default as TrendingSuggestionsService } from './services/TrendingSuggestionsService';
export { default as PopularSuggestionsService } from './services/PopularSuggestionsService';
export * from './utils/queryBuilder';
export * from './utils/suggestionProcessor';
