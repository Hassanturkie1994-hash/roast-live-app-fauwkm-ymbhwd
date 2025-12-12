
import { supabase } from '@/app/integrations/supabase/client';
import { notificationService } from './notificationService';
import { inboxService } from './inboxService';
import { pushNotificationService } from './pushNotificationService';

export interface PremiumSubscription {
  id: string;
  user_id: string;
  subscription_provider: 'stripe' | 'paypal';
  subscription_id: string;
  customer_id: string | null;
  price_sek: number;
  status: 'active' | 'canceled' | 'expired' | 'past_due';
  started_at: string;
  renewed_at: string;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
}

class PremiumSubscriptionService {
  /**
   * Check if a user has an active premium subscription
   */
  async isPremiumMember(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('premium_active')
        .eq('id', userId)
        .single();

      if (error || !data) {
        return false;
      }

      return data.premium_active === true;
    } catch (error) {
      console.error('Error checking premium status:', error);
      return false;
    }
  }

  /**
   * Get premium subscription details for a user
   */
  async getPremiumSubscription(userId: string): Promise<PremiumSubscription | null> {
    try {
      const { data, error } = await supabase
        .from('premium_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (error || !data) {
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching premium subscription:', error);
      return null;
    }
  }

  /**
   * Create a premium subscription
   */
  async createPremiumSubscription(
    userId: string,
    provider: 'stripe' | 'paypal',
    subscriptionId: string,
    customerId?: string
  ): Promise<{ success: boolean; data?: PremiumSubscription; error?: string }> {
    try {
      const now = new Date();
      const renewalDate = new Date(now);
      renewalDate.setMonth(renewalDate.getMonth() + 1);

      // Create subscription record
      const { data: subscription, error: subError } = await supabase
        .from('premium_subscriptions')
        .insert({
          user_id: userId,
          subscription_provider: provider,
          subscription_id: subscriptionId,
          customer_id: customerId,
          price_sek: 89.00,
          status: 'active',
          started_at: now.toISOString(),
          renewed_at: renewalDate.toISOString(),
        })
        .select()
        .single();

      if (subError) {
        console.error('Error creating premium subscription:', subError);
        return { success: false, error: subError.message };
      }

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          premium_active: true,
          premium_since: now.toISOString(),
          premium_expiring: renewalDate.toISOString(),
          premium_subscription_provider: provider,
          premium_subscription_id: subscriptionId,
        })
        .eq('id', userId);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        return { success: false, error: profileError.message };
      }

      // Send welcome notification via inbox
      await this.sendPremiumWelcomeNotification(userId);

      // Also send a system notification
      await notificationService.createNotification({
        type: 'subscription_renewed',
        receiver_id: userId,
        message: 'Welcome to PREMIUM! Enjoy exclusive benefits and enhanced features.',
        category: 'wallet',
      });

      // Send push notification
      await pushNotificationService.sendPremiumActivatedNotification(userId);

      console.log('✅ Premium subscription created successfully');
      return { success: true, data: subscription };
    } catch (error) {
      console.error('Error in createPremiumSubscription:', error);
      return { success: false, error: 'Failed to create premium subscription' };
    }
  }

  /**
   * Send premium welcome notification to inbox
   */
  private async sendPremiumWelcomeNotification(userId: string): Promise<void> {
    try {
      // Create inbox message
      await inboxService.createSystemMessage({
        receiver_id: userId,
        title: '🎉 Welcome to PREMIUM!',
        message: 'You are now Premium! Your benefits are active.\n\n✨ Enjoy:\n- Priority placement in Explore\n- Premium badge everywhere\n- Ad-free experience\n- Double profile reach\n- Premium filters\n- Profile customization\n- 20% off VIP clubs\n- Reduced platform fees',
        category: 'wallet',
      });

      console.log('✅ Premium welcome notification sent');
    } catch (error) {
      console.error('Error sending premium welcome notification:', error);
    }
  }

  /**
   * Renew a premium subscription
   */
  async renewPremiumSubscription(
    subscriptionId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const renewalDate = new Date();
      renewalDate.setMonth(renewalDate.getMonth() + 1);

      // Update subscription
      const { data: subscription, error: subError } = await supabase
        .from('premium_subscriptions')
        .update({
          renewed_at: renewalDate.toISOString(),
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('subscription_id', subscriptionId)
        .select('user_id')
        .single();

      if (subError || !subscription) {
        console.error('Error renewing premium subscription:', subError);
        return { success: false, error: subError?.message || 'Subscription not found' };
      }

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          premium_expiring: renewalDate.toISOString(),
        })
        .eq('id', subscription.user_id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        return { success: false, error: profileError.message };
      }

      // Send renewal notification
      await notificationService.createNotification({
        type: 'subscription_renewed',
        receiver_id: subscription.user_id,
        message: 'Your PREMIUM subscription has been renewed for another month!',
        category: 'wallet',
      });

      // Send push notification
      await pushNotificationService.sendPremiumRenewedNotification(subscription.user_id);

      console.log('✅ Premium subscription renewed successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in renewPremiumSubscription:', error);
      return { success: false, error: 'Failed to renew premium subscription' };
    }
  }

  /**
   * Cancel a premium subscription
   * Note: Premium remains active until billing period ends
   */
  async cancelPremiumSubscription(
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const now = new Date();

      // Update subscription status
      const { data: subscription, error: subError } = await supabase
        .from('premium_subscriptions')
        .update({
          status: 'canceled',
          canceled_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('user_id', userId)
        .eq('status', 'active')
        .select('renewed_at')
        .single();

      if (subError || !subscription) {
        console.error('Error canceling premium subscription:', subError);
        return { success: false, error: subError?.message || 'Subscription not found' };
      }

      // Note: We don't immediately deactivate premium_active
      // It will remain active until the renewed_at date

      // Send cancellation notification
      await notificationService.createNotification({
        type: 'subscription_failed',
        receiver_id: userId,
        message: `Your PREMIUM subscription has been canceled. You'll retain access until ${new Date(subscription.renewed_at).toLocaleDateString()}.`,
        category: 'wallet',
      });

      // Send push notification
      await pushNotificationService.sendPremiumCanceledNotification(userId);

      console.log('✅ Premium subscription canceled successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in cancelPremiumSubscription:', error);
      return { success: false, error: 'Failed to cancel premium subscription' };
    }
  }

  /**
   * Deactivate expired premium subscriptions
   * This should be called by a cron job or when checking subscription status
   */
  async deactivateExpiredSubscriptions(): Promise<void> {
    try {
      const now = new Date();

      // Find expired subscriptions
      const { data: expiredSubs, error } = await supabase
        .from('premium_subscriptions')
        .select('user_id, subscription_id')
        .eq('status', 'canceled')
        .lt('renewed_at', now.toISOString());

      if (error || !expiredSubs || expiredSubs.length === 0) {
        return;
      }

      // Deactivate each expired subscription
      for (const sub of expiredSubs) {
        await supabase
          .from('premium_subscriptions')
          .update({ status: 'expired' })
          .eq('subscription_id', sub.subscription_id);

        await supabase
          .from('profiles')
          .update({
            premium_active: false,
            premium_subscription_provider: null,
            premium_subscription_id: null,
          })
          .eq('id', sub.user_id);

        // Send expiration notification
        await notificationService.createNotification({
          type: 'subscription_failed',
          receiver_id: sub.user_id,
          message: 'Your PREMIUM subscription has expired. Resubscribe to continue enjoying exclusive benefits!',
          category: 'wallet',
        });
      }

      console.log(`✅ Deactivated ${expiredSubs.length} expired premium subscriptions`);
    } catch (error) {
      console.error('Error deactivating expired subscriptions:', error);
    }
  }

  /**
   * Check for subscriptions expiring in 48 hours and send notifications
   */
  async notifyExpiringSubscriptions(): Promise<void> {
    try {
      const now = new Date();
      const fortyEightHoursFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000);

      // Find subscriptions expiring in 48 hours
      const { data: expiringSubs, error } = await supabase
        .from('premium_subscriptions')
        .select('user_id, renewed_at')
        .eq('status', 'canceled')
        .gte('renewed_at', now.toISOString())
        .lte('renewed_at', fortyEightHoursFromNow.toISOString());

      if (error || !expiringSubs || expiringSubs.length === 0) {
        return;
      }

      // Send expiring notifications
      for (const sub of expiringSubs) {
        await pushNotificationService.sendPremiumExpiringNotification(sub.user_id);
      }

      console.log(`✅ Sent expiring notifications to ${expiringSubs.length} users`);
    } catch (error) {
      console.error('Error notifying expiring subscriptions:', error);
    }
  }

  /**
   * Handle failed payment
   */
  async handlePaymentFailed(
    subscriptionId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Find subscription
      const { data: subscription, error } = await supabase
        .from('premium_subscriptions')
        .select('user_id')
        .eq('subscription_id', subscriptionId)
        .single();

      if (error || !subscription) {
        return { success: false, error: 'Subscription not found' };
      }

      // Update status to past_due
      await supabase
        .from('premium_subscriptions')
        .update({
          status: 'past_due',
          updated_at: new Date().toISOString(),
        })
        .eq('subscription_id', subscriptionId);

      // Send notification
      await notificationService.createNotification({
        type: 'subscription_failed',
        receiver_id: subscription.user_id,
        message: 'Your PREMIUM subscription payment failed. Please update your payment method to continue.',
        category: 'wallet',
      });

      // Send push notification
      await pushNotificationService.sendPaymentFailedNotification(subscription.user_id);

      console.log('✅ Payment failure handled');
      return { success: true };
    } catch (error) {
      console.error('Error handling payment failure:', error);
      return { success: false, error: 'Failed to handle payment failure' };
    }
  }

  /**
   * Get premium benefits for display
   */
  getPremiumBenefits(): {
    icon: string;
    title: string;
    description: string;
  }[] {
    return [
      {
        icon: 'star.fill',
        title: 'Priority Placement',
        description: 'Appear higher in Explore rankings and win tie-breaks',
      },
      {
        icon: 'crown.fill',
        title: 'Premium Badge',
        description: 'Gold gradient badge visible everywhere on the platform',
      },
      {
        icon: 'eye.slash.fill',
        title: 'Ad-Free Experience',
        description: 'Remove banner ads and watermarks (except livestream overlay)',
      },
      {
        icon: 'arrow.up.circle.fill',
        title: 'Double Profile Reach',
        description: 'Stories and posts get featured and auto-priority ranking',
      },
      {
        icon: 'camera.filters',
        title: 'Premium Filter Pack',
        description: 'Exclusive filters: Glow, High Contrast, Beauty, Sharpened',
      },
      {
        icon: 'paintbrush.fill',
        title: 'Profile Customization',
        description: 'Custom theme color, animated avatar border, Link-In-Bio',
      },
      {
        icon: 'tag.fill',
        title: 'Discounted Subscriptions',
        description: '20% off VIP club subscriptions (pay $2.40 instead of $3)',
      },
      {
        icon: 'gift.fill',
        title: 'Reduced Platform Fee',
        description: 'Only 22% platform fee when gifting (vs 30% for regular users)',
      },
    ];
  }
}

export const premiumSubscriptionService = new PremiumSubscriptionService();