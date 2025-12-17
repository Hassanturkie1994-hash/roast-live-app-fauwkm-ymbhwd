
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import GradientButton from '@/components/GradientButton';
import { moderationService } from '@/app/services/moderationService';

interface Moderator {
  id: string;
  user_id: string;
  display_name?: string;
  username?: string;
  avatar_url?: string | null;
}

interface ManageModeratorsModalProps {
  visible: boolean;
  onClose: () => void;
  streamerId: string;
  isHost: boolean;
}

export default function ManageModeratorsModal({
  visible,
  onClose,
  streamerId,
  isHost,
}: ManageModeratorsModalProps) {
  const [moderators, setModerators] = useState<Moderator[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAddSection, setShowAddSection] = useState(false);

  const loadModerators = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await moderationService.getModerators(streamerId);
      const formattedModerators = data.map((mod: any) => ({
        id: mod.id,
        user_id: mod.user_id,
        display_name: mod.profiles?.display_name || 'Unknown',
        username: mod.profiles?.username || 'unknown',
        avatar_url: mod.profiles?.avatar_url,
      }));
      setModerators(formattedModerators);
    } catch (error) {
      console.error('Error loading moderators:', error);
      Alert.alert('Error', 'Failed to load moderators');
    } finally {
      setIsLoading(false);
    }
  }, [streamerId]);

  useEffect(() => {
    if (visible) {
      loadModerators();
    }
  }, [visible, loadModerators]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await moderationService.searchUsersByUsername(query);
      // Filter out users who are already moderators
      const filtered = results.filter(
        (user) => !moderators.some((mod) => mod.user_id === user.id)
      );
      setSearchResults(filtered);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddModerator = async (userId: string) => {
    if (!isHost) {
      Alert.alert('Permission Denied', 'Only the host can add moderators');
      return;
    }

    try {
      const result = await moderationService.addModerator(streamerId, userId, streamerId);
      
      if (result.success) {
        Alert.alert('Success', 'Moderator added successfully');
        setSearchQuery('');
        setSearchResults([]);
        setShowAddSection(false);
        await loadModerators();
      } else {
        Alert.alert('Error', result.error || 'Failed to add moderator');
      }
    } catch (error) {
      console.error('Error adding moderator:', error);
      Alert.alert('Error', 'Failed to add moderator');
    }
  };

  const handleRemoveModerator = async (userId: string, displayName: string) => {
    if (!isHost) {
      Alert.alert('Permission Denied', 'Only the host can remove moderators');
      return;
    }

    Alert.alert(
      'Remove Moderator',
      `Are you sure you want to remove ${displayName} as a moderator?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await moderationService.removeModerator(streamerId, userId, streamerId);
              
              if (result.success) {
                Alert.alert('Success', 'Moderator removed successfully');
                await loadModerators();
              } else {
                Alert.alert('Error', result.error || 'Failed to remove moderator');
              }
            } catch (error) {
              console.error('Error removing moderator:', error);
              Alert.alert('Error', 'Failed to remove moderator');
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
            <Text style={styles.title}>Manage Moderators</Text>
            <TouchableOpacity onPress={onClose}>
              <IconSymbol
                ios_icon_name="xmark"
                android_material_icon_name="close"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.infoBox}>
            <IconSymbol
              ios_icon_name="info.circle.fill"
              android_material_icon_name="info"
              size={20}
              color={colors.brandPrimary}
            />
            <Text style={styles.infoText}>
              Moderators can pin messages, timeout users, and ban users from your streams.
              They persist across all your streams until removed.
            </Text>
          </View>

          {isHost && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddSection(!showAddSection)}
            >
              <IconSymbol
                ios_icon_name={showAddSection ? 'minus.circle.fill' : 'plus.circle.fill'}
                android_material_icon_name={showAddSection ? 'remove_circle' : 'add_circle'}
                size={24}
                color={colors.brandPrimary}
              />
              <Text style={styles.addButtonText}>
                {showAddSection ? 'Cancel' : 'Add Moderator'}
              </Text>
            </TouchableOpacity>
          )}

          {showAddSection && (
            <View style={styles.searchSection}>
              <View style={styles.searchInputContainer}>
                <IconSymbol
                  ios_icon_name="magnifyingglass"
                  android_material_icon_name="search"
                  size={20}
                  color={colors.textSecondary}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by username..."
                  placeholderTextColor={colors.placeholder}
                  value={searchQuery}
                  onChangeText={handleSearch}
                  autoCapitalize="none"
                />
                {isSearching && <ActivityIndicator size="small" color={colors.brandPrimary} />}
              </View>

              {searchResults.length > 0 && (
                <ScrollView style={styles.searchResults} showsVerticalScrollIndicator={false}>
                  {searchResults.map((user) => (
                    <TouchableOpacity
                      key={user.id}
                      style={styles.searchResultItem}
                      onPress={() => handleAddModerator(user.id)}
                    >
                      <View style={styles.userAvatar}>
                        <IconSymbol
                          ios_icon_name="person.fill"
                          android_material_icon_name="person"
                          size={20}
                          color={colors.textSecondary}
                        />
                      </View>
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>{user.display_name || user.username}</Text>
                        <Text style={styles.userUsername}>@{user.username}</Text>
                      </View>
                      <IconSymbol
                        ios_icon_name="plus.circle"
                        android_material_icon_name="add_circle_outline"
                        size={24}
                        color={colors.brandPrimary}
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          <View style={styles.moderatorsList}>
            <Text style={styles.sectionTitle}>
              Current Moderators ({moderators.length}/30)
            </Text>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.brandPrimary} />
              </View>
            ) : moderators.length === 0 ? (
              <View style={styles.emptyState}>
                <IconSymbol
                  ios_icon_name="person.2.slash"
                  android_material_icon_name="people_outline"
                  size={48}
                  color={colors.textSecondary}
                />
                <Text style={styles.emptyText}>No moderators yet</Text>
                <Text style={styles.emptySubtext}>
                  {isHost ? 'Add moderators to help manage your streams' : 'Only the host can add moderators'}
                </Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {moderators.map((moderator) => (
                  <View key={moderator.id} style={styles.moderatorItem}>
                    <View style={styles.moderatorAvatar}>
                      <IconSymbol
                        ios_icon_name="person.fill"
                        android_material_icon_name="person"
                        size={20}
                        color={colors.textSecondary}
                      />
                    </View>
                    <View style={styles.moderatorInfo}>
                      <Text style={styles.moderatorName}>{moderator.display_name}</Text>
                      <Text style={styles.moderatorUsername}>@{moderator.username}</Text>
                    </View>
                    <View style={styles.moderatorBadge}>
                      <IconSymbol
                        ios_icon_name="shield.fill"
                        android_material_icon_name="shield"
                        size={16}
                        color="#FFD700"
                      />
                      <Text style={styles.moderatorBadgeText}>MOD</Text>
                    </View>
                    {isHost && (
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => handleRemoveModerator(moderator.user_id, moderator.display_name || 'this user')}
                      >
                        <IconSymbol
                          ios_icon_name="trash.fill"
                          android_material_icon_name="delete"
                          size={20}
                          color="#FF1744"
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          <View style={styles.footer}>
            <GradientButton title="Done" onPress={onClose} size="large" />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(164, 0, 40, 0.1)',
    borderColor: 'rgba(164, 0, 40, 0.3)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    margin: 16,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
    lineHeight: 18,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.brandPrimary,
    borderWidth: 2,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  searchSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  searchResults: {
    maxHeight: 200,
    marginTop: 8,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  userUsername: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  moderatorsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  moderatorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  moderatorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moderatorInfo: {
    flex: 1,
  },
  moderatorName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  moderatorUsername: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  moderatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderColor: 'rgba(255, 215, 0, 0.3)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  moderatorBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFD700',
  },
  removeButton: {
    padding: 8,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
