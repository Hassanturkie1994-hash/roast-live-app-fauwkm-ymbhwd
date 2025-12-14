
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import GradientButton from '@/components/GradientButton';
import { useAuth } from '@/contexts/AuthContext';
import { useModerators } from '@/contexts/ModeratorsContext';
import { followService } from '@/app/services/followService';
import { moderationService } from '@/app/services/moderationService';
import ErrorBoundary from '@/components/ErrorBoundary';

interface LiveSettingsPanelProps {
  visible: boolean;
  onClose: () => void;
  aboutLive: string;
  setAboutLive: (text: string) => void;
  practiceMode: boolean;
  setPracticeMode: (value: boolean) => void;
  whoCanWatch: 'public' | 'followers' | 'vip_club';
  setWhoCanWatch: (value: 'public' | 'followers' | 'vip_club') => void;
  selectedModerators: string[];
  setSelectedModerators: (moderators: string[]) => void;
}

interface Follower {
  id: string;
  display_name: string;
  username: string;
  avatar_url?: string | null;
}

function LiveSettingsPanelContent({
  visible,
  onClose,
  aboutLive,
  setAboutLive,
  practiceMode,
  setPracticeMode,
  whoCanWatch,
  setWhoCanWatch,
  selectedModerators,
  setSelectedModerators,
}: LiveSettingsPanelProps) {
  const { user } = useAuth();
  const { refreshModerators, addModerator, removeModerator } = useModerators();
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(false);
  const [showModeratorSelector, setShowModeratorSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Follower[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addingModerator, setAddingModerator] = useState<string | null>(null);

  useEffect(() => {
    if (visible && user) {
      loadFollowers();
      loadExistingModerators();
    }
  }, [visible, user]);

  const loadFollowers = async () => {
    if (!user) return;

    try {
      setIsLoadingFollowers(true);
      console.log('📥 [LiveSettings] Loading followers for moderator selection');

      const result = await followService.getFollowers(user.id);

      if (result.success && result.data) {
        const followersList = result.data.map((f: any) => ({
          id: f.id || f.follower_id,
          display_name: f.display_name || 'Unknown',
          username: f.username || 'unknown',
          avatar_url: f.avatar_url,
        }));
        
        // Validate unique IDs
        const uniqueIds = new Set(followersList.map((f: Follower) => f.id));
        if (uniqueIds.size !== followersList.length) {
          console.warn('⚠️ [LiveSettings] Duplicate follower IDs detected');
        }
        
        setFollowers(followersList);
        console.log('✅ [LiveSettings] Loaded', followersList.length, 'followers');
      } else {
        console.warn('⚠️ [LiveSettings] No followers found or error:', result.error);
        setFollowers([]);
      }
    } catch (error) {
      console.error('❌ [LiveSettings] Error loading followers:', error);
      setFollowers([]);
    } finally {
      setIsLoadingFollowers(false);
    }
  };

  const loadExistingModerators = async () => {
    if (!user) return;

    try {
      console.log('📥 [LiveSettings] Loading existing moderators from context');
      await refreshModerators();
    } catch (error) {
      console.error('❌ [LiveSettings] Error loading moderators:', error);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      console.log('🔍 [LiveSettings] Searching for users:', query);

      const results = await moderationService.searchUsersByUsername(query);
      
      const formattedResults = results.map((r: any) => ({
        id: r.id,
        display_name: r.display_name || 'Unknown',
        username: r.username || 'unknown',
        avatar_url: r.avatar_url,
      }));

      setSearchResults(formattedResults);
      console.log('✅ [LiveSettings] Found', formattedResults.length, 'users');
    } catch (error) {
      console.error('❌ [LiveSettings] Error searching users:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleModerator = async (userId: string) => {
    if (!user) return;

    // DEFENSIVE: Prevent double-tap
    if (addingModerator === userId) {
      console.log('⏳ [LiveSettings] Already processing moderator action for:', userId);
      return;
    }

    const isCurrentlyModerator = selectedModerators.includes(userId);

    if (isCurrentlyModerator) {
      // Remove moderator
      setAddingModerator(userId);
      const success = await removeModerator(userId);
      setAddingModerator(null);
      
      if (success) {
        setSelectedModerators(selectedModerators.filter((id) => id !== userId));
        console.log('➖ [LiveSettings] Removed moderator:', userId);
      } else {
        Alert.alert('Error', 'Failed to remove moderator');
      }
    } else {
      // Add moderator (idempotent)
      setAddingModerator(userId);
      const success = await addModerator(userId);
      setAddingModerator(null);
      
      if (success) {
        // Only add if not already in the list (prevent duplicates)
        if (!selectedModerators.includes(userId)) {
          setSelectedModerators([...selectedModerators, userId]);
        }
        console.log('➕ [LiveSettings] Added moderator:', userId);
      } else {
        Alert.alert('Error', 'Failed to add moderator');
      }
    }
  };

  const handlePracticeModeInfo = () => {
    Alert.alert(
      'Practice Mode',
      'Practice mode allows you to test your stream setup privately without creating a Cloudflare stream. Only you can see the stream, and it won\'t be visible to any viewers. This is perfect for testing your camera, audio, filters, and effects before going live for real.',
      [{ text: 'Got it' }]
    );
  };

  const displayList = searchQuery.trim() ? searchResults : followers;

  // Validate displayList for undefined or duplicate IDs
  const validatedDisplayList = displayList.filter((item) => {
    if (!item.id) {
      console.warn('⚠️ [LiveSettings] Item with undefined ID detected:', item);
      return false;
    }
    return true;
  });

  // Runtime guard: Check for duplicate IDs in dev mode
  if (__DEV__ && validatedDisplayList.length > 0) {
    const ids = validatedDisplayList.map(item => item.id);
    const uniqueIds = new Set(ids);
    if (uniqueIds.size !== ids.length) {
      console.error('❌ [LiveSettings] DUPLICATE IDs DETECTED in displayList:', ids);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>Live Settings</Text>
            <TouchableOpacity onPress={onClose}>
              <IconSymbol
                ios_icon_name="xmark"
                android_material_icon_name="close"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* About This Live */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About this Live</Text>
              <Text style={styles.sectionDescription}>
                Describe your roast session to attract viewers
              </Text>
              <TextInput
                style={styles.textArea}
                placeholder="What's this stream about? Add tags or categories..."
                placeholderTextColor={colors.placeholder}
                value={aboutLive}
                onChangeText={setAboutLive}
                multiline
                numberOfLines={4}
                maxLength={500}
              />
              <Text style={styles.charCount}>{aboutLive.length}/500</Text>
            </View>

            {/* Practice Mode */}
            <View style={styles.section}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <View style={styles.settingTitleRow}>
                    <Text style={styles.sectionTitle}>Practice Mode</Text>
                    <TouchableOpacity onPress={handlePracticeModeInfo}>
                      <IconSymbol
                        ios_icon_name="info.circle"
                        android_material_icon_name="info"
                        size={18}
                        color={colors.brandPrimary}
                      />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.sectionDescription}>
                    Test your setup without going live
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.toggle, practiceMode && styles.toggleActive]}
                  onPress={() => setPracticeMode(!practiceMode)}
                >
                  <View style={[styles.toggleThumb, practiceMode && styles.toggleThumbActive]} />
                </TouchableOpacity>
              </View>
              {practiceMode && (
                <View style={styles.infoBox}>
                  <IconSymbol
                    ios_icon_name="eye.slash.fill"
                    android_material_icon_name="visibility_off"
                    size={16}
                    color={colors.brandPrimary}
                  />
                  <Text style={styles.infoText}>
                    Practice mode simulates a live stream locally. No Cloudflare stream will be created.
                  </Text>
                </View>
              )}
            </View>

            {/* Who Can Watch */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Who can watch this live</Text>
              <Text style={styles.sectionDescription}>
                Control who has access to your stream
              </Text>
              <TouchableOpacity
                style={[styles.optionButton, whoCanWatch === 'public' && styles.optionButtonActive]}
                onPress={() => setWhoCanWatch('public')}
              >
                <IconSymbol
                  ios_icon_name="globe"
                  android_material_icon_name="public"
                  size={20}
                  color={whoCanWatch === 'public' ? colors.brandPrimary : colors.textSecondary}
                />
                <Text style={[styles.optionText, whoCanWatch === 'public' && styles.optionTextActive]}>
                  Public - Everyone
                </Text>
                {whoCanWatch === 'public' && (
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check_circle"
                    size={20}
                    color={colors.brandPrimary}
                  />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.optionButton, whoCanWatch === 'followers' && styles.optionButtonActive]}
                onPress={() => setWhoCanWatch('followers')}
              >
                <IconSymbol
                  ios_icon_name="person.2.fill"
                  android_material_icon_name="group"
                  size={20}
                  color={whoCanWatch === 'followers' ? colors.brandPrimary : colors.textSecondary}
                />
                <Text style={[styles.optionText, whoCanWatch === 'followers' && styles.optionTextActive]}>
                  Followers Only
                </Text>
                {whoCanWatch === 'followers' && (
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check_circle"
                    size={20}
                    color={colors.brandPrimary}
                  />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.optionButton, whoCanWatch === 'vip_club' && styles.optionButtonActive]}
                onPress={() => setWhoCanWatch('vip_club')}
              >
                <IconSymbol
                  ios_icon_name="star.circle.fill"
                  android_material_icon_name="workspace_premium"
                  size={20}
                  color={whoCanWatch === 'vip_club' ? colors.brandPrimary : colors.textSecondary}
                />
                <Text style={[styles.optionText, whoCanWatch === 'vip_club' && styles.optionTextActive]}>
                  VIP Club Only
                </Text>
                {whoCanWatch === 'vip_club' && (
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check_circle"
                    size={20}
                    color={colors.brandPrimary}
                  />
                )}
              </TouchableOpacity>
            </View>

            {/* Moderators */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Moderators</Text>
              <Text style={styles.sectionDescription}>
                Select users to help moderate your stream
              </Text>
              <TouchableOpacity 
                style={styles.manageButton}
                onPress={() => setShowModeratorSelector(!showModeratorSelector)}
              >
                <Text style={styles.manageButtonText}>
                  {selectedModerators.length > 0 
                    ? `${selectedModerators.length} Moderator${selectedModerators.length > 1 ? 's' : ''} Selected`
                    : 'Select Moderators'}
                </Text>
                <IconSymbol
                  ios_icon_name={showModeratorSelector ? 'chevron.up' : 'chevron.down'}
                  android_material_icon_name={showModeratorSelector ? 'expand_less' : 'expand_more'}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>

              {showModeratorSelector && (
                <View style={styles.moderatorList}>
                  {/* Search Input */}
                  <View style={styles.searchContainer}>
                    <IconSymbol
                      ios_icon_name="magnifyingglass"
                      android_material_icon_name="search"
                      size={18}
                      color={colors.textSecondary}
                    />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search by username..."
                      placeholderTextColor={colors.placeholder}
                      value={searchQuery}
                      onChangeText={handleSearch}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => handleSearch('')}>
                        <IconSymbol
                          ios_icon_name="xmark.circle.fill"
                          android_material_icon_name="cancel"
                          size={18}
                          color={colors.textSecondary}
                        />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* User List */}
                  {isLoadingFollowers || isSearching ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color={colors.brandPrimary} />
                      <Text style={styles.loadingText}>
                        {isSearching ? 'Searching...' : 'Loading followers...'}
                      </Text>
                    </View>
                  ) : validatedDisplayList.length === 0 ? (
                    <Text style={styles.emptyText}>
                      {searchQuery.trim() 
                        ? 'No users found' 
                        : 'No followers to select as moderators'}
                    </Text>
                  ) : (
                    <ScrollView style={styles.userScrollView} showsVerticalScrollIndicator={false}>
                      {validatedDisplayList.map((follower, index) => {
                        const isSelected = selectedModerators.includes(follower.id);
                        const isProcessing = addingModerator === follower.id;
                        
                        // Use compound key: id + index for guaranteed uniqueness
                        return (
                          <TouchableOpacity
                            key={`follower-${follower.id}-${index}`}
                            style={[styles.followerItem, isSelected && styles.followerItemActive]}
                            onPress={() => toggleModerator(follower.id)}
                            disabled={isProcessing}
                          >
                            <View style={styles.followerAvatar}>
                              <IconSymbol
                                ios_icon_name="person.fill"
                                android_material_icon_name="person"
                                size={16}
                                color={colors.textSecondary}
                              />
                            </View>
                            <View style={styles.followerInfo}>
                              <Text style={styles.followerName}>{follower.display_name}</Text>
                              <Text style={styles.followerUsername}>@{follower.username}</Text>
                            </View>
                            {isProcessing ? (
                              <ActivityIndicator size="small" color={colors.brandPrimary} />
                            ) : isSelected ? (
                              <IconSymbol
                                ios_icon_name="checkmark.circle.fill"
                                android_material_icon_name="check_circle"
                                size={20}
                                color={colors.brandPrimary}
                              />
                            ) : null}
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  )}
                </View>
              )}

              {selectedModerators.length > 0 && (
                <View style={styles.moderatorPerks}>
                  <Text style={styles.perksTitle}>Moderator Permissions:</Text>
                  <Text style={styles.perkItem}>- Pin chat messages</Text>
                  <Text style={styles.perkItem}>- Timeout users</Text>
                  <Text style={styles.perkItem}>- Ban users</Text>
                </View>
              )}
            </View>

            {/* Safety Rules */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Safety & Community Rules</Text>
              <View style={styles.rulesBox}>
                <Text style={styles.ruleItem}>- No harassment or hate speech</Text>
                <Text style={styles.ruleItem}>- No revealing private information</Text>
                <Text style={styles.ruleItem}>- Keep roasts entertaining, not harmful</Text>
                <Text style={styles.ruleItem}>- Respect all community members</Text>
                <Text style={styles.ruleItem}>- Follow content label guidelines</Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <GradientButton title="Done" onPress={onClose} size="large" />
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Wrap with ErrorBoundary
export default function LiveSettingsPanel(props: LiveSettingsPanelProps) {
  return (
    <ErrorBoundary>
      <LiveSettingsPanelContent {...props} />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  panel: {
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
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  sectionDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textSecondary,
    marginBottom: 12,
  },
  textArea: {
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: colors.text,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
  },
  settingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.border,
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: colors.brandPrimary,
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(164, 0, 40, 0.1)',
    borderColor: colors.brandPrimary,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 12,
  },
  optionButtonActive: {
    backgroundColor: 'rgba(164, 0, 40, 0.1)',
    borderColor: colors.brandPrimary,
    borderWidth: 2,
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  optionTextActive: {
    color: colors.brandPrimary,
  },
  manageButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  manageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  moderatorList: {
    marginTop: 12,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 12,
    maxHeight: 300,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    paddingVertical: 0,
  },
  userScrollView: {
    maxHeight: 200,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 20,
  },
  followerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
    gap: 10,
  },
  followerItemActive: {
    backgroundColor: 'rgba(164, 0, 40, 0.1)',
  },
  followerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followerInfo: {
    flex: 1,
  },
  followerName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  followerUsername: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  moderatorPerks: {
    marginTop: 12,
    backgroundColor: 'rgba(164, 0, 40, 0.05)',
    borderRadius: 8,
    padding: 12,
  },
  perksTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  perkItem: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 18,
  },
  rulesBox: {
    backgroundColor: 'rgba(164, 0, 40, 0.1)',
    borderColor: colors.brandPrimary,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  ruleItem: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
