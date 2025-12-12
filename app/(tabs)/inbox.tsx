
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Modal,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { notificationService, NotificationCategory } from '@/app/services/notificationService';

interface Notification {
  id: string;
  type: string;
  message: string;
  category: NotificationCategory;
  read: boolean;
  created_at: string;
  sender?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
  };
  ref_post_id?: string;
  ref_story_id?: string;
  ref_stream_id?: string;
}

const CATEGORY_CONFIG = {
  social: {
    title: '🔔 Social',
    icon: 'person.2.fill' as const,
    androidIcon: 'people' as const,
  },
  gifts: {
    title: '🎁 Gifts',
    icon: 'gift.fill' as const,
    androidIcon: 'card_giftcard' as const,
  },
  safety: {
    title: '🛡️ Safety',
    icon: 'shield.fill' as const,
    androidIcon: 'security' as const,
  },
  wallet: {
    title: '💰 Wallet & Earnings',
    icon: 'dollarsign.circle.fill' as const,
    androidIcon: 'account_balance_wallet' as const,
  },
  admin: {
    title: '📢 Admin & System',
    icon: 'megaphone.fill' as const,
    androidIcon: 'campaign' as const,
  },
};

export default function InboxScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory | 'all'>('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const category = selectedCategory === 'all' ? undefined : selectedCategory;
      const result = await notificationService.getNotificationsByCategory(user.id, category);
      
      if (result.success && result.notifications) {
        setNotifications(result.notifications as Notification[]);
      }

      const counts: Record<string, number> = {};
      for (const cat of Object.keys(CATEGORY_CONFIG)) {
        const countResult = await notificationService.getUnreadCountByCategory(
          user.id,
          cat as NotificationCategory
        );
        if (countResult.success) {
          counts[cat] = countResult.count;
        }
      }
      setUnreadCounts(counts);
    } catch (error) {
      console.error('Error in fetchNotifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, selectedCategory]);

  useEffect(() => {
    let mounted = true;

    if (!user) {
      router.replace('/auth/login');
    } else if (mounted) {
      fetchNotifications();
      
      const interval = setInterval(() => {
        if (mounted) {
          fetchNotifications();
        }
      }, 10000);
      
      return () => {
        mounted = false;
        clearInterval(interval);
      };
    }

    return () => {
      mounted = false;
    };
  }, [user, fetchNotifications]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAllAsRead = useCallback(async () => {
    if (!user) return;

    const category = selectedCategory === 'all' ? undefined : selectedCategory;
    await notificationService.markAllAsRead(user.id, category);
    fetchNotifications();
  }, [user, selectedCategory, fetchNotifications]);

  const handleNotificationPress = useCallback(async (notification: Notification) => {
    await notificationService.markAsRead(notification.id);

    // If it's an admin announcement or system update, show in modal
    if (notification.type === 'admin_announcement' || notification.type === 'system_update') {
      setSelectedNotification(notification);
      setModalVisible(true);
      fetchNotifications();
      return;
    }

    // Otherwise navigate to the relevant screen
    if (notification.ref_post_id) {
      router.push(`/screens/PostDetailScreen?postId=${notification.ref_post_id}`);
    } else if (notification.ref_story_id) {
      router.push(`/screens/StoryViewerScreen?storyId=${notification.ref_story_id}`);
    } else if (notification.ref_stream_id) {
      router.push(`/live-player?streamId=${notification.ref_stream_id}`);
    } else if (notification.sender) {
      router.push(`/screens/PublicProfileScreen?userId=${notification.sender.id}`);
    }

    fetchNotifications();
  }, [fetchNotifications]);

  const formatTime = useCallback((timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  }, []);

  const getNotificationIcon = useCallback((type: string) => {
    switch (type) {
      case 'like':
        return { ios: 'heart.fill', android: 'favorite' };
      case 'comment':
        return { ios: 'bubble.left.fill', android: 'comment' };
      case 'follow':
        return { ios: 'person.badge.plus.fill', android: 'person_add' };
      case 'gift_received':
        return { ios: 'gift.fill', android: 'card_giftcard' };
      case 'payout_completed':
        return { ios: 'checkmark.circle.fill', android: 'check_circle' };
      case 'warning':
      case 'timeout_ended':
      case 'ban_lifted':
        return { ios: 'exclamationmark.triangle.fill', android: 'warning' };
      case 'admin_announcement':
      case 'system_update':
        return { ios: 'megaphone.fill', android: 'campaign' };
      default:
        return { ios: 'bell.fill', android: 'notifications' };
    }
  }, []);

  const totalUnread = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Inbox & Notifications</Text>
          {totalUnread > 0 && (
            <TouchableOpacity
              style={[styles.markAllButton, { backgroundColor: colors.brandPrimary || '#A40028' }]}
              onPress={handleMarkAllAsRead}
              activeOpacity={0.7}
            >
              <Text style={styles.markAllText}>Mark All Read</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryScrollContent}
        >
          <TouchableOpacity
            key="all"
            style={[
              styles.categoryChip,
              {
                backgroundColor: selectedCategory === 'all' ? (colors.brandPrimary || '#A40028') : colors.backgroundAlt,
              },
            ]}
            onPress={() => setSelectedCategory('all')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.categoryChipText,
                { color: selectedCategory === 'all' ? '#FFFFFF' : colors.text },
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.categoryChip,
                {
                  backgroundColor:
                    selectedCategory === key ? (colors.brandPrimary || '#A40028') : colors.backgroundAlt,
                },
              ]}
              onPress={() => setSelectedCategory(key as NotificationCategory)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  { color: selectedCategory === key ? '#FFFFFF' : colors.text },
                ]}
              >
                {config.title}
              </Text>
              {unreadCounts[key] > 0 && (
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>
                    {unreadCounts[key] > 99 ? '99+' : unreadCounts[key]}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={colors.brandPrimary || '#A40028'}
            colors={[colors.brandPrimary || '#A40028']}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.centerContent}>
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading notifications...
            </Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="bell.slash"
              android_material_icon_name="notifications_off"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={[styles.emptyText, { color: colors.text }]}>No notifications yet</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              You&apos;ll see notifications here when you get likes, comments, and more
            </Text>
          </View>
        ) : (
          notifications.map((notification, index) => {
            const icon = getNotificationIcon(notification.type);
            return (
              <TouchableOpacity
                key={`notification-${notification.id}-${index}`}
                style={[
                  styles.notificationCard,
                  {
                    backgroundColor: notification.read ? colors.background : colors.backgroundAlt,
                    borderBottomColor: colors.border,
                  },
                ]}
                onPress={() => handleNotificationPress(notification)}
                activeOpacity={0.7}
              >
                {notification.sender?.avatar_url ? (
                  <Image
                    source={{ uri: notification.sender.avatar_url }}
                    style={[styles.avatar, { backgroundColor: colors.card }]}
                  />
                ) : (
                  <View style={[styles.iconContainer, { backgroundColor: colors.card }]}>
                    <IconSymbol
                      ios_icon_name={icon.ios}
                      android_material_icon_name={icon.android}
                      size={24}
                      color={colors.brandPrimary || '#A40028'}
                    />
                  </View>
                )}

                <View style={styles.notificationContent}>
                  <View style={styles.notificationHeader}>
                    <Text style={[styles.notificationText, { color: colors.text }]} numberOfLines={2}>
                      {notification.sender?.display_name || notification.sender?.username || 'System'}{' '}
                      {notification.message}
                    </Text>
                    {!notification.read && (
                      <View style={[styles.unreadDot, { backgroundColor: colors.brandPrimary || '#A40028' }]} />
                    )}
                  </View>
                  <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
                    {formatTime(notification.created_at)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Announcement Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={[styles.modalContent, { backgroundColor: colors.card }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <IconSymbol
                ios_icon_name="megaphone.fill"
                android_material_icon_name="campaign"
                size={32}
                color={colors.brandPrimary || '#A40028'}
              />
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {selectedNotification?.type === 'admin_announcement' ? 'Admin Announcement' : 'System Update'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <IconSymbol
                  ios_icon_name="xmark.circle.fill"
                  android_material_icon_name="cancel"
                  size={28}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={[styles.modalMessage, { color: colors.text }]}>
                {selectedNotification?.message}
              </Text>
              <Text style={[styles.modalTimestamp, { color: colors.textSecondary }]}>
                {selectedNotification && formatTime(selectedNotification.created_at)}
              </Text>
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.brandPrimary || '#A40028' }]}
              onPress={() => setModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalButtonText}>Got it</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
  },
  markAllButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  categoryScroll: {
    marginHorizontal: -20,
  },
  categoryScrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A40028',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '400',
    marginTop: 8,
    textAlign: 'center',
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
    gap: 4,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  notificationText: {
    fontSize: 14,
    fontWeight: '400',
    flex: 1,
    lineHeight: 20,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  timestamp: {
    fontSize: 12,
    fontWeight: '400',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    marginBottom: 20,
  },
  modalMessage: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  modalTimestamp: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  modalButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
