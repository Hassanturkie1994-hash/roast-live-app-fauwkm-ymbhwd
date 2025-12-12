
import { supabase } from '@/app/integrations/supabase/client';

interface ContentSignals {
  watch_time: number;
  completion_rate: number;
  replay_count: number;
  likes: number;
  comments_received: number;
  shares: number;
  creator_followed: boolean;
  content_category: string;
  safety_score: number;
}

interface RankingWeights {
  w1_watch_time: number;
  w2_completion: number;
  w3_like_ratio: number;
  w4_recent_trend: number;
  w5_creator_affinity: number;
}

interface RankedContent {
  id: string;
  score: number;
  content: any;
  creator: any;
}

class EnhancedRecommendationService {
  // Default ranking weights (can be tuned)
  private weights: RankingWeights = {
    w1_watch_time: 0.30,
    w2_completion: 0.25,
    w3_like_ratio: 0.20,
    w4_recent_trend: 0.15,
    w5_creator_affinity: 0.10,
  };

  /**
   * Calculate recommendation score for content
   */
  calculateScore(signals: ContentSignals, userAffinityScore: number = 0): number {
    // Normalize signals (0-1 range)
    const normalizedWatchTime = Math.min(signals.watch_time / 3600, 1); // Max 1 hour
    const normalizedCompletion = Math.min(signals.completion_rate, 1);
    const normalizedLikeRatio = Math.min(signals.likes / 100, 1); // Max 100 likes
    const normalizedTrend = this.calculateTrendScore(signals);
    const normalizedAffinity = Math.min(userAffinityScore, 1);

    // Apply ranking formula
    const score =
      this.weights.w1_watch_time * normalizedWatchTime +
      this.weights.w2_completion * normalizedCompletion +
      this.weights.w3_like_ratio * normalizedLikeRatio +
      this.weights.w4_recent_trend * normalizedTrend +
      this.weights.w5_creator_affinity * normalizedAffinity;

    // Apply safety score multiplier (0.0 - 1.0)
    const finalScore = score * signals.safety_score;

    return finalScore * 100; // Scale to 0-100
  }

  /**
   * Calculate trend score based on recent engagement
   */
  private calculateTrendScore(signals: ContentSignals): number {
    // Combine recent metrics
    const recentEngagement =
      signals.replay_count * 0.3 +
      signals.likes * 0.3 +
      signals.comments_received * 0.2 +
      signals.shares * 0.2;

    return Math.min(recentEngagement / 50, 1); // Normalize
  }

  /**
   * Track user engagement with content
   */
  async trackEngagement(
    userId: string,
    contentType: 'stream' | 'replay' | 'post' | 'story',
    contentId: string,
    engagement: {
      watchTimeSeconds?: number;
      completionRate?: number;
      liked?: boolean;
      commented?: boolean;
      shared?: boolean;
      creatorFollowed?: boolean;
    }
  ) {
    try {
      // Check if engagement record exists
      const { data: existing } = await supabase
        .from('content_engagement_metrics')
        .select('*')
        .eq('user_id', userId)
        .eq('content_type', contentType)
        .eq('content_id', contentId)
        .maybeSingle();

      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from('content_engagement_metrics')
          .update({
            watch_time_seconds: engagement.watchTimeSeconds ?? existing.watch_time_seconds,
            completion_rate: engagement.completionRate ?? existing.completion_rate,
            liked: engagement.liked ?? existing.liked,
            commented: engagement.commented ?? existing.commented,
            shared: engagement.shared ?? existing.shared,
            creator_followed: engagement.creatorFollowed ?? existing.creator_followed,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) {
          console.error('Error updating engagement:', error);
        }
      } else {
        // Create new record
        const { error } = await supabase
          .from('content_engagement_metrics')
          .insert({
            user_id: userId,
            content_type: contentType,
            content_id: contentId,
            watch_time_seconds: engagement.watchTimeSeconds ?? 0,
            completion_rate: engagement.completionRate ?? 0,
            liked: engagement.liked ?? false,
            commented: engagement.commented ?? false,
            shared: engagement.shared ?? false,
            creator_followed: engagement.creatorFollowed ?? false,
          });

        if (error) {
          console.error('Error creating engagement:', error);
        }
      }
    } catch (error) {
      console.error('Error in trackEngagement:', error);
    }
  }

  /**
   * Get personalized feed for user
   */
  async getPersonalizedFeed(
    userId: string,
    contentType: 'stream' | 'replay',
    limit: number = 20
  ): Promise<RankedContent[]> {
    try {
      // Get user preferences
      const { data: preferences } = await supabase
        .from('user_feed_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      // Get blocked users
      const { data: blockedUsers } = await supabase
        .from('blocked_users')
        .select('blocked_id')
        .eq('blocker_id', userId);

      const blockedIds = blockedUsers?.map(b => b.blocked_id) || [];
      const additionalBlockedIds = preferences?.blocked_creator_ids || [];
      const allBlockedIds = [...blockedIds, ...additionalBlockedIds];

      // Get content based on type
      let query = supabase.from('streams').select(`
        *,
        profiles:broadcaster_id (
          id,
          username,
          display_name,
          avatar_url,
          premium_active,
          role
        )
      `);

      if (contentType === 'stream') {
        query = query.eq('status', 'live');
      } else {
        query = query.eq('status', 'ended').not('archived_url', 'is', null);
      }

      // Exclude blocked creators
      if (allBlockedIds.length > 0) {
        query = query.not('broadcaster_id', 'in', `(${allBlockedIds.join(',')})`);
      }

      const { data: content, error } = await query.limit(100);

      if (error || !content) {
        console.error('Error fetching content:', error);
        return [];
      }

      // Get user engagement history
      const { data: engagementHistory } = await supabase
        .from('content_engagement_metrics')
        .select('*')
        .eq('user_id', userId)
        .eq('content_type', contentType);

      // Calculate scores for each content
      const rankedContent: RankedContent[] = [];

      for (const item of content) {
        // Get engagement metrics for this content
        const engagement = engagementHistory?.find(e => e.content_id === item.id);

        // Calculate creator affinity
        const creatorAffinity = await this.calculateCreatorAffinity(
          userId,
          item.broadcaster_id
        );

        // Get content signals
        const signals: ContentSignals = {
          watch_time: engagement?.watch_time_seconds || 0,
          completion_rate: engagement?.completion_rate || 0,
          replay_count: engagement?.replay_count || 0,
          likes: item.viewer_count || 0, // Use viewer count as proxy
          comments_received: 0,
          shares: 0,
          creator_followed: engagement?.creator_followed || false,
          content_category: 'general',
          safety_score: 1.0,
        };

        // Calculate score
        const score = this.calculateScore(signals, creatorAffinity);

        // Boost Premium and VIP creators
        let finalScore = score;
        if (item.profiles?.premium_active) {
          finalScore *= 1.2; // 20% boost for Premium
        }
        if (item.profiles?.role === 'HEAD_ADMIN' || item.profiles?.role === 'ADMIN') {
          finalScore *= 1.3; // 30% boost for VIP
        }

        rankedContent.push({
          id: item.id,
          score: finalScore,
          content: item,
          creator: item.profiles,
        });
      }

      // Sort by score
      rankedContent.sort((a, b) => b.score - a.score);

      // Apply feed rules: Don't show same creator more than 3 times in a row
      const filteredContent = this.applyFeedRules(rankedContent, preferences);

      return filteredContent.slice(0, limit);
    } catch (error) {
      console.error('Error in getPersonalizedFeed:', error);
      return [];
    }
  }

  /**
   * Calculate user's affinity with a creator
   */
  private async calculateCreatorAffinity(
    userId: string,
    creatorId: string
  ): Promise<number> {
    try {
      // Check if user follows creator
      const { data: follow } = await supabase
        .from('followers')
        .select('*')
        .eq('follower_id', userId)
        .eq('following_id', creatorId)
        .maybeSingle();

      if (follow) return 1.0;

      // Check engagement history with creator's content
      const { data: engagement } = await supabase
        .from('content_engagement_metrics')
        .select('*')
        .eq('user_id', userId);

      if (!engagement) return 0;

      // Count interactions with this creator
      const creatorInteractions = engagement.filter(e => {
        // This would need to join with content to get creator_id
        // Simplified for now
        return false;
      }).length;

      return Math.min(creatorInteractions / 10, 0.8); // Max 0.8 for non-followers
    } catch (error) {
      console.error('Error calculating creator affinity:', error);
      return 0;
    }
  }

  /**
   * Apply feed rules to prevent repetitive content
   */
  private applyFeedRules(
    content: RankedContent[],
    preferences: any
  ): RankedContent[] {
    const result: RankedContent[] = [];
    let lastCreatorId: string | null = null;
    let creatorShowCount = 0;

    for (const item of content) {
      const creatorId = item.creator?.id;

      // Check if same creator as last 3 items
      if (creatorId === lastCreatorId) {
        creatorShowCount++;
        if (creatorShowCount >= 3) {
          // Skip this item, same creator shown 3 times already
          continue;
        }
      } else {
        // Different creator, reset counter
        lastCreatorId = creatorId;
        creatorShowCount = 1;
      }

      result.push(item);
    }

    return result;
  }

  /**
   * Update user feed preferences
   */
  async updateFeedPreferences(
    userId: string,
    preferences: {
      preferredCategories?: string[];
      blockedCreatorIds?: string[];
    }
  ) {
    try {
      const { error } = await supabase
        .from('user_feed_preferences')
        .upsert({
          user_id: userId,
          preferred_categories: preferences.preferredCategories,
          blocked_creator_ids: preferences.blockedCreatorIds,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error updating feed preferences:', error);
      }
    } catch (error) {
      console.error('Error in updateFeedPreferences:', error);
    }
  }

  /**
   * Get trending content based on recent engagement
   */
  async getTrendingContent(
    contentType: 'stream' | 'replay',
    limit: number = 20
  ): Promise<any[]> {
    try {
      // Get content with high recent engagement
      const { data, error } = await supabase
        .from('content_engagement_metrics')
        .select(`
          *,
          streams:content_id (
            *,
            profiles:broadcaster_id (*)
          )
        `)
        .eq('content_type', contentType)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('watch_time_seconds', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching trending content:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getTrendingContent:', error);
      return [];
    }
  }
}

export const enhancedRecommendationService = new EnhancedRecommendationService();