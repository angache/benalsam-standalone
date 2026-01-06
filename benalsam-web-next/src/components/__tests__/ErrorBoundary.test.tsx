import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorBoundary, MessagingErrorBoundary } from '../ErrorBoundary'
import { logger } from '@/utils/production-logger'

// Mock logger
vi.mock('@/utils/production-logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}))

// Component that throws error
const ThrowError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No Error</div>
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Suppress console.error for error boundary tests
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Test Content</div>
      </ErrorBoundary>
    )

    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('should catch error and display error UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Bir Hata Oluştu')).toBeInTheDocument()
    expect(screen.getByText(/Üzgünüz, beklenmeyen bir hata oluştu/)).toBeInTheDocument()
  })

  it('should log error when caught', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(logger.error).toHaveBeenCalledWith(
      '[ErrorBoundary] Caught error',
      expect.objectContaining({
        error: 'Test error',
        stack: expect.any(String),
        componentStack: expect.any(String),
      })
    )
  })

  it('should call onError callback when provided', () => {
    const onError = vi.fn()

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    )
  })

  it('should use custom fallback when provided', () => {
    const customFallback = <div>Custom Error UI</div>

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Custom Error UI')).toBeInTheDocument()
    expect(screen.queryByText('Bir Hata Oluştu')).not.toBeInTheDocument()
  })

  it('should reset error state when reset button is clicked', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Bir Hata Oluştu')).toBeInTheDocument()

    const resetButton = screen.getByText('Tekrar Dene')
    fireEvent.click(resetButton)

    // Rerender without error
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )

    expect(screen.queryByText('Bir Hata Oluştu')).not.toBeInTheDocument()
    expect(screen.getByText('No Error')).toBeInTheDocument()
  })

  it('should navigate to home when home button is clicked', () => {
    // Mock window.location
    const originalLocation = window.location
    delete (window as { location?: Location }).location
    window.location = { ...originalLocation, href: '' }

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    const homeButton = screen.getByText('Ana Sayfa')
    fireEvent.click(homeButton)

    expect(window.location.href).toBe('/')

    // Restore
    window.location = originalLocation
  })

  it('should show error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Test error')).toBeInTheDocument()

    process.env.NODE_ENV = originalEnv
  })

  it('should not show error details in production mode', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.queryByText('Test error')).not.toBeInTheDocument()

    process.env.NODE_ENV = originalEnv
  })
})

describe('MessagingErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render children when no error occurs', () => {
    render(
      <MessagingErrorBoundary>
        <div>Messaging Content</div>
      </MessagingErrorBoundary>
    )

    expect(screen.getByText('Messaging Content')).toBeInTheDocument()
  })

  it('should display messaging-specific error UI when error occurs', () => {
    render(
      <MessagingErrorBoundary>
        <ThrowError shouldThrow={true} />
      </MessagingErrorBoundary>
    )

    expect(screen.getByText('Mesajlaşma Hatası')).toBeInTheDocument()
    expect(screen.getByText(/Mesajlaşma sisteminde bir sorun oluştu/)).toBeInTheDocument()
  })

  it('should reload page when refresh button is clicked', () => {
    const reloadSpy = vi.spyOn(window.location, 'reload').mockImplementation(() => {})

    render(
      <MessagingErrorBoundary>
        <ThrowError shouldThrow={true} />
      </MessagingErrorBoundary>
    )

    const refreshButton = screen.getByText('Sayfayı Yenile')
    fireEvent.click(refreshButton)

    expect(reloadSpy).toHaveBeenCalled()

    reloadSpy.mockRestore()
  })

  it('should log messaging-specific error', () => {
    render(
      <MessagingErrorBoundary>
        <ThrowError shouldThrow={true} />
      </MessagingErrorBoundary>
    )

    expect(logger.error).toHaveBeenCalledWith(
      '[MessagingErrorBoundary] Error in messaging',
      expect.objectContaining({
        error: 'Test error',
        stack: expect.any(String),
        componentStack: expect.any(String),
      })
    )
  })
})

