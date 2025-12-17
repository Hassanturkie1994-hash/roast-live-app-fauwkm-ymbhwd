
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
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { notificationService, NotificationCategory } from '@/app/services/notificationService';
import { privateMessagingService, ConversationWithUser, MessageRequest } from '@/app/services/privateMessagingService';
import { unifiedVIPClubService } from '@/app/services/unifiedVIPClubService';
import { supabase } from '@/app/integrations/supabase/client';

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

interface VIPClubConversation {
  id: string;
  club_id: string;
  club_name: string;
  creator_id: string;
  badge_color: string;
  unread_count: number;
  last_message: string | null;
  last_message_at: string | null;
}

interface FollowedUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
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
    androidIcon: 'gift' as const,
  },
  safety: {
    title: '🛡️ Safety',
    icon: 'shield.fill' as const,
    androidIcon: 'shield' as const,
  },
  wallet: {
    title: '💰 Wallet & Earnings',
    icon: 'dollarsign.circle.fill' as const,
    androidIcon: 'wallet' as const,
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
  const [activeSection, setActiveSection] = useState<'all' | 'notifications' | 'messages' | 'vip'>('all');
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory | 'all'>('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [conversations, setConversations] = useState<ConversationWithUser[]>([]);
  const [messageRequests, setMessageRequests] = useState<(MessageRequest & { requester: any })[]>([]);
  const [vipClubConversations, setVipClubConversations] = useState<VIPClubConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [showStartConversation, setShowStartConversation] = useState(false);
  const [followedUsers, setFollowedUsers] = useState<FollowedUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

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

  const fetchConversations = useCallback(async () => {
    if (!user) return;

    try {
      const convs = await privateMessagingService.getUserConversations(user.id);
      setConversations(convs);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  }, [user]);

  const fetchMessageRequests = useCallback(async () => {
    if (!user) return;

    try {
      const requests = await privateMessagingService.getMessageRequests(user.id);
      setMessageRequests(requests);
    } catch (error) {
      console.error('Error fetching message requests:', error);
    }
  }, [user]);

  const fetchVIPClubConversations = useCallback(async () => {
    if (!user) return;

    try {
      const memberships = await unifiedVIPClubService.getUserVIPMemberships(user.id);
      
      const vipConvs: VIPClubConversation[] = await Promise.all(
        memberships.map(async (membership) => {
          const messages = await unifiedVIPClubService.getVIPClubChatMessages(membership.club_id, 1);
          const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;

          return {
            id: membership.club_id,
            club_id: membership.club_id,
            club_name: membership.club.club_name,
            creator_id: membership.club.creator_id,
            badge_color: membership.club.badge_color,
            unread_count: 0,
            last_message: lastMessage?.message || null,
            last_message_at: lastMessage?.created_at || null,
          };
        })
      );

      setVipClubConversations(vipConvs);
    } catch (error) {
      console.error('Error fetching VIP club conversations:', error);
    }
  }, [user]);

  const fetchFollowedUsers = useCallback(async (query?: string) => {
    if (!user) return;

    setSearchLoading(true);
    try {
      const users = await privateMessagingService.getFollowedUsers(user.id, query);
      setFollowedUsers(users);
    } catch (error) {
      console.error('Error fetching followed users:', error);
    } finally {
      setSearchLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let mounted = true;

    if (!user) {
      router.replace('/auth/login');
    } else if (mounted) {
      if (activeSection === 'all' || activeSection === 'notifications') {
        fetchNotifications();
      }
      if (activeSection === 'all' || activeSection === 'messages') {
        fetchConversations();
        fetchMessageRequests();
      }
      if (activeSection === 'all' || activeSection === 'vip') {
        fetchVIPClubConversations();
      }
      
      const interval = setInterval(() => {
        if (mounted) {
          if (activeSection === 'all' || activeSection === 'notifications') {
            fetchNotifications();
          }
          if (activeSection === 'all' || activeSection === 'messages') {
            fetchConversations();
            fetchMessageRequests();
          }
          if (activeSection === 'all' || activeSection === 'vip') {
            fetchVIPClubConversations();
          }
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
  }, [user, activeSection, fetchNotifications, fetchConversations, fetchMessageRequests, fetchVIPClubConversations]);

  // Debounced search for followed users
  useEffect(() => {
    if (!showStartConversation) return;

    const timer = setTimeout(() => {
      fetchFollowedUsers(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, showStartConversation, fetchFollowedUsers]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (activeSection === 'all' || activeSection === 'notifications') {
      fetchNotifications();
    }
    if (activeSection === 'all' || activeSection === 'messages') {
      fetchConversations();
      fetchMessageRequests();
    }
    if (activeSection === 'all' || activeSection === 'vip') {
      fetchVIPClubConversations();
    }
  }, [activeSection, fetchNotifications, fetchConversations, fetchMessageRequests, fetchVIPClubConversations]);

  const handleMarkAllAsRead = useCallback(async () => {
    if (!user) return;

    const category = selectedCategory === 'all' ? undefined : selectedCategory;
    await notificationService.markAllAsRead(user.id, category);
    fetchNotifications();
  }, [user, selectedCategory, fetchNotifications]);

  const handleNotificationPress = useCallback(async (notification: Notification) => {
    await notificationService.markAsRead(notification.id);

    if (notification.type === 'admin_announcement' || notification.type === 'system_update') {
      setSelectedNotification(notification);
      setModalVisible(true);
      fetchNotifications();
      return;
    }

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

  const handleConversationPress = useCallback((conversation: ConversationWithUser) => {
    router.push({
      pathname: '/screens/ChatScreen',
      params: {
        conversationId: conversation.id,
        otherUserId: conversation.other_user.id,
        otherUserName: conversation.other_user.display_name || conversation.other_user.username,
      },
    });
  }, []);

  const handleMessageRequestPress = useCallback((request: MessageRequest & { requester: any }) => {
    router.push({
      pathname: '/screens/ChatScreen',
      params: {
        conversationId: request.conversation_id,
        otherUserId: request.requester_id,
        otherUserName: request.requester.display_name || request.requester.username,
      },
    });
  }, []);

  const handleVIPClubPress = useCallback((vipConv: VIPClubConversation) => {
    router.push({
      pathname: '/screens/VIPClubChatScreen',
      params: {
        clubId: vipConv.club_id,
        clubName: vipConv.club_name,
        creatorId: vipConv.creator_id,
      },
    });
  }, []);

  const handleStartConversation = useCallback(() => {
    setSearchQuery('');
    fetchFollowedUsers();
    setShowStartConversation(true);
  }, [fetchFollowedUsers]);

  const handleSelectUser = useCallback(async (selectedUser: FollowedUser) => {
    if (!user) return;

    try {
      const result = await privateMessagingService.getOrCreateConversation(user.id, selectedUser.id);
      
      if (result.conversation) {
        setShowStartConversation(false);
        setSearchQuery('');
        router.push({
          pathname: '/screens/ChatScreen',
          params: {
            conversationId: result.conversation.id,
            otherUserId: selectedUser.id,
            otherUserName: selectedUser.display_name || selectedUser.username,
          },
        });
      } else {
        Alert.alert('Error', 'Failed to start conversation');
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      Alert.alert('Error', 'Failed to start conversation');
    }
  }, [user]);

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
        return { ios: 'heart.fill', android: 'favorite' as const };
      case 'comment':
        return { ios: 'bubble.left.fill', android: 'comment' as const };
      case 'follow':
        return { ios: 'person.badge.plus.fill', android: 'person_add' as const };
      case 'gift_received':
        return { ios: 'gift.fill', android: 'card_giftcard' as const };
      case 'payout_completed':
        return { ios: 'checkmark.circle.fill', android: 'check_circle' as const };
      case 'warning':
      case 'timeout_ended':
      case 'ban_lifted':
        return { ios: 'exclamationmark.triangle.fill', android: 'warning' as const };
      case 'admin_announcement':
      case 'system_update':
        return { ios: 'megaphone.fill', android: 'campaign' as const };
      default:
        return { ios: 'bell.fill', android: 'notifications' as const };
    }
  }, []);

  const totalUnread = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
  const totalConversationUnread = conversations.reduce((sum, conv) => sum + conv.unread_count, 0);
  const totalMessageRequests = messageRequests.length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Inbox</Text>
      </View>

      {/* Section Tabs - Added "All" */}
      <View style={[styles.sectionTabs, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.sectionTab,
            activeSection === 'all' && { borderBottomColor: colors.brandPrimary },
          ]}
          onPress={() => setActiveSection('all')}
          activeOpacity={0.7}
        >
          <IconSymbol
            ios_icon_name="tray.fill"
            android_material_icon_name="inbox"
            size={20}
            color={activeSection === 'all' ? colors.brandPrimary : colors.textSecondary}
          />
          <Text
            style={[
              styles.sectionTabText,
              { color: activeSection === 'all' ? colors.brandPrimary : colors.textSecondary },
            ]}
          >
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.sectionTab,
            activeSection === 'notifications' && { borderBottomColor: colors.brandPrimary },
          ]}
          onPress={() => setActiveSection('notifications')}
          activeOpacity={0.7}
        >
          <IconSymbol
            ios_icon_name="bell.fill"
            android_material_icon_name="notifications"
            size={20}
            color={activeSection === 'notifications' ? colors.brandPrimary : colors.textSecondary}
          />
          <Text
            style={[
              styles.sectionTabText,
              { color: activeSection === 'notifications' ? colors.brandPrimary : colors.textSecondary },
            ]}
          >
            Notifications
          </Text>
          {totalUnread > 0 && (
            <View style={[styles.sectionBadge, { backgroundColor: colors.brandPrimary }]}>
              <Text style={styles.sectionBadgeText}>{totalUnread > 99 ? '99+' : totalUnread}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.sectionTab,
            activeSection === 'messages' && { borderBottomColor: colors.brandPrimary },
          ]}
          onPress={() => setActiveSection('messages')}
          activeOpacity={0.7}
        >
          <IconSymbol
            ios_icon_name="bubble.left.and.bubble.right.fill"
            android_material_icon_name="chat"
            size={20}
            color={activeSection === 'messages' ? colors.brandPrimary : colors.textSecondary}
          />
          <Text
            style={[
              styles.sectionTabText,
              { color: activeSection === 'messages' ? colors.brandPrimary : colors.textSecondary },
            ]}
          >
            Messages
          </Text>
          {(totalConversationUnread > 0 || totalMessageRequests > 0) && (
            <View style={[styles.sectionBadge, { backgroundColor: colors.brandPrimary }]}>
              <Text style={styles.sectionBadgeText}>
                {(totalConversationUnread + totalMessageRequests) > 99 ? '99+' : (totalConversationUnread + totalMessageRequests)}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.sectionTab,
            activeSection === 'vip' && { borderBottomColor: colors.brandPrimary },
          ]}
          onPress={() => setActiveSection('vip')}
          activeOpacity={0.7}
        >
          <IconSymbol
            ios_icon_name="crown.fill"
            android_material_icon_name="workspace_premium"
            size={20}
            color={activeSection === 'vip' ? '#FFD700' : colors.textSecondary}
          />
          <Text
            style={[
              styles.sectionTabText,
              { color: activeSection === 'vip' ? colors.brandPrimary : colors.textSecondary },
            ]}
          >
            VIP Clubs
          </Text>
        </TouchableOpacity>
      </View>

      {/* All Section - Combined View */}
      {activeSection === 'all' && (
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
          {/* Message Requests */}
          {messageRequests.length > 0 && (
            <View style={styles.allSection}>
              <Text style={[styles.allSectionTitle, { color: colors.text }]}>Message Requests</Text>
              {messageRequests.map((request) => (
                <TouchableOpacity
                  key={`request-${request.id}`}
                  style={[styles.requestCard, { backgroundColor: colors.backgroundAlt, borderBottomColor: colors.border }]}
                  onPress={() => handleMessageRequestPress(request)}
                  activeOpacity={0.7}
                >
                  <View style={styles.avatarContainer}>
                    {request.requester.avatar_url ? (
                      <Image source={{ uri: request.requester.avatar_url }} style={styles.avatar} />
                    ) : (
                      <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.card }]}>
                        <IconSymbol
                          ios_icon_name="person.fill"
                          android_material_icon_name="person"
                          size={24}
                          color={colors.textSecondary}
                        />
                      </View>
                    )}
                    <View style={[styles.requestBadge, { backgroundColor: colors.brandPrimary }]}>
                      <IconSymbol
                        ios_icon_name="envelope.fill"
                        android_material_icon_name="mail"
                        size={12}
                        color="#FFFFFF"
                      />
                    </View>
                  </View>

                  <View style={styles.conversationContent}>
                    <Text style={[styles.conversationName, { color: colors.text }]} numberOfLines={1}>
                      {request.requester.display_name || request.requester.username}
                    </Text>
                    <Text style={[styles.requestText, { color: colors.textSecondary }]}>
                      Wants to send you a message
                    </Text>
                  </View>

                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="chevron_right"
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Recent Notifications */}
          {notifications.length > 0 && (
            <View style={styles.allSection}>
              <Text style={[styles.allSectionTitle, { color: colors.text }]}>Recent Notifications</Text>
              {notifications.slice(0, 3).map((notification) => {
                const icon = getNotificationIcon(notification.type);
                return (
                  <TouchableOpacity
                    key={`all-notification-${notification.id}`}
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
              })}
              {notifications.length > 3 && (
                <TouchableOpacity
                  style={styles.viewAllButton}
                  onPress={() => setActiveSection('notifications')}
                >
                  <Text style={[styles.viewAllText, { color: colors.brandPrimary }]}>View all notifications</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Recent Messages */}
          {conversations.length > 0 && (
            <View style={styles.allSection}>
              <Text style={[styles.allSectionTitle, { color: colors.text }]}>Recent Messages</Text>
              {conversations.slice(0, 3).map((item) => (
                <TouchableOpacity
                  key={`all-conversation-${item.id}`}
                  style={[styles.conversationCard, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
                  onPress={() => handleConversationPress(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.avatarContainer}>
                    {item.other_user.avatar_url ? (
                      <Image source={{ uri: item.other_user.avatar_url }} style={styles.avatar} />
                    ) : (
                      <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.backgroundAlt }]}>
                        <IconSymbol
                          ios_icon_name="person.fill"
                          android_material_icon_name="person"
                          size={24}
                          color={colors.textSecondary}
                        />
                      </View>
                    )}
                    {item.unread_count > 0 && (
                      <View style={[styles.unreadBadge, { backgroundColor: colors.brandPrimary }]}>
                        <Text style={styles.unreadBadgeText}>{item.unread_count}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.conversationContent}>
                    <View style={styles.conversationHeader}>
                      <Text style={[styles.conversationName, { color: colors.text }]} numberOfLines={1}>
                        {item.other_user.display_name || item.other_user.username}
                      </Text>
                      {item.last_message && (
                        <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
                          {formatTime(item.last_message.created_at)}
                        </Text>
                      )}
                    </View>
                    {item.last_message ? (
                      <Text
                        style={[
                          styles.lastMessage,
                          { color: item.unread_count > 0 ? colors.text : colors.textSecondary },
                          item.unread_count > 0 && styles.unreadMessage,
                        ]}
                        numberOfLines={1}
                      >
                        {item.last_message.content}
                      </Text>
                    ) : (
                      <Text style={[styles.noMessages, { color: colors.textSecondary }]}>No messages yet</Text>
                    )}
                  </View>

                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="chevron_right"
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              ))}
              {conversations.length > 3 && (
                <TouchableOpacity
                  style={styles.viewAllButton}
                  onPress={() => setActiveSection('messages')}
                >
                  <Text style={[styles.viewAllText, { color: colors.brandPrimary }]}>View all messages</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* VIP Clubs */}
          {vipClubConversations.length > 0 && (
            <View style={styles.allSection}>
              <Text style={[styles.allSectionTitle, { color: colors.text }]}>VIP Clubs</Text>
              {vipClubConversations.slice(0, 3).map((item) => (
                <TouchableOpacity
                  key={`all-vip-${item.id}`}
                  style={[styles.vipClubCard, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
                  onPress={() => handleVIPClubPress(item)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.vipClubIcon, { backgroundColor: item.badge_color }]}>
                    <IconSymbol
                      ios_icon_name="crown.fill"
                      android_material_icon_name="workspace_premium"
                      size={24}
                      color="#FFFFFF"
                    />
                  </View>

                  <View style={styles.vipClubContent}>
                    <View style={styles.vipClubHeader}>
                      <Text style={[styles.vipClubName, { color: colors.text }]} numberOfLines={1}>
                        {item.club_name}
                      </Text>
                      {item.last_message_at && (
                        <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
                          {formatTime(item.last_message_at)}
                        </Text>
                      )}
                    </View>
                    {item.last_message ? (
                      <Text style={[styles.lastMessage, { color: colors.textSecondary }]} numberOfLines={1}>
                        {item.last_message}
                      </Text>
                    ) : (
                      <Text style={[styles.noMessages, { color: colors.textSecondary }]}>No messages yet</Text>
                    )}
                  </View>

                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="chevron_right"
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              ))}
              {vipClubConversations.length > 3 && (
                <TouchableOpacity
                  style={styles.viewAllButton}
                  onPress={() => setActiveSection('vip')}
                >
                  <Text style={[styles.viewAllText, { color: colors.brandPrimary }]}>View all VIP clubs</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {notifications.length === 0 && conversations.length === 0 && vipClubConversations.length === 0 && messageRequests.length === 0 && (
            <View style={styles.emptyState}>
              <IconSymbol
                ios_icon_name="tray"
                android_material_icon_name="inbox"
                size={64}
                color={colors.textSecondary}
              />
              <Text style={[styles.emptyText, { color: colors.text }]}>Your inbox is empty</Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                You&apos;ll see notifications, messages, and VIP club updates here
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Notifications Section */}
      {activeSection === 'notifications' && (
        <>
          <View style={[styles.subHeader, { borderBottomColor: colors.border }]}>
            {totalUnread > 0 && (
              <TouchableOpacity
                style={[styles.markAllButton, { backgroundColor: colors.brandPrimary || '#A40028' }]}
                onPress={handleMarkAllAsRead}
                activeOpacity={0.7}
              >
                <Text style={styles.markAllText}>Mark All Read</Text>
              </TouchableOpacity>
            )}

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
              contentContainerStyle={styles.categoryScrollContent}
            >
              <TouchableOpacity
                key="category-all"
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

              {Object.entries(CATEGORY_CONFIG).map(([categoryKey, config]) => (
                <TouchableOpacity
                  key={`category-chip-${categoryKey}`}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor:
                        selectedCategory === categoryKey ? (colors.brandPrimary || '#A40028') : colors.backgroundAlt,
                    },
                  ]}
                  onPress={() => setSelectedCategory(categoryKey as NotificationCategory)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      { color: selectedCategory === categoryKey ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    {config.title}
                  </Text>
                  {unreadCounts[categoryKey] > 0 && (
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>
                        {unreadCounts[categoryKey] > 99 ? '99+' : unreadCounts[categoryKey]}
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
                <ActivityIndicator size="large" color={colors.brandPrimary} />
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
              notifications.map((notification) => {
                const icon = getNotificationIcon(notification.type);
                return (
                  <TouchableOpacity
                    key={`notification-${notification.id}`}
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
        </>
      )}

      {/* Messages Section */}
      {activeSection === 'messages' && (
        <>
          {/* Start Conversation Button */}
          <View style={[styles.startConversationContainer, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.startConversationButton, { backgroundColor: colors.brandPrimary }]}
              onPress={handleStartConversation}
              activeOpacity={0.8}
            >
              <IconSymbol
                ios_icon_name="plus.circle.fill"
                android_material_icon_name="add_circle"
                size={20}
                color="#FFFFFF"
              />
              <Text style={styles.startConversationText}>Start Conversation</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.contentContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.brandPrimary}
              />
            }
            showsVerticalScrollIndicator={false}
          >
            {/* Message Requests */}
            {messageRequests.length > 0 && (
              <View style={styles.requestsSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Message Requests ({messageRequests.length})</Text>
                {messageRequests.map((request) => (
                  <TouchableOpacity
                    key={`msg-request-${request.id}`}
                    style={[styles.requestCard, { backgroundColor: colors.backgroundAlt, borderBottomColor: colors.border }]}
                    onPress={() => handleMessageRequestPress(request)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.avatarContainer}>
                      {request.requester.avatar_url ? (
                        <Image source={{ uri: request.requester.avatar_url }} style={styles.avatar} />
                      ) : (
                        <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.card }]}>
                          <IconSymbol
                            ios_icon_name="person.fill"
                            android_material_icon_name="person"
                            size={24}
                            color={colors.textSecondary}
                          />
                        </View>
                      )}
                      <View style={[styles.requestBadge, { backgroundColor: colors.brandPrimary }]}>
                        <IconSymbol
                          ios_icon_name="envelope.fill"
                          android_material_icon_name="mail"
                          size={12}
                          color="#FFFFFF"
                        />
                      </View>
                    </View>

                    <View style={styles.conversationContent}>
                      <Text style={[styles.conversationName, { color: colors.text }]} numberOfLines={1}>
                        {request.requester.display_name || request.requester.username}
                      </Text>
                      <Text style={[styles.requestText, { color: colors.textSecondary }]}>
                        Wants to send you a message
                      </Text>
                    </View>

                    <IconSymbol
                      ios_icon_name="chevron.right"
                      android_material_icon_name="chevron_right"
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Conversations */}
            {conversations.length > 0 ? (
              conversations.map((item) => (
                <TouchableOpacity
                  key={`conversation-${item.id}`}
                  style={[styles.conversationCard, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
                  onPress={() => handleConversationPress(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.avatarContainer}>
                    {item.other_user.avatar_url ? (
                      <Image source={{ uri: item.other_user.avatar_url }} style={styles.avatar} />
                    ) : (
                      <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.backgroundAlt }]}>
                        <IconSymbol
                          ios_icon_name="person.fill"
                          android_material_icon_name="person"
                          size={24}
                          color={colors.textSecondary}
                        />
                      </View>
                    )}
                    {item.unread_count > 0 && (
                      <View style={[styles.unreadBadge, { backgroundColor: colors.brandPrimary }]}>
                        <Text style={styles.unreadBadgeText}>{item.unread_count}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.conversationContent}>
                    <View style={styles.conversationHeader}>
                      <Text style={[styles.conversationName, { color: colors.text }]} numberOfLines={1}>
                        {item.other_user.display_name || item.other_user.username}
                      </Text>
                      {item.last_message && (
                        <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
                          {formatTime(item.last_message.created_at)}
                        </Text>
                      )}
                    </View>
                    {item.last_message ? (
                      <Text
                        style={[
                          styles.lastMessage,
                          { color: item.unread_count > 0 ? colors.text : colors.textSecondary },
                          item.unread_count > 0 && styles.unreadMessage,
                        ]}
                        numberOfLines={1}
                      >
                        {item.last_message.content}
                      </Text>
                    ) : (
                      <Text style={[styles.noMessages, { color: colors.textSecondary }]}>No messages yet</Text>
                    )}
                  </View>

                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="chevron_right"
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <IconSymbol
                  ios_icon_name="bubble.left.and.bubble.right"
                  android_material_icon_name="chat"
                  size={64}
                  color={colors.textSecondary}
                />
                <Text style={[styles.emptyText, { color: colors.text }]}>No conversations yet</Text>
                <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                  Start a conversation by tapping the button above
                </Text>
              </View>
            )}
          </ScrollView>
        </>
      )}

      {/* VIP Clubs Section */}
      {activeSection === 'vip' && (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.brandPrimary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {vipClubConversations.length > 0 ? (
            vipClubConversations.map((item) => (
              <TouchableOpacity
                key={`vip-club-${item.id}`}
                style={[styles.vipClubCard, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
                onPress={() => handleVIPClubPress(item)}
                activeOpacity={0.7}
              >
                <View style={[styles.vipClubIcon, { backgroundColor: item.badge_color }]}>
                  <IconSymbol
                    ios_icon_name="crown.fill"
                    android_material_icon_name="workspace_premium"
                    size={24}
                    color="#FFFFFF"
                  />
                </View>

                <View style={styles.vipClubContent}>
                  <View style={styles.vipClubHeader}>
                    <Text style={[styles.vipClubName, { color: colors.text }]} numberOfLines={1}>
                      {item.club_name}
                    </Text>
                    {item.last_message_at && (
                      <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
                        {formatTime(item.last_message_at)}
                      </Text>
                    )}
                  </View>
                  {item.last_message ? (
                    <Text style={[styles.lastMessage, { color: colors.textSecondary }]} numberOfLines={1}>
                      {item.last_message}
                    </Text>
                  ) : (
                    <Text style={[styles.noMessages, { color: colors.textSecondary }]}>No messages yet</Text>
                  )}
                </View>

                <IconSymbol
                  ios_icon_name="chevron.right"
                  android_material_icon_name="chevron_right"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <IconSymbol
                ios_icon_name="crown"
                android_material_icon_name="workspace_premium"
                size={64}
                color={colors.textSecondary}
              />
              <Text style={[styles.emptyText, { color: colors.text }]}>No VIP Club memberships</Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                Join a creator&apos;s VIP Club to access exclusive group chat
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Start Conversation Modal */}
      <Modal
        visible={showStartConversation}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStartConversation(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.startConversationModal, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Start Conversation</Text>
              <TouchableOpacity onPress={() => {
                setShowStartConversation(false);
                setSearchQuery('');
              }}>
                <IconSymbol
                  ios_icon_name="xmark"
                  android_material_icon_name="close"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>

            <View style={[styles.searchContainer, { backgroundColor: colors.backgroundAlt }]}>
              <IconSymbol
                ios_icon_name="magnifyingglass"
                android_material_icon_name="search"
                size={20}
                color={colors.textSecondary}
              />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search people you follow..."
                placeholderTextColor={colors.placeholder}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <IconSymbol
                    ios_icon_name="xmark.circle.fill"
                    android_material_icon_name="cancel"
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              )}
            </View>

            {searchLoading ? (
              <View style={styles.searchLoadingContainer}>
                <ActivityIndicator size="small" color={colors.brandPrimary} />
                <Text style={[styles.searchLoadingText, { color: colors.textSecondary }]}>Searching...</Text>
              </View>
            ) : (
              <FlatList
                data={followedUsers}
                keyExtractor={(item) => `followed-user-${item.id}`}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.userItem, { borderBottomColor: colors.border }]}
                    onPress={() => handleSelectUser(item)}
                    activeOpacity={0.7}
                  >
                    {item.avatar_url ? (
                      <Image source={{ uri: item.avatar_url }} style={styles.userAvatar} />
                    ) : (
                      <View style={[styles.userAvatar, styles.avatarPlaceholder, { backgroundColor: colors.backgroundAlt }]}>
                        <IconSymbol
                          ios_icon_name="person.fill"
                          android_material_icon_name="person"
                          size={24}
                          color={colors.textSecondary}
                        />
                      </View>
                    )}
                    <View style={styles.userInfo}>
                      <Text style={[styles.userName, { color: colors.text }]}>
                        {item.display_name || item.username}
                      </Text>
                      <Text style={[styles.userUsername, { color: colors.textSecondary }]}>
                        @{item.username}
                      </Text>
                    </View>
                    <IconSymbol
                      ios_icon_name="chevron.right"
                      android_material_icon_name="chevron_right"
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <IconSymbol
                      ios_icon_name="person.2"
                      android_material_icon_name="people"
                      size={64}
                      color={colors.textSecondary}
                    />
                    <Text style={[styles.emptyText, { color: colors.text }]}>
                      {searchQuery ? 'No users found' : 'No followed users'}
                    </Text>
                    <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                      {searchQuery ? 'Try a different search' : 'Follow users to start conversations'}
                    </Text>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Announcement Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={[styles.modalContent, { backgroundColor: colors.card }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeaderAnnouncement}>
              <IconSymbol
                ios_icon_name="megaphone.fill"
                android_material_icon_name="campaign"
                size={32}
                color={colors.brandPrimary || '#A40028'}
              />
              <Text style={[styles.modalTitleAnnouncement, { color: colors.text }]}>
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
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
  },
  sectionTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  sectionTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    position: 'relative',
  },
  sectionTabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  sectionBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 18,
    alignItems: 'center',
  },
  sectionBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  markAllButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
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
  listContent: {
    paddingBottom: 100,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 16,
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
  allSection: {
    marginBottom: 24,
  },
  allSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  viewAllButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '700',
  },
  requestsSection: {
    marginBottom: 16,
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  requestBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestText: {
    fontSize: 14,
    fontWeight: '500',
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  vipClubCard: {
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
  avatarContainer: {
    position: 'relative',
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vipClubIcon: {
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
  conversationContent: {
    flex: 1,
    gap: 4,
  },
  vipClubContent: {
    flex: 1,
    gap: 4,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vipClubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notificationText: {
    fontSize: 14,
    fontWeight: '400',
    flex: 1,
    lineHeight: 20,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  vipClubName: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
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
  lastMessage: {
    fontSize: 14,
    fontWeight: '400',
  },
  unreadMessage: {
    fontWeight: '600',
  },
  noMessages: {
    fontSize: 14,
    fontWeight: '400',
    fontStyle: 'italic',
  },
  startConversationContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  startConversationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  startConversationText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  startConversationModal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  searchLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  searchLoadingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
  },
  userUsername: {
    fontSize: 14,
    fontWeight: '400',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    maxHeight: '80%',
    alignSelf: 'center',
  },
  modalHeaderAnnouncement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  modalTitleAnnouncement: {
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
