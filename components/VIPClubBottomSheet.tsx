
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import GradientButton from '@/components/GradientButton';
import { useAuth } from '@/contexts/AuthContext';
import { useVIPClub } from '@/contexts/VIPClubContext';
import { unifiedVIPClubService, VIPClubMember } from '@/app/services/unifiedVIPClubService';

interface VIPClubBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  selectedClub: string | null;
  onSelectClub: (clubId: string | null) => void;
}

export default function VIPClubBottomSheet({
  visible,
  onClose,
  selectedClub,
  onSelectClub,
}: VIPClubBottomSheetProps) {
  const { user } = useAuth();
  const { club, isLoading, canCreateClub, hoursStreamed, hoursNeeded } = useVIPClub();
  const [showMembers, setShowMembers] = useState(false);
  const [members, setMembers] = useState<VIPClubMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const handleToggleClub = () => {
    if (selectedClub === club?.id) {
      onSelectClub(null);
    } else if (club) {
      onSelectClub(club.id);
    }
  };

  const loadMembers = useCallback(async () => {
    if (!club) return;

    setLoadingMembers(true);
    try {
      const data = await unifiedVIPClubService.getVIPClubMembers(club.id);
      setMembers(data);
      setShowMembers(true);
    } catch (error) {
      console.error('Error loading VIP members:', error);
    } finally {
      setLoadingMembers(false);
    }
  }, [club]);

  const getVIPLevelColor = (level: number): string => {
    if (level >= 15) return '#FF1493';
    if (level >= 10) return '#9B59B6';
    if (level >= 5) return '#3498DB';
    return '#FFD700';
  };

  const getVIPLevelLabel = (level: number): string => {
    if (level >= 15) return 'LEGENDARY';
    if (level >= 10) return 'ELITE';
    if (level >= 5) return 'PREMIUM';
    return 'VIP';
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
            {club ? (
              <>
                {!showMembers ? (
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
                              {club.monthly_price_sek} kr/month
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

                      {/* View Members Button */}
                      <TouchableOpacity
                        style={styles.viewMembersButton}
                        onPress={loadMembers}
                        disabled={loadingMembers}
                      >
                        {loadingMembers ? (
                          <ActivityIndicator size="small" color={colors.brandPrimary} />
                        ) : (
                          <>
                            <IconSymbol
                              ios_icon_name="person.2.fill"
                              android_material_icon_name="people"
                              size={18}
                              color={colors.brandPrimary}
                            />
                            <Text style={styles.viewMembersText}>View Members & Levels</Text>
                            <IconSymbol
                              ios_icon_name="chevron.right"
                              android_material_icon_name="chevron_right"
                              size={18}
                              color={colors.brandPrimary}
                            />
                          </>
                        )}
                      </TouchableOpacity>
                    </View>

                    <View style={styles.infoBox}>
                      <IconSymbol
                        ios_icon_name="info.circle.fill"
                        android_material_icon_name="info"
                        size={16}
                        color={colors.brandPrimary}
                      />
                      <Text style={styles.infoText}>
                        When enabled, only your VIP Club members will be able to watch this stream. 
                        This is perfect for exclusive content and building a loyal community.
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.membersView}>
                    <TouchableOpacity
                      style={styles.backToClubButton}
                      onPress={() => setShowMembers(false)}
                    >
                      <IconSymbol
                        ios_icon_name="chevron.left"
                        android_material_icon_name="arrow_back"
                        size={20}
                        color={colors.brandPrimary}
                      />
                      <Text style={styles.backToClubText}>Back to Club</Text>
                    </TouchableOpacity>

                    <Text style={styles.membersTitle}>VIP Members ({members.length})</Text>

                    {members.length === 0 ? (
                      <View style={styles.emptyMembersState}>
                        <IconSymbol
                          ios_icon_name="person.slash.fill"
                          android_material_icon_name="person_off"
                          size={48}
                          color={colors.textSecondary}
                        />
                        <Text style={styles.emptyMembersText}>No VIP members yet</Text>
                      </View>
                    ) : (
                      <ScrollView style={styles.membersList} showsVerticalScrollIndicator={false}>
                        {members.map((member) => {
                          const levelColor = getVIPLevelColor(member.vip_level);
                          const levelLabel = getVIPLevelLabel(member.vip_level);
                          
                          return (
                            <View key={member.id} style={styles.memberCard}>
                              <View style={[styles.memberAvatar, { backgroundColor: levelColor }]}>
                                <Text style={styles.memberAvatarText}>
                                  {member.profiles?.display_name?.charAt(0).toUpperCase() || 'V'}
                                </Text>
                                <View style={styles.memberLevelBadge}>
                                  <Text style={styles.memberLevelText}>{member.vip_level}</Text>
                                </View>
                              </View>
                              <View style={styles.memberInfo}>
                                <Text style={styles.memberName}>
                                  {member.profiles?.display_name || 'VIP Member'}
                                </Text>
                                <View style={[styles.memberTierBadge, { backgroundColor: levelColor }]}>
                                  <Text style={styles.memberTierText}>{levelLabel}</Text>
                                </View>
                                <Text style={styles.memberGifted}>
                                  {member.total_gifted_sek.toLocaleString()} kr gifted
                                </Text>
                              </View>
                            </View>
                          );
                        })}
                      </ScrollView>
                    )}
                  </View>
                )}
              </>
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
                      Create a VIP Club in your Profile Settings to offer exclusive content 
                      and build a loyal community.
                    </Text>
                    <View style={styles.hintBox}>
                      <Text style={styles.hintText}>
                        💡 Go to Profile → Stream Dashboard → VIP Club to create your club
                      </Text>
                    </View>
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
    marginBottom: 12,
  },
  activeText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  viewMembersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(164, 0, 40, 0.1)',
    borderColor: colors.brandPrimary,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  viewMembersText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.brandPrimary,
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
  membersView: {
    gap: 16,
  },
  backToClubButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  backToClubText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.brandPrimary,
  },
  membersTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  membersList: {
    maxHeight: 400,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  memberAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  memberAvatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  memberLevelBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.card,
  },
  memberLevelText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  memberInfo: {
    flex: 1,
    gap: 4,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  memberTierBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  memberTierText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  memberGifted: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  emptyMembersState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyMembersText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
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
    width: '100%',
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
  hintBox: {
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderColor: 'rgba(74, 144, 226, 0.3)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  hintText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 18,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
