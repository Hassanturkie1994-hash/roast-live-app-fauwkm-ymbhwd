
import { supabase } from '@/app/integrations/supabase/client';

export const storyService = {
  async createStory(userId: string, mediaUrl: string) {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const { data, error } = await supabase
        .from('stories')
        .insert({
          user_id: userId,
          media_url: mediaUrl,
          expires_at: expiresAt.toISOString(),
          views_count: 0,
          likes_count: 0,
          comments_count: 0,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating story:', error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in createStory:', error);
      return { success: false, error };
    }
  },

  async getActiveStories(userId?: string) {
    try {
      const now = new Date().toISOString();
      let query = supabase
        .from('stories')
        .select('*, profiles(*)')
        .gt('expires_at', now)
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching stories:', error);
        return { success: false, data: [], error };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in getActiveStories:', error);
      return { success: false, data: [], error };
    }
  },

  async viewStory(userId: string, storyId: string) {
    try {
      const { error } = await supabase.from('story_views').insert({
        user_id: userId,
        story_id: storyId,
      });

      if (error && !error.message.includes('duplicate')) {
        console.error('Error viewing story:', error);
        return { success: false, error };
      }

      // Increment view count
      await supabase.rpc('increment_story_views', { story_id: storyId });

      return { success: true };
    } catch (error) {
      console.error('Error in viewStory:', error);
      return { success: false, error };
    }
  },

  async likeStory(userId: string, storyId: string) {
    try {
      const { error } = await supabase.from('story_likes').insert({
        user_id: userId,
        story_id: storyId,
      });

      if (error) {
        console.error('Error liking story:', error);
        return { success: false, error };
      }

      // Increment like count
      const { error: updateError } = await supabase
        .from('stories')
        .update({ likes_count: supabase.raw('likes_count + 1') })
        .eq('id', storyId);

      if (updateError) {
        console.error('Error updating like count:', updateError);
      }

      return { success: true };
    } catch (error) {
      console.error('Error in likeStory:', error);
      return { success: false, error };
    }
  },

  async unlikeStory(userId: string, storyId: string) {
    try {
      const { error } = await supabase
        .from('story_likes')
        .delete()
        .eq('user_id', userId)
        .eq('story_id', storyId);

      if (error) {
        console.error('Error unliking story:', error);
        return { success: false, error };
      }

      // Decrement like count
      const { error: updateError } = await supabase
        .from('stories')
        .update({ likes_count: supabase.raw('likes_count - 1') })
        .eq('id', storyId);

      if (updateError) {
        console.error('Error updating like count:', updateError);
      }

      return { success: true };
    } catch (error) {
      console.error('Error in unlikeStory:', error);
      return { success: false, error };
    }
  },

  async getStoryViewers(storyId: string) {
    try {
      const { data, error } = await supabase
        .from('story_views')
        .select('*, profiles(*)')
        .eq('story_id', storyId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching story viewers:', error);
        return { success: false, data: [], error };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in getStoryViewers:', error);
      return { success: false, data: [], error };
    }
  },

  async deleteStory(userId: string, storyId: string) {
    try {
      const { data: story, error: fetchError } = await supabase
        .from('stories')
        .select('user_id, media_url')
        .eq('id', storyId)
        .single();

      if (fetchError || !story) {
        console.error('Error fetching story:', fetchError);
        return { success: false, error: fetchError };
      }

      if (story.user_id !== userId) {
        return { success: false, error: new Error('Unauthorized') };
      }

      const { error: deleteError } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId);

      if (deleteError) {
        console.error('Error deleting story:', deleteError);
        return { success: false, error: deleteError };
      }

      // Optionally delete the media from storage
      if (story.media_url) {
        const urlParts = story.media_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const filePath = `stories/${fileName}`;
        
        await supabase.storage.from('stories').remove([filePath]);
      }

      return { success: true };
    } catch (error) {
      console.error('Error in deleteStory:', error);
      return { success: false, error };
    }
  },
};