
import { supabase } from '@/app/integrations/supabase/client';

export const searchService = {
  async searchUsers(query: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(20);

      if (error) {
        console.error('Error searching users:', error);
        return { success: false, data: [], error };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in searchUsers:', error);
      return { success: false, data: [], error };
    }
  },

  async searchPosts(query: string) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles(*)')
        .ilike('caption', `%${query}%`)
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
      const { data, error } = await supabase
        .from('streams')
        .select('*, users(*)')
        .ilike('title', `%${query}%`)
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
};