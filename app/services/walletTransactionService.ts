
import { supabase } from '@/app/integrations/supabase/client';

export type WalletTransactionType = 'deposit' | 'withdraw' | 'gift_received' | 'gift_sent';

export interface WalletTransaction {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  type: WalletTransactionType;
  created_at: string;
}

/**
 * Create a wallet transaction record
 */
export async function createWalletTransaction(
  userId: string,
  amount: number,
  type: WalletTransactionType,
  currency: string = 'SEK'
): Promise<{ success: boolean; error?: string; data?: WalletTransaction }> {
  try {
    const { data, error } = await supabase
      .from('wallet_transactions')
      .insert({
        user_id: userId,
        amount,
        currency,
        type,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating wallet transaction:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in createWalletTransaction:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Fetch wallet transactions for a user
 */
export async function fetchWalletTransactions(
  userId: string,
  limit: number = 50
): Promise<{ data: WalletTransaction[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return { data, error };
  } catch (error) {
    console.error('Error fetching wallet transactions:', error);
    return { data: null, error };
  }
}

/**
 * Get wallet transaction statistics
 */
export async function getWalletTransactionStats(
  userId: string
): Promise<{
  totalDeposits: number;
  totalWithdrawals: number;
  totalGiftsReceived: number;
  totalGiftsSent: number;
}> {
  try {
    const { data, error } = await supabase
      .from('wallet_transactions')
      .select('amount, type')
      .eq('user_id', userId);

    if (error || !data) {
      return {
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalGiftsReceived: 0,
        totalGiftsSent: 0,
      };
    }

    const stats = data.reduce(
      (acc, transaction) => {
        switch (transaction.type) {
          case 'deposit':
            acc.totalDeposits += transaction.amount;
            break;
          case 'withdraw':
            acc.totalWithdrawals += Math.abs(transaction.amount);
            break;
          case 'gift_received':
            acc.totalGiftsReceived += transaction.amount;
            break;
          case 'gift_sent':
            acc.totalGiftsSent += Math.abs(transaction.amount);
            break;
        }
        return acc;
      },
      {
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalGiftsReceived: 0,
        totalGiftsSent: 0,
      }
    );

    return stats;
  } catch (error) {
    console.error('Error getting wallet transaction stats:', error);
    return {
      totalDeposits: 0,
      totalWithdrawals: 0,
      totalGiftsReceived: 0,
      totalGiftsSent: 0,
    };
  }
}

export const walletTransactionService = {
  createWalletTransaction,
  fetchWalletTransactions,
  getWalletTransactionStats,
};