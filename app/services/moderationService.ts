
import { supabase } from '@/app/integrations/supabase/client';

export interface Moderator {
  id: string;
  streamer_id: string;
  user_id: string;
  added_by: string;
  created_at: string;
  profiles?: {
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
  banned_at: string;
  banned_by: string;
  profiles?: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

export interface TimeoutUser {
  id: string;
  streamer_id: string;
  user_id: string;
  duration_minutes: number;
  reason: string | null;
  timed_out_at: string;
  timed_out_by: string;
  expires_at: string;
}

/**
 * Helper function to validate if a string is a valid UUID
 */
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

class ModerationService {
  /**
   * Get all moderators for a streamer
   * DEFENSIVE: Returns empty array on error
   */
  async getModerators(streamerId: string): Promise<Moderator[]> {
    try {
      console.log('📥 [ModerationService] Fetching moderators for streamer:', streamerId);

      const { data, error } = await supabase
        .from('moderators')
        .select(`
          *,
          profiles:user_id(username, display_name, avatar_url)
        `)
        .eq('streamer_id', streamerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [ModerationService] Error fetching moderators:', error);
        return [];
      }

      console.log('✅ [ModerationService] Fetched', data?.length || 0, 'moderators');
      return data || [];
    } catch (error) {
      console.error('❌ [ModerationService] Exception in getModerators:', error);
      return [];
    }
  }

  /**
   * Add a moderator (IDEMPOTENT - won't fail if already exists)
   * FIXED: Now uses upsert to prevent duplicate key violations
   */
  async addModerator(
    streamerId: string,
    userId: string,
    addedBy?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('➕ [ModerationService] Adding moderator:', { streamerId, userId });

      // Check if moderator already exists
      const { data: existing, error: checkError } = await supabase
        .from('moderators')
        .select('id')
        .eq('streamer_id', streamerId)
        .eq('user_id', userId)
        .maybeSingle();

      if (checkError) {
        console.error('❌ [ModerationService] Error checking existing moderator:', checkError);
        return { success: false, error: checkError.message };
      }

      if (existing) {
        console.log('ℹ️ [ModerationService] Moderator already exists, returning success');
        return { success: true };
      }

      // Insert new moderator
      const { error: insertError } = await supabase
        .from('moderators')
        .insert({
          streamer_id: streamerId,
          user_id: userId,
        });

      if (insertError) {
        // Check if it's a duplicate key error (23505)
        if (insertError.code === '23505') {
          console.log('ℹ️ [ModerationService] Duplicate key detected, returning success');
          return { success: true };
        }

        console.error('❌ [ModerationService] Error adding moderator:', insertError);
        return { success: false, error: insertError.message };
      }

      console.log('✅ [ModerationService] Moderator added successfully');
      return { success: true };
    } catch (error: any) {
      console.error('❌ [ModerationService] Exception in addModerator:', error);
      return { success: false, error: error.message || 'Failed to add moderator' };
    }
  }

  /**
   * Remove a moderator
   */
  async removeModerator(
    streamerId: string,
    userId: string,
    removedBy?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('➖ [ModerationService] Removing moderator:', { streamerId, userId });

      const { error } = await supabase
        .from('moderators')
        .delete()
        .eq('streamer_id', streamerId)
        .eq('user_id', userId);

      if (error) {
        console.error('❌ [ModerationService] Error removing moderator:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ [ModerationService] Moderator removed successfully');
      return { success: true };
    } catch (error: any) {
      console.error('❌ [ModerationService] Exception in removeModerator:', error);
      return { success: false, error: error.message || 'Failed to remove moderator' };
    }
  }

  /**
   * Get all banned users for a streamer
   * FIXED: Changed from 'bans' to 'banned_users' table
   * DEFENSIVE: Returns empty array on error instead of throwing
   */
  async getBannedUsers(streamerId: string): Promise<BannedUser[]> {
    try {
      console.log('📥 [ModerationService] Fetching banned users for streamer:', streamerId);

      const { data, error } = await supabase
        .from('banned_users')
        .select(`
          *,
          profiles:user_id(username, display_name, avatar_url)
        `)
        .eq('streamer_id', streamerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [ModerationService] Error fetching banned users:', error);
        console.error('Error details:', error);
        return [];
      }

      console.log('✅ [ModerationService] Fetched', data?.length || 0, 'banned users');
      
      // Map the data to match the expected interface
      const mappedData = (data || []).map(item => ({
        id: item.id,
        streamer_id: item.streamer_id,
        user_id: item.user_id,
        reason: item.reason,
        banned_at: item.created_at,
        banned_by: item.streamer_id,
        profiles: item.profiles,
      }));
      
      return mappedData;
    } catch (error) {
      console.error('❌ [ModerationService] Exception in getBannedUsers:', error);
      return [];
    }
  }

  /**
   * Ban a user
   * FIXED: Changed from 'bans' to 'banned_users' table
   */
  async banUser(
    streamerId: string,
    userId: string,
    reason: string,
    bannedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🚫 [ModerationService] Banning user:', { streamerId, userId, reason });

      const { error } = await supabase
        .from('banned_users')
        .insert({
          streamer_id: streamerId,
          user_id: userId,
          reason,
        });

      if (error) {
        console.error('❌ [ModerationService] Error banning user:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ [ModerationService] User banned successfully');
      return { success: true };
    } catch (error: any) {
      console.error('❌ [ModerationService] Exception in banUser:', error);
      return { success: false, error: error.message || 'Failed to ban user' };
    }
  }

  /**
   * Unban a user
   * FIXED: Changed from 'bans' to 'banned_users' table
   */
  async unbanUser(
    streamerId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('✅ [ModerationService] Unbanning user:', { streamerId, userId });

      const { error } = await supabase
        .from('banned_users')
        .delete()
        .eq('streamer_id', streamerId)
        .eq('user_id', userId);

      if (error) {
        console.error('❌ [ModerationService] Error unbanning user:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ [ModerationService] User unbanned successfully');
      return { success: true };
    } catch (error: any) {
      console.error('❌ [ModerationService] Exception in unbanUser:', error);
      return { success: false, error: error.message || 'Failed to unban user' };
    }
  }

  /**
   * Timeout a user
   */
  async timeoutUser(
    streamerId: string,
    userId: string,
    durationMinutes: number,
    reason: string,
    timedOutBy: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('⏱️ [ModerationService] Timing out user:', { streamerId, userId, durationMinutes });

      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + durationMinutes);

      const { error } = await supabase
        .from('timed_out_users')
        .insert({
          user_id: userId,
          end_time: expiresAt.toISOString(),
        });

      if (error) {
        console.error('❌ [ModerationService] Error timing out user:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ [ModerationService] User timed out successfully');
      return { success: true };
    } catch (error: any) {
      console.error('❌ [ModerationService] Exception in timeoutUser:', error);
      return { success: false, error: error.message || 'Failed to timeout user' };
    }
  }

  /**
   * Search users by username
   * FIXED: Added UUID validation to prevent "invalid input syntax for type uuid" errors
   */
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

  /**
   * Check if user is banned
   * FIXED: Changed from 'bans' to 'banned_users' table
   * DEFENSIVE: Returns false on error
   */
  async isUserBanned(streamerId: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('banned_users')
        .select('id')
        .eq('streamer_id', streamerId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('❌ [ModerationService] Error checking ban status:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('❌ [ModerationService] Exception in isUserBanned:', error);
      return false;
    }
  }

  /**
   * Check if user is timed out
   * DEFENSIVE: Returns false on error
   */
  async isUserTimedOut(streamerId: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('timed_out_users')
        .select('id, end_time')
        .eq('user_id', userId)
        .gt('end_time', new Date().toISOString())
        .maybeSingle();

      if (error) {
        console.error('❌ [ModerationService] Error checking timeout status:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('❌ [ModerationService] Exception in isUserTimedOut:', error);
      return false;
    }
  }

  /**
   * Check if user is a moderator
   * DEFENSIVE: Returns false on error
   */
  async isModerator(streamerId: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('moderators')
        .select('id')
        .eq('streamer_id', streamerId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('❌ [ModerationService] Error checking moderator status:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('❌ [ModerationService] Exception in isModerator:', error);
      return false;
    }
  }
}

export const moderationService = new ModerationService();
