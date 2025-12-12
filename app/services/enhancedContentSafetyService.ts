
import { supabase } from '@/app/integrations/supabase/client';
import { notificationService } from './notificationService';
import { Platform } from 'react-native';
import * as Network from 'expo-network';

export type ReportCategory = 
  | 'harassment_bullying'
  | 'violent_threats'
  | 'sexual_content_minors'
  | 'illegal_content'
  | 'self_harm_encouragement'
  | 'racism_identity_targeting'
  | 'spam_bot_behavior'
  | 'hate_extremist_messaging';

export interface CreatorRulesAcceptance {
  id: string;
  user_id: string;
  accepted_at: string;
  device: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface SafetyAcknowledgement {
  id: string;
  user_id: string;
  accepted_at: string;
  guidelines_version: string;
  created_at: string;
}

export interface ForcedReviewLock {
  id: string;
  user_id: string;
  locked_at: string;
  reason: string;
  report_count: number;
  unlocked_at: string | null;
  unlocked_by: string | null;
  is_active: boolean;
  created_at: string;
}

class EnhancedContentSafetyService {
  // ============================================
  // PROMPT 2: Creator Rules Modal
  // ============================================

  /**
   * Log creator rules acceptance before streaming
   */
  async logCreatorRulesAcceptance(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get device info
      const device = Platform.OS;
      
      // Get IP address (best effort)
      let ipAddress: string | null = null;
      try {
        const networkState = await Network.getIpAddressAsync();
        ipAddress = networkState || null;
      } catch (error) {
        console.log('Could not get IP address:', error);
      }

      const { error } = await supabase.from('creator_rules_acceptance').insert({
        user_id: userId,
        device,
        ip_address: ipAddress,
      });

      if (error) {
        console.error('Error logging creator rules acceptance:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Creator rules acceptance logged');
      return { success: true };
    } catch (error) {
      console.error('Error in logCreatorRulesAcceptance:', error);
      return { success: false, error: 'Failed to log acceptance' };
    }
  }

  /**
   * Check if user has accepted creator rules recently (within last 30 days)
   */
  async hasAcceptedCreatorRulesRecently(userId: string): Promise<boolean> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('creator_rules_acceptance')
        .select('id')
        .eq('user_id', userId)
        .gte('accepted_at', thirtyDaysAgo.toISOString())
        .order('accepted_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking creator rules acceptance:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error in hasAcceptedCreatorRulesRecently:', error);
      return false;
    }
  }

  // ============================================
  // PROMPT 3: Report Reason Categories
  // ============================================

  /**
   * Submit a report with proper categories
   */
  async submitReport(
    reportedUserId: string,
    reporterUserId: string,
    streamId: string | null,
    category: ReportCategory,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Map severity based on category
      const severityMap: Record<ReportCategory, 1 | 2 | 3> = {
        harassment_bullying: 2,
        violent_threats: 3,
        sexual_content_minors: 3,
        illegal_content: 3,
        self_harm_encouragement: 3,
        racism_identity_targeting: 2,
        spam_bot_behavior: 1,
        hate_extremist_messaging: 3,
      };

      const severity = severityMap[category];

      // Insert violation record
      const { error: violationError } = await supabase
        .from('content_safety_violations')
        .insert({
          reported_user_id: reportedUserId,
          reporter_user_id: reporterUserId,
          stream_id: streamId,
          violation_reason: category,
          notes: notes || null,
          severity_level: severity,
          resolved: false,
        });

      if (violationError) {
        console.error('Error submitting report:', violationError);
        return { success: false, error: violationError.message };
      }

      // Generate inbox message to user under review
      const categoryLabels: Record<ReportCategory, string> = {
        harassment_bullying: 'Harassment / Bullying',
        violent_threats: 'Violent Threats',
        sexual_content_minors: 'Sexual Content Involving Minors',
        illegal_content: 'Illegal Content',
        self_harm_encouragement: 'Self-Harm Encouragement',
        racism_identity_targeting: 'Racism or Identity Targeting',
        spam_bot_behavior: 'Spam / Bot Behavior',
        hate_extremist_messaging: 'Hate or Extremist Messaging',
      };

      await notificationService.createNotification(
        reporterUserId,
        reportedUserId,
        'message',
        `Your content has been reported for: ${categoryLabels[category]}. Our team will review this report.`
      );

      // Check if this triggers forced review (6 reports in 3 days)
      await this.checkAndApplyForcedReview(reportedUserId);

      console.log('✅ Report submitted successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in submitReport:', error);
      return { success: false, error: 'Failed to submit report' };
    }
  }

  // ============================================
  // PROMPT 4: Auto Expiration Logic
  // ============================================

  /**
   * Expire strikes based on their level
   * Strike Level 1 → expires after 7 days
   * Strike Level 2 → expires after 30 days
   * Strike Level 3 → expires after 60 days
   */
  async expireStrikes(): Promise<void> {
    try {
      const now = new Date();

      // Get all active strikes that should expire
      const { data: strikes, error } = await supabase
        .from('content_safety_strikes')
        .select('*')
        .eq('active', true)
        .lte('expires_at', now.toISOString());

      if (error) {
        console.error('Error fetching strikes to expire:', error);
        return;
      }

      if (!strikes || strikes.length === 0) {
        console.log('No strikes to expire');
        return;
      }

      // Expire each strike
      for (const strike of strikes) {
        await supabase
          .from('content_safety_strikes')
          .update({ active: false })
          .eq('id', strike.id);

        // Notify user
        await notificationService.createNotification(
          strike.user_id,
          strike.user_id,
          'message',
          'Your strike has expired.'
        );

        console.log(`✅ Strike ${strike.id} expired for user ${strike.user_id}`);
      }
    } catch (error) {
      console.error('Error in expireStrikes:', error);
    }
  }

  /**
   * Check and notify users when suspensions end
   */
  async checkSuspensionEnds(): Promise<void> {
    try {
      const now = new Date();

      // Get suspensions that just ended
      const { data: suspensions, error } = await supabase
        .from('suspension_history')
        .select('*')
        .not('end_at', 'is', null)
        .lte('end_at', now.toISOString())
        .gte('end_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours

      if (error) {
        console.error('Error fetching ended suspensions:', error);
        return;
      }

      if (!suspensions || suspensions.length === 0) {
        return;
      }

      // Notify each user
      for (const suspension of suspensions) {
        await notificationService.createNotification(
          suspension.user_id,
          suspension.user_id,
          'message',
          'Your access is now restored.'
        );

        console.log(`✅ Notified user ${suspension.user_id} of suspension end`);
      }
    } catch (error) {
      console.error('Error in checkSuspensionEnds:', error);
    }
  }

  // ============================================
  // PROMPT 5: Safety Acknowledgement
  // ============================================

  /**
   * Check if user has accepted safety guidelines
   */
  async hasSafetyAcknowledgement(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('safety_acknowledgement')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking safety acknowledgement:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error in hasSafetyAcknowledgement:', error);
      return false;
    }
  }

  /**
   * Record safety acknowledgement
   */
  async recordSafetyAcknowledgement(
    userId: string,
    guidelinesVersion: string = '1.0'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from('safety_acknowledgement').insert({
        user_id: userId,
        guidelines_version: guidelinesVersion,
      });

      if (error) {
        console.error('Error recording safety acknowledgement:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Safety acknowledgement recorded');
      return { success: true };
    } catch (error) {
      console.error('Error in recordSafetyAcknowledgement:', error);
      return { success: false, error: 'Failed to record acknowledgement' };
    }
  }

  /**
   * Check if user can livestream (requires safety acknowledgement)
   */
  async canUserLivestream(userId: string): Promise<{ canStream: boolean; reason?: string }> {
    const hasAcknowledgement = await this.hasSafetyAcknowledgement(userId);
    
    if (!hasAcknowledgement) {
      return {
        canStream: false,
        reason: 'You must accept the Community Guidelines before you can livestream.',
      };
    }

    return { canStream: true };
  }

  // ============================================
  // PROMPT 6: Forced Review System
  // ============================================

  /**
   * Check if user has 6 reports within 3 days and apply forced review lock
   */
  async checkAndApplyForcedReview(userId: string): Promise<void> {
    try {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      // Count reports in last 3 days
      const { count, error } = await supabase
        .from('content_safety_violations')
        .select('*', { count: 'exact', head: true })
        .eq('reported_user_id', userId)
        .gte('created_at', threeDaysAgo.toISOString());

      if (error) {
        console.error('Error counting reports:', error);
        return;
      }

      const reportCount = count || 0;

      // If 6 or more reports, apply forced review lock
      if (reportCount >= 6) {
        // Check if already locked
        const { data: existingLock } = await supabase
          .from('forced_review_locks')
          .select('id')
          .eq('user_id', userId)
          .eq('is_active', true)
          .single();

        if (!existingLock) {
          // Create lock
          await supabase.from('forced_review_locks').insert({
            user_id: userId,
            reason: `Received ${reportCount} reports within 3 days`,
            report_count: reportCount,
            is_active: true,
          });

          // Notify user
          await notificationService.createNotification(
            userId,
            userId,
            'message',
            'You are temporarily paused due to safety review. You will be notified after review.'
          );

          console.log(`🔒 Forced review lock applied to user ${userId}`);
        }
      }
    } catch (error) {
      console.error('Error in checkAndApplyForcedReview:', error);
    }
  }

  /**
   * Check if user is under forced review lock
   */
  async isUserLockedForReview(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('forced_review_locks')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking forced review lock:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error in isUserLockedForReview:', error);
      return false;
    }
  }

  /**
   * Get active forced review lock for user
   */
  async getForcedReviewLock(userId: string): Promise<ForcedReviewLock | null> {
    try {
      const { data, error } = await supabase
        .from('forced_review_locks')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching forced review lock:', error);
        return null;
      }

      return data as ForcedReviewLock | null;
    } catch (error) {
      console.error('Error in getForcedReviewLock:', error);
      return null;
    }
  }

  /**
   * Unlock user from forced review (admin only)
   */
  async unlockForcedReview(
    userId: string,
    adminId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('forced_review_locks')
        .update({
          is_active: false,
          unlocked_at: new Date().toISOString(),
          unlocked_by: adminId,
        })
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        console.error('Error unlocking forced review:', error);
        return { success: false, error: error.message };
      }

      // Notify user
      await notificationService.createNotification(
        adminId,
        userId,
        'message',
        'Your account has been reviewed and restored. You can now use all features.'
      );

      console.log('✅ Forced review lock removed');
      return { success: true };
    } catch (error) {
      console.error('Error in unlockForcedReview:', error);
      return { success: false, error: 'Failed to unlock review' };
    }
  }

  /**
   * Get report categories with labels
   */
  getReportCategories(): { value: ReportCategory; label: string }[] {
    return [
      { value: 'harassment_bullying', label: 'Harassment / Bullying' },
      { value: 'violent_threats', label: 'Violent threats' },
      { value: 'sexual_content_minors', label: 'Sexual content involving minors' },
      { value: 'illegal_content', label: 'Illegal content' },
      { value: 'self_harm_encouragement', label: 'Self-harm encouragement' },
      { value: 'racism_identity_targeting', label: 'Racism or identity targeting' },
      { value: 'spam_bot_behavior', label: 'Spam / Bot behavior' },
      { value: 'hate_extremist_messaging', label: 'Hate or extremist messaging' },
    ];
  }
}

export const enhancedContentSafetyService = new EnhancedContentSafetyService();