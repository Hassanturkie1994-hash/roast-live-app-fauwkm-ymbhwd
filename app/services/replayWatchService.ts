
import { supabase } from '@/app/integrations/supabase/client';

export interface ReplayWatchLog {
  id: string;
  replay_id: string;
  viewer_id: string | null;
  watched_seconds: number;
  finished: boolean;
  liked: boolean;
  commented: boolean;
  shared: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReplayEngagementSummary {
  totalViews: number;
  averageWatchTime: number;
  completionRate: number;
  likeRate: number;
  commentRate: number;
  shareRate: number;
  dropOffPoints: {
    timestamp: number;
    percentage: number;
  }[];
}

class ReplayWatchService {
  /**
   * Start tracking a replay watch session
   */
  async startWatchSession(
    replayId: string,
    viewerId: string | null
  ): Promise<{ success: boolean; watchLogId?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('replay_watchlogs')
        .insert({
          replay_id: replayId,
          viewer_id: viewerId,
          watched_seconds: 0,
          finished: false,
          liked: false,
          commented: false,
          shared: false,
        })
        .select()
        .single();

      if (error) {
        console.error('Error starting watch session:', error);
        return { success: false, error: error.message };
      }

      return { success: true, watchLogId: data.id };
    } catch (error) {
      console.error('Error in startWatchSession:', error);
      return { success: false, error: 'Failed to start watch session' };
    }
  }

  /**
   * Update watch progress
   */
  async updateWatchProgress(
    watchLogId: string,
    watchedSeconds: number,
    totalDuration: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const finished = watchedSeconds >= totalDuration * 0.95; // 95% completion counts as finished

      const { error } = await supabase
        .from('replay_watchlogs')
        .update({
          watched_seconds: watchedSeconds,
          finished,
          updated_at: new Date().toISOString(),
        })
        .eq('id', watchLogId);

      if (error) {
        console.error('Error updating watch progress:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in updateWatchProgress:', error);
      return { success: false, error: 'Failed to update watch progress' };
    }
  }

  /**
   * Mark replay as liked
   */
  async markAsLiked(watchLogId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('replay_watchlogs')
        .update({
          liked: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', watchLogId);

      if (error) {
        console.error('Error marking as liked:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in markAsLiked:', error);
      return { success: false, error: 'Failed to mark as liked' };
    }
  }

  /**
   * Mark replay as commented
   */
  async markAsCommented(watchLogId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('replay_watchlogs')
        .update({
          commented: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', watchLogId);

      if (error) {
        console.error('Error marking as commented:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in markAsCommented:', error);
      return { success: false, error: 'Failed to mark as commented' };
    }
  }

  /**
   * Mark replay as shared
   */
  async markAsShared(watchLogId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('replay_watchlogs')
        .update({
          shared: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', watchLogId);

      if (error) {
        console.error('Error marking as shared:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in markAsShared:', error);
      return { success: false, error: 'Failed to mark as shared' };
    }
  }

  /**
   * Get engagement summary for a replay
   */
  async getEngagementSummary(replayId: string): Promise<ReplayEngagementSummary | null> {
    try {
      const { data: watchLogs, error } = await supabase
        .from('replay_watchlogs')
        .select('*')
        .eq('replay_id', replayId);

      if (error || !watchLogs || watchLogs.length === 0) {
        console.error('Error fetching watch logs:', error);
        return null;
      }

      const totalViews = watchLogs.length;
      const totalWatchTime = watchLogs.reduce((sum, log) => sum + log.watched_seconds, 0);
      const averageWatchTime = totalWatchTime / totalViews;

      const finishedCount = watchLogs.filter((log) => log.finished).length;
      const likedCount = watchLogs.filter((log) => log.liked).length;
      const commentedCount = watchLogs.filter((log) => log.commented).length;
      const sharedCount = watchLogs.filter((log) => log.shared).length;

      const completionRate = (finishedCount / totalViews) * 100;
      const likeRate = (likedCount / totalViews) * 100;
      const commentRate = (commentedCount / totalViews) * 100;
      const shareRate = (sharedCount / totalViews) * 100;

      // Calculate drop-off points
      const dropOffPoints = this.calculateDropOffPoints(watchLogs);

      return {
        totalViews,
        averageWatchTime: Math.round(averageWatchTime),
        completionRate: Math.round(completionRate),
        likeRate: Math.round(likeRate),
        commentRate: Math.round(commentRate),
        shareRate: Math.round(shareRate),
        dropOffPoints,
      };
    } catch (error) {
      console.error('Error in getEngagementSummary:', error);
      return null;
    }
  }

  /**
   * Calculate drop-off points (where viewers stop watching)
   */
  private calculateDropOffPoints(
    watchLogs: ReplayWatchLog[]
  ): { timestamp: number; percentage: number }[] {
    // Group watch times into 30-second buckets
    const bucketSize = 30; // seconds
    const buckets = new Map<number, number>();

    for (const log of watchLogs) {
      if (!log.finished) {
        const bucket = Math.floor(log.watched_seconds / bucketSize) * bucketSize;
        buckets.set(bucket, (buckets.get(bucket) || 0) + 1);
      }
    }

    // Convert to array and calculate percentages
    const dropOffPoints: { timestamp: number; percentage: number }[] = [];
    const totalViews = watchLogs.length;

    for (const [timestamp, count] of buckets.entries()) {
      const percentage = (count / totalViews) * 100;
      if (percentage > 5) {
        // Only include significant drop-off points (>5%)
        dropOffPoints.push({
          timestamp,
          percentage: Math.round(percentage),
        });
      }
    }

    // Sort by percentage (highest first)
    dropOffPoints.sort((a, b) => b.percentage - a.percentage);

    // Return top 5 drop-off points
    return dropOffPoints.slice(0, 5);
  }

  /**
   * Get watch log for a specific viewer and replay
   */
  async getWatchLog(
    replayId: string,
    viewerId: string | null
  ): Promise<ReplayWatchLog | null> {
    try {
      if (!viewerId) return null;

      const { data, error } = await supabase
        .from('replay_watchlogs')
        .select('*')
        .eq('replay_id', replayId)
        .eq('viewer_id', viewerId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching watch log:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getWatchLog:', error);
      return null;
    }
  }
}

export const replayWatchService = new ReplayWatchService();