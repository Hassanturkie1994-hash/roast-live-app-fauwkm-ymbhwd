
import { supabase } from '@/app/integrations/supabase/client';
import { inboxService } from './inboxService';
import { pushNotificationService } from './pushNotificationService';

export interface ModeratorReviewItem {
  id: string;
  violation_id: string;
  user_id: string;
  reported_by_ai: boolean;
  source_type: 'live' | 'comment' | 'inboxMessage';
  content_preview: string;
  risk_score: number;
  category: string;
  stream_id?: string;
  assigned_moderator_id?: string;
  resolution_status: 'pending' | 'approved' | 'rejected' | 'escalated';
  resolution_timestamp?: string;
  moderator_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminPenalty {
  id: string;
  user_id: string;
  admin_id: string;
  severity: 'temporary' | 'permanent';
  reason: string;
  duration_hours?: number;
  evidence_link?: string;
  policy_reference?: string;
  issued_at: string;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
}

class EscalationService {
  /**
   * PROMPT 1: AI → Moderator Escalation
   * When AI flags content at severity score ≥ 0.60 but < 0.85: Escalate to human moderator review queue
   */
  async escalateToModerator(
    violationId: string,
    userId: string,
    sourceType: 'live' | 'comment' | 'inboxMessage',
    contentPreview: string,
    riskScore: number,
    category: string,
    streamId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('moderator_review_queue')
        .insert({
          violation_id: violationId,
          user_id: userId,
          reported_by_ai: true,
          source_type: sourceType,
          content_preview: contentPreview,
          risk_score: riskScore,
          category,
          stream_id: streamId || null,
          resolution_status: 'pending',
        })
        .select()
        .single();

      if (error) {
        console.error('Error escalating to moderator:', error);
        return { success: false, error: error.message };
      }

      console.log(`🚨 Escalated to moderator review: ${violationId}`);
      return { success: true };
    } catch (error: any) {
      console.error('Error in escalateToModerator:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get moderator review queue items
   * Moderators only see items from streams they moderate
   */
  async getModeratorReviewQueue(
    moderatorId: string,
    status?: 'pending' | 'approved' | 'rejected' | 'escalated'
  ): Promise<ModeratorReviewItem[]> {
    try {
      let query = supabase
        .from('moderator_review_queue')
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            display_name,
            avatar_url
          ),
          streams:stream_id (
            id,
            title,
            broadcaster_id
          )
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('resolution_status', status);
      }

      // Filter to only show items from streams the moderator moderates
      // or items assigned to them
      query = query.or(`assigned_moderator_id.eq.${moderatorId},stream_id.in.(
        SELECT stream_id FROM moderators WHERE user_id = '${moderatorId}'
      )`);

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching moderator review queue:', error);
        return [];
      }

      return data as ModeratorReviewItem[];
    } catch (error) {
      console.error('Error in getModeratorReviewQueue:', error);
      return [];
    }
  }

  /**
   * Get all review queue items (admin view)
   */
  async getAllReviewQueueItems(
    status?: 'pending' | 'approved' | 'rejected' | 'escalated'
  ): Promise<any[]> {
    try {
      let query = supabase
        .from('moderator_review_queue')
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            display_name,
            avatar_url
          ),
          streams:stream_id (
            id,
            title,
            broadcaster_id
          ),
          moderator:assigned_moderator_id (
            id,
            username,
            display_name
          )
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('resolution_status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching all review queue items:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllReviewQueueItems:', error);
      return [];
    }
  }

  /**
   * Get admin escalation queue (items escalated by moderators)
   */
  async getAdminEscalationQueue(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('moderator_review_queue')
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            display_name,
            avatar_url
          ),
          moderator:assigned_moderator_id (
            id,
            username,
            display_name
          )
        `)
        .eq('resolution_status', 'escalated')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching admin escalation queue:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAdminEscalationQueue:', error);
      return [];
    }
  }

  /**
   * Moderator decision: Approve message
   */
  async moderatorApprove(
    reviewId: string,
    moderatorId: string,
    moderatorName: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get the review item first to get user_id
      const { data: review } = await supabase
        .from('moderator_review_queue')
        .select('user_id')
        .eq('id', reviewId)
        .single();

      if (!review) {
        return { success: false, error: 'Review item not found' };
      }

      const { error } = await supabase
        .from('moderator_review_queue')
        .update({
          resolution_status: 'approved',
          resolution_timestamp: new Date().toISOString(),
          assigned_moderator_id: moderatorId,
          moderator_notes: reason || 'Message approved',
        })
        .eq('id', reviewId);

      if (error) {
        console.error('Error approving message:', error);
        return { success: false, error: error.message };
      }

      // Send inbox message to user
      await inboxService.createSystemMessage({
        receiver_id: review.user_id,
        title: 'Moderation Decision',
        message: `You have received a moderation decision from ${moderatorName}. Your message has been approved. Reason: ${reason || 'No issues found'}. If you want to appeal, open Appeals Center.`,
        category: 'safety',
      });

      console.log(`✅ Message approved by moderator ${moderatorId}`);
      return { success: true };
    } catch (error: any) {
      console.error('Error in moderatorApprove:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Moderator decision: Reject message (permanently hidden)
   */
  async moderatorReject(
    reviewId: string,
    moderatorId: string,
    moderatorName: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get the review item first to get user_id
      const { data: review } = await supabase
        .from('moderator_review_queue')
        .select('user_id')
        .eq('id', reviewId)
        .single();

      if (!review) {
        return { success: false, error: 'Review item not found' };
      }

      const { error } = await supabase
        .from('moderator_review_queue')
        .update({
          resolution_status: 'rejected',
          resolution_timestamp: new Date().toISOString(),
          assigned_moderator_id: moderatorId,
          moderator_notes: reason,
        })
        .eq('id', reviewId);

      if (error) {
        console.error('Error rejecting message:', error);
        return { success: false, error: error.message };
      }

      // Send inbox message to user
      await inboxService.createSystemMessage({
        receiver_id: review.user_id,
        title: 'Moderation Decision',
        message: `You have received a moderation decision from ${moderatorName}. Your message has been permanently hidden. Reason: ${reason}. If you want to appeal, open Appeals Center.`,
        category: 'safety',
      });

      console.log(`❌ Message rejected by moderator ${moderatorId}`);
      return { success: true };
    } catch (error: any) {
      console.error('Error in moderatorReject:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * PROMPT 2: Moderator decision: Timeout user (5-60 minutes) + SEND PUSH NOTIFICATION
   */
  async moderatorTimeout(
    reviewId: string,
    moderatorId: string,
    moderatorName: string,
    durationMinutes: number,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (durationMinutes < 5 || durationMinutes > 60) {
        return { success: false, error: 'Duration must be between 5 and 60 minutes' };
      }

      // Get the review item first to get user_id and stream_id
      const { data: review } = await supabase
        .from('moderator_review_queue')
        .select('user_id, stream_id')
        .eq('id', reviewId)
        .single();

      if (!review) {
        return { success: false, error: 'Review item not found' };
      }

      // Apply timeout
      const endTime = new Date();
      endTime.setMinutes(endTime.getMinutes() + durationMinutes);

      await supabase.from('timed_out_users_v2').insert({
        user_id: review.user_id,
        stream_id: review.stream_id,
        duration_minutes: durationMinutes,
        reason,
        end_time: endTime.toISOString(),
      });

      // Update review queue
      const { error } = await supabase
        .from('moderator_review_queue')
        .update({
          resolution_status: 'rejected',
          resolution_timestamp: new Date().toISOString(),
          assigned_moderator_id: moderatorId,
          moderator_notes: `Timeout applied: ${durationMinutes} minutes. ${reason}`,
        })
        .eq('id', reviewId);

      if (error) {
        console.error('Error updating review queue:', error);
        return { success: false, error: error.message };
      }

      // Send inbox message to user
      await inboxService.createSystemMessage({
        receiver_id: review.user_id,
        title: 'Moderation Decision',
        message: `You have received a moderation decision from ${moderatorName}. You have been timed out for ${durationMinutes} minutes. Reason: ${reason}. If you want to appeal, open Appeals Center.`,
        category: 'safety',
      });

      // PROMPT 2: Send push notification
      await pushNotificationService.sendPushNotification(
        review.user_id,
        'TIMEOUT_APPLIED',
        'You\'ve been timed out',
        `You cannot participate in chat for ${durationMinutes} minutes due to rule violations.`,
        { 
          stream_id: review.stream_id,
          duration_minutes: durationMinutes,
          moderator_name: moderatorName
        }
      );

      console.log(`⏱️ User ${review.user_id} timed out for ${durationMinutes} minutes by moderator ${moderatorId}`);
      return { success: true };
    } catch (error: any) {
      console.error('Error in moderatorTimeout:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * PROMPT 2: Moderator → Admin Escalation
   * Trigger cases: Hate speech, Threats, Sexual content involving minors, 
   * Impersonation, Racist content, Multi-violations
   */
  async escalateToAdmin(
    reviewId: string,
    moderatorId: string,
    reason: string,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('moderator_review_queue')
        .update({
          resolution_status: 'escalated',
          resolution_timestamp: new Date().toISOString(),
          assigned_moderator_id: moderatorId,
          moderator_notes: `ESCALATED TO ADMIN: ${reason}${notes ? '\n\n' + notes : ''}`,
        })
        .eq('id', reviewId);

      if (error) {
        console.error('Error escalating to admin:', error);
        return { success: false, error: error.message };
      }

      console.log(`🚨 Escalated to admin by moderator ${moderatorId}: ${reason}`);
      return { success: true };
    } catch (error: any) {
      console.error('Error in escalateToAdmin:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user history for admin review (last 20 messages, strike logs, timeout history, ban status)
   */
  async getUserHistory(userId: string): Promise<{
    messages: any[];
    strikes: any[];
    timeouts: any[];
    bans: any[];
    penalties: any[];
  }> {
    try {
      // Get last 20 messages
      const { data: messages } = await supabase
        .from('user_violations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      // Get strikes
      const { data: strikes } = await supabase
        .from('content_safety_strikes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Get timeouts
      const { data: timeouts } = await supabase
        .from('timed_out_users_v2')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Get bans
      const { data: bans } = await supabase
        .from('banned_viewers')
        .select('*')
        .eq('banned_user_id', userId)
        .order('created_at', { ascending: false });

      // Get admin penalties
      const { data: penalties } = await supabase
        .from('admin_penalties')
        .select('*')
        .eq('user_id', userId)
        .order('issued_at', { ascending: false});

      return {
        messages: messages || [],
        strikes: strikes || [],
        timeouts: timeouts || [],
        bans: bans || [],
        penalties: penalties || [],
      };
    } catch (error) {
      console.error('Error in getUserHistory:', error);
      return {
        messages: [],
        strikes: [],
        timeouts: [],
        bans: [],
        penalties: [],
      };
    }
  }

  /**
   * PROMPT 2: Admin decision: Apply penalty (temporary or permanent ban) + SEND PUSH NOTIFICATION
   */
  async adminApplyPenalty(
    userId: string,
    adminId: string,
    severity: 'temporary' | 'permanent',
    reason: string,
    durationHours?: number,
    evidenceLink?: string,
    policyReference?: string
  ): Promise<{ success: boolean; error?: string; penaltyId?: string }> {
    try {
      const expiresAt = severity === 'temporary' && durationHours
        ? new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString()
        : null;

      const { data, error } = await supabase
        .from('admin_penalties')
        .insert({
          user_id: userId,
          admin_id: adminId,
          severity,
          reason,
          duration_hours: durationHours || null,
          evidence_link: evidenceLink || null,
          policy_reference: policyReference || null,
          expires_at: expiresAt,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        console.error('Error applying admin penalty:', error);
        return { success: false, error: error.message };
      }

      // Send inbox message to user
      const durationText = severity === 'temporary' && durationHours
        ? ` for ${durationHours} hours`
        : '';

      await inboxService.createSystemMessage({
        receiver_id: userId,
        title: 'Administrative Action',
        message: `Your account has received an administrative action${durationText}. Reason: ${reason}. Decision is final unless appealed. You can appeal this decision in Settings > Account > Appeals Center.`,
        category: 'safety',
      });

      // PROMPT 2: Send push notification
      await pushNotificationService.sendPushNotification(
        userId,
        'BAN_APPLIED',
        'Administrative Action',
        `Your account has received an administrative action${durationText}. Reason: ${reason}`,
        { 
          penalty_id: data.id,
          severity,
          duration_hours: durationHours
        }
      );

      console.log(`🔨 Admin penalty applied: ${severity} - ${reason}`);
      return { success: true, penaltyId: data.id };
    } catch (error: any) {
      console.error('Error in adminApplyPenalty:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all admin penalties
   */
  async getAllAdminPenalties(activeOnly: boolean = false): Promise<any[]> {
    try {
      let query = supabase
        .from('admin_penalties')
        .select(`
          *,
          user:user_id (
            id,
            username,
            display_name,
            avatar_url
          ),
          admin:admin_id (
            id,
            username,
            display_name
          )
        `)
        .order('issued_at', { ascending: false });

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching admin penalties:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllAdminPenalties:', error);
      return [];
    }
  }

  /**
   * Get user's active penalties
   */
  async getUserActivePenalties(userId: string): Promise<AdminPenalty[]> {
    try {
      const { data, error } = await supabase
        .from('admin_penalties')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .or('expires_at.is.null,expires_at.gte.' + new Date().toISOString())
        .order('issued_at', { ascending: false });

      if (error) {
        console.error('Error fetching user active penalties:', error);
        return [];
      }

      return data as AdminPenalty[];
    } catch (error) {
      console.error('Error in getUserActivePenalties:', error);
      return [];
    }
  }

  /**
   * PROMPT 2: Deactivate penalty (admin action) + SEND PUSH NOTIFICATION for ban expiration
   */
  async deactivatePenalty(
    penaltyId: string,
    sendNotification: boolean = false
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get penalty details before deactivating
      const { data: penalty } = await supabase
        .from('admin_penalties')
        .select('user_id')
        .eq('id', penaltyId)
        .single();

      const { error } = await supabase
        .from('admin_penalties')
        .update({ is_active: false })
        .eq('id', penaltyId);

      if (error) {
        console.error('Error deactivating penalty:', error);
        return { success: false, error: error.message };
      }

      // PROMPT 2: Send push notification for ban expiration
      if (sendNotification && penalty) {
        await pushNotificationService.sendPushNotification(
          penalty.user_id,
          'BAN_EXPIRED',
          'Your restriction has ended',
          'You can now interact again. Please follow the community rules.',
          { penalty_id: penaltyId }
        );
      }

      console.log(`✅ Penalty deactivated: ${penaltyId}`);
      return { success: true };
    } catch (error: any) {
      console.error('Error in deactivatePenalty:', error);
      return { success: false, error: error.message };
    }
  }
}

export const escalationService = new EscalationService();