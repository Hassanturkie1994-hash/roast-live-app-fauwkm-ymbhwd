
import { supabase } from '@/app/integrations/supabase/client';

export interface ContentSafetyViolation {
  id: string;
  reported_user_id: string;
  reporter_user_id: string;
  stream_id: string | null;
  violation_reason: 'harassment' | 'hate' | 'sexual' | 'racism' | 'abuse' | 'illegal';
  notes: string | null;
  severity_level: 1 | 2 | 3;
  created_at: string;
  resolved: boolean;
}

export interface ContentSafetyStrike {
  id: string;
  user_id: string;
  strike_type: string;
  strike_message: string;
  strike_level: 1 | 2 | 3;
  expires_at: string;
  created_at: string;
  active: boolean;
}

export interface SuspensionHistory {
  id: string;
  user_id: string;
  suspension_type: '7-day' | 'permanent' | 'temporary';
  start_at: string;
  end_at: string | null;
  reason: string;
  admin_id: string | null;
  created_at: string;
}

export interface BannedViewer {
  id: string;
  banned_user_id: string;
  stream_owner_id: string;
  reason: string | null;
  created_at: string;
}

export interface StreamValidationResult {
  canStream: boolean;
  reason?: string;
  strikes?: ContentSafetyStrike[];
  suspension?: SuspensionHistory;
}

class ContentSafetyService {
  // Check if user can start a stream
  async validateStreamStart(userId: string): Promise<StreamValidationResult> {
    try {
      // Check for active suspension
      const { data: activeSuspension } = await supabase
        .from('suspension_history')
        .select('*')
        .eq('user_id', userId)
        .or('end_at.is.null,end_at.gte.' + new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (activeSuspension) {
        return {
          canStream: false,
          reason: `Your account is suspended: ${activeSuspension.reason}`,
          suspension: activeSuspension,
        };
      }

      // Check for active strikes
      const { data: activeStrikes } = await supabase
        .from('content_safety_strikes')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (activeStrikes && activeStrikes.length > 0) {
        // Check if user has strike level 3 (hard suspend)
        const hasLevel3Strike = activeStrikes.some((strike) => strike.strike_level === 3);
        if (hasLevel3Strike) {
          return {
            canStream: false,
            reason: 'You have received a level 3 strike and cannot stream',
            strikes: activeStrikes,
          };
        }

        // Check if user has 3 or more strikes within 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentStrikes = activeStrikes.filter(
          (strike) => new Date(strike.created_at) >= thirtyDaysAgo
        );

        if (recentStrikes.length >= 3) {
          return {
            canStream: false,
            reason: 'You have received 3 or more strikes within 30 days and are temporarily locked from streaming',
            strikes: activeStrikes,
          };
        }
      }

      return { canStream: true };
    } catch (error) {
      console.error('Error validating stream start:', error);
      return { canStream: true }; // Fail open to not block legitimate users
    }
  }

  // Check if viewer is banned from a specific creator's streams
  async isViewerBanned(viewerId: string, streamOwnerId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('banned_viewers')
        .select('id')
        .eq('banned_user_id', viewerId)
        .eq('stream_owner_id', streamOwnerId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking viewer ban status:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error in isViewerBanned:', error);
      return false;
    }
  }

  // Ban a viewer from all future streams by a creator
  async banViewer(
    bannedUserId: string,
    streamOwnerId: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from('banned_viewers').insert({
        banned_user_id: bannedUserId,
        stream_owner_id: streamOwnerId,
        reason: reason || null,
      });

      if (error) {
        console.error('Error banning viewer:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Viewer banned successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in banViewer:', error);
      return { success: false, error: 'Failed to ban viewer' };
    }
  }

  // Unban a viewer
  async unbanViewer(
    bannedUserId: string,
    streamOwnerId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('banned_viewers')
        .delete()
        .eq('banned_user_id', bannedUserId)
        .eq('stream_owner_id', streamOwnerId);

      if (error) {
        console.error('Error unbanning viewer:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Viewer unbanned successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in unbanViewer:', error);
      return { success: false, error: 'Failed to unban viewer' };
    }
  }

  // Get all banned viewers for a stream owner
  async getBannedViewers(streamOwnerId: string): Promise<BannedViewer[]> {
    try {
      const { data, error } = await supabase
        .from('banned_viewers')
        .select('*')
        .eq('stream_owner_id', streamOwnerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching banned viewers:', error);
        return [];
      }

      return data as BannedViewer[];
    } catch (error) {
      console.error('Error in getBannedViewers:', error);
      return [];
    }
  }

  // Report a violation
  async reportViolation(
    reportedUserId: string,
    reporterUserId: string,
    streamId: string | null,
    violationReason: 'harassment' | 'hate' | 'sexual' | 'racism' | 'abuse' | 'illegal',
    notes: string,
    severityLevel: 1 | 2 | 3
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from('content_safety_violations').insert({
        reported_user_id: reportedUserId,
        reporter_user_id: reporterUserId,
        stream_id: streamId,
        violation_reason: violationReason,
        notes,
        severity_level: severityLevel,
        resolved: false,
      });

      if (error) {
        console.error('Error reporting violation:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Violation reported successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in reportViolation:', error);
      return { success: false, error: 'Failed to report violation' };
    }
  }

  // Issue a strike (admin only)
  async issueStrike(
    userId: string,
    strikeType: string,
    strikeMessage: string,
    strikeLevel: 1 | 2 | 3,
    durationDays: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + durationDays);

      const { error } = await supabase.from('content_safety_strikes').insert({
        user_id: userId,
        strike_type: strikeType,
        strike_message: strikeMessage,
        strike_level: strikeLevel,
        expires_at: expiresAt.toISOString(),
        active: true,
      });

      if (error) {
        console.error('Error issuing strike:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Strike issued successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in issueStrike:', error);
      return { success: false, error: 'Failed to issue strike' };
    }
  }

  // Get active strikes for a user
  async getActiveStrikes(userId: string): Promise<ContentSafetyStrike[]> {
    try {
      const { data, error } = await supabase
        .from('content_safety_strikes')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching active strikes:', error);
        return [];
      }

      return data as ContentSafetyStrike[];
    } catch (error) {
      console.error('Error in getActiveStrikes:', error);
      return [];
    }
  }

  // Suspend a user (admin only)
  async suspendUser(
    userId: string,
    suspensionType: '7-day' | 'permanent' | 'temporary',
    reason: string,
    adminId: string,
    durationDays?: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      let endAt: string | null = null;
      
      if (suspensionType === '7-day') {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 7);
        endAt = endDate.toISOString();
      } else if (suspensionType === 'temporary' && durationDays) {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + durationDays);
        endAt = endDate.toISOString();
      }

      const { error } = await supabase.from('suspension_history').insert({
        user_id: userId,
        suspension_type: suspensionType,
        start_at: new Date().toISOString(),
        end_at: endAt,
        reason,
        admin_id: adminId,
      });

      if (error) {
        console.error('Error suspending user:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ User suspended successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in suspendUser:', error);
      return { success: false, error: 'Failed to suspend user' };
    }
  }

  // Get user's suspension history
  async getSuspensionHistory(userId: string): Promise<SuspensionHistory[]> {
    try {
      const { data, error } = await supabase
        .from('suspension_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching suspension history:', error);
        return [];
      }

      return data as SuspensionHistory[];
    } catch (error) {
      console.error('Error in getSuspensionHistory:', error);
      return [];
    }
  }

  // Check user age for 18+ content
  async isUserAdult(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('date_of_birth')
        .eq('id', userId)
        .single();

      if (error || !data || !data.date_of_birth) {
        console.log('No date of birth found for user');
        return false;
      }

      const dob = new Date(data.date_of_birth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        return age - 1 >= 18;
      }

      return age >= 18;
    } catch (error) {
      console.error('Error checking user age:', error);
      return false;
    }
  }

  // Set stream content label
  async setStreamContentLabel(
    streamId: string,
    contentLabel: 'family_friendly' | 'roast_mode' | 'adult_only'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('streams')
        .update({ content_label: contentLabel })
        .eq('id', streamId);

      if (error) {
        console.error('Error setting content label:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Content label set successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in setStreamContentLabel:', error);
      return { success: false, error: 'Failed to set content label' };
    }
  }

  // Get stream content label
  async getStreamContentLabel(streamId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('streams')
        .select('content_label')
        .eq('id', streamId)
        .single();

      if (error) {
        console.error('Error fetching content label:', error);
        return null;
      }

      return data?.content_label || null;
    } catch (error) {
      console.error('Error in getStreamContentLabel:', error);
      return null;
    }
  }
}

export const contentSafetyService = new ContentSafetyService();