
import { supabase } from '@/app/integrations/supabase/client';

export interface LiveStreamArchive {
  id: string;
  creator_id: string;
  title: string;
  started_at: string;
  ended_at: string | null;
  archived_url: string | null;
  viewer_peak: number;
  total_viewers: number;
  stream_duration_s: number;
  created_at: string;
}

class LiveStreamArchiveService {
  // Create a new live stream archive record
  async createArchive(
    creatorId: string,
    title: string,
    startedAt: string
  ): Promise<{ success: boolean; data?: LiveStreamArchive; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('live_streams')
        .insert({
          creator_id: creatorId,
          title,
          started_at: startedAt,
          viewer_peak: 0,
          total_viewers: 0,
          stream_duration_s: 0,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating stream archive:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Stream archive created successfully');
      return { success: true, data: data as LiveStreamArchive };
    } catch (error) {
      console.error('Error in createArchive:', error);
      return { success: false, error: 'Failed to create stream archive' };
    }
  }

  // Update stream archive when stream ends
  async updateArchive(
    streamId: string,
    updates: {
      ended_at?: string;
      archived_url?: string;
      viewer_peak?: number;
      total_viewers?: number;
      stream_duration_s?: number;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('live_streams')
        .update(updates)
        .eq('id', streamId);

      if (error) {
        console.error('Error updating stream archive:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Stream archive updated successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in updateArchive:', error);
      return { success: false, error: 'Failed to update stream archive' };
    }
  }

  // Get archived streams for a creator
  async getArchivedStreams(creatorId: string): Promise<LiveStreamArchive[]> {
    try {
      const { data, error } = await supabase
        .from('live_streams')
        .select('*')
        .eq('creator_id', creatorId)
        .not('ended_at', 'is', null)
        .order('ended_at', { ascending: false });

      if (error) {
        console.error('Error fetching archived streams:', error);
        return [];
      }

      return data as LiveStreamArchive[];
    } catch (error) {
      console.error('Error in getArchivedStreams:', error);
      return [];
    }
  }

  // Get a single archived stream
  async getArchivedStream(streamId: string): Promise<LiveStreamArchive | null> {
    try {
      const { data, error } = await supabase
        .from('live_streams')
        .select('*')
        .eq('id', streamId)
        .single();

      if (error) {
        console.error('Error fetching archived stream:', error);
        return null;
      }

      return data as LiveStreamArchive;
    } catch (error) {
      console.error('Error in getArchivedStream:', error);
      return null;
    }
  }

  // Delete an archived stream
  async deleteArchive(streamId: string, creatorId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('live_streams')
        .delete()
        .eq('id', streamId)
        .eq('creator_id', creatorId);

      if (error) {
        console.error('Error deleting stream archive:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Stream archive deleted successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in deleteArchive:', error);
      return { success: false, error: 'Failed to delete stream archive' };
    }
  }

  // Calculate stream duration in seconds
  calculateDuration(startedAt: string, endedAt: string): number {
    const start = new Date(startedAt).getTime();
    const end = new Date(endedAt).getTime();
    return Math.floor((end - start) / 1000);
  }
}

export const liveStreamArchiveService = new LiveStreamArchiveService();