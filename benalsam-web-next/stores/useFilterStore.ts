import { create } from 'zustand';

interface FilterState {
  query: string;
  categoryId: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  location: string;
  sortBy: 'created_at' | 'price' | 'title';
  sortOrder: 'asc' | 'desc';
  page: number;

  setQuery: (query: string) => void;
  setCategoryId: (id: number | null) => void;
  setPriceRange: (min: number | null, max: number | null) => void;
  setLocation: (location: string) => void;
  setSorting: (sortBy: FilterState['sortBy'], sortOrder: FilterState['sortOrder']) => void;
  setPage: (page: number) => void;
  resetFilters: () => void;
}

const initialState = {
  query: '',
  categoryId: null,
  minPrice: null,
  maxPrice: null,
  location: '',
  sortBy: 'created_at' as const,
  sortOrder: 'desc' as const,
  page: 1,
};

export const useFilterStore = create<FilterState>((set) => ({
  ...initialState,

  setQuery: (query) => set({ query, page: 1 }),
  setCategoryId: (categoryId) => set({ categoryId, page: 1 }),
  setPriceRange: (minPrice, maxPrice) => set({ minPrice, maxPrice, page: 1 }),
  setLocation: (location) => set({ location, page: 1 }),
  setSorting: (sortBy, sortOrder) => set({ sortBy, sortOrder, page: 1 }),
  setPage: (page) => set({ page }),
  resetFilters: () => set(initialState),
}));

