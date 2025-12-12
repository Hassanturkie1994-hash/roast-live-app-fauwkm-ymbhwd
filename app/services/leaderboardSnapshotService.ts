
import { supabase } from '@/app/integrations/supabase/client';

export interface LeaderboardSnapshot {
  id: string;
  snapshot_date: string;
  period_type: 'daily' | 'weekly' | 'monthly';
  leaderboard_type: 'top_creators_gifts' | 'top_fans_gifts' | 'most_active_comments' | 'fastest_growing_followers';
  user_id: string;
  rank: number;
  score: number;
  metadata: any;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
    premium_active: boolean;
  };
}

class LeaderboardSnapshotService {
  /**
   * Get leaderboard for a specific period and type
   */
  async getLeaderboard(
    periodType: 'daily' | 'weekly' | 'monthly',
    leaderboardType: 'top_creators_gifts' | 'top_fans_gifts' | 'most_active_comments' | 'fastest_growing_followers',
    limit: number = 100
  ): Promise<LeaderboardSnapshot[]> {
    try {
      // Get the most recent snapshot date for this period
      const { data: latestSnapshot, error: dateError } = await supabase
        .from('leaderboard_snapshots')
        .select('snapshot_date')
        .eq('period_type', periodType)
        .eq('leaderboard_type', leaderboardType)
        .order('snapshot_date', { ascending: false })
        .limit(1)
        .single();

      if (dateError || !latestSnapshot) {
        console.log('No snapshots found for:', periodType, leaderboardType);
        return [];
      }

      const { data, error } = await supabase
        .from('leaderboard_snapshots')
        .select(`
          *,
          user:profiles!leaderboard_snapshots_user_id_fkey(
            id,
            username,
            display_name,
            avatar_url,
            premium_active
          )
        `)
        .eq('snapshot_date', latestSnapshot.snapshot_date)
        .eq('period_type', periodType)
        .eq('leaderboard_type', leaderboardType)
        .order('rank', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error fetching leaderboard:', error);
        return [];
      }

      return data as LeaderboardSnapshot[];
    } catch (error) {
      console.error('Error in getLeaderboard:', error);
      return [];
    }
  }

  /**
   * Get user's rank in a specific leaderboard
   */
  async getUserRank(
    userId: string,
    periodType: 'daily' | 'weekly' | 'monthly',
    leaderboardType: 'top_creators_gifts' | 'top_fans_gifts' | 'most_active_comments' | 'fastest_growing_followers'
  ): Promise<{ rank: number; score: number; total: number } | null> {
    try {
      // Get the most recent snapshot date
      const { data: latestSnapshot, error: dateError } = await supabase
        .from('leaderboard_snapshots')
        .select('snapshot_date')
        .eq('period_type', periodType)
        .eq('leaderboard_type', leaderboardType)
        .order('snapshot_date', { ascending: false })
        .limit(1)
        .single();

      if (dateError || !latestSnapshot) {
        return null;
      }

      // Get user's entry
      const { data: userEntry, error: userError } = await supabase
        .from('leaderboard_snapshots')
        .select('rank, score')
        .eq('snapshot_date', latestSnapshot.snapshot_date)
        .eq('period_type', periodType)
        .eq('leaderboard_type', leaderboardType)
        .eq('user_id', userId)
        .single();

      if (userError || !userEntry) {
        return null;
      }

      // Get total count
      const { count, error: countError } = await supabase
        .from('leaderboard_snapshots')
        .select('*', { count: 'exact', head: true })
        .eq('snapshot_date', latestSnapshot.snapshot_date)
        .eq('period_type', periodType)
        .eq('leaderboard_type', leaderboardType);

      if (countError) {
        console.error('Error getting total count:', countError);
        return {
          rank: userEntry.rank,
          score: userEntry.score,
          total: 0,
        };
      }

      return {
        rank: userEntry.rank,
        score: userEntry.score,
        total: count || 0,
      };
    } catch (error) {
      console.error('Error in getUserRank:', error);
      return null;
    }
  }

  /**
   * Get user's leaderboard history
   */
  async getUserHistory(
    userId: string,
    periodType: 'daily' | 'weekly' | 'monthly',
    leaderboardType: 'top_creators_gifts' | 'top_fans_gifts' | 'most_active_comments' | 'fastest_growing_followers',
    limit: number = 30
  ): Promise<LeaderboardSnapshot[]> {
    try {
      const { data, error } = await supabase
        .from('leaderboard_snapshots')
        .select('*')
        .eq('user_id', userId)
        .eq('period_type', periodType)
        .eq('leaderboard_type', leaderboardType)
        .order('snapshot_date', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching user history:', error);
        return [];
      }

      return data as LeaderboardSnapshot[];
    } catch (error) {
      console.error('Error in getUserHistory:', error);
      return [];
    }
  }

  /**
   * Get top 10 for all leaderboard types (for dashboard)
   */
  async getAllLeaderboardsTop10(
    periodType: 'daily' | 'weekly' | 'monthly'
  ): Promise<{
    topCreators: LeaderboardSnapshot[];
    topFans: LeaderboardSnapshot[];
    mostActive: LeaderboardSnapshot[];
    fastestGrowing: LeaderboardSnapshot[];
  }> {
    try {
      const [topCreators, topFans, mostActive, fastestGrowing] = await Promise.all([
        this.getLeaderboard(periodType, 'top_creators_gifts', 10),
        this.getLeaderboard(periodType, 'top_fans_gifts', 10),
        this.getLeaderboard(periodType, 'most_active_comments', 10),
        this.getLeaderboard(periodType, 'fastest_growing_followers', 10),
      ]);

      return {
        topCreators,
        topFans,
        mostActive,
        fastestGrowing,
      };
    } catch (error) {
      console.error('Error in getAllLeaderboardsTop10:', error);
      return {
        topCreators: [],
        topFans: [],
        mostActive: [],
        fastestGrowing: [],
      };
    }
  }

  /**
   * Trigger leaderboard calculation (admin only)
   */
  async triggerCalculation(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(
        `${supabase.supabaseUrl}/functions/v1/calculate-leaderboards-daily`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.message || 'Failed to trigger calculation' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error triggering calculation:', error);
      return { success: false, error: 'Failed to trigger calculation' };
    }
  }
}

export const leaderboardSnapshotService = new LeaderboardSnapshotService();