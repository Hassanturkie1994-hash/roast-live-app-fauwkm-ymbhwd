
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { userBlockingService, BlockedUser } from '@/app/services/userBlockingService';

export default function BlockedUsersScreen() {
  const { user } = useAuth();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBlockedUsers = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const blocked = await userBlockingService.getBlockedUsers(user.id);
      setBlockedUsers(blocked);
    } catch (error) {
      console.error('Error fetching blocked users:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBlockedUsers();
  }, [fetchBlockedUsers]);

  const handleUnblock = async (userId: string, username: string) => {
    if (!user) return;

    Alert.alert(
      'Unblock User',
      `Are you sure you want to unblock ${username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          onPress: async () => {
            const result = await userBlockingService.unblockUser(user.id, userId);
            if (result.success) {
              Alert.alert('Success', `${username} has been unblocked.`);
              fetchBlockedUsers();
            } else {
              Alert.alert('Error', result.error || 'Failed to unblock user.');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={commonStyles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="arrow_back"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Blocked Users</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.gradientEnd} />
          <Text style={styles.loadingText}>Loading blocked users...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Blocked Users</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionSubtitle}>
            Blocked users cannot see your profile or send you messages. You won't see their chat messages in livestreams.
          </Text>

          {blockedUsers.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check_circle"
                size={48}
                color="#4CAF50"
              />
              <Text style={styles.emptyText}>No blocked users</Text>
              <Text style={styles.emptySubtext}>
                Users you block will appear here
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {blockedUsers.map((blocked) => (
                <View key={blocked.id} style={styles.listItem}>
                  {blocked.profiles?.avatar_url ? (
                    <Image
                      source={{ uri: blocked.profiles.avatar_url }}
                      style={styles.avatar}
                    />
                  ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                      <IconSymbol
                        ios_icon_name="person.fill"
                        android_material_icon_name="person"
                        size={20}
                        color={colors.textSecondary}
                      />
                    </View>
                  )}
                  <View style={styles.listItemInfo}>
                    <Text style={styles.listItemName}>
                      {blocked.profiles?.display_name}
                    </Text>
                    <Text style={styles.listItemUsername}>
                      @{blocked.profiles?.username}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.unblockButton}
                    onPress={() =>
                      handleUnblock(
                        blocked.blocked_id,
                        blocked.profiles?.username || 'User'
                      )
                    }
                  >
                    <Text style={styles.unblockButtonText}>Unblock</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    marginBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  list: {
    gap: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listItemInfo: {
    flex: 1,
  },
  listItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  listItemUsername: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  unblockButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  unblockButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
});
