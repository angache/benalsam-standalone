import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ListingsGrid from '../listings/ListingsGrid'
import { useFilterStore } from '@/stores/filterStore'
import { useAuth } from '@/contexts/AuthContext'

// Mock dependencies
vi.mock('@/stores/filterStore', () => ({
  useFilterStore: vi.fn(),
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@/components/ListingCard', () => ({
  default: ({ listing }: { listing: { id: string; title: string } }) => (
    <div data-testid={`listing-${listing.id}`}>{listing.title}</div>
  ),
}))

// Mock fetch
global.fetch = vi.fn()

describe('ListingsGrid', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    vi.clearAllMocks()

    vi.mocked(useFilterStore).mockReturnValue({
      filters: {
        searchQuery: '',
        categories: [],
        location: { city: '' },
        priceRange: { min: null, max: null },
        urgency: null,
        dateRange: 'all',
        showOnlyFeatured: false,
        showOnlyShowcase: false,
        showOnlyUrgent: false,
        categoryAttributes: {},
        sortBy: 'newest',
        pageSize: 20,
      },
    } as never)

    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'user-1' },
      isLoading: false,
    } as never)
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  it('should render listings grid', async () => {
    const mockListings = {
      data: [
        { id: '1', title: 'Listing 1' },
        { id: '2', title: 'Listing 2' },
      ],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 2,
      },
    }

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockListings,
    } as Response)

    render(<ListingsGrid />, { wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('listing-1')).toBeInTheDocument()
      expect(screen.getByTestId('listing-2')).toBeInTheDocument()
    })
  })

  it('should show loading skeleton while fetching', () => {
    vi.mocked(global.fetch).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    render(<ListingsGrid />, { wrapper })

    // Should show loading state
    expect(screen.getByText(/yükleniyor/i)).toBeInTheDocument()
  })

  it('should show empty state when no listings', async () => {
    const mockListings = {
      data: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
      },
    }

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockListings,
    } as Response)

    render(<ListingsGrid />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText(/ilan bulunamadı/i)).toBeInTheDocument()
    })
  })

  it('should show error message on fetch failure', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response)

    render(<ListingsGrid />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText(/hata/i)).toBeInTheDocument()
    })
  })

  it('should render pagination when multiple pages', async () => {
    const mockListings = {
      data: Array.from({ length: 20 }, (_, i) => ({
        id: String(i + 1),
        title: `Listing ${i + 1}`,
      })),
      pagination: {
        currentPage: 1,
        totalPages: 3,
        totalItems: 50,
      },
    }

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockListings,
    } as Response)

    render(<ListingsGrid />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText(/sayfa/i)).toBeInTheDocument()
    })
  })

  it('should apply filters from filter store', async () => {
    vi.mocked(useFilterStore).mockReturnValue({
      filters: {
        searchQuery: 'test',
        categories: [1, 2],
        location: { city: 'İstanbul' },
        priceRange: { min: 100, max: 1000 },
        urgency: 'Acil',
        dateRange: 'week',
        showOnlyFeatured: true,
        showOnlyShowcase: false,
        showOnlyUrgent: false,
        categoryAttributes: {},
        sortBy: 'price_low',
        pageSize: 20,
      },
    } as never)

    const mockListings = {
      data: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
      },
    }

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockListings,
    } as Response)

    render(<ListingsGrid />, { wrapper })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })

    const fetchCall = vi.mocked(global.fetch).mock.calls[0][0] as string
    expect(fetchCall).toContain('q=test')
    expect(fetchCall).toContain('categories=1,2')
    expect(fetchCall).toContain('city=İstanbul')
    expect(fetchCall).toContain('minPrice=100')
    expect(fetchCall).toContain('maxPrice=1000')
    expect(fetchCall).toContain('urgency=Acil')
    expect(fetchCall).toContain('dateRange=week')
    expect(fetchCall).toContain('featured=1')
    expect(fetchCall).toContain('sort=price_low')
  })

  it('should handle pagination changes', async () => {
    const mockListings = {
      data: Array.from({ length: 20 }, (_, i) => ({
        id: String(i + 1),
        title: `Listing ${i + 1}`,
      })),
      pagination: {
        currentPage: 1,
        totalPages: 3,
        totalItems: 50,
      },
    }

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => mockListings,
    } as Response)

    render(<ListingsGrid />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText(/sayfa/i)).toBeInTheDocument()
    })

    // Pagination should be rendered
    const pagination = screen.getByText(/sayfa/i)
    expect(pagination).toBeInTheDocument()
  })
})

