
import { supabase } from '@/app/integrations/supabase/client';
import { normalizeStreams, NormalizedStream, RawStreamData } from '@/utils/streamNormalizer';

/**
 * Fetches live streams with user profile data
 * @returns Array of normalized live streams
 */
export async function fetchLiveStreams(): Promise<NormalizedStream[]> {
  try {
    const { data, error } = await supabase
      .from('streams')
      .select(`
        *,
        users:broadcaster_id (
          id,
          display_name,
          avatar,
          verified_status
        )
      `)
      .eq('status', 'live')
      .order('started_at', { ascending: false });

    if (error) {
      console.error('Error fetching live streams:', error);
      return [];
    }

    return normalizeStreams((data || []) as RawStreamData[]);
  } catch (error) {
    console.error('Error in fetchLiveStreams:', error);
    return [];
  }
}

/**
 * Fetches a single stream by ID with user profile data
 * @param streamId - The stream ID
 * @returns Normalized stream or null
 */
export async function fetchStreamById(streamId: string): Promise<NormalizedStream | null> {
  try {
    const { data, error } = await supabase
      .from('streams')
      .select(`
        *,
        users:broadcaster_id (
          id,
          display_name,
          avatar,
          verified_status
        )
      `)
      .eq('id', streamId)
      .single();

    if (error) {
      console.error('Error fetching stream:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    const normalized = normalizeStreams([data as RawStreamData]);
    return normalized[0] || null;
  } catch (error) {
    console.error('Error in fetchStreamById:', error);
    return null;
  }
}

/**
 * Fetches streams by a specific broadcaster
 * @param broadcasterId - The broadcaster user ID
 * @returns Array of normalized streams
 */
export async function fetchStreamsByBroadcaster(broadcasterId: string): Promise<NormalizedStream[]> {
  try {
    const { data, error } = await supabase
      .from('streams')
      .select(`
        *,
        users:broadcaster_id (
          id,
          display_name,
          avatar,
          verified_status
        )
      `)
      .eq('broadcaster_id', broadcasterId)
      .order('started_at', { ascending: false });

    if (error) {
      console.error('Error fetching broadcaster streams:', error);
      return [];
    }

    return normalizeStreams((data || []) as RawStreamData[]);
  } catch (error) {
    console.error('Error in fetchStreamsByBroadcaster:', error);
    return [];
  }
}

/**
 * Fetches past/ended streams with user profile data
 * @param limit - Maximum number of streams to fetch
 * @returns Array of normalized streams
 */
export async function fetchPastStreams(limit: number = 20): Promise<NormalizedStream[]> {
  try {
    const { data, error } = await supabase
      .from('streams')
      .select(`
        *,
        users:broadcaster_id (
          id,
          display_name,
          avatar,
          verified_status
        )
      `)
      .eq('status', 'ended')
      .order('ended_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching past streams:', error);
      return [];
    }

    return normalizeStreams((data || []) as RawStreamData[]);
  } catch (error) {
    console.error('Error in fetchPastStreams:', error);
    return [];
  }
}

/**
 * Fetches recommended streams for a user
 * @param userId - The user ID (optional)
 * @returns Array of normalized streams
 */
export async function fetchRecommendedStreams(userId?: string): Promise<NormalizedStream[]> {
  try {
    // For now, just return live streams
    // TODO: Implement recommendation algorithm based on user preferences
    return await fetchLiveStreams();
  } catch (error) {
    console.error('Error in fetchRecommendedStreams:', error);
    return [];
  }
}

/**
 * Fetches streams from followed creators
 * @param userId - The user ID
 * @returns Array of normalized streams
 */
export async function fetchFollowingStreams(userId: string): Promise<NormalizedStream[]> {
  try {
    // First get the list of followed user IDs
    const { data: followData, error: followError } = await supabase
      .from('followers')
      .select('following_id')
      .eq('follower_id', userId);

    if (followError) {
      console.error('Error fetching following list:', followError);
      return [];
    }

    const followingIds = (followData || []).map(f => f.following_id);

    if (followingIds.length === 0) {
      return [];
    }

    // Fetch streams from followed creators
    const { data, error } = await supabase
      .from('streams')
      .select(`
        *,
        users:broadcaster_id (
          id,
          display_name,
          avatar,
          verified_status
        )
      `)
      .in('broadcaster_id', followingIds)
      .eq('status', 'live')
      .order('started_at', { ascending: false });

    if (error) {
      console.error('Error fetching following streams:', error);
      return [];
    }

    return normalizeStreams((data || []) as RawStreamData[]);
  } catch (error) {
    console.error('Error in fetchFollowingStreams:', error);
    return [];
  }
}
