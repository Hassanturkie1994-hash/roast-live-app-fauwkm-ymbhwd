
import { supabase } from '@/app/integrations/supabase/client';
import { notificationService } from './notificationService';

export interface ClubSubscription {
  id: string;
  creator_id: string;
  subscriber_id: string;
  subscription_price_usd: number;
  creator_payout_usd: number;
  platform_payout_usd: number;
  started_at: string;
  renewed_at: string;
  status: 'active' | 'canceled' | 'expired';
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClubMemberDetails {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  join_date: string;
  renewal_date: string;
  status: string;
}

class ClubSubscriptionService {
  /**
   * Create a VIP club subscription (FREE for creator)
   */
  async createClubSubscription(
    creatorId: string,
    subscriberId: string,
    stripeSubscriptionId?: string,
    stripeCustomerId?: string
  ): Promise<{ success: boolean; data?: ClubSubscription; error?: string }> {
    try {
      const now = new Date();
      const renewalDate = new Date(now);
      renewalDate.setMonth(renewalDate.getMonth() + 1);

      const { data, error } = await supabase
        .from('club_subscriptions')
        .insert({
          creator_id: creatorId,
          subscriber_id: subscriberId,
          subscription_price_usd: 3.00,
          creator_payout_usd: 2.10, // 70% of $3
          platform_payout_usd: 0.90, // 30% of $3
          started_at: now.toISOString(),
          renewed_at: renewalDate.toISOString(),
          status: 'active',
          stripe_subscription_id: stripeSubscriptionId,
          stripe_customer_id: stripeCustomerId,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating club subscription:', error);
        return { success: false, error: error.message };
      }

      // Send notification to subscriber
      await notificationService.createNotification({
        type: 'subscription_renewed',
        sender_id: creatorId,
        receiver_id: subscriberId,
        message: 'Welcome to the VIP Club! You now have exclusive access and a special badge.',
        category: 'social',
      });

      // Send notification to creator
      await notificationService.createNotification({
        type: 'subscription_renewed',
        sender_id: subscriberId,
        receiver_id: creatorId,
        message: 'New VIP Club member joined!',
        category: 'social',
      });

      console.log('✅ Club subscription created successfully');
      return { success: true, data };
    } catch (error) {
      console.error('Error in createClubSubscription:', error);
      return { success: false, error: 'Failed to create club subscription' };
    }
  }

  /**
   * Get all active club members for a creator
   */
  async getClubMembers(creatorId: string): Promise<ClubMemberDetails[]> {
    try {
      const { data, error } = await supabase
        .from('club_subscriptions')
        .select(`
          id,
          subscriber_id,
          started_at,
          renewed_at,
          status,
          profiles:subscriber_id(
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('creator_id', creatorId)
        .eq('status', 'active')
        .order('started_at', { ascending: false });

      if (error) {
        console.error('Error fetching club members:', error);
        return [];
      }

      return (data || []).map((sub: any) => ({
        id: sub.id,
        username: sub.profiles?.username || 'Unknown',
        display_name: sub.profiles?.display_name || 'Unknown',
        avatar_url: sub.profiles?.avatar_url,
        join_date: sub.started_at,
        renewal_date: sub.renewed_at,
        status: sub.status,
      }));
    } catch (error) {
      console.error('Error in getClubMembers:', error);
      return [];
    }
  }

  /**
   * Check if a user is subscribed to a creator's club
   */
  async isClubMember(creatorId: string, subscriberId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('club_subscriptions')
        .select('id')
        .eq('creator_id', creatorId)
        .eq('subscriber_id', subscriberId)
        .eq('status', 'active')
        .single();

      return !!data && !error;
    } catch (error) {
      console.error('Error checking club membership:', error);
      return false;
    }
  }

  /**
   * Cancel a club subscription
   */
  async cancelSubscription(
    subscriptionId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('club_subscriptions')
        .update({
          status: 'canceled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscriptionId);

      if (error) {
        console.error('Error canceling subscription:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Subscription canceled successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in cancelSubscription:', error);
      return { success: false, error: 'Failed to cancel subscription' };
    }
  }

  /**
   * Renew a club subscription
   */
  async renewSubscription(
    subscriptionId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const renewalDate = new Date();
      renewalDate.setMonth(renewalDate.getMonth() + 1);

      const { error } = await supabase
        .from('club_subscriptions')
        .update({
          renewed_at: renewalDate.toISOString(),
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscriptionId);

      if (error) {
        console.error('Error renewing subscription:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Subscription renewed successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in renewSubscription:', error);
      return { success: false, error: 'Failed to renew subscription' };
    }
  }

  /**
   * Get subscription details
   */
  async getSubscription(
    creatorId: string,
    subscriberId: string
  ): Promise<ClubSubscription | null> {
    try {
      const { data, error } = await supabase
        .from('club_subscriptions')
        .select('*')
        .eq('creator_id', creatorId)
        .eq('subscriber_id', subscriberId)
        .single();

      if (error) {
        console.error('Error fetching subscription:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getSubscription:', error);
      return null;
    }
  }

  /**
   * Get creator's club revenue summary
   */
  async getClubRevenueSummary(creatorId: string): Promise<{
    totalMembers: number;
    monthlyRevenue: number;
    lifetimeRevenue: number;
  }> {
    try {
      const { data: subscriptions, error } = await supabase
        .from('club_subscriptions')
        .select('creator_payout_usd, started_at, status')
        .eq('creator_id', creatorId);

      if (error || !subscriptions) {
        console.error('Error fetching club revenue:', error);
        return { totalMembers: 0, monthlyRevenue: 0, lifetimeRevenue: 0 };
      }

      const activeMembers = subscriptions.filter((sub) => sub.status === 'active').length;
      const monthlyRevenue = activeMembers * 2.10; // $2.10 per member

      // Calculate lifetime revenue (simplified - would need transaction history for accuracy)
      const lifetimeRevenue = subscriptions.reduce((sum, sub) => {
        const monthsActive = Math.floor(
          (Date.now() - new Date(sub.started_at).getTime()) / (30 * 24 * 60 * 60 * 1000)
        );
        return sum + sub.creator_payout_usd * Math.max(1, monthsActive);
      }, 0);

      return {
        totalMembers: activeMembers,
        monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
        lifetimeRevenue: Math.round(lifetimeRevenue * 100) / 100,
      };
    } catch (error) {
      console.error('Error in getClubRevenueSummary:', error);
      return { totalMembers: 0, monthlyRevenue: 0, lifetimeRevenue: 0 };
    }
  }

  /**
   * Send club announcement to all members
   */
  async sendClubAnnouncement(
    creatorId: string,
    title: string,
    message: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get all active club members
      const { data: subscriptions, error } = await supabase
        .from('club_subscriptions')
        .select('subscriber_id')
        .eq('creator_id', creatorId)
        .eq('status', 'active');

      if (error || !subscriptions) {
        return { success: false, error: 'Failed to fetch club members' };
      }

      // Send notification to each member
      for (const sub of subscriptions) {
        await notificationService.createNotification({
          type: 'admin_announcement',
          sender_id: creatorId,
          receiver_id: sub.subscriber_id,
          message: `${title}: ${message}`,
          category: 'social',
        });
      }

      console.log(`✅ Announcement sent to ${subscriptions.length} club members`);
      return { success: true };
    } catch (error) {
      console.error('Error in sendClubAnnouncement:', error);
      return { success: false, error: 'Failed to send announcement' };
    }
  }
}

export const clubSubscriptionService = new ClubSubscriptionService();