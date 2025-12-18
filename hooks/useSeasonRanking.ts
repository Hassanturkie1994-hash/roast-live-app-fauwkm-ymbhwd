
/**
 * useSeasonRanking Hook
 * 
 * React hook for accessing season ranking data and subscribing to updates.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/app/integrations/supabase/client';
import { roastRankingService, RoastRankingEntry, RoastRankTier } from '@/services/roastRankingService';

interface SeasonProgress {
  season_id: string;
  season_name: string;
  season_score: number;
  rank_tier: string | null;
  current_rank: number;
  total_creators: number;
  percentile: number;
  next_tier_threshold: number;
  progress_to_next_tier: number;
}

export function useSeasonRanking(creatorId: string) {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<SeasonProgress | null>(null);
  const [ranking, setRanking] = useState<RoastRankingEntry | null>(null);
  const [tiers, setTiers] = useState<RoastRankTier[]>([]);
  const [isNearRankUp, setIsNearRankUp] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Get season progress
      const { data: progressData, error: progressError } = await supabase
        .rpc('get_creator_season_progress', { p_creator_id: creatorId });

      if (!progressError && progressData && progressData.length > 0) {
        const prog = progressData[0] as SeasonProgress;
        setProgress(prog);
        setIsNearRankUp(prog.progress_to_next_tier >= 90);
      }

      // Get full ranking entry
      const rankingData = await roastRankingService.getUserRanking(creatorId);
      setRanking(rankingData);

      // Get tiers
      if (progressData && progressData.length > 0) {
        const tiersData = await roastRankingService.getRankTiers(progressData[0].season_id);
        setTiers(tiersData);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading season ranking:', error);
      setLoading(false);
    }
  }, [creatorId]);

  useEffect(() => {
    loadData();

    // Subscribe to updates
    const channel = supabase
      .channel(`creator_rank_updates:${creatorId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'creator_season_scores',
          filter: `creator_id=eq.${creatorId}`,
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [creatorId, loadData]);

  const refresh = useCallback(() => {
    loadData();
  }, [loadData]);

  return {
    loading,
    progress,
    ranking,
    tiers,
    isNearRankUp,
    refresh,
  };
}
