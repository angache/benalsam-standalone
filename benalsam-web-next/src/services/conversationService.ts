import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { addUserActivity } from '@/services/userActivityService';
import { Conversation, Message } from '@/types';
import { logger } from '@/utils/production-logger';

// Custom error classes for better error handling
class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

class DatabaseError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'DatabaseError';
  }
}

// Error handling helper
const handleError = (error: any, title = "Hata", description = "Bir sorun oluştu") => {
  console.error(`Error in ${title}:`, error);
  toast({ 
    title: title, 
    description: error?.message || description, 
    variant: "destructive" 
  });
  return null;
};

// Validation helper
const validateConversationData = (user1Id: string, user2Id: string): boolean => {
  if (!user1Id || !user2Id) {
    console.error('Missing user IDs for conversation');
    return false;
  }
  return true;
};

export const getOrCreateConversation = async (
  user1Id: string,
  user2Id: string,
  offerId: string | null = null,
  listingId: string | null = null
): Promise<string> => {
  try {
    if (!validateConversationData(user1Id, user2Id)) {
      throw new ValidationError('Both user IDs are required');
    }

    // Check for existing conversation
    console.log('Searching for existing conversation between:', user1Id, user2Id, 'offerId:', offerId);
    const { data: existingConversation, error: searchError } = await supabase
      .from('conversations')
      .select('id')
      .or(`and(user1_id.eq.${user1Id},user2_id.eq.${user2Id}),and(user1_id.eq.${user2Id},user2_id.eq.${user1Id})`)
      .eq('offer_id', offerId)
      .maybeSingle();

    if (searchError && searchError.code !== 'PGRST116') {
      throw new DatabaseError('Failed to search for existing conversation', searchError);
    }

    if (existingConversation) {
      console.log('Found existing conversation:', existingConversation.id);
      return existingConversation.id;
    }

    console.log('No existing conversation found, creating new one...');

    // Create new conversation
    const { data: newConversation, error: createError } = await supabase
      .from('conversations')
      .insert({
        user1_id: user1Id,
        user2_id: user2Id,
        offer_id: offerId,
        listing_id: listingId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (createError) {
      throw new DatabaseError('Failed to create conversation', createError);
    }

    // Add participants - this is critical for RLS policies
    const participantInserts = [
      { conversation_id: newConversation.id, user_id: user1Id },
      { conversation_id: newConversation.id, user_id: user2Id }
    ];

    console.log('Adding conversation participants:', participantInserts);
    
    const { error: participantError } = await supabase
      .from('conversation_participants')
      .insert(participantInserts)
      .select();

    if (participantError) {
      console.error('Error adding conversation participants:', participantError);
      // If participants can't be added, delete the conversation since RLS will fail
      await supabase.from('conversations').delete().eq('id', newConversation.id);
      throw new DatabaseError('Failed to add conversation participants', participantError);
    }

    console.log('✅ Participants added successfully');

    // Update the offer with the new conversation_id if offerId is provided
    if (offerId) {
      console.log('Updating offer with conversation_id:', newConversation.id);
      const { error: offerUpdateError } = await supabase
        .from('offers')
        .update({ conversation_id: newConversation.id })
        .eq('id', offerId);

      if (offerUpdateError) {
        console.error('Error updating offer with conversation_id:', offerUpdateError);
        // Don't throw error here, as the conversation is already created successfully
      } else {
        console.log('✅ Offer updated with conversation_id');
      }
    }

    return newConversation.id;
  } catch (error) {
    console.error('Error in getOrCreateConversation:', error);
    return handleError(error, "Sohbet Oluşturulamadı", "Sohbet oluşturulurken bir sorun oluştu");
  }
};

/**
 * Send a message in a conversation
 * 
 * @param conversationId - UUID of the conversation
 * @param senderId - UUID of the message sender
 * @param content - Message content (will be sanitized)
 * @param messageType - Type of message (text, image, etc.)
 * @returns Promise<Message> - The created message object
 * @throws ValidationError if parameters are invalid
 * @throws Error if API call fails
 * 
 * @example
 * const message = await sendMessage(
 *   'conv-123',
 *   'user-456', 
 *   'Hello!',
 *   'text'
 * )
 */
export const sendMessage = async (
  conversationId: string,
  senderId: string,
  content: string,
  messageType: Message['message_type'] = 'text'
): Promise<Message> => {
  try {
    if (!conversationId || !senderId || !content) {
      throw new ValidationError('Conversation ID, sender ID and content are required');
    }

    console.log('📤 Sending message via API...', { conversationId, senderId });

    // Send message via API (bypasses RLS)
    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversationId,
        senderId,
        content,
        messageType
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send message');
    }

    const result = await response.json();
    console.log('✅ Message sent successfully:', result.data);

    // Add user activity (optional - don't fail if this fails)
    try {
      await addUserActivity(
        senderId,
        'message_sent',
        'Mesaj gönderildi',
        'Yeni bir mesaj gönderildi',
        result.data.id
      );
    } catch (activityError) {
      console.warn('⚠️ Failed to log user activity (non-critical):', activityError);
    }

    return result.data;
  } catch (error) {
    console.error('Error in sendMessage:', error);
    return handleError(error, "Mesaj Gönderilemedi", "Mesaj gönderilirken bir sorun oluştu");
  }
};

/**
 * Fetch messages for a conversation
 * 
 * @param conversationId - UUID of the conversation
 * @param limit - Maximum number of messages to fetch (default: 50)
 * @returns Promise<Message[]> - Array of messages with sender info
 * @throws DatabaseError if query fails
 */
export const fetchMessages = async (
  conversationId: string,
  limit: number = 50
): Promise<Message[]> => {
  try {
    if (!conversationId) {
      throw new ValidationError('Conversation ID is required');
    }

    // Use API endpoint - server-side has service_role permissions
    const response = await fetch(`/api/conversations/${conversationId}/messages?limit=${limit}`);
    
    if (!response.ok) {
      throw new DatabaseError('Failed to fetch messages');
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error in fetchMessages:', error);
    return [];
  }
};

export const fetchConversationDetails = async (
  conversationId: string
): Promise<Conversation> => {
  try {
    if (!conversationId) {
      throw new ValidationError('Conversation ID is required');
    }

    // Use API endpoint - server-side has service_role permissions
    const response = await fetch(`/api/conversations/${conversationId}`);
    
    if (!response.ok) {
      toast({ 
        title: "Sohbet Detayları Yüklenemedi", 
        description: "Sohbet detayları yüklenirken bir hata oluştu.", 
        variant: "destructive" 
      });
      throw new DatabaseError('Failed to fetch conversation details');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error in fetchConversationDetails:', error);
    return null;
  }
};

export const getUserConversations = async (userId: string): Promise<Conversation[]> => {
  try {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        user1:profiles!conversations_user1_id_fkey(id, name, avatar_url),
        user2:profiles!conversations_user2_id_fkey(id, name, avatar_url),
        listing:listings!conversations_listing_id_fkey(id, title),
        last_message:messages(content, created_at, sender_id, is_read)
      `)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('created_at', { foreignTable: 'messages', ascending: false })
      .limit(1, { foreignTable: 'messages' })
      .order('updated_at', { ascending: false });

    if (error) {
      throw new DatabaseError('Failed to fetch conversations', error);
    }

    // Fetch offer details for conversations with offers
    const conversationsWithOffers = await Promise.all(
      (data || []).map(async (conversation) => {
        if (conversation.offer_id) {
          const { data: offerData, error: offerError } = await supabase
            .from('offers')
            .select('id, status')
            .eq('id', conversation.offer_id)
            .single();

          if (!offerError && offerData) {
            return { ...conversation, offer: offerData };
          }
        }
        return conversation;
      })
    );

    const formattedData = conversationsWithOffers.map(conv => ({
      ...conv,
      last_message: Array.isArray(conv.last_message) ? conv.last_message[0] : conv.last_message,
    }));

    return formattedData || [];
  } catch (error) {
    console.error('Error in getUserConversations:', error);
    return [];
  }
};

/**
 * Mark all unread messages in a conversation as read
 * 
 * @param conversationId - UUID of the conversation
 * @param userId - UUID of the current user
 * @returns Promise<boolean> - Success status
 * @throws Error if update fails
 * 
 * Note: Uses API endpoint to bypass RLS, includes 5s timeout
 */
export const markMessagesAsRead = async (
  conversationId: string,
  userId: string
): Promise<boolean> => {
  try {
    if (!conversationId || !userId) {
      throw new ValidationError('Conversation ID and user ID are required');
    }

    // Call API endpoint with timeout
    const fetchPromise = fetch('/api/messages/mark-read', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ conversationId }),
    });

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Mark as read timeout')), 5000)
    );

    const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;

    if (!response.ok) {
      throw new DatabaseError('Failed to mark messages as read');
    }

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Error in markMessagesAsRead:', error);
    return false;
  }
};

import { USER_PROFILE_CACHE_TTL } from '@/config/messaging';

// User profile cache to avoid N+1 queries
const userProfileCache = new Map<string, { id: string; name: string; avatar_url: string | null }>();
const CACHE_TTL = USER_PROFILE_CACHE_TTL;

// Helper to get or fetch user profile
async function getUserProfile(userId: string) {
  const cached = userProfileCache.get(userId);
  if (cached) return cached;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, avatar_url')
      .eq('id', userId)
      .single();

    if (!error && data) {
      userProfileCache.set(userId, data);
      // Auto-expire cache after TTL
      setTimeout(() => userProfileCache.delete(userId), CACHE_TTL);
      return data;
    }
  } catch (err) {
    console.error('Error fetching user profile:', err);
  }
  return null;
}

/**
 * Subscribe to realtime message updates for a conversation
 * 
 * @param conversationId - UUID of the conversation
 * @param onNewMessage - Callback function for new messages
 * @returns RealtimeChannel | null - Channel for unsubscribing
 * 
 * Features:
 * - User profile caching (5min TTL)
 * - Auto-reconnect on connection loss
 * - Broadcasts to self (see own messages)
 * 
 * @example
 * const channel = subscribeToMessages('conv-123', (message) => {
 *   console.log('New message:', message)
 * })
 * 
 * // Cleanup
 * if (channel) channel.unsubscribe()
 */
export const subscribeToMessages = (conversationId: string, onNewMessage: (message: Message) => void) => {
  if (!conversationId || !onNewMessage) return null;

  const channel = supabase
    .channel(`messages:${conversationId}`, {
      config: {
        broadcast: { self: true }
      }
    })
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      async (payload) => {
        console.log('🔔 INSERT event received:', payload);
        
        // Use payload data directly and fetch sender from cache
        const newMessage = payload.new as any;
        
        // Get sender profile (from cache or fetch)
        const sender = await getUserProfile(newMessage.sender_id);
        
        if (sender) {
          const messageWithSender = {
            ...newMessage,
            sender
          };
          console.log('✅ New message received:', messageWithSender);
          onNewMessage(messageWithSender);
        } else {
          console.warn('⚠️ Could not fetch sender profile:', newMessage.sender_id);
          // Still emit message without sender details
          onNewMessage(newMessage);
        }
      }
    )
    .subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        console.log(`✅ [subscribeToMessages] Connected`, { conversationId });
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`❌ [subscribeToMessages] Channel error:`, err, { conversationId });
      } else if (status === 'TIMED_OUT') {
        console.error(`⏱️ [subscribeToMessages] Connection timed out`, { conversationId });
      } else if (status === 'CLOSED') {
        console.warn(`🔌 [subscribeToMessages] Connection closed`, { conversationId });
      } else {
        console.log(`📡 [subscribeToMessages] Status: ${status}`, { conversationId });
      }
    });

  return channel;
};

export const subscribeToMessageStatusChanges = (conversationId: string, onStatusUpdate: (message: Message) => void) => {
  if (!conversationId || !onStatusUpdate) return null;

  const channel = supabase
    .channel(`message_status:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      (payload) => {
        onStatusUpdate(payload.new);
      }
    )
    .subscribe((status) => {
      console.log(`📡 [subscribeToMessageStatusChanges] Subscription status: ${status}`);
    });

  return channel;
};

export const getTotalUnreadMessages = async (userId: string): Promise<number> => {
  try {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    // Get conversations where user is participant
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

    if (convError) {
      throw new DatabaseError('Failed to get user conversations', convError);
    }

    if (!conversations || conversations.length === 0) {
      return 0;
    }

    const conversationIds = conversations.map(c => c.id);

    // Count unread messages
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .in('conversation_id', conversationIds)
      .neq('sender_id', userId)
      .eq('is_read', false);

    if (error) {
      throw new DatabaseError('Failed to get unread message count', error);
    }

    return count || 0;
  } catch (error) {
    console.error('Error in getTotalUnreadMessages:', error);
    return 0;
  }
};

export const getUnreadMessageCounts = async (
  userId: string
): Promise<Record<string, number>> => {
  try {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    // Get conversations where user is participant
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

    if (convError) {
      throw new DatabaseError('Failed to get user conversations', convError);
    }

    if (!conversations || conversations.length === 0) {
      return {};
    }

    const conversationIds = conversations.map(c => c.id);

    // Get unread messages
    const { data, error } = await supabase
      .from('messages')
      .select('conversation_id')
      .in('conversation_id', conversationIds)
      .neq('sender_id', userId)
      .eq('is_read', false);

    if (error) {
      throw new DatabaseError('Failed to get unread message counts', error);
    }

    const counts: Record<string, number> = {};
    data?.forEach(message => {
      counts[message.conversation_id] = (counts[message.conversation_id] || 0) + 1;
    });

    return counts;
  } catch (error) {
    console.error('Error in getUnreadMessageCounts:', error);
    return {};
  }
};

// NEW: Enhanced conversation creation with full conversation object return
export const findOrCreateConversation = async (
  user1Id: string,
  user2Id: string,
  offerId?: string
): Promise<Conversation> => {
  try {
    if (!user1Id || !user2Id) {
      throw new ValidationError('Both user IDs are required');
    }

    // Check for existing conversation
    const { data: existingConversation, error: findError } = await supabase
      .from('conversations')
      .select('*')
      .or(`and(user1_id.eq.${user1Id},user2_id.eq.${user2Id}),and(user1_id.eq.${user2Id},user2_id.eq.${user1Id})`)
      .eq('offer_id', offerId || null)
      .single();

    if (findError && findError.code !== 'PGRST116') { // Not found error is expected
      throw new DatabaseError('Failed to check existing conversation');
    }

    if (existingConversation) {
      return existingConversation;
    }

    // Create new conversation
    const { data: newConversation, error: createError } = await supabase
      .from('conversations')
      .insert({
        user1_id: user1Id,
        user2_id: user2Id,
        offer_id: offerId || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      throw new DatabaseError('Failed to create conversation');
    }

    // Add participants
    const participantInserts = [
      { user_id: user1Id, conversation_id: newConversation.id },
      { user_id: user2Id, conversation_id: newConversation.id }
    ];

    const { error: participantsError } = await supabase
      .from('conversation_participants')
      .insert(participantInserts);

    if (participantsError) {
      throw new DatabaseError('Failed to add conversation participants');
    }

    return newConversation;
  } catch (error) {
    console.error('Error in findOrCreateConversation:', error);
    return null;
  }
}; 