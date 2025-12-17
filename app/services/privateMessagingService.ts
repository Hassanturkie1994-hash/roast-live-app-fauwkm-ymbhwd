
import { supabase } from '@/app/integrations/supabase/client';
import { Tables } from '@/app/integrations/supabase/types';

type Conversation = Tables<'conversations'>;
type Message = Tables<'messages'>;

export interface ConversationWithUser extends Conversation {
  other_user: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  last_message: Message | null;
  unread_count: number;
}

export interface MessageWithSender extends Message {
  sender: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

class PrivateMessagingService {
  /**
   * Get or create a conversation between two users
   */
  async getOrCreateConversation(userId1: string, userId2: string): Promise<Conversation | null> {
    try {
      // Check if conversation already exists (in either direction)
      const { data: existing, error: fetchError } = await supabase
        .from('conversations')
        .select('*')
        .or(`and(user1_id.eq.${userId1},user2_id.eq.${userId2}),and(user1_id.eq.${userId2},user2_id.eq.${userId1})`)
        .single();

      if (existing) {
        return existing;
      }

      // Create new conversation
      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          user1_id: userId1,
          user2_id: userId2,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating conversation:', createError);
        return null;
      }

      return newConversation;
    } catch (error) {
      console.error('Error in getOrCreateConversation:', error);
      return null;
    }
  }

  /**
   * Get all conversations for a user
   */
  async getUserConversations(userId: string): Promise<ConversationWithUser[]> {
    try {
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
        return [];
      }

      if (!conversations || conversations.length === 0) {
        return [];
      }

      // Fetch other user details and last message for each conversation
      const conversationsWithDetails = await Promise.all(
        conversations.map(async (conv) => {
          const otherUserId = conv.user1_id === userId ? conv.user2_id : conv.user1_id;

          // Fetch other user profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, username, display_name, avatar_url')
            .eq('id', otherUserId)
            .single();

          // Fetch last message
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Count unread messages
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .neq('sender_id', userId)
            .is('read_at', null);

          return {
            ...conv,
            other_user: profile || {
              id: otherUserId,
              username: 'Unknown',
              display_name: 'Unknown User',
              avatar_url: null,
            },
            last_message: lastMessage || null,
            unread_count: unreadCount || 0,
          };
        })
      );

      return conversationsWithDetails;
    } catch (error) {
      console.error('Error in getUserConversations:', error);
      return [];
    }
  }

  /**
   * Get messages for a conversation
   */
  async getConversationMessages(conversationId: string): Promise<MessageWithSender[]> {
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(id, username, display_name, avatar_url)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return [];
      }

      return (messages || []) as unknown as MessageWithSender[];
    } catch (error) {
      console.error('Error in getConversationMessages:', error);
      return [];
    }
  }

  /**
   * Send a message
   */
  async sendMessage(conversationId: string, senderId: string, content: string): Promise<Message | null> {
    try {
      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          content,
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        return null;
      }

      // Update conversation's updated_at timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      return message;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      return null;
    }
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    try {
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId)
        .is('read_at', null);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  /**
   * Subscribe to new messages in a conversation
   */
  subscribeToConversation(conversationId: string, callback: (message: Message) => void) {
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          callback(payload.new as Message);
        }
      )
      .subscribe();

    return channel;
  }

  /**
   * Subscribe to conversation updates (for inbox)
   */
  subscribeToUserConversations(userId: string, callback: () => void) {
    const channel = supabase
      .channel(`user_conversations:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `or(user1_id.eq.${userId},user2_id.eq.${userId})`,
        },
        () => {
          callback();
        }
      )
      .subscribe();

    return channel;
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string): Promise<boolean> {
    try {
      // Delete all messages first
      await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', conversationId);

      // Delete conversation
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (error) {
        console.error('Error deleting conversation:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteConversation:', error);
      return false;
    }
  }
}

export const privateMessagingService = new PrivateMessagingService();
