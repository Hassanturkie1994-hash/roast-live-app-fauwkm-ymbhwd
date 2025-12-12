
import { supabase } from '@/app/integrations/supabase/client';

export const postService = {
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
      // First, get the post to verify ownership and get media URL
      const { data: post, error: fetchError } = await supabase
        .from('posts')
        .select('user_id, media_url')
        .eq('id', postId)
        .single();

      if (fetchError || !post) {
        console.error('Error fetching post:', fetchError);
        return { success: false, error: fetchError };
      }

      if (post.user_id !== userId) {
        return { success: false, error: new Error('Unauthorized') };
      }

      // Delete the post
      const { error: deleteError } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (deleteError) {
        console.error('Error deleting post:', deleteError);
        return { success: false, error: deleteError };
      }

      // Optionally delete the media from storage
      if (post.media_url) {
        const urlParts = post.media_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const filePath = `posts/${fileName}`;
        
        await supabase.storage.from('posts').remove([filePath]);
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