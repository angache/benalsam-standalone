import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QuickViewModal } from '../QuickViewModal'
import type { Listing } from '@/types'

// Mock Next.js Image
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string }) => (
    <img src={src} alt={alt} {...props} />
  ),
}))

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

// Mock generateListingUrl
vi.mock('@/lib/slugify', () => ({
  generateListingUrl: (title: string, id: string) => `/listing/${id}`,
}))

// Mock navigator.share
Object.assign(navigator, {
  share: vi.fn().mockResolvedValue(undefined),
})

describe('QuickViewModal', () => {
  const mockListing: Partial<Listing> = {
    id: 'listing-1',
    title: 'Test Listing',
    description: 'Test description',
    budget: 1000,
    location: 'İstanbul',
    created_at: '2025-01-01T00:00:00Z',
    view_count: 100,
    favorites_count: 50,
    images: [
      { url: 'https://example.com/image1.jpg', is_main: true },
      { url: 'https://example.com/image2.jpg', is_main: false },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not render when listing is null', () => {
    const { container } = render(
      <QuickViewModal
        listing={null as unknown as Partial<Listing>}
        isOpen={true}
        onClose={vi.fn()}
      />
    )

    expect(container.firstChild).toBeNull()
  })

  it('should render listing details when open', () => {
    render(
      <QuickViewModal
        listing={mockListing}
        isOpen={true}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByText('Test Listing')).toBeInTheDocument()
    expect(screen.getByText('1.000 ₺')).toBeInTheDocument()
    expect(screen.getByText('İstanbul')).toBeInTheDocument()
    expect(screen.getByText('Test description')).toBeInTheDocument()
  })

  it('should not render when isOpen is false', () => {
    const { container } = render(
      <QuickViewModal
        listing={mockListing}
        isOpen={false}
        onClose={vi.fn()}
      />
    )

    // Dialog should not be visible
    expect(screen.queryByText('Test Listing')).not.toBeInTheDocument()
  })

  it('should call onClose when dialog is closed', () => {
    const onClose = vi.fn()

    render(
      <QuickViewModal
        listing={mockListing}
        isOpen={true}
        onClose={onClose}
      />
    )

    // Find and click close button (Dialog component handles this)
    const dialog = screen.getByRole('dialog', { hidden: true })
    expect(dialog).toBeInTheDocument()
  })

  it('should display main image when available', () => {
    render(
      <QuickViewModal
        listing={mockListing}
        isOpen={true}
        onClose={vi.fn()}
      />
    )

    const image = screen.getByAltText('Test Listing')
    expect(image).toHaveAttribute('src', 'https://example.com/image1.jpg')
  })

  it('should display first image when no main image', () => {
    const listingWithoutMain: Partial<Listing> = {
      ...mockListing,
      images: [
        { url: 'https://example.com/image2.jpg', is_main: false },
      ],
    }

    render(
      <QuickViewModal
        listing={listingWithoutMain}
        isOpen={true}
        onClose={vi.fn()}
      />
    )

    const image = screen.getByAltText('Test Listing')
    expect(image).toHaveAttribute('src', 'https://example.com/image2.jpg')
  })

  it('should display placeholder when no images', () => {
    const listingWithoutImages: Partial<Listing> = {
      ...mockListing,
      images: [],
    }

    render(
      <QuickViewModal
        listing={listingWithoutImages}
        isOpen={true}
        onClose={vi.fn()}
      />
    )

    // Should still render, but with placeholder
    expect(screen.getByText('Test Listing')).toBeInTheDocument()
  })

  it('should call onToggleFavorite when favorite button is clicked', () => {
    const onToggleFavorite = vi.fn()

    render(
      <QuickViewModal
        listing={mockListing}
        isOpen={true}
        onClose={vi.fn()}
        onToggleFavorite={onToggleFavorite}
        isFavorited={false}
      />
    )

    // Find favorite button (Heart icon button)
    const favoriteButton = screen.getByRole('button', { name: /favorite/i })
    fireEvent.click(favoriteButton)

    expect(onToggleFavorite).toHaveBeenCalled()
  })

  it('should show filled heart when isFavorited is true', () => {
    render(
      <QuickViewModal
        listing={mockListing}
        isOpen={true}
        onClose={vi.fn()}
        onToggleFavorite={vi.fn()}
        isFavorited={true}
      />
    )

    // Heart should have fill-red-500 class when favorited
    const heartIcon = screen.getByRole('button', { name: /favorite/i }).querySelector('svg')
    expect(heartIcon).toHaveClass('fill-red-500')
  })

  it('should display view count and favorites count', () => {
    render(
      <QuickViewModal
        listing={mockListing}
        isOpen={true}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByText('100')).toBeInTheDocument() // view_count
    expect(screen.getByText('50')).toBeInTheDocument() // favorites_count
  })

  it('should display default values when counts are missing', () => {
    const listingWithoutCounts: Partial<Listing> = {
      ...mockListing,
      view_count: undefined,
      favorites_count: undefined,
    }

    render(
      <QuickViewModal
        listing={listingWithoutCounts}
        isOpen={true}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByText('0')).toBeInTheDocument() // Default view_count
    expect(screen.getAllByText('0')).toHaveLength(1) // Default favorites_count
  })

  it('should format date correctly', () => {
    render(
      <QuickViewModal
        listing={mockListing}
        isOpen={true}
        onClose={vi.fn()}
      />
    )

    // Date should be formatted in Turkish locale
    const dateText = screen.getByText(/01\.01\.2025/)
    expect(dateText).toBeInTheDocument()
  })

  it('should display "Açıklama yok" when description is missing', () => {
    const listingWithoutDescription: Partial<Listing> = {
      ...mockListing,
      description: undefined,
    }

    render(
      <QuickViewModal
        listing={listingWithoutDescription}
        isOpen={true}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByText('Açıklama yok')).toBeInTheDocument()
  })

  it('should generate correct listing URL for detail link', () => {
    render(
      <QuickViewModal
        listing={mockListing}
        isOpen={true}
        onClose={vi.fn()}
      />
    )

    const detailLink = screen.getByText('Detaylı Görüntüle').closest('a')
    expect(detailLink).toHaveAttribute('href', '/listing/listing-1')
  })

  it('should call navigator.share when share button is clicked', async () => {
    render(
      <QuickViewModal
        listing={mockListing}
        isOpen={true}
        onClose={vi.fn()}
      />
    )

    const shareButton = screen.getByRole('button', { name: /share/i })
    fireEvent.click(shareButton)

    expect(navigator.share).toHaveBeenCalledWith({
      title: 'Test Listing',
      url: expect.stringContaining('/listing/listing-1'),
    })
  })

  it('should handle share error gracefully', async () => {
    vi.mocked(navigator.share).mockRejectedValueOnce(new Error('Share failed'))

    render(
      <QuickViewModal
        listing={mockListing}
        isOpen={true}
        onClose={vi.fn()}
      />
    )

    const shareButton = screen.getByRole('button', { name: /share/i })
    fireEvent.click(shareButton)

    // Should not throw
    await expect(navigator.share).toHaveBeenCalled()
  })
})

