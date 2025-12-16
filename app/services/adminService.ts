
import { supabase } from '@/app/integrations/supabase/client';

interface SearchUserResult {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  followers_count: number;
  role: string;
}

class AdminService {
  /**
   * Search users by username, display name, or email
   * Uses the database function for efficient searching
   */
  async searchUsers(query: string, limit: number = 20): Promise<SearchUserResult[]> {
    try {
      if (!query || query.trim().length === 0) {
        return [];
      }

      const { data, error } = await supabase.rpc('search_users', {
        search_query: query.trim(),
        limit_count: limit,
      });

      if (error) {
        console.error('Error searching users:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in searchUsers:', error);
      return [];
    }
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getUserProfile:', error);
      return null;
    }
  }

  /**
   * Get all users (for admin purposes)
   */
  async getAllUsers(limit: number = 50, offset: number = 0) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching all users:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      return [];
    }
  }

  /**
   * Update user role (admin only)
   */
  async updateUserRole(userId: string, role: string) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: role.toUpperCase() })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user role:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in updateUserRole:', error);
      return { success: false, error: 'Failed to update user role' };
    }
  }

  /**
   * Ban user (admin only)
   */
  async banUser(userId: string, reason: string, duration?: number) {
    try {
      const expiresAt = duration
        ? new Date(Date.now() + duration * 60 * 1000).toISOString()
        : null;

      const { error } = await supabase.from('admin_penalties').insert({
        user_id: userId,
        admin_id: (await supabase.auth.getUser()).data.user?.id,
        severity: duration ? 'temporary' : 'permanent',
        reason,
        duration_hours: duration ? Math.floor(duration / 60) : null,
        expires_at: expiresAt,
        is_active: true,
      });

      if (error) {
        console.error('Error banning user:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in banUser:', error);
      return { success: false, error: 'Failed to ban user' };
    }
  }
}

export const adminService = new AdminService();
