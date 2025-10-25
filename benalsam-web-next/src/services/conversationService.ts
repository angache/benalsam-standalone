import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { addUserActivity } from '@/services/userActivityService';
import { Conversation, Message } from '@/types';

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

export const markMessagesAsRead = async (
  conversationId: string,
  userId: string
): Promise<boolean> => {
  try {
    if (!conversationId || !userId) {
      throw new ValidationError('Conversation ID and user ID are required');
    }

    // Add timeout to prevent hanging
    const updatePromise = supabase
      .from('messages')
      .update({ 
        is_read: true,
        read_at: new Date().toISOString(),
        status: 'read'
      })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .eq('is_read', false);

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Mark as read timeout')), 5000)
    );

    const { error } = await Promise.race([updatePromise, timeoutPromise]) as any;

    if (error) {
      throw new DatabaseError('Failed to mark messages as read', error);
    }

    return true;
  } catch (error) {
    console.error('Error in markMessagesAsRead:', error);
    return false;
  }
};

export const subscribeToMessages = (conversationId: string, onNewMessage: (message: Message) => void) => {
  if (!conversationId || !onNewMessage) return null;

  const channel = supabase
    .channel(`messages:${conversationId}`)
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
        
        const { data: messageWithSender, error } = await supabase
          .from('messages')
          .select(`
            *,
            sender:profiles!sender_id(id, name, avatar_url)
          `)
          .eq('id', payload.new.id)
          .single();

        if (error) {
          console.error('❌ Error fetching message with sender:', error);
        } else if (messageWithSender) {
          console.log('✅ New message received:', messageWithSender);
          onNewMessage(messageWithSender);
        } else {
          console.warn('⚠️ Message received but no data:', payload);
        }
      }
    )
    .subscribe((status) => {
      console.log(`📡 [subscribeToMessages] Subscription status: ${status}`, { conversationId });
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