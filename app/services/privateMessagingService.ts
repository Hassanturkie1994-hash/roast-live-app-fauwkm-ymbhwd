
import { supabase } from '@/app/integrations/supabase/client';
import { Tables } from '@/app/integrations/supabase/types';
import { followService } from './followService';

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
  is_request?: boolean;
  request_status?: 'pending' | 'accepted' | 'rejected';
}

export interface MessageWithSender extends Message {
  sender: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

export interface MessageRequest {
  id: string;
  conversation_id: string;
  requester_id: string;
  recipient_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  responded_at?: string;
}

class PrivateMessagingService {
  /**
   * Get or create a conversation between two users
   * Handles message requests for non-followers
   */
  async getOrCreateConversation(userId1: string, userId2: string): Promise<{ conversation: Conversation | null; needsRequest: boolean; requestId?: string }> {
    try {
      // Check if conversation already exists (in either direction)
      const { data: existing, error: fetchError } = await supabase
        .from('conversations')
        .select('*')
        .or(`and(user1_id.eq.${userId1},user2_id.eq.${userId2}),and(user1_id.eq.${userId2},user2_id.eq.${userId1})`)
        .maybeSingle();

      if (existing) {
        // Check if there's a pending request
        const { data: request } = await supabase
          .from('message_requests')
          .select('*')
          .eq('conversation_id', existing.id)
          .maybeSingle();

        return { 
          conversation: existing, 
          needsRequest: false,
          requestId: request?.id 
        };
      }

      // Check if userId1 follows userId2
      const isFollowing = await followService.isFollowing(userId1, userId2);

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
        return { conversation: null, needsRequest: false };
      }

      // If not following, create a message request
      if (!isFollowing) {
        const { data: request, error: requestError } = await supabase
          .from('message_requests')
          .insert({
            conversation_id: newConversation.id,
            requester_id: userId1,
            recipient_id: userId2,
            status: 'pending',
          })
          .select()
          .single();

        if (requestError) {
          console.error('Error creating message request:', requestError);
        }

        return { 
          conversation: newConversation, 
          needsRequest: true,
          requestId: request?.id 
        };
      }

      return { conversation: newConversation, needsRequest: false };
    } catch (error) {
      console.error('Error in getOrCreateConversation:', error);
      return { conversation: null, needsRequest: false };
    }
  }

  /**
   * Get all conversations for a user, including request status
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

      // Fetch message requests for these conversations
      const conversationIds = conversations.map(c => c.id);
      const { data: requests } = await supabase
        .from('message_requests')
        .select('*')
        .in('conversation_id', conversationIds);

      const requestMap = new Map(
        (requests || []).map(r => [r.conversation_id, r])
      );

      // Fetch other user details and last message for each conversation
      const conversationsWithDetails = await Promise.all(
        conversations.map(async (conv) => {
          const otherUserId = conv.user1_id === userId ? conv.user2_id : conv.user1_id;
          const request = requestMap.get(conv.id);

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
            .maybeSingle();

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
            is_request: !!request,
            request_status: request?.status,
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
   * Get pending message requests for a user
   */
  async getMessageRequests(userId: string): Promise<(MessageRequest & { requester: any })[]> {
    try {
      const { data, error } = await supabase
        .from('message_requests')
        .select(`
          *,
          requester:profiles!message_requests_requester_id_fkey(id, username, display_name, avatar_url)
        `)
        .eq('recipient_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching message requests:', error);
        return [];
      }

      return (data || []) as any;
    } catch (error) {
      console.error('Error in getMessageRequests:', error);
      return [];
    }
  }

  /**
   * Accept a message request
   */
  async acceptMessageRequest(requestId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('message_requests')
        .update({
          status: 'accepted',
          responded_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) {
        console.error('Error accepting message request:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in acceptMessageRequest:', error);
      return false;
    }
  }

  /**
   * Reject a message request
   */
  async rejectMessageRequest(requestId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('message_requests')
        .update({
          status: 'rejected',
          responded_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) {
        console.error('Error rejecting message request:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in rejectMessageRequest:', error);
      return false;
    }
  }

  /**
   * Check if conversation requires acceptance
   */
  async checkConversationAccess(conversationId: string, userId: string): Promise<{ canAccess: boolean; isPending: boolean; isRequester: boolean }> {
    try {
      const { data: request } = await supabase
        .from('message_requests')
        .select('*')
        .eq('conversation_id', conversationId)
        .maybeSingle();

      if (!request) {
        return { canAccess: true, isPending: false, isRequester: false };
      }

      if (request.status === 'accepted') {
        return { canAccess: true, isPending: false, isRequester: request.requester_id === userId };
      }

      if (request.status === 'rejected') {
        return { canAccess: false, isPending: false, isRequester: request.requester_id === userId };
      }

      // Pending request
      const isRequester = request.requester_id === userId;
      return { 
        canAccess: isRequester, // Requester can send messages, recipient cannot until accepted
        isPending: true, 
        isRequester 
      };
    } catch (error) {
      console.error('Error in checkConversationAccess:', error);
      return { canAccess: false, isPending: false, isRequester: false };
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

      // Broadcast the message via realtime
      const channel = supabase.channel(`conversation:${conversationId}:messages`);
      await channel.send({
        type: 'broadcast',
        event: 'message_created',
        payload: message,
      });

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
   * Subscribe to new messages in a conversation using broadcast (REALTIME)
   */
  subscribeToConversation(conversationId: string, callback: (message: Message) => void) {
    const channel = supabase
      .channel(`conversation:${conversationId}:messages`, {
        config: { private: true }
      })
      .on('broadcast', { event: 'message_created' }, (payload) => {
        console.log('💬 New message received via broadcast:', payload);
        callback(payload.payload as Message);
      })
      .subscribe(async (status) => {
        console.log('📡 Conversation subscription status:', status);
        if (status === 'SUBSCRIBED') {
          await supabase.realtime.setAuth();
        }
      });

    return channel;
  }

  /**
   * Subscribe to conversation updates (for inbox)
   */
  subscribeToUserConversations(userId: string, callback: () => void) {
    const channel = supabase
      .channel(`user:${userId}:conversations`, {
        config: { private: true }
      })
      .on('broadcast', { event: 'conversation_updated' }, () => {
        console.log('💬 Conversation updated via broadcast');
        callback();
      })
      .subscribe(async (status) => {
        console.log('📡 User conversations subscription status:', status);
        if (status === 'SUBSCRIBED') {
          await supabase.realtime.setAuth();
        }
      });

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

      // Delete message request if exists
      await supabase
        .from('message_requests')
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

  /**
   * Get users that the current user follows (for starting new conversations)
   */
  async getFollowedUsers(userId: string, searchQuery?: string): Promise<{ id: string; username: string; display_name: string; avatar_url: string | null }[]> {
    try {
      const { data: following, error } = await supabase
        .from('followers')
        .select('following_id')
        .eq('follower_id', userId);

      if (error || !following || following.length === 0) {
        return [];
      }

      const followingIds = following.map(f => f.following_id);

      let query = supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', followingIds);

      // Add search filter if provided
      if (searchQuery && searchQuery.trim().length > 0) {
        const searchTerm = searchQuery.trim().toLowerCase();
        query = query.or(`username.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`);
      }

      const { data: profiles, error: profilesError } = await query
        .order('username', { ascending: true })
        .limit(50);

      if (profilesError) {
        console.error('Error fetching followed users:', profilesError);
        return [];
      }

      return profiles || [];
    } catch (error) {
      console.error('Error in getFollowedUsers:', error);
      return [];
    }
  }
}

export const privateMessagingService = new PrivateMessagingService();
