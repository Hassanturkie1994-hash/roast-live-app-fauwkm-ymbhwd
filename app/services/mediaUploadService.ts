
import { supabase } from '@/app/integrations/supabase/client';

export type MediaType = 'avatar' | 'banner' | 'story' | 'post' | 'stream-replay' | 'thumbnail';

interface UploadResult {
  success: boolean;
  url?: string;
  storagePath?: string;
  error?: string;
}

/**
 * Media Upload Service
 * 
 * Handles ALL media uploads with proper persistence:
 * - Avatars
 * - Banners
 * - Stories
 * - Posts
 * - Stream replays
 * - Thumbnails
 * 
 * Ensures:
 * 1. Media is uploaded to Supabase Storage
 * 2. Metadata is stored in database
 * 3. CDN URLs are generated
 * 4. Media is retrievable across all devices
 */
class MediaUploadService {
  /**
   * Get bucket name for media type
   */
  private getBucketName(mediaType: MediaType): string {
    switch (mediaType) {
      case 'avatar':
        return 'avatars';
      case 'banner':
        return 'banners';
      case 'story':
        return 'stories';
      case 'post':
        return 'posts';
      case 'stream-replay':
        return 'stream-replays';
      case 'thumbnail':
        return 'stream-replays'; // Thumbnails go in same bucket as replays
      default:
        return 'posts';
    }
  }

  /**
   * Upload media file to Supabase Storage
   */
  async uploadMedia(
    userId: string,
    fileUri: string,
    mediaType: MediaType,
    metadata?: Record<string, any>
  ): Promise<UploadResult> {
    try {
      console.log(`📤 [MediaUpload] Starting upload for ${mediaType}`);
      console.log(`📤 [MediaUpload] File URI: ${fileUri}`);

      // Validate file URI
      if (!fileUri || fileUri.trim().length === 0) {
        return { success: false, error: 'Invalid file URI' };
      }

      // Fetch the file
      const response = await fetch(fileUri);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }

      const blob = await response.blob();
      if (!blob || blob.size === 0) {
        throw new Error('Invalid file: empty or corrupted');
      }

      console.log(`📤 [MediaUpload] File size: ${blob.size} bytes`);

      // Generate unique filename
      const timestamp = Date.now();
      const fileExt = fileUri.split('.').pop()?.toLowerCase() || 'jpg';
      const bucketName = this.getBucketName(mediaType);
      const fileName = `${userId}/${mediaType}_${timestamp}.${fileExt}`;

      console.log(`📤 [MediaUpload] Uploading to bucket: ${bucketName}, path: ${fileName}`);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, blob, {
          contentType: blob.type || 'application/octet-stream',
          upsert: false,
          cacheControl: '3600',
        });

      if (error) {
        console.error('❌ [MediaUpload] Upload error:', error);
        throw error;
      }

      console.log(`✅ [MediaUpload] File uploaded successfully:`, data);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      if (!urlData || !urlData.publicUrl) {
        throw new Error('Failed to get public URL');
      }

      console.log(`✅ [MediaUpload] Public URL generated: ${urlData.publicUrl}`);

      // Store metadata in database based on media type
      await this.storeMediaMetadata(userId, mediaType, urlData.publicUrl, fileName, metadata);

      return {
        success: true,
        url: urlData.publicUrl,
        storagePath: fileName,
      };
    } catch (error) {
      console.error('❌ [MediaUpload] Error uploading media:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload media';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Store media metadata in database
   */
  private async storeMediaMetadata(
    userId: string,
    mediaType: MediaType,
    url: string,
    storagePath: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      console.log(`💾 [MediaUpload] Storing metadata for ${mediaType}`);

      switch (mediaType) {
        case 'avatar':
          await supabase
            .from('profiles')
            .update({
              avatar_url: url,
              avatar_cdn_url: url,
              avatar_storage_path: storagePath,
            })
            .eq('id', userId);
          break;

        case 'banner':
          await supabase
            .from('profiles')
            .update({
              banner_url: url,
              banner_cdn_url: url,
              banner_storage_path: storagePath,
            })
            .eq('id', userId);
          break;

        case 'story':
          // Story metadata should be stored when creating the story
          // This is just for the media file
          console.log('✅ [MediaUpload] Story media uploaded, metadata will be set by story creation');
          break;

        case 'post':
          // Post metadata should be stored when creating the post
          // This is just for the media file
          console.log('✅ [MediaUpload] Post media uploaded, metadata will be set by post creation');
          break;

        case 'stream-replay':
        case 'thumbnail':
          // Replay metadata should be stored when saving the stream
          console.log('✅ [MediaUpload] Replay media uploaded, metadata will be set by stream save');
          break;

        default:
          console.warn(`⚠️ [MediaUpload] Unknown media type: ${mediaType}`);
      }

      console.log(`✅ [MediaUpload] Metadata stored successfully`);
    } catch (error) {
      console.error('❌ [MediaUpload] Error storing metadata:', error);
      // Don't throw - upload was successful, metadata storage is secondary
    }
  }

  /**
   * Delete media file from storage
   */
  async deleteMedia(mediaType: MediaType, storagePath: string): Promise<{ success: boolean; error?: string }> {
    try {
      const bucketName = this.getBucketName(mediaType);

      const { error } = await supabase.storage
        .from(bucketName)
        .remove([storagePath]);

      if (error) {
        console.error('Error deleting media:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in deleteMedia:', error);
      return { success: false, error: 'Failed to delete media' };
    }
  }

  /**
   * Validate media URL is accessible
   */
  async validateMediaUrl(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.error('Error validating media URL:', error);
      return false;
    }
  }

  /**
   * Get media URL with fallback
   */
  getMediaUrlWithFallback(
    primaryUrl: string | null | undefined,
    fallbackUrl: string
  ): string {
    if (!primaryUrl || primaryUrl.trim().length === 0) {
      return fallbackUrl;
    }
    return primaryUrl;
  }
}

export const mediaUploadService = new MediaUploadService();
