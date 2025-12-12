
import { supabase } from '@/app/integrations/supabase/client';
import { clubSubscriptionService } from './clubSubscriptionService';

/**
 * Stripe VIP Club Subscription Service
 * Handles Stripe checkout and webhook processing for VIP club subscriptions
 */

const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
const VIP_CLUB_PRICE_ID = process.env.EXPO_PUBLIC_VIP_CLUB_PRICE_ID || 'price_vip_club_3usd';

interface CheckoutSession {
  sessionId: string;
  url: string;
}

class StripeVIPService {
  /**
   * Create Stripe checkout session for VIP club subscription
   */
  async createCheckoutSession(
    creatorId: string,
    subscriberId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<{ success: boolean; data?: CheckoutSession; error?: string }> {
    try {
      // Call Supabase Edge Function to create checkout session
      const { data, error } = await supabase.functions.invoke('stripe-create-subscription', {
        body: {
          creator_id: creatorId,
          subscriber_id: subscriberId,
          price_id: VIP_CLUB_PRICE_ID,
          success_url: successUrl,
          cancel_url: cancelUrl,
          subscription_type: 'vip_club',
        },
      });

      if (error) {
        console.error('Error creating checkout session:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in createCheckoutSession:', error);
      return { success: false, error: 'Failed to create checkout session' };
    }
  }

  /**
   * Handle successful subscription creation
   * Called by Stripe webhook
   */
  async handleSubscriptionCreated(
    stripeSubscriptionId: string,
    stripeCustomerId: string,
    creatorId: string,
    subscriberId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Create club subscription record
      const result = await clubSubscriptionService.createClubSubscription(
        creatorId,
        subscriberId,
        stripeSubscriptionId,
        stripeCustomerId
      );

      if (!result.success) {
        return { success: false, error: result.error };
      }

      console.log('✅ VIP club subscription created successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in handleSubscriptionCreated:', error);
      return { success: false, error: 'Failed to handle subscription creation' };
    }
  }

  /**
   * Handle subscription renewal
   * Called by Stripe webhook on successful payment
   */
  async handleSubscriptionRenewed(
    stripeSubscriptionId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Find subscription by Stripe ID
      const { data: subscription, error } = await supabase
        .from('club_subscriptions')
        .select('id')
        .eq('stripe_subscription_id', stripeSubscriptionId)
        .single();

      if (error || !subscription) {
        return { success: false, error: 'Subscription not found' };
      }

      // Renew subscription
      const result = await clubSubscriptionService.renewSubscription(subscription.id);

      if (!result.success) {
        return { success: false, error: result.error };
      }

      console.log('✅ VIP club subscription renewed successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in handleSubscriptionRenewed:', error);
      return { success: false, error: 'Failed to handle subscription renewal' };
    }
  }

  /**
   * Handle subscription cancellation
   * Called by Stripe webhook
   */
  async handleSubscriptionCanceled(
    stripeSubscriptionId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Find subscription by Stripe ID
      const { data: subscription, error } = await supabase
        .from('club_subscriptions')
        .select('id')
        .eq('stripe_subscription_id', stripeSubscriptionId)
        .single();

      if (error || !subscription) {
        return { success: false, error: 'Subscription not found' };
      }

      // Cancel subscription
      const result = await clubSubscriptionService.cancelSubscription(subscription.id);

      if (!result.success) {
        return { success: false, error: result.error };
      }

      console.log('✅ VIP club subscription canceled successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in handleSubscriptionCanceled:', error);
      return { success: false, error: 'Failed to handle subscription cancellation' };
    }
  }

  /**
   * Handle failed payment
   * Called by Stripe webhook
   */
  async handlePaymentFailed(
    stripeSubscriptionId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Find subscription by Stripe ID
      const { data: subscription, error } = await supabase
        .from('club_subscriptions')
        .select('subscriber_id, creator_id')
        .eq('stripe_subscription_id', stripeSubscriptionId)
        .single();

      if (error || !subscription) {
        return { success: false, error: 'Subscription not found' };
      }

      // Send notification to subscriber
      await supabase.from('notifications').insert({
        type: 'subscription_failed',
        sender_id: subscription.creator_id,
        receiver_id: subscription.subscriber_id,
        message: 'Your VIP club subscription payment failed. Please update your payment method.',
        category: 'wallet',
      });

      console.log('✅ Payment failure notification sent');
      return { success: true };
    } catch (error) {
      console.error('Error in handlePaymentFailed:', error);
      return { success: false, error: 'Failed to handle payment failure' };
    }
  }

  /**
   * Get subscription status from Stripe
   */
  async getSubscriptionStatus(
    stripeSubscriptionId: string
  ): Promise<{
    success: boolean;
    status?: 'active' | 'canceled' | 'past_due' | 'unpaid';
    error?: string;
  }> {
    try {
      // Call Supabase Edge Function to get subscription status
      const { data, error } = await supabase.functions.invoke('stripe-get-subscription', {
        body: {
          subscription_id: stripeSubscriptionId,
        },
      });

      if (error) {
        console.error('Error getting subscription status:', error);
        return { success: false, error: error.message };
      }

      return { success: true, status: data.status };
    } catch (error) {
      console.error('Error in getSubscriptionStatus:', error);
      return { success: false, error: 'Failed to get subscription status' };
    }
  }

  /**
   * Cancel subscription in Stripe
   */
  async cancelStripeSubscription(
    stripeSubscriptionId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Call Supabase Edge Function to cancel subscription
      const { error } = await supabase.functions.invoke('stripe-cancel-subscription', {
        body: {
          subscription_id: stripeSubscriptionId,
        },
      });

      if (error) {
        console.error('Error canceling Stripe subscription:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Stripe subscription canceled successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in cancelStripeSubscription:', error);
      return { success: false, error: 'Failed to cancel Stripe subscription' };
    }
  }
}

export const stripeVIPService = new StripeVIPService();