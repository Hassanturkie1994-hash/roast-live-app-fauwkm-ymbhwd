
import { supabase } from '@/app/integrations/supabase/client';

export type SearchContentType = 'all' | 'profiles' | 'posts' | 'lives';

export const searchService = {
  /**
   * Search users with partial, case-insensitive matching
   * Supports searching by username and display_name
   */
  async searchUsers(query: string) {
    try {
      if (!query || query.trim().length === 0) {
        return { success: true, data: [] };
      }

      const searchTerm = query.trim().toLowerCase();

      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, bio')
        .or(`username.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`)
        .limit(20);

      if (error) {
        console.error('Error searching users:', error);
        return { success: false, data: [], error };
      }

      const sortedData = (data || []).sort((a, b) => {
        const aUsername = (a.username || '').toLowerCase();
        const bUsername = (b.username || '').toLowerCase();
        const aDisplayName = (a.display_name || '').toLowerCase();
        const bDisplayName = (b.display_name || '').toLowerCase();

        if (aUsername === searchTerm) return -1;
        if (bUsername === searchTerm) return 1;

        if (aDisplayName === searchTerm) return -1;
        if (bDisplayName === searchTerm) return 1;

        if (aUsername.startsWith(searchTerm) && !bUsername.startsWith(searchTerm)) return -1;
        if (bUsername.startsWith(searchTerm) && !aUsername.startsWith(searchTerm)) return 1;

        if (aDisplayName.startsWith(searchTerm) && !bDisplayName.startsWith(searchTerm)) return -1;
        if (bDisplayName.startsWith(searchTerm) && !aDisplayName.startsWith(searchTerm)) return 1;

        return aUsername.localeCompare(bUsername);
      });

      return { success: true, data: sortedData };
    } catch (error) {
      console.error('Error in searchUsers:', error);
      return { success: false, data: [], error };
    }
  },

  async searchPosts(query: string) {
    try {
      if (!query || query.trim().length === 0) {
        return { success: true, data: [] };
      }

      const searchTerm = query.trim();

      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles(*)')
        .ilike('caption', `%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error searching posts:', error);
        return { success: false, data: [], error };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in searchPosts:', error);
      return { success: false, data: [], error };
    }
  },

  async searchStreams(query: string) {
    try {
      if (!query || query.trim().length === 0) {
        return { success: true, data: [] };
      }

      const searchTerm = query.trim();

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
        .ilike('title', `%${searchTerm}%`)
        .eq('status', 'live')
        .order('viewer_count', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error searching streams:', error);
        return { success: false, data: [], error };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in searchStreams:', error);
      return { success: false, data: [], error };
    }
  },

  async searchAll(query: string) {
    try {
      if (!query || query.trim().length === 0) {
        return {
          success: true,
          data: { users: [], posts: [], streams: [] },
        };
      }

      const [usersResult, postsResult, streamsResult] = await Promise.all([
        searchService.searchUsers(query),
        searchService.searchPosts(query),
        searchService.searchStreams(query),
      ]);

      return {
        success: true,
        data: {
          users: usersResult.data,
          posts: postsResult.data,
          streams: streamsResult.data,
        },
      };
    } catch (error) {
      console.error('Error in searchAll:', error);
      return {
        success: false,
        data: { users: [], posts: [], streams: [] },
        error,
      };
    }
  },

  /**
   * Search with content type filter
   */
  async searchByType(query: string, contentType: SearchContentType) {
    switch (contentType) {
      case 'profiles':
        return this.searchUsers(query);
      case 'posts':
        return this.searchPosts(query);
      case 'lives':
        return this.searchStreams(query);
      case 'all':
      default:
        return this.searchAll(query);
    }
  },
};
