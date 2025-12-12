
import { supabase } from '@/app/integrations/supabase/client';
import { notificationService } from './notificationService';
import { pushNotificationService } from './pushNotificationService';

export interface LiveComment {
  id: string;
  stream_id: string;
  user_id: string;
  message: string;
  created_at: string;
  profiles?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  profiles?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

export interface StoryComment {
  id: string;
  story_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  profiles?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

class CommentService {
  /**
   * Extract @mentions from comment text
   */
  private extractMentions(text: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }
    
    return mentions;
  }

  /**
   * Get user IDs from usernames
   */
  private async getUserIdsByUsernames(usernames: string[]): Promise<string[]> {
    if (usernames.length === 0) return [];

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .in('username', usernames);

      if (error) {
        console.error('Error fetching user IDs by usernames:', error);
        return [];
      }

      return data?.map(u => u.id) || [];
    } catch (error) {
      console.error('Error in getUserIdsByUsernames:', error);
      return [];
    }
  }

  // Save a live comment to the database
  async saveComment(
    streamId: string,
    userId: string,
    message: string
  ): Promise<{ success: boolean; data?: LiveComment; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('live_comments')
        .insert({
          stream_id: streamId,
          user_id: userId,
          message,
        })
        .select('*, profiles(*)')
        .single();

      if (error) {
        console.error('Error saving comment:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Comment saved successfully');
      return { success: true, data: data as LiveComment };
    } catch (error) {
      console.error('Error in saveComment:', error);
      return { success: false, error: 'Failed to save comment' };
    }
  }

  // Get comments for a stream
  async getComments(streamId: string, limit: number = 50): Promise<LiveComment[]> {
    try {
      const { data, error } = await supabase
        .from('live_comments')
        .select('*, profiles(*)')
        .eq('stream_id', streamId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching comments:', error);
        return [];
      }

      return (data as LiveComment[]).reverse();
    } catch (error) {
      console.error('Error in getComments:', error);
      return [];
    }
  }

  // Delete a comment
  async deleteComment(commentId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('live_comments')
        .delete()
        .eq('id', commentId);

      if (error) {
        console.error('Error deleting comment:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Comment deleted successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in deleteComment:', error);
      return { success: false, error: 'Failed to delete comment' };
    }
  }

  // Get comment count for a stream
  async getCommentCount(streamId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('live_comments')
        .select('*', { count: 'exact', head: true })
        .eq('stream_id', streamId);

      if (error) {
        console.error('Error fetching comment count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getCommentCount:', error);
      return 0;
    }
  }

  // Add comment to post
  async addPostComment(
    postId: string,
    userId: string,
    comment: string
  ): Promise<{ success: boolean; data?: PostComment; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: userId,
          comment,
        })
        .select('*, profiles(*)')
        .single();

      if (error) {
        console.error('Error adding post comment:', error);
        return { success: false, error: error.message };
      }

      // Get post owner to send notification
      const { data: post } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .single();

      if (post && post.user_id !== userId) {
        // Create in-app notification
        await notificationService.createNotification(
          userId,
          post.user_id,
          'comment',
          'commented on your post',
          postId,
          undefined,
          undefined,
          'social'
        );

        // Get commenter profile
        const { data: commenterProfile } = await supabase
          .from('profiles')
          .select('display_name, username')
          .eq('id', userId)
          .single();

        const commenterName = commenterProfile?.display_name || commenterProfile?.username || 'Someone';

        // Send push notification
        await pushNotificationService.sendNewCommentNotification(
          post.user_id,
          userId,
          commenterName,
          postId
        );
      }

      // Check for @mentions
      const mentions = this.extractMentions(comment);
      if (mentions.length > 0) {
        const mentionedUserIds = await this.getUserIdsByUsernames(mentions);
        
        // Get commenter profile
        const { data: commenterProfile } = await supabase
          .from('profiles')
          .select('display_name, username')
          .eq('id', userId)
          .single();

        const commenterName = commenterProfile?.display_name || commenterProfile?.username || 'Someone';

        // Send mention notifications
        for (const mentionedUserId of mentionedUserIds) {
          if (mentionedUserId !== userId) {
            await pushNotificationService.sendMentionNotification(
              mentionedUserId,
              userId,
              commenterName,
              postId
            );
          }
        }
      }

      return { success: true, data: data as PostComment };
    } catch (error) {
      console.error('Error in addPostComment:', error);
      return { success: false, error: 'Failed to add comment' };
    }
  }

  // Add comment to story
  async addStoryComment(
    storyId: string,
    userId: string,
    comment: string
  ): Promise<{ success: boolean; data?: StoryComment; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('story_comments')
        .insert({
          story_id: storyId,
          user_id: userId,
          comment,
        })
        .select('*, profiles(*)')
        .single();

      if (error) {
        console.error('Error adding story comment:', error);
        return { success: false, error: error.message };
      }

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
          'comment',
          'commented on your story',
          undefined,
          storyId,
          undefined,
          'social'
        );
      }

      // Check for @mentions
      const mentions = this.extractMentions(comment);
      if (mentions.length > 0) {
        const mentionedUserIds = await this.getUserIdsByUsernames(mentions);
        
        // Get commenter profile
        const { data: commenterProfile } = await supabase
          .from('profiles')
          .select('display_name, username')
          .eq('id', userId)
          .single();

        const commenterName = commenterProfile?.display_name || commenterProfile?.username || 'Someone';

        // Send mention notifications (using postId as storyId for routing)
        for (const mentionedUserId of mentionedUserIds) {
          if (mentionedUserId !== userId) {
            await pushNotificationService.sendMentionNotification(
              mentionedUserId,
              userId,
              commenterName,
              storyId
            );
          }
        }
      }

      return { success: true, data: data as StoryComment };
    } catch (error) {
      console.error('Error in addStoryComment:', error);
      return { success: false, error: 'Failed to add comment' };
    }
  }

  // Add reply to post comment
  async addPostCommentReply(
    parentCommentId: string,
    userId: string,
    comment: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('comment_replies')
        .insert({
          parent_comment_id: parentCommentId,
          user_id: userId,
          comment,
        });

      if (error) {
        console.error('Error adding comment reply:', error);
        return { success: false, error: error.message };
      }

      // Get parent comment owner to send notification
      const { data: parentComment } = await supabase
        .from('post_comments')
        .select('user_id, post_id')
        .eq('id', parentCommentId)
        .single();

      if (parentComment && parentComment.user_id !== userId) {
        // Create in-app notification
        await notificationService.createNotification(
          userId,
          parentComment.user_id,
          'comment',
          'replied to your comment',
          undefined,
          undefined,
          undefined,
          'social'
        );

        // Get replier profile
        const { data: replierProfile } = await supabase
          .from('profiles')
          .select('display_name, username')
          .eq('id', userId)
          .single();

        const replierName = replierProfile?.display_name || replierProfile?.username || 'Someone';

        // Send push notification
        await pushNotificationService.sendCommentReplyNotification(
          parentComment.user_id,
          userId,
          replierName,
          parentComment.post_id
        );
      }

      // Check for @mentions
      const mentions = this.extractMentions(comment);
      if (mentions.length > 0 && parentComment) {
        const mentionedUserIds = await this.getUserIdsByUsernames(mentions);
        
        // Get replier profile
        const { data: replierProfile } = await supabase
          .from('profiles')
          .select('display_name, username')
          .eq('id', userId)
          .single();

        const replierName = replierProfile?.display_name || replierProfile?.username || 'Someone';

        // Send mention notifications
        for (const mentionedUserId of mentionedUserIds) {
          if (mentionedUserId !== userId) {
            await pushNotificationService.sendMentionNotification(
              mentionedUserId,
              userId,
              replierName,
              parentComment.post_id
            );
          }
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error in addPostCommentReply:', error);
      return { success: false, error: 'Failed to add reply' };
    }
  }

  // Add reply to story comment
  async addStoryCommentReply(
    parentCommentId: string,
    userId: string,
    comment: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('story_comment_replies')
        .insert({
          parent_comment_id: parentCommentId,
          user_id: userId,
          comment,
        });

      if (error) {
        console.error('Error adding story comment reply:', error);
        return { success: false, error: error.message };
      }

      // Get parent comment owner to send notification
      const { data: parentComment } = await supabase
        .from('story_comments')
        .select('user_id, story_id')
        .eq('id', parentCommentId)
        .single();

      if (parentComment && parentComment.user_id !== userId) {
        await notificationService.createNotification(
          userId,
          parentComment.user_id,
          'comment',
          'replied to your comment',
          undefined,
          undefined,
          undefined,
          'social'
        );
      }

      // Check for @mentions
      const mentions = this.extractMentions(comment);
      if (mentions.length > 0 && parentComment) {
        const mentionedUserIds = await this.getUserIdsByUsernames(mentions);
        
        // Get replier profile
        const { data: replierProfile } = await supabase
          .from('profiles')
          .select('display_name, username')
          .eq('id', userId)
          .single();

        const replierName = replierProfile?.display_name || replierProfile?.username || 'Someone';

        // Send mention notifications (using storyId as postId for routing)
        for (const mentionedUserId of mentionedUserIds) {
          if (mentionedUserId !== userId) {
            await pushNotificationService.sendMentionNotification(
              mentionedUserId,
              userId,
              replierName,
              parentComment.story_id
            );
          }
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error in addStoryCommentReply:', error);
      return { success: false, error: 'Failed to add reply' };
    }
  }

  // Delete post comment
  async deletePostComment(commentId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', commentId);

      if (error) {
        console.error('Error deleting post comment:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in deletePostComment:', error);
      return { success: false, error: 'Failed to delete comment' };
    }
  }

  // Delete story comment
  async deleteStoryComment(commentId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('story_comments')
        .delete()
        .eq('id', commentId);

      if (error) {
        console.error('Error deleting story comment:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in deleteStoryComment:', error);
      return { success: false, error: 'Failed to delete comment' };
    }
  }
}

export const commentService = new CommentService();