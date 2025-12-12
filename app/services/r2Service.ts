
import { supabase } from '@/app/integrations/supabase/client';
import Constants from 'expo-constants';

/**
 * Cloudflare R2 Storage Service
 * 
 * Handles uploads to Cloudflare R2 via Supabase Edge Functions.
 * All uploads are routed through Edge Functions for security.
 * 
 * Features:
 * - Presigned upload URLs
 * - Signed CDN URLs for secure access
 * - Support for various media types
 */

export type MediaType = 'profile' | 'story' | 'post' | 'gift' | 'thumbnail' | 'other';

interface UploadResponse {
  success: boolean;
  uploadUrl?: string;
  publicUrl?: string;
  filePath?: string;
  expiresIn?: number;
  method?: string;
  headers?: Record<string, string>;
  error?: string;
}

interface SignedUrlResponse {
  success: boolean;
  signedUrl?: string;
  expiresAt?: number;
  expiresIn?: number;
  error?: string;
}

class R2Service {
  private r2BaseUrl: string;
  private functionsUrl: string;

  constructor() {
    const extra = Constants.expoConfig?.extra;
    this.r2BaseUrl = extra?.CLOUDFLARE_R2_PUBLIC_BASE_URL || '';
    this.functionsUrl = extra?.SUPABASE_FUNCTIONS_URL || '';
  }

  /**
   * Get presigned upload URL from Edge Function
   */
  async getUploadUrl(
    fileName: string,
    fileType: string,
    mediaType: MediaType = 'other'
  ): Promise<UploadResponse> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return { success: false, error: 'Not authenticated' };
      }

      const { data, error } = await supabase.functions.invoke('upload-to-r2', {
        body: {
          fileName,
          fileType,
          mediaType,
        },
      });

      if (error) {
        console.error('Error getting upload URL:', error);
        return { success: false, error: error.message };
      }

      return data as UploadResponse;
    } catch (error: any) {
      console.error('Error in getUploadUrl:', error);
      return { success: false, error: error.message || 'Failed to get upload URL' };
    }
  }

  /**
   * Upload file to R2 using presigned URL
   */
  async uploadFile(
    file: Blob | File,
    fileName: string,
    mediaType: MediaType = 'other'
  ): Promise<{ success: boolean; publicUrl?: string; error?: string }> {
    try {
      // Get presigned upload URL
      const uploadResponse = await this.getUploadUrl(
        fileName,
        file.type || 'application/octet-stream',
        mediaType
      );

      if (!uploadResponse.success || !uploadResponse.uploadUrl) {
        return { success: false, error: uploadResponse.error || 'Failed to get upload URL' };
      }

      // Upload file to R2 using presigned URL
      const uploadResult = await fetch(uploadResponse.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
      });

      if (!uploadResult.ok) {
        console.error('Upload failed:', uploadResult.status, uploadResult.statusText);
        return { success: false, error: `Upload failed: ${uploadResult.statusText}` };
      }

      console.log('✅ File uploaded successfully to R2:', uploadResponse.publicUrl);

      return {
        success: true,
        publicUrl: uploadResponse.publicUrl,
      };
    } catch (error: any) {
      console.error('Error uploading file:', error);
      return { success: false, error: error.message || 'Upload failed' };
    }
  }

  /**
   * Get signed CDN URL for secure access
   */
  async getSignedUrl(
    path: string,
    expiresIn: number = 600, // 10 minutes default
    watermark: string = 'RoastLive'
  ): Promise<SignedUrlResponse> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return { success: false, error: 'Not authenticated' };
      }

      const { data, error } = await supabase.functions.invoke('sign-url', {
        body: {
          path,
          expiresIn,
          watermark,
        },
      });

      if (error) {
        console.error('Error getting signed URL:', error);
        return { success: false, error: error.message };
      }

      return data as SignedUrlResponse;
    } catch (error: any) {
      console.error('Error in getSignedUrl:', error);
      return { success: false, error: error.message || 'Failed to get signed URL' };
    }
  }

  /**
   * Upload profile image
   */
  async uploadProfileImage(
    file: Blob | File,
    userId: string
  ): Promise<{ success: boolean; publicUrl?: string; error?: string }> {
    const fileName = `avatar_${userId}_${Date.now()}.jpg`;
    return this.uploadFile(file, fileName, 'profile');
  }

  /**
   * Upload story media
   */
  async uploadStoryMedia(
    file: Blob | File,
    userId: string,
    isVideo: boolean = false
  ): Promise<{ success: boolean; publicUrl?: string; error?: string }> {
    const extension = isVideo ? 'mp4' : 'jpg';
    const fileName = `story_${userId}_${Date.now()}.${extension}`;
    return this.uploadFile(file, fileName, 'story');
  }

  /**
   * Upload post media
   */
  async uploadPostMedia(
    file: Blob | File,
    userId: string
  ): Promise<{ success: boolean; publicUrl?: string; error?: string }> {
    const fileName = `post_${userId}_${Date.now()}.jpg`;
    return this.uploadFile(file, fileName, 'post');
  }

  /**
   * Upload thumbnail
   */
  async uploadThumbnail(
    file: Blob | File,
    userId: string
  ): Promise<{ success: boolean; publicUrl?: string; error?: string }> {
    const fileName = `thumbnail_${userId}_${Date.now()}.jpg`;
    return this.uploadFile(file, fileName, 'thumbnail');
  }

  /**
   * Check if URL is an R2 URL
   */
  isR2Url(url: string): boolean {
    return url.includes('.r2.dev') || url.includes('.r2.cloudflarestorage.com');
  }

  /**
   * Extract path from R2 URL
   */
  extractPathFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      // Remove leading slash
      return urlObj.pathname.substring(1);
    } catch (error) {
      console.error('Error extracting path from URL:', error);
      return null;
    }
  }
}

export const r2Service = new R2Service();