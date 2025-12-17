
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { fanClubService, FanClub, FanClubMember } from '@/app/services/fanClubService';
import { moderationService } from '@/app/services/moderationService';
import BadgeEditorModal from '@/components/BadgeEditorModal';

const BADGE_COLORS = [
  '#FF1493', // Deep Pink
  '#FFD700', // Gold
  '#FF4500', // Orange Red
  '#9370DB', // Medium Purple
  '#00CED1', // Dark Turquoise
  '#FF69B4', // Hot Pink
  '#32CD32', // Lime Green
  '#FF6347', // Tomato
];

export default function FanClubManagementScreen() {
  const { user } = useAuth();
  const [fanClub, setFanClub] = useState<FanClub | null>(null);
  const [members, setMembers] = useState<FanClubMember[]>([]);
  const [streamingHours, setStreamingHours] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [clubName, setClubName] = useState('');
  const [selectedColor, setSelectedColor] = useState(BADGE_COLORS[0]);
  const [isCreating, setIsCreating] = useState(false);
  const [showBadgeEditor, setShowBadgeEditor] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const [club, hours] = await Promise.all([
        fanClubService.getFanClub(user.id),
        fanClubService.getStreamingHours(user.id),
      ]);

      setFanClub(club);
      setStreamingHours(hours);

      if (club) {
        setClubName(club.club_name);
        setSelectedColor(club.badge_color);
        const clubMembers = await fanClubService.getFanClubMembers(club.id);
        setMembers(clubMembers);
      }
    } catch (error) {
      console.error('Error fetching fan club data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleCreateFanClub = async () => {
    if (!user) return;

    if (!clubName.trim()) {
      Alert.alert('Error', 'Please enter a club name');
      return;
    }

    if (clubName.length > 5) {
      Alert.alert('Error', 'Club name must be 5 characters or less');
      return;
    }

    setIsCreating(true);
    const result = await fanClubService.createFanClub(user.id, clubName.trim(), selectedColor);
    setIsCreating(false);

    if (result.success) {
      Alert.alert('Success', 'Fan club created successfully!');
      fetchData();
    } else {
      Alert.alert('Error', result.error || 'Failed to create fan club');
    }
  };

  const handleUpdateFanClub = async () => {
    if (!user || !fanClub) return;

    if (!clubName.trim()) {
      Alert.alert('Error', 'Please enter a club name');
      return;
    }

    if (clubName.length > 5) {
      Alert.alert('Error', 'Club name must be 5 characters or less');
      return;
    }

    const result = await fanClubService.updateFanClub(user.id, clubName.trim(), selectedColor);

    if (result.success) {
      Alert.alert('Success', 'Fan club updated successfully!');
      fetchData();
    } else {
      Alert.alert('Error', result.error || 'Failed to update fan club');
    }
  };

  const handleRemoveMember = async (userId: string, username: string) => {
    if (!user) return;

    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${username} from your fan club?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const result = await fanClubService.removeMember(user.id, userId);
            if (result.success) {
              Alert.alert('Success', `${username} has been removed from your fan club.`);
              fetchData();
            } else {
              Alert.alert('Error', result.error || 'Failed to remove member.');
            }
          },
        },
      ]
    );
  };

  const handleAddModerator = async (userId: string, username: string) => {
    if (!user) return;

    Alert.alert(
      'Add Moderator',
      `Do you want to make ${username} a moderator?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: async () => {
            const result = await moderationService.addModerator(user.id, userId);
            if (result.success) {
              Alert.alert('Success', `${username} is now a moderator.`);
            } else {
              Alert.alert('Error', result.error || 'Failed to add moderator.');
            }
          },
        },
      ]
    );
  };

  const canCreateFanClub = streamingHours >= 10;

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
          <Text style={styles.headerTitle}>Fan Club</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.gradientEnd} />
          <Text style={styles.loadingText}>Loading fan club...</Text>
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
        <Text style={styles.headerTitle}>Fan Club</Text>
        <View style={styles.placeholder} />
      </View>

      {/* VIP Banner */}
      {fanClub && (
        <View style={styles.vipBanner}>
          <IconSymbol
            ios_icon_name="star.fill"
            android_material_icon_name="star"
            size={24}
            color="#FFD700"
          />
          <Text style={styles.vipBannerText}>VIP FAN CLUB</Text>
          <IconSymbol
            ios_icon_name="star.fill"
            android_material_icon_name="star"
            size={24}
            color="#FFD700"
          />
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Streaming Hours Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <IconSymbol
              ios_icon_name="clock.fill"
              android_material_icon_name="schedule"
              size={24}
              color={colors.gradientEnd}
            />
            <Text style={styles.infoTitle}>Streaming Hours</Text>
          </View>
          <Text style={styles.hoursText}>{streamingHours.toFixed(1)} hours</Text>
          {!canCreateFanClub && (
            <Text style={styles.requirementText}>
              You need {(10 - streamingHours).toFixed(1)} more hours to create a fan club
            </Text>
          )}
        </View>

        {!fanClub ? (
          // Create Fan Club Section
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Create Your Fan Club</Text>
            <Text style={styles.sectionSubtitle}>
              Create a VIP fan club for $3/month. You earn 70% of each subscription.
            </Text>

            {!canCreateFanClub ? (
              <View style={styles.lockedContainer}>
                <IconSymbol
                  ios_icon_name="lock.fill"
                  android_material_icon_name="lock"
                  size={48}
                  color={colors.textSecondary}
                />
                <Text style={styles.lockedText}>
                  Stream for 10+ hours to unlock fan club creation
                </Text>
              </View>
            ) : (
              <>
                {/* Badge Preview */}
                <View style={styles.badgePreviewContainer}>
                  <Text style={styles.badgePreviewLabel}>Badge Preview</Text>
                  <View style={[styles.badgePreview, { backgroundColor: selectedColor }]}>
                    <IconSymbol
                      ios_icon_name="heart.fill"
                      android_material_icon_name="favorite"
                      size={16}
                      color={colors.text}
                    />
                    <Text style={styles.badgePreviewText}>{clubName || 'VIP'}</Text>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Club Name (max 5 characters)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="VIP"
                    placeholderTextColor={colors.placeholder}
                    value={clubName}
                    onChangeText={setClubName}
                    maxLength={5}
                    autoCapitalize="characters"
                  />
                  <Text style={styles.charCount}>{clubName.length}/5</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Badge Color</Text>
                  <View style={styles.colorGrid}>
                    {BADGE_COLORS.map((color) => (
                      <TouchableOpacity
                        key={color}
                        style={[
                          styles.colorOption,
                          { backgroundColor: color },
                          selectedColor === color && styles.colorOptionSelected,
                        ]}
                        onPress={() => setSelectedColor(color)}
                      >
                        {selectedColor === color && (
                          <IconSymbol
                            ios_icon_name="checkmark"
                            android_material_icon_name="check"
                            size={20}
                            color="#FFFFFF"
                          />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.createButton, isCreating && styles.createButtonDisabled]}
                  onPress={handleCreateFanClub}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <ActivityIndicator size="small" color={colors.text} />
                  ) : (
                    <>
                      <Text style={styles.createButtonText}>Create Fan Club</Text>
                      <Text style={styles.createButtonSubtext}>Fixed price: $3/month</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        ) : (
          // Manage Fan Club Section
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Manage Fan Club</Text>
                <TouchableOpacity
                  style={styles.editBadgeButton}
                  onPress={() => setShowBadgeEditor(true)}
                >
                  <IconSymbol
                    ios_icon_name="pencil"
                    android_material_icon_name="edit"
                    size={16}
                    color={colors.text}
                  />
                  <Text style={styles.editBadgeButtonText}>Edit Badge</Text>
                </TouchableOpacity>
              </View>

              {/* Badge Preview */}
              <View style={styles.badgePreviewContainer}>
                <Text style={styles.badgePreviewLabel}>Current Badge</Text>
                <View style={[styles.badgePreview, { backgroundColor: selectedColor }]}>
                  <IconSymbol
                    ios_icon_name="heart.fill"
                    android_material_icon_name="favorite"
                    size={16}
                    color={colors.text}
                  />
                  <Text style={styles.badgePreviewText}>{clubName}</Text>
                </View>
              </View>

              <View style={styles.priceInfo}>
                <IconSymbol
                  ios_icon_name="dollarsign.circle.fill"
                  android_material_icon_name="attach_money"
                  size={20}
                  color={colors.gradientEnd}
                />
                <Text style={styles.priceInfoText}>
                  Subscription: $3/month • You earn: $2.10/member
                </Text>
              </View>
            </View>

            {/* Members Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  <IconSymbol
                    ios_icon_name="person.3.fill"
                    android_material_icon_name="group"
                    size={20}
                    color={colors.text}
                  />
                  {' '}Members ({members.length})
                </Text>
                <TouchableOpacity style={styles.viewMembersButton}>
                  <Text style={styles.viewMembersButtonText}>View All</Text>
                </TouchableOpacity>
              </View>

              {members.length === 0 ? (
                <View style={styles.emptyState}>
                  <IconSymbol
                    ios_icon_name="person.2.slash"
                    android_material_icon_name="people_outline"
                    size={48}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.emptyText}>No members yet</Text>
                  <Text style={styles.emptySubtext}>
                    Members will appear here when they subscribe
                  </Text>
                </View>
              ) : (
                <View style={styles.list}>
                  {members.map((member) => (
                    <View key={member.id} style={styles.memberItem}>
                      {member.profiles?.avatar_url ? (
                        <Image
                          source={{ uri: member.profiles.avatar_url }}
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
                      <View style={styles.memberInfo}>
                        <View style={styles.memberHeader}>
                          <Text style={styles.memberName}>
                            {member.profiles?.display_name}
                          </Text>
                          <View
                            style={[styles.badge, { backgroundColor: selectedColor }]}
                          >
                            <Text style={styles.badgeText}>{clubName}</Text>
                          </View>
                        </View>
                        <Text style={styles.memberUsername}>
                          @{member.profiles?.username}
                        </Text>
                      </View>
                      <View style={styles.memberActions}>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() =>
                            handleAddModerator(
                              member.user_id,
                              member.profiles?.username || 'User'
                            )
                          }
                        >
                          <IconSymbol
                            ios_icon_name="shield.fill"
                            android_material_icon_name="shield"
                            size={20}
                            color={colors.gradientEnd}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() =>
                            handleRemoveMember(
                              member.user_id,
                              member.profiles?.username || 'User'
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
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Badge Editor Modal */}
      {fanClub && user && (
        <BadgeEditorModal
          visible={showBadgeEditor}
          onClose={() => setShowBadgeEditor(false)}
          userId={user.id}
          currentBadgeName={clubName}
          currentBadgeColor={selectedColor}
          onUpdate={fetchData}
        />
      )}
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
  vipBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderBottomWidth: 2,
    borderBottomColor: '#FFD700',
    paddingVertical: 12,
  },
  vipBannerText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFD700',
    letterSpacing: 2,
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
  infoCard: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  hoursText: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.gradientEnd,
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    marginBottom: 20,
  },
  editBadgeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.gradientEnd,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editBadgeButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  badgePreviewContainer: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 16,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
  },
  badgePreviewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
  },
  badgePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgePreviewText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  priceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(227, 0, 82, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  priceInfoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  lockedContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  lockedText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: colors.text,
    fontSize: 16,
  },
  charCount: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'right',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: colors.text,
  },
  createButton: {
    backgroundColor: colors.gradientEnd,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  createButtonSubtext: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  viewMembersButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  viewMembersButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
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
  memberItem: {
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
  memberInfo: {
    flex: 1,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.text,
  },
  memberUsername: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  memberActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 8,
  },
});