/**
 * Messaging Configuration
 * 
 * Centralized configuration for messaging features
 * Eliminates magic numbers and makes tuning easier
 */

export const MESSAGING_CONFIG = {
  // API & Network
  REFRESH_INTERVAL: 30000, // 30 seconds - unread count refresh
  MARK_READ_DELAY: 1000, // 1 second - delay before marking as read
  MESSAGE_LIMIT: 100, // Max messages to fetch per conversation
  API_TIMEOUT: 10000, // 10 seconds - API request timeout
  
  // Rate Limiting
  RATE_LIMIT_REQUESTS: 60, // Max requests per minute per user
  RATE_LIMIT_WINDOW: 60000, // 1 minute in milliseconds
  
  // UI & Display
  UNREAD_MAX_DISPLAY: 9, // Show "9+" for counts above this
  NOTIFICATION_TIMEOUT: 5000, // 5 seconds - notification display time
  CONVERSATION_PREVIEW_LENGTH: 50, // Characters in conversation preview
  
  // Cache & Performance
  USER_PROFILE_CACHE_TTL: 5 * 60 * 1000, // 5 minutes
  CONVERSATION_CACHE_TTL: 2 * 60 * 1000, // 2 minutes
  
  // Realtime & WebSocket
  RECONNECT_MAX_ATTEMPTS: 5, // Max reconnection attempts
  RECONNECT_BASE_DELAY: 1000, // 1 second - base delay between reconnects
  WEBSOCKET_TIMEOUT: 10000, // 10 seconds - connection timeout
  
  // Retry Logic
  RETRY_ATTEMPTS: 3, // Max retry attempts for failed operations
  RETRY_DELAY: 1000, // 1 second - delay between retries
  
  // Pagination
  MESSAGES_PER_PAGE: 50, // Messages loaded per page
  CONVERSATIONS_PER_PAGE: 20, // Conversations loaded per page
  
  // Typing Indicator
  TYPING_TIMEOUT: 3000, // 3 seconds - typing indicator timeout
  TYPING_DEBOUNCE: 500, // 500ms - debounce for typing events
} as const

// Export individual configs for convenience
export const {
  REFRESH_INTERVAL,
  MARK_READ_DELAY,
  MESSAGE_LIMIT,
  API_TIMEOUT,
  RATE_LIMIT_REQUESTS,
  RATE_LIMIT_WINDOW,
  UNREAD_MAX_DISPLAY,
  NOTIFICATION_TIMEOUT,
  CONVERSATION_PREVIEW_LENGTH,
  USER_PROFILE_CACHE_TTL,
  CONVERSATION_CACHE_TTL,
  RECONNECT_MAX_ATTEMPTS,
  RECONNECT_BASE_DELAY,
  WEBSOCKET_TIMEOUT,
  RETRY_ATTEMPTS,
  RETRY_DELAY,
  MESSAGES_PER_PAGE,
  CONVERSATIONS_PER_PAGE,
  TYPING_TIMEOUT,
  TYPING_DEBOUNCE,
} = MESSAGING_CONFIG

export default MESSAGING_CONFIG

