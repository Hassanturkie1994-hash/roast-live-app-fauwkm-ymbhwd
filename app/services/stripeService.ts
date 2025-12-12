
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
      // Validate inputs
      if (!userId || typeof userId !== 'string') {
        console.error('Invalid userId:', userId);
        return { success: false, error: 'Invalid user ID' };
      }

      if (!amountCents || typeof amountCents !== 'number' || amountCents <= 0) {
        console.error('Invalid amountCents:', amountCents);
        return { success: false, error: 'Invalid amount' };
      }

      if (!currency || typeof currency !== 'string') {
        console.error('Invalid currency:', currency);
        return { success: false, error: 'Invalid currency' };
      }

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
        return { success: false, error: error.message || 'Failed to create checkout session' };
      }

      if (!data || !data.sessionId || !data.url) {
        console.error('Invalid response from server:', data);
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to create checkout session';
      return { success: false, error: errorMessage };
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
      // Validate inputs
      if (!userId || typeof userId !== 'string') {
        console.error('Invalid userId:', userId);
        return { success: false, error: 'Invalid user ID' };
      }

      if (!clubId || typeof clubId !== 'string') {
        console.error('Invalid clubId:', clubId);
        return { success: false, error: 'Invalid club ID' };
      }

      if (!creatorId || typeof creatorId !== 'string') {
        console.error('Invalid creatorId:', creatorId);
        return { success: false, error: 'Invalid creator ID' };
      }

      if (!monthlyPriceCents || typeof monthlyPriceCents !== 'number' || monthlyPriceCents <= 0) {
        console.error('Invalid monthlyPriceCents:', monthlyPriceCents);
        return { success: false, error: 'Invalid price' };
      }

      if (!currency || typeof currency !== 'string') {
        console.error('Invalid currency:', currency);
        return { success: false, error: 'Invalid currency' };
      }

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
        return { success: false, error: error.message || 'Failed to create subscription' };
      }

      if (!data || !data.subscriptionId || !data.customerId) {
        console.error('Invalid response from server:', data);
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to create subscription';
      return { success: false, error: errorMessage };
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
      // Validate inputs
      if (!subscriptionId || typeof subscriptionId !== 'string') {
        console.error('Invalid subscriptionId:', subscriptionId);
        return { success: false, error: 'Invalid subscription ID' };
      }

      console.log('Canceling subscription:', { subscriptionId, immediate });

      const { data, error } = await supabase.functions.invoke('stripe-cancel-subscription', {
        body: {
          subscriptionId,
          immediate,
        },
      });

      if (error) {
        console.error('Error canceling subscription:', error);
        return { success: false, error: error.message || 'Failed to cancel subscription' };
      }

      console.log('✅ Subscription canceled successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in cancelSubscription:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel subscription';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get Stripe Customer Portal URL
   */
  async getCustomerPortalUrl(
    userId: string
  ): Promise<{ success: boolean; error?: string; url?: string }> {
    try {
      // Validate inputs
      if (!userId || typeof userId !== 'string') {
        console.error('Invalid userId:', userId);
        return { success: false, error: 'Invalid user ID' };
      }

      console.log('Getting customer portal URL for user:', userId);

      const { data, error } = await supabase.functions.invoke('stripe-customer-portal', {
        body: {
          userId,
        },
      });

      if (error) {
        console.error('Error getting customer portal URL:', error);
        return { success: false, error: error.message || 'Failed to get customer portal URL' };
      }

      if (!data || !data.url) {
        console.error('Invalid response from server:', data);
        return { success: false, error: 'Invalid response from server' };
      }

      console.log('✅ Customer portal URL retrieved successfully');
      return { success: true, url: data.url };
    } catch (error) {
      console.error('Error in getCustomerPortalUrl:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to get customer portal URL';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Verify payment status
   */
  async verifyPaymentStatus(
    sessionId: string
  ): Promise<{ success: boolean; error?: string; status?: string }> {
    try {
      // Validate inputs
      if (!sessionId || typeof sessionId !== 'string') {
        console.error('Invalid sessionId:', sessionId);
        return { success: false, error: 'Invalid session ID' };
      }

      console.log('Verifying payment status:', sessionId);

      const { data, error } = await supabase.functions.invoke('stripe-verify-payment', {
        body: {
          sessionId,
        },
      });

      if (error) {
        console.error('Error verifying payment:', error);
        return { success: false, error: error.message || 'Failed to verify payment' };
      }

      if (!data || !data.status) {
        console.error('Invalid response from server:', data);
        return { success: false, error: 'Invalid response from server' };
      }

      console.log('✅ Payment status verified:', data.status);
      return { success: true, status: data.status };
    } catch (error) {
      console.error('Error in verifyPaymentStatus:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify payment status';
      return { success: false, error: errorMessage };
    }
  }
}

export const stripeService = new StripeService();
