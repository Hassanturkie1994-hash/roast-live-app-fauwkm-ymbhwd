
import { supabase } from '@/app/integrations/supabase/client';
import { mediaUploadService } from './mediaUploadService';

/**
 * Saved Stream Service
 * 
 * FIXED: Proper media persistence for saved streams
 * - Uploads replay video to Supabase Storage
 * - Uploads thumbnail to Supabase Storage
 * - Stores metadata in database
 * - Ensures streams persist and are replayable
 * - Retrievable on all devices
 */
export const savedStreamService = {
  async saveStream(
    userId: string,
    streamId: string,
    title: string,
    recordingFileUri?: string,
    thumbnailFileUri?: string,
    duration?: number,
    isPublic: boolean = true
  ) {
    try {
      console.log('💾 [SavedStreamService] Saving stream...');

      let recordingUrl: string | undefined;
      let recordingStoragePath: string | undefined;
      let thumbnailUrl: string | undefined;
      let thumbnailStoragePath: string | undefined;

      // Upload recording if provided
      if (recordingFileUri) {
        console.log('📹 [SavedStreamService] Uploading recording...');
        const uploadResult = await mediaUploadService.uploadMedia(
          userId,
          recordingFileUri,
          'stream-replay',
          { streamId, title }
        );

        if (uploadResult.success && uploadResult.url) {
          recordingUrl = uploadResult.url;
          recordingStoragePath = uploadResult.storagePath;
          console.log('✅ [SavedStreamService] Recording uploaded:', recordingUrl);
        } else {
          console.error('❌ [SavedStreamService] Recording upload failed:', uploadResult.error);
        }
      }

      // Upload thumbnail if provided
      if (thumbnailFileUri) {
        console.log('🖼️ [SavedStreamService] Uploading thumbnail...');
        const uploadResult = await mediaUploadService.uploadMedia(
          userId,
          thumbnailFileUri,
          'thumbnail',
          { streamId, title }
        );

        if (uploadResult.success && uploadResult.url) {
          thumbnailUrl = uploadResult.url;
          thumbnailStoragePath = uploadResult.storagePath;
          console.log('✅ [SavedStreamService] Thumbnail uploaded:', thumbnailUrl);
        } else {
          console.error('❌ [SavedStreamService] Thumbnail upload failed:', uploadResult.error);
        }
      }

      // Create saved stream record
      const { data, error } = await supabase
        .from('saved_streams')
        .insert({
          user_id: userId,
          stream_id: streamId,
          title,
          recording_url: recordingUrl || null,
          cdn_url: recordingUrl || null,
          storage_path: recordingStoragePath || null,
          thumbnail_url: thumbnailUrl || null,
          duration: duration || 0,
          views_count: 0,
          media_status: recordingUrl ? 'active' : 'processing',
          is_public: isPublic,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ [SavedStreamService] Error saving stream:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ [SavedStreamService] Stream saved successfully:', data.id);

      // Also create stream_replays entry for better discoverability
      if (recordingUrl) {
        await supabase
          .from('stream_replays')
          .insert({
            stream_id: streamId,
            creator_id: userId,
            replay_url: recordingUrl,
            cdn_url: recordingUrl,
            storage_path: recordingStoragePath,
            thumbnail_url: thumbnailUrl || null,
            thumbnail_cdn_url: thumbnailUrl || null,
            thumbnail_storage_path: thumbnailStoragePath || null,
            total_duration_seconds: duration || 0,
            started_at: new Date().toISOString(),
            ended_at: new Date().toISOString(),
            title,
            media_status: 'active',
            is_public: isPublic,
          });
      }

      return { success: true, data };
    } catch (error) {
      console.error('❌ [SavedStreamService] Error in saveStream:', error);
      return { success: false, error: 'Failed to save stream' };
    }
  },

  async getSavedStreams(userId: string) {
    try {
      const { data, error } = await supabase
        .from('saved_streams')
        .select('*')
        .eq('user_id', userId)
        .in('media_status', ['active', 'processing'])
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

  async getPublicSavedStreams(userId: string) {
    try {
      const { data, error } = await supabase
        .from('saved_streams')
        .select('*')
        .eq('user_id', userId)
        .eq('is_public', true)
        .eq('media_status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching public saved streams:', error);
        return { success: false, data: [], error };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in getPublicSavedStreams:', error);
      return { success: false, data: [], error };
    }
  },

  async deleteSavedStream(userId: string, savedStreamId: string) {
    try {
      const { data: savedStream, error: fetchError } = await supabase
        .from('saved_streams')
        .select('user_id, storage_path')
        .eq('id', savedStreamId)
        .single();

      if (fetchError || !savedStream) {
        console.error('Error fetching saved stream:', fetchError);
        return { success: false, error: fetchError };
      }

      if (savedStream.user_id !== userId) {
        return { success: false, error: new Error('Unauthorized') };
      }

      // Soft delete - mark as deleted
      const { error: updateError } = await supabase
        .from('saved_streams')
        .update({ media_status: 'deleted' })
        .eq('id', savedStreamId);

      if (updateError) {
        console.error('Error deleting saved stream:', updateError);
        return { success: false, error: updateError };
      }

      // Optionally delete from storage
      if (savedStream.storage_path) {
        await mediaUploadService.deleteMedia('stream-replay', savedStream.storage_path);
      }

      return { success: true };
    } catch (error) {
      console.error('Error in deleteSavedStream:', error);
      return { success: false, error };
    }
  },

  async incrementViews(savedStreamId: string) {
    try {
      const { error } = await supabase
        .from('saved_streams')
        .update({ views_count: supabase.raw('views_count + 1') })
        .eq('id', savedStreamId);

      if (error) {
        console.error('Error incrementing views:', error);
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in incrementViews:', error);
      return { success: false, error };
    }
  },
};
