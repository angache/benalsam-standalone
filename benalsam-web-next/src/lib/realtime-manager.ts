/**
 * Global Realtime Manager
 * 
 * Consolidates multiple Supabase realtime subscriptions into a single
 * event bus to reduce WebSocket connections and improve performance.
 * 
 * Features:
 * - Single WebSocket connection per user
 * - Event bus pattern for multiple listeners
 * - Automatic reconnection
 * - Memory efficient
 * - Type-safe event handling
 * 
 * Usage:
 * import { realtimeManager } from '@/lib/realtime-manager'
 * 
 * // Subscribe to events
 * const unsubscribe = realtimeManager.on('message:new', (data) => {
 *   console.log('New message:', data)
 * })
 * 
 * // Unsubscribe
 * unsubscribe()
 */

import { supabase } from '@/lib/supabase'
import { logger } from '@/utils/production-logger'
import type { RealtimeChannel } from '@supabase/supabase-js'

// Event types
export type RealtimeEvent = 
  | 'message:new'
  | 'message:update'
  | 'message:status'
  | 'conversation:update'
  | 'notification:new'
  | 'user:online'
  | 'user:offline'

export type RealtimeEventData = {
  'message:new': {
    conversationId: string
    message: any
  }
  'message:update': {
    conversationId: string
    messageId: string
    updates: any
  }
  'message:status': {
    conversationId: string
    messageId: string
    status: string
  }
  'conversation:update': {
    conversationId: string
    updates: any
  }
  'notification:new': {
    type: string
    data: any
  }
  'user:online': {
    userId: string
  }
  'user:offline': {
    userId: string
  }
}

type EventCallback<T extends RealtimeEvent> = (data: RealtimeEventData[T]) => void

class RealtimeManager {
  private static instance: RealtimeManager
  private channel: RealtimeChannel | null = null
  private listeners: Map<RealtimeEvent, Set<EventCallback<any>>> = new Map()
  private userId: string | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): RealtimeManager {
    if (!RealtimeManager.instance) {
      RealtimeManager.instance = new RealtimeManager()
    }
    return RealtimeManager.instance
  }

  /**
   * Initialize the realtime manager for a user
   */
  public async initialize(userId: string): Promise<void> {
    if (this.userId === userId && this.channel) {
      logger.debug('[RealtimeManager] Already initialized for user', { userId })
      return
    }

    // Cleanup old connection if exists
    if (this.channel) {
      await this.disconnect()
    }

    this.userId = userId
    await this.connect()
  }

  /**
   * Connect to Supabase realtime
   */
  private async connect(): Promise<void> {
    if (!this.userId) {
      logger.warn('[RealtimeManager] Cannot connect without userId')
      return
    }

    try {
      logger.debug('[RealtimeManager] Connecting...', { userId: this.userId })

      this.channel = supabase
        .channel(`user:${this.userId}`, {
          config: {
            broadcast: { self: true },
            presence: { key: this.userId }
          }
        })
        // Messages
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages'
          },
          (payload) => this.handleMessageInsert(payload)
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages'
          },
          (payload) => this.handleMessageUpdate(payload)
        )
        // Conversations
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'conversations'
          },
          (payload) => this.handleConversationUpdate(payload)
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            logger.info('[RealtimeManager] Connected', { userId: this.userId })
            this.reconnectAttempts = 0
          } else if (status === 'CHANNEL_ERROR') {
            logger.error('[RealtimeManager] Channel error', { userId: this.userId })
            this.handleReconnect()
          } else if (status === 'TIMED_OUT') {
            logger.error('[RealtimeManager] Connection timed out', { userId: this.userId })
            this.handleReconnect()
          } else if (status === 'CLOSED') {
            logger.warn('[RealtimeManager] Connection closed', { userId: this.userId })
            this.handleReconnect()
          } else {
            logger.debug('[RealtimeManager] Status', { status, userId: this.userId })
          }
        })
    } catch (error) {
      logger.error('[RealtimeManager] Connection error', { error, userId: this.userId })
      this.handleReconnect()
    }
  }

  /**
   * Handle automatic reconnection
   */
  private async handleReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('[RealtimeManager] Max reconnect attempts reached', {
        userId: this.userId,
        attempts: this.reconnectAttempts
      })
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

    logger.info('[RealtimeManager] Reconnecting...', {
      userId: this.userId,
      attempt: this.reconnectAttempts,
      delay
    })

    setTimeout(() => {
      this.connect()
    }, delay)
  }

  /**
   * Disconnect from Supabase realtime
   */
  public async disconnect(): Promise<void> {
    if (this.channel) {
      logger.debug('[RealtimeManager] Disconnecting...', { userId: this.userId })
      await this.channel.unsubscribe()
      this.channel = null
    }
    this.userId = null
    this.reconnectAttempts = 0
  }

  /**
   * Subscribe to an event
   */
  public on<T extends RealtimeEvent>(
    event: T,
    callback: EventCallback<T>
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }

    this.listeners.get(event)!.add(callback)

    logger.debug('[RealtimeManager] Event listener added', { event })

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(event)
      if (listeners) {
        listeners.delete(callback)
        logger.debug('[RealtimeManager] Event listener removed', { event })
      }
    }
  }

  /**
   * Emit an event to all listeners
   */
  private emit<T extends RealtimeEvent>(event: T, data: RealtimeEventData[T]): void {
    const listeners = this.listeners.get(event)
    if (listeners && listeners.size > 0) {
      logger.debug('[RealtimeManager] Emitting event', { event, listenerCount: listeners.size })
      listeners.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          logger.error('[RealtimeManager] Error in event callback', { error, event })
        }
      })
    }
  }

  /**
   * Handle message insert event
   */
  private handleMessageInsert(payload: any): void {
    const message = payload.new
    logger.debug('[RealtimeManager] Message inserted', { messageId: message.id })

    this.emit('message:new', {
      conversationId: message.conversation_id,
      message
    })
  }

  /**
   * Handle message update event
   */
  private handleMessageUpdate(payload: any): void {
    const message = payload.new
    logger.debug('[RealtimeManager] Message updated', { messageId: message.id })

    this.emit('message:update', {
      conversationId: message.conversation_id,
      messageId: message.id,
      updates: message
    })

    // Also emit status change if status changed
    if (payload.old.status !== message.status) {
      this.emit('message:status', {
        conversationId: message.conversation_id,
        messageId: message.id,
        status: message.status
      })
    }
  }

  /**
   * Handle conversation update event
   */
  private handleConversationUpdate(payload: any): void {
    const conversation = payload.new
    logger.debug('[RealtimeManager] Conversation updated', { conversationId: conversation.id })

    this.emit('conversation:update', {
      conversationId: conversation.id,
      updates: conversation
    })
  }

  /**
   * Get connection status
   */
  public isConnected(): boolean {
    return this.channel !== null && this.userId !== null
  }

  /**
   * Get current user ID
   */
  public getUserId(): string | null {
    return this.userId
  }

  /**
   * Get listener count for debugging
   */
  public getListenerCount(event?: RealtimeEvent): number {
    if (event) {
      return this.listeners.get(event)?.size || 0
    }
    let total = 0
    this.listeners.forEach(listeners => {
      total += listeners.size
    })
    return total
  }
}

// Export singleton instance
export const realtimeManager = RealtimeManager.getInstance()

export default realtimeManager

