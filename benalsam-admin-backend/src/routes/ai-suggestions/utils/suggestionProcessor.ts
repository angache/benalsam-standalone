// ===========================
// SUGGESTION PROCESSOR UTILITY
// ===========================

import { AISuggestion, CategorySuggestion, ElasticsearchSuggestion, SuggestionProcessorOptions } from '../types';

export function extractSuggestionText(suggestion: CategorySuggestion): string {
  try {
    if (suggestion.suggestion_type === 'keywords') {
      const keywords = suggestion.suggestion_data?.suggestions || [];
      return keywords.join(', ');
    } else if (suggestion.suggestion_type === 'title' || suggestion.suggestion_type === 'description') {
      const suggestions = suggestion.suggestion_data?.suggestions || [];
      return suggestions[0] || 'AI Önerisi';
    } else {
      return 'AI Önerisi';
    }
  } catch (error) {
    console.error('Error extracting suggestion text:', error);
    return 'AI Önerisi';
  }
}

export function processSuggestions(
  suggestions: AISuggestion[],
  options: SuggestionProcessorOptions = {}
): AISuggestion[] {
  const {
    removeDuplicates = true,
    limit = 20,
    minScore = 0.1,
    sortBy = 'score'
  } = options;

  let processed = [...suggestions];

  // Filter by minimum score
  processed = processed.filter(suggestion => suggestion.score >= minScore);

  // Remove duplicates if requested
  if (removeDuplicates) {
    processed = processed.filter((suggestion, index, self) => 
      index === self.findIndex(s => s.id === suggestion.id)
    );
  }

  // Sort by specified criteria
  processed.sort((a, b) => {
    switch (sortBy) {
      case 'score':
        return b.score - a.score;
      case 'usage':
        return (b.metadata.usageCount || 0) - (a.metadata.usageCount || 0);
      case 'confidence':
        return (b.metadata.confidenceScore || 0) - (a.metadata.confidenceScore || 0);
      default:
        return b.score - a.score;
    }
  });

  // Apply limit
  return processed.slice(0, limit);
}

export function combineElasticsearchResults(
  esResults: ElasticsearchSuggestion[],
  supabaseResults: CategorySuggestion[]
): AISuggestion[] {
  const esScores = new Map();
  esResults.forEach((hit: ElasticsearchSuggestion) => {
    esScores.set(hit._source.id, hit._score);
  });

  return supabaseResults.map(suggestion => ({
    id: `es-${suggestion.id}`,
    text: extractSuggestionText(suggestion),
    type: 'elasticsearch' as const,
    score: esScores.get(suggestion.id) || suggestion.confidence_score,
    metadata: {
      suggestionType: suggestion.suggestion_type,
      isApproved: suggestion.is_approved,
      categoryId: suggestion.category_id,
      categoryName: suggestion.categories?.name,
      confidenceScore: suggestion.confidence_score
    }
  }));
}

export function convertCategorySuggestions(suggestions: CategorySuggestion[]): AISuggestion[] {
  return suggestions.map(suggestion => ({
    id: `category-ai-${suggestion.id}`,
    text: extractSuggestionText(suggestion),
    type: 'category' as const,
    score: suggestion.confidence_score,
    metadata: {
      suggestionType: suggestion.suggestion_type,
      isApproved: suggestion.is_approved,
      categoryId: suggestion.category_id,
      categoryName: suggestion.categories?.name,
      confidenceScore: suggestion.confidence_score
    }
  }));
}

export function convertTrendingSuggestions(suggestions: any[]): AISuggestion[] {
  return suggestions.map(suggestion => ({
    id: `trending-${suggestion.id}`,
    text: suggestion.suggestion_text,
    type: 'trending' as const,
    score: suggestion.usage_count,
    metadata: {
      usageCount: suggestion.usage_count,
      lastUsed: suggestion.last_used,
      categoryId: suggestion.category_id,
      categoryName: suggestion.categories?.name,
      confidenceScore: suggestion.confidence_score
    }
  }));
}

export function convertPopularSuggestions(suggestions: any[]): AISuggestion[] {
  return suggestions.map(suggestion => ({
    id: `popular-${suggestion.id}`,
    text: suggestion.suggestion_text,
    type: 'popular' as const,
    score: suggestion.confidence_score,
    metadata: {
      usageCount: suggestion.usage_count,
      categoryId: suggestion.category_id,
      categoryName: suggestion.categories?.name,
      confidenceScore: suggestion.confidence_score
    }
  }));
}

export function mergeSuggestions(
  elasticsearchSuggestions: AISuggestion[],
  categorySuggestions: AISuggestion[],
  trendingSuggestions: AISuggestion[],
  popularSuggestions: AISuggestion[]
): AISuggestion[] {
  const allSuggestions = [
    ...elasticsearchSuggestions,
    ...categorySuggestions,
    ...trendingSuggestions,
    ...popularSuggestions
  ];

  return processSuggestions(allSuggestions, {
    removeDuplicates: true,
    limit: 20,
    sortBy: 'score'
  });
}
