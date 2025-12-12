
import { supabase } from '@/app/integrations/supabase/client';
import { pushNotificationService } from './pushNotificationService';
import { notificationService } from './notificationService';

export interface Achievement {
  id: string;
  achievement_key: string;
  name: string;
  description: string;
  emoji: string;
  category: 'beginner' | 'engagement' | 'support' | 'creator';
  requirement_value: number;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_key: string;
  unlocked_at: string;
  created_at: string;
}

export interface UserSelectedBadges {
  id: string;
  user_id: string;
  badge_1: string | null;
  badge_2: string | null;
  badge_3: string | null;
  updated_at: string;
  created_at: string;
}

class AchievementService {
  /**
   * Get all available achievements
   */
  async getAllAchievements(): Promise<Achievement[]> {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('category', { ascending: true })
        .order('requirement_value', { ascending: true });

      if (error) {
        console.error('❌ Error fetching achievements:', error);
        return [];
      }

      return (data || []) as Achievement[];
    } catch (error) {
      console.error('❌ Error in getAllAchievements:', error);
      return [];
    }
  }

  /**
   * Get user's unlocked achievements
   * Fixed: Explicitly select fields from both tables to avoid relationship errors
   */
  async getUserAchievements(userId: string): Promise<(UserAchievement & { achievement?: Achievement })[]> {
    try {
      // First get user achievements
      const { data: userAchievements, error: userError } = await supabase
        .from('user_achievements')
        .select('id, user_id, achievement_key, unlocked_at, created_at')
        .eq('user_id', userId)
        .order('unlocked_at', { ascending: false });

      if (userError) {
        console.error('❌ Error fetching user achievements:', userError);
        return [];
      }

      if (!userAchievements || userAchievements.length === 0) {
        return [];
      }

      // Get achievement keys
      const achievementKeys = userAchievements.map(ua => ua.achievement_key);

      // Fetch achievement details separately
      const { data: achievements, error: achievementsError } = await supabase
        .from('achievements')
        .select('*')
        .in('achievement_key', achievementKeys);

      if (achievementsError) {
        console.error('❌ Error fetching achievement details:', achievementsError);
        // Return user achievements without details
        return userAchievements as (UserAchievement & { achievement?: Achievement })[];
      }

      // Map achievements to user achievements
      const achievementsMap = new Map(
        (achievements || []).map(a => [a.achievement_key, a])
      );

      const result = userAchievements.map(ua => ({
        ...ua,
        achievement: achievementsMap.get(ua.achievement_key),
      }));

      return result as (UserAchievement & { achievement?: Achievement })[];
    } catch (error) {
      console.error('❌ Error in getUserAchievements:', error);
      return [];
    }
  }

  /**
   * Check if user has unlocked an achievement
   */
  async hasAchievement(userId: string, achievementKey: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('id')
        .eq('user_id', userId)
        .eq('achievement_key', achievementKey)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error checking achievement:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('❌ Error in hasAchievement:', error);
      return false;
    }
  }

  /**
   * Unlock an achievement for a user
   */
  async unlockAchievement(
    userId: string,
    achievementKey: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if already unlocked
      const hasIt = await this.hasAchievement(userId, achievementKey);
      if (hasIt) {
        return { success: true }; // Already unlocked
      }

      // Get achievement details
      const { data: achievement, error: achievementError } = await supabase
        .from('achievements')
        .select('*')
        .eq('achievement_key', achievementKey)
        .maybeSingle();

      if (achievementError || !achievement) {
        console.error('❌ Achievement not found:', achievementKey, achievementError);
        return { success: false, error: 'Achievement not found' };
      }

      // Unlock the achievement
      const { error: insertError } = await supabase
        .from('user_achievements')
        .insert({
          user_id: userId,
          achievement_key: achievementKey,
        });

      if (insertError) {
        console.error('❌ Error unlocking achievement:', insertError);
        return { success: false, error: insertError.message };
      }

      console.log(`✅ Achievement unlocked: ${achievementKey} for user ${userId}`);

      // Send push notification
      try {
        await pushNotificationService.sendMilestoneNotification(
          userId,
          '🎉 Achievement Unlocked!',
          `${achievement.emoji} ${achievement.name}: ${achievement.description}`
        );
      } catch (notifError) {
        console.error('⚠️ Failed to send push notification:', notifError);
        // Don't fail the whole operation if notification fails
      }

      // Create notification
      try {
        await notificationService.createNotification(
          userId,
          userId,
          'system_update',
          `🎉 Achievement Unlocked! ${achievement.emoji} ${achievement.name}: ${achievement.description}`,
          undefined,
          undefined,
          undefined,
          'social'
        );
      } catch (notifError) {
        console.error('⚠️ Failed to create notification:', notifError);
        // Don't fail the whole operation if notification fails
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Error in unlockAchievement:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to unlock achievement';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get user's selected badges
   */
  async getSelectedBadges(userId: string): Promise<UserSelectedBadges | null> {
    try {
      const { data, error } = await supabase
        .from('user_selected_badges')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error fetching selected badges:', error);
        return null;
      }

      return data as UserSelectedBadges | null;
    } catch (error) {
      console.error('❌ Error in getSelectedBadges:', error);
      return null;
    }
  }

  /**
   * Update user's selected badges (max 3)
   */
  async updateSelectedBadges(
    userId: string,
    badge1: string | null,
    badge2: string | null,
    badge3: string | null
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('user_selected_badges')
        .upsert({
          user_id: userId,
          badge_1: badge1,
          badge_2: badge2,
          badge_3: badge3,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) {
        console.error('❌ Error updating selected badges:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Selected badges updated successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Error in updateSelectedBadges:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update selected badges';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Check and unlock achievements based on user activity
   */
  async checkAndUnlockAchievements(
    userId: string,
    activityType: 'view' | 'comment' | 'like' | 'gift_sent' | 'follow' | 'watch_time' | 'spending' | 'stream_completed'
  ): Promise<void> {
    try {
      switch (activityType) {
        case 'view':
          await this.unlockAchievement(userId, 'first_view');
          break;
        case 'comment':
          await this.unlockAchievement(userId, 'first_comment');
          break;
        case 'like':
          await this.unlockAchievement(userId, 'first_like');
          break;
        case 'gift_sent':
          await this.unlockAchievement(userId, 'first_gift_sent');
          await this.checkSpendingAchievements(userId);
          break;
        case 'follow':
          await this.unlockAchievement(userId, 'first_follow');
          break;
        case 'watch_time':
          await this.checkWatchTimeAchievements(userId);
          break;
        case 'spending':
          await this.checkSpendingAchievements(userId);
          break;
        case 'stream_completed':
          await this.checkStreamAchievements(userId);
          break;
      }
    } catch (error) {
      console.error('❌ Error in checkAndUnlockAchievements:', error);
    }
  }

  /**
   * Check watch time achievements
   */
  private async checkWatchTimeAchievements(userId: string): Promise<void> {
    try {
      // Get total watch time from stream_viewers
      const { data, error } = await supabase
        .from('stream_viewers')
        .select('joined_at, left_at')
        .eq('user_id', userId)
        .not('left_at', 'is', null);

      if (error || !data) {
        console.error('❌ Error fetching watch time:', error);
        return;
      }

      // Calculate total watch time in seconds
      let totalSeconds = 0;
      data.forEach((view: any) => {
        const joined = new Date(view.joined_at).getTime();
        const left = new Date(view.left_at).getTime();
        totalSeconds += (left - joined) / 1000;
      });

      // Check achievements
      if (totalSeconds >= 360000) { // 100 hours
        await this.unlockAchievement(userId, '100_hours_watched');
      } else if (totalSeconds >= 180000) { // 50 hours
        await this.unlockAchievement(userId, '50_hours_watched');
      } else if (totalSeconds >= 36000) { // 10 hours
        await this.unlockAchievement(userId, '10_hours_watched');
      }
    } catch (error) {
      console.error('❌ Error in checkWatchTimeAchievements:', error);
    }
  }

  /**
   * Check spending achievements
   */
  private async checkSpendingAchievements(userId: string): Promise<void> {
    try {
      // Get total spending from gift_transactions
      const { data, error } = await supabase
        .from('gift_transactions')
        .select('amount')
        .eq('sender_id', userId);

      if (error || !data) {
        console.error('❌ Error fetching spending:', error);
        return;
      }

      // Calculate total spending
      const totalSpent = data.reduce((sum: number, tx: any) => sum + (tx.amount || 0), 0);

      // Check achievements
      if (totalSpent >= 5000) {
        await this.unlockAchievement(userId, '5000_kr_spent');
      } else if (totalSpent >= 2000) {
        await this.unlockAchievement(userId, '2000_kr_spent');
      } else if (totalSpent >= 500) {
        await this.unlockAchievement(userId, '500_kr_spent');
      } else if (totalSpent >= 100) {
        await this.unlockAchievement(userId, '100_kr_spent');
      }
    } catch (error) {
      console.error('❌ Error in checkSpendingAchievements:', error);
    }
  }

  /**
   * Check stream achievements
   */
  private async checkStreamAchievements(userId: string): Promise<void> {
    try {
      // Get total completed streams
      const { count, error } = await supabase
        .from('live_streams')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', userId)
        .not('ended_at', 'is', null);

      if (error) {
        console.error('❌ Error fetching stream count:', error);
        return;
      }

      const streamCount = count || 0;

      // Check achievements
      if (streamCount >= 100) {
        await this.unlockAchievement(userId, '100_live_streams');
      } else if (streamCount >= 10) {
        await this.unlockAchievement(userId, '10_live_streams');
      } else if (streamCount >= 1) {
        await this.unlockAchievement(userId, 'first_live_stream');
      }
    } catch (error) {
      console.error('❌ Error in checkStreamAchievements:', error);
    }
  }

  /**
   * Check for follower milestones
   */
  async checkFollowerMilestones(userId: string): Promise<void> {
    try {
      // Get follower count
      const { data: profile } = await supabase
        .from('profiles')
        .select('followers_count')
        .eq('id', userId)
        .maybeSingle();

      if (!profile) return;

      const followerCount = profile.followers_count || 0;

      // Check for 10 followers in a day milestone
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const { count: recentFollowers } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId)
        .gte('created_at', oneDayAgo.toISOString());

      if (recentFollowers && recentFollowers >= 10) {
        try {
          await pushNotificationService.sendMilestoneNotification(
            userId,
            "You're growing fast!",
            `You gained ${recentFollowers} followers today!`
          );
        } catch (error) {
          console.error('⚠️ Failed to send milestone notification:', error);
        }
      }
    } catch (error) {
      console.error('❌ Error checking follower milestones:', error);
    }
  }

  /**
   * Check for gift value milestones
   */
  async checkGiftValueMilestones(userId: string): Promise<void> {
    try {
      // Get total gift value received
      const { data: gifts } = await supabase
        .from('gift_events')
        .select('price_sek')
        .eq('receiver_user_id', userId);

      if (!gifts) return;

      const totalValue = gifts.reduce((sum, gift) => sum + (gift.price_sek || 0), 0);

      // Check for 100 kr milestone
      if (totalValue >= 100 && totalValue < 200) {
        try {
          await pushNotificationService.sendMilestoneNotification(
            userId,
            'Milestone unlocked!',
            `You reached ${totalValue} kr gifted total.`
          );
        } catch (error) {
          console.error('⚠️ Failed to send milestone notification:', error);
        }
      }
    } catch (error) {
      console.error('❌ Error checking gift value milestones:', error);
    }
  }

  /**
   * Check for first coin purchase milestone
   */
  async checkFirstCoinPurchase(userId: string): Promise<void> {
    try {
      // Check if this is the first coin purchase
      const { count } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('type', 'wallet_topup');

      if (count === 1) {
        try {
          await pushNotificationService.sendMilestoneNotification(
            userId,
            'First purchase!',
            'Thank you for your first coin purchase!'
          );
        } catch (error) {
          console.error('⚠️ Failed to send milestone notification:', error);
        }
      }
    } catch (error) {
      console.error('❌ Error checking first coin purchase:', error);
    }
  }
}

export const achievementService = new AchievementService();
