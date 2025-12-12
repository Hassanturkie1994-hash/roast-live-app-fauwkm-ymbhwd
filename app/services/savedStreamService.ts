
import { supabase } from '@/app/integrations/supabase/client';

export const savedStreamService = {
  async saveStream(
    userId: string,
    streamId: string,
    title: string,
    recordingUrl?: string,
    thumbnailUrl?: string,
    duration?: number
  ) {
    try {
      const { data, error } = await supabase
        .from('saved_streams')
        .insert({
          user_id: userId,
          stream_id: streamId,
          title,
          recording_url: recordingUrl,
          thumbnail_url: thumbnailUrl,
          duration,
          views_count: 0,
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving stream:', error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in saveStream:', error);
      return { success: false, error };
    }
  },

  async getSavedStreams(userId: string) {
    try {
      const { data, error } = await supabase
        .from('saved_streams')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching saved streams:', error);
        return { success: false, data: [], error };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in getSavedStreams:', error);
      return { success: false, data: [], error };
    }
  },

  async deleteSavedStream(userId: string, savedStreamId: string) {
    try {
      const { data: savedStream, error: fetchError } = await supabase
        .from('saved_streams')
        .select('user_id')
        .eq('id', savedStreamId)
        .single();

      if (fetchError || !savedStream) {
        console.error('Error fetching saved stream:', fetchError);
        return { success: false, error: fetchError };
      }

      if (savedStream.user_id !== userId) {
        return { success: false, error: new Error('Unauthorized') };
      }

      const { error: deleteError } = await supabase
        .from('saved_streams')
        .delete()
        .eq('id', savedStreamId);

      if (deleteError) {
        console.error('Error deleting saved stream:', deleteError);
        return { success: false, error: deleteError };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in deleteSavedStream:', error);
      return { success: false, error };
    }
  },
};