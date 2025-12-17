
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import GradientButton from '@/components/GradientButton';
import { useAuth } from '@/contexts/AuthContext';
import { useVIPClub } from '@/contexts/VIPClubContext';
import { unifiedVIPClubService } from '@/app/services/unifiedVIPClubService';

interface UnifiedVIPClubPanelProps {
  visible: boolean;
  onClose: () => void;
  selectedClub: string | null;
  onSelectClub: (clubId: string | null) => void;
}

const BADGE_COLORS = [
  '#FF1493', // Deep Pink
  '#FFD700', // Gold
  '#FF4500', // Orange Red
  '#9370DB', // Medium Purple
  '#00CED1', // Dark Turquoise
  '#FF69B4', // Hot Pink
  '#32CD32', // Lime Green
  '#FF6347', // Tomato
  '#1E90FF', // Dodger Blue
  '#FF1744', // Red
];

export default function UnifiedVIPClubPanel({
  visible,
  onClose,
  selectedClub,
  onSelectClub,
}: UnifiedVIPClubPanelProps) {
  const { user } = useAuth();
  const { club, isLoading, canCreateClub, hoursStreamed, hoursNeeded, refreshClub } = useVIPClub();
  const [memberCount, setMemberCount] = useState(0);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Create form state
  const [clubName, setClubName] = useState('');
  const [badgeName, setBadgeName] = useState('');
  const [selectedColor, setSelectedColor] = useState(BADGE_COLORS[0]);
  const [description, setDescription] = useState('');

  const loadMemberCount = useCallback(async () => {
    if (!club) return;

    try {
      const members = await unifiedVIPClubService.getVIPClubMembers(club.id);
      setMemberCount(members.length);
    } catch (error) {
      console.error('Error loading member count:', error);
    }
  }, [club]);

  useEffect(() => {
    if (visible && club) {
      loadMemberCount();
      
      // Auto-select if not already selected
      if (!selectedClub) {
        onSelectClub(club.id);
      }
    }
  }, [visible, club, selectedClub, onSelectClub, loadMemberCount]);

  const handleToggleClub = () => {
    if (selectedClub === club?.id) {
      onSelectClub(null);
    } else if (club) {
      onSelectClub(club.id);
    }
  };

  const handleCreateClub = async () => {
    if (!user) return;

    if (!clubName.trim() || !badgeName.trim()) {
      Alert.alert('Error', 'Please enter both club name and badge name');
      return;
    }

    if (clubName.length > 32) {
      Alert.alert('Error', 'Club name must be 32 characters or less');
      return;
    }

    if (badgeName.length > 20) {
      Alert.alert('Error', 'Badge name must be 20 characters or less');
      return;
    }

    setIsCreating(true);
    try {
      const result = await unifiedVIPClubService.createVIPClub(
        user.id,
        clubName,
        badgeName,
        selectedColor,
        description || undefined
      );

      if (result.success) {
        Alert.alert('Success', 'Your VIP Club has been created!');
        setShowCreateForm(false);
        setClubName('');
        setBadgeName('');
        setDescription('');
        await refreshClub();
      } else {
        Alert.alert('Error', result.error || 'Failed to create VIP Club');
      }
    } catch (error) {
      console.error('Error creating VIP club:', error);
      Alert.alert('Error', 'Failed to create VIP Club');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>VIP Club</Text>
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
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.brandPrimary} />
                <Text style={styles.loadingText}>Loading your VIP Club...</Text>
              </View>
            ) : club ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Your VIP Club</Text>
                <Text style={styles.sectionDescription}>
                  Restrict this stream to your VIP Club members only
                </Text>

                <View style={styles.clubCard}>
                  <View style={styles.clubHeader}>
                    <View 
                      style={[
                        styles.clubBadge, 
                        { backgroundColor: club.badge_color }
                      ]}
                    >
                      <IconSymbol
                        ios_icon_name="crown.fill"
                        android_material_icon_name="workspace_premium"
                        size={16}
                        color="#FFFFFF"
                      />
                      <Text style={styles.clubBadgeText}>{club.badge_name}</Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.toggleButton,
                        selectedClub === club.id && styles.toggleButtonActive,
                      ]}
                      onPress={handleToggleClub}
                    >
                      <View
                        style={[
                          styles.toggleThumb,
                          selectedClub === club.id && styles.toggleThumbActive,
                        ]}
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.clubDetails}>
                    <Text style={styles.clubName}>{club.club_name}</Text>
                    {club.description && (
                      <Text style={styles.clubDescription}>{club.description}</Text>
                    )}
                    
                    <View style={styles.clubStats}>
                      <View style={styles.clubStat}>
                        <IconSymbol
                          ios_icon_name="person.2.fill"
                          android_material_icon_name="people"
                          size={16}
                          color={colors.brandPrimary}
                        />
                        <Text style={styles.clubStatText}>{club.total_members} members</Text>
                      </View>
                      <View style={styles.clubStat}>
                        <IconSymbol
                          ios_icon_name="creditcard.fill"
                          android_material_icon_name="payment"
                          size={16}
                          color={colors.brandPrimary}
                        />
                        <Text style={styles.clubStatText}>
                          {club.monthly_price_sek} SEK/month
                        </Text>
                      </View>
                    </View>
                  </View>

                  {selectedClub === club.id && (
                    <View style={styles.activeIndicator}>
                      <IconSymbol
                        ios_icon_name="checkmark.circle.fill"
                        android_material_icon_name="check_circle"
                        size={20}
                        color={colors.brandPrimary}
                      />
                      <Text style={styles.activeText}>
                        Only VIP Club members can watch this stream
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.infoBox}>
                  <IconSymbol
                    ios_icon_name="info.circle.fill"
                    android_material_icon_name="info"
                    size={16}
                    color={colors.brandPrimary}
                  />
                  <Text style={styles.infoText}>
                    This is your unified VIP Club. Members, badges, and levels are synced across 
                    Stream Dashboard, Pre-Live Setup, Live Stream, Chat, and Inbox.
                  </Text>
                </View>
              </View>
            ) : showCreateForm ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Create VIP Club</Text>
                <Text style={styles.sectionDescription}>
                  Set up your exclusive VIP Club (FREE to create)
                </Text>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Club Name</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g., Elite Squad"
                    placeholderTextColor={colors.placeholder}
                    value={clubName}
                    onChangeText={setClubName}
                    maxLength={32}
                    editable={!isCreating}
                  />
                  <Text style={styles.formHint}>{clubName.length}/32 characters</Text>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Badge Name</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g., Rambo"
                    placeholderTextColor={colors.placeholder}
                    value={badgeName}
                    onChangeText={setBadgeName}
                    maxLength={20}
                    editable={!isCreating}
                  />
                  <Text style={styles.formHint}>{badgeName.length}/20 characters</Text>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Badge Color</Text>
                  <View style={styles.colorGrid}>
                    {BADGE_COLORS.map((color, index) => (
                      <TouchableOpacity
                        key={`color-${index}`}
                        style={[
                          styles.colorOption,
                          { backgroundColor: color },
                          selectedColor === color && styles.colorOptionSelected,
                        ]}
                        onPress={() => setSelectedColor(color)}
                        disabled={isCreating}
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

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Description (Optional)</Text>
                  <TextInput
                    style={[styles.formInput, styles.textArea]}
                    placeholder="Describe your VIP Club..."
                    placeholderTextColor={colors.placeholder}
                    value={description}
                    onChangeText={setDescription}
                    maxLength={200}
                    multiline
                    numberOfLines={3}
                    editable={!isCreating}
                  />
                </View>

                {/* Badge Preview */}
                {badgeName && (
                  <View style={styles.previewSection}>
                    <Text style={styles.previewLabel}>Badge Preview:</Text>
                    <View style={[styles.badgePreview, { backgroundColor: selectedColor }]}>
                      <Text style={styles.badgePreviewText}>{badgeName.toUpperCase()}²⁰</Text>
                    </View>
                    <Text style={styles.previewHint}>
                      Badge will show member&apos;s level (1-20) as superscript
                    </Text>
                  </View>
                )}

                <View style={styles.formActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowCreateForm(false)}
                    disabled={isCreating}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <View style={styles.createButtonContainer}>
                    <GradientButton
                      title={isCreating ? 'Creating...' : 'Create VIP Club'}
                      onPress={handleCreateClub}
                      size="medium"
                      disabled={isCreating || !clubName.trim() || !badgeName.trim()}
                    />
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <IconSymbol
                  ios_icon_name="crown.fill"
                  android_material_icon_name="workspace_premium"
                  size={64}
                  color={colors.textSecondary}
                />
                <Text style={styles.emptyTitle}>No VIP Club</Text>
                
                {!canCreateClub ? (
                  <>
                    <View style={styles.lockContainer}>
                      <IconSymbol
                        ios_icon_name="lock.fill"
                        android_material_icon_name="lock"
                        size={32}
                        color={colors.brandPrimary}
                      />
                      <Text style={styles.lockTitle}>VIP Club Locked</Text>
                      <Text style={styles.lockDescription}>
                        You need at least 10 hours of live streaming to unlock VIP Club
                      </Text>
                      <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                          <View
                            style={[
                              styles.progressFill,
                              { width: `${Math.min(100, (hoursStreamed / hoursNeeded) * 100)}%` },
                            ]}
                          />
                        </View>
                        <Text style={styles.progressText}>
                          {hoursStreamed.toFixed(1)} / {hoursNeeded} hours
                        </Text>
                      </View>
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={styles.emptyDescription}>
                      Create a VIP Club to offer exclusive content and build a loyal community.
                    </Text>
                    <TouchableOpacity
                      style={styles.createButton}
                      onPress={() => setShowCreateForm(true)}
                    >
                      <IconSymbol
                        ios_icon_name="plus.circle.fill"
                        android_material_icon_name="add_circle"
                        size={20}
                        color={colors.brandPrimary}
                      />
                      <Text style={styles.createButtonText}>Create VIP Club (FREE)</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <GradientButton title="Done" onPress={onClose} size="large" />
          </View>
        </View>
      </View>
    </Modal>
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
  section: {
    marginBottom: 20,
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
    marginBottom: 16,
  },
  clubCard: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  clubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clubBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  clubBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  toggleButton: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.border,
    padding: 2,
    justifyContent: 'center',
  },
  toggleButtonActive: {
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
  clubDetails: {
    marginBottom: 12,
  },
  clubName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  clubDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    marginBottom: 12,
  },
  clubStats: {
    flexDirection: 'row',
    gap: 16,
  },
  clubStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clubStatText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(164, 0, 40, 0.1)',
    borderColor: colors.brandPrimary,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    gap: 8,
  },
  activeText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(164, 0, 40, 0.1)',
    borderColor: colors.brandPrimary,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  emptyDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  lockContainer: {
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 24,
    marginTop: 16,
    gap: 12,
  },
  lockTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  lockDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  progressContainer: {
    width: '100%',
    marginTop: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.brandPrimary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 8,
    gap: 8,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: colors.text,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  formHint: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
    marginTop: 4,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: colors.text,
    borderWidth: 3,
  },
  previewSection: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  badgePreview: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  badgePreviewText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  previewHint: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  createButtonContainer: {
    flex: 1,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
