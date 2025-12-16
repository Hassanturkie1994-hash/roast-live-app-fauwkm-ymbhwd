
import { supabase } from '@/app/integrations/supabase/client';
import { analyticsService } from './analyticsService';

export interface StreamViewer {
  id: string;
  stream_id: string;
  user_id: string;
  joined_at: string;
  left_at: string | null;
  watch_time_seconds: number;
  created_at: string;
  profiles?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

class ViewerTrackingService {
  private watchTimeIntervals: Map<string, NodeJS.Timeout> = new Map();

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
          watch_time_seconds: 0,
        })
        .select('*, profiles(*)')
        .single();

      if (error) {
        console.error('Error tracking viewer join:', error);
        return { success: false, error: error.message };
      }

      // Start watch time tracking
      this.startWatchTimeTracking(streamId, userId);

      // Track in analytics system
      const { data: streamData } = await supabase
        .from('streams')
        .select('broadcaster_id')
        .eq('id', streamId)
        .single();

      if (streamData?.broadcaster_id) {
        const { data: followData } = await supabase
          .from('followers')
          .select('id')
          .eq('follower_id', userId)
          .eq('following_id', streamData.broadcaster_id)
          .single();

        const deviceType = this.detectDeviceType();
        await analyticsService.trackViewerJoin(streamId, userId, deviceType, !!followData);
      }

      console.log('✅ Viewer join tracked successfully');
      return { success: true, data: data as StreamViewer };
    } catch (error) {
      console.error('Error in joinStream:', error);
      return { success: false, error: 'Failed to track viewer join' };
    }
  }

  // Start tracking watch time (increments every second)
  private startWatchTimeTracking(streamId: string, userId: string): void {
    const key = `${streamId}:${userId}`;
    
    // Clear any existing interval
    if (this.watchTimeIntervals.has(key)) {
      clearInterval(this.watchTimeIntervals.get(key)!);
    }

    // Increment watch time every second
    const interval = setInterval(async () => {
      try {
        await supabase
          .from('stream_viewers')
          .update({ 
            watch_time_seconds: supabase.rpc('increment', { x: 1 }) 
          })
          .eq('stream_id', streamId)
          .eq('user_id', userId)
          .is('left_at', null);
      } catch (error) {
        console.error('Error updating watch time:', error);
      }
    }, 1000);

    this.watchTimeIntervals.set(key, interval);
  }

  // Stop tracking watch time
  private stopWatchTimeTracking(streamId: string, userId: string): void {
    const key = `${streamId}:${userId}`;
    
    if (this.watchTimeIntervals.has(key)) {
      clearInterval(this.watchTimeIntervals.get(key)!);
      this.watchTimeIntervals.delete(key);
    }
  }

  // Detect device type
  private detectDeviceType(): 'mobile' | 'web' | 'tablet' {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width < 768) return 'mobile';
      if (width < 1024) return 'tablet';
      return 'web';
    }
    return 'mobile';
  }

  // Track when a viewer leaves a stream
  async leaveStream(
    streamId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Stop watch time tracking
      this.stopWatchTimeTracking(streamId, userId);

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

  // Get top viewers by watch time
  async getTopViewersByWatchTime(streamId: string, limit: number = 100): Promise<StreamViewer[]> {
    try {
      const { data, error } = await supabase
        .from('stream_viewers')
        .select('*, profiles(*)')
        .eq('stream_id', streamId)
        .is('left_at', null)
        .order('watch_time_seconds', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching top viewers:', error);
        return [];
      }

      return data as StreamViewer[];
    } catch (error) {
      console.error('Error in getTopViewersByWatchTime:', error);
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
      // Stop all watch time tracking for this stream
      this.watchTimeIntervals.forEach((interval, key) => {
        if (key.startsWith(`${streamId}:`)) {
          clearInterval(interval);
          this.watchTimeIntervals.delete(key);
        }
      });

      const { error } = await supabase
        .from('stream_viewers')
        .update({ left_at: new Date().toISOString() })
        .eq('stream_id', streamId)
        .is('left_at', null);

      if (error) {
        console.error('Error cleaning up viewer sessions:', error);
        return { success: false, error: error.message };
      }

      await analyticsService.calculateStreamMetrics(streamId);

      console.log('✅ Viewer sessions cleaned up successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in cleanupStreamViewers:', error);
      return { success: false, error: 'Failed to cleanup viewer sessions' };
    }
  }

  // Clean up all intervals on service shutdown
  cleanup(): void {
    this.watchTimeIntervals.forEach((interval) => clearInterval(interval));
    this.watchTimeIntervals.clear();
  }
}

export const viewerTrackingService = new ViewerTrackingService();
