
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import GradientButton from '@/components/GradientButton';
import { useAuth } from '@/contexts/AuthContext';
import { unifiedVIPClubService, VIPClub, VIPClubMember } from '@/app/services/unifiedVIPClubService';
import VIPClubMembersModal from '@/components/VIPClubMembersModal';

interface VIPClubPanelProps {
  visible: boolean;
  onClose: () => void;
  selectedClub: string | null;
  onSelectClub: (clubId: string | null) => void;
}

export default function VIPClubPanel({
  visible,
  onClose,
  selectedClub,
  onSelectClub,
}: VIPClubPanelProps) {
  const { user } = useAuth();
  const [myClub, setMyClub] = useState<VIPClub | null>(null);
  const [members, setMembers] = useState<VIPClubMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);

  useEffect(() => {
    if (visible && user) {
      loadMyClub();
    }
  }, [visible, user]);

  const loadMyClub = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      console.log('📥 [VIPClubPanel] Loading VIP club for user:', user.id);

      const club = await unifiedVIPClubService.getVIPClubByCreator(user.id);
      
      if (club) {
        setMyClub(club);
        
        // Load members with levels
        const clubMembers = await unifiedVIPClubService.getVIPClubMembers(club.id);
        setMembers(clubMembers);

        // Auto-select if not already selected
        if (!selectedClub) {
          onSelectClub(club.id);
        }

        console.log('✅ [VIPClubPanel] Loaded club:', club.club_name, 'with', clubMembers.length, 'members');
      } else {
        setMyClub(null);
        setMembers([]);
        console.log('ℹ️ [VIPClubPanel] No VIP club found for this creator');
      }
    } catch (error) {
      console.error('❌ [VIPClubPanel] Error loading club:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClub = () => {
    Alert.alert(
      'Create VIP Club',
      'You need to create a VIP Club first in your Stream Dashboard.',
      [
        { text: 'OK' }
      ]
    );
  };

  const getVIPLevelColor = (level: number): string => {
    if (level >= 15) return '#FF1493'; // Hot Pink for top tier
    if (level >= 10) return '#9B59B6'; // Purple
    if (level >= 5) return '#3498DB'; // Blue
    return '#FFD700'; // Gold for entry level
  };

  const getVIPLevelLabel = (level: number): string => {
    if (level >= 15) return 'LEGENDARY';
    if (level >= 10) return 'ELITE';
    if (level >= 5) return 'PREMIUM';
    return 'VIP';
  };

  return (
    <>
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
              ) : myClub ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Your VIP Club</Text>
                  <Text style={styles.sectionDescription}>
                    VIP Club settings are managed in Settings. This panel displays your club information.
                  </Text>

                  <View style={styles.clubCard}>
                    <View style={styles.clubHeader}>
                      <View 
                        style={[
                          styles.clubBadge, 
                          { backgroundColor: myClub.badge_color || colors.brandPrimary }
                        ]}
                      >
                        <IconSymbol
                          ios_icon_name="star.fill"
                          android_material_icon_name="workspace_premium"
                          size={20}
                          color="#FFFFFF"
                        />
                        <Text style={styles.clubBadgeText}>{myClub.badge_name}</Text>
                      </View>
                    </View>

                    <View style={styles.clubDetails}>
                      <Text style={styles.clubName}>{myClub.club_name}</Text>
                      {myClub.description && (
                        <Text style={styles.clubDescription}>{myClub.description}</Text>
                      )}
                      
                      <View style={styles.clubStats}>
                        <View style={styles.clubStat}>
                          <IconSymbol
                            ios_icon_name="person.2.fill"
                            android_material_icon_name="people"
                            size={16}
                            color={colors.brandPrimary}
                          />
                          <Text style={styles.clubStatText}>{myClub.total_members} members</Text>
                        </View>
                        <View style={styles.clubStat}>
                          <IconSymbol
                            ios_icon_name="creditcard.fill"
                            android_material_icon_name="payment"
                            size={16}
                            color={colors.brandPrimary}
                          />
                          <Text style={styles.clubStatText}>
                            {myClub.monthly_price_sek} SEK/month
                          </Text>
                        </View>
                      </View>
                    </View>

                    {selectedClub === myClub.id && (
                      <View style={styles.activeIndicator}>
                        <IconSymbol
                          ios_icon_name="checkmark.circle.fill"
                          android_material_icon_name="check_circle"
                          size={20}
                          color={colors.brandPrimary}
                        />
                        <Text style={styles.activeText}>
                          VIP Club is active for this stream
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Members Section - Clickable */}
                  {members.length > 0 && (
                    <TouchableOpacity 
                      style={styles.membersSection}
                      onPress={() => setShowMembersModal(true)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.membersSectionHeader}>
                        <View style={styles.membersSectionTitleContainer}>
                          <IconSymbol
                            ios_icon_name="person.2.fill"
                            android_material_icon_name="people"
                            size={20}
                            color={colors.brandPrimary}
                          />
                          <Text style={styles.membersSectionTitle}>
                            Members ({members.length})
                          </Text>
                        </View>
                        <IconSymbol
                          ios_icon_name="chevron.right"
                          android_material_icon_name="chevron_right"
                          size={20}
                          color={colors.textSecondary}
                        />
                      </View>
                      
                      {/* Preview of top 3 members */}
                      <View style={styles.membersPreview}>
                        {members.slice(0, 3).map((member) => (
                          <View key={member.id} style={styles.memberPreviewCard}>
                            <View 
                              style={[
                                styles.memberAvatar, 
                                { backgroundColor: getVIPLevelColor(member.vip_level) }
                              ]}
                            >
                              <Text style={styles.memberAvatarText}>
                                {member.profiles?.display_name?.charAt(0).toUpperCase() || 'V'}
                              </Text>
                            </View>
                            <View style={styles.memberPreviewDetails}>
                              <Text style={styles.memberPreviewName} numberOfLines={1}>
                                {member.profiles?.display_name || 'VIP Member'}
                              </Text>
                              <View 
                                style={[
                                  styles.memberPreviewLevelBadge, 
                                  { backgroundColor: getVIPLevelColor(member.vip_level) }
                                ]}
                              >
                                <IconSymbol
                                  ios_icon_name="star.fill"
                                  android_material_icon_name="workspace_premium"
                                  size={10}
                                  color="#FFFFFF"
                                />
                                <Text style={styles.memberPreviewLevelText}>
                                  Lvl {member.vip_level}
                                </Text>
                              </View>
                            </View>
                          </View>
                        ))}
                      </View>
                      
                      {members.length > 3 && (
                        <Text style={styles.viewAllText}>
                          Tap to view all {members.length} members
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}

                  <View style={styles.infoBox}>
                    <IconSymbol
                      ios_icon_name="info.circle.fill"
                      android_material_icon_name="info"
                      size={16}
                      color={colors.brandPrimary}
                    />
                    <Text style={styles.infoText}>
                      VIP Club enable/disable is managed in Settings. Members earn levels (1-20) based on their support and engagement. Tap &quot;Members&quot; to see the full list.
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <IconSymbol
                    ios_icon_name="star.slash.fill"
                    android_material_icon_name="workspace_premium"
                    size={64}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.emptyTitle}>No VIP Club</Text>
                  <Text style={styles.emptyDescription}>
                    You haven&apos;t created a VIP Club yet. Create one in your Stream Dashboard to 
                    offer exclusive content to your subscribers.
                  </Text>
                  <TouchableOpacity style={styles.createButton} onPress={handleCreateClub}>
                    <Text style={styles.createButtonText}>Go to Stream Dashboard</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>

            <View style={styles.footer}>
              <GradientButton title="Done" onPress={onClose} size="large" />
            </View>
          </View>
        </View>
      </Modal>

      {/* VIP Club Members Modal */}
      {myClub && (
        <VIPClubMembersModal
          visible={showMembersModal}
          onClose={() => setShowMembersModal(false)}
          club={myClub}
          members={members}
        />
      )}
    </>
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
    maxHeight: '85%',
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
  membersSection: {
    marginTop: 20,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  membersSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  membersSectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  membersSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  membersPreview: {
    gap: 10,
  },
  memberPreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  memberPreviewDetails: {
    flex: 1,
    gap: 4,
  },
  memberPreviewName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  memberPreviewLevelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
    alignSelf: 'flex-start',
  },
  memberPreviewLevelText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.brandPrimary,
    textAlign: 'center',
    marginTop: 12,
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
  createButton: {
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
