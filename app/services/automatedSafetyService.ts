
import { supabase } from '@/app/integrations/supabase/client';
import { contentSafetyService } from './contentSafetyService';
import { inboxService } from './inboxService';

// Hate speech patterns (simplified - in production, use more sophisticated NLP)
const HATE_SPEECH_PATTERNS = [
  // N-word variations
  /n[i1!]gg[ae3]r/i,
  /n[i1!]gg[ae3]/i,
  /n[i1!]g{2,}/i,
  
  // Sexual threats
  /r[a4]p[e3]/i,
  /s[e3]xu[a4]l\s*(assault|abuse|harassment)/i,
  
  // Violent threats
  /k[i1!]ll\s*(you|yourself|urself)/i,
  /d[i1!][e3]\s*(you|yourself)/i,
  /murder/i,
  /shoot\s*(you|up)/i,
];

interface MassReportEvent {
  id: string;
  stream_id: string;
  report_count: number;
  unique_reporters: string[];
  triggered_at: string;
  resolved_at: string | null;
  creator_acknowledged: boolean;
  chat_hidden: boolean;
}

interface SpamViolation {
  id: string;
  user_id: string;
  stream_id: string;
  message_count: number;
  time_window_seconds: number;
  timeout_until: string;
}

interface HateSpeechBlock {
  id: string;
  user_id: string;
  stream_id: string;
  blocked_message: string;
  violation_type: 'n_word' | 'sexual_threat' | 'violent_threat' | 'other';
}

interface HarassmentTracking {
  id: string;
  reported_user_id: string;
  stream_id: string;
  reporter_ids: string[];
  report_count: number;
  auto_timeout_applied: boolean;
  timeout_until: string | null;
}

class AutomatedSafetyService {
  // Track user message frequency for spam detection
  private userMessageTimestamps: Map<string, number[]> = new Map();

  /**
   * Check for mass report lockdown (15 unique users within 1 minute)
   */
  async checkMassReportLockdown(streamId: string): Promise<{
    triggered: boolean;
    event?: MassReportEvent;
  }> {
    try {
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();

      // Get unique reporters in the last minute
      const { data: recentReports, error } = await supabase
        .from('stream_reports')
        .select('reporter_user_id')
        .eq('stream_id', streamId)
        .gte('created_at', oneMinuteAgo);

      if (error) {
        console.error('Error checking mass reports:', error);
        return { triggered: false };
      }

      const uniqueReporters = [...new Set(recentReports?.map(r => r.reporter_user_id) || [])];
      const reportCount = uniqueReporters.length;

      if (reportCount >= 15) {
        // Check if already triggered
        const { data: existingEvent } = await supabase
          .from('mass_report_events')
          .select('*')
          .eq('stream_id', streamId)
          .is('resolved_at', null)
          .single();

        if (existingEvent) {
          return { triggered: true, event: existingEvent as MassReportEvent };
        }

        // Create new mass report event
        const { data: newEvent, error: insertError } = await supabase
          .from('mass_report_events')
          .insert({
            stream_id: streamId,
            report_count: reportCount,
            unique_reporters: uniqueReporters,
            chat_hidden: true,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating mass report event:', insertError);
          return { triggered: false };
        }

        console.log('🚨 Mass report lockdown triggered for stream:', streamId);
        return { triggered: true, event: newEvent as MassReportEvent };
      }

      return { triggered: false };
    } catch (error) {
      console.error('Error in checkMassReportLockdown:', error);
      return { triggered: false };
    }
  }

  /**
   * Acknowledge mass report event (creator confirms they will continue responsibly)
   */
  async acknowledgeMassReportEvent(eventId: string, streamId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { error } = await supabase
        .from('mass_report_events')
        .update({
          creator_acknowledged: true,
          chat_hidden: false,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', eventId);

      if (error) {
        console.error('Error acknowledging mass report event:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Creator acknowledged mass report event');
      return { success: true };
    } catch (error) {
      console.error('Error in acknowledgeMassReportEvent:', error);
      return { success: false, error: 'Failed to acknowledge event' };
    }
  }

  /**
   * Check if user is sending too many messages (spam detection)
   * Returns true if user should be timed out
   */
  checkSpamViolation(userId: string, streamId: string): boolean {
    const now = Date.now();
    const timestamps = this.userMessageTimestamps.get(userId) || [];

    // Add current timestamp
    timestamps.push(now);

    // Remove timestamps older than 10 seconds
    const recentTimestamps = timestamps.filter(ts => now - ts <= 10000);
    this.userMessageTimestamps.set(userId, recentTimestamps);

    // Check if more than 10 messages in 10 seconds
    if (recentTimestamps.length > 10) {
      console.log('🚨 Spam violation detected for user:', userId);
      this.applySpamTimeout(userId, streamId, recentTimestamps.length);
      return true;
    }

    return false;
  }

  /**
   * Apply 1-minute timeout for spam violation
   */
  private async applySpamTimeout(userId: string, streamId: string, messageCount: number): Promise<void> {
    try {
      const timeoutUntil = new Date(Date.now() + 60 * 1000).toISOString();

      // Record spam violation
      await supabase.from('spam_violations').insert({
        user_id: userId,
        stream_id: streamId,
        message_count: messageCount,
        time_window_seconds: 10,
        timeout_until: timeoutUntil,
      });

      // Apply timeout
      await supabase.from('timed_out_users').insert({
        stream_id: streamId,
        user_id: userId,
        end_time: timeoutUntil,
      });

      console.log('⏱️ Applied 1-minute spam timeout for user:', userId);

      // Clear message timestamps
      this.userMessageTimestamps.delete(userId);
    } catch (error) {
      console.error('Error applying spam timeout:', error);
    }
  }

  /**
   * Check message for hate speech
   * Returns { blocked: true, reason } if message should be blocked
   */
  checkHateSpeech(message: string): {
    blocked: boolean;
    reason?: string;
    violationType?: 'n_word' | 'sexual_threat' | 'violent_threat' | 'other';
  } {
    const lowerMessage = message.toLowerCase();

    for (const pattern of HATE_SPEECH_PATTERNS) {
      if (pattern.test(lowerMessage)) {
        let violationType: 'n_word' | 'sexual_threat' | 'violent_threat' | 'other' = 'other';

        if (pattern.source.includes('nigg')) {
          violationType = 'n_word';
        } else if (pattern.source.includes('rap') || pattern.source.includes('sexu')) {
          violationType = 'sexual_threat';
        } else if (pattern.source.includes('kill') || pattern.source.includes('die') || pattern.source.includes('murder')) {
          violationType = 'violent_threat';
        }

        return {
          blocked: true,
          reason: 'Message blocked for violating guidelines.',
          violationType,
        };
      }
    }

    return { blocked: false };
  }

  /**
   * Record hate speech block
   */
  async recordHateSpeechBlock(
    userId: string,
    streamId: string,
    message: string,
    violationType: 'n_word' | 'sexual_threat' | 'violent_threat' | 'other'
  ): Promise<void> {
    try {
      await supabase.from('hate_speech_blocks').insert({
        user_id: userId,
        stream_id: streamId,
        blocked_message: message,
        violation_type: violationType,
      });

      // Issue a warning strike
      await this.issueAutomatedStrike(userId, 'hate_speech', violationType);

      console.log('🚫 Recorded hate speech block for user:', userId);
    } catch (error) {
      console.error('Error recording hate speech block:', error);
    }
  }

  /**
   * Track harassment (multiple users reporting same user)
   */
  async trackHarassmentReport(
    reportedUserId: string,
    reporterUserId: string,
    streamId: string
  ): Promise<{ autoTimeoutApplied: boolean }> {
    try {
      // Get or create harassment tracking record
      const { data: existing } = await supabase
        .from('harassment_tracking')
        .select('*')
        .eq('reported_user_id', reportedUserId)
        .eq('stream_id', streamId)
        .single();

      if (existing) {
        // Update existing record
        const reporterIds = existing.reporter_ids || [];
        if (!reporterIds.includes(reporterUserId)) {
          reporterIds.push(reporterUserId);

          const { error } = await supabase
            .from('harassment_tracking')
            .update({
              reporter_ids: reporterIds,
              report_count: reporterIds.length,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);

          if (error) {
            console.error('Error updating harassment tracking:', error);
          }

          // Apply auto-timeout if 3+ unique reporters and not already applied
          if (reporterIds.length >= 3 && !existing.auto_timeout_applied) {
            await this.applyHarassmentTimeout(reportedUserId, streamId, existing.id);
            return { autoTimeoutApplied: true };
          }
        }
      } else {
        // Create new tracking record
        await supabase.from('harassment_tracking').insert({
          reported_user_id: reportedUserId,
          stream_id: streamId,
          reporter_ids: [reporterUserId],
          report_count: 1,
        });
      }

      return { autoTimeoutApplied: false };
    } catch (error) {
      console.error('Error tracking harassment report:', error);
      return { autoTimeoutApplied: false };
    }
  }

  /**
   * Apply 5-minute timeout for harassment
   */
  private async applyHarassmentTimeout(
    userId: string,
    streamId: string,
    trackingId: string
  ): Promise<void> {
    try {
      const timeoutUntil = new Date(Date.now() + 5 * 60 * 1000).toISOString();

      // Apply timeout
      await supabase.from('timed_out_users').insert({
        stream_id: streamId,
        user_id: userId,
        end_time: timeoutUntil,
      });

      // Update tracking record
      await supabase
        .from('harassment_tracking')
        .update({
          auto_timeout_applied: true,
          timeout_until: timeoutUntil,
        })
        .eq('id', trackingId);

      // Issue a warning strike
      await this.issueAutomatedStrike(userId, 'harassment', 'multiple_reports');

      console.log('⏱️ Applied 5-minute harassment timeout for user:', userId);
    } catch (error) {
      console.error('Error applying harassment timeout:', error);
    }
  }

  /**
   * Issue automated strike and send inbox warning
   */
  private async issueAutomatedStrike(
    userId: string,
    strikeType: string,
    reason: string
  ): Promise<void> {
    try {
      // Check existing active strikes
      const { data: activeStrikes } = await supabase
        .from('content_safety_strikes')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true)
        .gte('expires_at', new Date().toISOString());

      const strikeCount = (activeStrikes?.length || 0) + 1;
      const strikeLevel = Math.min(strikeCount, 3) as 1 | 2 | 3;

      // Strikes expire in 30 days
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      // Create strike
      await supabase.from('content_safety_strikes').insert({
        user_id: userId,
        strike_type: strikeType,
        strike_message: `You have been flagged for ${reason}. Violations expire in 30 days.`,
        strike_level: strikeLevel,
        expires_at: expiresAt.toISOString(),
        active: true,
      });

      // Send inbox notification
      await supabase.from('notifications').insert({
        type: 'message',
        receiver_id: userId,
        message: `You have been flagged for ${reason}. Violations expire in 30 days. (Strike ${strikeCount}/3)`,
      });

      // If 3 strikes, disable streaming
      if (strikeCount >= 3) {
        await this.disableStreaming(userId);
      }

      console.log(`⚠️ Issued strike ${strikeCount}/3 for user:`, userId);
    } catch (error) {
      console.error('Error issuing automated strike:', error);
    }
  }

  /**
   * Disable streaming for user with 3 strikes
   */
  private async disableStreaming(userId: string): Promise<void> {
    try {
      // Create suspension
      await supabase.from('suspension_history').insert({
        user_id: userId,
        suspension_type: 'temporary',
        start_at: new Date().toISOString(),
        end_at: null, // Until strikes expire
        reason: 'Streaming disabled due to repeated violations (3 active strikes)',
        admin_id: null, // Automated
      });

      // Send notification
      await supabase.from('notifications').insert({
        type: 'message',
        receiver_id: userId,
        message: 'Streaming disabled due to repeated violations. Your strikes will expire in 30 days.',
      });

      console.log('🚫 Disabled streaming for user:', userId);
    } catch (error) {
      console.error('Error disabling streaming:', error);
    }
  }

  /**
   * Get active mass report event for stream
   */
  async getActiveMassReportEvent(streamId: string): Promise<MassReportEvent | null> {
    try {
      const { data, error } = await supabase
        .from('mass_report_events')
        .select('*')
        .eq('stream_id', streamId)
        .is('resolved_at', null)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching mass report event:', error);
        return null;
      }

      return data as MassReportEvent | null;
    } catch (error) {
      console.error('Error in getActiveMassReportEvent:', error);
      return null;
    }
  }

  /**
   * Submit ban appeal
   */
  async submitBanAppeal(userId: string, reason: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { error } = await supabase.from('ban_appeals').insert({
        user_id: userId,
        appeal_reason: reason,
        status: 'pending',
      });

      if (error) {
        console.error('Error submitting ban appeal:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Ban appeal submitted for user:', userId);
      return { success: true };
    } catch (error) {
      console.error('Error in submitBanAppeal:', error);
      return { success: false, error: 'Failed to submit appeal' };
    }
  }

  /**
   * Get ban appeals (admin)
   */
  async getBanAppeals(status?: 'pending' | 'approved' | 'rejected'): Promise<any[]> {
    try {
      let query = supabase
        .from('ban_appeals')
        .select('*, profiles!ban_appeals_user_id_fkey(*)')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching ban appeals:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getBanAppeals:', error);
      return [];
    }
  }

  /**
   * Review ban appeal (admin)
   */
  async reviewBanAppeal(
    appealId: string,
    status: 'approved' | 'rejected',
    adminId: string,
    adminNotes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('ban_appeals')
        .update({
          status,
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes || null,
        })
        .eq('id', appealId);

      if (error) {
        console.error('Error reviewing ban appeal:', error);
        return { success: false, error: error.message };
      }

      // If approved, clear strikes and suspensions
      if (status === 'approved') {
        const { data: appeal } = await supabase
          .from('ban_appeals')
          .select('user_id')
          .eq('id', appealId)
          .single();

        if (appeal) {
          await this.clearUserViolations(appeal.user_id);
        }
      }

      console.log('✅ Ban appeal reviewed:', status);
      return { success: true };
    } catch (error) {
      console.error('Error in reviewBanAppeal:', error);
      return { success: false, error: 'Failed to review appeal' };
    }
  }

  /**
   * Clear user violations (used when appeal is approved)
   */
  private async clearUserViolations(userId: string): Promise<void> {
    try {
      // Deactivate all strikes
      await supabase
        .from('content_safety_strikes')
        .update({ active: false })
        .eq('user_id', userId);

      // End all suspensions
      await supabase
        .from('suspension_history')
        .update({ end_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('end_at', null);

      console.log('✅ Cleared violations for user:', userId);
    } catch (error) {
      console.error('Error clearing user violations:', error);
    }
  }
}

export const automatedSafetyService = new AutomatedSafetyService();