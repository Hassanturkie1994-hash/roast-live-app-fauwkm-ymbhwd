
import { supabase } from '@/app/integrations/supabase/client';

export interface Moderator {
  id: string;
  streamer_id: string;
  user_id: string;
  created_at: string;
  profiles?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

export interface BannedUser {
  id: string;
  streamer_id: string;
  user_id: string;
  reason: string | null;
  created_at: string;
  profiles?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

export interface TimedOutUser {
  id: string;
  stream_id: string;
  user_id: string;
  end_time: string;
  created_at: string;
}

export interface PinnedComment {
  id: string;
  stream_id: string;
  message_id: string;
  pinned_by: string;
  expires_at: string;
  created_at: string;
  chat_messages?: {
    id: string;
    message: string;
    user_id: string;
    users: {
      display_name: string;
      username: string;
    };
  };
}

export interface ModerationHistoryEntry {
  id: string;
  moderator_user_id: string;
  target_user_id: string;
  streamer_id: string;
  action_type: string;
  reason: string | null;
  duration_sec: number | null;
  created_at: string;
  moderator?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  target?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

class ModerationService {
  // Log moderation action to history
  private async logModerationAction(
    moderatorUserId: string,
    targetUserId: string,
    streamerId: string,
    actionType: string,
    reason?: string,
    durationSec?: number
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('moderation_history')
        .insert({
          moderator_user_id: moderatorUserId,
          target_user_id: targetUserId,
          streamer_id: streamerId,
          action_type: actionType,
          reason: reason || null,
          duration_sec: durationSec || null,
        });

      if (error) {
        console.error('Error logging moderation action:', error);
      } else {
        console.log(`📝 Logged moderation action: ${actionType}`);
      }
    } catch (error) {
      console.error('Error in logModerationAction:', error);
    }
  }

  // Get moderation history for a streamer
  async getModerationHistory(streamerId: string, limit: number = 50): Promise<ModerationHistoryEntry[]> {
    try {
      const { data, error } = await supabase
        .from('moderation_history')
        .select(`
          *,
          moderator:profiles!moderation_history_moderator_user_id_fkey(id, username, display_name, avatar_url),
          target:profiles!moderation_history_target_user_id_fkey(id, username, display_name, avatar_url)
        `)
        .eq('streamer_id', streamerId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching moderation history:', error);
        return [];
      }

      return data as ModerationHistoryEntry[];
    } catch (error) {
      console.error('Error in getModerationHistory:', error);
      return [];
    }
  }

  // Check if user is a moderator for a streamer
  async isModerator(streamerId: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('moderators')
        .select('id')
        .eq('streamer_id', streamerId)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking moderator status:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error in isModerator:', error);
      return false;
    }
  }

  // Check if user is banned by a streamer (persistent across all streams)
  async isBanned(streamerId: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('banned_users')
        .select('id')
        .eq('streamer_id', streamerId)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking ban status:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error in isBanned:', error);
      return false;
    }
  }

  // Check if user is timed out (check against current time)
  async isTimedOut(streamerId: string, userId: string): Promise<{ isTimedOut: boolean; endTime?: string }> {
    try {
      // Get the most recent timeout for this user from this streamer
      const { data, error } = await supabase
        .from('timed_out_users')
        .select('end_time, stream_id')
        .eq('user_id', userId)
        .gte('end_time', new Date().toISOString())
        .order('end_time', { ascending: false })
        .limit(1);

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking timeout status:', error);
        return { isTimedOut: false };
      }

      if (!data || data.length === 0) {
        return { isTimedOut: false };
      }

      // Verify the timeout is for a stream from this streamer
      const { data: streamData } = await supabase
        .from('streams')
        .select('broadcaster_id')
        .eq('id', data[0].stream_id)
        .single();

      if (streamData && streamData.broadcaster_id === streamerId) {
        return { isTimedOut: true, endTime: data[0].end_time };
      }

      return { isTimedOut: false };
    } catch (error) {
      console.error('Error in isTimedOut:', error);
      return { isTimedOut: false };
    }
  }

  // Add a moderator
  async addModerator(streamerId: string, userId: string, addedBy: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('moderators')
        .insert({
          streamer_id: streamerId,
          user_id: userId,
        });

      if (error) {
        console.error('Error adding moderator:', error);
        return { success: false, error: error.message };
      }

      // Log the action
      await this.logModerationAction(addedBy, userId, streamerId, 'add_moderator');

      console.log('✅ Moderator added successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in addModerator:', error);
      return { success: false, error: 'Failed to add moderator' };
    }
  }

  // Remove a moderator
  async removeModerator(streamerId: string, userId: string, removedBy: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('moderators')
        .delete()
        .eq('streamer_id', streamerId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error removing moderator:', error);
        return { success: false, error: error.message };
      }

      // Log the action
      await this.logModerationAction(removedBy, userId, streamerId, 'remove_moderator');

      console.log('✅ Moderator removed successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in removeModerator:', error);
      return { success: false, error: 'Failed to remove moderator' };
    }
  }

  // Get all moderators for a streamer
  async getModerators(streamerId: string): Promise<Moderator[]> {
    try {
      const { data, error } = await supabase
        .from('moderators')
        .select('*, profiles(*)')
        .eq('streamer_id', streamerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching moderators:', error);
        return [];
      }

      return data as Moderator[];
    } catch (error) {
      console.error('Error in getModerators:', error);
      return [];
    }
  }

  // Ban a user (persistent across all future streams)
  async banUser(streamerId: string, userId: string, bannedBy: string, reason?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('banned_users')
        .insert({
          streamer_id: streamerId,
          user_id: userId,
          reason: reason || null,
        });

      if (error) {
        console.error('Error banning user:', error);
        return { success: false, error: error.message };
      }

      // Log the action
      await this.logModerationAction(bannedBy, userId, streamerId, 'ban', reason);

      console.log('✅ User banned successfully');
      
      // Broadcast ban event to remove user from stream
      await supabase.channel(`streamer:${streamerId}:moderation`).send({
        type: 'broadcast',
        event: 'user_banned',
        payload: { user_id: userId },
      });

      return { success: true };
    } catch (error) {
      console.error('Error in banUser:', error);
      return { success: false, error: 'Failed to ban user' };
    }
  }

  // Unban a user
  async unbanUser(streamerId: string, userId: string, unbannedBy: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('banned_users')
        .delete()
        .eq('streamer_id', streamerId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error unbanning user:', error);
        return { success: false, error: error.message };
      }

      // Log the action
      await this.logModerationAction(unbannedBy, userId, streamerId, 'unban');

      console.log('✅ User unbanned successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in unbanUser:', error);
      return { success: false, error: 'Failed to unban user' };
    }
  }

  // Get all banned users for a streamer
  async getBannedUsers(streamerId: string): Promise<BannedUser[]> {
    try {
      const { data, error } = await supabase
        .from('banned_users')
        .select('*, profiles(*)')
        .eq('streamer_id', streamerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching banned users:', error);
        return [];
      }

      return data as BannedUser[];
    } catch (error) {
      console.error('Error in getBannedUsers:', error);
      return [];
    }
  }

  // Timeout a user (persistent, expires automatically)
  async timeoutUser(streamId: string, userId: string, streamerId: string, timedOutBy: string, durationMinutes: number): Promise<{ success: boolean; error?: string }> {
    try {
      if (durationMinutes < 1 || durationMinutes > 60) {
        return { success: false, error: 'Timeout duration must be between 1 and 60 minutes' };
      }

      const endTime = new Date();
      endTime.setMinutes(endTime.getMinutes() + durationMinutes);

      // Delete existing timeout if any
      await supabase
        .from('timed_out_users')
        .delete()
        .eq('stream_id', streamId)
        .eq('user_id', userId);

      // Insert new timeout
      const { error } = await supabase
        .from('timed_out_users')
        .insert({
          stream_id: streamId,
          user_id: userId,
          end_time: endTime.toISOString(),
        });

      if (error) {
        console.error('Error timing out user:', error);
        return { success: false, error: error.message };
      }

      // Log the action
      await this.logModerationAction(timedOutBy, userId, streamerId, 'timeout', undefined, durationMinutes * 60);

      console.log(`✅ User timed out for ${durationMinutes} minutes`);
      
      // Broadcast timeout event
      await supabase.channel(`stream:${streamId}:moderation`).send({
        type: 'broadcast',
        event: 'user_timed_out',
        payload: { user_id: userId, duration_minutes: durationMinutes },
      });

      return { success: true };
    } catch (error) {
      console.error('Error in timeoutUser:', error);
      return { success: false, error: 'Failed to timeout user' };
    }
  }

  // Remove a comment
  async removeComment(messageId: string, removedBy: string, streamerId: string, targetUserId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageId);

      if (error) {
        console.error('Error removing comment:', error);
        return { success: false, error: error.message };
      }

      // Log the action
      await this.logModerationAction(removedBy, targetUserId, streamerId, 'remove_comment');

      console.log('✅ Comment removed successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in removeComment:', error);
      return { success: false, error: 'Failed to remove comment' };
    }
  }

  // Pin a comment
  async pinComment(streamId: string, messageId: string, pinnedBy: string, streamerId: string, targetUserId: string, durationMinutes: number): Promise<{ success: boolean; error?: string }> {
    try {
      if (durationMinutes < 1 || durationMinutes > 5) {
        return { success: false, error: 'Pin duration must be between 1 and 5 minutes' };
      }

      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + durationMinutes);

      // Remove existing pinned comment if any
      await supabase
        .from('pinned_comments')
        .delete()
        .eq('stream_id', streamId);

      // Insert new pinned comment
      const { error } = await supabase
        .from('pinned_comments')
        .insert({
          stream_id: streamId,
          message_id: messageId,
          pinned_by: pinnedBy,
          expires_at: expiresAt.toISOString(),
        });

      if (error) {
        console.error('Error pinning comment:', error);
        return { success: false, error: error.message };
      }

      // Log the action
      await this.logModerationAction(pinnedBy, targetUserId, streamerId, 'pin_comment', undefined, durationMinutes * 60);

      console.log(`✅ Comment pinned for ${durationMinutes} minutes`);
      return { success: true };
    } catch (error) {
      console.error('Error in pinComment:', error);
      return { success: false, error: 'Failed to pin comment' };
    }
  }

  // Unpin a comment
  async unpinComment(streamId: string, unpinnedBy: string, streamerId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('pinned_comments')
        .delete()
        .eq('stream_id', streamId);

      if (error) {
        console.error('Error unpinning comment:', error);
        return { success: false, error: error.message };
      }

      // Log the action (use streamer as target for unpin)
      await this.logModerationAction(unpinnedBy, streamerId, streamerId, 'unpin_comment');

      console.log('✅ Comment unpinned successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in unpinComment:', error);
      return { success: false, error: 'Failed to unpin comment' };
    }
  }

  // Get pinned comment for a stream
  async getPinnedComment(streamId: string): Promise<PinnedComment | null> {
    try {
      const { data, error } = await supabase
        .from('pinned_comments')
        .select('*, chat_messages(*, users(display_name, username))')
        .eq('stream_id', streamId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching pinned comment:', error);
        return null;
      }

      if (!data) return null;

      // Check if pin has expired
      const expiresAt = new Date(data.expires_at);
      const now = new Date();
      if (now > expiresAt) {
        // Auto-remove expired pin
        await this.unpinComment(streamId, data.pinned_by, data.pinned_by);
        return null;
      }

      return data as PinnedComment;
    } catch (error) {
      console.error('Error in getPinnedComment:', error);
      return null;
    }
  }

  // Like a comment
  async likeComment(messageId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('comment_likes')
        .insert({
          message_id: messageId,
          user_id: userId,
        });

      if (error) {
        console.error('Error liking comment:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Comment liked successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in likeComment:', error);
      return { success: false, error: 'Failed to like comment' };
    }
  }

  // Unlike a comment
  async unlikeComment(messageId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('comment_likes')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error unliking comment:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Comment unliked successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in unlikeComment:', error);
      return { success: false, error: 'Failed to unlike comment' };
    }
  }

  // Get comment likes count
  async getCommentLikesCount(messageId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('comment_likes')
        .select('*', { count: 'exact', head: true })
        .eq('message_id', messageId);

      if (error) {
        console.error('Error fetching comment likes count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getCommentLikesCount:', error);
      return 0;
    }
  }

  // Search users by username for adding moderators
  async searchUsersByUsername(username: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .ilike('username', `%${username}%`)
        .limit(10);

      if (error) {
        console.error('Error searching users:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in searchUsersByUsername:', error);
      return [];
    }
  }
}

export const moderationService = new ModerationService();