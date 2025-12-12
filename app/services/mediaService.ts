
import { supabase } from '@/app/integrations/supabase/client';
import * as ImagePicker from 'expo-image-picker';

interface Story {
  id: string;
  user_id: string;
  media_url: string;
  thumb_url: string | null;
  created_at: string;
  expires_at: string;
  views_count: number;
  likes_count: number;
  comments_count: number;
}

interface Post {
  id: string;
  user_id: string;
  media_url: string;
  thumb_url: string | null;
  caption: string | null;
  likes_count: number;
  comments_count: number;
  views_count: number;
  created_at: string;
}

class MediaService {
  /**
   * Upload media to Supabase Storage
   * In production, this should upload to Cloudflare R2/Stream
   */
  async uploadMedia(
    uri: string,
    bucket: string,
    path: string
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      // Fetch the file from URI
      const response = await fetch(uri);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${path}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, arrayBuffer, {
          contentType: blob.type,
          upsert: true,
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      return { success: true, url: urlData.publicUrl };
    } catch (error) {
      console.error('Error uploading media:', error);
      return { success: false, error: 'Failed to upload media' };
    }
  }

  /**
   * Generate thumbnail from video or image
   * This is a placeholder - in production, use Cloudflare Stream's thumbnail generation
   */
  async generateThumbnail(mediaUrl: string): Promise<string> {
    // For now, return the same URL
    // In production, this should call Cloudflare Stream API to generate thumbnail
    return mediaUrl;
  }

  /**
   * Create a story
   */
  async createStory(
    userId: string,
    mediaUri: string
  ): Promise<{ success: boolean; storyId?: string; error?: string }> {
    try {
      // Upload media
      const timestamp = Date.now();
      const { url: mediaUrl, error: uploadError } = await this.uploadMedia(
        mediaUri,
        'stories',
        `${userId}/${timestamp}`
      );

      if (uploadError || !mediaUrl) {
        return { success: false, error: uploadError || 'Failed to upload media' };
      }

      // Generate thumbnail
      const thumbUrl = await this.generateThumbnail(mediaUrl);

      // Set expiration to 24 hours from now
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      // Create story record
      const { data, error } = await supabase
        .from('stories')
        .insert({
          user_id: userId,
          media_url: mediaUrl,
          thumb_url: thumbUrl,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, storyId: data.id };
    } catch (error) {
      console.error('Error creating story:', error);
      return { success: false, error: 'Failed to create story' };
    }
  }

  /**
   * Create a post
   */
  async createPost(
    userId: string,
    mediaUri: string,
    caption?: string
  ): Promise<{ success: boolean; postId?: string; error?: string }> {
    try {
      // Upload media
      const timestamp = Date.now();
      const { url: mediaUrl, error: uploadError } = await this.uploadMedia(
        mediaUri,
        'posts',
        `${userId}/${timestamp}`
      );

      if (uploadError || !mediaUrl) {
        return { success: false, error: uploadError || 'Failed to upload media' };
      }

      // Generate thumbnail
      const thumbUrl = await this.generateThumbnail(mediaUrl);

      // Create post record
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: userId,
          media_url: mediaUrl,
          thumb_url: thumbUrl,
          caption: caption || null,
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, postId: data.id };
    } catch (error) {
      console.error('Error creating post:', error);
      return { success: false, error: 'Failed to create post' };
    }
  }

  /**
   * Get active stories (not expired)
   */
  async getActiveStories(userId?: string): Promise<{
    success: boolean;
    stories?: Story[];
    error?: string;
  }> {
    try {
      let query = supabase
        .from('stories')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, stories: data as Story[] };
    } catch (error) {
      console.error('Error fetching active stories:', error);
      return { success: false, error: 'Failed to fetch active stories' };
    }
  }

  /**
   * Get posts
   */
  async getPosts(userId?: string, limit: number = 50): Promise<{
    success: boolean;
    posts?: Post[];
    error?: string;
  }> {
    try {
      let query = supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, posts: data as Post[] };
    } catch (error) {
      console.error('Error fetching posts:', error);
      return { success: false, error: 'Failed to fetch posts' };
    }
  }

  /**
   * Delete expired stories (should be run as a cron job)
   */
  async deleteExpiredStories(): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('stories')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select();

      if (error) throw error;

      return { success: true, deletedCount: data?.length || 0 };
    } catch (error) {
      console.error('Error deleting expired stories:', error);
      return { success: false, error: 'Failed to delete expired stories' };
    }
  }

  /**
   * Increment story view count
   */
  async incrementStoryView(storyId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.rpc('increment_story_views', {
        story_id: storyId,
      });

      if (error) {
        // Fallback if RPC doesn't exist
        const { data: story } = await supabase
          .from('stories')
          .select('views_count')
          .eq('id', storyId)
          .single();

        if (story) {
          await supabase
            .from('stories')
            .update({ views_count: (story.views_count || 0) + 1 })
            .eq('id', storyId);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error incrementing story view:', error);
      return { success: false, error: 'Failed to increment story view' };
    }
  }

  /**
   * Increment post view count
   */
  async incrementPostView(postId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.rpc('increment_post_views', {
        post_id: postId,
      });

      if (error) {
        // Fallback if RPC doesn't exist
        const { data: post } = await supabase
          .from('posts')
          .select('views_count')
          .eq('id', postId)
          .single();

        if (post) {
          await supabase
            .from('posts')
            .update({ views_count: (post.views_count || 0) + 1 })
            .eq('id', postId);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error incrementing post view:', error);
      return { success: false, error: 'Failed to increment post view' };
    }
  }

  /**
   * Pick media from device
   */
  async pickMedia(
    mediaType: 'photo' | 'video' | 'all' = 'all'
  ): Promise<{ success: boolean; uri?: string; type?: string; error?: string }> {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        return { success: false, error: 'Permission to access media library was denied' };
      }

      // Pick media
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes:
          mediaType === 'photo'
            ? ImagePicker.MediaTypeOptions.Images
            : mediaType === 'video'
            ? ImagePicker.MediaTypeOptions.Videos
            : ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.canceled) {
        return { success: false, error: 'Media selection was canceled' };
      }

      return {
        success: true,
        uri: result.assets[0].uri,
        type: result.assets[0].type,
      };
    } catch (error) {
      console.error('Error picking media:', error);
      return { success: false, error: 'Failed to pick media' };
    }
  }
}

export const mediaService = new MediaService();