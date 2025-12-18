
/**
 * Roast Gift Service
 * 
 * Integrates gift transactions with sound engine, battle behaviors, ranking system, and VIP levels.
 * 
 * NEW: VIP Level Integration
 * - Automatically updates VIP levels after confirmed gifts
 * - Detects self-gifting (logged, not enforced)
 * - Detects VIP farming (logged, not enforced)
 */

import { supabase } from '@/app/integrations/supabase/client';
import { giftSoundEngine } from '@/services/giftSoundEngine';
import { battleGiftService } from '@/services/battleGiftService';
import { roastRankingService } from '@/services/roastRankingService';
import { vipLevelService } from './vipLevelService';
import { getRoastGiftById } from '@/constants/RoastGiftManifest';

export interface RoastGiftTransaction {
  id: string;
  gift_id: string;
  price_sek: number;
  sender_id: string;
  creator_id: string;
  stream_id: string | null;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  created_at: string;
}

class RoastGiftService {
  private initialized = false;
  private giftChannels: Map<string, any> = new Map();

  /**
   * Initialize the service
   */
  public initialize(): void {
    if (this.initialized) return;
    
    console.log('🎁 [RoastGiftService] Initializing...');
    this.initialized = true;
  }

  /**
   * Destroy the service
   */
  public destroy(): void {
    console.log('🎁 [RoastGiftService] Destroying...');
    
    // Unsubscribe from all channels
    this.giftChannels.forEach((channel) => {
      try {
        supabase.removeChannel(channel);
      } catch (error) {
        console.error('Error removing channel:', error);
      }
    });
    
    this.giftChannels.clear();
    this.initialized = false;
  }

  /**
   * Send a roast gift
   */
  public async sendGift(
    giftId: string,
    senderId: string,
    creatorId: string,
    streamId: string | null
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get gift details
      const gift = getRoastGiftById(giftId);
      if (!gift) {
        return { success: false, error: 'Gift not found' };
      }

      // Anti-abuse: Detect self-gifting (LOGGED, NOT ENFORCED)
      await vipLevelService.detectSelfGifting(senderId, creatorId, gift.priceSEK);

      // Check if in battle
      const battleContext = battleGiftService.getBattleContext();
      if (battleContext?.isInBattle) {
        // Route through battle gift service
        const receiverTeam = this.determineReceiverTeam(creatorId, battleContext);
        const { allowed, behavior } = await battleGiftService.routeGift(
          giftId,
          senderId,
          receiverTeam,
          gift.priceSEK
        );

        if (!allowed) {
          return { success: false, error: 'Gift not allowed in battle context' };
        }

        console.log('🎮 [RoastGiftService] Battle gift behavior:', behavior);
      }

      // Create transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('roast_gift_transactions')
        .insert({
          gift_id: giftId,
          price_sek: gift.priceSEK,
          sender_id: senderId,
          creator_id: creatorId,
          stream_id: streamId,
          status: 'CONFIRMED',
        })
        .select()
        .single();

      if (transactionError) {
        console.error('❌ [RoastGiftService] Transaction error:', transactionError);
        return { success: false, error: 'Transaction failed' };
      }

      // Play sound
      await giftSoundEngine.playSound(gift.soundProfile, gift.tier);

      // Update creator stats
      await this.updateCreatorStats(creatorId, streamId, gift.priceSEK);

      // Update ranking stats
      await roastRankingService.updateCreatorStats(creatorId, {
        giftsReceivedSek: gift.priceSEK,
        uniqueRoaster: senderId,
      });

      // NEW: Update VIP level if sender is a VIP member
      await this.updateVIPLevelIfMember(senderId, creatorId, gift.priceSEK);

      // Anti-abuse: Detect VIP farming (LOGGED, NOT ENFORCED)
      const club = await this.getCreatorClub(creatorId);
      if (club) {
        await vipLevelService.detectVIPFarming(club.id, senderId, gift.priceSEK);
      }

      // Trigger gift animation via realtime
      await this.broadcastGiftAnimation(giftId, senderId, creatorId, streamId, gift);

      console.log('✅ [RoastGiftService] Gift sent successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ [RoastGiftService] Exception sending gift:', error);
      return { success: false, error: 'Unexpected error' };
    }
  }

  /**
   * Get creator's VIP club
   */
  private async getCreatorClub(creatorId: string): Promise<{ id: string } | null> {
    try {
      const { data, error } = await supabase
        .from('vip_clubs')
        .select('id')
        .eq('creator_id', creatorId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ [RoastGiftService] Error fetching club:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('❌ [RoastGiftService] Exception fetching club:', error);
      return null;
    }
  }

  /**
   * Update VIP level if sender is a member
   */
  private async updateVIPLevelIfMember(
    senderId: string,
    creatorId: string,
    giftAmountSEK: number
  ): Promise<void> {
    try {
      const club = await this.getCreatorClub(creatorId);
      if (!club) return;

      // Check if sender is a VIP member
      const { data: member, error } = await supabase
        .from('vip_club_members')
        .select('id')
        .eq('club_id', club.id)
        .eq('user_id', senderId)
        .eq('status', 'active')
        .single();

      if (error || !member) {
        // Not a VIP member, skip
        return;
      }

      // Update VIP level
      const result = await vipLevelService.updateVIPLevelAfterGift(
        club.id,
        senderId,
        giftAmountSEK
      );

      if (result.leveledUp) {
        console.log(`🎉 [RoastGiftService] VIP member leveled up to ${result.newLevel}`);
        
        // Broadcast level up event
        const levelUpChannel = supabase.channel(`vip_level_up:${club.id}`);
        await levelUpChannel.send({
          type: 'broadcast',
          event: 'level_up',
          payload: {
            userId: senderId,
            oldLevel: result.newLevel - 1,
            newLevel: result.newLevel,
          },
        });
      }
    } catch (error) {
      console.error('❌ [RoastGiftService] Exception updating VIP level:', error);
    }
  }

  /**
   * Determine receiver team in battle
   */
  private determineReceiverTeam(
    creatorId: string,
    battleContext: any
  ): 'team_a' | 'team_b' {
    // This would need to check which team the creator is on
    // For now, default to team_a
    return 'team_a';
  }

  /**
   * Update creator stats
   */
  private async updateCreatorStats(
    creatorId: string,
    streamId: string | null,
    amountSek: number
  ): Promise<void> {
    try {
      // Get or create stats entry
      const { data: stats, error: fetchError } = await supabase
        .from('creator_roast_stats')
        .select('*')
        .eq('creator_id', creatorId)
        .eq('stream_id', streamId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('❌ [RoastGiftService] Error fetching stats:', fetchError);
        return;
      }

      if (!stats) {
        // Create new stats entry
        await supabase.from('creator_roast_stats').insert({
          creator_id: creatorId,
          stream_id: streamId,
          total_earned_sek: amountSek,
          total_gifts: 1,
        });
      } else {
        // Update existing stats
        await supabase
          .from('creator_roast_stats')
          .update({
            total_earned_sek: stats.total_earned_sek + amountSek,
            total_gifts: stats.total_gifts + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', stats.id);
      }

      console.log('✅ [RoastGiftService] Creator stats updated');
    } catch (error) {
      console.error('❌ [RoastGiftService] Exception updating creator stats:', error);
    }
  }

  /**
   * Broadcast gift animation via realtime
   */
  private async broadcastGiftAnimation(
    giftId: string,
    senderId: string,
    creatorId: string,
    streamId: string | null,
    gift: any
  ): Promise<void> {
    if (!streamId) return;

    try {
      // Get sender info
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('display_name, username')
        .eq('id', senderId)
        .single();

      const channel = supabase.channel(`roast_gifts:${streamId}`);
      await channel.send({
        type: 'broadcast',
        event: 'gift_sent',
        payload: {
          giftId,
          displayName: gift.displayName,
          emoji: gift.emoji,
          senderName: senderProfile?.display_name || senderProfile?.username || 'Anonymous',
          priceSEK: gift.priceSEK,
          tier: gift.tier,
          animationType: gift.animationType,
          timestamp: Date.now(),
        },
      });

      console.log('✅ [RoastGiftService] Gift animation broadcasted');
    } catch (error) {
      console.error('❌ [RoastGiftService] Error broadcasting gift:', error);
    }
  }

  /**
   * Subscribe to gifts for a stream
   */
  public subscribeToGifts(
    streamId: string,
    callback: (giftData: any) => void
  ): () => void {
    if (this.giftChannels.has(streamId)) {
      console.warn('⚠️ [RoastGiftService] Already subscribed to stream:', streamId);
      return () => {};
    }

    console.log('🔌 [RoastGiftService] Subscribing to gifts for stream:', streamId);

    const channel = supabase
      .channel(`roast_gifts:${streamId}`)
      .on('broadcast', { event: 'gift_sent' }, (payload) => {
        console.log('🎁 [RoastGiftService] Gift received:', payload);
        callback(payload.payload);
      })
      .subscribe((status) => {
        console.log('📡 [RoastGiftService] Subscription status:', status);
      });

    this.giftChannels.set(streamId, channel);

    return () => {
      console.log('🔌 [RoastGiftService] Unsubscribing from stream:', streamId);
      supabase.removeChannel(channel);
      this.giftChannels.delete(streamId);
    };
  }

  /**
   * Get creator earnings summary
   */
  public async getCreatorEarnings(
    creatorId: string,
    streamId?: string
  ): Promise<{
    totalEarnedSek: number;
    platformCut: number;
    creatorPayout: number;
    totalGifts: number;
  }> {
    try {
      let query = supabase
        .from('creator_roast_stats')
        .select('*')
        .eq('creator_id', creatorId);

      if (streamId) {
        query = query.eq('stream_id', streamId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ [RoastGiftService] Error fetching earnings:', error);
        return { totalEarnedSek: 0, platformCut: 0, creatorPayout: 0, totalGifts: 0 };
      }

      const totalEarnedSek = data.reduce((sum, stat) => sum + stat.total_earned_sek, 0);
      const totalGifts = data.reduce((sum, stat) => sum + stat.total_gifts, 0);
      const platformCut = Math.floor(totalEarnedSek * 0.3); // 30%
      const creatorPayout = Math.floor(totalEarnedSek * 0.7); // 70%

      return {
        totalEarnedSek,
        platformCut,
        creatorPayout,
        totalGifts,
      };
    } catch (error) {
      console.error('❌ [RoastGiftService] Exception fetching earnings:', error);
      return { totalEarnedSek: 0, platformCut: 0, creatorPayout: 0, totalGifts: 0 };
    }
  }

  /**
   * Get top roasters for a stream
   */
  public async getTopRoasters(
    streamId: string,
    limit: number = 3
  ): Promise<{ userId: string; username: string; totalSek: number }[]> {
    try {
      const { data, error } = await supabase
        .from('roast_gift_transactions')
        .select('sender_id, price_sek, profiles(username)')
        .eq('stream_id', streamId)
        .eq('status', 'CONFIRMED');

      if (error) {
        console.error('❌ [RoastGiftService] Error fetching top roasters:', error);
        return [];
      }

      // Aggregate by sender
      const roasterMap = new Map<string, { username: string; totalSek: number }>();
      for (const transaction of data) {
        const existing = roasterMap.get(transaction.sender_id);
        if (existing) {
          existing.totalSek += transaction.price_sek;
        } else {
          roasterMap.set(transaction.sender_id, {
            username: (transaction.profiles as any)?.username || 'Unknown',
            totalSek: transaction.price_sek,
          });
        }
      }

      // Sort and limit
      const topRoasters = Array.from(roasterMap.entries())
        .map(([userId, data]) => ({ userId, ...data }))
        .sort((a, b) => b.totalSek - a.totalSek)
        .slice(0, limit);

      return topRoasters;
    } catch (error) {
      console.error('❌ [RoastGiftService] Exception fetching top roasters:', error);
      return [];
    }
  }

  /**
   * Get most brutal gift for a stream
   */
  public async getMostBrutalGift(streamId: string): Promise<{
    giftId: string;
    giftName: string;
    priceSek: number;
    senderUsername: string;
  } | null> {
    try {
      const { data, error } = await supabase
        .from('roast_gift_transactions')
        .select('gift_id, price_sek, profiles(username)')
        .eq('stream_id', streamId)
        .eq('status', 'CONFIRMED')
        .order('price_sek', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('❌ [RoastGiftService] Error fetching most brutal gift:', error);
        return null;
      }

      const gift = getRoastGiftById(data.gift_id);
      if (!gift) return null;

      return {
        giftId: data.gift_id,
        giftName: gift.displayName,
        priceSek: data.price_sek,
        senderUsername: (data.profiles as any)?.username || 'Unknown',
      };
    } catch (error) {
      console.error('❌ [RoastGiftService] Exception fetching most brutal gift:', error);
      return null;
    }
  }
}

// Export singleton instance
export const roastGiftService = new RoastGiftService();
