
import { supabase } from '@/app/integrations/supabase/client';
import { pushNotificationService } from './pushNotificationService';
import { inboxService } from './inboxService';

/**
 * Ban Expiration Service
 * 
 * PROMPT 2: Automatically send push notifications when bans expire
 * 
 * This service checks for expired bans and sends notifications to users
 * when their restrictions have ended.
 */

class BanExpirationService {
  /**
   * Check for expired bans and send notifications
   * This should be called periodically (e.g., every 5 minutes via a cron job or edge function)
   */
  async checkAndNotifyExpiredBans(): Promise<void> {
    try {
      const now = new Date().toISOString();

      // Check for expired admin penalties
      const { data: expiredPenalties } = await supabase
        .from('admin_penalties')
        .select('id, user_id')
        .eq('is_active', true)
        .not('expires_at', 'is', null)
        .lte('expires_at', now);

      if (expiredPenalties && expiredPenalties.length > 0) {
        console.log(`Found ${expiredPenalties.length} expired penalties`);

        for (const penalty of expiredPenalties) {
          // Deactivate the penalty
          await supabase
            .from('admin_penalties')
            .update({ is_active: false })
            .eq('id', penalty.id);

          // Send push notification
          await pushNotificationService.sendPushNotification(
            penalty.user_id,
            'BAN_EXPIRED',
            'Your restriction has ended',
            'You can now interact again. Please follow the community rules.',
            { penalty_id: penalty.id }
          );

          // Send inbox notification
          await inboxService.createSystemMessage({
            receiver_id: penalty.user_id,
            title: 'Restriction Ended',
            message: 'Your restriction has ended. You can now interact again. Please follow the community rules.',
            category: 'safety',
          });

          console.log(`✅ Notified user ${penalty.user_id} about expired ban`);
        }
      }

      // Check for expired AI strikes (level 3 - 24 hour bans)
      const { data: expiredStrikes } = await supabase
        .from('ai_strikes')
        .select('id, user_id, creator_id')
        .eq('strike_level', 3)
        .not('expires_at', 'is', null)
        .lte('expires_at', now);

      if (expiredStrikes && expiredStrikes.length > 0) {
        console.log(`Found ${expiredStrikes.length} expired AI strikes`);

        for (const strike of expiredStrikes) {
          // Send push notification
          await pushNotificationService.sendPushNotification(
            strike.user_id,
            'BAN_EXPIRED',
            'Your stream ban has ended',
            'You can now join this creator\'s streams again. Please follow the community rules.',
            { strike_id: strike.id, creator_id: strike.creator_id }
          );

          // Send inbox notification
          await inboxService.createSystemMessage({
            receiver_id: strike.user_id,
            title: 'Stream Ban Ended',
            message: 'Your stream ban has ended. You can now join this creator\'s streams again. Please follow the community rules.',
            category: 'safety',
          });

          console.log(`✅ Notified user ${strike.user_id} about expired strike`);
        }
      }

      // Check for expired timeouts
      const { data: expiredTimeouts } = await supabase
        .from('timed_out_users_v2')
        .select('id, user_id')
        .lte('end_time', now);

      if (expiredTimeouts && expiredTimeouts.length > 0) {
        console.log(`Found ${expiredTimeouts.length} expired timeouts`);

        // Delete expired timeouts
        await supabase
          .from('timed_out_users_v2')
          .delete()
          .lte('end_time', now);

        // Note: We don't send notifications for timeout expiration
        // as they are typically short (2-60 minutes)
      }

      console.log('✅ Ban expiration check complete');
    } catch (error) {
      console.error('Error checking expired bans:', error);
    }
  }

  /**
   * Get upcoming ban expirations for a user
   */
  async getUpcomingExpirations(userId: string): Promise<{
    penalties: any[];
    strikes: any[];
    timeouts: any[];
  }> {
    try {
      const now = new Date().toISOString();

      // Get active penalties with expiration dates
      const { data: penalties } = await supabase
        .from('admin_penalties')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .not('expires_at', 'is', null)
        .gte('expires_at', now)
        .order('expires_at', { ascending: true });

      // Get active AI strikes with expiration dates
      const { data: strikes } = await supabase
        .from('ai_strikes')
        .select('*')
        .eq('user_id', userId)
        .not('expires_at', 'is', null)
        .gte('expires_at', now)
        .order('expires_at', { ascending: true });

      // Get active timeouts
      const { data: timeouts } = await supabase
        .from('timed_out_users_v2')
        .select('*')
        .eq('user_id', userId)
        .gte('end_time', now)
        .order('end_time', { ascending: true });

      return {
        penalties: penalties || [],
        strikes: strikes || [],
        timeouts: timeouts || [],
      };
    } catch (error) {
      console.error('Error getting upcoming expirations:', error);
      return {
        penalties: [],
        strikes: [],
        timeouts: [],
      };
    }
  }
}

export const banExpirationService = new BanExpirationService();