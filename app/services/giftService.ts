
import { supabase } from '@/app/integrations/supabase/client';
import { pushNotificationService } from '@/app/services/pushNotificationService';
import { analyticsService } from './analyticsService';

export type GiftTier = 'A' | 'B' | 'C';

export interface Gift {
  id: string;
  name: string;
  description: string;
  price_sek: number;
  emoji_icon: string;
  tier: GiftTier;
  icon_url: string | null;
  animation_url: string | null;
  usage_count?: number;
  created_at?: string;
}

export interface GiftEvent {
  id: string;
  sender_user_id: string;
  receiver_user_id: string;
  gift_id: string;
  price_sek: number;
  livestream_id?: string;
  session_id?: string;
  animation_reference?: string;
  currency: string;
  created_at: string;
}

// Cache for gifts data
let giftsCache: { data: Gift[] | null; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Pending request to prevent duplicate queries
let pendingGiftsRequest: Promise<{ data: Gift[] | null; error: any }> | null = null;

/**
 * Fetch all available gifts with caching
 */
export async function fetchGifts(): Promise<{ data: Gift[] | null; error: any }> {
  try {
    // Check cache first
    if (giftsCache && Date.now() - giftsCache.timestamp < CACHE_DURATION) {
      console.log('✅ Returning cached gifts data');
      return { data: giftsCache.data, error: null };
    }

    // If there's already a pending request, return it
    if (pendingGiftsRequest) {
      console.log('⏳ Returning pending gifts request');
      return pendingGiftsRequest;
    }

    // Create new request
    console.log('🔄 Fetching gifts from database');
    pendingGiftsRequest = (async () => {
      const { data, error } = await supabase
        .from('gifts')
        .select('*')
        .order('price_sek', { ascending: true });

      // Update cache
      if (!error && data) {
        giftsCache = {
          data,
          timestamp: Date.now(),
        };
      }

      // Clear pending request
      pendingGiftsRequest = null;

      return { data, error };
    })();

    return pendingGiftsRequest;
  } catch (error) {
    console.error('Error fetching gifts:', error);
    pendingGiftsRequest = null;
    return { data: null, error };
  }
}

/**
 * Clear gifts cache (call this when gifts are updated)
 */
export function clearGiftsCache(): void {
  giftsCache = null;
  console.log('🗑️ Gifts cache cleared');
}

/**
 * Purchase a gift for another user during a livestream
 * This will:
 * 1. Check if sender has sufficient balance
 * 2. Deduct the cost from sender's wallet
 * 3. Add the amount to receiver's wallet
 * 4. Create transaction records for both users
 * 5. Create a gift event record with session_id and animation_reference
 * 6. Broadcast the gift event to all viewers
 * 7. Send push notification to receiver
 */
export async function purchaseGift(
  giftId: string,
  senderId: string,
  receiverId: string,
  livestreamId?: string
): Promise<{ success: boolean; error?: string; giftEvent?: any }> {
  try {
    // Fetch gift details
    const { data: gift, error: giftError } = await supabase
      .from('gifts')
      .select('*')
      .eq('id', giftId)
      .single();

    if (giftError || !gift) {
      return { success: false, error: 'Gift not found' };
    }

    // Fetch sender's wallet balance
    const { data: senderWallet, error: senderWalletError } = await supabase
      .from('wallet')
      .select('balance')
      .eq('user_id', senderId)
      .single();

    if (senderWalletError || !senderWallet) {
      return { success: false, error: 'Wallet not found' };
    }

    const senderBalance = parseFloat(senderWallet.balance);
    const giftPrice = gift.price_sek;

    // Check if sender has sufficient balance
    if (senderBalance < giftPrice) {
      return { success: false, error: 'Insufficient balance' };
    }

    // Fetch receiver's wallet (or create if doesn't exist)
    let { data: receiverWallet, error: receiverWalletError } = await supabase
      .from('wallet')
      .select('balance')
      .eq('user_id', receiverId)
      .single();

    if (receiverWalletError || !receiverWallet) {
      // Create wallet for receiver if it doesn't exist
      const { data: newWallet, error: createError } = await supabase
        .from('wallet')
        .insert({ user_id: receiverId, balance: 0 })
        .select('balance')
        .single();

      if (createError || !newWallet) {
        return { success: false, error: 'Failed to create receiver wallet' };
      }
      receiverWallet = newWallet;
    }

    const receiverBalance = parseFloat(receiverWallet.balance);

    // Deduct from sender's wallet
    const { error: updateSenderWalletError } = await supabase
      .from('wallet')
      .update({
        balance: senderBalance - giftPrice,
        last_updated: new Date().toISOString(),
      })
      .eq('user_id', senderId);

    if (updateSenderWalletError) {
      console.error('Error updating sender wallet:', updateSenderWalletError);
      return { success: false, error: 'Failed to update sender wallet' };
    }

    // Add to receiver's wallet
    const { error: updateReceiverWalletError } = await supabase
      .from('wallet')
      .update({
        balance: receiverBalance + giftPrice,
        last_updated: new Date().toISOString(),
      })
      .eq('user_id', receiverId);

    if (updateReceiverWalletError) {
      console.error('Error updating receiver wallet:', updateReceiverWalletError);
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

    // Create transaction record for sender (deduction)
    const { error: senderTransactionError } = await supabase.from('transactions').insert({
      user_id: senderId,
      amount: -giftPrice,
      type: 'gift_purchase',
      payment_method: 'wallet',
      source: 'gift_purchase',
      status: 'completed',
    });

    if (senderTransactionError) {
      console.error('Error creating sender transaction:', senderTransactionError);
    }

    // Create transaction record for receiver (addition)
    const { error: receiverTransactionError } = await supabase.from('transactions').insert({
      user_id: receiverId,
      amount: giftPrice,
      type: 'creator_tip',
      payment_method: 'wallet',
      source: 'gift_purchase',
      status: 'completed',
    });

    if (receiverTransactionError) {
      console.error('Error creating receiver transaction:', receiverTransactionError);
    }

    // Fetch sender info for the gift event
    const { data: senderInfo } = await supabase
      .from('profiles')
      .select('username, display_name')
      .eq('id', senderId)
      .single();

    // Generate session_id and animation_reference
    const sessionId = livestreamId || `gift_${Date.now()}`;
    const animationReference = `${gift.tier}_${gift.emoji_icon}_${Date.now()}`;

    // Create gift event record
    const { data: giftEventData, error: giftEventError } = await supabase
      .from('gift_events')
      .insert({
        sender_user_id: senderId,
        receiver_user_id: receiverId,
        gift_id: giftId,
        price_sek: giftPrice,
        livestream_id: livestreamId,
        session_id: sessionId,
        animation_reference: animationReference,
        currency: 'SEK',
      })
      .select('*')
      .single();

    if (giftEventError) {
      console.error('Error creating gift event:', giftEventError);
      return { success: false, error: 'Failed to record gift event' };
    }

    // Increment gift usage count
    const { error: usageError } = await supabase
      .from('gifts')
      .update({ usage_count: (gift.usage_count || 0) + 1 })
      .eq('id', giftId);

    if (usageError) {
      console.error('Error incrementing gift usage:', usageError);
    }

    // Send push notification to receiver for high-value gifts (50 kr+)
    const senderName = senderInfo?.display_name || senderInfo?.username || 'Someone';
    await pushNotificationService.sendGiftReceivedNotification(
      receiverId,
      senderName,
      gift.name,
      giftPrice,
      giftId
    );

    // Track gift in analytics if it's during a livestream
    if (livestreamId) {
      await analyticsService.updateViewerGiftAmount(livestreamId, senderId, giftPrice);
    }

    // Return gift event with additional info for broadcasting
    const giftEventWithInfo = {
      ...giftEventData,
      gift,
      sender_username: senderInfo?.display_name || senderInfo?.username || 'Anonymous',
    };

    return { success: true, giftEvent: giftEventWithInfo };
  } catch (error) {
    console.error('Error in purchaseGift:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Fetch gift events for a user (sent or received) with caching
 */
const giftEventsCache: Map<string, { data: any[] | null; timestamp: number }> = new Map();

export async function fetchGiftEvents(
  userId: string,
  type: 'sent' | 'received'
): Promise<{ data: any[] | null; error: any }> {
  try {
    const cacheKey = `${userId}_${type}`;
    
    // Check cache first
    const cached = giftEventsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('✅ Returning cached gift events data');
      return { data: cached.data, error: null };
    }

    const column = type === 'sent' ? 'sender_user_id' : 'receiver_user_id';
    
    const { data, error } = await supabase
      .from('gift_events')
      .select(`
        *,
        gift:gifts(*),
        sender:sender_user_id(username, display_name, avatar_url),
        receiver:receiver_user_id(username, display_name, avatar_url)
      `)
      .eq(column, userId)
      .order('created_at', { ascending: false })
      .limit(50); // Limit to 50 most recent events

    // Update cache
    if (!error && data) {
      giftEventsCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });
    }

    return { data, error };
  } catch (error) {
    console.error('Error fetching gift events:', error);
    return { data: null, error };
  }
}

/**
 * Clear gift events cache for a user
 */
export function clearGiftEventsCache(userId: string): void {
  giftEventsCache.delete(`${userId}_sent`);
  giftEventsCache.delete(`${userId}_received`);
  console.log('🗑️ Gift events cache cleared for user:', userId);
}

/**
 * Get gift tier based on price
 */
export function getGiftTier(price: number): GiftTier {
  if (price < 20) return 'A';
  if (price < 600) return 'B';
  return 'C';
}

/**
 * Get animation duration based on tier
 */
export function getAnimationDuration(tier: GiftTier): number {
  switch (tier) {
    case 'A':
      return 1000; // 1 second
    case 'B':
      return 1500; // 1.5 seconds
    case 'C':
      return 2000; // 2 seconds
    default:
      return 1000;
  }
}

/**
 * Increment gift usage count
 */
export async function incrementGiftUsage(giftId: string): Promise<void> {
  try {
    await supabase.rpc('increment_gift_usage', { gift_id: giftId });
  } catch (error) {
    console.error('Error incrementing gift usage:', error);
  }
}