
import { Tables } from '@/app/integrations/supabase/types';

// Default fallback values
const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200';
const DEFAULT_THUMBNAIL = 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=400&h=600&fit=crop';
const DEFAULT_USERNAME = 'Unknown';

// Normalized stream type with guaranteed fields
export interface NormalizedStream {
  id: string;
  title: string;
  thumbnail_url: string;
  viewer_count: number;
  is_live: boolean;
  user: {
    id: string;
    username: string;
    display_name: string;
    avatar: string;
    verified_status: boolean;
  };
  start_time: string;
  broadcaster_id: string;
  status: string;
  cloudflare_stream_id: string | null;
  playback_url: string | null;
}

// Type for raw stream data from Supabase
export type RawStreamData = Tables<'streams'> & {
  users?: Tables<'users'> | null;
  profiles?: {
    id: string;
    username?: string | null;
    display_name?: string | null;
    avatar_url?: string | null;
    verified_status?: boolean | null;
  } | null;
};

/**
 * Normalizes a stream object to ensure all required fields exist
 * @param stream - Raw stream data from Supabase
 * @returns Normalized stream with guaranteed fields
 */
export function normalizeStream(stream: RawStreamData): NormalizedStream {
  // Extract user data from either users or profiles join
  const userData = stream.users || stream.profiles;
  
  // Create safe user object with fallbacks
  const user = {
    id: userData?.id || stream.broadcaster_id || '',
    username: userData?.username || userData?.display_name || DEFAULT_USERNAME,
    display_name: userData?.display_name || userData?.username || DEFAULT_USERNAME,
    avatar: userData?.avatar || userData?.avatar_url || DEFAULT_AVATAR,
    verified_status: userData?.verified_status ?? false,
  };

  // Create normalized stream object
  return {
    id: stream.id,
    title: stream.title || 'Untitled Stream',
    thumbnail_url: stream.playback_url || DEFAULT_THUMBNAIL,
    viewer_count: stream.viewer_count ?? 0,
    is_live: stream.status === 'live',
    user,
    start_time: stream.started_at || stream.created_at || new Date().toISOString(),
    broadcaster_id: stream.broadcaster_id,
    status: stream.status,
    cloudflare_stream_id: stream.cloudflare_stream_id,
    playback_url: stream.playback_url,
  };
}

/**
 * Normalizes an array of streams
 * @param streams - Array of raw stream data
 * @returns Array of normalized streams
 */
export function normalizeStreams(streams: RawStreamData[]): NormalizedStream[] {
  return streams.map(normalizeStream);
}

/**
 * Gets a safe user object from stream data
 * @param stream - Raw stream data
 * @returns Safe user object with fallbacks
 */
export function getSafeUser(stream: RawStreamData) {
  const userData = stream.users || stream.profiles;
  
  return {
    id: userData?.id || stream.broadcaster_id || '',
    username: userData?.username || userData?.display_name || DEFAULT_USERNAME,
    display_name: userData?.display_name || userData?.username || DEFAULT_USERNAME,
    avatar: userData?.avatar || userData?.avatar_url || DEFAULT_AVATAR,
    verified_status: userData?.verified_status ?? false,
  };
}

/**
 * Gets a safe thumbnail URL from stream data
 * @param stream - Raw stream data
 * @returns Thumbnail URL with fallback
 */
export function getSafeThumbnail(stream: RawStreamData): string {
  return stream.playback_url || DEFAULT_THUMBNAIL;
}

/**
 * Gets a safe viewer count from stream data
 * @param stream - Raw stream data
 * @returns Viewer count with fallback to 0
 */
export function getSafeViewerCount(stream: RawStreamData): number {
  return stream.viewer_count ?? 0;
}

/**
 * Checks if a stream is currently live
 * @param stream - Raw stream data
 * @returns True if stream is live
 */
export function isStreamLive(stream: RawStreamData): boolean {
  return stream.status === 'live';
}
