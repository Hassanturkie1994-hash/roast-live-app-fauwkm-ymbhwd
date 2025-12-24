
/**
 * Season Moderation Service
 * 
 * Manages moderation actions specific to season rankings and competitions.
 */

import { supabase } from '@/app/integrations/supabase/client';

interface ModerationAction {
  type: 'warning' | 'penalty' | 'disqualification';
  reason: string;
  points_deducted?: number;
}

class SeasonModerationService {
  async applyModerationAction(
    creatorId: string,
    seasonId: string,
    action: ModerationAction
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('⚖️ [SeasonModerationService] Applying moderation action:', {
        creatorId,
        seasonId,
        action,
      });

      // Log moderation action
      const { error: logError } = await supabase
        .from('season_moderation_log')
        .insert({
          creator_id: creatorId,
          season_id: seasonId,
          action_type: action.type,
          reason: action.reason,
          points_deducted: action.points_deducted || 0,
        });

      if (logError) {
        console.error('❌ [SeasonModerationService] Error logging action:', logError);
        return { success: false, error: logError.message };
      }

      // Apply penalty if specified
      if (action.points_deducted && action.points_deducted > 0) {
        const { error: penaltyError } = await supabase
          .from('creator_season_stats')
          .update({
            penalty_points: action.points_deducted,
            updated_at: new Date().toISOString(),
          })
          .eq('creator_id', creatorId)
          .eq('season_id', seasonId);

        if (penaltyError) {
          console.error('❌ [SeasonModerationService] Error applying penalty:', penaltyError);
          return { success: false, error: penaltyError.message };
        }
      }

      console.log('✅ [SeasonModerationService] Moderation action applied successfully');
      return { success: true };
    } catch (error: any) {
      console.error('❌ [SeasonModerationService] Exception:', error);
      return { success: false, error: error.message };
    }
  }

  async getModerationHistory(
    creatorId: string,
    seasonId?: string
  ): Promise<any[]> {
    try {
      let query = supabase
        .from('season_moderation_log')
        .select('*')
        .eq('creator_id', creatorId)
        .order('created_at', { ascending: false });

      if (seasonId) {
        query = query.eq('season_id', seasonId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ [SeasonModerationService] Error fetching history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ [SeasonModerationService] Exception fetching history:', error);
      return [];
    }
  }
}

export const seasonModerationService = new SeasonModerationService();
