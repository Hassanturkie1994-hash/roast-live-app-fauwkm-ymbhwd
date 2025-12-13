
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
   * Validate input parameters
   */
  private validateUserId(userId: any): { valid: boolean; error?: string } {
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      return { valid: false, error: 'Invalid user ID' };
    }
    return { valid: true };
  }

  private validateAmount(amount: any): { valid: boolean; error?: string } {
    if (!amount || typeof amount !== 'number' || amount <= 0 || !isFinite(amount)) {
      return { valid: false, error: 'Invalid amount' };
    }
    return { valid: true };
  }

  private validateCurrency(currency: any): { valid: boolean; error?: string } {
    if (!currency || typeof currency !== 'string' || currency.trim() === '') {
      return { valid: false, error: 'Invalid currency' };
    }
    return { valid: true };
  }

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
      const userIdValidation = this.validateUserId(userId);
      if (!userIdValidation.valid) {
        console.error('Invalid userId:', userId);
        return { success: false, error: userIdValidation.error };
      }

      const amountValidation = this.validateAmount(amountCents);
      if (!amountValidation.valid) {
        console.error('Invalid amountCents:', amountCents);
        return { success: false, error: amountValidation.error };
      }

      const currencyValidation = this.validateCurrency(currency);
      if (!currencyValidation.valid) {
        console.error('Invalid currency:', currency);
        return { success: false, error: currencyValidation.error };
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
        console.warn('⚠️ Edge Function error:', error);
        return { success: false, error: error.message || 'Failed to create checkout session' };
      }

      if (!data || !data.sessionId || !data.url) {
        console.warn('⚠️ Invalid response from server:', data);
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
      console.error('❌ Error in createWalletTopUpSession:', error);
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
      const userIdValidation = this.validateUserId(userId);
      if (!userIdValidation.valid) {
        console.error('Invalid userId:', userId);
        return { success: false, error: userIdValidation.error };
      }

      const clubIdValidation = this.validateUserId(clubId);
      if (!clubIdValidation.valid) {
        console.error('Invalid clubId:', clubId);
        return { success: false, error: 'Invalid club ID' };
      }

      const creatorIdValidation = this.validateUserId(creatorId);
      if (!creatorIdValidation.valid) {
        console.error('Invalid creatorId:', creatorId);
        return { success: false, error: 'Invalid creator ID' };
      }

      const priceValidation = this.validateAmount(monthlyPriceCents);
      if (!priceValidation.valid) {
        console.error('Invalid monthlyPriceCents:', monthlyPriceCents);
        return { success: false, error: 'Invalid price' };
      }

      const currencyValidation = this.validateCurrency(currency);
      if (!currencyValidation.valid) {
        console.error('Invalid currency:', currency);
        return { success: false, error: currencyValidation.error };
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
        console.warn('⚠️ Edge Function error:', error);
        return { success: false, error: error.message || 'Failed to create subscription' };
      }

      if (!data || !data.subscriptionId || !data.customerId) {
        console.warn('⚠️ Invalid response from server:', data);
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
      console.error('❌ Error in createClubSubscription:', error);
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
      const subscriptionIdValidation = this.validateUserId(subscriptionId);
      if (!subscriptionIdValidation.valid) {
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
        console.warn('⚠️ Edge Function error:', error);
        return { success: false, error: error.message || 'Failed to cancel subscription' };
      }

      console.log('✅ Subscription canceled successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Error in cancelSubscription:', error);
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
      const userIdValidation = this.validateUserId(userId);
      if (!userIdValidation.valid) {
        console.error('Invalid userId:', userId);
        return { success: false, error: userIdValidation.error };
      }

      console.log('Getting customer portal URL for user:', userId);

      const { data, error } = await supabase.functions.invoke('stripe-customer-portal', {
        body: {
          userId,
        },
      });

      if (error) {
        console.warn('⚠️ Edge Function error:', error);
        return { success: false, error: error.message || 'Failed to get customer portal URL' };
      }

      if (!data || !data.url) {
        console.warn('⚠️ Invalid response from server:', data);
        return { success: false, error: 'Invalid response from server' };
      }

      console.log('✅ Customer portal URL retrieved successfully');
      return { success: true, url: data.url };
    } catch (error) {
      console.error('❌ Error in getCustomerPortalUrl:', error);
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
      const sessionIdValidation = this.validateUserId(sessionId);
      if (!sessionIdValidation.valid) {
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
        console.warn('⚠️ Edge Function error:', error);
        return { success: false, error: error.message || 'Failed to verify payment' };
      }

      if (!data || !data.status) {
        console.warn('⚠️ Invalid response from server:', data);
        return { success: false, error: 'Invalid response from server' };
      }

      console.log('✅ Payment status verified:', data.status);
      return { success: true, status: data.status };
    } catch (error) {
      console.error('❌ Error in verifyPaymentStatus:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify payment status';
      return { success: false, error: errorMessage };
    }
  }
}

export const stripeService = new StripeService();
