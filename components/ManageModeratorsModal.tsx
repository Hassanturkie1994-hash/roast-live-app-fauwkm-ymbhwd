
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/app/integrations/supabase/client';
import GradientButton from '@/components/GradientButton';

interface StreamModerator {
  id: string;
  user_id: string;
  assigned_at: string;
  profiles: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface UserSearchResult {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface ManageModeratorsModalProps {
  visible: boolean;
  onClose: () => void;
  creatorId: string;
}

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * MANAGE STREAM MODERATORS MODAL
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * Allows creators to add/remove stream moderators for their streams.
 * 
 * Stream Moderators:
 * - Scoped to creator's streams only
 * - Can mute, timeout, remove/pin messages
 * - NO access to dashboards or user data
 * - Stored in moderators table (creator-assigned)
 * 
 * This is DIFFERENT from:
 * - Global role management (HEAD_ADMIN only)
 * - Platform MODERATOR role (monitors all streams)
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
export default function ManageModeratorsModal({
  visible,
  onClose,
  creatorId,
}: ManageModeratorsModalProps) {
  const { colors } = useTheme();
  const [moderators, setModerators] = useState<StreamModerator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);

  const loadModerators = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('📥 Loading stream moderators for creator:', creatorId);

      const { data, error } = await supabase
        .from('moderators')
        .select(`
          id,
          user_id,
          created_at,
          profiles:user_id(username, display_name, avatar_url)
        `)
        .eq('streamer_id', creatorId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading moderators:', error);
        Alert.alert('Error', 'Failed to load moderators');
        return;
      }

      console.log('✅ Loaded', data?.length || 0, 'moderators');
      setModerators(data || []);
    } catch (error) {
      console.error('❌ Exception loading moderators:', error);
      Alert.alert('Error', 'Failed to load moderators');
    } finally {
      setIsLoading(false);
    }
  }, [creatorId]);

  useEffect(() => {
    if (visible) {
      loadModerators();
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [visible, loadModerators]);

  const handleSearchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      console.log('🔍 Searching users:', searchQuery);

      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
        .limit(20);

      if (error) {
        console.error('❌ Error searching users:', error);
        Alert.alert('Error', 'Failed to search users');
        return;
      }

      // Filter out users who are already moderators
      const existingModeratorIds = new Set(moderators.map(m => m.user_id));
      const filteredResults = (data || []).filter(u => !existingModeratorIds.has(u.id) && u.id !== creatorId);

      console.log('✅ Found', filteredResults.length, 'users');
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('❌ Exception searching users:', error);
      Alert.alert('Error', 'Failed to search users');
    } finally {
      setSearching(false);
    }
  };

  const handleAddModerator = async (userId: string, username: string) => {
    try {
      setAdding(true);
      console.log('➕ Adding stream moderator:', { creatorId, userId });

      // Check if already exists
      const { data: existing } = await supabase
        .from('moderators')
        .select('id')
        .eq('streamer_id', creatorId)
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        Alert.alert('Already Added', `@${username} is already a stream moderator`);
        return;
      }

      // Add moderator
      const { error } = await supabase
        .from('moderators')
        .insert({
          streamer_id: creatorId,
          user_id: userId,
        });

      if (error) {
        console.error('❌ Error adding moderator:', error);
        Alert.alert('Error', 'Failed to add moderator');
        return;
      }

      console.log('✅ Moderator added successfully');
      Alert.alert('Success', `@${username} is now a stream moderator`);
      
      // Reload moderators
      await loadModerators();
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('❌ Exception adding moderator:', error);
      Alert.alert('Error', 'Failed to add moderator');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveModerator = async (moderatorId: string, userId: string, username: string) => {
    Alert.alert(
      'Remove Stream Moderator',
      `Are you sure you want to remove @${username} as a stream moderator?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('➖ Removing stream moderator:', { moderatorId, userId });

              const { error } = await supabase
                .from('moderators')
                .delete()
                .eq('id', moderatorId);

              if (error) {
                console.error('❌ Error removing moderator:', error);
                Alert.alert('Error', 'Failed to remove moderator');
                return;
              }

              console.log('✅ Moderator removed successfully');
              Alert.alert('Success', `@${username} removed as stream moderator`);
              
              // Reload moderators
              await loadModerators();
            } catch (error) {
              console.error('❌ Exception removing moderator:', error);
              Alert.alert('Error', 'Failed to remove moderator');
            }
          },
        },
      ]
    );
  };

  const renderModerator = ({ item }: { item: StreamModerator }) => (
    <View style={[styles.moderatorItem, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}>
      <View style={styles.moderatorLeft}>
        <IconSymbol
          ios_icon_name="person.circle.fill"
          android_material_icon_name="account_circle"
          size={40}
          color={colors.brandPrimary}
        />
        <View style={styles.moderatorInfo}>
          <Text style={[styles.moderatorName, { color: colors.text }]}>
            {item.profiles.display_name || item.profiles.username}
          </Text>
          <Text style={[styles.moderatorUsername, { color: colors.textSecondary }]}>
            @{item.profiles.username}
          </Text>
          <Text style={[styles.moderatorDate, { color: colors.textSecondary }]}>
            Added {new Date(item.assigned_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.removeButton, { backgroundColor: 'rgba(220, 20, 60, 0.1)', borderColor: '#DC143C' }]}
        onPress={() => handleRemoveModerator(item.id, item.user_id, item.profiles.username)}
      >
        <IconSymbol
          ios_icon_name="trash.fill"
          android_material_icon_name="delete"
          size={18}
          color="#DC143C"
        />
      </TouchableOpacity>
    </View>
  );

  const renderSearchResult = ({ item }: { item: UserSearchResult }) => (
    <TouchableOpacity
      style={[styles.searchResultItem, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => handleAddModerator(item.id, item.username)}
      disabled={adding}
    >
      <View style={styles.searchResultLeft}>
        <IconSymbol
          ios_icon_name="person.circle.fill"
          android_material_icon_name="account_circle"
          size={40}
          color={colors.textSecondary}
        />
        <View>
          <Text style={[styles.searchResultName, { color: colors.text }]}>
            {item.display_name || item.username}
          </Text>
          <Text style={[styles.searchResultUsername, { color: colors.textSecondary }]}>
            @{item.username}
          </Text>
        </View>
      </View>
      <IconSymbol
        ios_icon_name="plus.circle.fill"
        android_material_icon_name="add_circle"
        size={24}
        color={colors.brandPrimary}
      />
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>Stream Moderators</Text>
            <TouchableOpacity onPress={onClose}>
              <IconSymbol
                ios_icon_name="xmark"
                android_material_icon_name="close"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          {/* Info Box */}
          <View style={[styles.infoBox, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}>
            <IconSymbol
              ios_icon_name="info.circle.fill"
              android_material_icon_name="info"
              size={18}
              color={colors.brandPrimary}
            />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Stream Moderators can mute, timeout, and manage messages in YOUR streams only. 
              They cannot access dashboards or manage other creators&apos; streams.
            </Text>
          </View>

          {/* Search Section */}
          <View style={styles.searchSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Add Stream Moderator</Text>
            <View style={styles.searchContainer}>
              <TextInput
                style={[styles.searchInput, { backgroundColor: colors.backgroundAlt, borderColor: colors.border, color: colors.text }]}
                placeholder="Search by username..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearchUsers}
              />
              <TouchableOpacity
                style={[styles.searchButton, { backgroundColor: colors.brandPrimary }]}
                onPress={handleSearchUsers}
                disabled={searching}
              >
                {searching ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <IconSymbol
                    ios_icon_name="magnifyingglass"
                    android_material_icon_name="search"
                    size={20}
                    color="#FFFFFF"
                  />
                )}
              </TouchableOpacity>
            </View>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <View style={styles.searchResultsContainer}>
                <FlatList
                  data={searchResults}
                  renderItem={renderSearchResult}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.searchResultsList}
                  showsVerticalScrollIndicator={false}
                  scrollEnabled={false}
                />
              </View>
            )}
          </View>

          {/* Current Moderators */}
          <View style={styles.moderatorsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Current Moderators ({moderators.length})
            </Text>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.brandPrimary} />
              </View>
            ) : moderators.length === 0 ? (
              <View style={[styles.emptyContainer, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}>
                <IconSymbol
                  ios_icon_name="person.badge.shield.checkmark"
                  android_material_icon_name="admin_panel_settings"
                  size={48}
                  color={colors.textSecondary}
                />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No stream moderators yet
                </Text>
                <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                  Search and add users to help moderate your streams
                </Text>
              </View>
            ) : (
              <FlatList
                data={moderators}
                renderItem={renderModerator}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.moderatorsList}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  searchButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchResultsContainer: {
    maxHeight: 200,
  },
  searchResultsList: {
    gap: 8,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchResultLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '700',
  },
  searchResultUsername: {
    fontSize: 14,
    fontWeight: '400',
  },
  moderatorsSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    gap: 12,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 32,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
  },
  moderatorsList: {
    gap: 12,
  },
  moderatorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  moderatorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  moderatorInfo: {
    flex: 1,
    gap: 2,
  },
  moderatorName: {
    fontSize: 16,
    fontWeight: '700',
  },
  moderatorUsername: {
    fontSize: 14,
    fontWeight: '400',
  },
  moderatorDate: {
    fontSize: 12,
    fontWeight: '400',
  },
  removeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
