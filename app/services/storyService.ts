
import { supabase } from '@/app/integrations/supabase/client';
import { mediaUploadService } from './mediaUploadService';

/**
 * Story Service
 * 
 * ENHANCED: Proper media persistence with validation
 * - Validates format, size, duration, aspect ratio
 * - Shows upload progress
 * - Retries on network failures
 * - Stores metadata in database
 * - Ensures stories persist beyond session
 * - Retrievable on all devices
 */
export const storyService = {
  async createStory(
    userId: string, 
    fileUri: string,
    caption?: string,
    mediaType: 'photo' | 'video' = 'photo',
    onProgress?: (progress: { loaded: number; total: number; percentage: number }) => void
  ) {
    try {
      console.log('📸 [StoryService] Creating story...');

      const isVideo = mediaUploadService.isVideoFile(fileUri);

      // Upload media to storage with validation and progress
      const uploadResult = await mediaUploadService.uploadMedia(
        userId, 
        fileUri, 
        'story',
        { caption, mediaType },
        onProgress,
        isVideo
      );

      if (!uploadResult.success || !uploadResult.url) {
        console.error('❌ [StoryService] Media upload failed:', uploadResult.error);
        return { success: false, error: uploadResult.error || 'Failed to upload media' };
      }

      console.log('✅ [StoryService] Media uploaded:', uploadResult.url);

      // Set expiration to 24 hours from now
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      // Create story record in database
      const { data, error } = await supabase
        .from('stories')
        .insert({
          user_id: userId,
          media_url: uploadResult.url,
          cdn_url: uploadResult.url,
          storage_path: uploadResult.storagePath,
          media_type: mediaType,
          caption: caption || null,
          expires_at: expiresAt.toISOString(),
          media_status: 'active',
          views_count: 0,
          likes_count: 0,
          comments_count: 0,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ [StoryService] Error creating story:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ [StoryService] Story created successfully:', data.id);

      return { success: true, data };
    } catch (error) {
      console.error('❌ [StoryService] Error in createStory:', error);
      return { success: false, error: 'Failed to create story' };
    }
  },

  async getActiveStories(userId?: string) {
    try {
      const now = new Date().toISOString();
      let query = supabase
        .from('stories')
        .select('*, profiles(*)')
        .gt('expires_at', now)
        .eq('media_status', 'active')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching stories:', error);
        return { success: false, data: [], error };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in getActiveStories:', error);
      return { success: false, data: [], error };
    }
  },

  async viewStory(userId: string, storyId: string) {
    try {
      const { error } = await supabase.from('story_views').insert({
        user_id: userId,
        story_id: storyId,
      });

      if (error && !error.message.includes('duplicate')) {
        console.error('Error viewing story:', error);
        return { success: false, error };
      }

      // Increment view count
      await supabase.rpc('increment_story_views', { story_uuid: storyId });

      return { success: true };
    } catch (error) {
      console.error('Error in viewStory:', error);
      return { success: false, error };
    }
  },

  async likeStory(userId: string, storyId: string) {
    try {
      const { error } = await supabase.from('story_likes').insert({
        user_id: userId,
        story_id: storyId,
      });

      if (error) {
        console.error('Error liking story:', error);
        return { success: false, error };
      }

      // Increment like count
      const { error: updateError } = await supabase
        .from('stories')
        .update({ likes_count: supabase.raw('likes_count + 1') })
        .eq('id', storyId);

      if (updateError) {
        console.error('Error updating like count:', updateError);
      }

      return { success: true };
    } catch (error) {
      console.error('Error in likeStory:', error);
      return { success: false, error };
    }
  },

  async unlikeStory(userId: string, storyId: string) {
    try {
      const { error } = await supabase
        .from('story_likes')
        .delete()
        .eq('user_id', userId)
        .eq('story_id', storyId);

      if (error) {
        console.error('Error unliking story:', error);
        return { success: false, error };
      }

      // Decrement like count
      const { error: updateError } = await supabase
        .from('stories')
        .update({ likes_count: supabase.raw('likes_count - 1') })
        .eq('id', storyId);

      if (updateError) {
        console.error('Error updating like count:', updateError);
      }

      return { success: true };
    } catch (error) {
      console.error('Error in unlikeStory:', error);
      return { success: false, error };
    }
  },

  async getStoryViewers(storyId: string) {
    try {
      const { data, error } = await supabase
        .from('story_views')
        .select('*, profiles(*)')
        .eq('story_id', storyId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching story viewers:', error);
        return { success: false, data: [], error };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in getStoryViewers:', error);
      return { success: false, data: [], error };
    }
  },

  async deleteStory(userId: string, storyId: string) {
    try {
      const { data: story, error: fetchError } = await supabase
        .from('stories')
        .select('user_id, storage_path')
        .eq('id', storyId)
        .single();

      if (fetchError || !story) {
        console.error('Error fetching story:', fetchError);
        return { success: false, error: fetchError };
      }

      if (story.user_id !== userId) {
        return { success: false, error: new Error('Unauthorized') };
      }

      // Soft delete - mark as deleted
      const { error: updateError } = await supabase
        .from('stories')
        .update({ media_status: 'deleted' })
        .eq('id', storyId);

      if (updateError) {
        console.error('Error deleting story:', updateError);
        return { success: false, error: updateError };
      }

      // Optionally delete from storage
      if (story.storage_path) {
        await mediaUploadService.deleteMedia('story', story.storage_path);
      }

      return { success: true };
    } catch (error) {
      console.error('Error in deleteStory:', error);
      return { success: false, error };
    }
  },
};
