
import { supabase } from '@/app/integrations/supabase/client';

export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  updated_at: string;
  other_user?: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  last_message?: {
    content: string;
    created_at: string;
    sender_id: string;
  };
  unread_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

class MessagingService {
  async getOrCreateConversation(userId: string, otherUserId: string): Promise<{ success: boolean; conversation?: Conversation; error?: string }> {
    try {
      const user1 = userId < otherUserId ? userId : otherUserId;
      const user2 = userId < otherUserId ? otherUserId : userId;

      let { data: existing, error: fetchError } = await supabase
        .from('conversations')
        .select('*')
        .or(`and(user1_id.eq.${user1},user2_id.eq.${user2}),and(user1_id.eq.${user2},user2_id.eq.${user1})`)
        .single();

      if (existing) {
        return { success: true, conversation: existing };
      }

      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({ user1_id: user1, user2_id: user2 })
        .select()
        .single();

      if (createError) {
        console.error('Error creating conversation:', createError);
        return { success: false, error: createError.message };
      }

      return { success: true, conversation: newConversation };
    } catch (error: any) {
      console.error('Error in getOrCreateConversation:', error);
      return { success: false, error: error.message };
    }
  }

  async getConversations(userId: string): Promise<{ success: boolean; conversations?: Conversation[]; error?: string }> {
    try {
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
        return { success: false, error: error.message };
      }

      const enrichedConversations = await Promise.all(
        (conversations || []).map(async (conv) => {
          const otherUserId = conv.user1_id === userId ? conv.user2_id : conv.user1_id;

          const { data: otherUser } = await supabase
            .from('profiles')
            .select('id, username, display_name, avatar_url')
            .eq('id', otherUserId)
            .single();

          const { data: lastMessage } = await supabase
            .from('messages')
            .select('content, created_at, sender_id')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .neq('sender_id', userId)
            .is('read_at', null);

          return {
            ...conv,
            other_user: otherUser || undefined,
            last_message: lastMessage || undefined,
            unread_count: unreadCount || 0,
          };
        })
      );

      return { success: true, conversations: enrichedConversations };
    } catch (error: any) {
      console.error('Error in getConversations:', error);
      return { success: false, error: error.message };
    }
  }

  async getMessages(conversationId: string): Promise<{ success: boolean; messages?: Message[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return { success: false, error: error.message };
      }

      return { success: true, messages: data || [] };
    } catch (error: any) {
      console.error('Error in getMessages:', error);
      return { success: false, error: error.message };
    }
  }

  async sendMessage(conversationId: string, senderId: string, content: string): Promise<{ success: boolean; message?: Message; error?: string }> {
    try {
      const { data, error } = await supabase
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
        return { success: false, error: error.message };
      }

      return { success: true, message: data };
    } catch (error: any) {
      console.error('Error in sendMessage:', error);
      return { success: false, error: error.message };
    }
  }

  async markMessagesAsRead(conversationId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId)
        .is('read_at', null);

      if (error) {
        console.error('Error marking messages as read:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error in markMessagesAsRead:', error);
      return { success: false, error: error.message };
    }
  }

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

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export const messagingService = new MessagingService();