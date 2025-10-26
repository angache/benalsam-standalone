import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MessageBubble } from '../MessageBubble'

const mockMessage = {
  id: 'msg-1',
  conversation_id: 'conv-1',
  sender_id: 'user-1',
  content: 'Hello World',
  created_at: new Date().toISOString(),
  is_read: false,
  message_type: 'text' as const,
  status: 'sent' as const,
}

const mockOtherUser = {
  name: 'John Doe',
  avatar_url: 'https://example.com/avatar.jpg',
}

describe('MessageBubble', () => {
  it('should render message content', () => {
    render(
      <MessageBubble 
        message={mockMessage} 
        isOwnMessage={false} 
      />
    )
    
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })

  it('should apply correct styling for own messages', () => {
    const { container } = render(
      <MessageBubble 
        message={mockMessage} 
        isOwnMessage={true} 
      />
    )
    
    const bubble = container.querySelector('.bg-blue-500')
    expect(bubble).toBeInTheDocument()
  })

  it('should apply correct styling for received messages', () => {
    const { container } = render(
      <MessageBubble 
        message={mockMessage} 
        isOwnMessage={false} 
      />
    )
    
    const bubble = container.querySelector('.bg-gray-100')
    expect(bubble).toBeInTheDocument()
  })

  it('should show avatar for received messages when enabled', () => {
    render(
      <MessageBubble 
        message={mockMessage} 
        isOwnMessage={false}
        showAvatar={true}
        otherUser={mockOtherUser}
      />
    )
    
    expect(screen.getByRole('img')).toBeInTheDocument()
  })

  it('should NOT show avatar for own messages', () => {
    const { container } = render(
      <MessageBubble 
        message={mockMessage} 
        isOwnMessage={true}
        showAvatar={true}
        otherUser={mockOtherUser}
      />
    )
    
    const avatar = container.querySelector('[role="img"]')
    expect(avatar).toBeNull()
  })

  it('should show timestamp when enabled', () => {
    render(
      <MessageBubble 
        message={mockMessage} 
        isOwnMessage={false}
        showTime={true}
      />
    )
    
    const timeElement = screen.getByText(/\d{2}:\d{2}/)
    expect(timeElement).toBeInTheDocument()
  })

  it('should sanitize message content', () => {
    const xssMessage = {
      ...mockMessage,
      content: '<script>alert("XSS")</script>Safe Text',
    }
    
    render(
      <MessageBubble 
        message={xssMessage} 
        isOwnMessage={false} 
      />
    )
    
    expect(screen.getByText('Safe Text')).toBeInTheDocument()
    expect(screen.queryByText(/script/i)).toBeNull()
  })

  it('should preserve line breaks in content', () => {
    const multilineMessage = {
      ...mockMessage,
      content: 'Line 1\nLine 2\nLine 3',
    }
    
    const { container } = render(
      <MessageBubble 
        message={multilineMessage} 
        isOwnMessage={false} 
      />
    )
    
    const content = container.querySelector('.whitespace-pre-wrap')
    expect(content).toBeInTheDocument()
  })

  it('should handle empty message content', () => {
    const emptyMessage = {
      ...mockMessage,
      content: '',
    }
    
    render(
      <MessageBubble 
        message={emptyMessage} 
        isOwnMessage={false} 
      />
    )
    
    expect(screen.getByText('')).toBeInTheDocument()
  })

  it('should show avatar fallback when no image', () => {
    render(
      <MessageBubble 
        message={mockMessage} 
        isOwnMessage={false}
        showAvatar={true}
        otherUser={{ name: 'John Doe', avatar_url: null }}
      />
    )
    
    expect(screen.getByText('J')).toBeInTheDocument()
  })
})

