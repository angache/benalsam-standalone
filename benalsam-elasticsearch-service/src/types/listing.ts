export interface ListingData {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  status: ListingStatus;
  category_id: string;
  user_id: string;
  attributes: Record<string, any>;
  images: string[];
  location: {
    lat: number;
    lon: number;
    city: string;
    district: string;
  };
  created_at: string;
  updated_at: string;
  version?: number;
}

export type ListingStatus = 'draft' | 'pending' | 'active' | 'rejected' | 'deleted' | 'inactive';

export interface ListingSearchParams {
  query?: string;
  category?: string;
  priceRange?: {
    min?: number;
    max?: number;
  };
  location?: {
    lat: number;
    lon: number;
    radius: number;
  };
  status?: ListingStatus;
  attributes?: Record<string, any>;
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
  page?: number;
  limit?: number;
}
