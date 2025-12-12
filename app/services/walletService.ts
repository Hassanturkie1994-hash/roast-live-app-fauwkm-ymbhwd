
import { supabase } from '@/app/integrations/supabase/client';

export interface Wallet {
  id: string;
  user_id: string;
  balance_cents: number;
  lifetime_earned_cents: number;
  lifetime_spent_cents: number;
  updated_at: string;
  created_at: string;
}

export interface WalletTransactionV2 {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdraw' | 'gift_sent' | 'gift_received' | 'subscription_payment' | 'platform_fee' | 'adjustment';
  amount_cents: number;
  currency: string;
  related_user_id: string | null;
  stream_id: string | null;
  club_id: string | null;
  metadata: any;
  created_at: string;
}

class WalletService {
  /**
   * Get or create wallet for user
   */
  async getOrCreateWallet(userId: string): Promise<Wallet | null> {
    try {
      // Try to get existing wallet
      const { data: existing, error: fetchError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (existing) {
        return existing as Wallet;
      }

      // Create new wallet if doesn't exist
      if (fetchError && fetchError.code === 'PGRST116') {
        const { data: newWallet, error: createError } = await supabase
          .from('wallets')
          .insert({
            user_id: userId,
            balance_cents: 0,
            lifetime_earned_cents: 0,
            lifetime_spent_cents: 0,
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating wallet:', createError);
          return null;
        }

        return newWallet as Wallet;
      }

      console.error('Error fetching wallet:', fetchError);
      return null;
    } catch (error) {
      console.error('Error in getOrCreateWallet:', error);
      return null;
    }
  }

  /**
   * Get wallet balance
   */
  async getBalance(userId: string): Promise<number> {
    try {
      const wallet = await this.getOrCreateWallet(userId);
      return wallet ? wallet.balance_cents : 0;
    } catch (error) {
      console.error('Error in getBalance:', error);
      return 0;
    }
  }

  /**
   * Add funds to wallet
   */
  async addFunds(
    userId: string,
    amountCents: number,
    metadata?: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const wallet = await this.getOrCreateWallet(userId);
      if (!wallet) {
        return { success: false, error: 'Failed to get wallet' };
      }

      // Update wallet balance
      const { error: updateError } = await supabase
        .from('wallets')
        .update({
          balance_cents: wallet.balance_cents + amountCents,
          lifetime_earned_cents: wallet.lifetime_earned_cents + amountCents,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error updating wallet:', updateError);
        return { success: false, error: updateError.message };
      }

      // Create transaction record
      await this.createTransaction(userId, 'deposit', amountCents, {
        metadata,
      });

      console.log('✅ Funds added successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in addFunds:', error);
      return { success: false, error: 'Failed to add funds' };
    }
  }

  /**
   * Withdraw funds from wallet
   */
  async withdrawFunds(
    userId: string,
    amountCents: number,
    metadata?: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const wallet = await this.getOrCreateWallet(userId);
      if (!wallet) {
        return { success: false, error: 'Failed to get wallet' };
      }

      if (wallet.balance_cents < amountCents) {
        return { success: false, error: 'Insufficient balance' };
      }

      // Update wallet balance
      const { error: updateError } = await supabase
        .from('wallets')
        .update({
          balance_cents: wallet.balance_cents - amountCents,
          lifetime_spent_cents: wallet.lifetime_spent_cents + amountCents,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error updating wallet:', updateError);
        return { success: false, error: updateError.message };
      }

      // Create transaction record
      await this.createTransaction(userId, 'withdraw', -amountCents, {
        metadata,
      });

      console.log('✅ Funds withdrawn successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in withdrawFunds:', error);
      return { success: false, error: 'Failed to withdraw funds' };
    }
  }

  /**
   * Process subscription payment
   */
  async processSubscriptionPayment(
    memberId: string,
    creatorId: string,
    clubId: string,
    amountCents: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Deduct from member's wallet
      const memberWallet = await this.getOrCreateWallet(memberId);
      if (!memberWallet) {
        return { success: false, error: 'Failed to get member wallet' };
      }

      if (memberWallet.balance_cents < amountCents) {
        return { success: false, error: 'Insufficient balance' };
      }

      // Calculate platform fee (30%)
      const platformFeeCents = Math.floor(amountCents * 0.3);
      const creatorEarningsCents = amountCents - platformFeeCents;

      // Update member wallet
      const { error: memberError } = await supabase
        .from('wallets')
        .update({
          balance_cents: memberWallet.balance_cents - amountCents,
          lifetime_spent_cents: memberWallet.lifetime_spent_cents + amountCents,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', memberId);

      if (memberError) {
        console.error('Error updating member wallet:', memberError);
        return { success: false, error: memberError.message };
      }

      // Update creator wallet
      const creatorWallet = await this.getOrCreateWallet(creatorId);
      if (creatorWallet) {
        await supabase
          .from('wallets')
          .update({
            balance_cents: creatorWallet.balance_cents + creatorEarningsCents,
            lifetime_earned_cents: creatorWallet.lifetime_earned_cents + creatorEarningsCents,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', creatorId);
      }

      // Create transaction records
      await this.createTransaction(memberId, 'subscription_payment', -amountCents, {
        related_user_id: creatorId,
        club_id: clubId,
      });

      await this.createTransaction(creatorId, 'subscription_payment', creatorEarningsCents, {
        related_user_id: memberId,
        club_id: clubId,
      });

      await this.createTransaction(creatorId, 'platform_fee', -platformFeeCents, {
        club_id: clubId,
        metadata: { original_amount: amountCents },
      });

      console.log('✅ Subscription payment processed successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in processSubscriptionPayment:', error);
      return { success: false, error: 'Failed to process subscription payment' };
    }
  }

  /**
   * Create transaction record
   */
  async createTransaction(
    userId: string,
    type: WalletTransactionV2['type'],
    amountCents: number,
    options?: {
      related_user_id?: string;
      stream_id?: string;
      club_id?: string;
      metadata?: any;
      currency?: string;
    }
  ): Promise<{ success: boolean; error?: string; data?: WalletTransactionV2 }> {
    try {
      const { data, error } = await supabase
        .from('wallet_transactions_v2')
        .insert({
          user_id: userId,
          type,
          amount_cents: amountCents,
          currency: options?.currency || 'SEK',
          related_user_id: options?.related_user_id || null,
          stream_id: options?.stream_id || null,
          club_id: options?.club_id || null,
          metadata: options?.metadata || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating transaction:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data as WalletTransactionV2 };
    } catch (error) {
      console.error('Error in createTransaction:', error);
      return { success: false, error: 'Failed to create transaction' };
    }
  }

  /**
   * Get user transactions
   */
  async getTransactions(
    userId: string,
    limit: number = 50
  ): Promise<WalletTransactionV2[]> {
    try {
      const { data, error } = await supabase
        .from('wallet_transactions_v2')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching transactions:', error);
        return [];
      }

      return data as WalletTransactionV2[];
    } catch (error) {
      console.error('Error in getTransactions:', error);
      return [];
    }
  }

  /**
   * Get transaction statistics
   */
  async getTransactionStats(userId: string): Promise<{
    totalDeposits: number;
    totalWithdrawals: number;
    totalGiftsReceived: number;
    totalGiftsSent: number;
    totalSubscriptionPayments: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('wallet_transactions_v2')
        .select('amount_cents, type')
        .eq('user_id', userId);

      if (error || !data) {
        return {
          totalDeposits: 0,
          totalWithdrawals: 0,
          totalGiftsReceived: 0,
          totalGiftsSent: 0,
          totalSubscriptionPayments: 0,
        };
      }

      const stats = data.reduce(
        (acc, transaction) => {
          const amount = Math.abs(transaction.amount_cents);
          switch (transaction.type) {
            case 'deposit':
              acc.totalDeposits += amount;
              break;
            case 'withdraw':
              acc.totalWithdrawals += amount;
              break;
            case 'gift_received':
              acc.totalGiftsReceived += amount;
              break;
            case 'gift_sent':
              acc.totalGiftsSent += amount;
              break;
            case 'subscription_payment':
              if (transaction.amount_cents > 0) {
                acc.totalSubscriptionPayments += amount;
              }
              break;
          }
          return acc;
        },
        {
          totalDeposits: 0,
          totalWithdrawals: 0,
          totalGiftsReceived: 0,
          totalGiftsSent: 0,
          totalSubscriptionPayments: 0,
        }
      );

      return stats;
    } catch (error) {
      console.error('Error in getTransactionStats:', error);
      return {
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalGiftsReceived: 0,
        totalGiftsSent: 0,
        totalSubscriptionPayments: 0,
      };
    }
  }
}

export const walletService = new WalletService();