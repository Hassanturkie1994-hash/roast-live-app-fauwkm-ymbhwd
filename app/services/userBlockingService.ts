
import { supabase } from '@/app/integrations/supabase/client';

export interface BlockedUser {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
  profiles?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

class UserBlockingService {
  // Block a user
  async blockUser(blockerId: string, blockedId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (blockerId === blockedId) {
        return { success: false, error: 'You cannot block yourself' };
      }

      const { error } = await supabase
        .from('blocked_users')
        .insert({
          blocker_id: blockerId,
          blocked_id: blockedId,
        });

      if (error) {
        if (error.code === '23505') {
          return { success: false, error: 'User is already blocked' };
        }
        console.error('Error blocking user:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ User blocked successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in blockUser:', error);
      return { success: false, error: 'Failed to block user' };
    }
  }

  // Unblock a user
  async unblockUser(blockerId: string, blockedId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('blocker_id', blockerId)
        .eq('blocked_id', blockedId);

      if (error) {
        console.error('Error unblocking user:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ User unblocked successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in unblockUser:', error);
      return { success: false, error: 'Failed to unblock user' };
    }
  }

  // Check if a user is blocked
  async isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('blocked_users')
        .select('id')
        .eq('blocker_id', blockerId)
        .eq('blocked_id', blockedId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking block status:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error in isBlocked:', error);
      return false;
    }
  }

  // Check if two users have blocked each other (mutual block)
  async isMutuallyBlocked(userId1: string, userId2: string): Promise<boolean> {
    try {
      const blocked1 = await this.isBlocked(userId1, userId2);
      const blocked2 = await this.isBlocked(userId2, userId1);
      return blocked1 || blocked2;
    } catch (error) {
      console.error('Error in isMutuallyBlocked:', error);
      return false;
    }
  }

  // Get all blocked users for a user
  async getBlockedUsers(blockerId: string): Promise<BlockedUser[]> {
    try {
      const { data, error } = await supabase
        .from('blocked_users')
        .select('*, profiles!blocked_users_blocked_id_fkey(*)')
        .eq('blocker_id', blockerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching blocked users:', error);
        return [];
      }

      return data as BlockedUser[];
    } catch (error) {
      console.error('Error in getBlockedUsers:', error);
      return [];
    }
  }

  // Report a comment
  async reportComment(
    messageId: string,
    reporterId: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('comment_reports')
        .insert({
          message_id: messageId,
          reporter_id: reporterId,
          reason: reason || null,
        });

      if (error) {
        if (error.code === '23505') {
          return { success: false, error: 'You have already reported this comment' };
        }
        console.error('Error reporting comment:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Comment reported successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in reportComment:', error);
      return { success: false, error: 'Failed to report comment' };
    }
  }
}

export const userBlockingService = new UserBlockingService();