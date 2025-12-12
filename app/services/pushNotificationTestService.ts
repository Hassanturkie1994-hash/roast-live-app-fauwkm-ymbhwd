
import { pushNotificationService } from './pushNotificationService';

/**
 * Push Notification Test Service
 * 
 * Utility service for testing push notifications in development.
 * Use this to test different notification types and scenarios.
 */

class PushNotificationTestService {
  /**
   * Send a test notification of each type
   */
  async sendAllTestNotifications(userId: string): Promise<void> {
    const notifications = [
      {
        type: 'SYSTEM_WARNING' as const,
        title: 'System Warning',
        body: 'This is a test system warning notification.',
      },
      {
        type: 'MODERATION_WARNING' as const,
        title: 'Moderation Warning',
        body: 'This is a test moderation warning notification.',
      },
      {
        type: 'TIMEOUT_APPLIED' as const,
        title: 'Timeout Applied',
        body: 'This is a test timeout notification.',
      },
      {
        type: 'BAN_APPLIED' as const,
        title: 'Ban Applied',
        body: 'This is a test ban notification.',
      },
      {
        type: 'BAN_EXPIRED' as const,
        title: 'Ban Expired',
        body: 'This is a test ban expiration notification.',
      },
      {
        type: 'APPEAL_RECEIVED' as const,
        title: 'Appeal Received',
        body: 'This is a test appeal received notification.',
      },
      {
        type: 'APPEAL_APPROVED' as const,
        title: 'Appeal Approved',
        body: 'This is a test appeal approved notification.',
      },
      {
        type: 'APPEAL_DENIED' as const,
        title: 'Appeal Denied',
        body: 'This is a test appeal denied notification.',
      },
      {
        type: 'ADMIN_ANNOUNCEMENT' as const,
        title: 'Admin Announcement',
        body: 'This is a test admin announcement notification.',
      },
      {
        type: 'SAFETY_REMINDER' as const,
        title: 'Safety Reminder',
        body: 'This is a test safety reminder notification.',
      },
    ];

    console.log(`📲 Sending ${notifications.length} test notifications...`);

    for (const notification of notifications) {
      await pushNotificationService.sendPushNotification(
        userId,
        notification.type,
        notification.title,
        notification.body,
        { test: true, timestamp: new Date().toISOString() }
      );

      // Wait 1 second between notifications to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('✅ All test notifications sent');
  }

  /**
   * Test moderation warning notification
   */
  async testModerationWarning(userId: string): Promise<void> {
    await pushNotificationService.sendPushNotification(
      userId,
      'MODERATION_WARNING',
      'Your message was moderated',
      'One of your messages was hidden for breaking the rules.',
      { 
        test: true,
        stream_id: 'test-stream-123',
        message: 'Test message content'
      }
    );
    console.log('✅ Moderation warning test sent');
  }

  /**
   * Test timeout notification
   */
  async testTimeoutNotification(userId: string, durationMinutes: number = 10): Promise<void> {
    await pushNotificationService.sendPushNotification(
      userId,
      'TIMEOUT_APPLIED',
      'You\'ve been timed out',
      `You cannot participate in chat for ${durationMinutes} minutes due to rule violations.`,
      { 
        test: true,
        duration_minutes: durationMinutes,
        stream_id: 'test-stream-123'
      }
    );
    console.log(`✅ Timeout notification test sent (${durationMinutes} minutes)`);
  }

  /**
   * Test ban notification
   */
  async testBanNotification(userId: string): Promise<void> {
    await pushNotificationService.sendPushNotification(
      userId,
      'BAN_APPLIED',
      'You were banned from a livestream',
      'You can no longer join this creator\'s lives due to repeated violations.',
      { 
        test: true,
        stream_id: 'test-stream-123',
        creator_id: 'test-creator-123'
      }
    );
    console.log('✅ Ban notification test sent');
  }

  /**
   * Test ban expiration notification
   */
  async testBanExpirationNotification(userId: string): Promise<void> {
    await pushNotificationService.sendPushNotification(
      userId,
      'BAN_EXPIRED',
      'Your restriction has ended',
      'You can now interact again. Please follow the community rules.',
      { 
        test: true,
        penalty_id: 'test-penalty-123'
      }
    );
    console.log('✅ Ban expiration notification test sent');
  }

  /**
   * Test appeal received notification
   */
  async testAppealReceivedNotification(userId: string): Promise<void> {
    await pushNotificationService.sendPushNotification(
      userId,
      'APPEAL_RECEIVED',
      'We received your appeal',
      'Our team will review your case and notify you when it\'s resolved.',
      { 
        test: true,
        penalty_id: 'test-penalty-123'
      }
    );
    console.log('✅ Appeal received notification test sent');
  }

  /**
   * Test appeal approved notification with deep link
   */
  async testAppealApprovedNotification(userId: string): Promise<void> {
    await pushNotificationService.sendPushNotification(
      userId,
      'APPEAL_APPROVED',
      'Your appeal was approved',
      'A penalty on your account has been removed. Check details in your Notifications.',
      { 
        test: true,
        route: 'AppealDetails',
        appealId: 'test-appeal-123',
        penalty_id: 'test-penalty-123'
      }
    );
    console.log('✅ Appeal approved notification test sent (with deep link)');
  }

  /**
   * Test appeal denied notification with deep link
   */
  async testAppealDeniedNotification(userId: string): Promise<void> {
    await pushNotificationService.sendPushNotification(
      userId,
      'APPEAL_DENIED',
      'Your appeal was denied',
      'The original decision stands. See more details in your Notifications.',
      { 
        test: true,
        route: 'AppealDetails',
        appealId: 'test-appeal-123'
      }
    );
    console.log('✅ Appeal denied notification test sent (with deep link)');
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(userId: string): Promise<{
    total: number;
    sent: number;
    failed: number;
    pending: number;
    successRate: number;
    byType: Record<string, number>;
  }> {
    const logs = await pushNotificationService.getPushNotificationLogs(userId, 1000);

    const total = logs.length;
    const sent = logs.filter(log => log.delivery_status === 'sent').length;
    const failed = logs.filter(log => log.delivery_status === 'failed').length;
    const pending = logs.filter(log => log.delivery_status === 'pending').length;
    const successRate = total > 0 ? (sent / total) * 100 : 0;

    const byType: Record<string, number> = {};
    logs.forEach(log => {
      byType[log.type] = (byType[log.type] || 0) + 1;
    });

    return {
      total,
      sent,
      failed,
      pending,
      successRate,
      byType,
    };
  }

  /**
   * Print notification statistics
   */
  async printNotificationStats(userId: string): Promise<void> {
    const stats = await this.getNotificationStats(userId);

    console.log('📊 Push Notification Statistics');
    console.log('================================');
    console.log(`Total: ${stats.total}`);
    console.log(`Sent: ${stats.sent}`);
    console.log(`Failed: ${stats.failed}`);
    console.log(`Pending: ${stats.pending}`);
    console.log(`Success Rate: ${stats.successRate.toFixed(2)}%`);
    console.log('\nBy Type:');
    Object.entries(stats.byType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
  }

  /**
   * Verify device token is registered
   */
  async verifyTokenRegistration(userId: string): Promise<{
    registered: boolean;
    tokenCount: number;
    platforms: string[];
  }> {
    const tokens = await pushNotificationService.getActiveDeviceTokens(userId);

    return {
      registered: tokens.length > 0,
      tokenCount: tokens.length,
      platforms: tokens.map(t => t.platform),
    };
  }

  /**
   * Print device token info
   */
  async printTokenInfo(userId: string): Promise<void> {
    const info = await this.verifyTokenRegistration(userId);

    console.log('📱 Device Token Information');
    console.log('===========================');
    console.log(`Registered: ${info.registered ? 'Yes' : 'No'}`);
    console.log(`Token Count: ${info.tokenCount}`);
    console.log(`Platforms: ${info.platforms.join(', ')}`);
  }
}

export const pushNotificationTestService = new PushNotificationTestService();