import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import FilterSidebar, { type FilterState } from '../home/FilterSidebar'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

vi.mock('@/utils/production-logger', () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

describe('FilterSidebar', () => {
  let queryClient: QueryClient
  const mockOnFiltersChange = vi.fn()
  const mockOnReset = vi.fn()

  const defaultFilters: FilterState = {
    categoryId: null,
    minPrice: null,
    maxPrice: null,
    location: null,
    urgency: null,
    searchQuery: null,
  }

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    vi.clearAllMocks()

    // Mock categories query
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [
            { id: 1, name: 'Electronics', parent_id: null },
            { id: 2, name: 'Phones', parent_id: 1 },
          ],
          error: null,
        }),
      }),
    })

    vi.mocked(supabase.from).mockImplementation(mockFrom)
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  it('should render filter sidebar', () => {
    render(
      <FilterSidebar
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        onReset={mockOnReset}
      />,
      { wrapper }
    )

    expect(screen.getByText(/filtre/i)).toBeInTheDocument()
  })

  it('should update search query', async () => {
    render(
      <FilterSidebar
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        onReset={mockOnReset}
      />,
      { wrapper }
    )

    const searchInput = screen.getByPlaceholderText(/ara/i)
    fireEvent.change(searchInput, { target: { value: 'test query' } })

    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          searchQuery: 'test query',
        })
      )
    })
  })

  it('should update min price with debounce', async () => {
    vi.useFakeTimers()

    render(
      <FilterSidebar
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        onReset={mockOnReset}
      />,
      { wrapper }
    )

    const minPriceInput = screen.getByLabelText(/min.*fiyat/i)
    fireEvent.change(minPriceInput, { target: { value: '100' } })

    // Should not call immediately
    expect(mockOnFiltersChange).not.toHaveBeenCalled()

    // Advance timers past debounce delay (300ms)
    await vi.advanceTimersByTimeAsync(300)

    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalled()
    })

    vi.useRealTimers()
  })

  it('should update max price with debounce', async () => {
    vi.useFakeTimers()

    render(
      <FilterSidebar
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        onReset={mockOnReset}
      />,
      { wrapper }
    )

    const maxPriceInput = screen.getByLabelText(/max.*fiyat/i)
    fireEvent.change(maxPriceInput, { target: { value: '1000' } })

    // Advance timers past debounce delay
    await vi.advanceTimersByTimeAsync(300)

    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalled()
    })

    vi.useRealTimers()
  })

  it('should update location filter', async () => {
    render(
      <FilterSidebar
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        onReset={mockOnReset}
      />,
      { wrapper }
    )

    const locationInput = screen.getByLabelText(/konum/i)
    fireEvent.change(locationInput, { target: { value: 'İstanbul' } })

    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          location: 'İstanbul',
        })
      )
    })
  })

  it('should update urgency filter', async () => {
    render(
      <FilterSidebar
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        onReset={mockOnReset}
      />,
      { wrapper }
    )

    // Find urgency radio buttons
    const urgentOption = screen.getByLabelText(/acil/i)
    fireEvent.click(urgentOption)

    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          urgency: expect.any(String),
        })
      )
    })
  })

  it('should call onReset when reset button is clicked', () => {
    render(
      <FilterSidebar
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        onReset={mockOnReset}
      />,
      { wrapper }
    )

    const resetButton = screen.getByText(/sıfırla/i)
    fireEvent.click(resetButton)

    expect(mockOnReset).toHaveBeenCalled()
  })

  it('should display active filters count', () => {
    const filtersWithValues: FilterState = {
      categoryId: 1,
      minPrice: 100,
      maxPrice: 1000,
      location: 'İstanbul',
      urgency: 'Acil',
      searchQuery: 'test',
    }

    render(
      <FilterSidebar
        filters={filtersWithValues}
        onFiltersChange={mockOnFiltersChange}
        onReset={mockOnReset}
      />,
      { wrapper }
    )

    // Should show active filters
    expect(screen.getByText(/aktif.*filtre/i)).toBeInTheDocument()
  })

  it('should sync with parent filters prop changes', async () => {
    const { rerender } = render(
      <FilterSidebar
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        onReset={mockOnReset}
      />,
      { wrapper }
    )

    const newFilters: FilterState = {
      ...defaultFilters,
      searchQuery: 'new query',
    }

    rerender(
      <FilterSidebar
        filters={newFilters}
        onFiltersChange={mockOnFiltersChange}
        onReset={mockOnReset}
      />
    )

    const searchInput = screen.getByPlaceholderText(/ara/i)
    expect(searchInput).toHaveValue('new query')
  })

  it('should handle category selection', async () => {
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('categories')
    })

    render(
      <FilterSidebar
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        onReset={mockOnReset}
      />,
      { wrapper }
    )

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument()
    })

    const categoryOption = screen.getByText('Electronics')
    fireEvent.click(categoryOption)

    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          categoryId: expect.any(Number),
        })
      )
    })
  })

  it('should clear filters when reset is clicked', () => {
    const filtersWithValues: FilterState = {
      categoryId: 1,
      minPrice: 100,
      maxPrice: 1000,
      location: 'İstanbul',
      urgency: 'Acil',
      searchQuery: 'test',
    }

    render(
      <FilterSidebar
        filters={filtersWithValues}
        onFiltersChange={mockOnFiltersChange}
        onReset={mockOnReset}
      />,
      { wrapper }
    )

    const resetButton = screen.getByText(/sıfırla/i)
    fireEvent.click(resetButton)

    expect(mockOnReset).toHaveBeenCalled()
  })
})

