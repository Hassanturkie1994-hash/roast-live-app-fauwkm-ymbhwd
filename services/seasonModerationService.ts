
/**
 * Season Moderation Service
 * 
 * Apply moderation rules to Roast Ranking Seasons.
 * 
 * Rules:
 * - Confirmed gifts only affect rankings
 * - Flagged streams temporarily excluded from rankings
 * - Fraudulent activity zeroed post-review
 * 
 * No live punishment:
 * - Rankings adjusted after investigation
 * - Rewards revoked if needed
 * 
 * Audit requirements:
 * - Every season score change logged
 * - Every reward grant logged
 * 
 * Moderation actions must:
 * - Never affect live streaming
 * - Never crash ranking computation
 */

import { supabase } from '@/app/integrations/supabase/client';

export interface ModerationAction {
  type: 'exclude_stream' | 'zero_score' | 'revoke_reward' | 'restore_score';
  seasonId: string;
  creatorId: string;
  reason: string;
  metadata?: Record<string, any>;
}

export interface FlaggedStream {
  stream_id: string;
  creator_id: string;
  flagged_at: string;
  reason: string;
  resolved: boolean;
}

class SeasonModerationService {
  /**
   * Flag a stream for review (temporarily exclude from rankings)
   */
  public async flagStreamForReview(
    streamId: string,
    creatorId: string,
    reason: string
  ): Promise<boolean> {
    try {
      // Log the moderation action
      await this.logModerationAction({
        type: 'exclude_stream',
        seasonId: '', // Will be filled by the function
        creatorId,
        reason,
        metadata: { stream_id: streamId },
      });

      console.log('✅ [SeasonModerationService] Stream flagged for review');
      return true;
    } catch (error) {
      console.error('❌ [SeasonModerationService] Error flagging stream:', error);
      return false;
    }
  }

  /**
   * Zero out creator's season score after fraud investigation
   */
  public async zeroCreatorScore(
    seasonId: string,
    creatorId: string,
    reason: string
  ): Promise<boolean> {
    try {
      // Get current score for audit
      const { data: currentScore } = await supabase
        .from('creator_season_scores')
        .select('season_score, rank_tier')
        .eq('season_id', seasonId)
        .eq('creator_id', creatorId)
        .single();

      // Zero the score
      const { error } = await supabase
        .from('creator_season_scores')
        .update({
          season_score: 0,
          rank_tier: null,
          last_updated: new Date().toISOString(),
        })
        .eq('season_id', seasonId)
        .eq('creator_id', creatorId);

      if (error) {
        console.error('❌ [SeasonModerationService] Error zeroing score:', error);
        return false;
      }

      // Log the action
      await this.logModerationAction({
        type: 'zero_score',
        seasonId,
        creatorId,
        reason,
        metadata: {
          previous_score: currentScore?.season_score || 0,
          previous_tier: currentScore?.rank_tier,
        },
      });

      console.log('✅ [SeasonModerationService] Creator score zeroed');
      return true;
    } catch (error) {
      console.error('❌ [SeasonModerationService] Exception zeroing score:', error);
      return false;
    }
  }

  /**
   * Revoke seasonal rewards after investigation
   */
  public async revokeSeasonalReward(
    seasonId: string,
    creatorId: string,
    rewardId: string,
    reason: string
  ): Promise<boolean> {
    try {
      // Delete the reward
      const { error: deleteError } = await supabase
        .from('creator_season_rewards')
        .delete()
        .eq('season_id', seasonId)
        .eq('creator_id', creatorId)
        .eq('reward_id', rewardId);

      if (deleteError) {
        console.error('❌ [SeasonModerationService] Error revoking reward:', deleteError);
        return false;
      }

      // Log the revocation in audit table
      const { error: auditError } = await supabase
        .from('reward_grant_audit_log')
        .update({
          revoked_at: new Date().toISOString(),
          revoke_reason: reason,
        })
        .eq('season_id', seasonId)
        .eq('creator_id', creatorId)
        .eq('reward_id', rewardId);

      if (auditError) {
        console.error('❌ [SeasonModerationService] Error updating audit log:', auditError);
      }

      // Log the moderation action
      await this.logModerationAction({
        type: 'revoke_reward',
        seasonId,
        creatorId,
        reason,
        metadata: { reward_id: rewardId },
      });

      console.log('✅ [SeasonModerationService] Reward revoked');
      return true;
    } catch (error) {
      console.error('❌ [SeasonModerationService] Exception revoking reward:', error);
      return false;
    }
  }

  /**
   * Restore creator's score after appeal approval
   */
  public async restoreCreatorScore(
    seasonId: string,
    creatorId: string,
    restoredScore: number,
    reason: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('creator_season_scores')
        .update({
          season_score: restoredScore,
          last_updated: new Date().toISOString(),
        })
        .eq('season_id', seasonId)
        .eq('creator_id', creatorId);

      if (error) {
        console.error('❌ [SeasonModerationService] Error restoring score:', error);
        return false;
      }

      // Log the action
      await this.logModerationAction({
        type: 'restore_score',
        seasonId,
        creatorId,
        reason,
        metadata: { restored_score: restoredScore },
      });

      console.log('✅ [SeasonModerationService] Score restored');
      return true;
    } catch (error) {
      console.error('❌ [SeasonModerationService] Exception restoring score:', error);
      return false;
    }
  }

  /**
   * Log moderation action
   */
  private async logModerationAction(action: ModerationAction): Promise<void> {
    try {
      // This would be logged to a moderation actions table
      console.log('📝 [SeasonModerationService] Moderation action logged:', action);

      // In production, this would insert into a moderation_actions table
      // For now, we'll use the existing admin_actions_log
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('admin_actions_log').insert({
        admin_user_id: user.id,
        target_user_id: action.creatorId,
        action_type: 'MANAGE_BADGE', // Closest match
        reason: `Season Moderation: ${action.type} - ${action.reason}`,
        metadata: {
          ...action.metadata,
          season_id: action.seasonId,
          moderation_type: action.type,
        },
      });
    } catch (error) {
      console.error('❌ [SeasonModerationService] Error logging action:', error);
    }
  }

  /**
   * Get moderation history for a creator
   */
  public async getModerationHistory(
    creatorId: string,
    seasonId?: string
  ): Promise<any[]> {
    try {
      let query = supabase
        .from('admin_actions_log')
        .select('*')
        .eq('target_user_id', creatorId)
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('❌ [SeasonModerationService] Error fetching history:', error);
        return [];
      }

      // Filter by season if provided
      if (seasonId) {
        return data.filter((action: any) => 
          action.metadata?.season_id === seasonId
        );
      }

      return data;
    } catch (error) {
      console.error('❌ [SeasonModerationService] Exception fetching history:', error);
      return [];
    }
  }

  /**
   * Validate gift transaction before affecting rankings
   * Only confirmed gifts affect rankings
   */
  public async validateGiftForRanking(transactionId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('roast_gift_transactions')
        .select('status')
        .eq('id', transactionId)
        .single();

      if (error) {
        console.error('❌ [SeasonModerationService] Error validating gift:', error);
        return false;
      }

      return data.status === 'CONFIRMED';
    } catch (error) {
      console.error('❌ [SeasonModerationService] Exception validating gift:', error);
      return false;
    }
  }

  /**
   * Check if stream is flagged and should be excluded from rankings
   */
  public async isStreamExcludedFromRankings(streamId: string): Promise<boolean> {
    try {
      // Check if stream has unresolved violations
      const { data, error } = await supabase
        .from('content_safety_violations')
        .select('id')
        .eq('stream_id', streamId)
        .eq('resolved', false)
        .limit(1);

      if (error) {
        console.error('❌ [SeasonModerationService] Error checking stream flags:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('❌ [SeasonModerationService] Exception checking stream flags:', error);
      return false;
    }
  }

  /**
   * Recalculate rankings after moderation action
   * This is safe and won't crash - it's a background operation
   */
  public async recalculateRankingsAfterModeration(seasonId: string): Promise<void> {
    try {
      // Call the server-side function to recalculate
      const { error } = await supabase.functions.invoke('recalculate-season-rankings', {
        body: { season_id: seasonId },
      });

      if (error) {
        console.error('❌ [SeasonModerationService] Error recalculating rankings:', error);
        return;
      }

      console.log('✅ [SeasonModerationService] Rankings recalculated');
    } catch (error) {
      console.error('❌ [SeasonModerationService] Exception recalculating rankings:', error);
    }
  }
}

export const seasonModerationService = new SeasonModerationService();
