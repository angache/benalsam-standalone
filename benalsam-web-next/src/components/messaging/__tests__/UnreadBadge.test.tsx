import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { UnreadBadge } from '../UnreadBadge'

describe('UnreadBadge', () => {
  it('should not render when count is 0', () => {
    const { container } = render(<UnreadBadge count={0} />)
    expect(container.firstChild).toBeNull()
  })

  it('should not render when count is negative', () => {
    const { container } = render(<UnreadBadge count={-1} />)
    expect(container.firstChild).toBeNull()
  })

  it('should render count for numbers below max', () => {
    render(<UnreadBadge count={5} />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('should show 9+ for count above 9', () => {
    render(<UnreadBadge count={15} />)
    expect(screen.getByText('9+')).toBeInTheDocument()
  })

  it('should respect custom maxDisplay', () => {
    render(<UnreadBadge count={25} maxDisplay={20} />)
    expect(screen.getByText('20+')).toBeInTheDocument()
  })

  it('should apply small size classes', () => {
    const { container } = render(<UnreadBadge count={5} size="sm" />)
    const badge = container.querySelector('.h-4')
    expect(badge).toBeInTheDocument()
  })

  it('should apply medium size classes', () => {
    const { container } = render(<UnreadBadge count={5} size="md" />)
    const badge = container.querySelector('.h-5')
    expect(badge).toBeInTheDocument()
  })

  it('should apply large size classes', () => {
    const { container } = render(<UnreadBadge count={5} size="lg" />)
    const badge = container.querySelector('.h-6')
    expect(badge).toBeInTheDocument()
  })

  it('should apply default variant styles', () => {
    const { container } = render(<UnreadBadge count={5} variant="default" />)
    const badge = container.querySelector('.bg-red-500')
    expect(badge).toBeInTheDocument()
  })

  it('should apply outline variant styles', () => {
    const { container } = render(<UnreadBadge count={5} variant="outline" />)
    const badge = container.querySelector('.border-red-500')
    expect(badge).toBeInTheDocument()
  })

  it('should apply minimal variant styles', () => {
    const { container } = render(<UnreadBadge count={5} variant="minimal" />)
    const badge = container.querySelector('.bg-red-500\\/10')
    expect(badge).toBeInTheDocument()
  })

  it('should have accessible aria-label', () => {
    render(<UnreadBadge count={5} />)
    const badge = screen.getByLabelText('5 okunmamış mesaj')
    expect(badge).toBeInTheDocument()
  })

  it('should handle exactly maxDisplay count', () => {
    render(<UnreadBadge count={9} maxDisplay={9} />)
    expect(screen.getByText('9')).toBeInTheDocument()
  })

  it('should handle count one above maxDisplay', () => {
    render(<UnreadBadge count={10} maxDisplay={9} />)
    expect(screen.getByText('9+')).toBeInTheDocument()
  })
})

