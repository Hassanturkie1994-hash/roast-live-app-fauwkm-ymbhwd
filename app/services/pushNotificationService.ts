
import { supabase } from '@/app/integrations/supabase/client';
import { inboxService } from './inboxService';

// Extended notification types for push notifications
export type PushNotificationType =
  | 'SYSTEM_WARNING'
  | 'MODERATION_WARNING'
  | 'TIMEOUT_APPLIED'
  | 'BAN_APPLIED'
  | 'BAN_EXPIRED'
  | 'APPEAL_RECEIVED'
  | 'APPEAL_APPROVED'
  | 'APPEAL_DENIED'
  | 'ADMIN_ANNOUNCEMENT'
  | 'SAFETY_REMINDER'
  | 'STREAM_STARTED'
  | 'GIFT_RECEIVED'
  | 'NEW_FOLLOWER'
  | 'FOLLOWERS_BATCH'
  | 'NEW_COMMENT'
  | 'COMMENT_REPLY'
  | 'MENTION'
  | 'PREMIUM_ACTIVATED'
  | 'PREMIUM_RENEWED'
  | 'PREMIUM_EXPIRING'
  | 'PREMIUM_CANCELED'
  | 'PAYMENT_FAILED'
  | 'VIP_MEMBER_JOINED'
  | 'VIP_CLUB_JOINED'
  | 'MILESTONE_UNLOCKED'
  | 'stream_started'
  | 'moderator_role_updated'
  | 'gift_received'
  | 'new_follower'
  | 'new_message';

export type DevicePlatform = 'ios' | 'android' | 'web';

export interface PushDeviceToken {
  id: string;
  user_id: string;
  platform: DevicePlatform;
  device_token: string;
  created_at: string;
  last_used_at: string;
  is_active: boolean;
}

export interface PushNotificationLog {
  id: string;
  user_id: string;
  type: PushNotificationType;
  title: string;
  body: string;
  payload_json?: Record<string, any>;
  sent_at: string;
  delivery_status: 'pending' | 'sent' | 'failed';
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  stream_started: boolean;
  moderator_role_updated: boolean;
  gift_received: boolean;
  new_follower: boolean;
  new_message: boolean;
  safety_moderation_alerts: boolean;
  admin_announcements: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  notify_when_followed_goes_live: boolean;
  created_at: string;
  updated_at: string;
}

class PushNotificationService {
  /**
   * PROMPT 1: Register or update device token
   * On app login: register or update token, mark previous tokens for same device as inactive if needed
   */
  async registerDeviceToken(
    userId: string,
    deviceToken: string,
    platform: DevicePlatform
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Mark all existing tokens for this user and device as inactive
      await supabase
        .from('push_device_tokens')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('device_token', deviceToken);

      // Insert or update the new token
      const { error } = await supabase
        .from('push_device_tokens')
        .upsert({
          user_id: userId,
          device_token: deviceToken,
          platform,
          last_used_at: new Date().toISOString(),
          is_active: true,
        }, {
          onConflict: 'user_id,device_token',
        });

      if (error) {
        console.error('Error registering device token:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ Device token registered for user ${userId} on ${platform}`);
      return { success: true };
    } catch (error: any) {
      console.error('Error in registerDeviceToken:', error);
      return { success: false, error: error.message || 'Failed to register device token' };
    }
  }

  /**
   * Get active device tokens for a user
   */
  async getActiveDeviceTokens(userId: string): Promise<PushDeviceToken[]> {
    try {
      const { data, error } = await supabase
        .from('push_device_tokens')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching device tokens:', error);
        return [];
      }

      return data as PushDeviceToken[];
    } catch (error) {
      console.error('Error in getActiveDeviceTokens:', error);
      return [];
    }
  }

  /**
   * Deactivate a specific device token
   */
  async deactivateDeviceToken(
    userId: string,
    deviceToken: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('push_device_tokens')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('device_token', deviceToken);

      if (error) {
        console.error('Error deactivating device token:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ Device token deactivated for user ${userId}`);
      return { success: true };
    } catch (error: any) {
      console.error('Error in deactivateDeviceToken:', error);
      return { success: false, error: error.message || 'Failed to deactivate device token' };
    }
  }

  /**
   * PROMPT 4: Check if user is in quiet hours
   */
  private async isInQuietHours(userId: string): Promise<boolean> {
    try {
      const prefs = await this.getPreferences(userId);
      if (!prefs || !prefs.quiet_hours_start || !prefs.quiet_hours_end) {
        return false;
      }

      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();

      const [startHour, startMin] = prefs.quiet_hours_start.split(':').map(Number);
      const [endHour, endMin] = prefs.quiet_hours_end.split(':').map(Number);

      const startTime = startHour * 60 + startMin;
      const endTime = endHour * 60 + endMin;

      // Handle overnight quiet hours (e.g., 22:00 to 08:00)
      if (startTime > endTime) {
        return currentTime >= startTime || currentTime <= endTime;
      }

      return currentTime >= startTime && currentTime <= endTime;
    } catch (error) {
      console.error('Error checking quiet hours:', error);
      return false;
    }
  }

  /**
   * PROMPT 4: Check if notification type is critical (always send during quiet hours)
   */
  private isCriticalNotification(type: PushNotificationType): boolean {
    const criticalTypes = [
      'BAN_APPLIED',
      'TIMEOUT_APPLIED',
      'APPEAL_APPROVED',
      'APPEAL_DENIED',
      'PAYMENT_FAILED',
    ];
    return criticalTypes.includes(type);
  }

  /**
   * PROMPT 4: Check and update rate limiting
   * Max 5 moderation-related pushes per 30 minutes per user
   */
  private async checkRateLimit(userId: string, type: PushNotificationType): Promise<boolean> {
    try {
      const moderationTypes = [
        'MODERATION_WARNING',
        'TIMEOUT_APPLIED',
        'BAN_APPLIED',
        'BAN_EXPIRED',
        'SAFETY_REMINDER',
      ];

      if (!moderationTypes.includes(type)) {
        return true; // Not a moderation notification, no rate limit
      }

      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

      // Get or create rate limit record
      const { data: rateLimit, error: fetchError } = await supabase
        .from('push_notification_rate_limits')
        .select('*')
        .eq('user_id', userId)
        .eq('notification_type', 'moderation')
        .gte('window_start', thirtyMinutesAgo.toISOString())
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching rate limit:', fetchError);
        return true; // Allow on error
      }

      if (!rateLimit) {
        // Create new rate limit record
        await supabase.from('push_notification_rate_limits').insert({
          user_id: userId,
          notification_type: 'moderation',
          sent_count: 1,
          window_start: new Date().toISOString(),
        });
        return true;
      }

      // Check if limit exceeded
      if (rateLimit.sent_count >= 5) {
        console.log(`⚠️ Rate limit exceeded for user ${userId}`);
        return false;
      }

      // Increment count
      await supabase
        .from('push_notification_rate_limits')
        .update({
          sent_count: rateLimit.sent_count + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', rateLimit.id);

      return true;
    } catch (error) {
      console.error('Error checking rate limit:', error);
      return true; // Allow on error
    }
  }

  /**
   * PROMPT 4: Send batched notification for rate-limited moderation events
   */
  async sendBatchedModerationNotification(userId: string): Promise<void> {
    try {
      await this.sendPushNotification(
        userId,
        'SYSTEM_WARNING',
        'Multiple account updates',
        'Several moderation events occurred. Check your Notifications.',
        { route: 'Notifications' }
      );
    } catch (error) {
      console.error('Error sending batched moderation notification:', error);
    }
  }

  /**
   * PROMPT 1: Core push notification sender
   * Wrap this behind a single backend function: sendPushNotification(userId, type, title, body, payload)
   * 
   * This function:
   * 1. Checks user preferences
   * 2. Checks quiet hours (Prompt 4)
   * 3. Checks rate limiting (Prompt 4)
   * 4. Logs the notification in push_notifications_log
   * 5. Creates an in-app notification in the notifications table
   * 6. Sends the actual push notification via FCM/APNs (via edge function)
   */
  async sendPushNotification(
    userId: string,
    type: PushNotificationType,
    title: string,
    body: string,
    payload?: Record<string, any>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check user preferences
      const prefs = await this.getPreferences(userId);
      if (!prefs) {
        console.log(`No preferences found for user ${userId}, using defaults`);
      }

      // Check if user has disabled this notification type
      if (prefs) {
        if (type === 'ADMIN_ANNOUNCEMENT' && !prefs.admin_announcements) {
          console.log(`User ${userId} has disabled admin announcements`);
          return { success: true }; // Silently skip
        }

        const moderationTypes = ['MODERATION_WARNING', 'TIMEOUT_APPLIED', 'BAN_APPLIED', 'SAFETY_REMINDER'];
        if (moderationTypes.includes(type) && !prefs.safety_moderation_alerts) {
          console.log(`User ${userId} has disabled safety/moderation alerts`);
          return { success: true }; // Silently skip
        }

        if (type === 'STREAM_STARTED' && !prefs.notify_when_followed_goes_live) {
          console.log(`User ${userId} has disabled live stream notifications`);
          return { success: true }; // Silently skip
        }

        if (type === 'GIFT_RECEIVED' && !prefs.gift_received) {
          console.log(`User ${userId} has disabled gift notifications`);
          return { success: true }; // Silently skip
        }

        if (type === 'NEW_FOLLOWER' && !prefs.new_follower) {
          console.log(`User ${userId} has disabled follower notifications`);
          return { success: true }; // Silently skip
        }
      }

      // PROMPT 4: Check quiet hours
      const inQuietHours = await this.isInQuietHours(userId);
      if (inQuietHours && !this.isCriticalNotification(type)) {
        console.log(`User ${userId} is in quiet hours, skipping non-critical notification`);
        // Still create in-app notification
        await this.createInAppNotification(userId, type, title, body, payload);
        return { success: true };
      }

      // PROMPT 4: Check rate limiting
      const withinRateLimit = await this.checkRateLimit(userId, type);
      if (!withinRateLimit) {
        console.log(`Rate limit exceeded for user ${userId}, will batch notifications`);
        // Still create in-app notification
        await this.createInAppNotification(userId, type, title, body, payload);
        return { success: true };
      }

      // Get active device tokens
      const tokens = await this.getActiveDeviceTokens(userId);

      if (tokens.length === 0) {
        console.log(`No active device tokens for user ${userId}`);
        // Still log and create in-app notification
      }

      // Log the push notification
      const { data: logEntry, error: logError } = await supabase
        .from('push_notifications_log')
        .insert({
          user_id: userId,
          type,
          title,
          body,
          payload_json: payload || null,
          delivery_status: tokens.length > 0 ? 'pending' : 'failed',
        })
        .select()
        .single();

      if (logError) {
        console.error('Error logging push notification:', logError);
        return { success: false, error: logError.message };
      }

      // Create in-app notification
      await this.createInAppNotification(userId, type, title, body, payload);

      // Send actual push notification via edge function (if tokens exist)
      if (tokens.length > 0) {
        try {
          const { data, error: edgeError } = await supabase.functions.invoke('send-push-notification', {
            body: {
              userId,
              tokens: tokens.map(t => ({ token: t.device_token, platform: t.platform })),
              notification: {
                title,
                body,
                data: payload || {},
              },
            },
          });

          if (edgeError) {
            console.error('Error sending push notification via edge function:', edgeError);
            // Update log entry to failed
            await supabase
              .from('push_notifications_log')
              .update({ delivery_status: 'failed' })
              .eq('id', logEntry.id);
            
            return { success: false, error: edgeError.message };
          }

          // Update log entry to sent
          await supabase
            .from('push_notifications_log')
            .update({ delivery_status: 'sent' })
            .eq('id', logEntry.id);

          console.log(`📲 Push notification sent to ${tokens.length} devices for user ${userId}`);
        } catch (edgeError: any) {
          console.error('Error invoking edge function:', edgeError);
          // Update log entry to failed
          await supabase
            .from('push_notifications_log')
            .update({ delivery_status: 'failed' })
            .eq('id', logEntry.id);
        }
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error in sendPushNotification:', error);
      return { success: false, error: error.message || 'Failed to send push notification' };
    }
  }

  /**
   * Create in-app notification (mirrors push notification)
   */
  private async createInAppNotification(
    userId: string,
    type: PushNotificationType,
    title: string,
    body: string,
    payload?: Record<string, any>
  ): Promise<void> {
    try {
      // Map push notification types to in-app notification types and categories
      let notificationType: string = 'system_update';
      let category: 'social' | 'gifts' | 'safety' | 'wallet' | 'admin' = 'admin';

      switch (type) {
        case 'MODERATION_WARNING':
        case 'TIMEOUT_APPLIED':
        case 'BAN_APPLIED':
        case 'BAN_EXPIRED':
        case 'SAFETY_REMINDER':
          notificationType = 'warning';
          category = 'safety';
          break;
        case 'APPEAL_RECEIVED':
        case 'APPEAL_APPROVED':
        case 'APPEAL_DENIED':
          notificationType = 'system_update';
          category = 'safety';
          break;
        case 'ADMIN_ANNOUNCEMENT':
        case 'SYSTEM_WARNING':
          notificationType = 'admin_announcement';
          category = 'admin';
          break;
        case 'STREAM_STARTED':
        case 'stream_started':
          notificationType = 'stream_started';
          category = 'social';
          break;
        case 'GIFT_RECEIVED':
        case 'gift_received':
          notificationType = 'gift_received';
          category = 'gifts';
          break;
        case 'NEW_FOLLOWER':
        case 'FOLLOWERS_BATCH':
        case 'new_follower':
          notificationType = 'follow';
          category = 'social';
          break;
        case 'NEW_COMMENT':
        case 'COMMENT_REPLY':
        case 'MENTION':
          notificationType = 'comment';
          category = 'social';
          break;
        case 'PREMIUM_ACTIVATED':
        case 'PREMIUM_RENEWED':
        case 'PREMIUM_EXPIRING':
        case 'PREMIUM_CANCELED':
        case 'PAYMENT_FAILED':
          notificationType = 'subscription_renewed';
          category = 'wallet';
          break;
        case 'VIP_MEMBER_JOINED':
        case 'VIP_CLUB_JOINED':
          notificationType = 'follow';
          category = 'social';
          break;
        case 'MILESTONE_UNLOCKED':
          notificationType = 'system_update';
          category = 'social';
          break;
        case 'new_message':
          notificationType = 'message';
          category = 'social';
          break;
      }

      await supabase.from('notifications').insert({
        type: notificationType,
        sender_id: payload?.sender_id || null,
        receiver_id: userId,
        message: `${title}\n\n${body}`,
        ref_stream_id: payload?.stream_id || payload?.streamId || null,
        ref_post_id: payload?.post_id || payload?.postId || null,
        ref_story_id: payload?.story_id || null,
        category,
        read: false,
      });

      console.log(`✅ In-app notification created for user ${userId}`);
    } catch (error) {
      console.error('Error creating in-app notification:', error);
    }
  }

  /**
   * Get notification preferences for a user
   */
  async getPreferences(userId: string): Promise<NotificationPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching notification preferences:', error);
        return null;
      }

      // If no preferences exist, create default ones
      if (!data) {
        const { data: newData, error: insertError } = await supabase
          .from('notification_preferences')
          .insert({
            user_id: userId,
            stream_started: true,
            moderator_role_updated: true,
            gift_received: true,
            new_follower: true,
            new_message: true,
            safety_moderation_alerts: true,
            admin_announcements: true,
            notify_when_followed_goes_live: true,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating notification preferences:', insertError);
          return null;
        }

        return newData as NotificationPreferences;
      }

      return data as NotificationPreferences;
    } catch (error) {
      console.error('Error in getPreferences:', error);
      return null;
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(
    userId: string,
    preferences: Partial<Omit<NotificationPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) {
        console.error('Error updating notification preferences:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Notification preferences updated successfully');
      return { success: true };
    } catch (error: any) {
      console.error('Error in updatePreferences:', error);
      return { success: false, error: error.message || 'Failed to update preferences' };
    }
  }

  /**
   * Get push notification logs for a user
   */
  async getPushNotificationLogs(
    userId: string,
    limit: number = 50
  ): Promise<PushNotificationLog[]> {
    try {
      const { data, error } = await supabase
        .from('push_notifications_log')
        .select('*')
        .eq('user_id', userId)
        .order('sent_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching push notification logs:', error);
        return [];
      }

      return data as PushNotificationLog[];
    } catch (error) {
      console.error('Error in getPushNotificationLogs:', error);
      return [];
    }
  }

  /**
   * Get all push notification logs (admin only)
   */
  async getAllPushNotificationLogs(
    filters?: {
      type?: PushNotificationType;
      deliveryStatus?: 'pending' | 'sent' | 'failed';
      limit?: number;
    }
  ): Promise<PushNotificationLog[]> {
    try {
      let query = supabase
        .from('push_notifications_log')
        .select('*')
        .order('sent_at', { ascending: false });

      if (filters?.type) {
        query = query.eq('type', filters.type);
      }

      if (filters?.deliveryStatus) {
        query = query.eq('delivery_status', filters.deliveryStatus);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      } else {
        query = query.limit(100);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching all push notification logs:', error);
        return [];
      }

      return data as PushNotificationLog[];
    } catch (error) {
      console.error('Error in getAllPushNotificationLogs:', error);
      return [];
    }
  }

  /**
   * PROMPT 3: Send notification for new follower (with batching)
   */
  async sendNewFollowerNotification(followedUserId: string, followerUserId: string, followerName: string): Promise<void> {
    try {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

      // Check for existing batch
      const { data: batch, error: fetchError } = await supabase
        .from('follower_notification_batch')
        .select('*')
        .eq('user_id', followedUserId)
        .gte('window_start', tenMinutesAgo.toISOString())
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching follower batch:', fetchError);
      }

      if (!batch) {
        // First follower in this window - send individual notification
        await this.sendPushNotification(
          followedUserId,
          'NEW_FOLLOWER',
          'New follower!',
          `${followerName} just followed you.`,
          {
            route: 'Profile',
            userId: followerUserId,
            sender_id: followerUserId,
          }
        );

        // Create batch record
        await supabase.from('follower_notification_batch').insert({
          user_id: followedUserId,
          follower_ids: [followerUserId],
          batch_count: 1,
          window_start: new Date().toISOString(),
        });
      } else {
        // Add to existing batch
        const newFollowerIds = [...(batch.follower_ids || []), followerUserId];
        const newCount = batch.batch_count + 1;

        await supabase
          .from('follower_notification_batch')
          .update({
            follower_ids: newFollowerIds,
            batch_count: newCount,
          })
          .eq('id', batch.id);

        // If > 3 followers, send batched notification
        if (newCount > 3) {
          await this.sendPushNotification(
            followedUserId,
            'FOLLOWERS_BATCH',
            "You're gaining followers!",
            `You gained ${newCount} new followers recently.`,
            {
              route: 'Profile',
              userId: followedUserId,
            }
          );
        }
      }
    } catch (error) {
      console.error('Error sending new follower notification:', error);
    }
  }

  /**
   * PROMPT 1: Send notification when followed creator goes live
   */
  async sendLiveStreamNotification(streamId: string, creatorId: string, creatorName: string): Promise<void> {
    try {
      // Get all followers of the creator
      const { data: followers, error } = await supabase
        .from('followers')
        .select('follower_id')
        .eq('following_id', creatorId);

      if (error) {
        console.error('Error fetching followers:', error);
        return;
      }

      if (!followers || followers.length === 0) {
        console.log(`No followers found for creator ${creatorId}`);
        return;
      }

      // Send notification to each follower
      for (const follower of followers) {
        await this.sendPushNotification(
          follower.follower_id,
          'STREAM_STARTED',
          `${creatorName} is LIVE now!`,
          'Join the stream before it fills up!',
          {
            route: 'LiveStream',
            streamId: streamId,
            stream_id: streamId,
            sender_id: creatorId,
          }
        );
      }

      console.log(`✅ Sent live stream notifications to ${followers.length} followers`);
    } catch (error) {
      console.error('Error sending live stream notifications:', error);
    }
  }

  /**
   * PROMPT 2: Send notification for high-value gift received
   */
  async sendGiftReceivedNotification(
    receiverId: string,
    senderName: string,
    giftName: string,
    giftValue: number,
    giftId: string
  ): Promise<void> {
    try {
      // Check if gift meets threshold (50 kr+)
      if (giftValue < 50) {
        console.log(`Gift value ${giftValue} kr is below threshold, skipping notification`);
        return;
      }

      await this.sendPushNotification(
        receiverId,
        'GIFT_RECEIVED',
        'You received a gift!',
        `${senderName} sent you a ${giftName} worth ${giftValue} kr.`,
        {
          route: 'GiftActivity',
          giftId: giftId,
        }
      );

      console.log(`✅ Sent gift received notification to ${receiverId}`);
    } catch (error) {
      console.error('Error sending gift received notification:', error);
    }
  }

  /**
   * PROMPT 4: Send notification for new comment on post
   */
  async sendNewCommentNotification(
    postOwnerId: string,
    commenterUserId: string,
    commenterName: string,
    postId: string
  ): Promise<void> {
    try {
      // Don't notify if user comments on their own post
      if (postOwnerId === commenterUserId) {
        return;
      }

      await this.sendPushNotification(
        postOwnerId,
        'NEW_COMMENT',
        'New comment',
        `${commenterName} commented on your post.`,
        {
          route: 'CommentsThread',
          postId: postId,
          post_id: postId,
          sender_id: commenterUserId,
        }
      );

      console.log(`✅ Sent new comment notification to ${postOwnerId}`);
    } catch (error) {
      console.error('Error sending new comment notification:', error);
    }
  }

  /**
   * PROMPT 4: Send notification for comment reply
   */
  async sendCommentReplyNotification(
    originalCommenterId: string,
    replierUserId: string,
    replierName: string,
    postId: string
  ): Promise<void> {
    try {
      // Don't notify if user replies to their own comment
      if (originalCommenterId === replierUserId) {
        return;
      }

      await this.sendPushNotification(
        originalCommenterId,
        'COMMENT_REPLY',
        'New reply',
        `${replierName} replied to your comment.`,
        {
          route: 'CommentsThread',
          postId: postId,
          post_id: postId,
          sender_id: replierUserId,
        }
      );

      console.log(`✅ Sent comment reply notification to ${originalCommenterId}`);
    } catch (error) {
      console.error('Error sending comment reply notification:', error);
    }
  }

  /**
   * PROMPT 4: Send notification for @mention
   */
  async sendMentionNotification(
    mentionedUserId: string,
    mentionerUserId: string,
    mentionerName: string,
    postId: string
  ): Promise<void> {
    try {
      // Don't notify if user mentions themselves
      if (mentionedUserId === mentionerUserId) {
        return;
      }

      await this.sendPushNotification(
        mentionedUserId,
        'MENTION',
        'You were mentioned',
        `${mentionerName} tagged you in a comment.`,
        {
          route: 'CommentsThread',
          postId: postId,
          post_id: postId,
          sender_id: mentionerUserId,
        }
      );

      console.log(`✅ Sent mention notification to ${mentionedUserId}`);
    } catch (error) {
      console.error('Error sending mention notification:', error);
    }
  }

  /**
   * PROMPT 5: Send notification for premium subscription activated
   */
  async sendPremiumActivatedNotification(userId: string): Promise<void> {
    try {
      await this.sendPushNotification(
        userId,
        'PREMIUM_ACTIVATED',
        'Premium activated!',
        'Enjoy exclusive benefits!',
        {
          route: 'PremiumDashboard',
        }
      );

      console.log(`✅ Sent premium activated notification to ${userId}`);
    } catch (error) {
      console.error('Error sending premium activated notification:', error);
    }
  }

  /**
   * PROMPT 5: Send notification for premium subscription renewed
   */
  async sendPremiumRenewedNotification(userId: string): Promise<void> {
    try {
      await this.sendPushNotification(
        userId,
        'PREMIUM_RENEWED',
        'Premium renewed',
        'Next billing cycle confirmed.',
        {
          route: 'PremiumDashboard',
        }
      );

      console.log(`✅ Sent premium renewed notification to ${userId}`);
    } catch (error) {
      console.error('Error sending premium renewed notification:', error);
    }
  }

  /**
   * PROMPT 5: Send notification for premium subscription expiring soon
   */
  async sendPremiumExpiringNotification(userId: string): Promise<void> {
    try {
      await this.sendPushNotification(
        userId,
        'PREMIUM_EXPIRING',
        'Premium ending soon',
        'Renew now to keep your badge and features.',
        {
          route: 'PremiumDashboard',
        }
      );

      console.log(`✅ Sent premium expiring notification to ${userId}`);
    } catch (error) {
      console.error('Error sending premium expiring notification:', error);
    }
  }

  /**
   * PROMPT 5: Send notification for premium subscription canceled
   */
  async sendPremiumCanceledNotification(userId: string): Promise<void> {
    try {
      await this.sendPushNotification(
        userId,
        'PREMIUM_CANCELED',
        'Premium canceled',
        'Your subscription has been canceled. You can resubscribe anytime.',
        {
          route: 'PremiumDashboard',
        }
      );

      console.log(`✅ Sent premium canceled notification to ${userId}`);
    } catch (error) {
      console.error('Error sending premium canceled notification:', error);
    }
  }

  /**
   * PROMPT 5: Send notification for payment failed
   */
  async sendPaymentFailedNotification(userId: string): Promise<void> {
    try {
      await this.sendPushNotification(
        userId,
        'PAYMENT_FAILED',
        'Payment Issue',
        'Update payment method to continue Premium.',
        {
          route: 'PremiumDashboard',
        }
      );

      console.log(`✅ Sent payment failed notification to ${userId}`);
    } catch (error) {
      console.error('Error sending payment failed notification:', error);
    }
  }

  /**
   * PROMPT 6: Send notification to creator when someone joins their VIP club
   */
  async sendVIPMemberJoinedNotification(
    creatorId: string,
    memberId: string,
    memberName: string
  ): Promise<void> {
    try {
      await this.sendPushNotification(
        creatorId,
        'VIP_MEMBER_JOINED',
        'New VIP member!',
        `${memberName} joined your community.`,
        {
          route: 'StreamDashboardVipMembers',
          sender_id: memberId,
        }
      );

      console.log(`✅ Sent VIP member joined notification to creator ${creatorId}`);
    } catch (error) {
      console.error('Error sending VIP member joined notification:', error);
    }
  }

  /**
   * PROMPT 6: Send notification to member when they join a VIP club
   */
  async sendVIPClubJoinedNotification(
    memberId: string,
    creatorId: string,
    creatorName: string
  ): Promise<void> {
    try {
      await this.sendPushNotification(
        memberId,
        'VIP_CLUB_JOINED',
        `You joined ${creatorName}'s club!`,
        'You now have exclusive badge & benefits.',
        {
          route: 'Profile',
          userId: creatorId,
          sender_id: creatorId,
        }
      );

      console.log(`✅ Sent VIP club joined notification to member ${memberId}`);
    } catch (error) {
      console.error('Error sending VIP club joined notification:', error);
    }
  }

  /**
   * PROMPT 7: Send notification for milestone unlocked
   */
  async sendMilestoneNotification(
    userId: string,
    milestoneTitle: string,
    milestoneBody: string
  ): Promise<void> {
    try {
      await this.sendPushNotification(
        userId,
        'MILESTONE_UNLOCKED',
        milestoneTitle,
        milestoneBody,
        {
          route: 'AchievementsCenter',
        }
      );

      console.log(`✅ Sent milestone notification to ${userId}`);
    } catch (error) {
      console.error('Error sending milestone notification:', error);
    }
  }

  /**
   * PROMPT 5: Send admin announcement to all users or specific segment
   */
  async sendAdminAnnouncement(
    announcementId: string,
    title: string,
    body: string,
    segmentType: string,
    issuedBy: string
  ): Promise<{ success: boolean; sentCount: number; error?: string }> {
    try {
      // Get users based on segment type
      let userIds: string[] = [];

      switch (segmentType) {
        case 'all_users':
          const { data: allUsers } = await supabase.from('profiles').select('id');
          userIds = allUsers?.map(u => u.id) || [];
          break;

        case 'creators_only':
          // Users who have created at least one stream
          const { data: creators } = await supabase
            .from('streams')
            .select('broadcaster_id')
            .not('broadcaster_id', 'is', null);
          userIds = [...new Set(creators?.map(s => s.broadcaster_id) || [])];
          break;

        case 'premium_only':
          const { data: premiumUsers } = await supabase
            .from('profiles')
            .select('id')
            .eq('premium_active', true);
          userIds = premiumUsers?.map(u => u.id) || [];
          break;

        case 'recently_banned':
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          const { data: bannedUsers } = await supabase
            .from('admin_penalties')
            .select('user_id')
            .eq('is_active', true)
            .gte('issued_at', sevenDaysAgo.toISOString());
          userIds = [...new Set(bannedUsers?.map(b => b.user_id) || [])];
          break;

        case 'heavy_gifters':
          // Users who have sent gifts worth > 500 kr in the last 30 days
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          const { data: gifters } = await supabase
            .from('gift_events')
            .select('sender_user_id, price_sek')
            .gte('created_at', thirtyDaysAgo.toISOString());
          
          const gifterTotals = new Map<string, number>();
          gifters?.forEach(g => {
            const current = gifterTotals.get(g.sender_user_id) || 0;
            gifterTotals.set(g.sender_user_id, current + g.price_sek);
          });
          
          userIds = Array.from(gifterTotals.entries())
            .filter(([_, total]) => total > 500)
            .map(([userId, _]) => userId);
          break;

        case 'new_users':
          const sevenDaysAgoNew = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          const { data: newUsers } = await supabase
            .from('profiles')
            .select('id')
            .gte('created_at', sevenDaysAgoNew.toISOString());
          userIds = newUsers?.map(u => u.id) || [];
          break;

        default:
          console.error(`Unknown segment type: ${segmentType}`);
          return { success: false, sentCount: 0, error: 'Unknown segment type' };
      }

      console.log(`Sending announcement to ${userIds.length} users in segment ${segmentType}`);

      // Send notification to each user
      let sentCount = 0;
      for (const userId of userIds) {
        const result = await this.sendPushNotification(
          userId,
          'ADMIN_ANNOUNCEMENT',
          'Roast Live Update',
          body.substring(0, 80) + (body.length > 80 ? '...' : ''),
          {
            route: 'Notifications',
            announcementId: announcementId,
          }
        );

        if (result.success) {
          sentCount++;
        }
      }

      // Update announcement as sent
      await supabase
        .from('admin_announcements')
        .update({ sent_at: new Date().toISOString() })
        .eq('id', announcementId);

      console.log(`✅ Sent admin announcement to ${sentCount}/${userIds.length} users`);
      return { success: true, sentCount };
    } catch (error: any) {
      console.error('Error sending admin announcement:', error);
      return { success: false, sentCount: 0, error: error.message };
    }
  }
}

export const pushNotificationService = new PushNotificationService();