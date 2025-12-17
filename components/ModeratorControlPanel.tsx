
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { moderationService, Moderator, BannedUser } from '@/app/services/moderationService';

interface ModeratorControlPanelProps {
  visible: boolean;
  onClose: () => void;
  streamId: string;
  streamerId: string;
  currentUserId: string;
  isStreamer: boolean;
}

export default function ModeratorControlPanel({
  visible,
  onClose,
  streamId,
  streamerId,
  currentUserId,
  isStreamer,
}: ModeratorControlPanelProps) {
  const [activeTab, setActiveTab] = useState<'moderators' | 'banned'>('moderators');
  const [moderators, setModerators] = useState<Moderator[]>([]);
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchUsername, setSearchUsername] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [mods, banned] = await Promise.all([
        moderationService.getModerators(streamerId),
        moderationService.getBannedUsers(streamerId),
      ]);
      setModerators(mods);
      setBannedUsers(banned);
    } catch (error) {
      console.error('Error fetching moderator panel data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [streamerId]);

  useEffect(() => {
    if (visible) {
      fetchData();
    }
  }, [visible, fetchData]);

  const handleSearchUsers = async () => {
    if (!searchUsername.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const results = await moderationService.searchUsersByUsername(searchUsername);
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleAddModerator = async (userId: string, username: string) => {
    if (!isStreamer) {
      Alert.alert('Permission Denied', 'Only the streamer can add moderators.');
      return;
    }

    if (moderators.some((mod) => mod.user_id === userId)) {
      Alert.alert('Already a Moderator', `${username} is already a moderator.`);
      return;
    }

    if (moderators.length >= 30) {
      Alert.alert('Limit Reached', 'You can have a maximum of 30 moderators.');
      return;
    }

    const result = await moderationService.addModerator(streamerId, userId);
    if (result.success) {
      Alert.alert('Success', `${username} has been added as a moderator.`);
      setSearchUsername('');
      setSearchResults([]);
      fetchData();
    } else {
      Alert.alert('Error', result.error || 'Failed to add moderator.');
    }
  };

  const handleRemoveModerator = async (userId: string, username: string) => {
    if (!isStreamer) {
      Alert.alert('Permission Denied', 'Only the streamer can remove moderators.');
      return;
    }

    Alert.alert(
      'Remove Moderator',
      `Are you sure you want to remove ${username} as a moderator?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const result = await moderationService.removeModerator(streamerId, userId);
            if (result.success) {
              Alert.alert('Success', `${username} has been removed as a moderator.`);
              fetchData();
            } else {
              Alert.alert('Error', result.error || 'Failed to remove moderator.');
            }
          },
        },
      ]
    );
  };

  const handleUnbanUser = async (userId: string, username: string) => {
    if (!isStreamer) {
      Alert.alert('Permission Denied', 'Only the streamer can unban users.');
      return;
    }

    Alert.alert(
      'Unban User',
      `Are you sure you want to unban ${username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unban',
          onPress: async () => {
            const result = await moderationService.unbanUser(streamerId, userId);
            if (result.success) {
              Alert.alert('Success', `${username} has been unbanned.`);
              fetchData();
            } else {
              Alert.alert('Error', result.error || 'Failed to unban user.');
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Moderation Panel</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <IconSymbol
                ios_icon_name="xmark"
                android_material_icon_name="close"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'moderators' && styles.activeTab]}
              onPress={() => setActiveTab('moderators')}
            >
              <IconSymbol
                ios_icon_name="shield.fill"
                android_material_icon_name="shield"
                size={20}
                color={activeTab === 'moderators' ? colors.gradientEnd : colors.textSecondary}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'moderators' && styles.activeTabText,
                ]}
              >
                Moderators ({moderators.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'banned' && styles.activeTab]}
              onPress={() => setActiveTab('banned')}
            >
              <IconSymbol
                ios_icon_name="hand.raised.fill"
                android_material_icon_name="block"
                size={20}
                color={activeTab === 'banned' ? colors.gradientEnd : colors.textSecondary}
              />
              <Text
                style={[styles.tabText, activeTab === 'banned' && styles.activeTabText]}
              >
                Banned ({bannedUsers.length})
              </Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.gradientEnd} />
            </View>
          ) : (
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {activeTab === 'moderators' && (
                <>
                  {isStreamer && (
                    <View style={styles.searchSection}>
                      <Text style={styles.sectionTitle}>Add Moderator</Text>
                      <View style={styles.searchContainer}>
                        <TextInput
                          style={styles.searchInput}
                          placeholder="Search username..."
                          placeholderTextColor={colors.placeholder}
                          value={searchUsername}
                          onChangeText={setSearchUsername}
                          onSubmitEditing={handleSearchUsers}
                          autoCapitalize="none"
                        />
                        <TouchableOpacity
                          style={styles.searchButton}
                          onPress={handleSearchUsers}
                          disabled={isSearching}
                        >
                          {isSearching ? (
                            <ActivityIndicator size="small" color={colors.text} />
                          ) : (
                            <IconSymbol
                              ios_icon_name="magnifyingglass"
                              android_material_icon_name="search"
                              size={20}
                              color={colors.text}
                            />
                          )}
                        </TouchableOpacity>
                      </View>

                      {searchResults.length > 0 && (
                        <View style={styles.searchResults}>
                          {searchResults.map((result) => (
                            <TouchableOpacity
                              key={result.id}
                              style={styles.searchResultItem}
                              onPress={() => handleAddModerator(result.id, result.username)}
                            >
                              {result.avatar_url ? (
                                <Image
                                  source={{ uri: result.avatar_url }}
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
                              <View style={styles.userInfo}>
                                <Text style={styles.userName}>{result.display_name}</Text>
                                <Text style={styles.username}>@{result.username}</Text>
                              </View>
                              <IconSymbol
                                ios_icon_name="plus.circle.fill"
                                android_material_icon_name="add_circle"
                                size={24}
                                color={colors.gradientEnd}
                              />
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  )}

                  <View style={styles.listSection}>
                    <Text style={styles.sectionTitle}>Current Moderators</Text>
                    {moderators.length === 0 ? (
                      <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No moderators</Text>
                      </View>
                    ) : (
                      moderators.map((mod) => (
                        <View key={mod.id} style={styles.listItem}>
                          {mod.profiles?.avatar_url ? (
                            <Image
                              source={{ uri: mod.profiles.avatar_url }}
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
                          <View style={styles.userInfo}>
                            <Text style={styles.userName}>{mod.profiles?.display_name}</Text>
                            <Text style={styles.username}>@{mod.profiles?.username}</Text>
                          </View>
                          {isStreamer && (
                            <TouchableOpacity
                              style={styles.removeButton}
                              onPress={() =>
                                handleRemoveModerator(
                                  mod.user_id,
                                  mod.profiles?.username || 'User'
                                )
                              }
                            >
                              <IconSymbol
                                ios_icon_name="trash.fill"
                                android_material_icon_name="delete"
                                size={20}
                                color={colors.gradientEnd}
                              />
                            </TouchableOpacity>
                          )}
                        </View>
                      ))
                    )}
                  </View>
                </>
              )}

              {activeTab === 'banned' && (
                <View style={styles.listSection}>
                  <Text style={styles.sectionTitle}>Banned Users</Text>
                  {bannedUsers.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyText}>No banned users</Text>
                    </View>
                  ) : (
                    bannedUsers.map((banned) => (
                      <View key={banned.id} style={styles.listItem}>
                        {banned.profiles?.avatar_url ? (
                          <Image
                            source={{ uri: banned.profiles.avatar_url }}
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
                        <View style={styles.userInfo}>
                          <Text style={styles.userName}>{banned.profiles?.display_name}</Text>
                          <Text style={styles.username}>@{banned.profiles?.username}</Text>
                          {banned.reason && (
                            <Text style={styles.banReason}>Reason: {banned.reason}</Text>
                          )}
                        </View>
                        {isStreamer && (
                          <TouchableOpacity
                            style={styles.unbanButton}
                            onPress={() =>
                              handleUnbanUser(
                                banned.user_id,
                                banned.profiles?.username || 'User'
                              )
                            }
                          >
                            <Text style={styles.unbanButtonText}>Unban</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ))
                  )}
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  closeButton: {
    padding: 8,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.backgroundAlt,
  },
  activeTab: {
    backgroundColor: 'rgba(227, 0, 82, 0.1)',
    borderWidth: 2,
    borderColor: colors.gradientEnd,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.gradientEnd,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  searchSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: colors.text,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: colors.gradientEnd,
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchResults: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  listSection: {
    marginBottom: 24,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
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
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  username: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  banReason: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  removeButton: {
    padding: 8,
  },
  unbanButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  unbanButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textSecondary,
  },
});