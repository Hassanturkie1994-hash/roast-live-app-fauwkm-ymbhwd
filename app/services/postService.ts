
import { supabase } from '@/app/integrations/supabase/client';
import { mediaUploadService } from './mediaUploadService';

/**
 * Post Service
 * 
 * ENHANCED: Proper media persistence with validation
 * - Validates format, size, duration, aspect ratio
 * - Shows upload progress
 * - Retries on network failures
 * - Stores metadata in database
 * - Ensures posts persist beyond session
 * - Retrievable on all devices
 */
export const postService = {
  async createPost(
    userId: string,
    fileUri: string,
    caption?: string,
    mediaType: 'photo' | 'video' = 'photo',
    onProgress?: (progress: { loaded: number; total: number; percentage: number }) => void
  ) {
    try {
      console.log('📸 [PostService] Creating post...');

      const isVideo = mediaUploadService.isVideoFile(fileUri);

      // Upload media to storage with validation and progress
      const uploadResult = await mediaUploadService.uploadMedia(
        userId,
        fileUri,
        'post',
        { caption, mediaType },
        onProgress,
        isVideo
      );

      if (!uploadResult.success || !uploadResult.url) {
        console.error('❌ [PostService] Media upload failed:', uploadResult.error);
        return { success: false, error: uploadResult.error || 'Failed to upload media' };
      }

      console.log('✅ [PostService] Media uploaded:', uploadResult.url);

      // Create post record in database
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: userId,
          media_url: uploadResult.url,
          cdn_url: uploadResult.url,
          storage_path: uploadResult.storagePath,
          media_type: mediaType,
          caption: caption || null,
          media_status: 'active',
          likes_count: 0,
          comments_count: 0,
          views_count: 0,
          shares_count: 0,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ [PostService] Error creating post:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ [PostService] Post created successfully:', data.id);

      return { success: true, data };
    } catch (error) {
      console.error('❌ [PostService] Error in createPost:', error);
      return { success: false, error: 'Failed to create post' };
    }
  },

  async likePost(userId: string, postId: string) {
    try {
      const { error } = await supabase.from('post_likes').insert({
        user_id: userId,
        post_id: postId,
      });

      if (error) {
        console.error('Error liking post:', error);
        return { success: false, error };
      }

      // Increment like count
      await supabase
        .from('posts')
        .update({ likes_count: supabase.raw('likes_count + 1') })
        .eq('id', postId);

      return { success: true };
    } catch (error) {
      console.error('Error in likePost:', error);
      return { success: false, error };
    }
  },

  async unlikePost(userId: string, postId: string) {
    try {
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('user_id', userId)
        .eq('post_id', postId);

      if (error) {
        console.error('Error unliking post:', error);
        return { success: false, error };
      }

      // Decrement like count
      await supabase
        .from('posts')
        .update({ likes_count: supabase.raw('likes_count - 1') })
        .eq('id', postId);

      return { success: true };
    } catch (error) {
      console.error('Error in unlikePost:', error);
      return { success: false, error };
    }
  },

  async isPostLiked(userId: string, postId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('post_likes')
        .select('id')
        .eq('user_id', userId)
        .eq('post_id', postId)
        .maybeSingle();

      if (error) {
        console.error('Error checking like status:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error in isPostLiked:', error);
      return false;
    }
  },

  async deletePost(userId: string, postId: string) {
    try {
      // First, get the post to verify ownership and get storage path
      const { data: post, error: fetchError } = await supabase
        .from('posts')
        .select('user_id, storage_path')
        .eq('id', postId)
        .single();

      if (fetchError || !post) {
        console.error('Error fetching post:', fetchError);
        return { success: false, error: fetchError };
      }

      if (post.user_id !== userId) {
        return { success: false, error: new Error('Unauthorized') };
      }

      // Soft delete - mark as deleted
      const { error: updateError } = await supabase
        .from('posts')
        .update({ media_status: 'deleted' })
        .eq('id', postId);

      if (updateError) {
        console.error('Error deleting post:', updateError);
        return { success: false, error: updateError };
      }

      // Optionally delete from storage
      if (post.storage_path) {
        await mediaUploadService.deleteMedia('post', post.storage_path);
      }

      return { success: true };
    } catch (error) {
      console.error('Error in deletePost:', error);
      return { success: false, error };
    }
  },

  async getUserPosts(userId: string) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .eq('media_status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user posts:', error);
        return { success: false, data: [], error };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in getUserPosts:', error);
      return { success: false, data: [], error };
    }
  },

  async getFeedPosts(limit: number = 20) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles(*)')
        .eq('media_status', 'active')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching feed posts:', error);
        return { success: false, data: [], error };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in getFeedPosts:', error);
      return { success: false, data: [], error };
    }
  },
};
