const SEARCH_SERVICE_URL = process.env.NEXT_PUBLIC_SEARCH_SERVICE_URL || 'http://localhost:3016';

interface SearchParams {
  query?: string;
  categoryId?: number;
  page?: number;
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  sortBy?: 'created_at' | 'price' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export async function searchListings(params: SearchParams) {
  const { page = 1, limit = 24, sortBy = 'created_at', sortOrder = 'desc', ...filters } = params;

  const response = await fetch(`${SEARCH_SERVICE_URL}/api/v1/search/listings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: params.query || '',
      page,
      pageSize: limit,
      sortBy,
      sortOrder,
      filters: {
        categoryId: params.categoryId,
        minPrice: params.minPrice,
        maxPrice: params.maxPrice,
        location: params.location,
      },
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch listings');
  }

  const data = await response.json();
  return {
    listings: data.data || [],
    total: data.total || 0,
    hasMore: (page * limit) < (data.total || 0),
  };
}

export async function getListingById(id: string) {
  const response = await fetch(`${SEARCH_SERVICE_URL}/api/v1/search/listings/${id}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch listing');
  }

  const data = await response.json();
  return data.data;
}

