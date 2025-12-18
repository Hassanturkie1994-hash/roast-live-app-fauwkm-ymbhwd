
/**
 * Roast Gift Service
 * 
 * Integrates gift transactions with sound engine, battle behaviors, and ranking system.
 */

import { supabase } from '@/app/integrations/supabase/client';
import { giftSoundEngine } from '@/services/giftSoundEngine';
import { battleGiftService } from '@/services/battleGiftService';
import { roastRankingService } from '@/services/roastRankingService';
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

      // Trigger gift animation via realtime
      await this.broadcastGiftAnimation(giftId, senderId, creatorId, streamId);

      console.log('✅ [RoastGiftService] Gift sent successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ [RoastGiftService] Exception sending gift:', error);
      return { success: false, error: 'Unexpected error' };
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
    streamId: string | null
  ): Promise<void> {
    if (!streamId) return;

    try {
      const channel = supabase.channel(`roast_gifts:${streamId}`);
      await channel.send({
        type: 'broadcast',
        event: 'gift_sent',
        payload: {
          giftId,
          senderId,
          creatorId,
          timestamp: Date.now(),
        },
      });

      console.log('✅ [RoastGiftService] Gift animation broadcasted');
    } catch (error) {
      console.error('❌ [RoastGiftService] Error broadcasting gift:', error);
    }
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
  ): Promise<Array<{ userId: string; username: string; totalSek: number }>> {
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
