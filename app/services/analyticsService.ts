
import { supabase } from '@/app/integrations/supabase/client';

export interface StreamMetrics {
  id: string;
  stream_id: string;
  creator_id: string;
  created_at: string;
  ended_at: string | null;
  avg_session_length_seconds: number;
  peak_viewers: number;
  total_unique_viewers: number;
  total_gift_value: number;
  total_messages_sent: number;
  bounce_rate_percent: number;
  returning_viewers_count: number;
  guest_count: number;
}

export interface ViewerEvent {
  id: string;
  stream_id: string;
  viewer_id: string;
  joined_at: string;
  left_at: string | null;
  device_type: 'mobile' | 'web' | 'tablet';
  was_following_before_join: boolean;
  gifted_amount: number;
  messages_sent: number;
}

export interface CreatorPerformanceScore {
  id: string;
  creator_id: string;
  last_7_days_score: number;
  last_30_days_score: number;
  lifetime_score: number;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsSummary {
  latestStream: {
    peakViewers: number;
    totalWatchTime: number;
    totalRevenue: number;
    followerConversion: number;
    avgSessionDuration: number;
  };
  trends: {
    viewershipData: { date: string; viewers: number }[];
    followersGained: { date: string; followers: number }[];
    retentionRate: { date: string; rate: number }[];
  };
  earnings: {
    totalGiftValue: number;
    topGifters: { userId: string; username: string; amount: number }[];
    conversionFunnel: {
      viewers: number;
      chatters: number;
      gifters: number;
    };
  };
  audienceSegments: {
    newViewers: number;
    returningViewers: number;
    loyalCore: number;
  };
}

class AnalyticsService {
  // Track viewer joining a stream
  async trackViewerJoin(
    streamId: string,
    viewerId: string,
    deviceType: 'mobile' | 'web' | 'tablet',
    wasFollowing: boolean
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from('viewer_events').insert({
        stream_id: streamId,
        viewer_id: viewerId,
        device_type: deviceType,
        was_following_before_join: wasFollowing,
        joined_at: new Date().toISOString(),
      });

      if (error) {
        console.error('Error tracking viewer join:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in trackViewerJoin:', error);
      return { success: false, error: 'Failed to track viewer join' };
    }
  }

  // Track viewer leaving a stream
  async trackViewerLeave(
    streamId: string,
    viewerId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('viewer_events')
        .update({ left_at: new Date().toISOString() })
        .eq('stream_id', streamId)
        .eq('viewer_id', viewerId)
        .is('left_at', null);

      if (error) {
        console.error('Error tracking viewer leave:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in trackViewerLeave:', error);
      return { success: false, error: 'Failed to track viewer leave' };
    }
  }

  // Update viewer event with gift amount
  async updateViewerGiftAmount(
    streamId: string,
    viewerId: string,
    giftAmount: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: event } = await supabase
        .from('viewer_events')
        .select('gifted_amount')
        .eq('stream_id', streamId)
        .eq('viewer_id', viewerId)
        .is('left_at', null)
        .single();

      if (!event) {
        return { success: false, error: 'Viewer event not found' };
      }

      const { error } = await supabase
        .from('viewer_events')
        .update({ gifted_amount: (event.gifted_amount || 0) + giftAmount })
        .eq('stream_id', streamId)
        .eq('viewer_id', viewerId)
        .is('left_at', null);

      if (error) {
        console.error('Error updating viewer gift amount:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in updateViewerGiftAmount:', error);
      return { success: false, error: 'Failed to update viewer gift amount' };
    }
  }

  // Update viewer event with message count
  async incrementViewerMessageCount(
    streamId: string,
    viewerId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: event } = await supabase
        .from('viewer_events')
        .select('messages_sent')
        .eq('stream_id', streamId)
        .eq('viewer_id', viewerId)
        .is('left_at', null)
        .single();

      if (!event) {
        return { success: false, error: 'Viewer event not found' };
      }

      const { error } = await supabase
        .from('viewer_events')
        .update({ messages_sent: (event.messages_sent || 0) + 1 })
        .eq('stream_id', streamId)
        .eq('viewer_id', viewerId)
        .is('left_at', null);

      if (error) {
        console.error('Error incrementing viewer message count:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in incrementViewerMessageCount:', error);
      return { success: false, error: 'Failed to increment viewer message count' };
    }
  }

  // Calculate and store stream metrics after stream ends
  async calculateStreamMetrics(streamId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get stream info
      const { data: stream } = await supabase
        .from('streams')
        .select('broadcaster_id, started_at, ended_at')
        .eq('id', streamId)
        .single();

      if (!stream) {
        return { success: false, error: 'Stream not found' };
      }

      // Get all viewer events for this stream
      const { data: viewerEvents } = await supabase
        .from('viewer_events')
        .select('*')
        .eq('stream_id', streamId);

      if (!viewerEvents || viewerEvents.length === 0) {
        return { success: false, error: 'No viewer events found' };
      }

      // Calculate metrics
      const totalUniqueViewers = viewerEvents.length;
      const peakViewers = await this.calculatePeakViewers(streamId);
      const avgSessionLength = this.calculateAvgSessionLength(viewerEvents);
      const bounceRate = this.calculateBounceRate(viewerEvents);
      const returningViewers = viewerEvents.filter((e) => e.was_following_before_join).length;
      const totalGiftValue = viewerEvents.reduce((sum, e) => sum + (e.gifted_amount || 0), 0);
      const totalMessages = viewerEvents.reduce((sum, e) => sum + (e.messages_sent || 0), 0);

      // Get guest count
      const { count: guestCount } = await supabase
        .from('stream_guest_seats')
        .select('*', { count: 'exact', head: true })
        .eq('stream_id', streamId)
        .not('user_id', 'is', null);

      // Insert stream metrics
      const { error } = await supabase.from('stream_metrics').insert({
        stream_id: streamId,
        creator_id: stream.broadcaster_id,
        created_at: stream.started_at,
        ended_at: stream.ended_at || new Date().toISOString(),
        avg_session_length_seconds: avgSessionLength,
        peak_viewers: peakViewers,
        total_unique_viewers: totalUniqueViewers,
        total_gift_value: totalGiftValue,
        total_messages_sent: totalMessages,
        bounce_rate_percent: bounceRate,
        returning_viewers_count: returningViewers,
        guest_count: guestCount || 0,
      });

      if (error) {
        console.error('Error inserting stream metrics:', error);
        return { success: false, error: error.message };
      }

      // Update creator performance scores
      await this.updateCreatorPerformanceScores(stream.broadcaster_id);

      return { success: true };
    } catch (error) {
      console.error('Error in calculateStreamMetrics:', error);
      return { success: false, error: 'Failed to calculate stream metrics' };
    }
  }

  // Calculate peak viewers for a stream
  private async calculatePeakViewers(streamId: string): Promise<number> {
    try {
      const { data: events } = await supabase
        .from('viewer_events')
        .select('joined_at, left_at')
        .eq('stream_id', streamId);

      if (!events || events.length === 0) return 0;

      // Create timeline of join/leave events
      const timeline: { time: Date; delta: number }[] = [];
      events.forEach((event) => {
        timeline.push({ time: new Date(event.joined_at), delta: 1 });
        if (event.left_at) {
          timeline.push({ time: new Date(event.left_at), delta: -1 });
        }
      });

      // Sort by time
      timeline.sort((a, b) => a.time.getTime() - b.time.getTime());

      // Calculate peak
      let currentViewers = 0;
      let peakViewers = 0;
      timeline.forEach((event) => {
        currentViewers += event.delta;
        peakViewers = Math.max(peakViewers, currentViewers);
      });

      return peakViewers;
    } catch (error) {
      console.error('Error calculating peak viewers:', error);
      return 0;
    }
  }

  // Calculate average session length
  private calculateAvgSessionLength(viewerEvents: any[]): number {
    const completedSessions = viewerEvents.filter((e) => e.left_at);
    if (completedSessions.length === 0) return 0;

    const totalSeconds = completedSessions.reduce((sum, event) => {
      const joined = new Date(event.joined_at).getTime();
      const left = new Date(event.left_at).getTime();
      return sum + (left - joined) / 1000;
    }, 0);

    return Math.round(totalSeconds / completedSessions.length);
  }

  // Calculate bounce rate (viewers who leave within 20 seconds)
  private calculateBounceRate(viewerEvents: any[]): number {
    const completedSessions = viewerEvents.filter((e) => e.left_at);
    if (completedSessions.length === 0) return 0;

    const bounced = completedSessions.filter((event) => {
      const joined = new Date(event.joined_at).getTime();
      const left = new Date(event.left_at).getTime();
      return (left - joined) / 1000 < 20;
    }).length;

    return Math.round((bounced / completedSessions.length) * 100);
  }

  // Update creator performance scores
  async updateCreatorPerformanceScores(creatorId: string): Promise<void> {
    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Get metrics for last 7 days
      const { data: last7Days } = await supabase
        .from('stream_metrics')
        .select('*')
        .eq('creator_id', creatorId)
        .gte('created_at', sevenDaysAgo.toISOString());

      // Get metrics for last 30 days
      const { data: last30Days } = await supabase
        .from('stream_metrics')
        .select('*')
        .eq('creator_id', creatorId)
        .gte('created_at', thirtyDaysAgo.toISOString());

      // Get all-time metrics
      const { data: lifetime } = await supabase
        .from('stream_metrics')
        .select('*')
        .eq('creator_id', creatorId);

      const score7Days = this.calculatePerformanceScore(last7Days || []);
      const score30Days = this.calculatePerformanceScore(last30Days || []);
      const scoreLifetime = this.calculatePerformanceScore(lifetime || []);

      // Upsert performance scores
      await supabase
        .from('creator_performance_scores')
        .upsert(
          {
            creator_id: creatorId,
            last_7_days_score: score7Days,
            last_30_days_score: score30Days,
            lifetime_score: scoreLifetime,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'creator_id' }
        );
    } catch (error) {
      console.error('Error updating creator performance scores:', error);
    }
  }

  // Calculate performance score based on metrics
  private calculatePerformanceScore(metrics: any[]): number {
    if (metrics.length === 0) return 0;

    // Weighted scoring algorithm
    const avgWatchDuration =
      metrics.reduce((sum, m) => sum + m.avg_session_length_seconds, 0) / metrics.length;
    const avgGiftConversion =
      metrics.reduce((sum, m) => sum + m.total_gift_value, 0) / metrics.length;
    const avgReturningViewers =
      metrics.reduce((sum, m) => sum + m.returning_viewers_count, 0) / metrics.length;
    const avgTotalViewers =
      metrics.reduce((sum, m) => sum + m.total_unique_viewers, 0) / metrics.length;

    // Normalize and weight each factor (0-100 scale)
    const watchScore = Math.min((avgWatchDuration / 600) * 25, 25); // Max 25 points for 10+ min avg
    const giftScore = Math.min((avgGiftConversion / 100) * 25, 25); // Max 25 points for 100+ SEK avg
    const retentionScore = Math.min((avgReturningViewers / avgTotalViewers) * 25, 25); // Max 25 points for 100% retention
    const viewerScore = Math.min((avgTotalViewers / 100) * 25, 25); // Max 25 points for 100+ viewers avg

    return Math.round(watchScore + giftScore + retentionScore + viewerScore);
  }

  // Get analytics summary for creator dashboard
  async getAnalyticsSummary(creatorId: string): Promise<AnalyticsSummary | null> {
    try {
      // Get latest stream metrics
      const { data: latestMetrics } = await supabase
        .from('stream_metrics')
        .select('*')
        .eq('creator_id', creatorId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!latestMetrics) {
        return null;
      }

      // Get trend data for last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const { data: trendMetrics } = await supabase
        .from('stream_metrics')
        .select('*')
        .eq('creator_id', creatorId)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      // Get top gifters
      const { data: topGifters } = await supabase
        .from('viewer_events')
        .select('viewer_id, gifted_amount, profiles(username)')
        .eq('stream_id', latestMetrics.stream_id)
        .order('gifted_amount', { ascending: false })
        .limit(10);

      // Calculate conversion funnel
      const { data: allViewers } = await supabase
        .from('viewer_events')
        .select('messages_sent, gifted_amount')
        .eq('stream_id', latestMetrics.stream_id);

      const viewers = allViewers?.length || 0;
      const chatters = allViewers?.filter((v) => v.messages_sent > 0).length || 0;
      const gifters = allViewers?.filter((v) => v.gifted_amount > 0).length || 0;

      // Calculate audience segments
      const newViewers = allViewers?.filter((v) => !v.was_following_before_join).length || 0;
      const returningViewers = latestMetrics.returning_viewers_count;
      const loyalCore = allViewers?.filter((v) => v.messages_sent > 5 && v.gifted_amount > 0).length || 0;

      return {
        latestStream: {
          peakViewers: latestMetrics.peak_viewers,
          totalWatchTime: latestMetrics.avg_session_length_seconds * latestMetrics.total_unique_viewers,
          totalRevenue: latestMetrics.total_gift_value,
          followerConversion: Math.round((returningViewers / latestMetrics.total_unique_viewers) * 100),
          avgSessionDuration: latestMetrics.avg_session_length_seconds,
        },
        trends: {
          viewershipData:
            trendMetrics?.map((m) => ({
              date: new Date(m.created_at).toLocaleDateString(),
              viewers: m.total_unique_viewers,
            })) || [],
          followersGained:
            trendMetrics?.map((m) => ({
              date: new Date(m.created_at).toLocaleDateString(),
              followers: m.returning_viewers_count,
            })) || [],
          retentionRate:
            trendMetrics?.map((m) => ({
              date: new Date(m.created_at).toLocaleDateString(),
              rate: Math.round((m.returning_viewers_count / m.total_unique_viewers) * 100),
            })) || [],
        },
        earnings: {
          totalGiftValue: latestMetrics.total_gift_value,
          topGifters:
            topGifters?.map((g: any) => ({
              userId: g.viewer_id,
              username: g.profiles?.username || 'Unknown',
              amount: g.gifted_amount,
            })) || [],
          conversionFunnel: {
            viewers,
            chatters,
            gifters,
          },
        },
        audienceSegments: {
          newViewers,
          returningViewers,
          loyalCore,
        },
      };
    } catch (error) {
      console.error('Error getting analytics summary:', error);
      return null;
    }
  }

  // Get creator performance score
  async getCreatorPerformanceScore(
    creatorId: string
  ): Promise<CreatorPerformanceScore | null> {
    try {
      const { data, error } = await supabase
        .from('creator_performance_scores')
        .select('*')
        .eq('creator_id', creatorId)
        .single();

      if (error) {
        console.error('Error fetching creator performance score:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getCreatorPerformanceScore:', error);
      return null;
    }
  }

  // Get admin analytics data
  async getAdminAnalytics(): Promise<{
    activeStreams: any[];
    growthLeaderboard: any[];
    flaggedStreams: any[];
    earningsSummary: { daily: number; weekly: number };
  }> {
    try {
      // Get active streams with current metrics
      const { data: activeStreams } = await supabase
        .from('streams')
        .select(
          `
          id,
          title,
          broadcaster_id,
          viewer_count,
          started_at,
          profiles!streams_broadcaster_id_fkey(username, display_name, avatar_url)
        `
        )
        .eq('status', 'live')
        .order('viewer_count', { ascending: false });

      // Get growth leaderboard (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const { data: growthData } = await supabase
        .from('stream_metrics')
        .select(
          `
          creator_id,
          avg_session_length_seconds,
          total_gift_value,
          profiles!stream_metrics_creator_id_fkey(username, display_name, avatar_url)
        `
        )
        .gte('created_at', sevenDaysAgo.toISOString());

      // Aggregate growth data by creator
      const creatorStats = new Map();
      growthData?.forEach((metric) => {
        const existing = creatorStats.get(metric.creator_id) || {
          creator_id: metric.creator_id,
          username: metric.profiles?.username,
          display_name: metric.profiles?.display_name,
          avatar_url: metric.profiles?.avatar_url,
          streams_hosted: 0,
          avg_session_duration: 0,
          total_gifts: 0,
          score: 0,
        };

        existing.streams_hosted += 1;
        existing.avg_session_duration += metric.avg_session_length_seconds;
        existing.total_gifts += metric.total_gift_value;

        creatorStats.set(metric.creator_id, existing);
      });

      // Calculate averages and scores
      const growthLeaderboard = Array.from(creatorStats.values())
        .map((stat) => ({
          ...stat,
          avg_session_duration: Math.round(stat.avg_session_duration / stat.streams_hosted),
          score: Math.round(
            (stat.avg_session_duration / stat.streams_hosted / 10 +
              stat.total_gifts / 10 +
              stat.streams_hosted * 10) /
              3
          ),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 20);

      // Get flagged streams (high report count)
      const { data: flaggedStreams } = await supabase
        .from('streams')
        .select(
          `
          id,
          title,
          broadcaster_id,
          report_count,
          profiles!streams_broadcaster_id_fkey(username, display_name)
        `
        )
        .gt('report_count', 0)
        .order('report_count', { ascending: false })
        .limit(20);

      // Get earnings summary
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const { data: dailyEarnings } = await supabase
        .from('stream_metrics')
        .select('total_gift_value')
        .gte('created_at', oneDayAgo.toISOString());

      const { data: weeklyEarnings } = await supabase
        .from('stream_metrics')
        .select('total_gift_value')
        .gte('created_at', oneWeekAgo.toISOString());

      const daily = dailyEarnings?.reduce((sum, m) => sum + m.total_gift_value, 0) || 0;
      const weekly = weeklyEarnings?.reduce((sum, m) => sum + m.total_gift_value, 0) || 0;

      return {
        activeStreams: activeStreams || [],
        growthLeaderboard,
        flaggedStreams: flaggedStreams || [],
        earningsSummary: { daily, weekly },
      };
    } catch (error) {
      console.error('Error getting admin analytics:', error);
      return {
        activeStreams: [],
        growthLeaderboard: [],
        flaggedStreams: [],
        earningsSummary: { daily: 0, weekly: 0 },
      };
    }
  }
}

export const analyticsService = new AnalyticsService();