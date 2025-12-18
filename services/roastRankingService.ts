
/**
 * Roast Ranking Seasons Service
 * 
 * Handles roast ranking seasons system.
 * Rankings reset on seasons and reward creators for engagement, not just revenue.
 * 
 * Concept:
 * - Fixed duration seasons (14 or 30 days)
 * - Global and regional rankings
 * - Seasonal reset (no lifetime stacking)
 * - Anti-whale logic (weighted gifts, unique roasters)
 * 
 * Ranking sources:
 * - Live roast battles
 * - Gifts received (weighted)
 * - Unique roasters
 * - Battle wins
 * - Crowd hype peaks
 */

import { supabase } from '@/app/integrations/supabase/client';

export interface RoastRankingSeason {
  id: string;
  season_number: number;
  start_date: string;
  end_date: string;
  duration_days: number;
  status: 'active' | 'completed' | 'upcoming';
  created_at: string;
}

export interface RoastRankingEntry {
  id: string;
  season_id: string;
  creator_id: string;
  rank: number;
  composite_score: number;
  battles_won: number;
  battles_participated: number;
  total_gifts_received_sek: number;
  weighted_gifts_score: number;
  unique_roasters_count: number;
  crowd_hype_peaks: number;
  region: string;
  created_at: string;
  updated_at: string;
}

export interface RankingWeights {
  battlesWon: number;
  battlesParticipated: number;
  giftsReceived: number;
  uniqueRoasters: number;
  crowdHypePeaks: number;
}

class RoastRankingService {
  // Default ranking weights (anti-whale logic)
  private readonly DEFAULT_WEIGHTS: RankingWeights = {
    battlesWon: 0.35, // 35% - Winning battles
    battlesParticipated: 0.15, // 15% - Participation
    giftsReceived: 0.20, // 20% - Gifts (weighted, not raw)
    uniqueRoasters: 0.20, // 20% - Unique roasters (prevents whale dominance)
    crowdHypePeaks: 0.10, // 10% - Crowd hype moments
  };

  /**
   * Get current active season
   */
  public async getCurrentSeason(): Promise<RoastRankingSeason | null> {
    try {
      const { data, error } = await supabase
        .from('roast_ranking_seasons')
        .select('*')
        .eq('status', 'active')
        .single();

      if (error) {
        console.error('❌ [RoastRankingService] Error fetching current season:', error);
        return null;
      }

      return data as RoastRankingSeason;
    } catch (error) {
      console.error('❌ [RoastRankingService] Exception fetching current season:', error);
      return null;
    }
  }

  /**
   * Get rankings for a season
   */
  public async getSeasonRankings(
    seasonId: string,
    region?: string,
    limit: number = 100
  ): Promise<RoastRankingEntry[]> {
    try {
      let query = supabase
        .from('roast_ranking_entries')
        .select('*, profiles(username, avatar_url)')
        .eq('season_id', seasonId)
        .order('rank', { ascending: true })
        .limit(limit);

      if (region) {
        query = query.eq('region', region);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ [RoastRankingService] Error fetching rankings:', error);
        return [];
      }

      return data as RoastRankingEntry[];
    } catch (error) {
      console.error('❌ [RoastRankingService] Exception fetching rankings:', error);
      return [];
    }
  }

  /**
   * Get user's ranking in current season
   */
  public async getUserRanking(userId: string): Promise<RoastRankingEntry | null> {
    try {
      const season = await this.getCurrentSeason();
      if (!season) return null;

      const { data, error } = await supabase
        .from('roast_ranking_entries')
        .select('*')
        .eq('season_id', season.id)
        .eq('creator_id', userId)
        .single();

      if (error) {
        console.error('❌ [RoastRankingService] Error fetching user ranking:', error);
        return null;
      }

      return data as RoastRankingEntry;
    } catch (error) {
      console.error('❌ [RoastRankingService] Exception fetching user ranking:', error);
      return null;
    }
  }

  /**
   * Calculate composite score for a creator
   * This is computed server-side, but here's the logic for reference
   */
  public calculateCompositeScore(
    battlesWon: number,
    battlesParticipated: number,
    giftsReceivedSek: number,
    uniqueRoasters: number,
    crowdHypePeaks: number,
    weights: RankingWeights = this.DEFAULT_WEIGHTS
  ): number {
    // Normalize values (0-100 scale)
    const normalizedBattlesWon = Math.min(battlesWon / 10, 1) * 100;
    const normalizedBattlesParticipated = Math.min(battlesParticipated / 50, 1) * 100;
    
    // Apply logarithmic scaling to gifts (anti-whale)
    const normalizedGifts = Math.min(Math.log10(giftsReceivedSek + 1) / 4, 1) * 100;
    
    // Unique roasters (more important than raw gift amount)
    const normalizedUniqueRoasters = Math.min(uniqueRoasters / 100, 1) * 100;
    
    // Crowd hype peaks
    const normalizedCrowdHype = Math.min(crowdHypePeaks / 20, 1) * 100;

    // Calculate weighted composite score
    const compositeScore =
      normalizedBattlesWon * weights.battlesWon +
      normalizedBattlesParticipated * weights.battlesParticipated +
      normalizedGifts * weights.giftsReceived +
      normalizedUniqueRoasters * weights.uniqueRoasters +
      normalizedCrowdHype * weights.crowdHypePeaks;

    return Math.round(compositeScore);
  }

  /**
   * Update creator ranking stats (called after battle or gift)
   */
  public async updateCreatorStats(
    creatorId: string,
    updates: {
      battlesWon?: number;
      battlesParticipated?: number;
      giftsReceivedSek?: number;
      uniqueRoaster?: string;
      crowdHypePeak?: boolean;
    }
  ): Promise<void> {
    try {
      const season = await this.getCurrentSeason();
      if (!season) {
        console.warn('⚠️ [RoastRankingService] No active season');
        return;
      }

      // Get or create ranking entry
      let { data: entry, error: fetchError } = await supabase
        .from('roast_ranking_entries')
        .select('*')
        .eq('season_id', season.id)
        .eq('creator_id', creatorId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('❌ [RoastRankingService] Error fetching entry:', fetchError);
        return;
      }

      if (!entry) {
        // Create new entry
        const { data: newEntry, error: createError } = await supabase
          .from('roast_ranking_entries')
          .insert({
            season_id: season.id,
            creator_id: creatorId,
            rank: 0,
            composite_score: 0,
            battles_won: 0,
            battles_participated: 0,
            total_gifts_received_sek: 0,
            weighted_gifts_score: 0,
            unique_roasters_count: 0,
            crowd_hype_peaks: 0,
            region: 'global',
          })
          .select()
          .single();

        if (createError) {
          console.error('❌ [RoastRankingService] Error creating entry:', createError);
          return;
        }

        entry = newEntry;
      }

      // Update stats
      const updatedEntry: any = { ...entry };

      if (updates.battlesWon !== undefined) {
        updatedEntry.battles_won += updates.battlesWon;
      }

      if (updates.battlesParticipated !== undefined) {
        updatedEntry.battles_participated += updates.battlesParticipated;
      }

      if (updates.giftsReceivedSek !== undefined) {
        updatedEntry.total_gifts_received_sek += updates.giftsReceivedSek;
      }

      if (updates.uniqueRoaster) {
        // Track unique roaster
        await this.trackUniqueRoaster(season.id, creatorId, updates.uniqueRoaster);
        updatedEntry.unique_roasters_count += 1;
      }

      if (updates.crowdHypePeak) {
        updatedEntry.crowd_hype_peaks += 1;
      }

      // Recalculate composite score
      updatedEntry.composite_score = this.calculateCompositeScore(
        updatedEntry.battles_won,
        updatedEntry.battles_participated,
        updatedEntry.total_gifts_received_sek,
        updatedEntry.unique_roasters_count,
        updatedEntry.crowd_hype_peaks
      );

      // Update entry
      const { error: updateError } = await supabase
        .from('roast_ranking_entries')
        .update(updatedEntry)
        .eq('id', entry.id);

      if (updateError) {
        console.error('❌ [RoastRankingService] Error updating entry:', updateError);
        return;
      }

      console.log('✅ [RoastRankingService] Creator stats updated');

      // Trigger rank recalculation (would be done server-side)
      await this.recalculateRanks(season.id);
    } catch (error) {
      console.error('❌ [RoastRankingService] Exception updating creator stats:', error);
    }
  }

  /**
   * Track unique roaster
   */
  private async trackUniqueRoaster(
    seasonId: string,
    creatorId: string,
    roasterId: string
  ): Promise<void> {
    try {
      // Check if roaster already exists
      const { data: existing } = await supabase
        .from('roast_ranking_unique_roasters')
        .select('id')
        .eq('season_id', seasonId)
        .eq('creator_id', creatorId)
        .eq('roaster_id', roasterId)
        .single();

      if (existing) {
        // Already tracked
        return;
      }

      // Insert new unique roaster
      await supabase.from('roast_ranking_unique_roasters').insert({
        season_id: seasonId,
        creator_id: creatorId,
        roaster_id: roasterId,
        total_gifts_sek: 0,
      });

      console.log('✅ [RoastRankingService] Unique roaster tracked');
    } catch (error) {
      console.error('❌ [RoastRankingService] Error tracking unique roaster:', error);
    }
  }

  /**
   * Recalculate ranks for a season
   * This should be done server-side via a scheduled job
   */
  private async recalculateRanks(seasonId: string): Promise<void> {
    try {
      // Fetch all entries for the season
      const { data: entries, error } = await supabase
        .from('roast_ranking_entries')
        .select('*')
        .eq('season_id', seasonId)
        .order('composite_score', { ascending: false });

      if (error) {
        console.error('❌ [RoastRankingService] Error fetching entries:', error);
        return;
      }

      // Update ranks
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        await supabase
          .from('roast_ranking_entries')
          .update({ rank: i + 1 })
          .eq('id', entry.id);
      }

      console.log('✅ [RoastRankingService] Ranks recalculated');
    } catch (error) {
      console.error('❌ [RoastRankingService] Exception recalculating ranks:', error);
    }
  }

  /**
   * Create a new season
   * This should be done by an admin or scheduled job
   */
  public async createSeason(durationDays: number = 14): Promise<RoastRankingSeason | null> {
    try {
      // End current season
      await supabase
        .from('roast_ranking_seasons')
        .update({ status: 'completed' })
        .eq('status', 'active');

      // Get last season number
      const { data: lastSeason } = await supabase
        .from('roast_ranking_seasons')
        .select('season_number')
        .order('season_number', { ascending: false })
        .limit(1)
        .single();

      const seasonNumber = (lastSeason?.season_number || 0) + 1;

      // Create new season
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + durationDays);

      const { data: newSeason, error } = await supabase
        .from('roast_ranking_seasons')
        .insert({
          season_number: seasonNumber,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          duration_days: durationDays,
          status: 'active',
        })
        .select()
        .single();

      if (error) {
        console.error('❌ [RoastRankingService] Error creating season:', error);
        return null;
      }

      console.log('✅ [RoastRankingService] New season created:', seasonNumber);
      return newSeason as RoastRankingSeason;
    } catch (error) {
      console.error('❌ [RoastRankingService] Exception creating season:', error);
      return null;
    }
  }
}

// Export singleton instance
export const roastRankingService = new RoastRankingService();
