
import { supabase } from '@/app/integrations/supabase/client';

export type NotificationType =
  | 'like'
  | 'comment'
  | 'follow'
  | 'message'
  | 'stream_started'
  | 'gift_received'
  | 'payout_completed'
  | 'credit_purchase'
  | 'subscription_failed'
  | 'subscription_renewed'
  | 'warning'
  | 'timeout_ended'
  | 'ban_lifted'
  | 'admin_announcement'
  | 'system_update';

export type NotificationCategory = 'social' | 'gifts' | 'safety' | 'wallet' | 'admin';

export const notificationService = {
  async createNotification(
    senderId: string,
    receiverId: string,
    type: NotificationType,
    message?: string,
    refPostId?: string,
    refStoryId?: string,
    refStreamId?: string,
    category?: NotificationCategory
  ) {
    try {
      // Auto-determine category if not provided
      let notificationCategory = category;
      if (!notificationCategory) {
        if (['like', 'comment', 'follow'].includes(type)) {
          notificationCategory = 'social';
        } else if (type === 'gift_received') {
          notificationCategory = 'gifts';
        } else if (['warning', 'timeout_ended', 'ban_lifted'].includes(type)) {
          notificationCategory = 'safety';
        } else if (['payout_completed', 'credit_purchase', 'subscription_failed', 'subscription_renewed'].includes(type)) {
          notificationCategory = 'wallet';
        } else if (['admin_announcement', 'system_update'].includes(type)) {
          notificationCategory = 'admin';
        } else {
          notificationCategory = 'social';
        }
      }

      const { error } = await supabase.from('notifications').insert({
        sender_id: senderId,
        receiver_id: receiverId,
        type,
        message,
        ref_post_id: refPostId,
        ref_story_id: refStoryId,
        ref_stream_id: refStreamId,
        category: notificationCategory,
        read: false,
      });

      if (error) {
        console.error('Error creating notification:', error);
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in createNotification:', error);
      return { success: false, error };
    }
  },

  async getNotificationsByCategory(userId: string, category?: NotificationCategory) {
    try {
      let query = supabase
        .from('notifications')
        .select(`
          *,
          sender:profiles!notifications_sender_id_fkey(id, username, display_name, avatar_url)
        `)
        .eq('receiver_id', userId)
        .order('created_at', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error getting notifications:', error);
        return { success: false, notifications: [], error };
      }

      return { success: true, notifications: data || [] };
    } catch (error) {
      console.error('Error in getNotificationsByCategory:', error);
      return { success: false, notifications: [], error };
    }
  },

  async getUnreadCount(userId: string) {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', userId)
        .eq('read', false);

      if (error) {
        console.error('Error getting unread count:', error);
        return { success: false, count: 0, error };
      }

      return { success: true, count: count || 0 };
    } catch (error) {
      console.error('Error in getUnreadCount:', error);
      return { success: false, count: 0, error };
    }
  },

  async getUnreadCountByCategory(userId: string, category: NotificationCategory) {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', userId)
        .eq('category', category)
        .eq('read', false);

      if (error) {
        console.error('Error getting unread count by category:', error);
        return { success: false, count: 0, error };
      }

      return { success: true, count: count || 0 };
    } catch (error) {
      console.error('Error in getUnreadCountByCategory:', error);
      return { success: false, count: 0, error };
    }
  },

  async markAsRead(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in markAsRead:', error);
      return { success: false, error };
    }
  },

  async markAllAsRead(userId: string, category?: NotificationCategory) {
    try {
      let query = supabase
        .from('notifications')
        .update({ read: true })
        .eq('receiver_id', userId)
        .eq('read', false);

      if (category) {
        query = query.eq('category', category);
      }

      const { error } = await query;

      if (error) {
        console.error('Error marking all as read:', error);
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in markAllAsRead:', error);
      return { success: false, error };
    }
  },
};