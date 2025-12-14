
import { supabase } from '@/app/integrations/supabase/client';
import { notificationService } from './notificationService';
import { pushNotificationService } from './pushNotificationService';

export const followService = {
  async followUser(followerId: string, followingId: string) {
    try {
      const { error } = await supabase.from('followers').insert({
        follower_id: followerId,
        following_id: followingId,
      });

      if (error) {
        console.error('Error following user:', error);
        return { success: false, error };
      }

      // Check if it's mutual follow
      const { data: mutualFollow } = await supabase
        .from('followers')
        .select('id')
        .eq('follower_id', followingId)
        .eq('following_id', followerId)
        .maybeSingle();

      const message = mutualFollow ? 'is now following you back' : 'started following you';

      // Send notification
      await notificationService.createNotification(
        followerId,
        followingId,
        'follow',
        message,
        undefined,
        undefined,
        undefined,
        'social'
      );

      // Send push notification for new follower (with batching)
      const { data: followerProfile } = await supabase
        .from('profiles')
        .select('display_name, username')
        .eq('id', followerId)
        .single();

      const followerName = followerProfile?.display_name || followerProfile?.username || 'Someone';
      await pushNotificationService.sendNewFollowerNotification(followingId, followerId, followerName);

      return { success: true, isMutual: !!mutualFollow };
    } catch (error) {
      console.error('Error in followUser:', error);
      return { success: false, error };
    }
  },

  async unfollowUser(followerId: string, followingId: string) {
    try {
      const { error } = await supabase
        .from('followers')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId);

      if (error) {
        console.error('Error unfollowing user:', error);
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in unfollowUser:', error);
      return { success: false, error };
    }
  },

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('followers')
        .select('id')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .maybeSingle();

      if (error) {
        console.error('Error checking follow status:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error in isFollowing:', error);
      return false;
    }
  },

  async isMutualFollow(userId1: string, userId2: string): Promise<boolean> {
    try {
      const [follow1, follow2] = await Promise.all([
        this.isFollowing(userId1, userId2),
        this.isFollowing(userId2, userId1),
      ]);

      return follow1 && follow2;
    } catch (error) {
      console.error('Error in isMutualFollow:', error);
      return false;
    }
  },

  /**
   * Get followers - FIXED: Use correct foreign key relationship
   * The followers table has follower_id and following_id both pointing to users/profiles
   * To get followers of a user, we need following_id = userId and join on follower_id
   */
  async getFollowers(userId: string) {
    try {
      console.log('📥 [FollowService] Fetching followers for user:', userId);

      // First fetch the follower relationships
      const { data: followerRelations, error: relationError } = await supabase
        .from('followers')
        .select('follower_id, created_at')
        .eq('following_id', userId);

      if (relationError) {
        console.error('❌ [FollowService] Error fetching follower relations:', relationError);
        return { success: false, data: [], error: relationError };
      }

      if (!followerRelations || followerRelations.length === 0) {
        console.log('✅ [FollowService] No followers found');
        return { success: true, data: [] };
      }

      // Fetch profile data separately
      const followerIds = followerRelations.map(f => f.follower_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', followerIds);

      if (profilesError) {
        console.error('❌ [FollowService] Error fetching profiles:', profilesError);
        return { success: false, data: [], error: profilesError };
      }

      // Merge the data
      const profileMap = new Map((profiles || []).map(p => [p.id, p]));
      const result = followerRelations.map(rel => ({
        follower_id: rel.follower_id,
        created_at: rel.created_at,
        ...profileMap.get(rel.follower_id),
      }));

      console.log('✅ [FollowService] Found', result.length, 'followers');
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ [FollowService] Error in getFollowers:', error);
      return { success: false, data: [], error };
    }
  },

  async getFollowing(userId: string) {
    try {
      console.log('📥 [FollowService] Fetching following for user:', userId);

      // First fetch the following relationships
      const { data: followingRelations, error: relationError } = await supabase
        .from('followers')
        .select('following_id, created_at')
        .eq('follower_id', userId);

      if (relationError) {
        console.error('❌ [FollowService] Error fetching following relations:', relationError);
        return { success: false, data: [], error: relationError };
      }

      if (!followingRelations || followingRelations.length === 0) {
        console.log('✅ [FollowService] Not following anyone');
        return { success: true, data: [] };
      }

      // Fetch profile data separately
      const followingIds = followingRelations.map(f => f.following_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', followingIds);

      if (profilesError) {
        console.error('❌ [FollowService] Error fetching profiles:', profilesError);
        return { success: false, data: [], error: profilesError };
      }

      // Merge the data
      const profileMap = new Map((profiles || []).map(p => [p.id, p]));
      const result = followingRelations.map(rel => ({
        following_id: rel.following_id,
        created_at: rel.created_at,
        ...profileMap.get(rel.following_id),
      }));

      console.log('✅ [FollowService] Following', result.length, 'users');
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ [FollowService] Error in getFollowing:', error);
      return { success: false, data: [], error };
    }
  },
};
