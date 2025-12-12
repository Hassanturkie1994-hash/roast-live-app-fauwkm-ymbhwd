
import { supabase } from '@/app/integrations/supabase/client';
import { aiModerationService } from './aiModerationService';
import { inboxService } from './inboxService';

interface SafetyEvent {
  userId: string;
  eventType:
    | 'toxic_comment'
    | 'harassment_pattern'
    | 'repeated_report'
    | 'multi_account_pattern'
    | 'fake_engagement_spam_like'
    | 'fake_engagement_spam_follow'
    | 'fake_engagement_spam_comment';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: any;
  relatedUserId?: string;
  streamId?: string;
}

interface BehaviorPattern {
  userId: string;
  pattern: string;
  occurrences: number;
  timeWindow: number; // minutes
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class BehavioralSafetyService {
  /**
   * Detect toxic comment patterns
   */
  async detectToxicComments(userId: string, streamId?: string): Promise<boolean> {
    try {
      // Get recent violations for this user
      const { data: violations } = await supabase
        .from('user_violations')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (!violations || violations.length === 0) return false;

      // Check for pattern: 3+ toxic comments in 24 hours
      const toxicCount = violations.filter(v => v.toxicity_score > 0.5).length;

      if (toxicCount >= 3) {
        await this.logSafetyEvent({
          userId,
          eventType: 'toxic_comment',
          severity: toxicCount >= 5 ? 'high' : 'medium',
          details: {
            count: toxicCount,
            timeWindow: '24h',
            violations: violations.slice(0, 5),
          },
          streamId,
        });

        // Take action based on severity
        if (toxicCount >= 5) {
          await this.applyShadowBan(userId, 'Repeated toxic comments');
        } else {
          await this.sendSoftWarning(userId, 'Please be respectful in your comments.');
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error('Error detecting toxic comments:', error);
      return false;
    }
  }

  /**
   * Detect harassment patterns
   */
  async detectHarassmentPattern(
    userId: string,
    targetUserId: string,
    streamId?: string
  ): Promise<boolean> {
    try {
      // Get recent violations targeting specific user
      const { data: violations } = await supabase
        .from('user_violations')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (!violations) return false;

      // Check for harassment pattern: multiple violations mentioning same user
      const harassmentCount = violations.filter(v => {
        const text = v.flagged_text.toLowerCase();
        // This is simplified - in production, use more sophisticated matching
        return v.harassment_score > 0.6;
      }).length;

      if (harassmentCount >= 3) {
        await this.logSafetyEvent({
          userId,
          eventType: 'harassment_pattern',
          severity: 'high',
          details: {
            count: harassmentCount,
            targetUserId,
            timeWindow: '7d',
          },
          relatedUserId: targetUserId,
          streamId,
        });

        // Escalate to human review
        await this.escalateToHumanReview(
          userId,
          'harassment_pattern',
          `User has ${harassmentCount} harassment violations in the past week`
        );

        return true;
      }

      return false;
    } catch (error) {
      console.error('Error detecting harassment pattern:', error);
      return false;
    }
  }

  /**
   * Detect repeated reports against a user
   */
  async detectRepeatedReports(userId: string): Promise<boolean> {
    try {
      // Get recent reports against this user
      const { data: reports } = await supabase
        .from('user_reports')
        .select('*')
        .eq('reported_user_id', userId)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (!reports || reports.length < 5) return false;

      // Check for pattern: 5+ reports in 7 days
      await this.logSafetyEvent({
        userId,
        eventType: 'repeated_report',
        severity: reports.length >= 10 ? 'critical' : 'high',
        details: {
          count: reports.length,
          timeWindow: '7d',
          reportTypes: reports.map(r => r.type),
        },
      });

      // Escalate to human review
      await this.escalateToHumanReview(
        userId,
        'repeated_reports',
        `User has received ${reports.length} reports in the past week`
      );

      return true;
    } catch (error) {
      console.error('Error detecting repeated reports:', error);
      return false;
    }
  }

  /**
   * Detect multi-account patterns
   */
  async detectMultiAccountPattern(userId: string): Promise<boolean> {
    try {
      // Get device fingerprints for this user
      const { data: fingerprints } = await supabase
        .from('device_fingerprints')
        .select('device_hash')
        .eq('user_id', userId);

      if (!fingerprints || fingerprints.length === 0) return false;

      // Check if same device is used by multiple accounts
      const deviceHashes = fingerprints.map(f => f.device_hash);

      const { data: otherUsers } = await supabase
        .from('device_fingerprints')
        .select('user_id')
        .in('device_hash', deviceHashes)
        .neq('user_id', userId);

      if (!otherUsers || otherUsers.length < 2) return false;

      // Pattern detected: same device used by 3+ accounts
      await this.logSafetyEvent({
        userId,
        eventType: 'multi_account_pattern',
        severity: 'high',
        details: {
          deviceCount: fingerprints.length,
          relatedAccounts: otherUsers.length,
          deviceHashes,
        },
      });

      // Escalate to human review
      await this.escalateToHumanReview(
        userId,
        'multi_account_pattern',
        `User shares device with ${otherUsers.length} other accounts`
      );

      return true;
    } catch (error) {
      console.error('Error detecting multi-account pattern:', error);
      return false;
    }
  }

  /**
   * Detect fake engagement (spam liking)
   */
  async detectSpamLiking(userId: string): Promise<boolean> {
    try {
      // Get recent likes by this user
      const { data: likes } = await supabase
        .from('post_likes_v2')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (!likes || likes.length < 20) return false;

      // Check for pattern: 20+ likes in 1 hour
      await this.logSafetyEvent({
        userId,
        eventType: 'fake_engagement_spam_like',
        severity: likes.length >= 50 ? 'high' : 'medium',
        details: {
          count: likes.length,
          timeWindow: '1h',
        },
      });

      // Apply auto timeout
      await this.applyAutoTimeout(userId, 30, 'Spam liking detected');

      return true;
    } catch (error) {
      console.error('Error detecting spam liking:', error);
      return false;
    }
  }

  /**
   * Detect fake engagement (spam following)
   */
  async detectSpamFollowing(userId: string): Promise<boolean> {
    try {
      // Get recent follows by this user
      const { data: follows } = await supabase
        .from('followers')
        .select('created_at')
        .eq('follower_id', userId)
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (!follows || follows.length < 10) return false;

      // Check for pattern: 10+ follows in 1 hour
      await this.logSafetyEvent({
        userId,
        eventType: 'fake_engagement_spam_follow',
        severity: follows.length >= 20 ? 'high' : 'medium',
        details: {
          count: follows.length,
          timeWindow: '1h',
        },
      });

      // Apply auto timeout
      await this.applyAutoTimeout(userId, 60, 'Spam following detected');

      return true;
    } catch (error) {
      console.error('Error detecting spam following:', error);
      return false;
    }
  }

  /**
   * Log safety event
   */
  private async logSafetyEvent(event: SafetyEvent) {
    try {
      const { error } = await supabase.from('user_safety_events').insert({
        user_id: event.userId,
        event_type: event.eventType,
        severity: event.severity,
        details: event.details,
        related_user_id: event.relatedUserId,
        stream_id: event.streamId,
      });

      if (error) {
        console.error('Error logging safety event:', error);
      } else {
        console.log(`🛡️ Safety event logged: ${event.eventType} (${event.severity})`);
      }
    } catch (error) {
      console.error('Error in logSafetyEvent:', error);
    }
  }

  /**
   * Send soft warning to user
   */
  private async sendSoftWarning(userId: string, message: string) {
    try {
      await inboxService.sendMessage(userId, userId, `⚠️ Warning: ${message}`, 'safety');
      console.log(`⚠️ Soft warning sent to user ${userId}`);
    } catch (error) {
      console.error('Error sending soft warning:', error);
    }
  }

  /**
   * Apply shadow ban (comments visible only to sender)
   */
  private async applyShadowBan(userId: string, reason: string) {
    try {
      // Update user's safety status
      await this.logSafetyEvent({
        userId,
        eventType: 'toxic_comment',
        severity: 'high',
        details: {
          action: 'shadow_ban',
          reason,
          duration: '24h',
        },
      });

      // Send notification
      await inboxService.sendMessage(
        userId,
        userId,
        '🔇 Your comments are currently under review. They may not be visible to others.',
        'safety'
      );

      console.log(`🔇 Shadow ban applied to user ${userId}`);
    } catch (error) {
      console.error('Error applying shadow ban:', error);
    }
  }

  /**
   * Apply auto timeout
   */
  private async applyAutoTimeout(userId: string, durationMinutes: number, reason: string) {
    try {
      const endTime = new Date();
      endTime.setMinutes(endTime.getMinutes() + durationMinutes);

      await supabase.from('timed_out_users_v2').insert({
        user_id: userId,
        duration_minutes: durationMinutes,
        reason,
        end_time: endTime.toISOString(),
      });

      // Log safety event
      await this.logSafetyEvent({
        userId,
        eventType: 'fake_engagement_spam_like',
        severity: 'medium',
        details: {
          action: 'auto_timeout',
          reason,
          duration: `${durationMinutes}m`,
        },
      });

      // Send notification
      await inboxService.sendMessage(
        userId,
        userId,
        `⏱️ You have been timed out for ${durationMinutes} minutes. Reason: ${reason}`,
        'safety'
      );

      console.log(`⏱️ Auto timeout applied to user ${userId} for ${durationMinutes} minutes`);
    } catch (error) {
      console.error('Error applying auto timeout:', error);
    }
  }

  /**
   * Escalate to human review
   */
  private async escalateToHumanReview(userId: string, category: string, reason: string) {
    try {
      // Create moderator review queue entry
      await supabase.from('moderator_review_queue').insert({
        user_id: userId,
        reported_by_ai: true,
        source_type: 'live',
        content_preview: reason,
        risk_score: 0.8,
        category,
        resolution_status: 'pending',
      });

      // Log safety event
      await this.logSafetyEvent({
        userId,
        eventType: 'harassment_pattern',
        severity: 'critical',
        details: {
          action: 'human_review',
          category,
          reason,
        },
      });

      console.log(`👁️ Escalated to human review: ${userId} - ${category}`);
    } catch (error) {
      console.error('Error escalating to human review:', error);
    }
  }

  /**
   * Run comprehensive safety check on user
   */
  async runSafetyCheck(userId: string, streamId?: string): Promise<{
    passed: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    // Run all detection checks
    const toxicComments = await this.detectToxicComments(userId, streamId);
    if (toxicComments) issues.push('Toxic comment pattern detected');

    const spamLiking = await this.detectSpamLiking(userId);
    if (spamLiking) issues.push('Spam liking detected');

    const spamFollowing = await this.detectSpamFollowing(userId);
    if (spamFollowing) issues.push('Spam following detected');

    const repeatedReports = await this.detectRepeatedReports(userId);
    if (repeatedReports) issues.push('Multiple reports received');

    const multiAccount = await this.detectMultiAccountPattern(userId);
    if (multiAccount) issues.push('Multi-account pattern detected');

    return {
      passed: issues.length === 0,
      issues,
    };
  }

  /**
   * Get safety events for a user
   */
  async getUserSafetyEvents(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('user_safety_events')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching safety events:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserSafetyEvents:', error);
      return [];
    }
  }

  /**
   * Get all unresolved safety events for admin dashboard
   */
  async getUnresolvedSafetyEvents(limit: number = 100): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('user_safety_events')
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .is('resolved_at', null)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching unresolved safety events:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUnresolvedSafetyEvents:', error);
      return [];
    }
  }

  /**
   * Resolve safety event
   */
  async resolveSafetyEvent(eventId: string, adminId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_safety_events')
        .update({
          resolved_at: new Date().toISOString(),
          resolved_by: adminId,
        })
        .eq('id', eventId);

      if (error) {
        console.error('Error resolving safety event:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in resolveSafetyEvent:', error);
      return false;
    }
  }
}

export const behavioralSafetyService = new BehavioralSafetyService();