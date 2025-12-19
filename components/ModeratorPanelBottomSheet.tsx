
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Pressable,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import GradientButton from '@/components/GradientButton';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';

interface ModeratorPanelBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  selectedModerators: string[];
  setSelectedModerators: (moderators: string[]) => void;
}

interface Follower {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

/**
 * Moderator Panel Bottom Sheet
 * 
 * FIXED: Now properly centered and shows all details clearly
 */
export default function ModeratorPanelBottomSheet({
  visible,
  onClose,
  selectedModerators,
  setSelectedModerators,
}: ModeratorPanelBottomSheetProps) {
  const { user } = useAuth();
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadFollowers = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('followers')
        .select('follower_id, profiles!followers_follower_id_fkey(id, username, display_name, avatar_url)')
        .eq('following_id', user.id)
        .limit(100);

      if (error) {
        console.error('Error loading followers:', error);
        return;
      }

      const followersList = data
        .map((follow: any) => follow.profiles)
        .filter((profile: any) => profile !== null) as Follower[];

      setFollowers(followersList);
    } catch (error) {
      console.error('Error loading followers:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (visible) {
      loadFollowers();
    }
  }, [visible, loadFollowers]);

  const handleToggleModerator = (userId: string) => {
    if (selectedModerators.includes(userId)) {
      setSelectedModerators(selectedModerators.filter((id) => id !== userId));
    } else {
      setSelectedModerators([...selectedModerators, userId]);
    }
  };

  const filteredFollowers = followers.filter((follower) => {
    const query = searchQuery.toLowerCase();
    return (
      follower.username.toLowerCase().includes(query) ||
      follower.display_name?.toLowerCase().includes(query)
    );
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.centeredContainer} onPress={(e) => e.stopPropagation()}>
          <View style={styles.panel}>
            <View style={styles.header}>
              <Text style={styles.title}>Moderator Panel</Text>
              <TouchableOpacity onPress={onClose}>
                <IconSymbol
                  ios_icon_name="xmark.circle.fill"
                  android_material_icon_name="cancel"
                  size={28}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.content}>
              <View style={styles.infoBox}>
                <IconSymbol
                  ios_icon_name="shield.fill"
                  android_material_icon_name="shield"
                  size={20}
                  color={colors.brandPrimary}
                />
                <Text style={styles.infoText}>
                  Stream Moderators can timeout users, delete messages, and pin comments in your streams only.
                </Text>
              </View>

              {/* Search Bar */}
              <View style={styles.searchContainer}>
                <IconSymbol
                  ios_icon_name="magnifyingglass"
                  android_material_icon_name="search"
                  size={20}
                  color={colors.textSecondary}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search followers..."
                  placeholderTextColor={colors.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              {/* Selected Count */}
              {selectedModerators.length > 0 && (
                <View style={styles.selectedBanner}>
                  <IconSymbol
                    ios_icon_name="shield.fill"
                    android_material_icon_name="shield"
                    size={16}
                    color={colors.brandPrimary}
                  />
                  <Text style={styles.selectedText}>
                    {selectedModerators.length} moderator{selectedModerators.length !== 1 ? 's' : ''} selected
                  </Text>
                </View>
              )}

              {/* Followers List */}
              <ScrollView style={styles.followersList} showsVerticalScrollIndicator={false}>
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.brandPrimary} />
                    <Text style={styles.loadingText}>Loading followers...</Text>
                  </View>
                ) : filteredFollowers.length === 0 ? (
                  <View style={styles.emptyState}>
                    <IconSymbol
                      ios_icon_name="person.2.slash"
                      android_material_icon_name="people_outline"
                      size={48}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.emptyText}>
                      {searchQuery ? 'No followers found' : 'No followers yet'}
                    </Text>
                    <Text style={styles.emptyDescription}>
                      {searchQuery ? 'Try a different search term' : 'Get followers to assign moderators'}
                    </Text>
                  </View>
                ) : (
                  filteredFollowers.map((follower) => {
                    const isSelected = selectedModerators.includes(follower.id);
                    return (
                      <TouchableOpacity
                        key={follower.id}
                        style={[styles.followerCard, isSelected && styles.followerCardActive]}
                        onPress={() => handleToggleModerator(follower.id)}
                      >
                        <View style={[styles.followerAvatar, isSelected && styles.followerAvatarActive]}>
                          <IconSymbol
                            ios_icon_name="person.fill"
                            android_material_icon_name="person"
                            size={24}
                            color={isSelected ? colors.brandPrimary : colors.textSecondary}
                          />
                        </View>
                        <View style={styles.followerInfo}>
                          <Text style={[styles.followerName, isSelected && styles.followerNameActive]}>
                            {follower.display_name || follower.username}
                          </Text>
                          <Text style={styles.followerUsername}>@{follower.username}</Text>
                        </View>
                        {isSelected && (
                          <IconSymbol
                            ios_icon_name="checkmark.circle.fill"
                            android_material_icon_name="check_circle"
                            size={24}
                            color={colors.brandPrimary}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>
            </View>

            <View style={styles.footer}>
              <GradientButton title="Done" onPress={onClose} size="large" />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredContainer: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '85%',
  },
  panel: {
    backgroundColor: colors.card,
    borderRadius: 24,
    overflow: 'hidden',
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
  content: {
    padding: 20,
    maxHeight: 500,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(164, 0, 40, 0.1)',
    borderColor: colors.brandPrimary,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 10,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
    lineHeight: 18,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  selectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(164, 0, 40, 0.1)',
    borderColor: colors.brandPrimary,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
    gap: 8,
  },
  selectedText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  followersList: {
    maxHeight: 300,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  emptyDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  followerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  followerCardActive: {
    backgroundColor: 'rgba(164, 0, 40, 0.1)',
    borderColor: colors.brandPrimary,
    borderWidth: 2,
  },
  followerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followerAvatarActive: {
    backgroundColor: 'rgba(164, 0, 40, 0.2)',
  },
  followerInfo: {
    flex: 1,
    gap: 4,
  },
  followerName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  followerNameActive: {
    color: colors.brandPrimary,
  },
  followerUsername: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
