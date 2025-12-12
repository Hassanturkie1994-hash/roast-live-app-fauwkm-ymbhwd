
import { supabase } from '@/app/integrations/supabase/client';

export type ReportType = 
  | 'harassment'
  | 'hate_speech'
  | 'adult_content'
  | 'dangerous_behavior'
  | 'spam_scam'
  | 'copyright_violation';

export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';

export interface StreamReport {
  id: string;
  reporter_user_id: string;
  streamer_id: string;
  stream_id: string | null;
  report_type: ReportType;
  description: string | null;
  status: ReportStatus;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

class ReportingService {
  /**
   * Submit a report for a stream or streamer
   */
  async submitReport(
    reporterUserId: string,
    streamerId: string,
    reportType: ReportType,
    streamId?: string,
    description?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('stream_reports')
        .insert({
          reporter_user_id: reporterUserId,
          streamer_id: streamerId,
          stream_id: streamId || null,
          report_type: reportType,
          description: description || null,
          status: 'pending',
        });

      if (error) {
        console.error('Error submitting report:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Report submitted successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in submitReport:', error);
      return { success: false, error: 'Failed to submit report' };
    }
  }

  /**
   * Get report count for a streamer (anonymous count only)
   */
  async getReportCount(streamerId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('stream_reports')
        .select('*', { count: 'exact', head: true })
        .eq('streamer_id', streamerId)
        .eq('status', 'pending');

      if (error) {
        console.error('Error fetching report count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getReportCount:', error);
      return 0;
    }
  }

  /**
   * Get report count for a specific stream
   */
  async getStreamReportCount(streamId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('stream_reports')
        .select('*', { count: 'exact', head: true })
        .eq('stream_id', streamId)
        .eq('status', 'pending');

      if (error) {
        console.error('Error fetching stream report count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getStreamReportCount:', error);
      return 0;
    }
  }

  /**
   * Get user's own reports
   */
  async getUserReports(userId: string): Promise<StreamReport[]> {
    try {
      const { data, error } = await supabase
        .from('stream_reports')
        .select('*')
        .eq('reporter_user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user reports:', error);
        return [];
      }

      return data as StreamReport[];
    } catch (error) {
      console.error('Error in getUserReports:', error);
      return [];
    }
  }
}

export const reportingService = new ReportingService();