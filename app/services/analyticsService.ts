
import { supabase } from '@/app/integrations/supabase/client';

/**
 * Analytics Service
 * 
 * Tracks analytics for all media types:
 * - Stories: views, unique viewers, likes, comments, viewer list
 * - Posts: views, unique viewers, likes, comments, shares
 * - Reels: views, unique viewers, likes, comments, completion rate
 * - Saved Streams: views, unique viewers, likes, comments, completion rate
 * 
 * Features:
 * - Near-real-time updates
 * - Unique viewer tracking
 * - Completion rate for videos
 * - Viewer list for stories
 */

export interface MediaAnalytics {
  views: number;
  uniqueViewers: number;
  likes: number;
  comments: number;
  completionRate?: number; // For videos
  viewers?: ViewerInfo[]; // For stories
}

export interface ViewerInfo {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  viewed_at: string;
}

class AnalyticsService {
  /**
   * Track story view
   */
  async trackStoryView(userId: string, storyId: string): Promise<void> {
    try {
      // Insert view record (unique constraint prevents duplicates)
      const { error: viewError } = await supabase
        .from('story_views')
        .insert({
          story_id: storyId,
          user_id: userId,
        });

      // Ignore duplicate key errors
      if (viewError && !viewError.message.includes('duplicate')) {
        console.error('Error tracking story view:', viewError);
        return;
      }

      // Increment view count
      await supabase.rpc('increment_story_views', { story_uuid: storyId });
    } catch (error) {
      console.error('Error in trackStoryView:', error);
    }
  }

  /**
   * Track post view
   */
  async trackPostView(userId: string, postId: string): Promise<void> {
    try {
      // Insert view record
      const { error: viewError } = await supabase
        .from('post_views')
        .insert({
          post_id: postId,
          user_id: userId,
        });

      if (viewError && !viewError.message.includes('duplicate')) {
        console.error('Error tracking post view:', viewError);
        return;
      }

      // Increment view count
      await supabase.rpc('increment_post_views', { post_uuid: postId });
    } catch (error) {
      console.error('Error in trackPostView:', error);
    }
  }

  /**
   * Track replay view with completion tracking
   */
  async trackReplayView(
    userId: string,
    replayId: string,
    watchedDurationSeconds: number,
    totalDurationSeconds: number
  ): Promise<void> {
    try {
      const watchPercentage = totalDurationSeconds > 0 
        ? (watchedDurationSeconds / totalDurationSeconds) * 100 
        : 0;

      // Upsert view record
      const { error } = await supabase
        .from('replay_views')
        .upsert({
          replay_id: replayId,
          user_id: userId,
          watched_duration_seconds: watchedDurationSeconds,
          watch_percentage: watchPercentage,
        }, {
          onConflict: 'replay_id,user_id',
        });

      if (error) {
        console.error('Error tracking replay view:', error);
        return;
      }

      // Increment view count
      await supabase.rpc('increment_replay_views', { replay_uuid: replayId });
    } catch (error) {
      console.error('Error in trackReplayView:', error);
    }
  }

  /**
   * Get story analytics
   */
  async getStoryAnalytics(storyId: string): Promise<MediaAnalytics> {
    try {
      const [storyData, viewsData, likesData, commentsData] = await Promise.all([
        supabase
          .from('stories')
          .select('views_count, likes_count, comments_count')
          .eq('id', storyId)
          .single(),
        
        supabase
          .from('story_views')
          .select('user_id, profiles(id, username, display_name, avatar_url), created_at')
          .eq('story_id', storyId)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('story_likes')
          .select('user_id', { count: 'exact', head: true })
          .eq('story_id', storyId),
        
        supabase
          .from('story_comments')
          .select('id', { count: 'exact', head: true })
          .eq('story_id', storyId),
      ]);

      const viewers: ViewerInfo[] = (viewsData.data || []).map((view: any) => ({
        id: view.profiles?.id || view.user_id,
        username: view.profiles?.username || 'Unknown',
        display_name: view.profiles?.display_name || 'Unknown',
        avatar_url: view.profiles?.avatar_url || null,
        viewed_at: view.created_at,
      }));

      return {
        views: storyData.data?.views_count || 0,
        uniqueViewers: viewsData.data?.length || 0,
        likes: likesData.count || 0,
        comments: commentsData.count || 0,
        viewers,
      };
    } catch (error) {
      console.error('Error getting story analytics:', error);
      return {
        views: 0,
        uniqueViewers: 0,
        likes: 0,
        comments: 0,
        viewers: [],
      };
    }
  }

  /**
   * Get post analytics
   */
  async getPostAnalytics(postId: string): Promise<MediaAnalytics> {
    try {
      const [postData, viewsData, likesData, commentsData] = await Promise.all([
        supabase
          .from('posts')
          .select('views_count, likes_count, comments_count, shares_count')
          .eq('id', postId)
          .single(),
        
        supabase
          .from('post_views')
          .select('user_id', { count: 'exact', head: true })
          .eq('post_id', postId),
        
        supabase
          .from('post_likes')
          .select('user_id', { count: 'exact', head: true })
          .eq('post_id', postId),
        
        supabase
          .from('post_comments')
          .select('id', { count: 'exact', head: true })
          .eq('post_id', postId),
      ]);

      return {
        views: postData.data?.views_count || 0,
        uniqueViewers: viewsData.count || 0,
        likes: likesData.count || 0,
        comments: commentsData.count || 0,
      };
    } catch (error) {
      console.error('Error getting post analytics:', error);
      return {
        views: 0,
        uniqueViewers: 0,
        likes: 0,
        comments: 0,
      };
    }
  }

  /**
   * Get replay analytics with completion rate
   */
  async getReplayAnalytics(replayId: string): Promise<MediaAnalytics> {
    try {
      const [replayData, viewsData, likesData, commentsData] = await Promise.all([
        supabase
          .from('stream_replays')
          .select('views_count, likes_count, comments_count')
          .eq('id', replayId)
          .single(),
        
        supabase
          .from('replay_views')
          .select('watch_percentage')
          .eq('replay_id', replayId),
        
        supabase
          .from('replay_likes')
          .select('user_id', { count: 'exact', head: true })
          .eq('replay_id', replayId),
        
        supabase
          .from('replay_comments')
          .select('id', { count: 'exact', head: true })
          .eq('replay_id', replayId),
      ]);

      // Calculate average completion rate
      const completionRates = (viewsData.data || []).map((v: any) => v.watch_percentage || 0);
      const avgCompletionRate = completionRates.length > 0
        ? completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length
        : 0;

      return {
        views: replayData.data?.views_count || 0,
        uniqueViewers: viewsData.data?.length || 0,
        likes: likesData.count || 0,
        comments: commentsData.count || 0,
        completionRate: Math.round(avgCompletionRate),
      };
    } catch (error) {
      console.error('Error getting replay analytics:', error);
      return {
        views: 0,
        uniqueViewers: 0,
        likes: 0,
        comments: 0,
        completionRate: 0,
      };
    }
  }

  /**
   * Subscribe to real-time analytics updates
   */
  subscribeToStoryAnalytics(
    storyId: string,
    onUpdate: (analytics: MediaAnalytics) => void
  ) {
    // Subscribe to story views
    const viewsChannel = supabase
      .channel(`story_views_${storyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'story_views',
          filter: `story_id=eq.${storyId}`,
        },
        async () => {
          const analytics = await this.getStoryAnalytics(storyId);
          onUpdate(analytics);
        }
      )
      .subscribe();

    // Subscribe to story likes
    const likesChannel = supabase
      .channel(`story_likes_${storyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'story_likes',
          filter: `story_id=eq.${storyId}`,
        },
        async () => {
          const analytics = await this.getStoryAnalytics(storyId);
          onUpdate(analytics);
        }
      )
      .subscribe();

    return () => {
      viewsChannel.unsubscribe();
      likesChannel.unsubscribe();
    };
  }

  /**
   * Subscribe to real-time post analytics updates
   */
  subscribeToPostAnalytics(
    postId: string,
    onUpdate: (analytics: MediaAnalytics) => void
  ) {
    const channel = supabase
      .channel(`post_analytics_${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_views',
          filter: `post_id=eq.${postId}`,
        },
        async () => {
          const analytics = await this.getPostAnalytics(postId);
          onUpdate(analytics);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_likes',
          filter: `post_id=eq.${postId}`,
        },
        async () => {
          const analytics = await this.getPostAnalytics(postId);
          onUpdate(analytics);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }

  /**
   * Subscribe to real-time replay analytics updates
   */
  subscribeToReplayAnalytics(
    replayId: string,
    onUpdate: (analytics: MediaAnalytics) => void
  ) {
    const channel = supabase
      .channel(`replay_analytics_${replayId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'replay_views',
          filter: `replay_id=eq.${replayId}`,
        },
        async () => {
          const analytics = await this.getReplayAnalytics(replayId);
          onUpdate(analytics);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }
}

export const analyticsService = new AnalyticsService();
