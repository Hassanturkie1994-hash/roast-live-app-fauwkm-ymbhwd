
import { supabase } from '@/app/integrations/supabase/client';

export type UserReportReason = 
  | 'inappropriate_content'
  | 'threats_harassment'
  | 'spam_scam'
  | 'hate_speech'
  | 'other';

export interface UserReport {
  id: string;
  reported_user_id: string;
  reporter_user_id: string;
  type: string;
  description: string | null;
  status: 'open' | 'in_review' | 'closed';
  assigned_to: string | null;
  reviewed_at: string | null;
  resolution_notes: string | null;
  created_at: string;
}

class UserReportingService {
  /**
   * Submit a user report
   */
  async submitUserReport(
    reporterUserId: string,
    reportedUserId: string,
    reason: UserReportReason,
    description?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('user_reports')
        .insert({
          reporter_user_id: reporterUserId,
          reported_user_id: reportedUserId,
          type: 'profile',
          description: `${reason}: ${description || ''}`.trim(),
          status: 'open',
        });

      if (error) {
        console.error('Error submitting user report:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ User report submitted successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in submitUserReport:', error);
      return { success: false, error: 'Failed to submit report' };
    }
  }

  /**
   * Get all user reports (admin only)
   */
  async getAllUserReports(limit: number = 50): Promise<UserReport[]> {
    try {
      const { data, error } = await supabase
        .from('user_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching user reports:', error);
        return [];
      }

      return data as UserReport[];
    } catch (error) {
      console.error('Error in getAllUserReports:', error);
      return [];
    }
  }

  /**
   * Mark report as handled
   */
  async markReportAsHandled(
    reportId: string,
    adminId: string,
    resolutionNotes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('user_reports')
        .update({
          status: 'closed',
          assigned_to: adminId,
          reviewed_at: new Date().toISOString(),
          resolution_notes: resolutionNotes || null,
        })
        .eq('id', reportId);

      if (error) {
        console.error('Error marking report as handled:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Report marked as handled');
      return { success: true };
    } catch (error) {
      console.error('Error in markReportAsHandled:', error);
      return { success: false, error: 'Failed to mark report as handled' };
    }
  }

  /**
   * Get report count for a user
   */
  async getUserReportCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('user_reports')
        .select('*', { count: 'exact', head: true })
        .eq('reported_user_id', userId)
        .eq('status', 'open');

      if (error) {
        console.error('Error fetching user report count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getUserReportCount:', error);
      return 0;
    }
  }
}

export const userReportingService = new UserReportingService();
