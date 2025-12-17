
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { privateMessagingService, ConversationWithUser } from '@/app/services/privateMessagingService';
import { supabase } from '@/app/integrations/supabase/client';

export default function ConversationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadConversations = useCallback(async () => {
    if (!user) return;

    try {
      const convs = await privateMessagingService.getUserConversations(user.id);
      setConversations(convs);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadConversations();

    // Subscribe to conversation updates
    if (user) {
      const channel = privateMessagingService.subscribeToUserConversations(user.id, loadConversations);

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, loadConversations]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  const handleConversationPress = (conversation: ConversationWithUser) => {
    router.push({
      pathname: '/screens/ChatScreen',
      params: {
        conversationId: conversation.id,
        otherUserId: conversation.other_user.id,
        otherUserName: conversation.other_user.display_name || conversation.other_user.username,
      },
    });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ago`;
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes > 0 ? `${minutes}m ago` : 'Just now';
    }
  };

  const renderConversation = ({ item }: { item: ConversationWithUser }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => handleConversationPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        {item.other_user.avatar_url ? (
          <Image source={{ uri: item.other_user.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <IconSymbol
              ios_icon_name="person.fill"
              android_material_icon_name="person"
              size={24}
              color={colors.placeholder}
            />
          </View>
        )}
        {item.unread_count > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unread_count}</Text>
          </View>
        )}
      </View>

      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.userName} numberOfLines={1}>
            {item.other_user.display_name || item.other_user.username}
          </Text>
          {item.last_message && (
            <Text style={styles.timestamp}>
              {formatTime(item.last_message.created_at)}
            </Text>
          )}
        </View>

        {item.last_message ? (
          <Text
            style={[
              styles.lastMessage,
              item.unread_count > 0 && styles.unreadMessage,
            ]}
            numberOfLines={1}
          >
            {item.last_message.content}
          </Text>
        ) : (
          <Text style={styles.noMessages}>No messages yet</Text>
        )}
      </View>

      <IconSymbol
        ios_icon_name="chevron.right"
        android_material_icon_name="chevron_right"
        size={20}
        color={colors.placeholder}
      />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brandPrimary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={styles.headerRight} />
      </View>

      {conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconSymbol
            ios_icon_name="bubble.left.and.bubble.right"
            android_material_icon_name="chat"
            size={64}
            color={colors.placeholder}
          />
          <Text style={styles.emptyText}>No conversations yet</Text>
          <Text style={styles.emptySubtext}>
            Start a conversation by visiting a user's profile
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.brandPrimary}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  headerRight: {
    width: 40,
  },
  listContent: {
    paddingVertical: 8,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.brandPrimary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  conversationContent: {
    flex: 1,
    marginRight: 8,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
    color: colors.placeholder,
    marginLeft: 8,
  },
  lastMessage: {
    fontSize: 14,
    color: colors.placeholder,
  },
  unreadMessage: {
    fontWeight: '600',
    color: colors.text,
  },
  noMessages: {
    fontSize: 14,
    color: colors.placeholder,
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.placeholder,
    textAlign: 'center',
  },
});
