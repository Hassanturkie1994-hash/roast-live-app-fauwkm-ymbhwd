
import { supabase } from '@/app/integrations/supabase/client';
import { pushNotificationService } from './pushNotificationService';

export interface VIPMembership {
  id: string;
  vip_owner_id: string;
  subscriber_id: string;
  activated_at: string;
  expires_at: string;
  badge_text: string;
  is_active: boolean;
  created_at: string;
}

class VIPMembershipService {
  /**
   * Check if a user is a VIP member of a specific creator
   */
  async isVIPMember(creatorId: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('vip_memberships')
        .select('*')
        .eq('vip_owner_id', creatorId)
        .eq('subscriber_id', userId)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking VIP membership:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error in isVIPMember:', error);
      return false;
    }
  }

  /**
   * Get VIP membership details
   */
  async getVIPMembership(creatorId: string, userId: string): Promise<VIPMembership | null> {
    try {
      const { data, error } = await supabase
        .from('vip_memberships')
        .select('*')
        .eq('vip_owner_id', creatorId)
        .eq('subscriber_id', userId)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching VIP membership:', error);
        return null;
      }

      return data as VIPMembership | null;
    } catch (error) {
      console.error('Error in getVIPMembership:', error);
      return null;
    }
  }

  /**
   * Get all VIP members for a creator
   */
  async getVIPMembers(creatorId: string): Promise<VIPMembership[]> {
    try {
      const { data, error } = await supabase
        .from('vip_memberships')
        .select('*, profiles!vip_memberships_subscriber_id_fkey(*)')
        .eq('vip_owner_id', creatorId)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('activated_at', { ascending: false });

      if (error) {
        console.error('Error fetching VIP members:', error);
        return [];
      }

      return data as VIPMembership[];
    } catch (error) {
      console.error('Error in getVIPMembers:', error);
      return [];
    }
  }

  /**
   * Create a VIP membership
   */
  async createVIPMembership(
    creatorId: string,
    subscriberId: string,
    badgeText: string,
    durationMonths: number = 1
  ): Promise<{ success: boolean; data?: VIPMembership; error?: string }> {
    try {
      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

      // Check if membership already exists
      const existing = await this.getVIPMembership(creatorId, subscriberId);
      if (existing) {
        return { success: false, error: 'VIP membership already exists' };
      }

      // Create membership
      const { data, error } = await supabase
        .from('vip_memberships')
        .insert({
          vip_owner_id: creatorId,
          subscriber_id: subscriberId,
          badge_text: badgeText,
          activated_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating VIP membership:', error);
        return { success: false, error: error.message };
      }

      // Log membership history
      await supabase.from('membership_history').insert({
        vip_owner_id: creatorId,
        subscriber_id: subscriberId,
        action_type: 'joined',
        notified: false,
      });

      // Get profiles for notifications
      const { data: creatorProfile } = await supabase
        .from('profiles')
        .select('display_name, username')
        .eq('id', creatorId)
        .single();

      const { data: subscriberProfile } = await supabase
        .from('profiles')
        .select('display_name, username')
        .eq('id', subscriberId)
        .single();

      const creatorName = creatorProfile?.display_name || creatorProfile?.username || 'Creator';
      const subscriberName = subscriberProfile?.display_name || subscriberProfile?.username || 'Someone';

      // Send push notification to creator
      await pushNotificationService.sendVIPMemberJoinedNotification(
        creatorId,
        subscriberId,
        subscriberName
      );

      // Send push notification to subscriber
      await pushNotificationService.sendVIPClubJoinedNotification(
        subscriberId,
        creatorId,
        creatorName
      );

      // Mark as notified
      await supabase
        .from('membership_history')
        .update({ notified: true })
        .eq('vip_owner_id', creatorId)
        .eq('subscriber_id', subscriberId)
        .eq('action_type', 'joined')
        .eq('notified', false);

      console.log('✅ VIP membership created successfully');
      return { success: true, data: data as VIPMembership };
    } catch (error) {
      console.error('Error in createVIPMembership:', error);
      return { success: false, error: 'Failed to create VIP membership' };
    }
  }

  /**
   * Renew a VIP membership
   */
  async renewVIPMembership(
    creatorId: string,
    subscriberId: string,
    durationMonths: number = 1
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const membership = await this.getVIPMembership(creatorId, subscriberId);
      if (!membership) {
        return { success: false, error: 'VIP membership not found' };
      }

      const newExpiresAt = new Date(membership.expires_at);
      newExpiresAt.setMonth(newExpiresAt.getMonth() + durationMonths);

      const { error } = await supabase
        .from('vip_memberships')
        .update({
          expires_at: newExpiresAt.toISOString(),
        })
        .eq('id', membership.id);

      if (error) {
        console.error('Error renewing VIP membership:', error);
        return { success: false, error: error.message };
      }

      // Log membership history
      await supabase.from('membership_history').insert({
        vip_owner_id: creatorId,
        subscriber_id: subscriberId,
        action_type: 'renewed',
        notified: true,
      });

      console.log('✅ VIP membership renewed successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in renewVIPMembership:', error);
      return { success: false, error: 'Failed to renew VIP membership' };
    }
  }

  /**
   * Cancel a VIP membership
   */
  async cancelVIPMembership(
    creatorId: string,
    subscriberId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('vip_memberships')
        .update({
          is_active: false,
        })
        .eq('vip_owner_id', creatorId)
        .eq('subscriber_id', subscriberId);

      if (error) {
        console.error('Error canceling VIP membership:', error);
        return { success: false, error: error.message };
      }

      // Log membership history
      await supabase.from('membership_history').insert({
        vip_owner_id: creatorId,
        subscriber_id: subscriberId,
        action_type: 'left',
        notified: true,
      });

      console.log('✅ VIP membership canceled successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in cancelVIPMembership:', error);
      return { success: false, error: 'Failed to cancel VIP membership' };
    }
  }

  /**
   * Get VIP badge for a user in a specific creator's context
   */
  async getVIPBadge(creatorId: string, userId: string): Promise<{ isMember: boolean; badgeText?: string }> {
    try {
      const membership = await this.getVIPMembership(creatorId, userId);
      if (!membership) {
        return { isMember: false };
      }

      return {
        isMember: true,
        badgeText: membership.badge_text,
      };
    } catch (error) {
      console.error('Error in getVIPBadge:', error);
      return { isMember: false };
    }
  }

  /**
   * Deactivate expired VIP memberships
   * This should be called by a cron job
   */
  async deactivateExpiredMemberships(): Promise<void> {
    try {
      const now = new Date();

      const { data: expiredMemberships, error } = await supabase
        .from('vip_memberships')
        .select('*')
        .eq('is_active', true)
        .lt('expires_at', now.toISOString());

      if (error || !expiredMemberships || expiredMemberships.length === 0) {
        return;
      }

      for (const membership of expiredMemberships) {
        await supabase
          .from('vip_memberships')
          .update({ is_active: false })
          .eq('id', membership.id);

        // Log membership history
        await supabase.from('membership_history').insert({
          vip_owner_id: membership.vip_owner_id,
          subscriber_id: membership.subscriber_id,
          action_type: 'expired',
          notified: true,
        });
      }

      console.log(`✅ Deactivated ${expiredMemberships.length} expired VIP memberships`);
    } catch (error) {
      console.error('Error deactivating expired memberships:', error);
    }
  }
}

export const vipMembershipService = new VIPMembershipService();