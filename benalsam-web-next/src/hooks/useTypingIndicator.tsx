'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface TypingState {
  userId: string;
  isTyping: boolean;
  timestamp: number;
}

export function useTypingIndicator(conversationId: string | null, currentUserId: string, otherUserId: string) {
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);

  useEffect(() => {
    if (!conversationId) return;

    // Subscribe to typing events
    const channel = supabase
      .channel(`typing:${conversationId}`)
      .on(
        'broadcast',
        { event: 'typing' },
        (payload) => {
          const { userId, isTyping } = payload.payload as TypingState;
          
          // Only show typing indicator for other user
          if (userId === otherUserId) {
            setIsOtherUserTyping(isTyping);
            
            // Auto-hide after 3 seconds
            if (isTyping) {
              setTimeout(() => {
                setIsOtherUserTyping(false);
              }, 3000);
            }
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [conversationId, otherUserId]);

  // Send typing status
  const sendTypingStatus = (isTyping: boolean) => {
    if (!conversationId) return;
    
    supabase
      .channel(`typing:${conversationId}`)
      .send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          userId: currentUserId,
          isTyping,
          timestamp: Date.now()
        }
      });
  };

  return {
    isOtherUserTyping,
    sendTypingStatus
  };
}

// Typing indicator UI component
export function TypingIndicatorUI({ isTyping, userName }: { isTyping: boolean; userName: string }) {
  if (!isTyping) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
      <span>{userName} yazıyor...</span>
    </div>
  );
}

