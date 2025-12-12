
import { supabase } from '@/app/integrations/supabase/client';
import { notificationService } from './notificationService';

export const likeService = {
  // Like a post
  async likePost(userId: string, postId: string) {
    try {
      const { error } = await supabase.from('post_likes_v2').insert({
        user_id: userId,
        post_id: postId,
      });

      if (error) {
        console.error('Error liking post:', error);
        return { success: false, error };
      }

      // Increment likes count
      await supabase.rpc('increment_post_likes', { post_id: postId });

      // Get post owner to send notification
      const { data: post } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .single();

      if (post && post.user_id !== userId) {
        await notificationService.createNotification(
          userId,
          post.user_id,
          'like',
          'liked your post',
          postId,
          undefined,
          undefined,
          'social'
        );
      }

      return { success: true };
    } catch (error) {
      console.error('Error in likePost:', error);
      return { success: false, error };
    }
  },

  // Unlike a post
  async unlikePost(userId: string, postId: string) {
    try {
      const { error } = await supabase
        .from('post_likes_v2')
        .delete()
        .eq('user_id', userId)
        .eq('post_id', postId);

      if (error) {
        console.error('Error unliking post:', error);
        return { success: false, error };
      }

      // Decrement likes count
      await supabase.rpc('decrement_post_likes', { post_id: postId });

      return { success: true };
    } catch (error) {
      console.error('Error in unlikePost:', error);
      return { success: false, error };
    }
  },

  // Check if user liked a post
  async hasLikedPost(userId: string, postId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('post_likes_v2')
        .select('id')
        .eq('user_id', userId)
        .eq('post_id', postId)
        .maybeSingle();

      if (error) {
        console.error('Error checking post like:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error in hasLikedPost:', error);
      return false;
    }
  },

  // Like a story
  async likeStory(userId: string, storyId: string) {
    try {
      const { error } = await supabase.from('story_likes_v2').insert({
        user_id: userId,
        story_id: storyId,
      });

      if (error) {
        console.error('Error liking story:', error);
        return { success: false, error };
      }

      // Increment likes count
      await supabase.rpc('increment_story_likes', { story_id: storyId });

      // Get story owner to send notification
      const { data: story } = await supabase
        .from('stories')
        .select('user_id')
        .eq('id', storyId)
        .single();

      if (story && story.user_id !== userId) {
        await notificationService.createNotification(
          userId,
          story.user_id,
          'like',
          'liked your story',
          undefined,
          storyId,
          undefined,
          'social'
        );
      }

      return { success: true };
    } catch (error) {
      console.error('Error in likeStory:', error);
      return { success: false, error };
    }
  },

  // Unlike a story
  async unlikeStory(userId: string, storyId: string) {
    try {
      const { error } = await supabase
        .from('story_likes_v2')
        .delete()
        .eq('user_id', userId)
        .eq('story_id', storyId);

      if (error) {
        console.error('Error unliking story:', error);
        return { success: false, error };
      }

      // Decrement likes count
      await supabase.rpc('decrement_story_likes', { story_id: storyId });

      return { success: true };
    } catch (error) {
      console.error('Error in unlikeStory:', error);
      return { success: false, error };
    }
  },

  // Check if user liked a story
  async hasLikedStory(userId: string, storyId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('story_likes_v2')
        .select('id')
        .eq('user_id', userId)
        .eq('story_id', storyId)
        .maybeSingle();

      if (error) {
        console.error('Error checking story like:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error in hasLikedStory:', error);
      return false;
    }
  },

  // Get post likes count
  async getPostLikesCount(postId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('post_likes_v2')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

      if (error) {
        console.error('Error getting post likes count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getPostLikesCount:', error);
      return 0;
    }
  },

  // Get story likes count
  async getStoryLikesCount(storyId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('story_likes_v2')
        .select('*', { count: 'exact', head: true })
        .eq('story_id', storyId);

      if (error) {
        console.error('Error getting story likes count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getStoryLikesCount:', error);
      return 0;
    }
  },
};