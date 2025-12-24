
/**
 * Roast Ranking Service
 * 
 * Manages creator rankings and season leaderboards.
 */

import { supabase } from '@/app/integrations/supabase/client';

interface CreatorStats {
  giftsReceivedSek?: number;
  uniqueRoaster?: string;
  viewerMinutes?: number;
  peakViewers?: number;
}

class RoastRankingService {
  async updateCreatorStats(
    creatorId: string,
    stats: CreatorStats
  ): Promise<void> {
    try {
      console.log('📊 [RoastRankingService] Updating creator stats:', { creatorId, stats });

      // Get current stats
      const { data: currentStats, error: fetchError } = await supabase
        .from('creator_season_stats')
        .select('*')
        .eq('creator_id', creatorId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('❌ [RoastRankingService] Error fetching stats:', fetchError);
        return;
      }

      // Update or insert stats
      if (!currentStats) {
        await supabase.from('creator_season_stats').insert({
          creator_id: creatorId,
          total_gifts_sek: stats.giftsReceivedSek || 0,
          unique_roasters: stats.uniqueRoaster ? 1 : 0,
          total_viewer_minutes: stats.viewerMinutes || 0,
          peak_viewers: stats.peakViewers || 0,
        });
      } else {
        await supabase
          .from('creator_season_stats')
          .update({
            total_gifts_sek: currentStats.total_gifts_sek + (stats.giftsReceivedSek || 0),
            total_viewer_minutes: currentStats.total_viewer_minutes + (stats.viewerMinutes || 0),
            peak_viewers: Math.max(currentStats.peak_viewers, stats.peakViewers || 0),
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentStats.id);
      }

      console.log('✅ [RoastRankingService] Creator stats updated');
    } catch (error) {
      console.error('❌ [RoastRankingService] Exception updating stats:', error);
    }
  }

  async getCreatorRank(creatorId: string): Promise<number | null> {
    try {
      const { data, error } = await supabase
        .from('creator_season_stats')
        .select('creator_id, total_gifts_sek')
        .order('total_gifts_sek', { ascending: false });

      if (error) {
        console.error('❌ [RoastRankingService] Error fetching rankings:', error);
        return null;
      }

      const rank = data.findIndex(stat => stat.creator_id === creatorId) + 1;
      return rank > 0 ? rank : null;
    } catch (error) {
      console.error('❌ [RoastRankingService] Exception getting rank:', error);
      return null;
    }
  }
}

export const roastRankingService = new RoastRankingService();
