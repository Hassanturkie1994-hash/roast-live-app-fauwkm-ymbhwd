
import { supabase } from '@/app/integrations/supabase/client';
import { inboxService } from './inboxService';
import { pushNotificationService } from './pushNotificationService';

export interface Appeal {
  id: string;
  user_id: string;
  violation_id?: string;
  strike_id?: string;
  penalty_id?: string;
  appeal_reason: string;
  evidence_url?: string;
  appeal_screenshot_url?: string;
  status: 'pending' | 'approved' | 'denied';
  admin_decision?: string;
  resolution_message?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface Strike {
  id: string;
  user_id: string;
  strike_type: string;
  strike_message: string;
  strike_level: number;
  expires_at: string;
  created_at: string;
  active: boolean;
}

export interface Violation {
  id: string;
  reported_user_id: string;
  reporter_user_id?: string;
  stream_id?: string;
  violation_reason: string;
  notes?: string;
  severity_level: number;
  created_at: string;
  resolved: boolean;
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
}

class AppealsService {
  /**
   * Get user's strikes
   */
  async getUserStrikes(userId: string): Promise<Strike[]> {
    try {
      const { data, error } = await supabase
        .from('content_safety_strikes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching strikes:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching strikes:', error);
      return [];
    }
  }

  /**
   * Get user's violations
   */
  async getUserViolations(userId: string): Promise<Violation[]> {
    try {
      const { data, error } = await supabase
        .from('content_safety_violations')
        .select('*')
        .eq('reported_user_id', userId)
        .order('created_at', { ascending: false});

      if (error) {
        console.error('Error fetching violations:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching violations:', error);
      return [];
    }
  }

  /**
   * Get user's admin penalties
   */
  async getUserPenalties(userId: string): Promise<AdminPenalty[]> {
    try {
      const { data, error } = await supabase
        .from('admin_penalties')
        .select('*')
        .eq('user_id', userId)
        .order('issued_at', { ascending: false});

      if (error) {
        console.error('Error fetching penalties:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching penalties:', error);
      return [];
    }
  }

  /**
   * Get user's appeals
   */
  async getUserAppeals(userId: string): Promise<Appeal[]> {
    try {
      const { data, error } = await supabase
        .from('appeals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false});

      if (error) {
        console.error('Error fetching appeals:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching appeals:', error);
      return [];
    }
  }

  /**
   * PROMPT 3: Submit an appeal + SEND PUSH NOTIFICATION
   * Appeal reason (text field min 10 chars)
   * Optional screenshot upload
   */
  async submitAppeal(
    userId: string,
    linkedPenaltyId: string,
    appealReason: string,
    screenshotUrl?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (appealReason.length < 10) {
        return { success: false, error: 'Appeal reason must be at least 10 characters' };
      }

      // Check if penalty can be appealed
      const { data: penalty } = await supabase
        .from('admin_penalties')
        .select('*')
        .eq('id', linkedPenaltyId)
        .single();

      if (!penalty) {
        return { success: false, error: 'Penalty not found' };
      }

      // Check if penalty is for extreme cases that cannot be appealed
      const unappeableReasons = [
        'sexual content involving minors',
        'terror-related content',
        'fraud attempt',
      ];

      const isUnappeallable = unappeableReasons.some(reason => 
        penalty.reason.toLowerCase().includes(reason)
      );

      if (penalty.severity === 'permanent' && isUnappeallable) {
        return { 
          success: false, 
          error: 'This permanent ban cannot be appealed due to the severity of the violation.' 
        };
      }

      // Check if user already has a pending appeal for this penalty
      const { data: existingAppeal } = await supabase
        .from('appeals')
        .select('id')
        .eq('user_id', userId)
        .eq('penalty_id', linkedPenaltyId)
        .eq('status', 'pending')
        .single();

      if (existingAppeal) {
        return { success: false, error: 'You already have a pending appeal for this penalty' };
      }

      const { error } = await supabase
        .from('appeals')
        .insert({
          user_id: userId,
          penalty_id: linkedPenaltyId,
          appeal_reason: appealReason,
          appeal_screenshot_url: screenshotUrl || null,
          status: 'pending',
        });

      if (error) {
        console.error('Error submitting appeal:', error);
        return { success: false, error: error.message };
      }

      // Send notification to user
      await inboxService.sendMessage(
        userId,
        userId,
        'Your appeal has been submitted and is under review by administrators.',
        'safety'
      );

      // PROMPT 3: Send push notification
      await pushNotificationService.sendPushNotification(
        userId,
        'APPEAL_RECEIVED',
        'We received your appeal',
        'Our team will review your case and notify you when it\'s resolved.',
        { penalty_id: linkedPenaltyId }
      );

      console.log(`📝 Appeal submitted by user ${userId}`);
      return { success: true };
    } catch (error: any) {
      console.error('Error submitting appeal:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get appeal by ID
   */
  async getAppeal(appealId: string): Promise<Appeal | null> {
    try {
      const { data, error } = await supabase
        .from('appeals')
        .select('*')
        .eq('id', appealId)
        .single();

      if (error) {
        console.error('Error fetching appeal:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching appeal:', error);
      return null;
    }
  }

  /**
   * Get all pending appeals for admin review
   */
  async getPendingAppeals(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('appeals')
        .select(`
          *,
          user:user_id(id, username, display_name, avatar_url),
          penalty:penalty_id(
            id,
            severity,
            reason,
            duration_hours,
            evidence_link,
            policy_reference,
            issued_at
          ),
          violation:violation_id(
            id,
            violation_reason,
            severity_level,
            created_at
          ),
          strike:strike_id(
            id,
            strike_type,
            strike_message,
            strike_level,
            created_at
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching pending appeals:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getPendingAppeals:', error);
      return [];
    }
  }

  /**
   * PROMPT 3: Admin review appeal: ACCEPT + SEND PUSH NOTIFICATION
   * Remove violation, remove strike, notify user
   */
  async acceptAppeal(
    appealId: string,
    adminId: string,
    resolutionMessage: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: appeal } = await supabase
        .from('appeals')
        .select('*, penalty:penalty_id(*)')
        .eq('id', appealId)
        .single();

      if (!appeal) {
        return { success: false, error: 'Appeal not found' };
      }

      // Update appeal status
      await supabase
        .from('appeals')
        .update({
          status: 'approved',
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
          resolution_message: resolutionMessage,
        })
        .eq('id', appealId);

      // Deactivate penalty if exists
      if (appeal.penalty_id) {
        await supabase
          .from('admin_penalties')
          .update({ is_active: false })
          .eq('id', appeal.penalty_id);
      }

      // Remove strike if exists
      if (appeal.strike_id) {
        await supabase
          .from('content_safety_strikes')
          .update({ active: false })
          .eq('id', appeal.strike_id);
      }

      // Mark violation as resolved if exists
      if (appeal.violation_id) {
        await supabase
          .from('content_safety_violations')
          .update({ resolved: true })
          .eq('id', appeal.violation_id);
      }

      // Send inbox notification
      await inboxService.sendMessage(
        appeal.user_id,
        appeal.user_id,
        `Your appeal was reviewed and accepted. Reason: ${resolutionMessage}`,
        'safety'
      );

      // PROMPT 3: Send push notification with deep-link
      await pushNotificationService.sendPushNotification(
        appeal.user_id,
        'APPEAL_APPROVED',
        'Your appeal was approved',
        'A penalty on your account has been removed. Check details in your Notifications.',
        { 
          route: 'AppealDetails',
          appealId: appealId,
          penalty_id: appeal.penalty_id
        }
      );

      console.log(`✅ Appeal accepted: ${appealId}`);
      return { success: true };
    } catch (error: any) {
      console.error('Error accepting appeal:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * PROMPT 3: Admin review appeal: DENY + SEND PUSH NOTIFICATION
   * Notify user
   */
  async denyAppeal(
    appealId: string,
    adminId: string,
    resolutionMessage: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: appeal } = await supabase
        .from('appeals')
        .select('user_id')
        .eq('id', appealId)
        .single();

      if (!appeal) {
        return { success: false, error: 'Appeal not found' };
      }

      // Update appeal status
      await supabase
        .from('appeals')
        .update({
          status: 'denied',
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
          resolution_message: resolutionMessage,
        })
        .eq('id', appealId);

      // Send inbox notification
      await inboxService.sendMessage(
        appeal.user_id,
        appeal.user_id,
        `Your appeal was reviewed and denied. Reason: ${resolutionMessage}`,
        'safety'
      );

      // PROMPT 3: Send push notification with deep-link
      await pushNotificationService.sendPushNotification(
        appeal.user_id,
        'APPEAL_DENIED',
        'Your appeal was denied',
        'The original decision stands. See more details in your Notifications.',
        { 
          route: 'AppealDetails',
          appealId: appealId
        }
      );

      console.log(`❌ Appeal denied: ${appealId}`);
      return { success: true };
    } catch (error: any) {
      console.error('Error denying appeal:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get appeal with full context for admin review
   */
  async getAppealWithContext(appealId: string): Promise<any> {
    try {
      const { data: appeal } = await supabase
        .from('appeals')
        .select(`
          *,
          user:user_id(id, username, display_name, avatar_url),
          penalty:penalty_id(*),
          violation:violation_id(*),
          strike:strike_id(*)
        `)
        .eq('id', appealId)
        .single();

      if (!appeal) {
        return null;
      }

      // Get user history
      const { data: violations } = await supabase
        .from('user_violations')
        .select('*')
        .eq('user_id', appeal.user_id)
        .order('created_at', { ascending: false })
        .limit(20);

      const { data: strikes } = await supabase
        .from('content_safety_strikes')
        .select('*')
        .eq('user_id', appeal.user_id)
        .order('created_at', { ascending: false });

      const { data: penalties } = await supabase
        .from('admin_penalties')
        .select('*')
        .eq('user_id', appeal.user_id)
        .order('issued_at', { ascending: false });

      return {
        ...appeal,
        user_history: {
          violations: violations || [],
          strikes: strikes || [],
          penalties: penalties || [],
        },
      };
    } catch (error) {
      console.error('Error in getAppealWithContext:', error);
      return null;
    }
  }
}

export const appealsService = new AppealsService();