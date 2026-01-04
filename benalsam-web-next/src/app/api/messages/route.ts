import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/utils/production-logger';
import { validateQuery, commonSchemas } from '@/lib/api-validation';
import { z } from 'zod';
import { createSuccessResponse, apiErrors } from '@/lib/api-errors';
import { getServerUser } from '@/lib/supabase-server';

/**
 * Schema for GET /api/messages query parameters
 */
const getMessagesQuerySchema = z.object({
  userId: commonSchemas.uuid,
})

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getServerUser()
    if (!user?.id) {
      return apiErrors.unauthorized('Oturum açmanız gerekiyor', request.nextUrl.pathname)
    }

    // Validate query parameters
    const validation = validateQuery(request, getMessagesQuerySchema)
    if (!validation.success) {
      return validation.response
    }

    const { userId } = validation.data

    // Verify userId matches authenticated user
    if (userId !== user.id) {
      return apiErrors.forbidden('Sadece kendi mesajlarınızı görüntüleyebilirsiniz', request.nextUrl.pathname)
    }

    if (!supabaseAdmin) {
      return apiErrors.internalError(
        'Server configuration error',
        {},
        request.nextUrl.pathname
      )
    }

    // Fetch conversations where user is participant - use admin client to bypass RLS
    const { data: conversations, error: convError } = await supabaseAdmin
      .from('conversations')
      .select(`
        *,
        user1:profiles!conversations_user1_id_fkey(id, name, avatar_url),
        user2:profiles!conversations_user2_id_fkey(id, name, avatar_url),
        listing:listings!conversations_listing_id_fkey(id, title, user_id),
        messages(content, created_at, sender_id, is_read)
      `)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('updated_at', { ascending: false });

    if (convError) {
      return apiErrors.databaseError(
        'Failed to fetch conversations',
        { error: convError.message, userId },
        request.nextUrl.pathname
      )
    }

    // Format conversations with last message
    const formattedConversations = (conversations || []).map(conv => {
      const otherUser = conv.user1_id === userId ? conv.user2 : conv.user1;
      const messages = Array.isArray(conv.messages) ? conv.messages : [];
      const lastMessage = messages[messages.length - 1] || null;

      return {
        id: conv.id,
        user1_id: conv.user1_id,
        user2_id: conv.user2_id,
        listing_id: conv.listing_id,
        listing: conv.listing,
        otherUser,
        lastMessage,
        created_at: conv.created_at,
        updated_at: conv.updated_at,
        last_message_at: conv.last_message_at,
        unreadCount: messages.filter(m => !m.is_read && m.sender_id !== userId).length
      };
    });

    return createSuccessResponse(formattedConversations)
  } catch (error: unknown) {
    return apiErrors.internalError(
      'Failed to fetch messages',
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      request.nextUrl.pathname
    )
  }
}

/**
 * Schema for POST /api/messages request body
 */
const createMessageSchema = z.object({
  conversationId: commonSchemas.uuid,
  senderId: commonSchemas.uuid,
  content: z.string().min(1, 'Mesaj içeriği boş olamaz').max(5000, 'Mesaj en fazla 5000 karakter olabilir'),
  messageType: z.enum(['text', 'image', 'file']).optional().default('text'),
})

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getServerUser()
    if (!user?.id) {
      return apiErrors.unauthorized('Oturum açmanız gerekiyor', request.nextUrl.pathname)
    }

    // Validate request body
    const validation = await validateBody(request, createMessageSchema)
    if (!validation.success) {
      return validation.response
    }

    const { conversationId, senderId, content, messageType } = validation.data

    // Verify senderId matches authenticated user
    if (senderId !== user.id) {
      return apiErrors.forbidden('Sadece kendi adınıza mesaj gönderebilirsiniz', request.nextUrl.pathname)
    }

    if (!supabaseAdmin) {
      return apiErrors.internalError(
        'Server configuration error',
        {},
        request.nextUrl.pathname
      )
    }

    // Verify user is participant in conversation
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('id, user1_id, user2_id')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return apiErrors.notFound('Conversation', request.nextUrl.pathname)
    }

    if (conversation.user1_id !== senderId && conversation.user2_id !== senderId) {
      return apiErrors.forbidden(
        'User is not a participant in this conversation',
        request.nextUrl.pathname
      )
    }

    // Insert message
    const { data: message, error: messageError } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content: content,
        message_type: messageType,
        is_read: false,
        created_at: new Date().toISOString()
      })
      .select(`
        *,
        sender:profiles!sender_id(id, name, avatar_url)
      `)
      .single();

    if (messageError) {
      return apiErrors.databaseError(
        'Failed to send message',
        { error: messageError.message, conversationId, senderId },
        request.nextUrl.pathname
      )
    }

    // Update conversation's updated_at timestamp
    await supabaseAdmin
      .from('conversations')
      .update({
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    return createSuccessResponse(message)
  } catch (error: unknown) {
    return apiErrors.internalError(
      'Failed to send message',
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      request.nextUrl.pathname
    )
  }
}
