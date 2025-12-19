
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

// Allowed MIME types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-m4v'];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

class MediaService {
  /**
   * Validate file before upload
   */
  private validateFile(uri: string, fileType?: string): { valid: boolean; error?: string } {
    if (!uri || uri.trim() === '') {
      return { valid: false, error: 'Invalid file URI' };
    }

    // Basic URI validation
    if (!uri.startsWith('file://') && !uri.startsWith('http://') && !uri.startsWith('https://')) {
      return { valid: false, error: 'Invalid file URI format' };
    }

    return { valid: true };
  }

  /**
   * Upload media to Supabase Storage with retry logic
   * In production, this should upload to Cloudflare R2/Stream
   */
  async uploadMedia(
    uri: string,
    bucket: string,
    path: string,
    maxRetries: number = 3
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    // Validate file first
    const validation = this.validateFile(uri);
    if (!validation.valid) {
      console.error('❌ File validation failed:', validation.error);
      return { success: false, error: validation.error };
    }

    let lastError: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📤 Upload attempt ${attempt}/${maxRetries} for ${path}`);

        // Fetch the file from URI
        const response = await fetch(uri);
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.statusText}`);
        }

        const blob = await response.blob();
        if (!blob || blob.size === 0) {
          throw new Error('Invalid file: empty or null blob');
        }

        // Validate file size
        if (blob.size > MAX_FILE_SIZE) {
          throw new Error(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
        }

        // Validate MIME type
        const fileType = blob.type || '';
        const isImage = ALLOWED_IMAGE_TYPES.includes(fileType);
        const isVideo = ALLOWED_VIDEO_TYPES.includes(fileType);

        if (!isImage && !isVideo) {
          throw new Error(`Invalid file type: ${fileType}. Allowed types: images (JPEG, PNG, WebP, GIF) and videos (MP4, MOV)`);
        }

        const arrayBuffer = await blob.arrayBuffer();
        const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `${path}.${fileExt}`;

        console.log(`📤 Uploading ${fileName} (${blob.size} bytes) to bucket: ${bucket}`);

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(fileName, arrayBuffer, {
            contentType: blob.type || 'application/octet-stream',
            upsert: true,
          });

        if (error) {
          console.error(`❌ Upload error (attempt ${attempt}):`, error);
          lastError = error;
          
          // Wait before retry (exponential backoff)
          if (attempt < maxRetries) {
            const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
            console.log(`⏳ Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          throw error;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(fileName);

        if (!urlData || !urlData.publicUrl) {
          throw new Error('Failed to get public URL');
        }

        console.log(`✅ Upload successful: ${urlData.publicUrl}`);
        return { success: true, url: urlData.publicUrl };
      } catch (error) {
        console.error(`❌ Error uploading media (attempt ${attempt}):`, error);
        lastError = error;
        
        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000;
          console.log(`⏳ Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    // All retries failed
    const errorMessage = lastError?.message || 'Failed to upload media after multiple attempts';
    console.error('❌ All upload attempts failed:', errorMessage);
    return { success: false, error: errorMessage };
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
   * Create a story with improved persistence
   */
  async createStory(
    userId: string,
    mediaUri: string
  ): Promise<{ success: boolean; storyId?: string; error?: string }> {
    try {
      console.log('📸 Creating story for user:', userId);
      
      // Validate URI first
      const validation = this.validateFile(mediaUri);
      if (!validation.valid) {
        console.error('❌ Invalid media URI:', validation.error);
        return { success: false, error: validation.error };
      }

      // Upload media with retry logic
      const timestamp = Date.now();
      const uploadResult = await this.uploadMedia(
        mediaUri,
        'stories',
        `${userId}/${timestamp}`
      );

      if (!uploadResult.success || !uploadResult.url) {
        console.error('❌ Upload failed:', uploadResult.error);
        return { success: false, error: uploadResult.error || 'Failed to upload media' };
      }

      console.log('✅ Media uploaded:', uploadResult.url);

      // Generate thumbnail
      const thumbUrl = await this.generateThumbnail(uploadResult.url);

      // Set expiration to 24 hours from now
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      // Create story record with CDN URL and storage path
      const { data, error } = await supabase
        .from('stories')
        .insert({
          user_id: userId,
          media_url: uploadResult.url,
          cdn_url: uploadResult.url, // Store CDN URL
          storage_path: `${userId}/${timestamp}`, // Store path for reference
          thumb_url: thumbUrl,
          media_status: 'active', // Mark as active
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating story record:', error);
        throw error;
      }

      console.log('✅ Story created successfully:', data.id);
      return { success: true, storyId: data.id };
    } catch (error) {
      console.error('❌ Error in createStory:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create story';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Create a post with improved persistence
   */
  async createPost(
    userId: string,
    mediaUri: string,
    caption?: string
  ): Promise<{ success: boolean; postId?: string; error?: string }> {
    try {
      console.log('📝 Creating post for user:', userId);
      
      // Validate URI first
      const validation = this.validateFile(mediaUri);
      if (!validation.valid) {
        console.error('❌ Invalid media URI:', validation.error);
        return { success: false, error: validation.error };
      }

      // Upload media with retry logic
      const timestamp = Date.now();
      const uploadResult = await this.uploadMedia(
        mediaUri,
        'posts',
        `${userId}/${timestamp}`
      );

      if (!uploadResult.success || !uploadResult.url) {
        console.error('❌ Upload failed:', uploadResult.error);
        return { success: false, error: uploadResult.error || 'Failed to upload media' };
      }

      console.log('✅ Media uploaded:', uploadResult.url);

      // Generate thumbnail
      const thumbUrl = await this.generateThumbnail(uploadResult.url);

      // Create post record with CDN URL and storage path
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: userId,
          media_url: uploadResult.url,
          cdn_url: uploadResult.url, // Store CDN URL
          storage_path: `${userId}/${timestamp}`, // Store path for reference
          thumb_url: thumbUrl,
          media_status: 'active', // Mark as active
          caption: caption || null,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating post record:', error);
        throw error;
      }

      console.log('✅ Post created successfully:', data.id);
      return { success: true, postId: data.id };
    } catch (error) {
      console.error('❌ Error in createPost:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create post';
      return { success: false, error: errorMessage };
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

      if (error) {
        console.error('❌ Error fetching active stories:', error);
        throw error;
      }

      return { success: true, stories: data as Story[] };
    } catch (error) {
      console.error('❌ Error in getActiveStories:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch active stories';
      return { success: false, error: errorMessage };
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

      if (error) {
        console.error('❌ Error fetching posts:', error);
        throw error;
      }

      return { success: true, posts: data as Post[] };
    } catch (error) {
      console.error('❌ Error in getPosts:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch posts';
      return { success: false, error: errorMessage };
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

      if (error) {
        console.error('❌ Error deleting expired stories:', error);
        throw error;
      }

      console.log(`✅ Deleted ${data?.length || 0} expired stories`);
      return { success: true, deletedCount: data?.length || 0 };
    } catch (error) {
      console.error('❌ Error in deleteExpiredStories:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete expired stories';
      return { success: false, error: errorMessage };
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
        console.log('⚠️ RPC not found, using fallback method');
        const { data: story } = await supabase
          .from('stories')
          .select('views_count')
          .eq('id', storyId)
          .maybeSingle();

        if (story) {
          await supabase
            .from('stories')
            .update({ views_count: (story.views_count || 0) + 1 })
            .eq('id', storyId);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Error incrementing story view:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to increment story view';
      return { success: false, error: errorMessage };
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
        console.log('⚠️ RPC not found, using fallback method');
        const { data: post } = await supabase
          .from('posts')
          .select('views_count')
          .eq('id', postId)
          .maybeSingle();

        if (post) {
          await supabase
            .from('posts')
            .update({ views_count: (post.views_count || 0) + 1 })
            .eq('id', postId);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Error incrementing post view:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to increment post view';
      return { success: false, error: errorMessage };
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
      console.error('❌ Error picking media:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to pick media';
      return { success: false, error: errorMessage };
    }
  }
}

export const mediaService = new MediaService();
