
import { supabase } from '@/app/integrations/supabase/client';
import { ROAST_GIFT_MANIFEST, RoastGift, RoastGiftTier } from '@/constants/RoastGiftManifest';
import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { RoastGiftEngineModule } = NativeModules;
const roastGiftEventEmitter = RoastGiftEngineModule 
  ? new NativeEventEmitter(RoastGiftEngineModule)
  : null;

export interface RoastGiftTransaction {
  id: string;
  gift_id: string;
  sender_id: string;
  receiver_id: string;
  stream_id: string | null;
  amount_sek: number;
  platform_fee: number;
  creator_payout: number;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

/**
 * Roast Gift Service
 * 
 * Handles all gift-related operations for the new roast gift system.
 * 
 * Features:
 * - Purchase gifts with 30/70 split
 * - Send gifts to native engine for rendering
 * - Track gift transactions
 * - Broadcast gifts via realtime
 */
class RoastGiftService {
  private listeners: Map<string, any> = new Map();

  /**
   * Initialize the native gift engine
   */
  async initialize(): Promise<void> {
    try {
      console.log('🎁 [RoastGiftService] Initializing...');
      
      if (RoastGiftEngineModule) {
        await RoastGiftEngineModule.preloadAssets();
        console.log('✅ [RoastGiftService] Native engine initialized');
      } else {
        console.warn('⚠️ [RoastGiftService] Native module not available');
      }
      
      this.setupEventListeners();
    } catch (error) {
      console.error('❌ [RoastGiftService] Initialization error:', error);
    }
  }

  /**
   * Setup event listeners for native events
   */
  private setupEventListeners(): void {
    if (!roastGiftEventEmitter) return;

    // Listen for gift completion
    const completionListener = roastGiftEventEmitter.addListener(
      'RoastGiftCompleted',
      (event: any) => {
        console.log('✅ [RoastGiftService] Gift completed:', event.giftId);
      }
    );

    // Listen for performance warnings
    const performanceListener = roastGiftEventEmitter.addListener(
      'RoastGiftPerformanceWarning',
      (event: any) => {
        console.warn('⚠️ [RoastGiftService] Performance warning, FPS:', event.fps);
      }
    );

    this.listeners.set('completion', completionListener);
    this.listeners.set('performance', performanceListener);
  }

  /**
   * Get all available gifts
   */
  getAllGifts(): RoastGift[] {
    return ROAST_GIFT_MANIFEST;
  }

  /**
   * Get gift by ID
   */
  getGiftById(giftId: string): RoastGift | undefined {
    return ROAST_GIFT_MANIFEST.find((gift) => gift.giftId === giftId);
  }

  /**
   * Get gifts by tier
   */
  getGiftsByTier(tier: RoastGiftTier): RoastGift[] {
    return ROAST_GIFT_MANIFEST.filter((gift) => gift.tier === tier);
  }

  /**
   * Purchase and send a gift
   * 
   * This handles:
   * 1. Wallet balance check
   * 2. Transaction creation with 30/70 split
   * 3. Wallet updates
   * 4. Native engine notification
   * 5. Realtime broadcast
   */
  async purchaseGift(
    giftId: string,
    senderId: string,
    receiverId: string,
    streamId?: string
  ): Promise<{ success: boolean; error?: string; transaction?: RoastGiftTransaction }> {
    try {
      console.log('🎁 [RoastGiftService] Purchasing gift:', giftId);

      // Get gift details
      const gift = this.getGiftById(giftId);
      if (!gift) {
        return { success: false, error: 'Gift not found' };
      }

      // Check sender wallet balance
      const { data: senderWallet, error: walletError } = await supabase
        .from('wallet')
        .select('balance')
        .eq('user_id', senderId)
        .single();

      if (walletError || !senderWallet) {
        return { success: false, error: 'Wallet not found' };
      }

      const senderBalance = parseFloat(senderWallet.balance);
      if (senderBalance < gift.priceSEK) {
        return { success: false, error: 'Insufficient balance' };
      }

      // Calculate fees (30% platform, 70% creator)
      const platformFee = gift.priceSEK * 0.3;
      const creatorPayout = gift.priceSEK * 0.7;

      // Create transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('roast_gift_transactions')
        .insert({
          gift_id: giftId,
          sender_id: senderId,
          receiver_id: receiverId,
          stream_id: streamId || null,
          amount_sek: gift.priceSEK,
          platform_fee: platformFee,
          creator_payout: creatorPayout,
          status: 'completed',
        })
        .select()
        .single();

      if (transactionError) {
        console.error('❌ [RoastGiftService] Transaction error:', transactionError);
        return { success: false, error: 'Failed to create transaction' };
      }

      // Update sender wallet (deduct full amount)
      const { error: senderUpdateError } = await supabase
        .from('wallet')
        .update({
          balance: senderBalance - gift.priceSEK,
          last_updated: new Date().toISOString(),
        })
        .eq('user_id', senderId);

      if (senderUpdateError) {
        console.error('❌ [RoastGiftService] Sender wallet update error:', senderUpdateError);
        return { success: false, error: 'Failed to update sender wallet' };
      }

      // Update receiver wallet (add creator payout only)
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
          balance: receiverBalance + creatorPayout,
          last_updated: new Date().toISOString(),
        });

      if (receiverUpdateError) {
        console.error('❌ [RoastGiftService] Receiver wallet update error:', receiverUpdateError);
        // Rollback sender wallet
        await supabase
          .from('wallet')
          .update({
            balance: senderBalance,
            last_updated: new Date().toISOString(),
          })
          .eq('user_id', senderId);
        return { success: false, error: 'Failed to update receiver wallet' };
      }

      // Get sender info for broadcast
      const { data: senderInfo } = await supabase
        .from('profiles')
        .select('username, display_name')
        .eq('id', senderId)
        .single();

      const senderName = senderInfo?.display_name || senderInfo?.username || 'Anonymous';

      // Send to native engine
      if (RoastGiftEngineModule) {
        RoastGiftEngineModule.addGift({
          giftId: gift.giftId,
          senderId,
          senderName,
          receiverId,
          priceSEK: gift.priceSEK,
          tier: gift.tier,
          animationType: gift.animationType,
          soundProfile: gift.soundProfile,
          priority: gift.priority,
        });
      }

      // Broadcast via realtime
      if (streamId) {
        await this.broadcastGift(streamId, {
          giftId: gift.giftId,
          displayName: gift.displayName,
          emoji: gift.emoji,
          senderName,
          priceSEK: gift.priceSEK,
          tier: gift.tier,
          animationType: gift.animationType,
        });
      }

      console.log('✅ [RoastGiftService] Gift purchased successfully');
      return { success: true, transaction };
    } catch (error: any) {
      console.error('❌ [RoastGiftService] Purchase error:', error);
      return { success: false, error: error?.message || 'An unexpected error occurred' };
    }
  }

  /**
   * Broadcast gift to all viewers via realtime
   */
  private async broadcastGift(streamId: string, giftData: any): Promise<void> {
    try {
      const channel = supabase.channel(`stream:${streamId}:roast_gifts`);
      
      await channel.send({
        type: 'broadcast',
        event: 'roast_gift_sent',
        payload: giftData,
      });

      console.log('✅ [RoastGiftService] Gift broadcasted');
    } catch (error) {
      console.error('❌ [RoastGiftService] Broadcast error:', error);
    }
  }

  /**
   * Subscribe to gift events for a stream
   */
  subscribeToGifts(
    streamId: string,
    onGiftReceived: (giftData: any) => void
  ): () => void {
    const channel = supabase
      .channel(`stream:${streamId}:roast_gifts`)
      .on('broadcast', { event: 'roast_gift_sent' }, (payload) => {
        console.log('🎁 [RoastGiftService] Gift received:', payload);
        onGiftReceived(payload.payload);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * Get current FPS from native engine
   */
  async getCurrentFPS(): Promise<number> {
    if (!RoastGiftEngineModule) return 60;
    
    try {
      return await RoastGiftEngineModule.getCurrentFPS();
    } catch (error) {
      console.error('❌ [RoastGiftService] FPS error:', error);
      return 60;
    }
  }

  /**
   * Get queue length from native engine
   */
  async getQueueLength(): Promise<number> {
    if (!RoastGiftEngineModule) return 0;
    
    try {
      return await RoastGiftEngineModule.getQueueLength();
    } catch (error) {
      console.error('❌ [RoastGiftService] Queue length error:', error);
      return 0;
    }
  }

  /**
   * Clear gift queue
   */
  async clearQueue(): Promise<void> {
    if (!RoastGiftEngineModule) return;
    
    try {
      await RoastGiftEngineModule.clearQueue();
      console.log('✅ [RoastGiftService] Queue cleared');
    } catch (error) {
      console.error('❌ [RoastGiftService] Clear queue error:', error);
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.listeners.forEach((listener) => {
      if (listener && listener.remove) {
        listener.remove();
      }
    });
    this.listeners.clear();
    console.log('🗑️ [RoastGiftService] Destroyed');
  }
}

export const roastGiftService = new RoastGiftService();
