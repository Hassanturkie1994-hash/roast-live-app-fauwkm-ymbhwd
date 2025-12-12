
import { supabase } from '@/app/integrations/supabase/client';

export interface StreamReplay {
  id: string;
  stream_id: string;
  creator_id: string;
  replay_url: string;
  thumbnail_url: string | null;
  total_duration_seconds: number;
  started_at: string;
  ended_at: string;
  title: string;
  views_count: number;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
}

export interface ReplayView {
  id: string;
  replay_id: string;
  user_id: string | null;
  watched_duration_seconds: number;
  watch_percentage: number;
  created_at: string;
}

export interface ReplayComment {
  id: string;
  replay_id: string;
  user_id: string;
  comment: string;
  parent_comment_id: string | null;
  likes_count: number;
  created_at: string;
  user?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
  };
  replies?: ReplayComment[];
}

export interface ReplayAnalytics {
  id: string;
  replay_id: string;
  total_views: number;
  avg_watch_percentage: number;
  new_followers_gained: number;
  peak_concurrent_viewers: number;
  most_watched_timestamp: number | null;
  updated_at: string;
  created_at: string;
}

class ReplayService {
  /**
   * Create a replay from a stream
   */
  async createReplay(
    streamId: string,
    creatorId: string,
    replayUrl: string,
    title: string,
    startedAt: string,
    endedAt: string,
    thumbnailUrl?: string
  ): Promise<{ success: boolean; data?: StreamReplay; error?: string }> {
    try {
      const durationSeconds = Math.floor(
        (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000
      );

      const { data, error } = await supabase
        .from('stream_replays')
        .insert({
          stream_id: streamId,
          creator_id: creatorId,
          replay_url: replayUrl,
          thumbnail_url: thumbnailUrl,
          total_duration_seconds: durationSeconds,
          started_at: startedAt,
          ended_at: endedAt,
          title,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating replay:', error);
        return { success: false, error: error.message };
      }

      // Create analytics record
      await supabase.from('replay_analytics').insert({
        replay_id: data.id,
      });

      console.log('✅ Replay created successfully');
      return { success: true, data: data as StreamReplay };
    } catch (error) {
      console.error('Error in createReplay:', error);
      return { success: false, error: 'Failed to create replay' };
    }
  }

  /**
   * Get replay by ID
   */
  async getReplay(replayId: string): Promise<StreamReplay | null> {
    try {
      const { data, error } = await supabase
        .from('stream_replays')
        .select('*')
        .eq('id', replayId)
        .single();

      if (error) {
        console.error('Error fetching replay:', error);
        return null;
      }

      return data as StreamReplay;
    } catch (error) {
      console.error('Error in getReplay:', error);
      return null;
    }
  }

  /**
   * Get replays by creator
   */
  async getCreatorReplays(creatorId: string): Promise<StreamReplay[]> {
    try {
      const { data, error } = await supabase
        .from('stream_replays')
        .select('*')
        .eq('creator_id', creatorId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching creator replays:', error);
        return [];
      }

      return data as StreamReplay[];
    } catch (error) {
      console.error('Error in getCreatorReplays:', error);
      return [];
    }
  }

  /**
   * Delete a replay
   */
  async deleteReplay(
    replayId: string,
    creatorId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('stream_replays')
        .delete()
        .eq('id', replayId)
        .eq('creator_id', creatorId);

      if (error) {
        console.error('Error deleting replay:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Replay deleted successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in deleteReplay:', error);
      return { success: false, error: 'Failed to delete replay' };
    }
  }

  /**
   * Track a replay view
   */
  async trackView(
    replayId: string,
    userId: string | null,
    watchedDurationSeconds: number,
    totalDurationSeconds: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const watchPercentage = (watchedDurationSeconds / totalDurationSeconds) * 100;

      const { error } = await supabase.from('replay_views').insert({
        replay_id: replayId,
        user_id: userId,
        watched_duration_seconds: watchedDurationSeconds,
        watch_percentage: watchPercentage,
      });

      if (error) {
        console.error('Error tracking view:', error);
        return { success: false, error: error.message };
      }

      // Increment views count
      await supabase.rpc('increment_replay_views', { replay_id: replayId });

      // Update analytics
      await this.updateAnalytics(replayId);

      return { success: true };
    } catch (error) {
      console.error('Error in trackView:', error);
      return { success: false, error: 'Failed to track view' };
    }
  }

  /**
   * Get replay comments
   */
  async getComments(replayId: string): Promise<ReplayComment[]> {
    try {
      const { data, error } = await supabase
        .from('replay_comments')
        .select(`
          *,
          user:profiles!replay_comments_user_id_fkey(
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('replay_id', replayId)
        .is('parent_comment_id', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching comments:', error);
        return [];
      }

      // Get replies for each comment
      const commentsWithReplies = await Promise.all(
        (data as ReplayComment[]).map(async (comment) => {
          const replies = await this.getCommentReplies(comment.id);
          return { ...comment, replies };
        })
      );

      return commentsWithReplies;
    } catch (error) {
      console.error('Error in getComments:', error);
      return [];
    }
  }

  /**
   * Get comment replies
   */
  private async getCommentReplies(commentId: string): Promise<ReplayComment[]> {
    try {
      const { data, error } = await supabase
        .from('replay_comments')
        .select(`
          *,
          user:profiles!replay_comments_user_id_fkey(
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('parent_comment_id', commentId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching replies:', error);
        return [];
      }

      return data as ReplayComment[];
    } catch (error) {
      console.error('Error in getCommentReplies:', error);
      return [];
    }
  }

  /**
   * Add a comment
   */
  async addComment(
    replayId: string,
    userId: string,
    comment: string,
    parentCommentId?: string
  ): Promise<{ success: boolean; data?: ReplayComment; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('replay_comments')
        .insert({
          replay_id: replayId,
          user_id: userId,
          comment,
          parent_comment_id: parentCommentId,
        })
        .select(`
          *,
          user:profiles!replay_comments_user_id_fkey(
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .single();

      if (error) {
        console.error('Error adding comment:', error);
        return { success: false, error: error.message };
      }

      // Increment comments count
      await supabase.rpc('increment_replay_comments', { replay_id: replayId });

      return { success: true, data: data as ReplayComment };
    } catch (error) {
      console.error('Error in addComment:', error);
      return { success: false, error: 'Failed to add comment' };
    }
  }

  /**
   * Like a replay
   */
  async likeReplay(
    replayId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from('replay_likes').insert({
        replay_id: replayId,
        user_id: userId,
      });

      if (error) {
        console.error('Error liking replay:', error);
        return { success: false, error: error.message };
      }

      // Increment likes count
      await supabase.rpc('increment_replay_likes', { replay_id: replayId });

      return { success: true };
    } catch (error) {
      console.error('Error in likeReplay:', error);
      return { success: false, error: 'Failed to like replay' };
    }
  }

  /**
   * Unlike a replay
   */
  async unlikeReplay(
    replayId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('replay_likes')
        .delete()
        .eq('replay_id', replayId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error unliking replay:', error);
        return { success: false, error: error.message };
      }

      // Decrement likes count
      await supabase.rpc('decrement_replay_likes', { replay_id: replayId });

      return { success: true };
    } catch (error) {
      console.error('Error in unlikeReplay:', error);
      return { success: false, error: 'Failed to unlike replay' };
    }
  }

  /**
   * Get replay analytics
   */
  async getAnalytics(replayId: string): Promise<ReplayAnalytics | null> {
    try {
      const { data, error } = await supabase
        .from('replay_analytics')
        .select('*')
        .eq('replay_id', replayId)
        .single();

      if (error) {
        console.error('Error fetching analytics:', error);
        return null;
      }

      return data as ReplayAnalytics;
    } catch (error) {
      console.error('Error in getAnalytics:', error);
      return null;
    }
  }

  /**
   * Update replay analytics
   */
  private async updateAnalytics(replayId: string): Promise<void> {
    try {
      // Get all views
      const { data: views, error: viewsError } = await supabase
        .from('replay_views')
        .select('watch_percentage')
        .eq('replay_id', replayId);

      if (viewsError || !views) {
        console.error('Error fetching views for analytics:', viewsError);
        return;
      }

      // Calculate average watch percentage
      const avgWatchPercentage =
        views.length > 0
          ? views.reduce((sum, view) => sum + view.watch_percentage, 0) / views.length
          : 0;

      // Update analytics
      await supabase
        .from('replay_analytics')
        .update({
          total_views: views.length,
          avg_watch_percentage: avgWatchPercentage,
          updated_at: new Date().toISOString(),
        })
        .eq('replay_id', replayId);
    } catch (error) {
      console.error('Error in updateAnalytics:', error);
    }
  }
}

export const replayService = new ReplayService();