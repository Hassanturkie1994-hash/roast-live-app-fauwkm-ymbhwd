
/**
 * useSeasonRanking Hook
 * 
 * Provides access to season ranking data and real-time updates.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/app/integrations/supabase/client';

interface SeasonRanking {
  rank: number;
  creator_id: string;
  creator_name: string;
  total_points: number;
  total_gifts_sek: number;
  total_viewer_minutes: number;
  peak_viewers: number;
}

export function useSeasonRanking(seasonId?: string) {
  const [loading, setLoading] = useState(true);
  const [rankings, setRankings] = useState<SeasonRanking[]>([]);
  const [userRank, setUserRank] = useState<SeasonRanking | null>(null);

  const loadRankings = useCallback(async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('creator_season_stats')
        .select(`
          *,
          profiles:creator_id (
            display_name,
            username
          )
        `)
        .order('total_points', { ascending: false })
        .limit(100);

      if (seasonId) {
        query = query.eq('season_id', seasonId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ [useSeasonRanking] Error fetching rankings:', error);
        setLoading(false);
        return;
      }

      const formattedRankings: SeasonRanking[] = (data || []).map((stat, index) => ({
        rank: index + 1,
        creator_id: stat.creator_id,
        creator_name: (stat.profiles as any)?.display_name || (stat.profiles as any)?.username || 'Unknown',
        total_points: stat.total_points || 0,
        total_gifts_sek: stat.total_gifts_sek || 0,
        total_viewer_minutes: stat.total_viewer_minutes || 0,
        peak_viewers: stat.peak_viewers || 0,
      }));

      setRankings(formattedRankings);
      setLoading(false);
    } catch (error) {
      console.error('❌ [useSeasonRanking] Exception loading rankings:', error);
      setLoading(false);
    }
  }, [seasonId]);

  useEffect(() => {
    loadRankings();

    // Subscribe to ranking updates
    const channel = supabase
      .channel('season_rankings')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'creator_season_stats',
        },
        () => {
          loadRankings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadRankings]);

  const refresh = useCallback(() => {
    loadRankings();
  }, [loadRankings]);

  return {
    loading,
    rankings,
    userRank,
    refresh,
  };
}
