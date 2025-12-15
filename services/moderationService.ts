
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
  pinned_until: string;
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

/**
 * Helper function to validate if a string is a valid UUID
 */
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
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
      // Validate moderator_user_id is not null or empty
      if (!moderatorUserId || moderatorUserId.trim() === '') {
        console.warn('⚠️ Cannot log moderation action: moderator_user_id is null or empty');
        console.warn(`Action type: ${actionType}, Target: ${targetUserId}, Streamer: ${streamerId}`);
        return;
      }

      // Validate target_user_id is not null or empty
      if (!targetUserId || targetUserId.trim() === '') {
        console.warn('⚠️ Cannot log moderation action: target_user_id is null or empty');
        console.warn(`Action type: ${actionType}, Moderator: ${moderatorUserId}, Streamer: ${streamerId}`);
        return;
      }

      // Validate streamer_id is not null or empty
      if (!streamerId || streamerId.trim() === '') {
        console.warn('⚠️ Cannot log moderation action: streamer_id is null or empty');
        console.warn(`Action type: ${actionType}, Moderator: ${moderatorUserId}, Target: ${targetUserId}`);
        return;
      }

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
        console.error('❌ Error logging moderation action:', error);
        console.error(`Failed to log: ${actionType} by ${moderatorUserId} on ${targetUserId}`);
      } else {
        console.log(`📝 Logged moderation action: ${actionType}`);
      }
    } catch (error) {
      console.error('❌ Error in logModerationAction:', error);
    }
  }

  // Get moderation history for a streamer
  async getModerationHistory(streamerId: string, limit: number = 50): Promise<ModerationHistoryEntry[]> {
    try {
      // First fetch moderation history
      const { data: history, error: historyError } = await supabase
        .from('moderation_history')
        .select('id, moderator_user_id, target_user_id, streamer_id, action_type, reason, duration_sec, created_at')
        .eq('streamer_id', streamerId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (historyError) {
        console.error('❌ Error fetching moderation history:', historyError);
        return [];
      }

      if (!history || history.length === 0) {
        return [];
      }

      // Fetch profile data separately for moderators and targets
      const moderatorIds = [...new Set(history.map(h => h.moderator_user_id))];
      const targetIds = [...new Set(history.map(h => h.target_user_id))];

      const { data: moderatorProfiles } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', moderatorIds);

      const { data: targetProfiles } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', targetIds);

      // Create maps for quick lookup
      const moderatorMap = new Map(
        (moderatorProfiles || []).map(p => [p.id, p])
      );
      const targetMap = new Map(
        (targetProfiles || []).map(p => [p.id, p])
      );

      // Merge profile data with history
      const result = history.map(h => ({
        ...h,
        moderator: moderatorMap.get(h.moderator_user_id),
        target: targetMap.get(h.target_user_id),
      }));

      return result as ModerationHistoryEntry[];
    } catch (error) {
      console.error('❌ Error in getModerationHistory:', error);
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
        .maybeSingle();

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
        .maybeSingle();

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
        .maybeSingle();

      if (streamData && streamData.broadcaster_id === streamerId) {
        return { isTimedOut: true, endTime: data[0].end_time };
      }

      return { isTimedOut: false };
    } catch (error) {
      console.error('Error in isTimedOut:', error);
      return { isTimedOut: false };
    }
  }

  // Add a moderator (IDEMPOTENT)
  async addModerator(streamerId: string, userId: string, addedBy: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate addedBy is not null
      if (!addedBy || addedBy.trim() === '') {
        console.warn('⚠️ Cannot add moderator: addedBy user ID is null or empty');
        return { success: false, error: 'Invalid moderator ID' };
      }

      // Check if moderator already exists
      const { data: existing, error: checkError } = await supabase
        .from('moderators')
        .select('id')
        .eq('streamer_id', streamerId)
        .eq('user_id', userId)
        .maybeSingle();

      if (checkError) {
        console.error('❌ Error checking existing moderator:', checkError);
        return { success: false, error: checkError.message };
      }

      if (existing) {
        console.log('ℹ️ Moderator already exists, returning success (idempotent)');
        return { success: true };
      }

      // Insert new moderator
      const { error } = await supabase
        .from('moderators')
        .insert({
          streamer_id: streamerId,
          user_id: userId,
        });

      if (error) {
        // Check if it's a duplicate key error (23505)
        if (error.code === '23505') {
          console.log('ℹ️ Duplicate key detected, returning success (idempotent)');
          return { success: true };
        }
        
        console.error('Error adding moderator:', error);
        return { success: false, error: error.message };
      }

      // Log the action (only if addedBy is valid)
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
      // Validate removedBy is not null
      if (!removedBy || removedBy.trim() === '') {
        console.warn('⚠️ Cannot remove moderator: removedBy user ID is null or empty');
        return { success: false, error: 'Invalid moderator ID' };
      }

      const { error } = await supabase
        .from('moderators')
        .delete()
        .eq('streamer_id', streamerId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error removing moderator:', error);
        return { success: false, error: error.message };
      }

      // Log the action (only if removedBy is valid)
      await this.logModerationAction(removedBy, userId, streamerId, 'remove_moderator');

      console.log('✅ Moderator removed successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in removeModerator:', error);
      return { success: false, error: 'Failed to remove moderator' };
    }
  }

  // Get all moderators for a streamer - Fixed: Fetch profiles separately to avoid recursion
  async getModerators(streamerId: string): Promise<Moderator[]> {
    try {
      // First fetch moderators
      const { data: moderators, error: moderatorsError } = await supabase
        .from('moderators')
        .select('id, streamer_id, user_id, created_at')
        .eq('streamer_id', streamerId)
        .order('created_at', { ascending: false });

      if (moderatorsError) {
        console.error('❌ Error fetching moderators:', moderatorsError);
        return [];
      }

      if (!moderators || moderators.length === 0) {
        return [];
      }

      // Fetch profile data separately
      const userIds = moderators.map(m => m.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', userIds);

      if (profilesError) {
        console.error('❌ Error fetching profiles:', profilesError);
        // Return moderators without profile data
        return moderators as Moderator[];
      }

      // Map profiles to moderators
      const profileMap = new Map(
        (profiles || []).map(p => [p.id, p])
      );

      const result = moderators.map(m => ({
        ...m,
        profiles: profileMap.get(m.user_id),
      }));

      return result as Moderator[];
    } catch (error) {
      console.error('❌ Error in getModerators:', error);
      return [];
    }
  }

  // Ban a user (persistent across all future streams)
  async banUser(streamerId: string, userId: string, bannedBy: string, reason?: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate bannedBy is not null
      if (!bannedBy || bannedBy.trim() === '') {
        console.warn('⚠️ Cannot ban user: bannedBy user ID is null or empty');
        return { success: false, error: 'Invalid moderator ID' };
      }

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

      // Log the action (only if bannedBy is valid)
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
      // Validate unbannedBy is not null
      if (!unbannedBy || unbannedBy.trim() === '') {
        console.warn('⚠️ Cannot unban user: unbannedBy user ID is null or empty');
        return { success: false, error: 'Invalid moderator ID' };
      }

      const { error } = await supabase
        .from('banned_users')
        .delete()
        .eq('streamer_id', streamerId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error unbanning user:', error);
        return { success: false, error: error.message };
      }

      // Log the action (only if unbannedBy is valid)
      await this.logModerationAction(unbannedBy, userId, streamerId, 'unban');

      console.log('✅ User unbanned successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in unbanUser:', error);
      return { success: false, error: 'Failed to unban user' };
    }
  }

  // Get all banned users for a streamer - FIXED: Changed from 'bans' to 'banned_users'
  async getBannedUsers(streamerId: string): Promise<BannedUser[]> {
    try {
      // First fetch banned users
      const { data: bannedUsers, error: bannedError } = await supabase
        .from('banned_users')
        .select('id, streamer_id, user_id, reason, created_at')
        .eq('streamer_id', streamerId)
        .order('created_at', { ascending: false });

      if (bannedError) {
        console.error('❌ Error fetching banned users:', bannedError);
        return [];
      }

      if (!bannedUsers || bannedUsers.length === 0) {
        return [];
      }

      // Fetch profile data separately
      const userIds = bannedUsers.map(b => b.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', userIds);

      if (profilesError) {
        console.error('❌ Error fetching profiles:', profilesError);
        // Return banned users without profile data
        return bannedUsers as BannedUser[];
      }

      // Map profiles to banned users
      const profileMap = new Map(
        (profiles || []).map(p => [p.id, p])
      );

      const result = bannedUsers.map(b => ({
        ...b,
        profiles: profileMap.get(b.user_id),
      }));

      return result as BannedUser[];
    } catch (error) {
      console.error('❌ Error in getBannedUsers:', error);
      return [];
    }
  }

  // Timeout a user (persistent, expires automatically)
  async timeoutUser(streamId: string, userId: string, streamerId: string, timedOutBy: string, durationMinutes: number): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate timedOutBy is not null
      if (!timedOutBy || timedOutBy.trim() === '') {
        console.warn('⚠️ Cannot timeout user: timedOutBy user ID is null or empty');
        return { success: false, error: 'Invalid moderator ID' };
      }

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

      // Log the action (only if timedOutBy is valid)
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
      // Validate removedBy is not null
      if (!removedBy || removedBy.trim() === '') {
        console.warn('⚠️ Cannot remove comment: removedBy user ID is null or empty');
        return { success: false, error: 'Invalid moderator ID' };
      }

      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageId);

      if (error) {
        console.error('Error removing comment:', error);
        return { success: false, error: error.message };
      }

      // Log the action (only if removedBy is valid)
      await this.logModerationAction(removedBy, targetUserId, streamerId, 'remove_comment');

      console.log('✅ Comment removed successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in removeComment:', error);
      return { success: false, error: 'Failed to remove comment' };
    }
  }

  // Pin a comment - Fixed: Use pinned_until instead of expires_at
  async pinComment(streamId: string, messageId: string, pinnedBy: string, streamerId: string, targetUserId: string, durationMinutes: number): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate pinnedBy is not null
      if (!pinnedBy || pinnedBy.trim() === '') {
        console.warn('⚠️ Cannot pin comment: pinnedBy user ID is null or empty');
        return { success: false, error: 'Invalid moderator ID' };
      }

      if (durationMinutes < 1 || durationMinutes > 5) {
        return { success: false, error: 'Pin duration must be between 1 and 5 minutes' };
      }

      const pinnedUntil = new Date();
      pinnedUntil.setMinutes(pinnedUntil.getMinutes() + durationMinutes);

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
          pinned_until: pinnedUntil.toISOString(),
        });

      if (error) {
        console.error('Error pinning comment:', error);
        return { success: false, error: error.message };
      }

      // Log the action (only if pinnedBy is valid)
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
      // Validate unpinnedBy is not null
      if (!unpinnedBy || unpinnedBy.trim() === '') {
        console.warn('⚠️ Cannot unpin comment: unpinnedBy user ID is null or empty');
        return { success: false, error: 'Invalid moderator ID' };
      }

      const { error } = await supabase
        .from('pinned_comments')
        .delete()
        .eq('stream_id', streamId);

      if (error) {
        console.error('Error unpinning comment:', error);
        return { success: false, error: error.message };
      }

      // Log the action (use streamer as target for unpin, only if unpinnedBy is valid)
      await this.logModerationAction(unpinnedBy, streamerId, streamerId, 'unpin_comment');

      console.log('✅ Comment unpinned successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in unpinComment:', error);
      return { success: false, error: 'Failed to unpin comment' };
    }
  }

  // Get pinned comment for a stream - Fixed: Use pinned_until instead of expires_at
  async getPinnedComment(streamId: string): Promise<PinnedComment | null> {
    try {
      const { data, error } = await supabase
        .from('pinned_comments')
        .select('*, chat_messages(*, users(display_name, username))')
        .eq('stream_id', streamId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching pinned comment:', error);
        return null;
      }

      if (!data) return null;

      // Check if pin has expired
      const pinnedUntil = new Date(data.pinned_until);
      const now = new Date();
      if (now > pinnedUntil) {
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

  // Search users by username
  // FIXED: Added UUID validation to prevent "invalid input syntax for type uuid" errors
  async searchUsersByUsername(username: string): Promise<any[]> {
    try {
      console.log('🔍 [ModerationService] Searching users by username:', username);

      // DEFENSIVE: Validate input
      if (!username || username.trim().length === 0) {
        console.log('⚠️ [ModerationService] Empty search query, returning empty array');
        return [];
      }

      const trimmedUsername = username.trim();

      // Check if input is a valid UUID
      if (isValidUUID(trimmedUsername)) {
        console.log('🔍 [ModerationService] Input is a UUID, searching by ID');
        
        // Query by ID
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .eq('id', trimmedUsername)
          .limit(1);

        if (error) {
          console.error('❌ [ModerationService] Error searching by UUID:', error);
          return [];
        }

        console.log('✅ [ModerationService] Found', data?.length || 0, 'users by UUID');
        return data || [];
      } else {
        console.log('🔍 [ModerationService] Input is text, searching by username/display_name');
        
        // Query by username or display_name using ilike
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .or(`username.ilike.%${trimmedUsername}%,display_name.ilike.%${trimmedUsername}%`)
          .limit(20);

        if (error) {
          console.error('❌ [ModerationService] Error searching by username:', error);
          return [];
        }

        console.log('✅ [ModerationService] Found', data?.length || 0, 'users by username');
        return data || [];
      }
    } catch (error) {
      console.error('❌ [ModerationService] Exception in searchUsersByUsername:', error);
      return [];
    }
  }
}

export const moderationService = new ModerationService();
