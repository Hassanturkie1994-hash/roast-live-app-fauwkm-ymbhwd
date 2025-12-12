
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

      // PROMPT 3: Send push notification for new follower (with batching)
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

  async getFollowers(userId: string) {
    try {
      const { data, error } = await supabase
        .from('followers')
        .select('follower_id, profiles!followers_follower_id_fkey(*)')
        .eq('following_id', userId);

      if (error) {
        console.error('Error fetching followers:', error);
        return { success: false, data: [], error };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in getFollowers:', error);
      return { success: false, data: [], error };
    }
  },

  async getFollowing(userId: string) {
    try {
      const { data, error } = await supabase
        .from('followers')
        .select('following_id, profiles!followers_following_id_fkey(*)')
        .eq('follower_id', userId);

      if (error) {
        console.error('Error fetching following:', error);
        return { success: false, data: [], error };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in getFollowing:', error);
      return { success: false, data: [], error };
    }
  },
};