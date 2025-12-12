
import { supabase } from '@/app/integrations/supabase/client';
import { walletTransactionService } from './walletTransactionService';

export interface GiftTransaction {
  id: string;
  sender_id: string;
  receiver_id: string;
  gift_id: string;
  stream_id: string | null;
  amount: number;
  created_at: string;
}

/**
 * Create a gift transaction and update wallet balances
 */
export async function createGiftTransaction(
  senderId: string,
  receiverId: string,
  giftId: string,
  amount: number,
  streamId?: string
): Promise<{ success: boolean; error?: string; data?: GiftTransaction }> {
  try {
    // Check sender's wallet balance
    const { data: senderWallet, error: walletError } = await supabase
      .from('wallet')
      .select('balance')
      .eq('user_id', senderId)
      .single();

    if (walletError || !senderWallet) {
      return { success: false, error: 'Wallet not found' };
    }

    const senderBalance = parseFloat(senderWallet.balance);
    if (senderBalance < amount) {
      return { success: false, error: 'Insufficient balance' };
    }

    // Create gift transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('gift_transactions')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        gift_id: giftId,
        stream_id: streamId || null,
        amount,
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Error creating gift transaction:', transactionError);
      return { success: false, error: transactionError.message };
    }

    // Update sender's wallet (deduct amount)
    const { error: senderUpdateError } = await supabase
      .from('wallet')
      .update({
        balance: senderBalance - amount,
        last_updated: new Date().toISOString(),
      })
      .eq('user_id', senderId);

    if (senderUpdateError) {
      console.error('Error updating sender wallet:', senderUpdateError);
      return { success: false, error: 'Failed to update sender wallet' };
    }

    // Update receiver's wallet (add amount)
    const { data: receiverWallet } = await supabase
      .from('wallet')
      .select('balance')
      .eq('user_id', receiverId)
      .single();

    const receiverBalance = receiverWallet ? parseFloat(receiverWallet.balance) : 0;

    const { error: receiverUpdateError } = await supabase
      .from('wallet')
      .upsert({
        user_id: receiverId,
        balance: receiverBalance + amount,
        last_updated: new Date().toISOString(),
      });

    if (receiverUpdateError) {
      console.error('Error updating receiver wallet:', receiverUpdateError);
      // Rollback sender wallet update
      await supabase
        .from('wallet')
        .update({
          balance: senderBalance,
          last_updated: new Date().toISOString(),
        })
        .eq('user_id', senderId);
      return { success: false, error: 'Failed to update receiver wallet' };
    }

    // Create wallet transaction records
    await walletTransactionService.createWalletTransaction(senderId, -amount, 'gift_sent');
    await walletTransactionService.createWalletTransaction(receiverId, amount, 'gift_received');

    return { success: true, data: transaction };
  } catch (error) {
    console.error('Error in createGiftTransaction:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Fetch gift transactions for a user
 */
export async function fetchGiftTransactions(
  userId: string,
  type: 'sent' | 'received' | 'all' = 'all',
  limit: number = 50
): Promise<{ data: any[] | null; error: any }> {
  try {
    let query = supabase
      .from('gift_transactions')
      .select(`
        *,
        gift:gifts(name, emoji_icon, price_sek),
        sender:sender_id(username, display_name, avatar_url),
        receiver:receiver_id(username, display_name, avatar_url),
        stream:stream_id(title)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (type === 'sent') {
      query = query.eq('sender_id', userId);
    } else if (type === 'received') {
      query = query.eq('receiver_id', userId);
    } else {
      query = query.or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
    }

    const { data, error } = await query;

    return { data, error };
  } catch (error) {
    console.error('Error fetching gift transactions:', error);
    return { data: null, error };
  }
}

/**
 * Get gift transaction statistics
 */
export async function getGiftTransactionStats(
  userId: string
): Promise<{
  totalSent: number;
  totalReceived: number;
  giftsSentCount: number;
  giftsReceivedCount: number;
}> {
  try {
    const [sentData, receivedData] = await Promise.all([
      supabase
        .from('gift_transactions')
        .select('amount')
        .eq('sender_id', userId),
      supabase
        .from('gift_transactions')
        .select('amount')
        .eq('receiver_id', userId),
    ]);

    const totalSent = sentData.data?.reduce((sum, t) => sum + t.amount, 0) || 0;
    const totalReceived = receivedData.data?.reduce((sum, t) => sum + t.amount, 0) || 0;

    return {
      totalSent,
      totalReceived,
      giftsSentCount: sentData.data?.length || 0,
      giftsReceivedCount: receivedData.data?.length || 0,
    };
  } catch (error) {
    console.error('Error getting gift transaction stats:', error);
    return {
      totalSent: 0,
      totalReceived: 0,
      giftsSentCount: 0,
      giftsReceivedCount: 0,
    };
  }
}

export const giftTransactionService = {
  createGiftTransaction,
  fetchGiftTransactions,
  getGiftTransactionStats,
};