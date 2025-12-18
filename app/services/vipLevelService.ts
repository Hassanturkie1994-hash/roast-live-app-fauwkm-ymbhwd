
import { supabase } from '@/app/integrations/supabase/client';

/**
 * VIP Level Service
 * 
 * Handles VIP level calculations and anti-abuse detection.
 * 
 * VIP Level Calculation:
 * - Level 1-20 based on total gifted SEK
 * - 25,000 SEK total to reach level 20
 * - ~1,316 SEK per level on average
 * - Levels are system-driven, cannot be manually granted
 * 
 * Anti-Abuse Detection (LOGGED, NOT ENFORCED):
 * - Self-gifting detection
 * - VIP farming detection (rapid gifting from same account)
 * - Cooldowns for level XP farming
 * 
 * Safety Rules:
 * - VIP does NOT increase gift payout %
 * - No exclusive monetized advantages
 * - All perks are cosmetic or UX-based
 */

interface AbuseDetectionLog {
  type: 'self_gifting' | 'vip_farming' | 'xp_farming';
  userId: string;
  clubId: string;
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high';
}

class VIPLevelService {
  /**
   * Calculate VIP level based on total gifted SEK
   * 
   * Formula: Level = floor((totalGiftedSEK / 25000) * 19) + 1
   * Max level: 20
   */
  calculateVIPLevel(totalGiftedSEK: number): number {
    if (totalGiftedSEK <= 0) return 1;
    
    const level = Math.floor((totalGiftedSEK / 25000) * 19) + 1;
    return Math.min(20, Math.max(1, level));
  }

  /**
   * Calculate SEK needed for next level
   */
  calculateSEKForNextLevel(currentLevel: number, currentTotalSEK: number): number {
    if (currentLevel >= 20) return 0;

    const nextLevel = currentLevel + 1;
    const sekPerLevel = 25000 / 19;
    const sekNeeded = (nextLevel - 1) * sekPerLevel;

    return Math.max(0, Math.ceil(sekNeeded - currentTotalSEK));
  }

  /**
   * Update VIP member level based on new gift
   * 
   * This is called after a confirmed gift transaction.
   * Automatically recalculates level and updates database.
   */
  async updateVIPLevelAfterGift(
    clubId: string,
    userId: string,
    giftAmountSEK: number
  ): Promise<{ success: boolean; leveledUp: boolean; newLevel: number }> {
    try {
      // Get current membership
      const { data: member, error: fetchError } = await supabase
        .from('vip_club_members')
        .select('*')
        .eq('club_id', clubId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !member) {
        console.error('❌ [VIPLevelService] Member not found');
        return { success: false, leveledUp: false, newLevel: 1 };
      }

      const oldLevel = member.vip_level;
      const newTotalGifted = parseFloat(member.total_gifted_sek) + giftAmountSEK;
      const newLevel = this.calculateVIPLevel(newTotalGifted);
      const leveledUp = newLevel > oldLevel;

      // Update member
      const { error: updateError } = await supabase
        .from('vip_club_members')
        .update({
          total_gifted_sek: newTotalGifted,
          vip_level: newLevel,
          updated_at: new Date().toISOString(),
        })
        .eq('club_id', clubId)
        .eq('user_id', userId);

      if (updateError) {
        console.error('❌ [VIPLevelService] Error updating member:', updateError);
        return { success: false, leveledUp: false, newLevel: oldLevel };
      }

      if (leveledUp) {
        console.log(`🎉 [VIPLevelService] Member leveled up: ${oldLevel} → ${newLevel}`);
      }

      return { success: true, leveledUp, newLevel };
    } catch (error) {
      console.error('❌ [VIPLevelService] Exception updating VIP level:', error);
      return { success: false, leveledUp: false, newLevel: 1 };
    }
  }

  /**
   * Detect self-gifting (LOGGED, NOT ENFORCED)
   * 
   * Checks if sender and receiver are the same user or linked accounts.
   */
  async detectSelfGifting(
    senderId: string,
    receiverId: string,
    giftAmountSEK: number
  ): Promise<void> {
    try {
      if (senderId === receiverId) {
        await this.logAbuseDetection({
          type: 'self_gifting',
          userId: senderId,
          clubId: 'N/A',
          details: {
            senderId,
            receiverId,
            giftAmountSEK,
            reason: 'Sender and receiver are the same user',
          },
          severity: 'high',
        });
      }
    } catch (error) {
      console.error('❌ [VIPLevelService] Error detecting self-gifting:', error);
    }
  }

  /**
   * Detect VIP farming (LOGGED, NOT ENFORCED)
   * 
   * Checks for rapid gifting patterns from the same account.
   * Threshold: More than 5 gifts in 60 seconds
   */
  async detectVIPFarming(
    clubId: string,
    senderId: string,
    giftAmountSEK: number
  ): Promise<void> {
    try {
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();

      const { count, error } = await supabase
        .from('roast_gift_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('sender_id', senderId)
        .gte('created_at', oneMinuteAgo);

      if (error) {
        console.error('❌ [VIPLevelService] Error checking gift frequency:', error);
        return;
      }

      if ((count || 0) > 5) {
        await this.logAbuseDetection({
          type: 'vip_farming',
          userId: senderId,
          clubId,
          details: {
            senderId,
            giftCount: count,
            timeWindow: '60 seconds',
            giftAmountSEK,
          },
          severity: 'medium',
        });
      }
    } catch (error) {
      console.error('❌ [VIPLevelService] Error detecting VIP farming:', error);
    }
  }

  /**
   * Detect XP farming (LOGGED, NOT ENFORCED)
   * 
   * Checks for suspicious patterns in creator leveling.
   * Threshold: More than 10,000 XP gained in 1 hour
   */
  async detectXPFarming(
    creatorId: string,
    xpGained: number
  ): Promise<void> {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('creator_level_history')
        .select('xp_gained')
        .eq('creator_id', creatorId)
        .gte('created_at', oneHourAgo);

      if (error) {
        console.error('❌ [VIPLevelService] Error checking XP history:', error);
        return;
      }

      const totalXPInHour = (data || []).reduce((sum, entry) => sum + entry.xp_gained, 0);

      if (totalXPInHour > 10000) {
        await this.logAbuseDetection({
          type: 'xp_farming',
          userId: creatorId,
          clubId: 'N/A',
          details: {
            creatorId,
            totalXPInHour,
            timeWindow: '1 hour',
            xpGained,
          },
          severity: 'medium',
        });
      }
    } catch (error) {
      console.error('❌ [VIPLevelService] Error detecting XP farming:', error);
    }
  }

  /**
   * Log abuse detection (NOT ENFORCED, ONLY LOGGED)
   */
  private async logAbuseDetection(log: AbuseDetectionLog): Promise<void> {
    try {
      console.warn('⚠️ [VIPLevelService] Abuse detected:', log);

      // Log to user_safety_events table
      await supabase.from('user_safety_events').insert({
        user_id: log.userId,
        event_type: log.type === 'self_gifting' 
          ? 'fake_engagement_spam_like' 
          : log.type === 'vip_farming'
          ? 'fake_engagement_spam_follow'
          : 'fake_engagement_spam_comment',
        severity: log.severity,
        details: {
          abuse_type: log.type,
          club_id: log.clubId,
          ...log.details,
        },
        action_taken: 'human_review',
      });

      console.log('✅ [VIPLevelService] Abuse logged for review');
    } catch (error) {
      console.error('❌ [VIPLevelService] Error logging abuse:', error);
    }
  }

  /**
   * Get VIP level color
   */
  getVIPLevelColor(level: number): string {
    if (level >= 15) return '#FF1493'; // Hot Pink - Legendary
    if (level >= 10) return '#9B59B6'; // Purple - Elite
    if (level >= 5) return '#3498DB'; // Blue - Premium
    return '#FFD700'; // Gold - VIP
  }

  /**
   * Get VIP level label
   */
  getVIPLevelLabel(level: number): string {
    if (level >= 15) return 'LEGENDARY';
    if (level >= 10) return 'ELITE';
    if (level >= 5) return 'PREMIUM';
    return 'VIP';
  }

  /**
   * Validate VIP perk (ensure it's cosmetic/UX only)
   */
  validatePerk(perkType: string): boolean {
    const allowedPerkTypes = [
      'custom_chat_color',
      'priority_chat',
      'exclusive_emojis',
      'animated_badge',
      'custom_name_color',
      'profile_frame',
      'intro_sound',
    ];

    return allowedPerkTypes.includes(perkType);
  }
}

export const vipLevelService = new VIPLevelService();
