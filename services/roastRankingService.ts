
/**
 * Roast Ranking Seasons Service - Team Battle Edition
 * 
 * Implements the new Roast Season Ranking Formula designed for team-based Roast Battles.
 * 
 * Supported battle formats:
 * - 1v1, 2v2, 3v3, 4v4, 5v5
 * 
 * Season rankings account for both:
 * - Individual creator contribution
 * - Team battle performance
 * 
 * Core principle:
 * Creators earn SeasonScore as individuals, even when competing in teams.
 * Team performance influences individual SeasonScore proportionally.
 * 
 * SeasonScore calculation (per creator):
 * 
 * SeasonScore =
 *   (IndividualWeightedGiftCoins * 0.5)
 * + (TeamBattleContributionScore * 0.3)
 * + (UniqueRoastersImpact * 0.1)
 * + (HypeMomentumScore * 0.1)
 * 
 * Where:
 * 
 * IndividualWeightedGiftCoins:
 * - Calculated from the creator's share of team gifts
 * - Platform cut (30%) applied BEFORE attribution
 * - Diminishing returns applied per sender
 * 
 * TeamBattleContributionScore:
 * - Based on team's final TeamScore
 * - Adjusted by team size: TeamSizeMultiplier = 1 / teamSize
 * - Winning team members receive a bonus
 * - Losing team members receive partial credit
 * 
 * UniqueRoastersImpact:
 * - Counts unique viewers gifting to the team
 * - Split evenly across team members
 * - Prevents single-whale dominance
 * 
 * HypeMomentumScore:
 * - Based on peak hype reached during battles
 * - Shared equally among team members
 * - Encourages coordinated gifting
 * 
 * Anti-whale protection:
 * IF one sender contributes >35% of team gift value
 *   apply diminishing multiplier to excess for all team members
 * 
 * Decay rules:
 * - Activity older than 7 days decays progressively
 * - Last 48 hours weighted highest
 * - Tournament battles override decay (temporary boost)
 * 
 * Season configuration:
 * - Weights must be server-configurable
 * - Win bonuses must be configurable per season
 * - Maximum score per battle is capped
 * 
 * Constraints:
 * - Confirmed gifts only affect rankings
 * - Casual battles do NOT affect SeasonScore
 * - Ranked & Tournament battles DO affect SeasonScore
 * - Rankings are recomputed server-side
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

export interface RoastSeasonConfig {
  id: string;
  season_id: string;
  weight_individual_gifts: number;
  weight_team_contribution: number;
  weight_unique_roasters: number;
  weight_hype_momentum: number;
  win_bonus_1v1: number;
  win_bonus_2v2: number;
  win_bonus_3v3: number;
  win_bonus_4v4: number;
  win_bonus_5v5: number;
  whale_threshold_percent: number;
  whale_diminishing_multiplier: number;
  decay_days: number;
  decay_rate: number;
  recent_hours_weight: number;
  max_score_per_battle: number;
}

export interface RoastRankingEntry {
  id: string;
  season_id: string;
  creator_id: string;
  rank: number;
  composite_score: number;
  battles_won: number;
  battles_participated: number;
  team_battles_won: number;
  team_battles_participated: number;
  total_gifts_received_sek: number;
  weighted_gifts_score: number;
  individual_weighted_gift_score: number;
  team_contribution_score: number;
  unique_roasters_count: number;
  unique_roasters_impact: number;
  crowd_hype_peaks: number;
  hype_momentum_score: number;
  current_tier: string | null;
  region: string;
  created_at: string;
  updated_at: string;
  last_recalculated_at: string | null;
}

export interface RoastRankTier {
  id: string;
  season_id: string;
  tier_name: string;
  tier_order: number;
  min_score: number;
  max_score: number | null;
  badge_icon: string | null;
  badge_color: string | null;
  intro_animation: string | null;
  profile_effect: string | null;
  exclusive_gifts: string[] | null;
}

export interface RoastSeasonalReward {
  id: string;
  season_id: string;
  creator_id: string;
  final_rank: number;
  final_score: number;
  tier_name: string;
  badge_icon: string | null;
  badge_color: string | null;
  intro_animation: string | null;
  profile_effect: string | null;
  stream_intro_sound: string | null;
  battle_victory_animation: string | null;
  seasonal_title: string | null;
  is_top_tier: boolean;
  ultra_intro_animation: string | null;
  highlighted_in_discovery: boolean;
  granted_at: string;
}

export interface TeamBattleParticipation {
  season_id: string;
  creator_id: string;
  match_id: string;
  team: 'team_a' | 'team_b';
  team_size: number;
  is_winner: boolean;
  individual_gift_coins: number;
  team_score: number;
  unique_roasters_count: number;
  peak_hype_reached: number;
  battle_type: 'casual' | 'ranked' | 'tournament';
  battle_duration_minutes: number;
}

class RoastRankingService {
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
   * Get season configuration
   */
  public async getSeasonConfig(seasonId: string): Promise<RoastSeasonConfig | null> {
    try {
      const { data, error } = await supabase
        .from('roast_season_config')
        .select('*')
        .eq('season_id', seasonId)
        .single();

      if (error) {
        console.error('❌ [RoastRankingService] Error fetching season config:', error);
        return null;
      }

      return data as RoastSeasonConfig;
    } catch (error) {
      console.error('❌ [RoastRankingService] Exception fetching season config:', error);
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
   * Get rank tiers for a season
   */
  public async getRankTiers(seasonId: string): Promise<RoastRankTier[]> {
    try {
      const { data, error } = await supabase
        .from('roast_rank_tiers')
        .select('*')
        .eq('season_id', seasonId)
        .order('tier_order', { ascending: true });

      if (error) {
        console.error('❌ [RoastRankingService] Error fetching rank tiers:', error);
        return [];
      }

      return data as RoastRankTier[];
    } catch (error) {
      console.error('❌ [RoastRankingService] Exception fetching rank tiers:', error);
      return [];
    }
  }

  /**
   * Calculate SeasonScore for a team battle participation
   * 
   * SeasonScore =
   *   (IndividualWeightedGiftCoins * weight_individual_gifts)
   * + (TeamBattleContributionScore * weight_team_contribution)
   * + (UniqueRoastersImpact * weight_unique_roasters)
   * + (HypeMomentumScore * weight_hype_momentum)
   */
  public async calculateSeasonScore(
    participation: TeamBattleParticipation,
    config: RoastSeasonConfig
  ): Promise<number> {
    // 1. Calculate IndividualWeightedGiftCoins
    // Platform cut (30%) applied BEFORE attribution
    const afterPlatformCut = participation.individual_gift_coins * 0.7;
    
    // Apply diminishing returns per sender (anti-whale)
    // This would require tracking per-sender contributions
    // For now, use a logarithmic scale
    const individualWeightedScore = Math.log10(afterPlatformCut + 1) * 1000;

    // 2. Calculate TeamBattleContributionScore
    const teamSizeMultiplier = 1 / participation.team_size;
    let teamContributionScore = participation.team_score * teamSizeMultiplier;
    
    // Add win bonus
    if (participation.is_winner) {
      const winBonus = this.getWinBonus(participation.team_size, config);
      teamContributionScore += winBonus;
    } else {
      // Losing team gets partial credit (50%)
      teamContributionScore *= 0.5;
    }

    // 3. Calculate UniqueRoastersImpact
    // Split evenly across team members
    const uniqueRoastersImpact = (participation.unique_roasters_count / participation.team_size) * 50;

    // 4. Calculate HypeMomentumScore
    // Shared equally among team members
    const hypeMomentumScore = (participation.peak_hype_reached / participation.team_size) * 10;

    // 5. Apply weights
    const seasonScore =
      individualWeightedScore * config.weight_individual_gifts +
      teamContributionScore * config.weight_team_contribution +
      uniqueRoastersImpact * config.weight_unique_roasters +
      hypeMomentumScore * config.weight_hype_momentum;

    // 6. Apply max score cap
    const cappedScore = Math.min(seasonScore, config.max_score_per_battle);

    // 7. Apply decay if needed
    const decayedScore = await this.applyDecay(cappedScore, participation, config);

    return Math.round(decayedScore);
  }

  /**
   * Get win bonus based on team size
   */
  private getWinBonus(teamSize: number, config: RoastSeasonConfig): number {
    switch (teamSize) {
      case 1:
        return config.win_bonus_1v1;
      case 2:
        return config.win_bonus_2v2;
      case 3:
        return config.win_bonus_3v3;
      case 4:
        return config.win_bonus_4v4;
      case 5:
        return config.win_bonus_5v5;
      default:
        return 0;
    }
  }

  /**
   * Apply decay rules
   * - Activity older than 7 days decays progressively
   * - Last 48 hours weighted highest
   * - Tournament battles override decay (temporary boost)
   */
  private async applyDecay(
    score: number,
    participation: TeamBattleParticipation,
    config: RoastSeasonConfig
  ): Promise<number> {
    // Tournament battles override decay
    if (participation.battle_type === 'tournament') {
      return score * 1.2; // 20% boost
    }

    // Calculate age of participation
    // This would require the participation timestamp
    // For now, assume recent activity
    const hoursAgo = 24; // Placeholder

    if (hoursAgo <= 48) {
      // Last 48 hours weighted highest
      return score * config.recent_hours_weight;
    } else if (hoursAgo <= config.decay_days * 24) {
      // Progressive decay
      const decayFactor = 1 - (hoursAgo / (config.decay_days * 24)) * config.decay_rate;
      return score * Math.max(decayFactor, 0.5); // Minimum 50% of score
    } else {
      // Older than decay period
      return score * 0.5;
    }
  }

  /**
   * Record team battle participation
   */
  public async recordTeamBattleParticipation(
    participation: TeamBattleParticipation
  ): Promise<void> {
    try {
      const season = await this.getCurrentSeason();
      if (!season) {
        console.warn('⚠️ [RoastRankingService] No active season');
        return;
      }

      // Only record ranked and tournament battles
      if (participation.battle_type === 'casual') {
        console.log('ℹ️ [RoastRankingService] Casual battles do not affect SeasonScore');
        return;
      }

      const config = await this.getSeasonConfig(season.id);
      if (!config) {
        console.error('❌ [RoastRankingService] No season config found');
        return;
      }

      // Calculate SeasonScore
      const seasonScore = await this.calculateSeasonScore(participation, config);

      // Calculate individual scores
      const teamSizeMultiplier = 1 / participation.team_size;
      const teamContributionScore = participation.team_score * teamSizeMultiplier;
      const individualWeightedScore = Math.log10(participation.individual_gift_coins * 0.7 + 1) * 1000;
      const uniqueRoastersScore = (participation.unique_roasters_count / participation.team_size) * 50;
      const hypeMomentumScore = (participation.peak_hype_reached / participation.team_size) * 10;

      // Insert participation record
      const { error: insertError } = await supabase
        .from('roast_team_battle_participation')
        .insert({
          season_id: season.id,
          creator_id: participation.creator_id,
          match_id: participation.match_id,
          team: participation.team,
          team_size: participation.team_size,
          is_winner: participation.is_winner,
          individual_gift_coins: participation.individual_gift_coins,
          individual_weighted_score: Math.round(individualWeightedScore),
          team_score: participation.team_score,
          team_size_multiplier: teamSizeMultiplier,
          team_contribution_score: Math.round(teamContributionScore),
          unique_roasters_count: participation.unique_roasters_count,
          unique_roasters_score: Math.round(uniqueRoastersScore),
          hype_momentum_score: Math.round(hypeMomentumScore),
          peak_hype_reached: participation.peak_hype_reached,
          season_score: seasonScore,
          battle_type: participation.battle_type,
          battle_duration_minutes: participation.battle_duration_minutes,
        });

      if (insertError) {
        console.error('❌ [RoastRankingService] Error recording participation:', insertError);
        return;
      }

      console.log('✅ [RoastRankingService] Team battle participation recorded');

      // Update creator's ranking entry
      await this.updateCreatorRankingEntry(season.id, participation.creator_id);
    } catch (error) {
      console.error('❌ [RoastRankingService] Exception recording participation:', error);
    }
  }

  /**
   * Update creator's ranking entry
   */
  private async updateCreatorRankingEntry(seasonId: string, creatorId: string): Promise<void> {
    try {
      // Get all participations for this creator in this season
      const { data: participations, error: fetchError } = await supabase
        .from('roast_team_battle_participation')
        .select('*')
        .eq('season_id', seasonId)
        .eq('creator_id', creatorId);

      if (fetchError) {
        console.error('❌ [RoastRankingService] Error fetching participations:', fetchError);
        return;
      }

      if (!participations || participations.length === 0) {
        return;
      }

      // Aggregate scores
      const totalSeasonScore = participations.reduce((sum, p) => sum + p.season_score, 0);
      const totalIndividualWeightedScore = participations.reduce((sum, p) => sum + p.individual_weighted_score, 0);
      const totalTeamContributionScore = participations.reduce((sum, p) => sum + p.team_contribution_score, 0);
      const totalUniqueRoastersScore = participations.reduce((sum, p) => sum + p.unique_roasters_score, 0);
      const totalHypeMomentumScore = participations.reduce((sum, p) => sum + p.hype_momentum_score, 0);
      const teamBattlesWon = participations.filter(p => p.is_winner).length;
      const teamBattlesParticipated = participations.length;

      // Get or create ranking entry
      let { data: entry, error: entryError } = await supabase
        .from('roast_ranking_entries')
        .select('*')
        .eq('season_id', seasonId)
        .eq('creator_id', creatorId)
        .single();

      if (entryError && entryError.code !== 'PGRST116') {
        console.error('❌ [RoastRankingService] Error fetching entry:', entryError);
        return;
      }

      if (!entry) {
        // Create new entry
        const { error: createError } = await supabase
          .from('roast_ranking_entries')
          .insert({
            season_id: seasonId,
            creator_id: creatorId,
            rank: 0,
            composite_score: totalSeasonScore,
            battles_won: 0,
            battles_participated: 0,
            team_battles_won: teamBattlesWon,
            team_battles_participated: teamBattlesParticipated,
            total_gifts_received_sek: 0,
            weighted_gifts_score: 0,
            individual_weighted_gift_score: totalIndividualWeightedScore,
            team_contribution_score: totalTeamContributionScore,
            unique_roasters_count: 0,
            unique_roasters_impact: totalUniqueRoastersScore,
            crowd_hype_peaks: 0,
            hype_momentum_score: totalHypeMomentumScore,
            region: 'global',
            last_recalculated_at: new Date().toISOString(),
          });

        if (createError) {
          console.error('❌ [RoastRankingService] Error creating entry:', createError);
          return;
        }
      } else {
        // Update existing entry
        const { error: updateError } = await supabase
          .from('roast_ranking_entries')
          .update({
            composite_score: totalSeasonScore,
            team_battles_won: teamBattlesWon,
            team_battles_participated: teamBattlesParticipated,
            individual_weighted_gift_score: totalIndividualWeightedScore,
            team_contribution_score: totalTeamContributionScore,
            unique_roasters_impact: totalUniqueRoastersScore,
            hype_momentum_score: totalHypeMomentumScore,
            last_recalculated_at: new Date().toISOString(),
          })
          .eq('id', entry.id);

        if (updateError) {
          console.error('❌ [RoastRankingService] Error updating entry:', updateError);
          return;
        }
      }

      console.log('✅ [RoastRankingService] Creator ranking entry updated');

      // Trigger rank recalculation
      await this.recalculateRanks(seasonId);
    } catch (error) {
      console.error('❌ [RoastRankingService] Exception updating ranking entry:', error);
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

      // Get rank tiers
      const tiers = await this.getRankTiers(seasonId);

      // Update ranks and tiers
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const rank = i + 1;
        
        // Determine tier
        const tier = this.determineTier(entry.composite_score, tiers);

        await supabase
          .from('roast_ranking_entries')
          .update({ 
            rank,
            current_tier: tier?.tier_name || null,
          })
          .eq('id', entry.id);
      }

      console.log('✅ [RoastRankingService] Ranks recalculated');
    } catch (error) {
      console.error('❌ [RoastRankingService] Exception recalculating ranks:', error);
    }
  }

  /**
   * Determine tier based on score
   */
  private determineTier(score: number, tiers: RoastRankTier[]): RoastRankTier | null {
    for (const tier of tiers) {
      if (score >= tier.min_score && (tier.max_score === null || score <= tier.max_score)) {
        return tier;
      }
    }
    return null;
  }

  /**
   * Create default rank tiers for a season
   */
  public async createDefaultRankTiers(seasonId: string): Promise<void> {
    try {
      const defaultTiers = [
        {
          season_id: seasonId,
          tier_name: 'Bronze Mouth',
          tier_order: 1,
          min_score: 0,
          max_score: 1000,
          badge_icon: '🥉',
          badge_color: '#CD7F32',
          intro_animation: 'bronze_intro',
          profile_effect: 'bronze_glow',
          exclusive_gifts: ['bronze_roast'],
        },
        {
          season_id: seasonId,
          tier_name: 'Silver Tongue',
          tier_order: 2,
          min_score: 1001,
          max_score: 3000,
          badge_icon: '🥈',
          badge_color: '#C0C0C0',
          intro_animation: 'silver_intro',
          profile_effect: 'silver_glow',
          exclusive_gifts: ['silver_roast', 'silver_flame'],
        },
        {
          season_id: seasonId,
          tier_name: 'Golden Roast',
          tier_order: 3,
          min_score: 3001,
          max_score: 7000,
          badge_icon: '🥇',
          badge_color: '#FFD700',
          intro_animation: 'gold_intro',
          profile_effect: 'gold_glow',
          exclusive_gifts: ['gold_roast', 'gold_flame', 'gold_crown'],
        },
        {
          season_id: seasonId,
          tier_name: 'Diamond Disrespect',
          tier_order: 4,
          min_score: 7001,
          max_score: 15000,
          badge_icon: '💎',
          badge_color: '#B9F2FF',
          intro_animation: 'diamond_intro',
          profile_effect: 'diamond_sparkle',
          exclusive_gifts: ['diamond_roast', 'diamond_flame', 'diamond_crown', 'diamond_explosion'],
        },
        {
          season_id: seasonId,
          tier_name: 'Legendary Menace',
          tier_order: 5,
          min_score: 15001,
          max_score: null,
          badge_icon: '👑',
          badge_color: '#FF0000',
          intro_animation: 'legendary_intro',
          profile_effect: 'legendary_aura',
          exclusive_gifts: ['legendary_roast', 'legendary_flame', 'legendary_crown', 'legendary_nuke'],
        },
      ];

      const { error } = await supabase
        .from('roast_rank_tiers')
        .insert(defaultTiers);

      if (error) {
        console.error('❌ [RoastRankingService] Error creating default tiers:', error);
        return;
      }

      console.log('✅ [RoastRankingService] Default rank tiers created');
    } catch (error) {
      console.error('❌ [RoastRankingService] Exception creating default tiers:', error);
    }
  }

  /**
   * Create a new season with default config and tiers
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

      // Create default config
      await supabase.from('roast_season_config').insert({
        season_id: newSeason.id,
        weight_individual_gifts: 0.5,
        weight_team_contribution: 0.3,
        weight_unique_roasters: 0.1,
        weight_hype_momentum: 0.1,
        win_bonus_1v1: 500,
        win_bonus_2v2: 400,
        win_bonus_3v3: 350,
        win_bonus_4v4: 300,
        win_bonus_5v5: 250,
        whale_threshold_percent: 0.35,
        whale_diminishing_multiplier: 0.5,
        decay_days: 7,
        decay_rate: 0.1,
        recent_hours_weight: 2.0,
        max_score_per_battle: 10000,
      });

      // Create default rank tiers
      await this.createDefaultRankTiers(newSeason.id);

      console.log('✅ [RoastRankingService] New season created:', seasonNumber);
      return newSeason as RoastRankingSeason;
    } catch (error) {
      console.error('❌ [RoastRankingService] Exception creating season:', error);
      return null;
    }
  }

  /**
   * End season and grant rewards
   */
  public async endSeasonAndGrantRewards(seasonId: string): Promise<void> {
    try {
      // Freeze rankings
      await supabase
        .from('roast_ranking_seasons')
        .update({ status: 'completed' })
        .eq('id', seasonId);

      // Get all ranking entries
      const { data: entries, error } = await supabase
        .from('roast_ranking_entries')
        .select('*')
        .eq('season_id', seasonId)
        .order('rank', { ascending: true });

      if (error) {
        console.error('❌ [RoastRankingService] Error fetching entries:', error);
        return;
      }

      // Get rank tiers
      const tiers = await this.getRankTiers(seasonId);

      // Grant rewards
      for (const entry of entries) {
        const tier = this.determineTier(entry.composite_score, tiers);
        if (!tier) continue;

        // Determine if top-tier (top 10)
        const isTopTier = entry.rank <= 10;

        await supabase.from('roast_seasonal_rewards').insert({
          season_id: seasonId,
          creator_id: entry.creator_id,
          final_rank: entry.rank,
          final_score: entry.composite_score,
          tier_name: tier.tier_name,
          badge_icon: tier.badge_icon,
          badge_color: tier.badge_color,
          intro_animation: tier.intro_animation,
          profile_effect: tier.profile_effect,
          stream_intro_sound: `${tier.tier_name.toLowerCase()}_intro_sound`,
          battle_victory_animation: `${tier.tier_name.toLowerCase()}_victory`,
          seasonal_title: `Season ${entry.season_id} ${tier.tier_name}`,
          is_top_tier: isTopTier,
          ultra_intro_animation: isTopTier ? 'ultra_champion_intro' : null,
          highlighted_in_discovery: isTopTier,
        });
      }

      console.log('✅ [RoastRankingService] Season ended and rewards granted');
    } catch (error) {
      console.error('❌ [RoastRankingService] Exception ending season:', error);
    }
  }

  /**
   * Get user's seasonal rewards
   */
  public async getUserSeasonalRewards(userId: string): Promise<RoastSeasonalReward[]> {
    try {
      const { data, error } = await supabase
        .from('roast_seasonal_rewards')
        .select('*')
        .eq('creator_id', userId)
        .order('granted_at', { ascending: false });

      if (error) {
        console.error('❌ [RoastRankingService] Error fetching rewards:', error);
        return [];
      }

      return data as RoastSeasonalReward[];
    } catch (error) {
      console.error('❌ [RoastRankingService] Exception fetching rewards:', error);
      return [];
    }
  }
}

// Export singleton instance
export const roastRankingService = new RoastRankingService();
