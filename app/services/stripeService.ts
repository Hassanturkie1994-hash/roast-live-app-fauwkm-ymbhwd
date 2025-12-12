
import { supabase } from '@/app/integrations/supabase/client';

export interface StripeCheckoutSession {
  sessionId: string;
  url: string;
}

export interface StripeSubscription {
  subscriptionId: string;
  customerId: string;
  status: string;
}

class StripeService {
  /**
   * Create Stripe Checkout Session for wallet top-up
   */
  async createWalletTopUpSession(
    userId: string,
    amountCents: number,
    currency: string = 'SEK'
  ): Promise<{ success: boolean; error?: string; data?: StripeCheckoutSession }> {
    try {
      console.log('Creating wallet top-up session:', { userId, amountCents, currency });

      const { data, error } = await supabase.functions.invoke('stripe-create-checkout', {
        body: {
          type: 'wallet_topup',
          userId,
          amountCents,
          currency,
        },
      });

      if (error) {
        console.error('Error creating checkout session:', error);
        return { success: false, error: error.message };
      }

      if (!data || !data.sessionId || !data.url) {
        return { success: false, error: 'Invalid response from server' };
      }

      console.log('✅ Checkout session created successfully');
      return {
        success: true,
        data: {
          sessionId: data.sessionId,
          url: data.url,
        },
      };
    } catch (error) {
      console.error('Error in createWalletTopUpSession:', error);
      return { success: false, error: 'Failed to create checkout session' };
    }
  }

  /**
   * Create Stripe Subscription for creator club
   */
  async createClubSubscription(
    userId: string,
    clubId: string,
    creatorId: string,
    monthlyPriceCents: number,
    currency: string = 'SEK'
  ): Promise<{ success: boolean; error?: string; data?: StripeSubscription }> {
    try {
      console.log('Creating club subscription:', {
        userId,
        clubId,
        creatorId,
        monthlyPriceCents,
        currency,
      });

      const { data, error } = await supabase.functions.invoke('stripe-create-subscription', {
        body: {
          userId,
          clubId,
          creatorId,
          monthlyPriceCents,
          currency,
        },
      });

      if (error) {
        console.error('Error creating subscription:', error);
        return { success: false, error: error.message };
      }

      if (!data || !data.subscriptionId || !data.customerId) {
        return { success: false, error: 'Invalid response from server' };
      }

      console.log('✅ Subscription created successfully');
      return {
        success: true,
        data: {
          subscriptionId: data.subscriptionId,
          customerId: data.customerId,
          status: data.status,
        },
      };
    } catch (error) {
      console.error('Error in createClubSubscription:', error);
      return { success: false, error: 'Failed to create subscription' };
    }
  }

  /**
   * Cancel Stripe Subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    immediate: boolean = false
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Canceling subscription:', { subscriptionId, immediate });

      const { data, error } = await supabase.functions.invoke('stripe-cancel-subscription', {
        body: {
          subscriptionId,
          immediate,
        },
      });

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
   * Get Stripe Customer Portal URL
   */
  async getCustomerPortalUrl(
    userId: string
  ): Promise<{ success: boolean; error?: string; url?: string }> {
    try {
      console.log('Getting customer portal URL for user:', userId);

      const { data, error } = await supabase.functions.invoke('stripe-customer-portal', {
        body: {
          userId,
        },
      });

      if (error) {
        console.error('Error getting customer portal URL:', error);
        return { success: false, error: error.message };
      }

      if (!data || !data.url) {
        return { success: false, error: 'Invalid response from server' };
      }

      console.log('✅ Customer portal URL retrieved successfully');
      return { success: true, url: data.url };
    } catch (error) {
      console.error('Error in getCustomerPortalUrl:', error);
      return { success: false, error: 'Failed to get customer portal URL' };
    }
  }

  /**
   * Verify payment status
   */
  async verifyPaymentStatus(
    sessionId: string
  ): Promise<{ success: boolean; error?: string; status?: string }> {
    try {
      console.log('Verifying payment status:', sessionId);

      const { data, error } = await supabase.functions.invoke('stripe-verify-payment', {
        body: {
          sessionId,
        },
      });

      if (error) {
        console.error('Error verifying payment:', error);
        return { success: false, error: error.message };
      }

      if (!data || !data.status) {
        return { success: false, error: 'Invalid response from server' };
      }

      console.log('✅ Payment status verified:', data.status);
      return { success: true, status: data.status };
    } catch (error) {
      console.error('Error in verifyPaymentStatus:', error);
      return { success: false, error: 'Failed to verify payment status' };
    }
  }
}

export const stripeService = new StripeService();