// ===========================
// QUERY BUILDER UTILITY
// ===========================

import { SearchQuery, SearchOptimizationOptions } from '../types';

export function buildSearchQuery(
  query: string,
  options: SearchOptimizationOptions = {}
): SearchQuery {
  const {
    useFuzzySearch = true,
    boostFields = {
      title: 3.0,
      description: 1.5,
      'attributes.brand': 2.0,
      'attributes.model': 2.0,
      category: 1.0
    },
    filters = {}
  } = options;

  const searchQuery: SearchQuery = {
    query: {
      bool: {
        should: [
          // Exact phrase match (highest priority)
          {
            multi_match: {
              query,
              fields: Object.entries(boostFields).map(([field, boost]) => `${field}^${boost}`),
              type: 'phrase',
              boost: 3.0
            }
          },
          // Individual terms match
          {
            multi_match: {
              query,
              fields: Object.entries(boostFields).map(([field, boost]) => `${field}^${boost}`),
              fuzziness: useFuzzySearch ? 'AUTO' : undefined,
              type: 'best_fields',
              minimum_should_match: '60%'
            }
          }
        ],
        filter: buildFilters(filters)
      }
    },
    size: 20,
    sort: [
      { _score: { order: 'desc' } },
      { created_at: { order: 'desc' } }
    ],
    highlight: {
      fields: {
        title: {},
        description: {},
        'attributes.brand': {},
        'attributes.model': {}
      },
      pre_tags: ['<mark>'],
      post_tags: ['</mark>']
    }
  };

  return searchQuery;
}

export function buildFilters(filters: Record<string, any>): any[] {
  const filterArray: any[] = [];

  Object.entries(filters).forEach(([field, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        filterArray.push({
          terms: { [field]: value }
        });
      } else if (typeof value === 'object' && value.range) {
        filterArray.push({
          range: { [field]: value.range }
        });
      } else {
        filterArray.push({
          term: { [field]: value }
        });
      }
    }
  });

  return filterArray;
}

export function buildCategoryQuery(categoryId: number): SearchQuery {
  return {
    query: {
      bool: {
        must: [
          { term: { category_id: categoryId } },
          { term: { status: 'active' } }
        ]
      }
    },
    size: 50,
    sort: [
      { popularity_score: { order: 'desc' } },
      { created_at: { order: 'desc' } }
    ]
  };
}

export function buildLocationQuery(
  province?: string,
  district?: string,
  coordinates?: { lat: number; lon: number },
  radius?: number
): SearchQuery {
  const query: SearchQuery = {
    query: {
      bool: {
        must: [
          { term: { status: 'active' } }
        ],
        filter: []
      }
    },
    size: 50,
    sort: [
      { _score: { order: 'desc' } },
      { created_at: { order: 'desc' } }
    ]
  };

  if (province) {
    query.query!.bool.must!.push({ term: { 'location.province': province } });
  }

  if (district) {
    query.query!.bool.must!.push({ term: { 'location.district': district } });
  }

  if (coordinates && radius) {
    query.query!.bool.filter!.push({
      geo_distance: {
        distance: `${radius}km`,
        'location.coordinates': coordinates
      }
    });
  }

  return query;
}

export function buildPriceRangeQuery(minPrice?: number, maxPrice?: number): SearchQuery {
  const query: SearchQuery = {
    query: {
      bool: {
        must: [
          { term: { status: 'active' } }
        ]
      }
    },
    size: 50,
    sort: [
      { budget: { order: 'asc' } },
      { created_at: { order: 'desc' } }
    ]
  };

  if (minPrice !== undefined || maxPrice !== undefined) {
    const rangeFilter: any = { range: { budget: {} } };
    
    if (minPrice !== undefined) {
      rangeFilter.range.budget.gte = minPrice;
    }
    
    if (maxPrice !== undefined) {
      rangeFilter.range.budget.lte = maxPrice;
    }

    query.query!.bool.must!.push(rangeFilter);
  }

  return query;
}

export function buildAggregationQuery(fields: string[]): SearchQuery {
  const aggs: any = {};

  fields.forEach(field => {
    aggs[`${field}_counts`] = {
      terms: {
        field,
        size: 20
      }
    };
  });

  return {
    query: {
      bool: {
        must: [
          { term: { status: 'active' } }
        ]
      }
    },
    size: 0,
    aggs
  };
}

export function buildSuggestQuery(query: string, field: string): SearchQuery {
  return {
    query: {
      bool: {
        should: [
          {
            prefix: {
              [field]: query.toLowerCase()
            }
          },
          {
            fuzzy: {
              [field]: {
                value: query.toLowerCase(),
                fuzziness: 'AUTO'
              }
            }
          }
        ],
        filter: [
          { term: { status: 'active' } }
        ]
      }
    },
    size: 10,
    sort: [
      { _score: { order: 'desc' } }
    ]
  };
}

export function buildDateRangeQuery(
  startDate?: Date,
  endDate?: Date,
  field: string = 'created_at'
): SearchQuery {
  const query: SearchQuery = {
    query: {
      bool: {
        must: [
          { term: { status: 'active' } }
        ]
      }
    },
    size: 50,
    sort: [
      { [field]: { order: 'desc' } }
    ]
  };

  if (startDate || endDate) {
    const rangeFilter: any = { range: { [field]: {} } };
    
    if (startDate) {
      rangeFilter.range[field].gte = startDate.toISOString();
    }
    
    if (endDate) {
      rangeFilter.range[field].lte = endDate.toISOString();
    }

    query.query!.bool.must!.push(rangeFilter);
  }

  return query;
}
