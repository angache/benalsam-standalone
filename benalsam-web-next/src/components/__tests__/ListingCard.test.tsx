import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ListingCard } from '../ListingCard'

// Mock Next.js components
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string }) => (
    <img src={src} alt={alt} {...props} />
  ),
}))

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode }) => (
      <div {...props}>{children}</div>
    ),
  },
}))

// Mock hooks
vi.mock('@/hooks/useCategories', () => ({
  useCategories: vi.fn(() => ({
    categories: [],
    isLoading: false,
  })),
}))

vi.mock('@/lib/slugify', () => ({
  generateListingUrl: (title: string, id: string) => `/listing/${id}`,
}))

// Mock date-fns
vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn((date: Date) => '2 gün önce'),
}))

vi.mock('date-fns/locale', () => ({
  tr: {},
}))

describe('ListingCard', () => {
  const mockListing = {
    id: 'listing-1',
    title: 'Test Listing',
    description: 'Test description',
    budget: 1000,
    currency: 'TRY',
    main_image_url: 'https://example.com/image.jpg',
    category: 'Electronics',
    category_id: 1,
    status: 'active' as const,
    urgency: 'Normal' as const,
    created_at: '2025-01-01T00:00:00Z',
    views_count: 100,
    offers_count: 5,
    favorites_count: 10,
    location: 'İstanbul',
    user: {
      id: 'user-1',
      name: 'Test User',
      avatar_url: 'https://example.com/avatar.jpg',
      rating: 4.5,
      trust_score: 80,
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render listing title', () => {
    render(<ListingCard listing={mockListing} />)

    expect(screen.getByText('Test Listing')).toBeInTheDocument()
  })

  it('should render listing price', () => {
    render(<ListingCard listing={mockListing} />)

    expect(screen.getByText(/1.000/)).toBeInTheDocument()
  })

  it('should render listing location', () => {
    render(<ListingCard listing={mockListing} />)

    expect(screen.getByText('İstanbul')).toBeInTheDocument()
  })

  it('should render listing image', () => {
    render(<ListingCard listing={mockListing} />)

    const image = screen.getByAltText('Test Listing')
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg')
  })

  it('should render placeholder when no image', () => {
    const listingWithoutImage = {
      ...mockListing,
      main_image_url: undefined,
      image_url: undefined,
    }

    render(<ListingCard listing={listingWithoutImage} />)

    // Should still render the card
    expect(screen.getByText('Test Listing')).toBeInTheDocument()
  })

  it('should render user avatar', () => {
    render(<ListingCard listing={mockListing} />)

    const avatar = screen.getByAltText('Test User')
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg')
  })

  it('should render view count', () => {
    render(<ListingCard listing={mockListing} />)

    expect(screen.getByText('100')).toBeInTheDocument()
  })

  it('should render offers count', () => {
    render(<ListingCard listing={mockListing} />)

    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('should call onToggleFavorite when favorite button is clicked', () => {
    const onToggleFavorite = vi.fn()

    render(
      <ListingCard
        listing={mockListing}
        onToggleFavorite={onToggleFavorite}
      />
    )

    const favoriteButton = screen.getByRole('button', { name: /favorite/i })
    fireEvent.click(favoriteButton)

    expect(onToggleFavorite).toHaveBeenCalledWith('listing-1')
  })

  it('should show favorited state when isFavoritedOverride is true', () => {
    render(
      <ListingCard
        listing={mockListing}
        isFavoritedOverride={true}
      />
    )

    const favoriteButton = screen.getByRole('button', { name: /favorite/i })
    expect(favoriteButton).toBeInTheDocument()
  })

  it('should render premium badges when provided', () => {
    const getPremiumBadges = vi.fn(() => [
      { icon: () => <span>⭐</span>, label: 'Featured', color: 'gold' },
    ])

    render(
      <ListingCard
        listing={mockListing}
        getPremiumBadges={getPremiumBadges}
      />
    )

    expect(getPremiumBadges).toHaveBeenCalledWith(mockListing)
  })

  it('should render status badge when provided', () => {
    const getStatusBadge = vi.fn(() => <span>Active</span>)

    render(
      <ListingCard
        listing={mockListing}
        getStatusBadge={getStatusBadge}
      />
    )

    expect(getStatusBadge).toHaveBeenCalledWith(mockListing)
  })

  it('should call onView when listing is clicked', () => {
    const onView = vi.fn()

    render(
      <ListingCard
        listing={mockListing}
        onView={onView}
      />
    )

    const link = screen.getByRole('link')
    fireEvent.click(link)

    expect(onView).toHaveBeenCalledWith(mockListing)
  })

  it('should call onEdit when edit button is clicked', () => {
    const onEdit = vi.fn()

    render(
      <ListingCard
        listing={mockListing}
        showActions={true}
        onEdit={onEdit}
      />
    )

    const editButton = screen.getByRole('button', { name: /edit/i })
    fireEvent.click(editButton)

    expect(onEdit).toHaveBeenCalledWith(mockListing)
  })

  it('should call onDelete when delete button is clicked', () => {
    const onDelete = vi.fn()

    render(
      <ListingCard
        listing={mockListing}
        showActions={true}
        onDelete={onDelete}
      />
    )

    const deleteButton = screen.getByRole('button', { name: /delete/i })
    fireEvent.click(deleteButton)

    expect(onDelete).toHaveBeenCalledWith(mockListing)
  })

  it('should call onToggleStatus when status toggle is clicked', () => {
    const onToggleStatus = vi.fn()

    render(
      <ListingCard
        listing={mockListing}
        showActions={true}
        onToggleStatus={onToggleStatus}
      />
    )

    const statusButton = screen.getByRole('button', { name: /toggle/i })
    fireEvent.click(statusButton)

    expect(onToggleStatus).toHaveBeenCalledWith(mockListing)
  })

  it('should render urgency badge for urgent listings', () => {
    const urgentListing = {
      ...mockListing,
      urgency: 'Acil' as const,
    }

    render(<ListingCard listing={urgentListing} />)

    // Should show urgent badge
    expect(screen.getByText('Acil')).toBeInTheDocument()
  })

  it('should render featured badge when listing is featured', () => {
    const featuredListing = {
      ...mockListing,
      is_featured: true,
    }

    render(<ListingCard listing={featuredListing} />)

    // Should show featured indicator
    expect(screen.getByText(/featured/i)).toBeInTheDocument()
  })

  it('should render showcase badge when listing is showcase', () => {
    const showcaseListing = {
      ...mockListing,
      is_showcase: true,
    }

    render(<ListingCard listing={showcaseListing} />)

    // Should show showcase indicator
    expect(screen.getByText(/showcase/i)).toBeInTheDocument()
  })

  it('should handle location as object', () => {
    const listingWithObjectLocation = {
      ...mockListing,
      location: {
        province: 'İstanbul',
        district: 'Kadıköy',
        neighborhood: 'Moda',
      },
    }

    render(<ListingCard listing={listingWithObjectLocation} />)

    expect(screen.getByText(/İstanbul/i)).toBeInTheDocument()
  })

  it('should render different sizes correctly', () => {
    const { rerender } = render(
      <ListingCard listing={mockListing} size="small" />
    )

    expect(screen.getByText('Test Listing')).toBeInTheDocument()

    rerender(<ListingCard listing={mockListing} size="large" />)

    expect(screen.getByText('Test Listing')).toBeInTheDocument()
  })

  it('should render user rating when available', () => {
    render(<ListingCard listing={mockListing} />)

    expect(screen.getByText('4.5')).toBeInTheDocument()
  })

  it('should render trust score when available', () => {
    render(<ListingCard listing={mockListing} />)

    expect(screen.getByText('80')).toBeInTheDocument()
  })

  it('should handle missing user data gracefully', () => {
    const listingWithoutUser = {
      ...mockListing,
      user: undefined,
    }

    render(<ListingCard listing={listingWithoutUser} />)

    expect(screen.getByText('Test Listing')).toBeInTheDocument()
  })

  it('should handle missing counts gracefully', () => {
    const listingWithoutCounts = {
      ...mockListing,
      views_count: undefined,
      offers_count: undefined,
      favorites_count: undefined,
    }

    render(<ListingCard listing={listingWithoutCounts} />)

    expect(screen.getByText('Test Listing')).toBeInTheDocument()
  })

  it('should call onDopingClick when doping button is clicked', () => {
    const onDopingClick = vi.fn()

    render(
      <ListingCard
        listing={mockListing}
        showActions={true}
        onDopingClick={onDopingClick}
      />
    )

    const dopingButton = screen.getByRole('button', { name: /doping/i })
    fireEvent.click(dopingButton)

    expect(onDopingClick).toHaveBeenCalledWith(mockListing)
  })

  it('should call onMarkAsCompleted when completed button is clicked', () => {
    const onMarkAsCompleted = vi.fn()

    render(
      <ListingCard
        listing={mockListing}
        showActions={true}
        onMarkAsCompleted={onMarkAsCompleted}
      />
    )

    const completedButton = screen.getByRole('button', { name: /completed/i })
    fireEvent.click(completedButton)

    expect(onMarkAsCompleted).toHaveBeenCalledWith(mockListing)
  })

  it('should disable actions when isDeleting is true', () => {
    render(
      <ListingCard
        listing={mockListing}
        showActions={true}
        isDeleting={true}
      />
    )

    const deleteButton = screen.getByRole('button', { name: /delete/i })
    expect(deleteButton).toBeDisabled()
  })
})

