
import { supabase } from '@/app/integrations/supabase/client';

interface RankedStream {
  id: string;
  title: string;
  broadcaster_id: string;
  viewer_count: number;
  composite_score: number;
  users: any;
  playback_url?: string;
  status: string;
}

interface RankedCreator {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  composite_score: number;
  total_streams: number;
}

interface RankedReplay {
  id: string;
  title: string;
  broadcaster_id: string;
  replay_composite_score: number;
  replay_views: number;
  users: any;
  archived_url?: string;
}

export const recommendationService = {
  // Calculate composite score for a live stream
  calculateStreamScore(metrics: {
    viewerCount: number;
    avgWatchDuration: number;
    giftVolumeLast10min: number;
    commentRatePerMinute: number;
    followConversionRate: number;
  }): number {
    const weights = {
      viewerCount: 0.35,
      avgWatchDuration: 0.25,
      giftVolumeLast10min: 0.20,
      commentRatePerMinute: 0.15,
      followConversionRate: 0.05,
    };

    // Normalize values (simple normalization, can be improved)
    const normalizedViewers = Math.min(metrics.viewerCount / 1000, 1);
    const normalizedDuration = Math.min(metrics.avgWatchDuration / 3600, 1);
    const normalizedGifts = Math.min(metrics.giftVolumeLast10min / 10000, 1);
    const normalizedComments = Math.min(metrics.commentRatePerMinute / 100, 1);
    const normalizedFollows = Math.min(metrics.followConversionRate, 1);

    const score =
      normalizedViewers * weights.viewerCount +
      normalizedDuration * weights.avgWatchDuration +
      normalizedGifts * weights.giftVolumeLast10min +
      normalizedComments * weights.commentRatePerMinute +
      normalizedFollows * weights.followConversionRate;

    return score * 100; // Scale to 0-100
  },

  // Update stream ranking metrics
  async updateStreamMetrics(streamId: string, metrics: {
    viewerCount?: number;
    avgWatchDuration?: number;
    giftVolumeLast10min?: number;
    commentRatePerMinute?: number;
    followConversionRate?: number;
  }) {
    try {
      // Get current metrics
      const { data: current } = await supabase
        .from('stream_ranking_metrics')
        .select('*')
        .eq('stream_id', streamId)
        .maybeSingle();

      const updatedMetrics = {
        viewer_count: metrics.viewerCount ?? current?.viewer_count ?? 0,
        avg_watch_duration_seconds: metrics.avgWatchDuration ?? current?.avg_watch_duration_seconds ?? 0,
        gift_volume_last_10min: metrics.giftVolumeLast10min ?? current?.gift_volume_last_10min ?? 0,
        comment_rate_per_minute: metrics.commentRatePerMinute ?? current?.comment_rate_per_minute ?? 0,
        follow_conversion_rate: metrics.followConversionRate ?? current?.follow_conversion_rate ?? 0,
      };

      const compositeScore = this.calculateStreamScore({
        viewerCount: updatedMetrics.viewer_count,
        avgWatchDuration: updatedMetrics.avg_watch_duration_seconds,
        giftVolumeLast10min: updatedMetrics.gift_volume_last_10min,
        commentRatePerMinute: updatedMetrics.comment_rate_per_minute,
        followConversionRate: updatedMetrics.follow_conversion_rate,
      });

      const { error } = await supabase
        .from('stream_ranking_metrics')
        .upsert({
          stream_id: streamId,
          ...updatedMetrics,
          composite_score: compositeScore,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error updating stream metrics:', error);
        return { success: false, error };
      }

      return { success: true, compositeScore };
    } catch (error) {
      console.error('Error in updateStreamMetrics:', error);
      return { success: false, error };
    }
  },

  // Apply discovery boost for new creators
  async applyDiscoveryBoost(creatorId: string) {
    try {
      // Check if creator has less than 2 streams
      const { count } = await supabase
        .from('streams')
        .select('*', { count: 'exact', head: true })
        .eq('broadcaster_id', creatorId);

      if ((count || 0) < 2) {
        const boostExpiresAt = new Date();
        boostExpiresAt.setMinutes(boostExpiresAt.getMinutes() + 5);

        await supabase
          .from('creator_ranking_metrics')
          .upsert({
            creator_id: creatorId,
            discovery_boost_active: true,
            discovery_boost_expires_at: boostExpiresAt.toISOString(),
            updated_at: new Date().toISOString(),
          });

        return { success: true, boosted: true };
      }

      return { success: true, boosted: false };
    } catch (error) {
      console.error('Error in applyDiscoveryBoost:', error);
      return { success: false, error };
    }
  },

  // Get recommended live streams
  async getRecommendedLiveStreams(limit: number = 20): Promise<RankedStream[]> {
    try {
      const { data, error } = await supabase
        .from('streams')
        .select(`
          *,
          users(*),
          stream_ranking_metrics(*)
        `)
        .eq('status', 'live')
        .order('viewer_count', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching recommended streams:', error);
        return [];
      }

      // Calculate scores and sort
      const rankedStreams = (data || []).map((stream: any) => {
        const metrics = stream.stream_ranking_metrics?.[0];
        let score = metrics?.composite_score || 0;

        // Apply discovery boost if active
        const boostExpiresAt = stream.users?.creator_ranking_metrics?.[0]?.discovery_boost_expires_at;
        const boostActive = stream.users?.creator_ranking_metrics?.[0]?.discovery_boost_active;
        
        if (boostActive && boostExpiresAt && new Date(boostExpiresAt) > new Date()) {
          score *= 3; // 300% boost
        }

        return {
          ...stream,
          composite_score: score,
        };
      });

      rankedStreams.sort((a, b) => b.composite_score - a.composite_score);

      return rankedStreams;
    } catch (error) {
      console.error('Error in getRecommendedLiveStreams:', error);
      return [];
    }
  },

  // Get recommended replays
  async getRecommendedReplays(limit: number = 20): Promise<RankedReplay[]> {
    try {
      const { data, error } = await supabase
        .from('streams')
        .select(`
          *,
          users(*),
          replay_ranking_metrics(*)
        `)
        .eq('status', 'ended')
        .not('archived_url', 'is', null)
        .order('ended_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching recommended replays:', error);
        return [];
      }

      const rankedReplays = (data || []).map((stream: any) => {
        const metrics = stream.replay_ranking_metrics?.[0];
        return {
          ...stream,
          replay_composite_score: metrics?.replay_composite_score || 0,
          replay_views: metrics?.replay_views || 0,
        };
      });

      rankedReplays.sort((a, b) => b.replay_composite_score - a.replay_composite_score);

      return rankedReplays;
    } catch (error) {
      console.error('Error in getRecommendedReplays:', error);
      return [];
    }
  },

  // Get recommended users/creators
  async getRecommendedUsers(limit: number = 20): Promise<RankedCreator[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          creator_ranking_metrics(*)
        `)
        .order('followers_count', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching recommended users:', error);
        return [];
      }

      const rankedUsers = (data || []).map((user: any) => {
        const metrics = user.creator_ranking_metrics?.[0];
        return {
          ...user,
          composite_score: metrics?.composite_score || 0,
          total_streams: metrics?.total_streams || 0,
        };
      });

      rankedUsers.sort((a, b) => b.composite_score - a.composite_score);

      return rankedUsers;
    } catch (error) {
      console.error('Error in getRecommendedUsers:', error);
      return [];
    }
  },

  // Get trending creators
  async getTrendingCreators(limit: number = 10): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          creator_ranking_metrics(*),
          streams!streams_broadcaster_id_fkey(count)
        `)
        .order('followers_count', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching trending creators:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getTrendingCreators:', error);
      return [];
    }
  },

  // Get growing fast creators
  async getGrowingFastCreators(limit: number = 10): Promise<any[]> {
    try {
      // Get creators who gained followers recently
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          creator_ranking_metrics(*)
        `)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('followers_count', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching growing creators:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getGrowingFastCreators:', error);
      return [];
    }
  },

  // Get most supported creators (by gifts)
  async getMostSupportedCreators(limit: number = 10): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          creator_revenue_summary(total_from_gifts_cents)
        `)
        .order('creator_revenue_summary(total_from_gifts_cents)', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching most supported creators:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getMostSupportedCreators:', error);
      return [];
    }
  },

  // Get most gifted streams
  async getMostGiftedStreams(limit: number = 10): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('streams')
        .select(`
          *,
          users(*),
          gift_transactions(count)
        `)
        .eq('status', 'live')
        .order('gift_transactions(count)', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching most gifted streams:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getMostGiftedStreams:', error);
      return [];
    }
  },

  // Create replay metrics when stream ends
  async createReplayMetrics(streamId: string) {
    try {
      // Get original stream metrics
      const { data: streamMetrics } = await supabase
        .from('stream_ranking_metrics')
        .select('composite_score')
        .eq('stream_id', streamId)
        .maybeSingle();

      const originalScore = streamMetrics?.composite_score || 0;
      const replayScore = originalScore * 0.5; // 50% weight reduction

      const { error } = await supabase
        .from('replay_ranking_metrics')
        .insert({
          stream_id: streamId,
          original_composite_score: originalScore,
          replay_composite_score: replayScore,
          replay_views: 0,
        });

      if (error) {
        console.error('Error creating replay metrics:', error);
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in createReplayMetrics:', error);
      return { success: false, error };
    }
  },
};