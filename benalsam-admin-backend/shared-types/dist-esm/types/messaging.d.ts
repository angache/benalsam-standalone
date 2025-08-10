import { MessageStatusType } from './enums';
import { UserProfile } from './user';
import { Listing } from './listing';
export interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    message_type: 'text' | 'image' | 'system';
    created_at: string;
    is_read: boolean;
    status?: MessageStatusType;
    sender?: UserProfile;
}
export interface Conversation {
    id: string;
    user1_id: string;
    user2_id: string;
    offer_id?: string;
    listing_id?: string;
    created_at: string;
    updated_at: string;
    last_message_at?: string;
    user1?: UserProfile;
    user2?: UserProfile;
    listing?: Pick<Listing, 'id' | 'title'>;
    last_message?: Message;
}
//# sourceMappingURL=messaging.d.ts.map