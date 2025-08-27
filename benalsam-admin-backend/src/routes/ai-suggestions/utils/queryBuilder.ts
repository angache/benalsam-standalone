// ===========================
// QUERY BUILDER UTILITY
// ===========================

import { ElasticsearchQuery, SuggestionQuery } from '../types';

export function buildElasticsearchQuery(query: string, options: SuggestionQuery = {}): ElasticsearchQuery {
  const { minScore = 0.3, limit = 10 } = options;

  return {
    min_score: minScore,
    query: {
      bool: {
        should: [
          // Exact phrase match (highest priority)
          {
            multi_match: {
              query: query,
              fields: [
                'suggestion_data.keywords^4',
                'suggestion_data.brand^3',
                'suggestion_data.model^3'
              ],
              type: 'phrase',
              boost: 3.0
            }
          },
          // Individual terms match
          {
            multi_match: {
              query: query,
              fields: [
                'suggestion_data.keywords^2',
                'suggestion_data.brand^1.5',
                'suggestion_data.model^1.5',
                'category_name^1',
                'suggestion_data.description^0.5'
              ],
              fuzziness: 'AUTO',
              type: 'best_fields',
              minimum_should_match: '60%'
            }
          }
        ],
        filter: [
          { term: { is_approved: true } },
          { range: { confidence_score: { gte: 0.7 } } }
        ]
      }
    },
    sort: [
      { _score: { order: 'desc' } },
      { confidence_score: { order: 'desc' } }
    ],
    size: limit
  };
}

export function buildCategoryQuery(categoryId: number, limit: number = 10) {
  return {
    category_id: categoryId,
    is_approved: true,
    limit: limit,
    orderBy: 'confidence_score',
    orderDirection: 'desc'
  };
}

export function buildTrendingQuery(limit: number = 10) {
  return {
    is_approved: true,
    limit: limit,
    orderBy: 'usage_count',
    orderDirection: 'desc',
    timeRange: '7d' // Last 7 days
  };
}

export function buildPopularQuery(limit: number = 10) {
  return {
    is_approved: true,
    limit: limit,
    orderBy: 'confidence_score',
    orderDirection: 'desc',
    minUsageCount: 5
  };
}

export function buildHybridQuery(query: string, categoryId?: number, limit: number = 20) {
  return {
    query,
    categoryId,
    limit,
    sources: ['elasticsearch', 'category', 'trending', 'popular'],
    weights: {
      elasticsearch: 0.4,
      category: 0.3,
      trending: 0.2,
      popular: 0.1
    }
  };
}
