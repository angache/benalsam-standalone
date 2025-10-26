'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { logger } from '@/utils/production-logger'

interface NotificationContextType {
  unreadCount: number
  refreshUnreadCount: () => Promise<void>
  requestPermission: () => Promise<void>
  setActiveConversation: (conversationId: string | null) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [permissionGranted, setPermissionGranted] = useState(false)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)

  // Fetch unread count
  const fetchUnreadCount = async () => {
    if (!user?.id) return

    try {
      logger.debug('[NotificationContext] Fetching unread count...')
      const response = await fetch(`/api/messages/unread-count?userId=${user.id}`)
      if (response.ok) {
        const { count } = await response.json()
        logger.debug('[NotificationContext] Unread count updated', { count })
        setUnreadCount(count || 0)
        
        // Update tab title
        updateTabTitle(count || 0)
      }
    } catch (error) {
      logger.error('[NotificationContext] Failed to fetch unread count', { error })
    }
  }

  // Update browser tab title
  const updateTabTitle = (count: number) => {
    const baseTitle = 'Benalsam'
    if (count > 0) {
      document.title = `(${count}) ${baseTitle}`
    } else {
      document.title = baseTitle
    }
  }

  // Request notification permission
  const requestPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      setPermissionGranted(permission === 'granted')
    }
  }

  // Show browser notification
  const showNotification = (conversationId: string, title: string, body: string, icon?: string) => {
    // Don't show notification if:
    // 1. Permission not granted
    // 2. User is viewing this conversation
    // 3. Tab is visible (user is actively using the app)
    if (!permissionGranted || !('Notification' in window)) return
    if (conversationId === activeConversationId) {
      logger.debug('[NotificationContext] Notification suppressed: user is viewing this conversation')
      return
    }
    if (document.visibilityState === 'visible' && conversationId === activeConversationId) {
      logger.debug('[NotificationContext] Notification suppressed: tab is visible and viewing conversation')
      return
    }

    try {
      logger.info('[NotificationContext] Showing notification', { conversationId, title })
      new Notification(title, {
        body,
        icon: icon || '/favicon.ico',
        badge: '/favicon.ico',
        tag: `benalsam-${conversationId}`,
        renotify: true
      })
    } catch (error) {
      logger.error('[NotificationContext] Failed to show notification', { error })
    }
  }

  // Subscribe to new messages
  useEffect(() => {
    if (!user?.id) return

    // Check permission on mount
    if ('Notification' in window) {
      setPermissionGranted(Notification.permission === 'granted')
    }

    // Initial fetch
    fetchUnreadCount()

    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)

    // Subscribe to realtime updates for all user's conversations
    logger.debug('[NotificationContext] Setting up realtime for user', { userId: user.id })
    
    const channel = supabase
      .channel('user-messages', {
        config: {
          broadcast: { self: false }
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          logger.debug('[NotificationContext] New message event', { payload })
          const newMessage = payload.new as any

          // Check if this message is for current user
          logger.debug('[NotificationContext] Checking conversation', { conversationId: newMessage.conversation_id })
          const { data: conversation, error } = await supabase
            .from('conversations')
            .select('user1_id, user2_id')
            .eq('id', newMessage.conversation_id)
            .single()

          logger.debug('[NotificationContext] Conversation check', { conversation, error })

          if (conversation && 
              (conversation.user1_id === user.id || conversation.user2_id === user.id) &&
              newMessage.sender_id !== user.id) {
            logger.debug('[NotificationContext] Message is for current user!')
            
            // Refresh count
            await fetchUnreadCount()

            // Show notification
            const { data: sender } = await supabase
              .from('profiles')
              .select('name, avatar_url')
              .eq('id', newMessage.sender_id)
              .single()

            if (sender) {
              showNotification(
                newMessage.conversation_id,
                `${sender.name} size mesaj gönderdi`,
                newMessage.content,
                sender.avatar_url
              )
            }
          } else {
            logger.debug('[NotificationContext] Message not for current user or sent by user')
          }
        }
      )
      .subscribe((status, err) => {
        logger.debug('[NotificationContext] Subscription status', { status, err })
      })

    return () => {
      clearInterval(interval)
      channel.unsubscribe()
    }
  }, [user?.id, permissionGranted])

  const value = {
    unreadCount,
    refreshUnreadCount: fetchUnreadCount,
    requestPermission,
    setActiveConversation: setActiveConversationId
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

