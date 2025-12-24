
/**
 * Stream Normalizer Utility
 * 
 * Normalizes stream data from Supabase to ensure consistent structure
 * across the application. Handles missing or malformed data gracefully.
 */

export interface RawStreamData {
  id: string;
  title?: string | null;
  thumbnail_url?: string | null;
  playback_url?: string | null;
  viewer_count?: number | null;
  status?: string | null;
  started_at?: string | null;
  ended_at?: string | null;
  created_at?: string | null;
  broadcaster_id: string;
  cloudflare_stream_id?: string | null;
  users?: {
    id: string;
    display_name?: string | null;
    avatar?: string | null;
    verified_status?: boolean | null;
  } | null;
}

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
    avatar: string | null;
    verified_status: boolean;
  };
  start_time: string;
  broadcaster_id: string;
  status: string;
  cloudflare_stream_id: string | null;
  playback_url: string | null;
}

/**
 * Normalizes a single stream object
 */
export function normalizeStream(stream: RawStreamData): NormalizedStream | null {
  try {
    // Validate required fields
    if (!stream || !stream.id || !stream.broadcaster_id) {
      console.warn('⚠️ [streamNormalizer] Invalid stream data - missing required fields');
      return null;
    }

    // Validate user data
    if (!stream.users) {
      console.warn('⚠️ [streamNormalizer] Stream missing user data:', stream.id);
      return null;
    }

    const userData = stream.users;

    return {
      id: stream.id,
      title: stream.title || 'Untitled Stream',
      thumbnail_url: stream.thumbnail_url || stream.playback_url || 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=400&h=600&fit=crop',
      viewer_count: stream.viewer_count ?? 0,
      is_live: stream.status === 'live',
      user: {
        id: userData.id || stream.broadcaster_id,
        username: userData.display_name || 'Unknown',
        display_name: userData.display_name || 'Unknown',
        avatar: userData.avatar || null,
        verified_status: userData.verified_status ?? false,
      },
      start_time: stream.started_at || stream.created_at || new Date().toISOString(),
      broadcaster_id: stream.broadcaster_id,
      status: stream.status || 'unknown',
      cloudflare_stream_id: stream.cloudflare_stream_id || null,
      playback_url: stream.playback_url || null,
    };
  } catch (error) {
    console.error('❌ [streamNormalizer] Error normalizing stream:', error);
    return null;
  }
}

/**
 * Normalizes an array of streams
 */
export function normalizeStreams(streams: RawStreamData[]): NormalizedStream[] {
  if (!Array.isArray(streams)) {
    console.error('❌ [streamNormalizer] Expected array, got:', typeof streams);
    return [];
  }

  return streams
    .map(normalizeStream)
    .filter((stream): stream is NormalizedStream => stream !== null);
}
