
import { supabase } from '@/app/integrations/supabase/client';
import { analyticsService } from './analyticsService';

export interface StreamViewer {
  id: string;
  stream_id: string;
  user_id: string;
  joined_at: string;
  left_at: string | null;
  created_at: string;
  profiles?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

class ViewerTrackingService {
  // Track when a viewer joins a stream
  async joinStream(
    streamId: string,
    userId: string
  ): Promise<{ success: boolean; data?: StreamViewer; error?: string }> {
    try {
      // First, check if user already has an active session
      const { data: existing } = await supabase
        .from('stream_viewers')
        .select('id')
        .eq('stream_id', streamId)
        .eq('user_id', userId)
        .is('left_at', null)
        .single();

      if (existing) {
        console.log('⚠️ User already has an active viewer session');
        return { success: true };
      }

      const { data, error } = await supabase
        .from('stream_viewers')
        .insert({
          stream_id: streamId,
          user_id: userId,
          joined_at: new Date().toISOString(),
        })
        .select('*, profiles(*)')
        .single();

      if (error) {
        console.error('Error tracking viewer join:', error);
        return { success: false, error: error.message };
      }

      // Track in analytics system
      const { data: followData } = await supabase
        .from('followers')
        .select('id')
        .eq('follower_id', userId)
        .eq('following_id', (await supabase.from('streams').select('broadcaster_id').eq('id', streamId).single()).data?.broadcaster_id)
        .single();

      const deviceType = this.detectDeviceType();
      await analyticsService.trackViewerJoin(streamId, userId, deviceType, !!followData);

      console.log('✅ Viewer join tracked successfully');
      return { success: true, data: data as StreamViewer };
    } catch (error) {
      console.error('Error in joinStream:', error);
      return { success: false, error: 'Failed to track viewer join' };
    }
  }

  // Detect device type
  private detectDeviceType(): 'mobile' | 'web' | 'tablet' {
    // Simple device detection - can be enhanced
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width < 768) return 'mobile';
      if (width < 1024) return 'tablet';
      return 'web';
    }
    return 'mobile'; // Default for React Native
  }

  // Track when a viewer leaves a stream
  async leaveStream(
    streamId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('stream_viewers')
        .update({ left_at: new Date().toISOString() })
        .eq('stream_id', streamId)
        .eq('user_id', userId)
        .is('left_at', null);

      if (error) {
        console.error('Error tracking viewer leave:', error);
        return { success: false, error: error.message };
      }

      // Track in analytics system
      await analyticsService.trackViewerLeave(streamId, userId);

      console.log('✅ Viewer leave tracked successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in leaveStream:', error);
      return { success: false, error: 'Failed to track viewer leave' };
    }
  }

  // Get active viewers for a stream
  async getActiveViewers(streamId: string): Promise<StreamViewer[]> {
    try {
      const { data, error } = await supabase
        .from('stream_viewers')
        .select('*, profiles(*)')
        .eq('stream_id', streamId)
        .is('left_at', null)
        .order('joined_at', { ascending: true });

      if (error) {
        console.error('Error fetching active viewers:', error);
        return [];
      }

      return data as StreamViewer[];
    } catch (error) {
      console.error('Error in getActiveViewers:', error);
      return [];
    }
  }

  // Get all viewers (including those who left) for a stream
  async getAllViewers(streamId: string): Promise<StreamViewer[]> {
    try {
      const { data, error } = await supabase
        .from('stream_viewers')
        .select('*, profiles(*)')
        .eq('stream_id', streamId)
        .order('joined_at', { ascending: true });

      if (error) {
        console.error('Error fetching all viewers:', error);
        return [];
      }

      return data as StreamViewer[];
    } catch (error) {
      console.error('Error in getAllViewers:', error);
      return [];
    }
  }

  // Get active viewer count for a stream
  async getActiveViewerCount(streamId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('stream_viewers')
        .select('*', { count: 'exact', head: true })
        .eq('stream_id', streamId)
        .is('left_at', null);

      if (error) {
        console.error('Error fetching viewer count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getActiveViewerCount:', error);
      return 0;
    }
  }

  // Get total unique viewers for a stream
  async getTotalViewerCount(streamId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('stream_viewers')
        .select('user_id', { count: 'exact', head: true })
        .eq('stream_id', streamId);

      if (error) {
        console.error('Error fetching total viewer count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getTotalViewerCount:', error);
      return 0;
    }
  }

  // Clean up viewer sessions when stream ends
  async cleanupStreamViewers(streamId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('stream_viewers')
        .update({ left_at: new Date().toISOString() })
        .eq('stream_id', streamId)
        .is('left_at', null);

      if (error) {
        console.error('Error cleaning up viewer sessions:', error);
        return { success: false, error: error.message };
      }

      // Calculate and store stream metrics
      await analyticsService.calculateStreamMetrics(streamId);

      console.log('✅ Viewer sessions cleaned up successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in cleanupStreamViewers:', error);
      return { success: false, error: 'Failed to cleanup viewer sessions' };
    }
  }
}

export const viewerTrackingService = new ViewerTrackingService();